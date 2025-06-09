"use server";

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    DocumentData,
    DocumentReference,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { getDb } from "./firestore-auth";
import {
    OAuthToken,
    OAuthTokenSchema,
    UserSecurityProfile,
    UserSecurityProfileSchema,
} from "@/types/firebase";
import { shallowCopyObjProperties } from "@/lib/object-util";
import {
    GmailMessage,
    StandardEmail,
    StandardEmailListSchema,
    StandardEmailSchema,
    StandardEmailThread,
    StandardEmailThreadSchema,
} from "@/types/gmail";
import logger, { LogContext, makeLogContext, makeLogEntry } from "@/lib/logger";

/** Prefix for Firestore collection names based on environment configuration */
const PROJ_PREFIX = process.env.PROJECT_CODE;

/**
 * Generates a collection name with project prefix
 * @param objectName - Base name of the collection
 * @returns Prefixed collection name
 * @throws Error if project prefix is not configured
 */
function getCollectionName(objectName: string): string {
    if (!PROJ_PREFIX) {
        throw new Error("Project code environment variable not configured");
    }
    return `${PROJ_PREFIX}#${objectName}`;
}

/**
 * Adds expiration timestamps to token fields if not present
 * @param tokens - OAuth token object to enhance
 * @returns New token object with calculated expiration timestamps
 */
function addExpirationTimestamps(tokens: OAuthToken): OAuthToken {
    const now = Math.floor(Date.now() / 1000);
    const enhancedTokens = { ...tokens };

    if (tokens.expires_in && !enhancedTokens.expires_at) {
        enhancedTokens.expires_at = now + tokens.expires_in;
    }

    if (
        tokens.refresh_token_expires_in &&
        !enhancedTokens.refresh_token_expires_at
    ) {
        enhancedTokens.refresh_token_expires_at = now +
            tokens.refresh_token_expires_in;
    }

    return enhancedTokens;
}

/**
 * Updates a specific token document for a user
 * @param userId - ID of the user to update
 * @param tokenId - ID of the token document to update
 * @param tokenSet - New token data to store
 */
export async function updateToken(
    logContext: LogContext,
    userId: string,
    tokenId: string,
    tokenSet: OAuthToken,
): Promise<OAuthToken> {
    if (!tokenSet) throw new Error("Missing token data");

    const db = await getDb(logContext);
    const tokenDoc = doc(
        collection(db, getCollectionName("users"), userId, "tokens"),
        tokenId,
    );
    const updatedTokens = addExpirationTimestamps(tokenSet);

    logger.info(makeLogEntry(
        {
            ...logContext,
            time: Date.now(),
            module: "gduser-util",
            function: "updateToken",
        },
        { userId, tokenId },
        `**updateToken** Updating token for user ${userId}, token ${tokenId}`,
    ));

    await updateDoc(tokenDoc, updatedTokens);

    return updatedTokens;
}

/**
 * Creates or updates a user's latest authentication token
 * @param tokenSet - Complete OAuth token data with user payload
 * @throws Error if token payload is missing email
 */
export async function updateUserLatestToken(
    logContext: LogContext,
    tokenSet: OAuthToken,
): Promise<OAuthToken> {
    const userEmail = tokenSet.payload?.email;
    if (!userEmail) throw new Error("User email missing in token payload");

    const db = await getDb(logContext);
    const updatedToken = addExpirationTimestamps(tokenSet);

    // Create references to user document and tokens collection
    const userDoc = doc(db, getCollectionName("users"), userEmail);
    const tokensCollection = collection(
        db,
        getCollectionName("users"),
        userEmail,
        "tokens",
    );

    // Add new token document
    const tokenDoc = await addDoc(tokensCollection, updatedToken);
    await updateDoc(tokenDoc, { db_id: tokenDoc.id });

    // Update user document metadata
    await setDoc(userDoc, {
        login_email: userEmail,
        latest_token_id: tokenDoc.id,
        updated: Date.now(),
    }, { merge: true });

    return updatedToken;
}

/**
 * Updates a user's security profile with core information
 * @param user - User profile data to update
 * @throws Error if user email is missing
 */
export async function updateUser(
    logContext: LogContext,
    user: UserSecurityProfile,
): Promise<void> {
    if (!user.login_email) throw new Error("User email required for update");

    const db = await getDb(logContext);
    const userDoc = doc(db, getCollectionName("users"), user.login_email);
    const userUpdate = shallowCopyObjProperties(user, [
        "full_name",
        "preferred_name",
        "communication_email",
        "email_verified",
    ]);

    userUpdate.updated = Date.now();
    userUpdate.accessed = Date.now();

    await updateDoc(userDoc, userUpdate);
}

/**
 * Retrieves complete user profile with authentication tokens
 * @param userId - id of the user to retrieve
 * @returns Complete user profile or null if not found
 */
export async function getUser(
    logContext: LogContext,
    userId: string,
): Promise<UserSecurityProfile | undefined> {
    const db = await getDb(logContext);
    const userDocRef = doc(db, getCollectionName("users"), userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) return undefined;

    // Parse base user document
    const userData = UserSecurityProfileSchema.parse(await userDocSnap.data());

    // Retrieve and process associated tokens
    const tokensSnap = await getDocs(
        collection(db, getCollectionName("users"), userId, "tokens"),
    );

    const tokens = await Promise.all(
        tokensSnap.docs.map(async (doc) => {
            const tokenData = OAuthTokenSchema.parse(await doc.data());
            if (doc.id === userData.latest_token_id) {
                userData.latest_token = tokenData;
            }
            return tokenData;
        }),
    );

    userData.tokens = tokens;
    return userData;
}

export async function getEmailAbstract(
    logContext: LogContext,
    userId: string,
    emailId: string,
): Promise<StandardEmail | undefined> {
    const db = await getDb(logContext);

    const emailDocRef = doc(
        db,
        getCollectionName("users"),
        userId,
        "emailabs",
        emailId,
    );

    if (!emailDocRef) return undefined;

    const emailDocSnap = await getDoc(emailDocRef);

    if (!emailDocSnap.exists()) return undefined;

    return StandardEmailSchema.parse(emailDocSnap.data());
}

export async function setEmailAbstract(
    logContext: LogContext,
    userId: string,
    emailId: string,
    emailAbs: StandardEmail,
): Promise<void> {
    const db = await getDb(logContext);

    const emailDocRef = doc(
        db,
        getCollectionName("users"),
        userId,
        "emailabs",
        emailId,
    );

    // Validate and sanitize input using the schema (optional fields already handled)
    const parsedData = StandardEmailSchema.partial().parse(emailAbs);

    if (parsedData.attachments) {
        parsedData.attachments = parsedData.attachments.map((attachment) => {
            const { data, ...attachmentWithoutData } = attachment;
            return attachmentWithoutData;
        });
    }

    logger.info(makeLogEntry(
        {
            ...logContext,
            time: Date.now(),
            module: "gduser-util",
            function: "setEmailAbstract",
        },
        {
            emailMessageToSet: parsedData,
        },
        `**setEmailAbstract** update emailAbs userId: ${userId}, emailId: ${emailId}`,
    ));
    // Create or update document with merge
    await setDoc(emailDocRef, parsedData, { merge: true });
}

export async function deleteEmailAbstract(
    logContext: LogContext,
    userId: string,
    emailId: string,
): Promise<void> {
    const db = await getDb(logContext);

    const emailDocRef = doc(
        db,
        getCollectionName("users"),
        userId,
        "emailabs",
        emailId,
    );

    if (!emailDocRef) {
        throw new Error(
            `**deleteEmailAbstract** emailDocRef not exist for userId ${userId} and emailId ${emailId}`,
        );
    }

    await deleteDoc(emailDocRef);

    return;
}

export async function listUserThreadAbs(
    logContext: LogContext,
    userId: string,
    loadMessage: boolean, // load email message abstracts into the thread. If not, only messageIds will be returned
): Promise<StandardEmailThread[]> {
    const db = await getDb(logContext);

    const userThreadAbsColRef = collection(
        db,
        getCollectionName("users"),
        userId,
        "threadabs",
    );

    // get all threadabs document from the collection.
    const snapshot = await getDocs(userThreadAbsColRef);

    const threads: StandardEmailThread[] = [];

    if (!logContext.additional) logContext.additional = { userId };

    await Promise.all(snapshot.docs.map(async (doc) => {
        const threadAbs = StandardEmailThreadSchema.parse(doc.data());

        if (logContext.additional) {
            logContext.additional["threadKey"] = threadAbs.dbThreadKey;
        }

        if (loadMessage) {
            threadAbs.messages = [];
            for (const messageId of threadAbs.messageIds) {
                const emailAbs = await getEmailAbstract(
                    logContext,
                    userId,
                    messageId,
                );
                if (emailAbs) {
                    threadAbs.messages.push(emailAbs);
                } else {
                    logger.warn(makeLogEntry(
                        {
                            ...logContext,
                            time: Date.now(),
                            module: "gduser-util",
                            function: "listUserThreadAbs",
                        },
                        {},
                        `**listUserThreadAbs** Failed to get email abstract from DB for user: ${userId} messageId: ${messageId}`,
                    ));
                }
            }
        }
        if (threadAbs) {
            threads.push(threadAbs);
        }
    }));

    return threads;
}

export async function getThreadAbstract(
    logContext: LogContext,
    userId: string,
    threadKey: string,
): Promise<StandardEmailThread | undefined> {
    const db = await getDb(logContext);

    const threadDocRef = doc(
        db,
        getCollectionName("users"),
        userId,
        "threadabs",
        threadKey,
    );

    if (!threadDocRef) return undefined;

    const threadDocSnap = await getDoc(threadDocRef);

    if (!threadDocSnap.exists()) return undefined;

    return StandardEmailThreadSchema.parse(await threadDocSnap.data());
}

export async function setThreadAbstract(
    logContext: LogContext,
    userId: string,
    threadKey: string,
    data: StandardEmailThread,
): Promise<void> {
    const db = await getDb(logContext);

    logger.debug(
        `**setThreadAbstract** userId: ${userId}, threadKey: ${threadKey}`,
    );

    const threadDocRef = doc(
        db,
        getCollectionName("users"),
        userId,
        "threadabs",
        threadKey,
    );

    // Limit the data to only the properties we want to save to db. We are not saving each messages in the thread because they are save in emailabs colleciton
    const limitedData = shallowCopyObjProperties(data, [
        "dbThreadKey",
        "summary",
        "messageIds",
        "snippet",
    ]);

    // logger.trace(`**setThreadAbstract** limitedData: ${JSON.stringify(limitedData)}`);

    // Validate and sanitize input using the schema (optional fields already handled)
    const parsedData = StandardEmailThreadSchema.partial().parse(limitedData);

    // logger.trace(`**setThreadAbstract** parsedData: ${JSON.stringify(parsedData)}`)
    logger.debug(makeLogEntry(
        {
            ...logContext,
            time: Date.now(),
            module: "gduser-util",
            function: "setThreadAbstract",
        },
        { parsedThreadAbs: parsedData },
        `**setThreadAbstract** saving to DB user: ${userId} thread ${parsedData.dbThreadKey} for messages: ${
            JSON.stringify(parsedData.messageIds)
        }}`,
    ));
    // Create or update document with merge
    await setDoc(threadDocRef, parsedData, { merge: true });
}
