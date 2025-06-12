import { getTaskAbs } from "@/lib/firestore/task-store";
import logger, { createLogger, LogContext } from "@/lib/logger";

export async function reviewTaskList(logContext: LogContext, taskList: number[]) {

  const functionLogger = createLogger(logContext, {
    module: 'notification-test',
    function: 'reviewTaskList',
    additional: { taskList },
  })

  for (const taskId of taskList) {
    const taskAbs = await getTaskAbs(logContext, taskId.toString());
    functionLogger.debug(
      { taskAbs },
      `**reviewTaskList** reviewing task: ${taskId}`
    );
  }
}
