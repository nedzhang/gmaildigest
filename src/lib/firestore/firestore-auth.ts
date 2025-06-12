"use server";

import admin from "firebase-admin";
import { App, getApps as getAdminApps, ServiceAccount } from "firebase-admin/app";
import {
    FirebaseApp,
    getApps as getFirebaseApps,
    initializeApp,
} from "firebase/app";
import {
    Auth,
    getAuth,
    signInWithCustomToken,
    UserCredential,
} from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseServiceAccount } from "@/types/firebase";
import SERVICE_ACCOUNT from "../../../secret/firebase-admin-service-account.json";
import logger, { createLogger, LogContext } from "../logger";

// Firebase client configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

// Authentication state
let authInstance: Auth;
let userCredential: UserCredential;

let firestoreDb: Firestore | undefined;

/**
 * Initializes and returns the Firebase Admin app instance
 * @returns {admin.App} Initialized Firebase Admin app
 * @throws {Error} If admin app initialization fails
 */
function initializeAdminApp(): App {
    if (!getAdminApps().length) {
        admin.initializeApp({
            credential: admin.credential.cert(SERVICE_ACCOUNT as ServiceAccount),
        });
    }

    const adminApps = getAdminApps();
    if (adminApps.length === 0) {
        throw new Error("**initializeAdminApp** Firebase Admin app initialization failed - no apps available");
    }

    return adminApps[0];
}

/**
 * Initializes and returns the Firebase client app instance
 * @returns {FirebaseApp} Initialized Firebase client app
 * @throws {Error} If client app initialization fails
 */
function initializeFirebaseApp(): FirebaseApp {

    if (!getFirebaseApps().length) {
        initializeApp(firebaseConfig);
    }

    const firebaseApps = getFirebaseApps();
    if (firebaseApps.length === 0) {
        throw new Error("**initializeFirebaseApp** Firebase client app initialization failed - no apps available");
    }

    return firebaseApps[0];
}

/**
 * Authenticates with Firebase using a service account
 * @param {LogContext} logContext - Logging context metadata
 * @param {FirebaseApp} app - Firebase client app instance
 * @param {FirebaseServiceAccount} serviceAccount - Service account credentials
 * @returns {Promise<{auth: Auth, userCred: UserCredential}>} Authentication objects
 */
async function authenticateWithServiceAccount(
    logContext: LogContext,
    app: FirebaseApp,
    serviceAccount: FirebaseServiceAccount
): Promise<{ auth: Auth; userCred: UserCredential }> {
    const uid = serviceAccount.client_email;

    const functionLogger = createLogger(logContext, {
        ...logContext,
        module: 'firestore-auth',
        function: 'authenticateWithServiceAccount',
    });

    functionLogger.info(
        {},
        `**authenticateWithServiceAccount** Initiating authentication for service account: ${uid}`
    );

    const customToken = await admin.auth().createCustomToken(uid);
    const auth = getAuth(app);
    const userCred = await signInWithCustomToken(auth, customToken);

    return { auth, userCred };
}

/**
 * Main authentication entry point
 * @param {LogContext} logContext - Logging context metadata
 * @returns {Promise<{auth: Auth, userCred: UserCredential}>} Authentication objects
 */
async function performSignIn(logContext: LogContext): Promise<{ auth: Auth; userCred: UserCredential }> {
    initializeAdminApp();
    const firebaseClientApp = initializeFirebaseApp();
    return authenticateWithServiceAccount(logContext, firebaseClientApp, SERVICE_ACCOUNT);
}

/**
 * Retrieves authenticated Firestore instance
 * @param {LogContext} logContext - Logging context metadata
 * @returns {Promise<Firestore>} Initialized Firestore instance
 * @throws {Error} If authentication fails or ID token is unavailable
 */
export async function getDb(logContext: LogContext, forceNew: boolean = false, reAuth: boolean = false): Promise<Firestore> {

    const functionLogger = createLogger(logContext,
        { module: "firestore-auth", function: "getDb", additional: { forceNew, reAuth } }
    );

    // Reuse existing auth if available
    if (reAuth || !authInstance || !userCredential) {
        const { auth: newAuth, userCred: newUserCred } = await performSignIn(logContext);
        authInstance = newAuth;
        userCredential = newUserCred;

        functionLogger.trace(
            {
                currentUser: authInstance.currentUser?.uid,
                userCredential: userCredential.user.uid
            },
            "**getDb** Successfully established authentication"
        );
    }

    // Verify valid authentication token
    const idToken = await authInstance.currentUser?.getIdToken();

    functionLogger.trace(
        { tokenLength: idToken?.length || 0 },
        "**getDb** Retrieved firebase authentication token"
    );

    if (!idToken) {
        throw new Error("**getDb** Failed to obtain valid authentication token");
    }

    // check if we need to initialize the firestore
    if (!firestoreDb || forceNew) {
        firestoreDb = getFirestore(initializeFirebaseApp());
    }

    return firestoreDb;
}