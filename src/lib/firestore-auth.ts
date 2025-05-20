'use server';

// import { getFirestore } from "firebase-admin/firestore";
// import { doc, setDoc, collection, getDocs } from "firebase/firestore";
import { getFirestore, Firestore } from "firebase/firestore"; // We have to get the firebase/firestore instead of firebase-admin/firestore. I think it is because that we use a service account and id_token.

import admin from 'firebase-admin';
import { App, getApps as getAdminApps } from 'firebase-admin/app';

import { initializeApp, getApps as getFirebaseApps, FirebaseApp } from "firebase/app";
import { Auth, getAuth, signInWithCustomToken, UserCredential } from "firebase/auth";
import { FirebaseServiceAccount } from "@/types/firebase";

import SERVICE_ACCOUNT from "../../secret/firebase-admin-service-account.json";

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
            credential: admin.credential.cert(SERVICE_ACCOUNT), // We need to send in an object. otherwise the cert thinks a string is a file path.
        })
    }
    return getAdminApps()[0];
}

// Initialize Firebase App (only once)
function getFirebaseApp(): FirebaseApp {
    if (!getFirebaseApps().length) {
        initializeApp(firebaseConfig);
    }

    return getFirebaseApps()[0];
}

/**
 * Signs in to Firebase using a service account.
 * @param app - The Firebase App instance.
 * @param cred - The Firebase Service Account credentials.
 * @returns A promise that resolves with the Auth instance and UserCredential.
 */
async function signInWithServiceAccount(app: FirebaseApp, cred: FirebaseServiceAccount): Promise<{ auth: Auth, userCred: UserCredential }> {

    const uid = cred.client_email;
    console.log("uid: ", uid);

    const customToken = await admin.auth().createCustomToken(uid);
    console.log("customToken: ", customToken);

    // console.log('app to sign into is: ', app);

    const auth = getAuth(app);
    // console.log('got auth: ', auth);

    // Sign in with custom token
    const userCred = await signInWithCustomToken(auth, customToken);

    return { auth, userCred };


}

async function signIn(): Promise<{ auth: Auth, userCred: UserCredential }> {
    getAdminApp();

    const firebaseApp = getFirebaseApp();

    return signInWithServiceAccount(firebaseApp, SERVICE_ACCOUNT);
}

var auth: Auth;
var userCred: UserCredential;

// const { auth, userCred } = await signIn();

/**
 * Returns the Firestore database that is associated with the Firebase project.
 * The project is specified by environment variables.
 * @returns The Firestore database instance.
 * @throws An error if the user's ID token is not available.
 */
export async function getDb(): Promise<Firestore> {

    if (!auth || !userCred) {
        const { auth: newAuth, userCred: newUserCred } = await signIn();
        auth = newAuth;
        userCred = newUserCred;
        // console.log("**getDb* we have auth and userCred now: ", auth, "\nuserCred:", userCred);
    }

    // console.info("**getDb** got auth: ", auth)

    const newIdToken = await auth.currentUser?.getIdToken();
    console.info("**getDb** got id token with lenght of: ", newIdToken?.length ?? "no id token");
    
    if (newIdToken) {
        const firebaseApp = getFirebaseApp();

        const db = getFirestore(firebaseApp);
        return db;
    } else {
        throw new Error("**getDb** no id token");
    }
}