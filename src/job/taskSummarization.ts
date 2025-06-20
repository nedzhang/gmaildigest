import { getTaskAbs } from "@/lib/firestore/task-store";
import logger, { createLogger, LogContext } from "@/lib/logger";

// Prototype code to review a list of tasks in the background. No longer correct and not used yet.
// Should use hydrate task. 
export async function nbaTaskList(logContext: LogContext, taskIdList: number[]) {

  const functionLogger = createLogger(logContext, {
    module: 'notification-test',
    function: 'nbaTaskList',
    additional: { taskList: taskIdList },
  })

  for (const taskId of taskIdList) {
    const taskAbs = await getTaskAbs(logContext, taskId.toString());
    functionLogger.debug(
      { taskAbs },
      `**nbaTaskList** reviewing task: ${taskId}`
    );

    // get the task from firestore
    
  }
}
