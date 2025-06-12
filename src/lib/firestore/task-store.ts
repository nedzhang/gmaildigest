// lib/thread-abs-store.ts
"use server";

import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { getDb } from "./firestore-auth";
import { StandardEmailThread, StandardEmailThreadSchema } from "@/types/gmail";
import { shallowCopyObjProperties } from "@/lib/object-util";
import logger, { createLogger, LogContext } from "@/lib/logger";
import { objectCollections } from "./firestore-utils";
import { getEmailAbstract } from "./email-abs-store";
import { Task, TaskSchema } from "@/lib/taskboard/vikunja-schema";

export async function getTaskAbs(
  logContext: LogContext,
  taskId: string
): Promise<Task | undefined> {
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.tasks(), taskId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? TaskSchema.parse(docSnap.data()) : undefined;
}

export async function setTaskAbs(
  logContext: LogContext,
  taskId: string,
  data: Task
): Promise<void> {

  const functionLogger = createLogger(logContext, {
    module: "task-store", function: "setTask",
    additional: { taskId }
  })

  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.tasks(), taskId);

  const parsedData = TaskSchema.partial().parse(data);

  functionLogger.debug(
    { taskId, data },
    `Saving task ${taskId}`
  );

  await setDoc(docRef, parsedData, { merge: true });
}

