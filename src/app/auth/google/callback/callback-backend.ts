'use server'

import { processGoogleOAuth2Callback } from "@/lib/oauth2-util";
import { GoogleOAuthToken } from "@/lib/schema";
import { upsertUserToken } from "@/lib/firestore-util";

export async function googleOAuth2Callback(callbackUrl: string, code: string): Promise<void> {

  const userAuthToken = await processGoogleOAuth2Callback({ callbackUrl }, code);

  if (userAuthToken) {
    await saveGoogleTokenToFirestore(userAuthToken);
  }
}

async function saveGoogleTokenToFirestore(token: GoogleOAuthToken) {
  const userEmail = token.payload?.email;

  if (!userEmail) {
    throw new Error('**saveGoogleTokenToFirestore** User email not found in token payload');
  } else {
    await upsertUserToken(token);
  }
}


