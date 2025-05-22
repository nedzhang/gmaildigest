'use server';

import { collection, addDoc, doc, updateDoc, DocumentReference, DocumentData, setDoc, getDoc, getDocs } from "firebase/firestore";
import { getDb } from "./firestore-auth";
import { OAuthToken, OAuthTokenSchema, UserSecurityProfile, UserSecurityProfileSchema } from "@/types/firebase";
import { shallowCopyObjProperties } from "@/lib/object-util";
import { EmailAbstract, EmailAbstractSchema, GmailMessage } from "@/types/gmail";

/** Prefix for Firestore collection names based on environment configuration */
const PROJ_PREFIX = process.env.PROJECT_CODE;

/**
 * Generates a collection name with project prefix
 * @param objectName - Base name of the collection
 * @returns Prefixed collection name
 * @throws Error if project prefix is not configured
 */
function getCollectionName(objectName: string): string {
    if (!PROJ_PREFIX) throw new Error("Project code environment variable not configured");
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
    
    if (tokens.refresh_token_expires_in && !enhancedTokens.refresh_token_expires_at) {
        enhancedTokens.refresh_token_expires_at = now + tokens.refresh_token_expires_in;
    }
    
    return enhancedTokens;
}

/**
 * Updates a specific token document for a user
 * @param userId - ID of the user to update
 * @param tokenId - ID of the token document to update
 * @param tokenSet - New token data to store
 */
export async function updateToken(userId: string, tokenId: string, tokenSet: OAuthToken): Promise<void> {
    if (!tokenSet) throw new Error("Missing token data");
    
    const db = await getDb();
    const tokenDoc = doc(collection(db, getCollectionName('users'), userId, 'tokens'), tokenId);
    const updatedTokens = addExpirationTimestamps(tokenSet);
    
    console.info(`Updating token for user ${userId}, token ${tokenId}`);
    await updateDoc(tokenDoc, updatedTokens);
}

/**
 * Creates or updates a user's latest authentication token
 * @param tokenSet - Complete OAuth token data with user payload
 * @throws Error if token payload is missing email
 */
export async function updateUserLatestToken(tokenSet: OAuthToken): Promise<void> {
    const userEmail = tokenSet.payload?.email;
    if (!userEmail) throw new Error("User email missing in token payload");
    
    const db = await getDb();
    const enhancedToken = addExpirationTimestamps(tokenSet);
    
    // Create references to user document and tokens collection
    const userDoc = doc(db, getCollectionName('users'), userEmail);
    const tokensCollection = collection(db, getCollectionName('users'), userEmail, 'tokens');
    
    // Add new token document
    const tokenDoc = await addDoc(tokensCollection, enhancedToken);
    await updateDoc(tokenDoc, { db_id: tokenDoc.id });
    
    // Update user document metadata
    await setDoc(userDoc, { 
        login_email: userEmail,
        latest_token_id: tokenDoc.id,
        updated: Date.now() 
    }, { merge: true });
}

/**
 * Updates a user's security profile with core information
 * @param user - User profile data to update
 * @throws Error if user email is missing
 */
export async function updateUser(user: UserSecurityProfile): Promise<void> {
    if (!user.login_email) throw new Error("User email required for update");
    
    const db = await getDb();
    const userDoc = doc(db, getCollectionName('users'), user.login_email);
    const userUpdate = shallowCopyObjProperties(user, [
        'full_name',
        'preferred_name',
        'communication_email',
        'email_verified'
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
export async function getUser(userId: string): Promise<UserSecurityProfile | undefined> {
    const db = await getDb();
    const userDocRef = doc(db, getCollectionName('users'), userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (!userDocSnap.exists()) return undefined;
    
    // Parse base user document
    const userData = UserSecurityProfileSchema.parse(await userDocSnap.data());
    
    // Retrieve and process associated tokens
    const tokensSnap = await getDocs(
        collection(db, getCollectionName('users'), userId, 'tokens')
    );
    
    const tokens = await Promise.all(
        tokensSnap.docs.map(async (doc) => {
            const tokenData = OAuthTokenSchema.parse(await doc.data());
            if (doc.id === userData.latest_token_id) {
                userData.latest_token = tokenData;
            }
            return tokenData;
        })
    );
    
    userData.tokens = tokens;
    return userData;
}

export async function getEmailAbstract(userId: string, emailId:string): Promise<EmailAbstract | undefined> {
    const db = await getDb();

    const emailDocRef = doc(db, getCollectionName('users'), userId, 'emailass', emailId);

    if (!emailDocRef) return undefined;

    const emailDocSnap = await getDoc(emailDocRef);

    if (!emailDocSnap.exists()) return undefined;

    return EmailAbstractSchema.parse(await emailDocSnap.data());
}

export async function setEmailAbstract(
    userId: string,
    emailId: string,
    data: Partial<EmailAbstract>
  ): Promise<void> {
    const db = await getDb();
  
    const emailDocRef = doc(db, getCollectionName('users'), userId, 'emailass', emailId);
  
    // Validate and sanitize input using the schema (optional fields already handled)
    const parsedData = EmailAbstractSchema.partial().parse(data);
  
    // Create or update document with merge
    await setDoc(emailDocRef, parsedData, { merge: true });
  }
