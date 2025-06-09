// emailThreadSummarization.ts

import { getGmailThreads } from "@/lib/gmail-util";
import logger, { LogContext, makeLogContext, makeLogEntry } from "@/lib/logger";
import { hydrateThread } from "@/lib/stdmail-util";
import { generateId } from "@/lib/uid-util";
import { runTransaction } from "firebase/firestore";

export async function runUserEmailThreadsSummarization(
    logContext: LogContext,
    userId: string,
) {
    const runId = generateId();

    const runContext: LogContext = {
        ...logContext,
        additional: {
            ...logContext.additional,
            userId,
            runId,
            job: "UserEmailThreadsSummarization",
        },
    };

    const startTime = Date.now();

    logger.info(makeLogEntry(
        {
            ...runContext,
            time: Date.now(),
            module: "userEmailThreadsSummarization",
            function: "runUserEmailThreadsSummarization",
        },
        { startTime },
        `**ThreadsSummarization** Starting UserEmailThreadsSummarization for user ${userId}`,
    ));

    const threads = await getGmailThreads(runContext, userId);

    if (!threads) {
        logger.warn(makeLogEntry(
            {
                ...runContext,
                time: Date.now(),
                module: "userEmailThreadsSummarization",
                function: "runUserEmailThreadsSummarization",
            },
            { userId, runId },
            `**ThreadsSummarization** Failed to retrieve threads for user ${userId}`,
        ));
        return;
    }

    for (const thread of threads) { //
        const hydratedThread = await hydrateThread(runContext, userId, thread);

        runContext.additional = {
            ...runContext.additional,
            threadId: thread.id,
        };

        logger.info(makeLogEntry(
            {
                ...runContext,
                time: Date.now(),
                module: "userEmailThreadsSummarization",
                function: "runUserEmailThreadsSummarization",
            },
            {
                dbThreadKey: hydratedThread.dbThreadKey,
                threadSummary: hydratedThread.summary,
            },
            `**ThreadsSummarization** Hydrated thread ${thread.id} for user ${userId}`,
        ));
    }

    const endTime = Date.now();
 
    // wait for 2 seconds before log the finish message
    await new Promise((resolve) => setTimeout(resolve, 2000));

   const duration = endTime - startTime;
    logger.info(makeLogEntry(
        {
            ...runContext,
            time: Date.now(),
            module: "userEmailThreadsSummarization",
            function: "runUserEmailThreadsSummarization",
        },
        {  numberOfThreads: threads?.length, startTime, endTime, duration },
        `**ThreadsSummarization** Finished UserEmailThreadsSummarization for user ${userId} in ${duration}ms`,
    ));
}
