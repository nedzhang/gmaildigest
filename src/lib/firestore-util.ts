'use server';

// import { DocumentData, DocumentReference } from "firebase-admin/firestore";

import { collection, addDoc, doc, updateDoc, DocumentReference, DocumentData, setDoc, getDoc, QueryDocumentSnapshot, getDocs } from "firebase/firestore";

import { GoogleOAuthToken } from "./schema";

import { getDb } from "./firestore-auth";
import { DocumentDataSchema } from "genkit";
import { OAuthToken, OAuthTokenSchema, UserSecurityProfile, UserSecurityProfileSchema } from "@/types/firebase";
import { User } from "firebase/auth";
import { shallowCopyObjProperties } from "@/lib/object-util";




const PROJ_PREFIX = process.env.PROJECT_CODE;

function getCollectionName(objectName: string): string {
    if (PROJ_PREFIX) {
        return `${PROJ_PREFIX}#${objectName}`;
    } else {
        throw new Error("**getCollectionName** missing project code");
    }
}

export async function updateUserOAuthToken(userToken: GoogleOAuthToken): Promise<DocumentReference<DocumentData, DocumentData>> {

    // console.log("**upsertUserToken** userToken: ", userToken);

    const userEmail = userToken.payload?.email;

    if (!userEmail) {
        throw new Error('**saveGoogleTokenToFirestore** User email not found in token payload');
    }

    const db = await getDb();

    const userDoc = doc(db, getCollectionName('users'), userEmail);
    const userTokenCollection = collection(db, getCollectionName('users'), userEmail, 'tokens');

    // console.info("**upsertUserToken** userDoc: ", userDoc)
    const tokenDoc = await addDoc(userTokenCollection, userToken);

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

export async function getUser(userEmail: string): Promise<UserSecurityProfile | null> {

    const db = await getDb();

    const userDocRef = doc(db, getCollectionName('users'), userEmail);

    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const docData = userDocSnap.data();
        console.log("**getUser** docData: ", docData);

        const userObj = UserSecurityProfileSchema.parse(docData);

        const tokensSnap = await getDocs(
            collection(db, getCollectionName('users'), userEmail, 'tokens')
        );

        const tokens: OAuthToken[] = [];

        tokensSnap.forEach(async (tokenDocSnap) => {
            const tokenData = OAuthTokenSchema.parse(tokenDocSnap.data());
            // console.log("**getUser** tokenData: ", tokenData);
            tokens.push(tokenData);
        });

        userObj.tokens = tokens;

        return userObj;
    } else {
        return null;
    }
}