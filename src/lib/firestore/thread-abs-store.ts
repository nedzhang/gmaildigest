// lib/thread-abs-store.ts
"use server";

import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getDb } from "./firestore-auth";
import { StandardEmailThread, StandardEmailThreadSchema } from "@/types/gmail";
import { shallowCopyObjProperties } from "@/lib/object-util";
import logger, { createLogger, LogContext } from "@/lib/logger";
import { objectCollections } from "./firestore-utils";
import { getEmailAbstract } from "./email-abs-store";

export async function getThreadAbstract(
  logContext: LogContext,
  userId: string,
  threadKey: string
): Promise<StandardEmailThread | undefined> {
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.threadAbstracts(userId), threadKey);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? StandardEmailThreadSchema.parse(docSnap.data()) : undefined;
}

export async function setThreadAbstract(
  logContext: LogContext,
  userId: string,
  threadKey: string,
  data: StandardEmailThread
): Promise<void> {
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.threadAbstracts(userId), threadKey);
  const limitedData = shallowCopyObjProperties(data, [
    "dbThreadKey",
    "summary",
    "messageIds",
    "snippet",
  ]);

  const functionLogger = createLogger(logContext, 
    {module: "thread-abs-store", function: "setThreadAbstract", additional: {userId, threadKey}});

  const parsedData = StandardEmailThreadSchema.partial().parse(limitedData);
  
  functionLogger.debug(
    { threadKey },
    `Saving thread ${threadKey} for user ${userId}`
  );

  await setDoc(docRef, parsedData, { merge: true });
}

export async function listUserThreadAbs(
  logContext: LogContext,
  userId: string,
  loadMessages: boolean
): Promise<StandardEmailThread[]> {
  const db = await getDb(logContext);
  const collectionRef = collection(db, objectCollections.threadAbstracts(userId));
  const snapshot = await getDocs(collectionRef);

  return Promise.all(snapshot.docs.map(async docSnap => {
    const threadAbs = StandardEmailThreadSchema.parse(docSnap.data());
    
    if (loadMessages && threadAbs.messageIds) {
      threadAbs.messages = [];
      for (const messageId of threadAbs.messageIds) {
        const email = await getEmailAbstract(logContext, userId, messageId);
        if (email) threadAbs.messages.push(email);
      }
    }
    
    return threadAbs;
  }));
}
