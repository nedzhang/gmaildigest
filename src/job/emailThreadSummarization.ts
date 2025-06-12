// emailThreadSummarization.ts

import { getGmailThreads } from "@/lib/gmail-util";
import { createLogger, LogContext } from "@/lib/logger";
import { hydrateThread } from "@/lib/stdmail-util";
import { generateId } from "@/lib/uid-util";


export async function runUserEmailThreadsSummarization(
    logContext: LogContext,
    userId: string,
) {
    const runId = generateId();

    const runLogContext = {
        ...logContext,
        additional: {
            ...logContext.additional,
            userId,
            runId,
            job: "UserEmailThreadsSummarization",
        },
    }

    const functionLogger = createLogger(runLogContext,
        { function: 'runUserEmailThreadsSummarization' });

    // const eventBase: LogEvent = {
    //     ...logContext,
    //     time: 0,
    //     module: "userEmailThreadsSummarization",
    //     function: '',
    //     additional: {
    //         ...logContext.additional,
    //         userId,
    //         runId,
    //         job: "UserEmailThreadsSummarization",
    //     },
    // };

    const startTime = Date.now();

    functionLogger.info({ startTime },
        `**ThreadsSummarization** Starting UserEmailThreadsSummarization for user ${userId}`);


    // logger.info(makeLogEntry(
    //     {
    //         ...eventBase, time: Date.now(),
    //         function: "runUserEmailThreadsSummarization",
    //     },
    //     { startTime },
    //     `**ThreadsSummarization** Starting UserEmailThreadsSummarization for user ${userId}`,
    // ));

    const threads = await getGmailThreads(runLogContext, userId);

    if (!threads) {
        functionLogger.warn({ userId, runId },
            `**ThreadsSummarization** Failed to retrieve threads for user ${userId}`)

        // logger.warn(makeLogEntry(
        //     {
        //         ...eventBase, time: Date.now(),
        //         function: "runUserEmailThreadsSummarization",
        //     },
        //     { userId, runId },
        //     `**ThreadsSummarization** Failed to retrieve threads for user ${userId}`,
        // ));
        return;
    }

    for (const thread of threads) { //
        const hydratedThread = await hydrateThread(runLogContext, userId, thread);

        const threadLogger = functionLogger.createChild({ additional: { threadId: thread.id, } })

        threadLogger.info({ dbThreadKey: hydratedThread.dbThreadKey, threadSummary: hydratedThread.summary, },
            `**ThreadsSummarization** Hydrated thread ${thread.id} for user ${userId}`,);

        // eventBase.additional = {
        //     ...eventBase.additional,
        //     threadId: thread.id,
        // };

        // logger.info(makeLogEntry(
        //     {
        //         ...eventBase, time: Date.now(),
        //         function: "runUserEmailThreadsSummarization",
        //     },
        //     {
        //         dbThreadKey: hydratedThread.dbThreadKey,
        //         threadSummary: hydratedThread.summary,
        //     },
        //     `**ThreadsSummarization** Hydrated thread ${thread.id} for user ${userId}`,
        // ));
    }

    const endTime = Date.now();

    // wait for 2 seconds before log the finish message
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const duration = endTime - startTime;

    functionLogger.info({ numberOfThreads: threads?.length, startTime, endTime, duration },
        `**ThreadsSummarization** Finished UserEmailThreadsSummarization for user ${userId} in ${duration}ms`,);

    // logger.info(makeLogEntry(
    //     {
    //         ...eventBase, time: Date.now(),
    //         function: "runUserEmailThreadsSummarization",
    //     },
    //     { numberOfThreads: threads?.length, startTime, endTime, duration },
    //     `**ThreadsSummarization** Finished UserEmailThreadsSummarization for user ${userId} in ${duration}ms`,
    // ));
}
