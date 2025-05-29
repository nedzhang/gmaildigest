"use server";

// lib/session.ts
// import { IronSessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { generateId } from "./uid-util";

// export type UserSession = {
//     email: string;
//     name?: string;
//     // add other fields as needed
// };

export interface SessionData {
    userEmail: string;
    isLoggedIn: boolean;
    sessionId: string;
    createdAt: number;
    lastActiveAt: number;
    expiresAt: number;
}

const defaultSession: SessionData = {
    userEmail: "",
    isLoggedIn: false,
    sessionId: "",
    createdAt: 0,
    lastActiveAt: 0,
    expiresAt: 0,
};

function initiateSession(ironSession: IronSession<SessionData> ): void {
    const nowInMilliseconds = Date.now();

    ironSession.isLoggedIn = false;
    ironSession.sessionId = "s#" + generateId();
    ironSession.createdAt = nowInMilliseconds;
    ironSession.lastActiveAt = nowInMilliseconds;
    // createdAt: nowInMilliseconds,
    // lastActiveAt: nowInMilliseconds,
    // expiresAt: nowInMilliseconds + 1000 * 60 * 60 * 24 * 7, // 7 days
}

const sessionOptions: SessionOptions = {
    // You need to create a secret key at least 32 characters long.
    password: process.env.IRON_SESSION_SECRET!,
    cookieName: "gmail-digest-user-session",
    cookieOptions: {
        httpOnly: true,
        // Secure only works in `https` environments. So if the environment is `https`, it'll return true.
        secure: process.env.NODE_ENV === "production",
    },
};

export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(
        cookieStore,
        sessionOptions,
    );

    // If user visits for the first time session returns an empty object.
    // Let's add the isLoggedIn property to this object and its value will be the default value which is false
    if (!session.isLoggedIn) {
        initiateSession(session);
    }

    return session;
}
