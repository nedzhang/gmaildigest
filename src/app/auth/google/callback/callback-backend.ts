'use server'

import { processGoogleOAuth2Callback } from "@/lib/oauth2-util";

import { getSession } from "@/lib/session";
import logger, { createLogger, LogContext } from "@/lib/logger";
import { updateUserLatestToken } from "@/lib/firestore/token-store";


export async function googleOAuth2Callback(logContext: LogContext, callbackUrl: string, code: string): Promise<void> {

  const functionLogger = createLogger(logContext, {
    module: 'callback-backend',
    function: 'googleOAuth2Callback',
    additional: {
      callbackUrl
    }
  })

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
      functionLogger.info({ session }, '**googleOAuth2Callback** session saved.');

    }
  }
}


