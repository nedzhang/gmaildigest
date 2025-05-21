'use server';


import { collection, addDoc, doc, updateDoc, DocumentReference, DocumentData, setDoc, getDoc, getDocs } from "firebase/firestore";

import { getDb } from "./firestore-auth";
import { OAuthToken, OAuthTokenSchema, UserSecurityProfile, UserSecurityProfileSchema } from "@/types/firebase";
import { shallowCopyObjProperties } from "@/lib/object-util";




const PROJ_PREFIX = process.env.PROJECT_CODE;

function getCollectionName(objectName: string): string {
    if (PROJ_PREFIX) {
        return `${PROJ_PREFIX}#${objectName}`;
    } else {
        throw new Error("**getCollectionName** missing project code");
    }
}


function calculateExpireAt(tokens: OAuthToken): OAuthToken {

    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (tokens.expires_in && !tokens.expires_at) {
        tokens.expires_at = nowInSeconds + tokens.expires_in;
    }

    if (tokens.refresh_token_expires_in && !tokens.refresh_token_expires_at) {
        tokens.refresh_token_expires_at = nowInSeconds + tokens.refresh_token_expires_in;
    }

    return tokens;
}

export async function updateToken(userId:string, tokenId:string, tokenSet: OAuthToken): Promise<void> {
    
    const tokenWithExpireAt = calculateExpireAt(tokenSet);
    
    const db = await getDb();
    // const userDoc = doc(db, getCollectionName('users'), userId);
    console.info('**updateToken** updating token for user', userId, 'token', tokenId, 'with', tokenSet);
    
    const tokenDoc = doc(collection(db, getCollectionName('users'), userId, 'tokens'), tokenId);

    if (tokenSet) {
        updateDoc(tokenDoc, tokenWithExpireAt)
    } else {
        throw new Error("**updateToken** missing tokenSet")
    }
}

export async function updateUserLatestToken(userToken: OAuthToken): Promise<DocumentReference<DocumentData, DocumentData>> {

    // console.log("**upsertUserToken** userToken: ", userToken);

    const userEmail = userToken.payload?.email;

    if (!userEmail) {
        throw new Error('**saveGoogleTokenToFirestore** User email not found in token payload');
    }

    const userTokenWithExpireAt = calculateExpireAt(userToken);

    const db = await getDb();

    const userDoc = doc(db, getCollectionName('users'), userEmail);
    const userTokenCollection = collection(db, getCollectionName('users'), userEmail, 'tokens');

    // console.info("**upsertUserToken** userDoc: ", userDoc)
    const tokenDoc = await addDoc(userTokenCollection, userTokenWithExpireAt);

    await updateDoc(tokenDoc, { db_id: tokenDoc.id })

    await setDoc(userDoc, { login_email: userEmail, latest_token_id: tokenDoc.id, updated: Date.now() }, { merge: true });

    return userDoc;

}

export async function updateUser(user: UserSecurityProfile): Promise<void> {
    const db = await getDb();

    // console.log("**updateUser user to copy: ", user);
    
    const userDoc = doc(db, getCollectionName('users'), user.login_email!);

    const userCopy = shallowCopyObjProperties(user, ['full_name', 'preferred_name', 'communication_email', 'email_verified'])

    // console.log("**updateUser** copy of user", userCopy);

    userCopy.updated = Date.now();
    userCopy.accessed = Date.now();
    
    await updateDoc(userDoc, userCopy);
}

/**
 * Retrieves a user's security profile from the database based on their email.
 *
 * @param userEmail The email of the user to retrieve.
 * @returns A promise that resolves to the user's security profile or null if not found.
 */
export async function getUser(userEmail: string): Promise<UserSecurityProfile | null> {

    const db = await getDb();

    const userDocRef = doc(db, getCollectionName('users'), userEmail);

    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const docData = userDocSnap.data();
        // console.log("**getUser** docData: ", docData);

        const userObj = UserSecurityProfileSchema.parse(docData);

        const tokensSnap = await getDocs(
            collection(db, getCollectionName('users'), userEmail, 'tokens')
        );

        const tokens: OAuthToken[] = [];

        tokensSnap.forEach(async (tokenDocSnap) => {
            const tokenDoc = tokenDocSnap.data();
            const tokenData = OAuthTokenSchema.parse(tokenDoc);
            // console.log("**getUser** tokenData: ", tokenData);
            tokens.push(tokenData);
            // console.log("**getUser** tokenDoc.id: ", tokenDocSnap.id, " userObj.latest_token_id: ", userObj.latest_token_id);
            if (tokenDocSnap.id === userObj.latest_token_id) {
                console.log("**getUser** setting latest_token");
                userObj.latest_token = tokenData;
            }
        });

        userObj.tokens = tokens;

        // console.log("**getUser** userObj.lastest_token: ", userObj.latest_token);
        // console.log("**getUser** userObj:")

        return userObj;
    } else {
        return null;
    }
}