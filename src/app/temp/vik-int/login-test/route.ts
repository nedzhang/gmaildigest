import { NextRequest, NextResponse } from 'next/server';
import { getVikunjaToken, TokenRequestError } from '@/lib/taskboard/vikunja-auth';
import { makeLogContext } from '@/lib/logger';
import { jsonifyError } from '@/lib/error-util';

/**
 * GET handler for Vikunja authentication token
 * 
 * Provides cached authentication tokens for Vikunja API
 * 
 * @param req - Next.js request object
 * @returns JSON response with token or appropriate error
 */
export async function GET(req: NextRequest) {
  const logContext = makeLogContext({ req });

  try {
    // Get token using the service module
    const tokenData = await getVikunjaToken(logContext);
    return NextResponse.json(tokenData);

  } catch (error) {

    const err = error as TokenRequestError;

    return NextResponse.json({
      error: jsonifyError(error)
    }, { status: (err && err.code) || 500 });
  }
}
