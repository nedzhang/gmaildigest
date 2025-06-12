// lib/token-store.ts
"use server";

import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "./firestore-auth";
import { OAuthToken } from "@/types/firebase";
import logger, { createLogger, LogContext } from "@/lib/logger";
import { objectCollections } from "./firestore-utils";

export async function addExpirationTimestamps(tokens: OAuthToken): Promise<OAuthToken> {
  const now = Math.floor(Date.now() / 1000);
  const enhancedTokens = { ...tokens };

  if (tokens.expires_in && !enhancedTokens.expires_at) {
    enhancedTokens.expires_at = now + tokens.expires_in;
  }

  if (tokens.refresh_token_expires_in && !enhancedTokens.refresh_token_expires_at) {
    enhancedTokens.refresh_token_expires_at = now + tokens.refresh_token_expires_in;
  }

  return enhancedTokens;
}

export async function updateToken(
  logContext: LogContext,
  userId: string,
  tokenId: string,
  tokenSet: OAuthToken
): Promise<OAuthToken> {

  const functionLogger = createLogger(logContext,
    { module: "token-store", function: "updateToken", additional: { userId, tokenId } });

  if (!tokenSet) throw new Error("Missing token data");

  const db = await getDb(logContext);
  const tokenDoc = doc(db, objectCollections.tokens(userId), tokenId);
  const updatedTokens = await addExpirationTimestamps(tokenSet);

  functionLogger.info(
    { userId, tokenId },
    `Updating token for user ${userId}, token ${tokenId}`
  );

  await updateDoc(tokenDoc, updatedTokens);
  return updatedTokens;
}

export async function updateUserLatestToken(
  logContext: LogContext,
  tokenSet: OAuthToken
): Promise<OAuthToken> {
  const userEmail = tokenSet.payload?.email;
  if (!userEmail) throw new Error("User email missing in token payload");

  const db = await getDb(logContext);
  const updatedToken = await addExpirationTimestamps(tokenSet);

  const tokenDoc = await addDoc(
    collection(db, objectCollections.tokens(userEmail)),
    updatedToken
  );
  await updateDoc(tokenDoc, { db_id: tokenDoc.id });

  await setDoc(
    doc(db, objectCollections.users(), userEmail),
    {
      login_email: userEmail,
      latest_token_id: tokenDoc.id,
      updated: Date.now(),
    },
    { merge: true }
  );

  return updatedToken;
}
