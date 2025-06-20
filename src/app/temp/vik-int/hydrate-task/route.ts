// temp/vik-int/hydrate-task/route.ts

import { jsonifyError } from '@/lib/error-util';
import { createLogContext, createLogger, LogContext } from '@/lib/logger';
import { hydrateTask } from '@/lib/taskboard/vikunja-int';
import { NextRequest, NextResponse } from 'next/server';

const MAX_PAGES = 200; // Safeguard against infinite loops

export async function GET(req: NextRequest) {
  const logContext = createLogContext({ req });
  const functionLogger = createLogger(logContext, {
    module: 'hydrate-task/route',
    function: 'GET',
  });

  try {
    // Extract and validate task ID from query parameters
    const taskIdParam = req.nextUrl.searchParams.get('taskId');
    
    if (!taskIdParam) {
      functionLogger.error({ query: req.nextUrl.searchParams.toString() }, 'Missing taskId parameter');
      return NextResponse.json(
        { error: 'Missing taskId query parameter' },
        { status: 400 }
      );
    }

    const taskId = parseInt(taskIdParam, 10);
    if (isNaN(taskId) || taskId <= 0) {
      functionLogger.error({ taskIdParam }, 'Invalid taskId parameter');
      return NextResponse.json(
        { error: 'Invalid taskId. Must be a positive integer' },
        { status: 400 }
      );
    }

    functionLogger.info({ taskId }, 'Hydrating task');
    const task = await hydrateTask(logContext, taskId);

    if (!task) {
      functionLogger.error({ taskId }, 'Task not found or failed to hydrate');
      return NextResponse.json(
        { error: `Task ${taskId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    const errorObj = { error: jsonifyError(error) };

    functionLogger.error( errorObj, 'Failed to hydrate task');
    return NextResponse.json(
      errorObj,
      { status: 500 }
    );
  }
}
