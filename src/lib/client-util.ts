'use client';
import logger from "@/lib/logger";

/**
 * Creates a callback URL for Google OAuth, including optional query parameters.
 * @param parameters - An object containing key-value pairs for query parameters. accept null or empty dict.
 * @returns The constructed callback URL string.
 */
export function makeCallBackUrl(parameters?: { [key: string]: string }): string {
    const currentURL = window.location;

    const host = currentURL.host;
    const protocol = currentURL.protocol;

    const CALLBACK_PATH = process.env.NEXT_PUBLIC_FIREBASE_WEB_APP_GOOGLE_REDIRECT_PATH;

    if (!CALLBACK_PATH) {
      throw new Error('NEXT_PUBLIC_FIREBASE_WEB_APP_GOOGLE_REDIRECT_PATH not found');
    }

    const queryParameters = (parameters && Object.keys(parameters)?.length > 0) ?
        Object.keys(parameters)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`)
            .join('&') :
        null;


    const url = queryParameters ?
        `${protocol}//${host}${CALLBACK_PATH}?${queryParameters}` :
        `${protocol}//${host}${CALLBACK_PATH}`;

    return url;
}


//     const currentUrlOrigin = new URL(currentUrl).origin;    // const callbackUrl = `${currentUrlOrigin}/auth/google/callback?requestUrl=${encodeURIComponent(currentUrl)}`;
//     const callbackUrl = `${currentUrlOrigin}/auth/google/callback`;

//     logger.debug("**GoogleLoginPage** callbackUrl: ", callbackUrl);
// }