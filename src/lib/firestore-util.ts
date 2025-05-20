'use server';

import { getFirestore } from "firebase/firestore";
import { GoogleOAuthToken } from "./schema";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";
// import { getFirestore, collection, getDocs } from 'npm:firebase/firestore';

import admin from 'firebase-admin';
import { App, getApps as getAdminApps } from 'firebase-admin/app';
// import { getDatabase } from 'firebase-admin/database';

import { initializeApp, getApps as getFirebaseApps, FirebaseApp } from "firebase/app";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { FirebaseServiceAccount } from "@/types/firebase";

import SERVICE_ACCOUNT from "../../secret/firebase-admin-service-account.json";
import { Console } from "console";


// const SERVICE_ACCOUNT = JSON.parse(serviceAccountString);

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    // Your Firebase configuration
};



// Initialize Firebase Admin (only once)
function getAdminApp(): App {
    if (!getAdminApps().length) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.stringify(SERVICE_ACCOUNT)),
        })
    }
    return getAdminApps()[0];
}

function getFirebaseApp(): FirebaseApp {
    if (!getFirebaseApps().length) {
        initializeApp(firebaseConfig);
    }

    return getFirebaseApps()[0];
}

async function signInWithFirebaseServiceAccount(app: FirebaseApp, cred: FirebaseServiceAccount) {

    const uid = cred.client_email;
    console.log("uid: ", uid);

    const customToken = await admin.auth().createCustomToken(uid);
    console.log("customToken: ", customToken);

    // console.log('app to sign into is: ', app);

    const auth = getAuth(app);
    // console.log('got auth: ', auth);

    // Sign in with custom token
    return signInWithCustomToken(auth, customToken);
}

async function signIn() {
    getAdminApp();

    const firebaseApp = getFirebaseApp();

    const userCred = await signInWithFirebaseServiceAccount(firebaseApp, SERVICE_ACCOUNT);

    return userCred;
}

// // Get the Firebase Realtime Database instance
// function getFirebaseDB() {
//     initializeAdmin();
//     return getDatabase();
// }

// async function getMainCollection() {
//     await signIn();

//     const db = getFirebaseDB();

//     const collectionName = `${firebaseConfig.projectId}##gmail-digest`

//     // In Firestore, collections are implicitly created when you add a document
//     return collection(db, collectionName)
// }

function getCollectionName():string {
    return `${firebaseConfig.projectId}##gmail-digest`;
}

export async function upsertUserToken(userToken: GoogleOAuthToken): Promise<void> {

    console.log("**upsertUserToken** userToken: ", userToken);

    const userEmail = userToken.payload?.email;

    if (!userEmail) {
        throw new Error('**saveGoogleTokenToFirestore** User email not found in token payload');
    }

    await signIn();

    const firebaseApp = getFirebaseApp();

    const db = getFirestore(firebaseApp);

    const tokenDoc = doc(db, getCollectionName(), userEmail, 'token', 'last');

    console.info("**upsertUserToken** tokenDoc: ", tokenDoc)

    return await setDoc(tokenDoc, userToken);

}