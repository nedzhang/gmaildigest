'use server'

import { processGoogleOAuth2Callback } from "@/lib/oauth2-util";
import { updateUserOAuthToken } from "@/lib/firestore-util";

import { getSession } from "@/lib/session";


export async function googleOAuth2Callback(callbackUrl: string, code: string): Promise<void> {

  const userAuthToken = await processGoogleOAuth2Callback({ callbackUrl }, code);

  if (userAuthToken) {

    const email = userAuthToken.payload?.email;

    if (!email) {
      throw new Error('**googleOAuth2Callback** User email not found in token payload');
    } else {
      
      await updateUserOAuthToken(userAuthToken);

      // const cookieStore = await cookies();
      // const session = await getIronSession(cookieStore, sessionOptions);

      const session = await getSession();
      session.userEmail = email;
      session.isLoggedIn = true;
      await session.save();
      console.log('**googleOAuth2Callback** session saved: ', session);

    }
  }
}


