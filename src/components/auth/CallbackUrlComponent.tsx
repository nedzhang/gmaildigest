/**
 * Callback URL Handler Component (For OAuth Authentication Flows)
 * 
 * Handles the callback step in OAuth authentication flows. This component:
 * 1. Takes an authorization code from the URL
 * 2. Generates a callback URL
 * 3. Executes a server action to exchange the code for tokens
 * 4. Handles redirection and error states
 * 
 * @module components/CallbackUrlHandler
 * 
 * @example
 * // Usage in page component for OAuth callback route (e.g., pages/auth/callback.tsx)
 * import CallbackUrlHandler from '@/components/CallbackUrlHandler';
 * import { exchangeCodeForToken } from '@/lib/auth-actions';
 * 
 * export default function AuthCallbackPage({ searchParams }) {
 *   return (
 *     <CallbackUrlHandler
 *       logContext={logger}
 *       code={searchParams.code}
 *       serverAction={exchangeCodeForToken}
 *     />
 *   );
 * }
 *
 * @typedef {Object} CallbackUrlHandlerProps
 * @property {LogContext} logContext - Logger context for tracking authentication flow
 * @property {string} code - Authorization code from OAuth provider (ex: Google)
 * @property {function} serverAction - Server action to exchange code for tokens
 */
'use client';

import { makeCallBackUrl } from '@/lib/client-util';
import { formatError, jsonifyError } from '@/lib/error-util';
import { createLogger, LogContext } from '@/lib/logger';
import { useEffect, useState } from 'react';

/** Time to show error message before redirect (ms) */
const ERROR_DISPLAY_DELAY = 200;

export default function CallbackUrlHandler({
  logContext,
  code,
  serverAction,
}: {
  logContext: LogContext;
  code: string;
  serverAction: (
    logContext: LogContext,
    callbackUrl: string,
    code: string
  ) => Promise<void>;
}) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const functionLogger = createLogger(logContext, {
    module: "components/auth/CallbackUrlComponent", function: "CallbackUrlHandler",
  })

  /**
   * Effect to handle OAuth callback process:
   * 1. Generates callback URL
   * 2. Executes server action
   * 3. Handles success/error states
   * 
   * Executes immediately on component mount for proper OAuth flow handling
   */
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        functionLogger.trace({} , 'Starting OAuth callback flow');

        // Generate callback URL dynamically
        const callbackUrl = makeCallBackUrl();
        functionLogger.debug( { callbackUrl }, `Got callback URL: ${callbackUrl}`);

        // Execute server action (e.g., token exchange)
        await serverAction(logContext, callbackUrl, code);
        functionLogger.trace( {}, 'Server action completed');

        // Redirect to home page on successful authentication
        window.location.href = '/';
      } catch (error: unknown) {
        const message = formatError(error);

        functionLogger.error( { error: jsonifyError(error) }, `OAuth processing failed ${message}}`);

        // Show error to user briefly before redirect
        setErrorMessage(message);
        setLoading(false);

        setTimeout(() => {
          window.location.replace(
            `/auth/error?message=${encodeURIComponent(message)}`
          );
        }, ERROR_DISPLAY_DELAY);
      }
    };

    processOAuthCallback();
  }, [serverAction, code]);

  /**
   * Component renders UI states:
   * - Loading state during processing
   * - Error state after failure (briefly visible)
   */
  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Processing Authentication...
          </h1>
          <div
            className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"
            aria-label="Authentication in progress"
          />
          <p className="text-sm text-gray-500">
            Your account is being verified. Please wait.
          </p>
        </div>
      ) : (
        errorMessage && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-red-600">
              Authentication Error
            </h2>
            <p className="text-sm text-gray-700 pb-2">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-500 italic">
              Redirecting to login...
            </p>
          </div>
        )
      )}
    </div>
  );
}