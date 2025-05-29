
import { OAuthToken } from "@/types/firebase";
import { NextRequest, NextResponse } from "next/server";

import { promises as fs } from 'fs';
import path from 'path';
import { retrieveUserThreads } from "@/lib/gmail-util";
import { LogContext, makeLogContext } from "@/lib/logger";

async function gmailAction(logContext: LogContext) {
    const userId = "ned.zhang@paracognition.ai";
    
    return await retrieveUserThreads(logContext, userId);
}

export async function GET(req: NextRequest) {

    const logContext = makeLogContext({req});

    const userThreads = await gmailAction(logContext);

    return NextResponse.json({ message: 'You have invoked gmail-action api with intentional misspelling.', userThreads });
}
