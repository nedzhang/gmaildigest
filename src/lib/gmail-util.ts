'use server';

import { getUser } from "@/lib/gduser-util";
import { GmailThread, GmailThreadList, GmailThreadListSchema, GmailThreadSchema, GRestErrorSchema } from "@/types/gmail";
import { getAccessToken } from "./oauth2-util";

const GOOGLE_API_URL = 'https://www.googleapis.com/gmail/v1';

/**
 * Checks if a response from Google API is a error.
 * It does not verify the object is the correct type <T>, only to cast it as T. 
 * @param response - Response from Gmail API
 * @returns GmailThreadList if valid, throws error if not
 * @throws Error if response is a GRestError
 * 
 */
function checkGRestResponse<T>(response: any):T {

    const { success, error, data} = GRestErrorSchema.safeParse(response)

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
async function listThreads(accessToken: string, userId: string): Promise<GmailThreadList> {
    const response = await fetch(`${GOOGLE_API_URL}/users/${userId}/threads`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    // return response.json();
    return checkGRestResponse<GmailThreadList>(await response.json());
}

/**
 * Fetches detailed information about a specific email thread
 * @param accessToken - Valid OAuth2 access token
 * @param userId - Gmail user's email address or 'me' for authenticated user
 * @param threadId - ID of the thread to retrieve
 * @returns Promise resolving to GmailThread
 */
async function getThread(accessToken: string, userId: string, threadId: string): Promise<GmailThread> {
    const response = await fetch(`${GOOGLE_API_URL}/users/${userId}/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return checkGRestResponse<GmailThread>(await response.json());
}



/**
 * Retrieves a single email thread with full details
 * @param userId - User ID to authenticate request
 * @param threadId - ID of the thread to retrieve
 * @returns Promise resolving to requested GmailThread
 */
export async function retrieveThread(userId: string, threadId: string): Promise<GmailThread> {
    const access_token = await getAccessToken(userId);
    return getThread(access_token, userId, threadId);
}

/**
 * Retrieves all available email threads for a user
 * @param userId - User ID to authenticate request
 * @returns Promise resolving to array of GmailThreads or undefined if none found
 */
export async function retrieveUserThreads(userId: string): Promise<GmailThread[] | undefined> {
    const access_token = await getAccessToken(userId);
    const { threads } = await listThreads(access_token, userId);


    if (!threads?.length) return undefined;

    // Fetch all thread details in parallel
    return Promise.all(
        threads.map(({ id }) => getThread(access_token, userId, id!))
    );
}

/**
 * Retrieves a single email attachment
 * @param userId - User ID to authenticate request and also the email address
 * @param emailId - ID of the email containing the attachment
 * @param attachmentId - ID of the attachment to retrieve
 * @returns Promise resolving to requested attachment or undefined if not found
 */
export async function getAttachment(userId: string, emailId: string, attachmentId: string): Promise< {size:string, data:string} | undefined> {
    const access_token = await getAccessToken(userId);
    
    const response = await fetch(`${GOOGLE_API_URL}/users/${userId}/messages/${emailId}/attachments/${attachmentId}`, {
        headers: { Authorization: `Bearer ${access_token}` }
    });

    return await response.json();
}
