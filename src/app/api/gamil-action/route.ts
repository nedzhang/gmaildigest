
import { OAuthToken } from "@/types/firebase";
import { NextResponse } from "next/server";

import { promises as fs } from 'fs';
import path from 'path';
import { retrieveUserThreads } from "@/lib/gmail-util";

async function gmailAction() {
    const userId = "ned.zhang@paracognition.ai";
    
    return await retrieveUserThreads(userId);
}

export async function GET() {
    await gmailAction()
    return NextResponse.json({ message: 'You have invoked gmail-action api with intentional misspelling.' });
}
