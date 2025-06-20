// api/vikunjacallback/route.ts

"use server";

import { createLogContext, createLogger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { hydrateTask } from "@/lib/taskboard/vikunja-int";
import { nbaTaskFlow } from "@/ai/flows/nba-task";
import { formatError, jsonifyError } from "@/lib/error-util";
import { processTaskNba as executeTaskNba } from "@/ai/tool/task-action";

// Event types we handle (excluding deletions and project events)
const HANDLED_EVENTS = [
    'task.created',
    'task.comment.edited',
    'task.assignee.created',
    'task.attachment.created',
    'task.comment.created',
    'task.comment.deleted',
    'task.relation.created',
    'task.relation.deleted',
    'task.updated'
];

/**
 * Handles Vikunja webhook callbacks
 * 
 * Processes task-related events (excluding deletions) asynchronously 
 * by triggering AI review workflows
 * 
 * @route POST /api/vikunjacallback
 * @param req - Incoming request with webhook payload
 * @returns HTTP response acknowledging receipt
 */
export async function POST(req: NextRequest) {
    // Setup logging context
    const logContext = createLogContext({ req });
    const logger = createLogger(logContext, {
        module: 'vikunjacallback/route',
        function: 'POST',
    });

    try {
        // Parse incoming payload
        const { event, taskId } = await parseAndValidateRequest(req, logger);
        const eventLogger = logger.createChild({ additional: { event, taskId } });

        // Handle appropriate events
        if (isHandledEvent(event)) {
            // Process in background and return immediately
            void processTaskEvent(logContext, taskId!, eventLogger);
            eventLogger.info({ event, taskId }, `Processing event asynchronously: ${event}`);
        } else {
            eventLogger.info({ event, taskId }, `Skipping event: ${event}`);
        }

        return NextResponse.json({
            success: true,
            handler: 'api/vikunjacallback'
        });

    } catch (error: any) {
        // Global error handler
        const errorDetails = formatError(error);
        logger.error({ error: jsonifyError(error) },
            `Webhook processing failed: ${errorDetails}`);

        return NextResponse.json({
            success: false,
            error: "Internal server error",
        }, { status: 500 });
    }
}

/**
 * Parses and validates the incoming request
 * 
 * @throws Error on validation failures
 */
async function parseAndValidateRequest(
    req: NextRequest,
    logger: ReturnType<typeof createLogger>
): Promise<{ event: string; taskId?: number }> {
    const rawBody = await req.text();

    // Validate body exists
    if (!rawBody.trim()) {
        logger.error({ rawBody }, "Empty request body received");
        throw new Error('Empty request body');
    }

    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch (parseError) {
        logger.error({ rawBody }, "Failed to parse JSON body");
        throw new Error('Invalid JSON payload');
    }

    logger.info({ event: payload.event_name }, "Received webhook");

    // Validate payload structure
    if (!payload.event_name) {
        logger.error({ payload }, "Missing event_name in payload");
        throw new Error('Missing event_name');
    }

    // For task events, ensure task ID exists
    const event = payload.event_name;
    if (event.startsWith('task.') && event !== 'task.deleted') {
        if (!payload.data?.task?.id) {
            logger.error({ payload }, "Missing task ID in task event");
            throw new Error('Missing task data');
        }
        return {
            event,
            taskId: payload.data.task.id
        };
    }

    return { event };
}

/**
 * Checks if an event should be processed
 */
function isHandledEvent(event: string): boolean {
    return (
        event.startsWith('task.') &&
        event !== 'task.deleted' &&
        HANDLED_EVENTS.includes(event)
    );
}

/**
 * Processes task event in the background
 */
async function processTaskEvent(
    logContext: ReturnType<typeof createLogContext>,
    taskId: number,
    logger: ReturnType<typeof createLogger>
) {
    try {
        logger.info({}, `Starting background processing for task ${taskId}`);

        const backgroundLogger = logger.createChild({
            additional: {
                background: true,
                taskId: taskId
            }
        });

        // Hydrate task with additional data
        backgroundLogger.info({}, `Loading task ${taskId} details`);
        const detailedTask = await hydrateTask(logContext, taskId);

        // Check if we actually need to process it
        if (detailedTask?.task_cache_updated) {
            backgroundLogger.info({ detailedTask}, `Starting Next Best Action Analysis for task ${taskId}`);
            const action = await nbaTaskFlow(logContext, detailedTask);
            backgroundLogger.info({action}, `Executing Next Best Action recommendation for task ${taskId} ...`);
            await executeTaskNba(logContext, detailedTask, action, process.env.VIKUNJA_USERNAME!);
            backgroundLogger.info({action}, `Finished performing Next Best Action for task ${taskId} ...`);
        } else {
            backgroundLogger.info({ detailedTask },
                `No change detected in task ${taskId}, skipping review`
            );
        }
    } catch (error: any) {
        const errorMsg = formatError(error);
        logger.error({ error: jsonifyError(error) },
            `Background processing failed: ${errorMsg}`);
    }
}
