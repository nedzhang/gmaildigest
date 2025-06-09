"use server";

import { getGmailThreads } from "@/lib/gmail-util";
import logger, {
    LogContext,
    LogEvent,
    makeLogContext,
    makeLogEntry,
} from "@/lib/logger";
import { hydrateThread } from "@/lib/stdmail-util";
import { StandardEmailThread } from "@/types/gmail";
import { NextRequest, NextResponse } from "next/server";

async function hydrateThreadsFromGmail(logContext: LogContext, userId: string) {
    var loading = false;
    var error = "";
    const threads: StandardEmailThread[] = [];

    const logEventBase: LogEvent = {
        ...logContext,
        module: "stdthreads",
        function: "UserStdThreadsPage",
        time: 0,
        additional: { ...logContext.additional, userId },
    };

    if (!userId) {
        throw new Error(`**hydrateThreadsFromGmail** unknown userid: ${userId}`)
    }
    try {
        if (!!userId) {
            loading = true;
            // Call the function to retrieve threads for the specified user
            const userThreads = await getGmailThreads(logContext, userId);

            if (!userThreads) {
                error =
                    "**hydrateThreadsFromGmail** No gmail threads found for this user.";
                loading = false;
                logger.warn(makeLogEntry(
                    {
                        ...logEventBase,
                        time: Date.now(),
                    },
                    {},
                    `**hydrateThreadsFromGmail** No gmail threads found for user: ${userId}.`,
                ));
                return { loading, error, threads };
            }

            await Promise.all(userThreads.map(async (thread) => {
                try {
                    if (logContext.additional && logEventBase.additional) {
                        logContext.additional["threadId"] = thread.id;
                        logEventBase.additional["threadId"] = thread.id;
                    }

                    const hydratedThread = await hydrateThread(
                        logContext,
                        userId,
                        thread,
                    );
                    threads.push(hydratedThread);
                } catch (err) {
                    // log failure to hydrate a thread but keep going for the rest
                    logger.error(makeLogEntry(
                        {
                            ...logEventBase,
                            time: Date.now(),
                        },
                        { thread, err },
                        `**UserStdThreadsPage** hydration failed for thread ${
                            thread.id || thread.dbThreadKey
                        }.`,
                    ));
                }
            }));
        }
    } catch (err) {
        error = "Failed to load email threads.";
        logger.error(makeLogEntry(
            {
                ...logEventBase,
                time: Date.now(),
            },
            { err },
            "**hydrateThreadsFromGmail** Failed to load email threads.",
        ));
    } finally {
        loading = false;
    }

    return { loading, error, threads };
}

// async function downloadSummarizeSaveUserThreads(
//     logContext: LogContext,
//     userId: string,
// ) {
//     let loading = true;
//     let error = "";

//     const logEventBase: LogEvent = {
//         ...logContext,
//         module: "hydrate-user-email",
//         function: "downloadSummarizeSaveUserThreads",
//         time: 0,
//         additional: {
//             ...logContext.additional,
//             userId,
//         },
//     };

//     if (!userId) {
//         error = `**downloadSummarizeSaveUserThreads** userId unkown ${userId}`;
//     } else {
//         hydrateThreadsFromGmail(logContext, userId);
//         loading = false;
//     }

//     return { loading, error };
// }

export async function PATCH(
    req: NextRequest,
) {
    const logContext = makeLogContext({ req });
    const queryParams = await req.nextUrl.searchParams;

    const userId = queryParams.get("userId");

    const { loading, error, threads } = await hydrateThreadsFromGmail(
        logContext,
        userId!,
    );

    return NextResponse.json({
        error,
        threadCount: threads?.length,
        message: `**hydrate-user-email** completed.`
    });
}
