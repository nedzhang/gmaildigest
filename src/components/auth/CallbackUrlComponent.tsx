// components/CallbackUrlMaker.tsx
'use client';

import { makeCallBackUrl } from '@/lib/client-util';
import { LogContext } from '@/lib/logger';
import { useEffect, useState } from 'react';

interface ServerActionHook {
  logContext: LogContext,
  code: string;
  serverAction: (logContext: LogContext, callbackUrl: string, code: string) => Promise<void>;
}

function CallbackUrlComponent({
  logContext,
  code,
  serverAction,
}: ServerActionHook) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const executeServerAction = async () => {
      try {
        const callbackUrl = makeCallBackUrl();
        await serverAction(logContext, callbackUrl, code);
        
        // Redirect after successful authentication
        window.location.href = '/';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        setErrorMessage(message);
        setLoading(false);
        window.location.replace(`/auth/error?message=${encodeURIComponent(message)}`);
      }
    };

    executeServerAction();
  }, [serverAction, code]);

  return (
    <div className="p-4 text-center">
      {loading ? (
        <p className="text-lg font-medium">Processing Google Authentication...</p>
      ) : (
        errorMessage && <p className="mt-2 text-red-500">Error: {errorMessage}</p>
      )}
    </div>
  );
}

export default CallbackUrlComponent;