'use server'

import { processGoogleOAuth2Callback } from "@/lib/oauth2-util";
import { updateUserLatestToken } from "@/lib/gduser-util";

import { getSession } from "@/lib/session";
import logger, { LogContext, makeLogEntry } from "@/lib/logger";


export async function googleOAuth2Callback(logContext: LogContext, callbackUrl: string, code: string): Promise<void> {

  const userAuthToken = await processGoogleOAuth2Callback({ callbackUrl }, code);

  if (userAuthToken) {

    const email = userAuthToken.payload?.email;

    if (!email) {
      throw new Error('**googleOAuth2Callback** User email not found in token payload');
    } else {
      
      await updateUserLatestToken(logContext, userAuthToken);

      // const cookieStore = await cookies();
      // const session = await getIronSession(cookieStore, sessionOptions);

      const session = await getSession();
      session.userEmail = email;
      session.isLoggedIn = true;
      await session.save();
      logger.info(makeLogEntry({
        ...logContext,
        time: Date.now(),
        module: 'callback-backend',
        function: 'googleOAuth2Callback',
      }, { session }, '**googleOAuth2Callback** session saved.'));

    }
  }
}


