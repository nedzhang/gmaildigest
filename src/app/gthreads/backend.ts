'use server'

import { retrieveUserThreads } from "@/lib/gmail-util";
import logger, { LogContext } from "@/lib/logger";
import { getSession } from "@/lib/session";
import { GmailThread } from "@/types/gmail";
import { promises as fs  } from "fs";
import path from "path";

export async function getCurrentUserEmailThread( requestId: string ): Promise<GmailThread[] | undefined> {
    const session = await getSession();

    if (!session.userEmail) {
      throw new Error('**api/threads/threadid** User not logged in');
    }

    // Call the function to retrieve threads for the specified user
    const userThreads = await retrieveUserThreads( 
      { requestId,}, session.userEmail);

    // for testing purpose, we will store all the threads in file system 
    // in file email/thread.id.json

    userThreads?.forEach(async (thread) => {
       const filePath = path.join(process.cwd(), 'email-store', `thread-${thread.id}.json`);

       const fileContent = JSON.stringify(thread, null, 2);
       logger.info(`**getCurrentUserEmailThread** Writing thread ${thread.id} to ${filePath}`);
       await fs.writeFile(filePath, fileContent);
    });
    
    return userThreads;
}