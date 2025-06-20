import { ChildLogger, createLogger, LogContext } from "@/lib/logger";
import { TaskActionOutput } from "../schema/task";
import { appendTaskAction, getTaskAbs } from "@/lib/firestore/task-store";
import { AppAction, Task } from "@/lib/taskboard/vikunja-schema";
import { addTaskComment as addTaskCommentToPbDb, appendTaskDescription } from "@/lib/taskboard/vikunja-int";
import { truncateWords } from "@/lib/string-util";

const SHORTEN_DESCRIPTION_WORDS = 60;

// Action processor function
export async function processTaskNba(
    logContext: LogContext,
    task: Task,
    actionToPerform: AppAction,
    currentUser: string // User triggering the action
): Promise<void> {
    const functionLogger = createLogger(logContext, {
        module: 'task-action',
        function: 'processTaskNba',
    })
    const { action, payload, reason } = actionToPerform;

    functionLogger.info({ actionToPerform, task }, `Perform action on task. ${action} on ${task.id}`);

    switch (action) {
        case 'comment':
            if (payload.content) {
                const comment = payload.content;
                const commentAdded = await addTaskComment(logContext, task, comment);

                if (commentAdded.success) {
                    actionToPerform.created = commentAdded.data?.created;
                }
            } else {
                functionLogger.warn({ payload }, "Empty comment content - skipping");
            }
            break;

        case 'append':
            if (payload.content) {
                // 1. Append to task description
                const updateTaskResult = await appendTaskDescription(logContext, task.id, payload.content)

                if (!updateTaskResult.success) {
                    const errorMessage = `Failed to update description for task ${task.id}. Error: ${updateTaskResult.errorMessage}`;
                    functionLogger.error({ updateResult: updateTaskResult, description_to_update_to: task.description }, errorMessage);
                    throw Error(errorMessage);
                }


                // 2. Add system comment about update
                const shortenAppendContent = truncateWords(payload.content, SHORTEN_DESCRIPTION_WORDS); // take the first 50 words from content of append to put into comment

                const comment = `@${currentUser} updated the description via AI suggestion:\n${shortenAppendContent}`;

                const commentAdded = await addTaskComment(logContext, task, comment);

                if (commentAdded.success) {
                    actionToPerform.created = commentAdded.data?.created;
                }

            } else {
                functionLogger.warn({ payload }, "Empty append content - skipping");
            }
            break;

        case 'upload':
            throw new Error('**no upload** Upload action is not implemented yet.')
        //   if (payload.filename && payload.content) {
        //     await db.attachFileToTask(taskId, payload.filename, payload.content);

        //     // Add comment about file upload
        //     const comment = `@AI uploaded file: ${payload.filename}`;
        //     await db.addCommentToTask(taskId, comment, 'ai');
        //   } else {
        //     console.warn("Missing filename or content for upload - skipping");
        //   }
        //   break;

        case 'email':
            if (payload.to && payload.subject && payload.content) {
                // await emailService.sendEmail(payload.to, payload.subject, payload.content);
                //add function to send email 

                // Add comment about email sent
                const comment = `@AI sent email to ${payload.to}:\nSubject: ${payload.subject}\n${payload.content}`;
                const commentAdded = await addTaskComment(logContext, task, comment);

                if (commentAdded.success) {
                    actionToPerform.created = commentAdded.data?.created;
                }
            } else {
                functionLogger.warn({ payload }, "Missing email parameters - skipping");
            }
            break;

        case 'nothing':
            functionLogger.info({ task }, `No action taken for task ${task.id}`);
            // Optionally log this to database
            break;

        default:
            functionLogger.error({ action }, `Unknown action type: ${action as string}`);
            throw new Error('Unknown action type');
    }

    if (actionToPerform.action !== 'nothing') {
        await appendTaskAction(logContext, task.id.toString(), actionToPerform);
    }
}

async function addTaskComment(logContext: LogContext, task: Task, comment: string) {

    const functionLogger = createLogger(logContext, {
        module: 'task-action',
        function: 'addTaskComment',
    });

    const addCommentResult = await addTaskCommentToPbDb(logContext, task.id,
        {
            comment
        }
    );

    if (!addCommentResult.success) {
        const errorMessage = `Failed to add comment for task ${task.id}. Error: ${addCommentResult.errorMessage}`;
        functionLogger.error({ addCommentResult, comment }, errorMessage);
        throw Error(errorMessage);
    } else {
        functionLogger.debug({ comment }, `task-action added ai generate comment to task: ${task.id}`);
    }

    return addCommentResult;
}
