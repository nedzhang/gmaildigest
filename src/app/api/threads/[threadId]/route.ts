import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

// Assuming GmailThreadSchema is defined in types/gmail.ts
// and you have imported it correctly.
// Example:
import { GmailThreadSchema } from '@/types/gmail';
import { retrieveThread } from '@/lib/gmail-util';
import { getSession } from '@/lib/session';
import logger from "@/lib/logger";

export async function GET(
  request: Request,
  { params }: { params: { threadId: string } }
) {

  const { threadId } = await params; //we need to wait for params now. https://nextjs.org/docs/messages/sync-dynamic-apis

  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId parameter' }, { status: 400 });
  }

  // const filePath = path.join(process.cwd(), 'email', `${threadId}.json`);

  try {
    // const fileContent = await fs.readFile(filePath, 'utf-8');
    // const rawData = JSON.parse(fileContent);

    // const validatedThread = GmailThreadSchema.parse(rawData);
    const session = await getSession();

    if (!session.userEmail) {
      throw new Error('**api/threads/threadid** User not logged in');
    }

    const validatedThread = await retrieveThread(session.userEmail, threadId);

    return NextResponse.json(validatedThread); // NextResponse.json creates a new Response object with the body set to the JSON representation of the provided data and the 'Content-Type' header set to 'application/json'. This is the standard way to return JSON responses from Next.js API routes.
  
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data validation failed', details: error.errors }, { status: 400 });
    }

    logger.error('Error processing thread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}