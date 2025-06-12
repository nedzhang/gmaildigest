// lib/email-abs-store.ts
"use server";

import { doc, deleteDoc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "./firestore-auth";
import { StandardEmail, StandardEmailSchema } from "@/types/gmail";
import logger, { createLogger, LogContext } from "@/lib/logger";
import { objectCollections } from "./firestore-utils";

export async function getEmailAbstract(
  logContext: LogContext,
  userId: string,
  emailId: string
): Promise<StandardEmail | undefined> {
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.emailAbstracts(userId), emailId);
  return (await getDoc(docRef)).data() as StandardEmail;
}

export async function setEmailAbstract(
  logContext: LogContext,
  userId: string,
  emailId: string,
  emailAbs: StandardEmail
): Promise<void> {
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.emailAbstracts(userId), emailId);
  const parsedData = StandardEmailSchema.partial().parse(emailAbs);
  const functionLogger = createLogger(logContext, 
    {module: 'email-abs-store', function: 'setEmailAbstract',
      additional: {userId, emailId}
    },
  )

  if (parsedData.attachments) {
    parsedData.attachments = parsedData.attachments.map(({ data, ...rest }) => rest);
  }

  functionLogger.info({ emailId }, `Saving email abstract for user: ${userId}`);

  await setDoc(docRef, parsedData, { merge: true });
}

export async function deleteEmailAbstract(
  logContext: LogContext,
  userId: string,
  emailId: string
): Promise<void> {
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.emailAbstracts(userId), emailId);
  await deleteDoc(docRef);
}
