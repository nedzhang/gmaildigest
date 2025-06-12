"use server";

import {
    GmailMessage,
    GmailThread,
    PayloadPart,
    StandardEmail,
    StandardEmailThread,
} from "@/types/gmail";
import { areStringListsEqual } from "./object-util";
import { getAttachment } from "./gmail-util";
import { summarizeEmailFlow } from "@/ai/flows/summarize-message";
import { summarizeEmailThread } from "@/ai/flows/summarize-thread";
import { decodeBase64 } from "./string-util";
import logger, { createLogger, LogContext, LogEvent } from "@/lib/logger";
import { threadId } from "worker_threads";
import { extractText } from "./extract-text-util";
import { summarizeText } from "@/ai/flows/summarize-text";
import { getEmailAbstract, setEmailAbstract } from "./firestore/email-abs-store";
import { getThreadAbstract, setThreadAbstract } from "./firestore/thread-abs-store";

/**
 * Recursively processes MIME parts to extract content and attachments
 * @param {LogContext} logContext - Logging context for request tracing
 * @param {string} userId - Authenticated user identifier
 * @param {string} messageId - Gmail message ID being processed
 * @param {PayloadPart} part - MIME part to analyze
 * @param {boolean} [downloadAttachment=false] - Whether to fetch attachment binaries
 * @returns {Promise<Array<{filename: string, mimetype: string, data: string, attachmentId: string}>>}
 *          Processed parts with metadata and content
 * @throws {Error} If attachment download fails
 */
async function collectPartsInAMessage(
    logContext: LogContext,
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
    const functionLogger = createLogger(logContext, {
        module: "stdmail-util",
        function: "collectPartsInAMessage",
        additional: { userId, messageId, downloadAttachment }
    })
    // Handle multipart containers (common in emails with attachments)
    if (part.mimeType.startsWith("multipart/")) {
        const subParts = await Promise.all(
            (part.parts || []).map((p) =>
                collectPartsInAMessage(
                    logContext,
                    userId,
                    messageId,
                    p,
                    downloadAttachment,
                )
            ),
        );
        return subParts.flat();
    }

    let data = part.body?.data || "";

    // Only download attachments when explicitly requested (performance optimization)
    if (downloadAttachment && part.filename && part.body?.attachmentId) {
        const attachment = await getAttachment(
            logContext,
            userId,
            messageId,
            part.body.attachmentId,
        );
        if (attachment) {
            data = attachment.data;
            functionLogger.info(
                {
                    userId,
                    messageId,
                    fileName: part.filename,
                    attachmentId: part.body.attachmentId,
                    size: attachment.size,
                },
                "Attachment downloaded successfully",
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

/**
 * Converts raw Gmail API response to standardized email format
 * @param {LogContext} logContext - Logging context for request tracing
 * @param {string} userId - Authenticated user identifier
 * @param {GmailMessage} message - Raw Gmail message object
 * @param {boolean} [downloadAttachments=false] - Whether to fetch attachment content
 * @param {string} [dbThreadKey=""] - Database thread key for relationship mapping
 * @returns {Promise<StandardEmail>} Normalized email object with structured data
 * @throws {Error} If message parsing fails
 */
export async function parseGmailMessage(
    logContext: LogContext,
    userId: string,
    message: GmailMessage,
    downloadAttachments: boolean = false,
    dbThreadKey: string = "",
): Promise<StandardEmail> {
    const functionLogger = createLogger(logContext,
        {
            module: "stdmail-util",
            function: "parseGmailMessage",
            additional: { userId, dbThreadKey }
        }
    )
    // Normalize headers to lowercase for consistent access
    const headerMap = message.payload?.headers.reduce((acc, header) => {
        acc[header.name.toLowerCase()] = header.value;
        return acc;
    }, {} as Record<string, string>);

    const stdEmail: StandardEmail = {
        messageId: message.id,
        from: headerMap?.from || "",
        to: headerMap?.to || "",
        subject: headerMap?.subject,
        receivedAt: headerMap?.date,
        snippet: message.snippet,
        ...(dbThreadKey && { dbThreadKey }),
    };

    // Process all MIME parts recursively
    const parts = (await Promise.all(
        (message.payload?.parts || []).map((part) =>
            collectPartsInAMessage(
                logContext,
                userId,
                message.id,
                part,
                downloadAttachments,
            )
        ),
    )).flat();

    for (const part of parts || []) {
        if (part.filename && part.attachmentId) {
            stdEmail.attachments = stdEmail.attachments || [];
            stdEmail.attachments.push(part);
        } else if (
            part.mimetype === "text/plain" && part.data && !stdEmail.body
        ) {
            // Prefer plain text for AI processing
            stdEmail.body = decodeBase64(part.data);
        } else if (part.mimetype === "text/html" && part.data) {
            // HTML fallback preserves formatting
            stdEmail.body = decodeBase64(part.data);
        } else {
            functionLogger.warn(
                { unknownPart: part },
                "Unrecognized MIME part ignored",
            );
        }
    }

    functionLogger.debug(
        { standardizedEmail: stdEmail },
        "Message parsing completed",
    );

    return stdEmail;
}

/**
 * Enriches email data with cached or generated summaries
 * @param {LogContext} logContext - Logging context for request tracing
 * @param {string} userId - Authenticated user identifier
 * @param {GmailMessage} message - Raw Gmail message to enhance
 * @returns {Promise<StandardEmail>} Enhanced email with AI summaries
 * @throws {Error} If summarization fails
 */
async function hydrateEmail(
    logContext: LogContext,
    userId: string,
    message: GmailMessage,
): Promise<StandardEmail> {
    const functionLogger = createLogger(logContext,
        {
            module: "stdmail-util",
            function: "hydrateEmail",
            additional: {
                userId,
                messageId: message?.id,
            },
        }
    )
    // const logEventBase: LogEvent = {
    //     ...logContext,
    //     module: "stdmail-util",
    //     function: "hydrateEmail",
    //     time: 0,
    //     additional: {
    //         ...logContext.additional,
    //         userId,
    //         messageId: message && message.id,
    //     },
    // };
    // Check cache first to avoid redundant processing
    const emailAbs = await getEmailAbstract(logContext, userId, message.id);
    if (emailAbs?.summary) {
        functionLogger.debug(
            { emailAbsFromDb: emailAbs },
            "**hydrateEmail** email summary found in db. use it.",
        );
        return emailAbs;
    }

    // Full processing path when no cache exists
    const stdEmail = await parseGmailMessage(logContext, userId, message, true);
    functionLogger.info(
        { gmailMessage: message },
        `**hydrateEmail** Initiating AI summarization message: ${message.id} of thread: ${message.threadId}`,
    );

    const neoEmailAbs = await generateEmailSummary(logContext, stdEmail);
    await setEmailAbstract(logContext, userId, message.id, neoEmailAbs);

    functionLogger.info(
        {
            messageId: neoEmailAbs.messageId,
            dbThreadKey: neoEmailAbs.dbThreadKey,
            summary: neoEmailAbs.summary,
        },
        `**hydrateEmail** Persisted new email summary for email: ${neoEmailAbs.messageId} thread: ${neoEmailAbs.dbThreadKey}`,
    );

    return neoEmailAbs;
}

/**
 * Generates AI-powered summaries for email content and attachments
 * @param {LogContext} logContext - Logging context for request tracing
 * @param {StandardEmail} email - Structured email data to analyze
 * @returns {Promise<StandardEmail>} Enhanced email with generated summaries
 * @throws {Error} If AI processing fails
 */
async function generateEmailSummary(
    logContext: LogContext,
    email: StandardEmail,
): Promise<StandardEmail> {
    const functionLogger = createLogger(logContext,
        {
            module: "stdmail-util",
            function: "generateEmailSummary",
        }
    )
    // Process attachments first for comprehensive context
    for (const attachment of email.attachments || []) {
        if (!attachment.summary) {
            const text = await extractText(logContext, attachment.filename, attachment.mimetype, attachment.data!);

            if (!text || text.length < 400) {
                throw new Error(`Failed to extract text from ${attachment.filename} mime: ${attachment.mimetype} text: ${text}`)
            }
            attachment.text = text;

            const attachmentSummary = await summarizeText(attachment);
            // const attachmentSummary = await summarizeAttachment(attachment);
            attachment.summary = attachmentSummary.summary;
        }
    }

    // Generate main email summary with full context
    const emailSummary = await summarizeEmailFlow(email);
    email.summary = emailSummary.summary;

    functionLogger.trace(
        { emailSummary },
        "AI summarization completed",
    );

    return email;
}

/**
 * Processes complete email thread into standardized format with summaries
 * @param {LogContext} logContext - Logging context for request tracing
 * @param {string} userId - Authenticated user identifier
 * @param {GmailThread} thread - Raw Gmail thread to process
 * @returns {Promise<StandardEmailThread>} Normalized thread with AI insights
 * @throws {Error} If thread processing fails
 */
export async function hydrateThread(
    logContext: LogContext,
    userId: string,
    thread: GmailThread,
): Promise<StandardEmailThread> {
    const functionLogger = createLogger(logContext,
        {
            module: "stdmail-util",
            function: "hydrateThread",
            additional: {
                userId,
                threadId: thread?.id,
            }
        }
    )
    const logEventBase: LogEvent = {
        ...logContext,
        module: "stdmail-util",
        function: "hydrateThread",
        time: 0,
        additional: {
            ...logContext.additional,
            userId,
            threadId: thread?.id,
        },
    };
    functionLogger.debug(
        { userId, threadId: thread.id, snippet: thread.snippet },
        `**ThreadsSummarization** Started hydrating thread ${thread.id} for user ${userId}`,
    );

    const messageIds = thread.messages.map((message) => message.id);
    const messageAbsMap: Record<string, StandardEmail> = {};
    let threadKey: string | undefined;

    // Process messages in sequence to maintain order
    for (const message of thread.messages) {
        const messageAbs = await hydrateEmail(logContext, userId, message);

        messageAbsMap[messageAbs.messageId!] = messageAbs;

        // Resolve thread key from existing messages
        if (messageAbs.dbThreadKey) {
            if (threadKey && threadKey !== messageAbs.dbThreadKey) {
                logger.warn(
                    { key1: threadKey, key2: messageAbs.dbThreadKey },
                    `**hydrateThread** Thread key mismatch detected ${threadKey} ${messageAbs.dbThreadKey}`,
                );
            }
            threadKey = messageAbs.dbThreadKey;
        }
    }

    // Attempt to load existing thread summary
    let threadAbs = threadKey
        ? await getThreadAbstract(logContext, userId, threadKey)
        : undefined;

    // Regenerate summary if missing or message list changed
    if (
        !threadAbs?.summary ||
        !areStringListsEqual(threadAbs.messageIds, messageIds)
    ) {
        if (messageIds.length === 1) {
            threadKey = messageIds[0];
            threadAbs = {
                dbThreadKey: threadKey,
                summary: messageAbsMap[messageIds[0]].summary!,
                messageIds: [messageIds[0]],
                snippet: thread.snippet,
                messages: [messageAbsMap[messageIds[0]]],
            };
        } else {
            threadKey = createThreadKey(messageIds);
            threadAbs = {
                dbThreadKey: threadKey,
                messageIds: messageIds,
                snippet: thread.snippet,
                messages: messageIds.map((id) => messageAbsMap[id]),
            };

            functionLogger.info(
                {},
                `**hydrateThread** Call AI to summarize thread ${threadKey} with ${messageIds.length} messages`,
            );
            const summary = await summarizeEmailThread(threadAbs);
            threadAbs.summary = summary.summary;
        }

        await setThreadAbstract(logContext, userId, threadKey, threadAbs);
    }

    // attach the EmailAbstracts to the threadAbs
    threadAbs.messages = messageIds.map((id) => messageAbsMap[id]);

    // Ensure message-thread relationship consistency by setting all the messages
    // that Gmail thinks are in this thread to have the same threadKey in our db.
    await Promise.all(messageIds.map(async (id) => {
        const mabs = messageAbsMap[id];
        if (mabs.dbThreadKey !== threadKey) {
            mabs.dbThreadKey = threadKey!;
            await setEmailAbstract(logContext, userId, id, mabs);
        }
    }));

    if (!threadAbs.summary) {
        throw new Error("**hydrateThread** Thread summary generation failed");
    }

    functionLogger.info(
        { threadAbs },
        `**hydrateThread** Thread ${threadKey} hydrated with ${messageIds.length} messages`,
    );

    return threadAbs;
}

/**
 * Generates thread identifier from message chronology
 * @param {string[]} messageIds - Array of message IDs in reverse chronological order
 * @returns {string} Thread key using earliest message ID
 * @description Gmail returns messages newest-first, so last array element is oldest
 */
function createThreadKey(messageIds: string[]): string {
    return messageIds[messageIds.length - 1];
}
