'use server';

import { OAuth2Client } from "google-auth-library";
import { GoogleOAuthToken } from "./schema";
import { OAuthToken, OAuthTokenSchema } from "@/types/firebase";

async function getTokens(callbackUrl:string, code: string) {
    const res = await fetch(process.env.GOOGLE_TOKEN_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID!,
        client_secret: process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET!,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code", // it is hardcoded to authorization_code to this process
      }),
    });
    return await res.json();
  }

export async function processGoogleOAuth2Callback(
    config: {
        googleClientId?:string,
        googleClientSecret?:string,
        callbackUrl?:string
    }, code: string): Promise<GoogleOAuthToken> {
    
    // const oauth2Client = await getGoogleOauth2Client(callbackUrl);

    // const codeObj =  await oauth2Client.getToken(code);
    const googleClientId = config.googleClientId || process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;
    const googleClientSecret = config.googleClientSecret || process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET;
    const callbackUrl = config.callbackUrl || process.env.GOOGLE_AUTH_CALL_BACK_URL;

    if (!googleClientId) {
        throw new Error("**processGoogleOAuth2Callback** Missing googleClientId parameter or environmental variable FIREBASE_WEB_APP_GOOGLE_CLIENT_ID")
    }

    if (!googleClientSecret){
        throw new Error("**processGoogleOAuth2Callback** Missing googleClientSecret parameter or environmental variable FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET");
    }

    if (!callbackUrl) {
        throw new Error("**processGoogleOAuth2Callback** Missing callbackUrl parameter or environmental variable GOOGLE_AUTH_CALL_BACK_URL");
    }

    const tokens =  await getTokens(callbackUrl, code);
    
    // console.log("**processGoogleOAuth2Callback** tokens: ", tokens)

    const oauth2Client = await getGoogleOauth2Client( googleClientId, googleClientSecret, callbackUrl);
    const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.FIREBASE_WEB_APP_CLIENT_ID,
    });

    const tokenPayload = ticket.getPayload();
    if (!tokenPayload) throw new Error("Token payload not found");

    console.log('**auth/google/callback** tokenPayload: ', tokenPayload);

    const email = tokenPayload?.email;
    if (!email) throw new Error("Email not found");


    return {
        ...tokens,
        payload: tokenPayload
    };

}

/**
 * Create a new instance of Google OAuth2 client.
 * @param clientId 
 * @param clientSecret 
 * @param callbackUrl 
 * @returns 
 */
async function getGoogleOauth2Client(clientId:string, clientSecret:string, callbackUrl: string): Promise<OAuth2Client> {

    // const googleClientId = process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;
    // const googleClientSecret = process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET;
    // // const googleRedirectUri = process.env.FIREBASE_WEB_APP_GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret) {
        throw new Error('**getGoogleOauth2Client** Missing clientId or clientSecret parameter or environmental variable');
    }

    if (!callbackUrl) {
        throw new Error('**getGoogleOauth2Client** Missing callback URL parameter');
    }

    const oauth2Client = new OAuth2Client(
        clientId,
        clientSecret,
        callbackUrl,
    );

    return oauth2Client;
}
 
export async function createOAuthUrl( oauthSetting: 
    { googleClientId?: string, callbackUrl?: string, scopes: string[] } ): Promise<string> {
    
    const { clientId, callbackUrl, scopes, googleOAuthUrl } = getAuthSecret(oauthSetting);

    const goauthParams = {
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: "code", // per interface document response_type should always be code
        scope: scopes.join(" "),
        access_type: "offline",
        prompt: "consent"
    };

    const params = new URLSearchParams(goauthParams);

    console.info('**createAuthUrl** with params:\n', JSON.stringify(goauthParams, null, 2));

    return `${googleOAuthUrl}?${params}`;
}

function getAuthSecret(oauthSetting: { googleClientId?: string; callbackUrl?: string; scopes: string[]; }) {
    const clientId = oauthSetting.googleClientId || process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;

    const callbackUrl = oauthSetting.callbackUrl || process.env.GOOGLE_AUTH_CALL_BACK_URL;

    const scopes = oauthSetting.scopes;

    const googleOAuthUrl = process.env.GOOGLE_OAUTH_URL;

    if (!googleOAuthUrl) {
        throw new Error('**createOAuthUrl** Missing GOOGLE_OAUTH_URL environment variable');
    }

    if (!clientId) {
        throw new Error('**createOAuthUrl** Missing googleClientId parameter or environmental variable FIREBASE_WEB_APP_GOOGLE_CLIENT_ID');
    }

    if (!callbackUrl) {
        throw new Error('**createOAuthUrl** Missing callbackUrl parameter or environmental variable GOOGLE_AUTH_CALL_BACK_URL');
    }

    if (!scopes || scopes.length === 0) {
        throw new Error('**createOAuthUrl** Missing scopes parameter');
    }
    return { clientId, callbackUrl, scopes, googleOAuthUrl };
}

export async function getTokenRefresh(googleClientId: string, refreshToken:string): Promise<OAuthToken> {
    // const { clientId } = getAuthSecret(oauthSetting);

    // const tokenUrl = process.env.GOOGLE_TOKEN_URL;

    // const tokenEndpoint = 'https://oauth2.googleapis.com/token';

    const clientSecret = process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET;

    if (!clientSecret) {
        throw new Error('**getTokenRefresh** Missing environmental variable FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET')
    }

    if (!googleClientId) {
        throw new Error('**getTokenRefresh** Missing googleClientId parameter')
    }

    if (!refreshToken) {
        throw new Error('**getTokenRefresh** Missing refreshToken parameter')
    }

    const res = await fetch(process.env.GOOGLE_TOKEN_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: googleClientId,
            grant_type: "refresh_token", // it is hardcoded to refresh_token to this process
            client_secret: clientSecret,
            refresh_token: refreshToken,
        }),
      });

      const result = await res.json();

      return OAuthTokenSchema.parse(result);

}