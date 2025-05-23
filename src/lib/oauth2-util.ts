"use server";

import { OAuth2Client } from "google-auth-library";
import { OAuthToken, OAuthTokenSchema } from "@/types/firebase";
import { getUser, updateToken } from "./gduser-util";
import { refreshToken } from "firebase-admin/app";
import { shallowCopyObjProperties } from "./object-util";
import logger from "./logger";

class UserAuthError extends Error {
    type: UserAuthError.ErrorType;

    constructor(type: UserAuthError.ErrorType, message: string) {
        super(message);
        this.name = `User Authentication Error. (${type})`;
        this.type = type;
    }
}

namespace UserAuthError {
    export enum ErrorType {
        UNKNOWN,
        NO_RECORD,
        EXPIRED,
        REJECTED,
    }
}

/**
 * Retrieves authentication secrets and validates required parameters.
 * @param oauthSetting - Object containing optional clientId, callbackUrl, and scopes
 * @returns An object with validated clientId, callbackUrl, scopes, and googleOAuthUrl
 * @throws Error if any required parameters are missing
 */
function getAuthSecret(
    oauthSetting: {
        googleClientId?: string;
        callbackUrl?: string;
        scopes: string[];
    },
) {
    const clientId = oauthSetting.googleClientId ||
        process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;
    const callbackUrl = oauthSetting.callbackUrl ||
        process.env.GOOGLE_AUTH_CALL_BACK_URL;
    const scopes = oauthSetting.scopes;
    const googleOAuthUrl = process.env.GOOGLE_OAUTH_URL;

    if (!googleOAuthUrl) {
        throw new Error(
            "**createOAuthUrl** Missing GOOGLE_OAUTH_URL environment variable",
        );
    }
    if (!clientId) {
        throw new Error(
            "**createOAuthUrl** Missing googleClientId parameter or environmental variable FIREBASE_WEB_APP_GOOGLE_CLIENT_ID",
        );
    }
    if (!callbackUrl) {
        throw new Error(
            "**createOAuthUrl** Missing callbackUrl parameter or environmental variable GOOGLE_AUTH_CALL_BACK_URL",
        );
    }
    if (!scopes || scopes.length === 0) {
        throw new Error("**createOAuthUrl** Missing scopes parameter");
    }

    return { clientId, callbackUrl, scopes, googleOAuthUrl };
}

/**
 * Fetches OAuth tokens from Google's token endpoint
 * @param callbackUrl - The redirect URI registered with Google OAuth
 * @param code - The authorization code received from the OAuth redirect
 * @returns Promise resolving to the token response
 */
async function getTokens(
    callbackUrl: string,
    code: string,
): Promise<OAuthToken> {
    const res = await fetch(process.env.GOOGLE_TOKEN_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID!,
            client_secret: process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET!,
            redirect_uri: callbackUrl,
            grant_type: "authorization_code",
        }),
    });
    return await res.json();
}

/**
 * Creates a new instance of Google OAuth2 client
 * @param clientId - Google OAuth client ID
 * @param clientSecret - Google OAuth client secret
 * @param callbackUrl - Registered redirect URI
 * @returns Promise resolving to configured OAuth2Client instance
 * @throws Error if client credentials or callback URL are missing
 */
async function getGoogleOauth2Client(
    clientId: string,
    clientSecret: string,
    callbackUrl: string,
): Promise<OAuth2Client> {
    if (!clientId || !clientSecret) {
        throw new Error(
            "**getGoogleOauth2Client** Missing clientId or clientSecret parameter or environmental variable",
        );
    }
    if (!callbackUrl) {
        throw new Error(
            "**getGoogleOauth2Client** Missing callback URL parameter",
        );
    }

    return new OAuth2Client(clientId, clientSecret, callbackUrl);
}

/**
 * Processes OAuth2 callback, exchanges authorization code for tokens, and validates ID token
 * @param config - Configuration object with optional overrides
 * @param code - Authorization code from OAuth redirect
 * @returns Promise resolving to validated GoogleOAuthToken
 * @throws Error if parameters are missing or token validation fails
 */
export async function processGoogleOAuth2Callback(
    config: {
        googleClientId?: string;
        googleClientSecret?: string;
        callbackUrl?: string;
    },
    code: string,
): Promise<OAuthToken> {
    const googleClientId = config.googleClientId ||
        process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;
    const googleClientSecret = config.googleClientSecret ||
        process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET;
    const callbackUrl = config.callbackUrl ||
        process.env.GOOGLE_AUTH_CALL_BACK_URL;

    if (!googleClientId) {
        throw new Error(
            "Missing googleClientId parameter or environmental variable",
        );
    }
    if (!googleClientSecret) {
        throw new Error(
            "Missing googleClientSecret parameter or environmental variable",
        );
    }
    if (!callbackUrl) {
        throw new Error(
            "Missing callbackUrl parameter or environmental variable",
        );
    }

    const tokens = await getTokens(callbackUrl, code);
    const oauth2Client = await getGoogleOauth2Client(
        googleClientId,
        googleClientSecret,
        callbackUrl,
    );
    const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.FIREBASE_WEB_APP_CLIENT_ID,
    });

    const tokenPayload = ticket.getPayload();
    if (!tokenPayload) throw new Error("Token payload not found");
    if (!tokenPayload.email) {
        throw new Error("Email not found in token payload");
    }

    return { ...tokens, payload: tokenPayload };
}

/**
 * Get new access token using refresh token
 * @param googleClientId - Google OAuth client ID
 * @param refreshToken - Valid refresh token from initial OAuth flow
 * @returns Promise resolving to new OAuthToken
 * @throws Error if parameters are missing or request fails
 */
async function renewToken(
    googleClientId: string,
    refreshToken: string,
): Promise<OAuthToken> {
    const clientSecret = process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET;

    if (!clientSecret) {
        throw new Error("Missing FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET");
    }
    if (!googleClientId) throw new Error("Missing googleClientId parameter");
    if (!refreshToken) throw new Error("Missing refreshToken parameter");
    if (!process.env.GOOGLE_TOKEN_URL) {
        throw new Error("Missing GOOGLE_TOKEN_URL environment variable");
    }

    const res = await fetch(process.env.GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: googleClientId,
            grant_type: "refresh_token",
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
    });

    const newToken = OAuthTokenSchema.parse(await res.json());

    logger.info(
        "**renewToken** token renewed with access_token:\n",
        newToken.access_token,
        "\nid_token:\n",
        newToken.id_token,
    );
    return newToken;
}

/**
 * Generates Google OAuth2 authorization URL with specified parameters
 * @param oauthSetting - Configuration object with scopes and optional overrides
 * @returns Promise resolving to generated authorization URL
 * @throws Error if required parameters are missing
 */
export async function createOAuthUrl(
    oauthSetting: {
        googleClientId?: string;
        callbackUrl?: string;
        scopes: string[];
    },
): Promise<string> {
    const { clientId, callbackUrl, scopes, googleOAuthUrl } = getAuthSecret(
        oauthSetting,
    );

    const authParams = {
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code",
        scope: scopes.join(" "),
        access_type: "offline",
        prompt: "consent",
    };

    return `${googleOAuthUrl}?${new URLSearchParams(authParams)}`;
}

/**
 * Retrieves and validates access token for API requests. Call this API after authentication.
 * this function doesn't authenticate user.
 * @param userId - User ID to retrieve tokens for
 * @returns Renewed access token
 * @throws Error if any required token or configuration is missing
 */
export async function getAccessToken(userId: string) {
    const BUFFER_SECONDS = 10; // 10 seconds buffer for tocken expiration. (renew at expire_at - 10 seconds)

    if (!process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID) {
        throw new Error("Missing Google Client ID configuration");
    }

    const user = await getUser(userId);

    if (!user) {
        throw new UserAuthError(
            UserAuthError.ErrorType.NO_RECORD,
            `**getAccessToken** security profile not found for "${userId}".`,
        );
    }

    if (!user.latest_token || !user.latest_token_id) {
        throw new UserAuthError(
            UserAuthError.ErrorType.NO_RECORD,
            `**getAccessToken** lastest token not found for "${userId}".`,
        );
    }

    const nowInSeconds = Math.floor(Date.now() / 1000) + BUFFER_SECONDS;

    if (
        user.latest_token.access_token && user.latest_token.expires_at &&
        user.latest_token.expires_at > nowInSeconds
    ) {
        // the access token is still active
        logger.info(
            `**getAccessToken** access token is still active for "${userId}". Expires at ${
                new Date(user.latest_token.expires_at * 1000).toLocaleString()
            } `,
        );
        return user.latest_token.access_token;
    } else { // the access token is not active
        logger.info(
            `**getAccessToken** access token expired for "${userId}". Expired at ${
                new Date((user.latest_token.expires_at || 0) * 1000)
                    .toLocaleString()
            }`,
        );

        if (
            !user.latest_token.refresh_token ||
            !user.latest_token.refresh_token_expires_at
        ) {
            throw new UserAuthError(
                UserAuthError.ErrorType.NO_RECORD,
                `**getAccessToken** missing refresh_token or refresh_token_expires_at for "${userId}".`,
            );
        }

        if (user.latest_token.refresh_token_expires_at > nowInSeconds) {
            // we can refresh

            const newTokens = await renewToken(
                process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID,
                user.latest_token.refresh_token,
            );

            const tokensForUpdate = shallowCopyObjProperties(newTokens, [
                "access_token",
                "expires_in",
                "refresh_token",
                "refresh_token_expires_in",
            ]);
            const tokensUpdated = await updateToken(userId, user.latest_token_id, tokensForUpdate);

            logger.info(
                `**getAccessToken** renewed token for "${userId}". New access token expires at ${
                    new Date((tokensUpdated.expires_at || 0) * 1000)
                        .toLocaleString()
                }`,
            );

            return newTokens.access_token;
        } else {
            throw new UserAuthError(
                UserAuthError.ErrorType.EXPIRED,
                `**getAccessToken** refresh token expired for user ${userId}`,
            );
        }
    }
}
