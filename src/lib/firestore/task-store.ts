// lib/thread-abs-store.ts
"use server";

import { arrayUnion, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDb } from "./firestore-auth";

import { createLogger, LogContext } from "@/lib/logger";
import { objectCollections } from "./firestore-utils";
import { AppAction, Comment, Task, TaskSchema } from "@/lib/taskboard/vikunja-schema";

export async function getTaskAbs(
  logContext: LogContext,
  taskId: string
): Promise<Task | undefined> {
  const functionLogger = createLogger(logContext, {
    module: 'task-store',
    function: 'getTaskAbs',
  })
  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.tasks(), taskId);
  const docSnap = await getDoc(docRef);
  functionLogger.debug({ docSnap_exists: docSnap.exists(), double_bang_docSnap_data: !!docSnap.data(), docSnap_data: docSnap.data() }, `retrieved snap for task: ${taskId}.`);



  return docSnap.exists() ? TaskSchema.parse(docSnap.data()) : undefined;
}

export async function setTaskAbs(
  logContext: LogContext,
  taskId: string,
  data: Partial<Task>
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


export async function addTaskComment(logContext: LogContext,
  taskId: string,
  comment: Comment) {

  const functionLogger = createLogger(logContext, {
    module: "task-store", function: "appendTaskComment",
    additional: { taskId, comment }
  })

  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.tasks(), taskId);

  await updateDoc(docRef, {
    comments: arrayUnion(comment),
  })
}


export async function appendTaskAction(logContext: LogContext,
  taskId: string,
  action: AppAction) {

  const functionLogger = createLogger(logContext, {
    module: "task-store", function: "appendTaskAction",
    additional: { taskId, action }
  })

  const db = await getDb(logContext);
  const docRef = doc(db, objectCollections.tasks(), taskId);

  await updateDoc(docRef, {
    actions: arrayUnion(action),
  })
}
