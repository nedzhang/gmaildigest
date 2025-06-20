import { jsonifyError } from '@/lib/error-util';
import { getTaskAbs as getTaskFromDB } from '@/lib/firestore/task-store';
import { createLogContext, createLogger, LogContext } from '@/lib/logger';
import { TokenRequestError } from '@/lib/taskboard/vikunja-auth';
import { getNotifications, getTask as getTaskFromPB } from '@/lib/taskboard/vikunja-int';
import { NotificationsArray, Task } from '@/lib/taskboard/vikunja-schema';
import { NextRequest, NextResponse } from 'next/server';
import { nbaTaskList } from '@/job/taskSummarization';
import { deepMergeObjects as deepMergeObjects } from '@/lib/object-util';

const MAX_PAGES = 200; // Safeguard against infinite loops

export async function GET(req: NextRequest) {
  const logContext = createLogContext({ req });

  try {
    const taskList: number[] | undefined = await processNotifications(logContext);

    if (taskList) {
      await processTasks(logContext, taskList);
    }
    return NextResponse.json(taskList); // Return aggregated results

  } catch (error) {
    const err = error as TokenRequestError;
    return NextResponse.json({
      error: jsonifyError(error)
    }, { status: (err && err.code) || 500 });
  }
}

async function processNotifications(logContext: LogContext) {

  let pageNumber = 1;

  const taskList: number[] = [];

  while (pageNumber <= MAX_PAGES) {
    const notifications = await getNotifications(logContext, pageNumber);

    if (notifications.success) {
      // Break conditions: invalid response or empty array
      if (!Array.isArray(notifications.data) || notifications.data.length === 0) {
        break;
      }
      await addToTaskList(notifications.data, taskList);
      pageNumber++;
    } else {
      throw new Error(`Failed while retreiving notification list. ${notifications.errorMessage}`);
    }
  }

  return taskList && taskList.length > 0 ? taskList : undefined;

}

async function addToTaskList(notifications: NotificationsArray, taskList: number[]) {
  await Promise.all(notifications.map((n: any) => {
    
    if (n?.name && (n.name === 'task.comment' || n.name === 'task.mentioned')) {
      const taskId = n?.notification?.task?.id;
      if (taskId) taskList.push(taskId);
    }
  }));
}

async function processTasks(logContext: LogContext, taskList: number[]) {

  const functionLogger = createLogger(logContext, {
    module: 'notification-test',
    function: 'processTasks',
    additional: { taskList }
  })

  for (const taskId of taskList) {
    // get task from project board.
    await loadTask(logContext, taskId);
  }

  // now all the tasks should be in firestore now. we call a function review them.

  nbaTaskList(logContext, taskList);

}


/**
 * Load task from project board first then load the task from the firestore. merge/hydrate 
 * both tasks to create the hydrated task object
 * @param logContext 
 * @param taskId 
 * @param functionLogger 
 */
async function loadTask(logContext: LogContext, taskId: number) {

  const functionLogger = createLogger(logContext, {
    module: 'notification-test',
    function: 'loadTask',
  });

  const apiResult = await getTaskFromPB(logContext, taskId);

  functionLogger.debug(
    { apiResult },
    `**processTasks** processing task: ${taskId}`
  );

  if (apiResult?.success && apiResult?.data) {
    const taskFromPb = apiResult.data;
    const taskFromDb = await getTaskFromDB(logContext, taskId.toString())

    // Now we need merge taskFromPb and taskFromDb
    const hydratedTask = deepMergeObjects(taskFromDb, taskFromPb);

  }
  // // save the task to firestore
  // if (apiResult?.success && apiResult?.data) {
  //   await setTaskAbs(logContext, taskId.toString(), apiResult.data as Task);
  // }

  functionLogger.debug(
    { apiResult },
    `**processTasks** saved to firestore task: ${taskId}`
  );
}

