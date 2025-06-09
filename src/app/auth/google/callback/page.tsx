// app/auth/google/callback/page.tsx

'use server';

import { redirect } from 'next/navigation';
import CallbackUrlComponent from '@/components/auth/CallbackUrlComponent';
// import { googleOAuth2CallbackServerAction } from './actions';
import logger, { LogContext, makeLogEntry } from '@/lib/logger';
import { googleOAuth2Callback } from './callback-backend';
import { headers } from 'next/headers';

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function googleOAuth2CallbackServerAction(
  logContext: LogContext,
  callbackUrl: string,
  code: string
) {
  try {
    await googleOAuth2Callback(logContext, callbackUrl, code);
  } catch (error) {
    logger.error(makeLogEntry({
      ...logContext,
      time: Date.now(),
      module: 'auth/google/callback/page',
      function: 'googleOAuth2CallbackServerAction',
    }, {err: error},
      '**googleOauth2CallbackServerAction** OAuth processing failed:'));
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(message);
  }
}

const GoogleCallbackPage = async ({ searchParams }: PageProps) => {
  const code = searchParams.code;

  const nextHeaders = await headers();

  const requestId = nextHeaders.get('x-request-id') || '';

  const logContext: LogContext = {
    requestId,
  }

  // Validate code parameter
  if (!code || Array.isArray(code)) {
    logger.error(makeLogEntry({
      ...logContext,
      time: Date.now(),
      module: 'auth/google/callback/page',
      function: 'GoogleCallbackPage',
    }, {}, '**GoogleBaclbackPage** Authorization code missing from callback URL'));

    redirect(`/auth/error?message=${encodeURIComponent('Authorization code missing')}`);
  }

  return (
    <CallbackUrlComponent
      logContext={logContext}
      code={code}
      serverAction={googleOAuth2CallbackServerAction}
    />
  );
};

export default GoogleCallbackPage;