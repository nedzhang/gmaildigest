'use server'

import { retrieveUserThreads } from "@/lib/gmail-util";
import { getSession } from "@/lib/session";
import { GmailThread } from "@/types/gmail";

export async function getCurrentUserEmailThread(): Promise<GmailThread[] | undefined> {
    const session = await getSession();

    if (!session.userEmail) {
      throw new Error('**api/threads/threadid** User not logged in');
    }

    // Call the function to retrieve threads for the specified user
    const userThreads = await retrieveUserThreads(session.userEmail);

    return userThreads;
}