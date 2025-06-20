// vikunja-int.ts
import logger, { createLogger, LogContext } from '@/lib/logger';
import { ApiResponseResult, parseApiResponse } from '@/lib/api-util';
import { Comment, CommentSchema, KanbanBucketArraySchema, NotificationsArraySchema, ProjectsArraySchema, Task, TaskSchema } from './vikunja-schema';
import { getVikunjaToken } from './vikunja-auth';
import { ZodSchema } from 'zod';
import { addTaskComment as addTaskCommentToDb, getTaskAbs, setTaskAbs } from '../firestore/task-store';
import { deepMergeObjects } from '../object-util';
import { extractText } from '../extract-text-util';
import { summarizeText } from '@/ai/flows/summarize-text';
import { jsonifyError } from '../error-util';
import { compareMarkdown, htmlToMarkdown, markdownToHtml } from '../markdown-html-util';

const VIKUNJA_API_TIMEOUT = 10000;
const VIKUNJA_API_URL = process.env.VIKUNJA_API_URL!; // Ensured by deployment validation

/**
 * Configuration interface for Vikunja API requests
 * @template T - Expected response type (inferred from Zod schema)
 * @param logContext - Logging context object
 * @param functionName - Name of calling function for logs
 * @param endpoint - API endpoint path (e.g., '/notifications')
 * @param method - HTTP method ('GET' by default)
 * @param queryParams - Optional query parameters
 * @param body - Optional request body
 * @param schema - Zod schema for response validation
 */
interface VikunjaRequestConfig<T> {
    logContext: LogContext;
    functionName: string;
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    queryParams?: Record<string, string> | Array<[string, string]>,
    body?: unknown;
    schema: ZodSchema<T>;
}

/**
 * Makes authenticated requests to the Vikunja API
 * - Handles token management, logging, and response validation
 * - Ensures consistent request/response handling across endpoints
 * 
 * @template T - Expected response type
 * @param config - Request configuration object
 * @returns Promise resolving to validated response data
 */
async function vikunjaRequest<T>(config: VikunjaRequestConfig<T>): Promise<ApiResponseResult<T>> {
    // Extract configuration with defaults
    const {
        logContext,
        functionName,
        path,
        method = 'GET',
        queryParams,
        body,
        schema
    } = config;

    const functionLogger = createLogger(logContext, {
        module: 'vikunja-int',
        function: functionName,
    })

    try {
        // Retrieve authentication token
        const tokenHolder = await getVikunjaToken(logContext);

        // Construct full URL with query params
        const url = new URL(path, VIKUNJA_API_URL);
        if (queryParams) {
            url.search = new URLSearchParams(queryParams).toString();
        }

        // Prepare request options
        const requestOptions: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenHolder.token}`,
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(VIKUNJA_API_TIMEOUT),
            body: body ? JSON.stringify(body) : undefined
        };

        // if (!!body) requestOptions.body = JSON.stringify(body);
        // Log outgoing request
        functionLogger.debug(
            { url, method },
            `Invoking Vikunja API: ${method} ${url} ...`
        );

        // Execute network request
        const response = await fetch(url.toString(), requestOptions);

        // Parse and validate response
        const result = await parseApiResponse(response, schema,
            // value needs to be not null not undefined and not a string looks like iso date with with year less than 1000 (Vikunja sends "0001-01-01T00:00:00Z" for null date)
            v => v !== null && v !== undefined && (!(typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?Z$/.test(v) && parseInt(v.substring(0, 4)) < 1000))
        );

        // Log parsed response
        functionLogger.debug(
            { status: response.status, result },
            `Received API response status: ${response.status} success: ${result.success}`
        );

        return result;

    } catch (error) {
        // Log error with original message and context
        functionLogger.error(
            { error },
            `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        throw error; // Propagate for callers to handle
    }
}

// --- Public API Functions --- //

/**
 * Fetches paginated notifications from Vikunja API
 * 
 * @param logContext - Logging context
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 100)
 * @returns Array of validated notification objects
 */
export async function getNotifications(
    logContext: LogContext,
    page = 1,
    perPage = 25
) {
    return vikunjaRequest({
        logContext,
        functionName: 'getNotifications',
        path: 'notifications',
        queryParams: {
            page: page.toString(),
            per_page: perPage.toString()
        },
        schema: NotificationsArraySchema
    });
}

/**
 * Fetches a single task by its ID
 * 
 * @param logContext - Logging context
 * @param taskId - Numerical task identifier
 * @returns Validated task object
 */
export async function getTask(
    logContext: LogContext,
    taskId: number
) {
    const task = await vikunjaRequest({
        logContext,
        functionName: 'getTask',
        path: `tasks/${taskId}`,
        queryParams: [
            ['expand', 'comments'],
            ['expand', 'buckets'],
        ],
        schema: TaskSchema
    });

    // convert description from html to markdown (we are using markdown throughout the applicaiton.)
    if (task && task.success && task.data?.description) {
        task.data.description = await htmlToMarkdown(task.data.description);
    }

    // convert all comments from html to markdown
    if (task && task.success && task.data?.comments && task.data.comments.length > 0) {
        await Promise.all(task.data.comments.map(async (c) => {
            if (c.comment) {
                c.comment = await htmlToMarkdown(c.comment);
            }
        }));
    }

    return task;
}


/**
 * Fetches paginated projects from Vikunja API
 * 
 * @param logContext - Logging context
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 25)
 * @returns Array of validated project objects
 */
export async function listProjects(
    logContext: LogContext,
    page = 1,
    perPage = 25
) {
    return vikunjaRequest({
        logContext,
        functionName: 'listProjects',
        path: 'projects',
        queryParams: {
            page: page.toString(),
            per_page: perPage.toString()
        },
        schema: ProjectsArraySchema
    });
}


export async function getBucketsInProject(
    logContext: LogContext,
    projectId: number,
    viewId: number,
    page = 1,
    perPage = 50
) {
    return vikunjaRequest({
        logContext,
        functionName: 'getTasksInProject',
        path: `projects/${projectId}/views/${viewId}/tasks`,
        queryParams: {
            page: page.toString(),
            per_page: perPage.toString()
        },
        schema: KanbanBucketArraySchema
    });
}

export async function getAttachment(
    logContext: LogContext,
    taskId: number,
    attachmentId: number,
): Promise<{ mimeType: string; base64: string }> {

    const functionLogger = createLogger(logContext, {
        module: 'vikunja-int',
        function: 'getAttachment',
    })

    const tokenHolder = await getVikunjaToken(logContext);

    const requestOptions: RequestInit = {
        method: 'GET',
        headers: {
            // Remove Content-Type: we're receiving binary data
            'Authorization': `Bearer ${tokenHolder.token}`,
        },
        cache: 'no-store', // Recommended for binary data requests
    };

    const response = await fetch(
        `${VIKUNJA_API_URL}tasks/${taskId}/attachments/${attachmentId}`,
        requestOptions
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`**getAttachment vik** API error: ${response.status} ${response.statusText}\n${errorBody}`);
    }

    // Extract MIME type from headers (fallback for binary data)
    const mimeType = response.headers.get('content-type') || 'application/octet-stream';

    // Get binary data as ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();

    // Convert to base64 using Node.js Buffer
    const base64 = Buffer.from(arrayBuffer).toString('base64'); // should this be base64url?

    return { mimeType, base64 };

}

/**
 * Get a hydrated task by combining task in project board and database. 
 * If any attachment is not summarized yet, this function would summarize the document as well.
 * @param logContext 
 * @param taskId 
 * @returns 
 */
export async function hydrateTask(logContext: LogContext, taskId: number) {

    const functionLogger = createLogger(logContext, {
        module: 'preprocessProject',
        function: 'getHydratedTask',
    });

    // get the latest version of task from project board
    const apiResult = await getTask(logContext, taskId);

    if (!apiResult.success) {

        functionLogger.error({ apiResult }, `failed to retriev task from project board for taskid: ${taskId}`)
        throw new Error(`failed to retriev task from project board for taskid: ${taskId}`);
    }

    const taskFromPb = apiResult.data;
    const taskFromDb = await getTaskAbs(logContext, taskId.toString());

    const descriptionChanged = ! await compareMarkdown(taskFromPb?.description, taskFromDb?.description, true);
    const commentsChanged = ((taskFromPb?.comments?.length || 0) !== (taskFromDb?.comments?.length || 0));
    const attachmentChanged = ((taskFromPb?.attachments?.length || 0) !== (taskFromDb?.attachments?.length || 0));

    let taskCacheUpdated = descriptionChanged || commentsChanged || attachmentChanged;


    // Now we need merge taskFromPb and taskFromDb
    const hydratedTask: Task = deepMergeObjects(taskFromDb, taskFromPb);

    functionLogger.trace({ taskFromDb, taskFromPb, hydratedTask, taskCacheUpdated, descriptionChanged, commentsChanged, attachmentChanged }, `deepMerge completed. different versions of task logged.`);

    let summaryNeeded = false;

    // check if there is any attachment needs to be summarized first.
    if (hydratedTask.attachments && hydratedTask.attachments.length > 0) {
        for (const attach of hydratedTask.attachments) {

            if (!attach.file?.summary) {
                // we have file but not summary. let's summarize it
                functionLogger.info({ attach }, `attachment does not have summary. downloading and summarizing it task: ${taskId} attachment: ${attach.id}`);

                summaryNeeded = true;
                taskCacheUpdated = true;

                try {
                    const { mimeType, base64 } = await getAttachment(logContext, taskId, attach.id);

                    const fileAsText = await extractText(logContext, attach.file.name, mimeType, base64);

                    // TODO remove this log after dev
                    functionLogger.debug({ fileAsText }, `**processTasksInBucket** extracted text from ${attach.file.name} as ${mimeType}`);

                    const summary = await summarizeText({ filename: attach.file.name, mimetype: mimeType, text: fileAsText });

                    attach.file.summary = summary.summary;

                    functionLogger.info({ attach }, `attachment downloaded and summarized. task: ${taskId} attachment: ${attach.id}`);
                } catch (error) {
                    functionLogger.error({ error: jsonifyError(error) },
                        `Failed while processing attachment for task: ${taskId} attachment: ${attach.id} filename: ${attach?.file?.name || 'unknown'} `);
                }

            }
        }
    }

    functionLogger.debug({ taskCacheUpdated, descriptionChanged, commentsChanged, attachmentChanged, summaryNeeded },
        `After hydrate task, the taskCacheUpdated flag is ${taskCacheUpdated}`
    )

    if (taskCacheUpdated) {
        await setTaskAbs(logContext, taskId.toString(), hydratedTask);
    }

    hydratedTask['task_cache_updated'] = taskCacheUpdated;

    return hydratedTask;
}



// // src/lib/taskboard/vikunja-api.ts
// import { createLogger, LogContext } from "@/lib/logger";
// import { Task } from "@/lib/taskboard/vikunja-schema";

// const VIKUNJA_API_URL = process.env.VIKUNJA_API_URL || 'https://board.cogreq.paracognition.dev:7443/api/v1';
// const VIKUNJA_TOKEN = process.env.VIKUNJA_TOKEN; // Should be in environment variables

// if (!VIKUNJA_TOKEN) {
//     throw new Error('VIKUNJA_TOKEN is not defined in environment variables');
// }

interface TaskUpdatePayload {
    title?: string;
    description?: string;
    labels?: number[];
    due_date?: string | null;
    created_by?: {
        email?: string,
        id?: number,
        name?: string,
        username?: string
    },
}
// Add other updatable fields as needed

/**
 * Updates a Vikunja task. We are not exporting this function so we can control how to update task.
 * @param logContext Logger context
 * @param taskId Task ID to update
 * @param updates Partial task data to update
 */
async function updateTask(
    logContext: LogContext,
    taskId: number,
    updates: TaskUpdatePayload
) {
    return vikunjaRequest({
        logContext,
        functionName: 'updateTask',
        path: `tasks/${taskId}`,
        method: 'POST',
        body: updates,
        schema: TaskSchema
    });
}

export async function setTaskDescription(logContext: LogContext,
    taskId: number, descriptionInMarkdown: string) {

    const updateResult = await updateTask(logContext, taskId, {
        'created_by': {}, // we need to send this empty element to pass zod validaiton in vikunja.
        description: descriptionInMarkdown
    });

    // Update the description in db so we don't trigger another nba.
    if (updateResult.success) {
        const taskFromPb = updateResult.data;
        if (taskFromPb && taskFromPb.id && taskFromPb.description) {
            const descriptionMarkdownBasedOnPb = await htmlToMarkdown(taskFromPb?.description);
            setTaskAbs(logContext, taskFromPb.id.toString(),
                {
                    id: taskFromPb.id,
                    description: descriptionMarkdownBasedOnPb,
                });
        }
    }

    return updateResult;
}

export async function appendTaskDescription(logContext: LogContext,
    taskId: number, additionDescription: string) {

    // get the task from pb. the function converts description and comments
    // from html to markdown.
    const getTaskResult = await getTask(logContext, taskId);

    if (!getTaskResult.success) {
        return getTaskResult;
    }

    const task = getTaskResult.data;

    const currentDescription = task?.description ? task.description + '\n\n' : ''

    const descriptionInMarkdown = currentDescription + additionDescription;

    const updatedDescription = await markdownToHtml(descriptionInMarkdown);

    return setTaskDescription(logContext, taskId, updatedDescription);
}

/**
 * Adds a comment to a Vikunja task
 * @param logContext Logger context
 * @param taskId Task ID to comment on
 * @param commentObj the comment object (without author or id)
 */
export async function addTaskComment(
    logContext: LogContext,
    taskId: number,
    commentObj: Omit<Comment, 'author' | 'id'>
) {
    commentObj.created = new Date().toISOString();

    if (commentObj.comment) {
        commentObj.comment = await markdownToHtml(commentObj.comment.toString());
    }

    const addCommentApiResult = await vikunjaRequest({
        logContext,
        functionName: 'addComment',
        path: `tasks/${taskId}/comments`,
        method: 'PUT',
        body: commentObj,
        schema: CommentSchema
    });

    // put comments in our db.
    if (addCommentApiResult.success && addCommentApiResult.data) {
        const addedComment = addCommentApiResult.data;
        await addTaskCommentToDb(logContext, taskId.toString(), addedComment);
    }

    return addCommentApiResult
}
