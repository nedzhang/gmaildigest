// lib/user-store.ts
"use server";

import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "./firestore-auth";
import { OAuthTokenSchema, UserSecurityProfile, UserSecurityProfileSchema } from "@/types/firebase";
import { shallowCopyObjProperties } from "@/lib/object-util";
import logger, { LogContext } from "@/lib/logger";
import { objectCollections } from "./firestore-utils";

export async function updateUser(
  logContext: LogContext,
  user: UserSecurityProfile
): Promise<void> {
  if (!user.login_email) throw new Error("User email required for update");

  const db = await getDb(logContext);
  const userDoc = doc(db, objectCollections.users(), user.login_email);
  const userUpdate = shallowCopyObjProperties(user, [
    "full_name",
    "preferred_name",
    "communication_email",
    "email_verified",
  ]);

  userUpdate.updated = Date.now();
  userUpdate.accessed = Date.now();

  await updateDoc(userDoc, userUpdate);
}

export async function getUser(
  logContext: LogContext,
  userId: string
): Promise<UserSecurityProfile | undefined> {
  const db = await getDb(logContext);
  const [userDocRef, tokensRef] = [
    doc(db, objectCollections.users(), userId),
    collection(db, objectCollections.tokens(userId))
  ];

  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) return undefined;

  const userData = UserSecurityProfileSchema.parse(userDoc.data());
  const tokens = (await getDocs(tokensRef)).docs.map(doc =>
    OAuthTokenSchema.parse(doc.data())
  );

  userData.tokens = tokens;
  userData.latest_token = tokens.find(t => t.db_id === userData.latest_token_id);
  return userData;
}
