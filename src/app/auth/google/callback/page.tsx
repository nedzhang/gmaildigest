'use client';

import { useEffect, useState } from 'react';
import { makeCallBackUrl } from '@/lib/client-util';
import { googleOAuth2Callback } from './callback-backend';
import logger from '@/lib/logger';

/**
 * Google OAuth2 callback page component
 * 
 * Handles the OAuth2 callback flow by:
 * 1. Extracting authorization code from URL parameters
 * 2. Validating the presence of the code
 * 3. Initiating server-side token exchange
 * 4. Handling success/error states appropriately
 */
const GoogleCallbackPage = () => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Process the OAuth2 callback when component mounts
   */
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Extract code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const callbackUrl = makeCallBackUrl();

        if (!code) {
          throw new Error('Authorization code missing from callback URL');
        }

        // Initiate server-side token exchange
        await googleOAuth2Callback(callbackUrl, code);
        setLoading(false);
        
      } catch (error) {
        logger.error('OAuth processing failed:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        window.location.replace(`/auth/error?message=${encodeURIComponent(message)}`);
      }
    };

    // Only run in browser context
    if (typeof window !== 'undefined') {
      processOAuthCallback();
    }
  }, []);

  /**
   * Render loading state while processing
   */
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-lg font-medium">Processing Google Authentication...</p>
        {errorMessage && (
          <p className="mt-2 text-red-500">Error: {errorMessage}</p>
        )}
      </div>
    );
  }

  /**
   * Successful state - could redirect here instead
   */
  return (
    <div className="p-4 text-center">
      <p className="text-lg font-medium text-green-600">
        Authentication successful! Redirecting...
      </p>
    </div>
  );
  
};

export default GoogleCallbackPage;