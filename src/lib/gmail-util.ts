'use server';

import { getUser } from "@/lib/gduser-util";
import { GmailThread, GmailThreadList, GmailThreadListSchema, GmailThreadSchema, GRestErrorSchema } from "@/types/gmail";
import { getAccessToken } from "./oauth2-util";
import logger, { LogContext, makeLogEntry } from "./logger";

const GOOGLE_API_URL = 'https://www.googleapis.com/gmail/v1';

/**
 * Checks if a response from Google API is a error.
 * It does not verify the object is the correct type <T>, only to cast it as T. 
 * @param response - Response from Gmail API
 * @returns <T> if valid, throws error if not
 * @throws Error if response is a GRestError
 * 
 */
function checkGRestResponse<T>(response: any): T {

    const { success, error, data } = GRestErrorSchema.safeParse(response)

    if (success) { // we have an error message.
        throw new Error(`**checkGRestResponse** exception: ${JSON.stringify(response, null, 2)}`);
    } else {
        // we don't have an error, we can use the schema to validate the data
        return response as T;
    }
}
/**
 * Fetches a list of email threads from Gmail API
 * @param accessToken - Valid OAuth2 access token
 * @param userId - Gmail user's email address or 'me' for authenticated user
 * @returns Promise resolving to GmailThreadList
 */
async function listThreads(logContext: LogContext, accessToken: string, userId: string): Promise<GmailThreadList> {
    logger.debug(makeLogEntry({
        ...logContext,
        time: Date.now(),
        module: "gmail-util",
        function: "listThreads",
    }, {
    }, `**listThreads** Started listing threads for user ${userId}`));

    const response = await fetch(`${GOOGLE_API_URL}/users/${userId}/threads`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    // return response.json();
    const threadList = checkGRestResponse<GmailThreadList>(await response.json());

    logger.info(makeLogEntry({
        ...logContext,
        time: Date.now(),
        module: "gmail-util",
        function: "listThreads",
    }, {
        threadList
    }, `**listThreads** Retrieved simple thread list for user ${userId}`));

    return threadList;
}

/**
 * Fetches detailed information about a specific email thread
 * @param accessToken - Valid OAuth2 access token
 * @param userId - Gmail user's email address or 'me' for authenticated user
 * @param threadId - ID of the thread to retrieve
 * @returns Promise resolving to GmailThread
 */
async function getThread(logContext: LogContext, accessToken: string, userId: string, threadId: string): Promise<GmailThread> {
    logger.debug(makeLogEntry({
        ...logContext,
        time: Date.now(),
        module: "gmail-util",
        function: "getThread",
    }, {
        userId, threadId
    }, `**getThread** Started retrieving thread ${threadId} for user ${userId}`));

    const response = await fetch(`${GOOGLE_API_URL}/users/${userId}/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const thread = checkGRestResponse<GmailThread>(await response.json());

    logger.info(makeLogEntry({
        ...logContext,
        time: Date.now(),
        module: "gmail-util",
        function: "getThread",
    }, {
        thread
    }, `**getThread** Retrieved thread ${threadId} for user ${userId}`));

    return thread;
}



/**
 * Retrieves a single email thread with full details
 * @param userId - User ID to authenticate request
 * @param threadId - ID of the thread to retrieve
 * @returns Promise resolving to requested GmailThread
 */
export async function retrieveThread(logContext: LogContext, userId: string, threadId: string): Promise<GmailThread> {
    const access_token = await getAccessToken(logContext, userId);
    return getThread(logContext, access_token, userId, threadId);
}

/**
 * Retrieves all available email threads for a user
 * @param userId - User ID to authenticate request
 * @returns Promise resolving to array of GmailThreads or undefined if none found
 */
export async function getGmailThreads(logContext: LogContext, userId: string): Promise<GmailThread[] | undefined> {
    const access_token = await getAccessToken(logContext, userId);
    const { threads } = await listThreads(logContext, access_token, userId);

    if (!threads?.length) return undefined;

    
    const detailedThreadList : GmailThread[] = [];

    for (const thread of threads) {
        const detailedThread = await getThread(logContext, access_token, userId, thread.id);
        detailedThreadList.push(detailedThread);
    }

    return detailedThreadList;

    // // This code causes RateLimit from GoogleApi.
    // return Promise.all(
    //     threads.map(({ id }) => getThread(logContext, access_token, userId, id!))
    // );
}

/**
 * Retrieves a single email attachment
 * @param userId - User ID to authenticate request and also the email address
 * @param emailId - ID of the email containing the attachment
 * @param attachmentId - ID of the attachment to retrieve
 * @returns Promise resolving to requested attachment or undefined if not found
 */
export async function getAttachment(logContext: LogContext, userId: string, emailId: string, attachmentId: string): Promise<{ size: string, data: string } | undefined> {
    const access_token = await getAccessToken(logContext, userId);

    const response = await fetch(`${GOOGLE_API_URL}/users/${userId}/messages/${emailId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${access_token}` }
    });

    return await response.json();
}
