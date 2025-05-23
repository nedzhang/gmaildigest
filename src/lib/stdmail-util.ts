"use server";

// Standard Email Utilities
// The utility help to standardize email data for easier processing

import {
    GmailMessage,
    GmailThread,
    PayloadPart,
    StandardEmail,
    StandardEmailThread,
} from "@/types/gmail";
import {
    getEmailAbstract,
    getThreadAbstract,
    setEmailAbstract,
    setThreadAbstract,
} from "./gduser-util";
import { areStringListsEqual } from "./object-util";
import { getAttachment } from "./gmail-util";
import { summarizeAttachment } from "@/ai/flows/summarize-attachment";
import { summarizeEmail } from "@/ai/flows/summarize-email";
import { summarizeEmailThread } from "@/ai/flows/summarize-email-thread";

import logger from "@/lib/logger";


/**
 * Recursively processes MIME parts to extract content and attachments
 * @param {string} userId - Authenticated user ID
 * @param {string} messageId - Gmail message ID
 * @param {PayloadPart} part - MIME part to process
 * @returns {Promise<Array<{ filename: string, mimetype: string, data: string, attachmentId: string }>>} Processed content array
 */
async function collectPartsInAMessage(
    userId: string,
    messageId: string,
    part: PayloadPart,
    downloadAttachment: boolean = false,
): Promise<
    Array<
        {
            filename: string;
            mimetype: string;
            data: string;
            attachmentId: string;
        }
    >
> {
    // Handle nested multipart content
    if (part.mimeType.startsWith("multipart/")) {
        const subParts = await Promise.all(
            (part.parts || []).map((p) =>
                collectPartsInAMessage(userId, messageId, p)
            ),
        );
        return subParts.flat();
    }

    // Initialize data with base content
    let data = part.body?.data || "";

    // Handle file attachments
    if (downloadAttachment && part.filename && part.body?.attachmentId) {
        const attachment = await getAttachment(
            userId,
            messageId,
            part.body.attachmentId,
        );

        if (attachment) {
            data = attachment.data;
            logger.info(
                `**collectPartsInAMessage** Downloaded attachment: ${part.filename}, Size: ${attachment.size} bytes`,
            );
        }
    }

    return [{
        filename: part.filename || "",
        attachmentId: part.body?.attachmentId || "",
        mimetype: part.mimeType,
        data: data,
    }];
}

export async function parseGmailMessage(
    userId: string,
    message: GmailMessage,
    downloadAttachments: boolean = false,
    dbThreadKey: string = "",
): Promise<StandardEmail> {
    const headerMap = message.payload?.headers.reduce(
        (acc: Record<string, string>, header) => {
            acc[header.name.toLowerCase()] = header.value;
            return acc;
        },
        {},
    );

    const stdEmail: StandardEmail = {
        // dbThreadKey: dbThreadKey,
        messageId: message.id,
        from: headerMap?.from || "",
        to: headerMap?.to || "",
        subject: headerMap?.subject,
        receivedAt: headerMap?.date,
        snippet: message.snippet,
        // attachments: [],
        // summary: '',
    };

    if (dbThreadKey) stdEmail.dbThreadKey = dbThreadKey;

    // flatten the parts of the message. Email usually have multipart part which has parts in them (like text/plain and text/html parts)

    const parts = (await Promise.all(
        (message.payload?.parts || []).map((part) =>
            collectPartsInAMessage(
                userId,
                message.id,
                part,
                downloadAttachments,
            )
        ),
    )).flat();

    // now we check the parts to get body of the email (text/plain or text/html). We also get the attachments.

    for (const part of parts || []) {
        if (part.filename && part.attachmentId) {
            // we have an attachment
            stdEmail.attachments = stdEmail.attachments || [];
            stdEmail.attachments?.push(part);
        } else if (
            part.mimetype === "text/plain" && part.data && !stdEmail.body
        ) {
            // only take from text/plain if we don't have text/html
            // Need to decode the base64 encoded body
            stdEmail.body = decodeBase64(part.data);
        } else if (part.mimetype === "text/html" && part.data) {
            // Need to decode the base64 encoded body
            stdEmail.body = decodeBase64(part.data);
        } else {
            logger.warn(`**parseGmailMessage** unknown part is ignored: ${part}`);
        }
    }

    logger.debug(`**parseGmailMessage** stdEmail: ${stdEmail}`);

    return stdEmail;
}

function decodeBase64(base64Encoded: string): string {
    return Buffer.from(base64Encoded, "base64").toString("utf-8");
}

/**
 * Enrich a gmail message with summarization
 *   - from DB if already summarized before
 *   - from AI if it hasn't bee summarized
 */
async function hydrateEmail(
    userId: string,
    message: GmailMessage,
): Promise<StandardEmail> {
    // check if we have a summary in the DB
    const emailAbs = await getEmailAbstract(userId, message.id);

    // if we have a summary, return it right away
    if (emailAbs && emailAbs.summary) {
        logger.info(
            `**hydrateEmail** loaded from db for email id: ${emailAbs.messageId} dbThreadKey: ${emailAbs.dbThreadKey}`,
        );
        return emailAbs;
    }

    logger.info(
        `**hydrateEmail** invoke AI to summarize message id: ${message.id}`,
    );

    const stdEmail = await parseGmailMessage(userId, message, true);

    const neoEmailAbs = await generateEmailSummary(stdEmail);

    logger.info(
        `**hydrateEmail** AI summarized ${message.id} to ${neoEmailAbs.summary}`,
    );

    await setEmailAbstract(userId, message.id, neoEmailAbs);

    logger.info(
        `**hydrateEmail** saved to db for email id: ${neoEmailAbs.messageId} dbThreadKey: ${neoEmailAbs.dbThreadKey}`,
    );

    return neoEmailAbs;
}

async function generateEmailSummary(
    email: StandardEmail,
): Promise<StandardEmail> {
    // check if all attachments have summary
    for (const attachment of email.attachments || []) {
        if (!attachment.summary) {
            const attachmentSummary = await summarizeAttachment(attachment);
            attachment.summary = attachmentSummary.summary;
        }
    }

    // Now attachments are all summarized, we can summarize the email
    const emailSummary = await summarizeEmail(email);

    logger.info("**generateEmailSummary** emailSummary: ", emailSummary);

    email.summary = emailSummary.summary;

    return email;
}

export async function hydrateThread(
    userId: string,
    thread: GmailThread,
): Promise<StandardEmailThread> {
    var threadKey: string | undefined = undefined;

    // Get all ids of the messages in the thread. We need the ordering in thread.
    const messageIds = thread.messages.map((message) => message.id);

    // Go through all messages in the thread and get abstracts either from the database or from the AI.
    const messageAbsMap: Record<string, StandardEmail> = {};

    for (const message of thread.messages) {
    
        const messageAbs = await hydrateEmail(userId, message);
        messageAbsMap[messageAbs.messageId!] = messageAbs;
        // get the thread key from the message abstract if it is there
        if (messageAbs.dbThreadKey) {
            if (threadKey && threadKey !== messageAbs.dbThreadKey) {
                logger.warn(
                    `**hydrateThread** threadKey mismatch. some emails has ${threadKey} and we have ${messageAbs.dbThreadKey} now. Will use  ${messageAbs.dbThreadKey} becuase it should be from an older email`,
                );
            }
            threadKey = messageAbs.dbThreadKey;
        }
    }

    var threadAbs: StandardEmailThread | undefined = undefined;

    if (threadKey) {
        // We have a thread key, so we can try to get the thread summary from the database.
        threadAbs = await getThreadAbstract(userId, threadKey);
    }

    // If threadAbs is undefined or threadAbs.summary is undefined, or threadAbs.messageIds is not the same as messageIds, we need to get a new summary from the AI.
    if (
        !threadAbs || !threadAbs.summary ||
        !areStringListsEqual(threadAbs.messageIds, messageIds)
    ) {
        if (messageIds.length === 1) {
            // if there is only one message, we can use the message summary as the thread summary.
            threadKey = messageIds[0];

            threadAbs = {
                dbThreadKey: messageIds[0],
                summary: messageAbsMap[messageIds[0]].summary,
                messageIds: [messageIds[0]],
                snippet: thread.snippet,
                messages: [messageAbsMap[messageIds[0]]],
            };
            // // update the messageAbsMap to have the correct dbThreadKey.
            // messageAbsMap[messageIds[0]].dbThreadKey = messageIds[0]
        } else {
            // We need to get a new summary from the AI.
            threadAbs = {
                dbThreadKey: messageIds[messageIds.length - 1], // use the earliest message id as the thread key.
                messageIds: messageIds,
                snippet: thread.snippet,
                messages: messageIds.map((id) => messageAbsMap[id]),
            };

            const summary = await summarizeEmailThread(threadAbs);
            threadAbs.summary = summary.summary;

            // save the new thread summary to the database.
            await setThreadAbstract(userId, threadAbs.dbThreadKey!, threadAbs);
        }
    }

    // go through the messages to see if any of them have updated threadKey that needs to be save to db
    await Promise.all(messageIds.map(async (id) => {
        const mabs = messageAbsMap[id];
        if (mabs.dbThreadKey !== threadKey) {
            mabs.dbThreadKey = threadKey;
            await setEmailAbstract(userId, id, mabs);
        }
    }));

    if (threadAbs && threadAbs.summary) {
        threadAbs.messages = messageIds.map((id) => messageAbsMap[id]);

        return threadAbs;
    } else {
        throw new Error(
            "**hybridThreadSummary** Failed to get or generate thread summary",
        );
    }
}

/**
 * Create a thread key by using the message id from the last message in the list.
 * @param messageIds list of message ids in the thread
 * @returns
 */
function createThreadKey(messageIds: string[]) {
    // return the last messageId from the list as the thread id
    return messageIds[messageIds.length - 1];
}
