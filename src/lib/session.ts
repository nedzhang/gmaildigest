'use server';

// lib/session.ts
// import { IronSessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { IronSession, SessionOptions, getIronSession } from "iron-session";

// export type UserSession = {
//     email: string;
//     name?: string;
//     // add other fields as needed
// };


export interface SessionData {
    userEmail: string,
    isLoggedIn: boolean,
}

const defaultSession: SessionData = {
    userEmail: '',
    isLoggedIn: false,
};

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
    
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  
    // If user visits for the first time session returns an empty object.
    // Let's add the isLoggedIn property to this object and its value will be the default value which is false
    if (!session.isLoggedIn) {
      session.isLoggedIn = defaultSession.isLoggedIn;
    }
  
    return session;
  }