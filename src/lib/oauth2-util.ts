'use server';

import { OAuth2Client } from "google-auth-library";
import { GoogleOAuthToken } from "./schema";

async function getTokens(callbackUrl:string, code: string) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
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


// /**
//  * The url created by Firebase oauth client doesn't return refresh token for some reason. 
//  * Moved to use REST api
//  * @param callbackUrl 
//  * @returns 
//  */
// export async function getGoogleOAuthUrl(callbackUrl: string): Promise<string> {

//     // try {
//         const oauth2Client = await getGoogleOauth2Client(callbackUrl);

//         const authUrl = oauth2Client.generateAuthUrl({
//             access_type: "offline",
//             scope: [
//                 "https://www.googleapis.com/auth/userinfo.email",
//                 "https://www.googleapis.com/auth/gmail.readonly",
//             ],
//         });

//         // const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${googleRedirectUri}&response_type=code&scope=email profile openid`;

//         return authUrl;
//         // return NextResponse.redirect(authUrl);

//     // } catch (error) {
//     //     console.error('Error creating OAuth2 client:', error);
//     //     return new NextResponse('Error creating OAuth2 client', { status: 500 });
//     // }
// }

// export async function getGoogleOAuthUrlRest(redirectUrl: string): Promise<string> {

//     const googleClientId = process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;
//     const googleClientSecret = process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_SECRET;

//     if (!googleClientId || !googleClientSecret) {
//         throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
//     }

//     const SCOPES = [
//         "https://www.googleapis.com/auth/userinfo.email",
//         "https://www.googleapis.com/auth/gmail.readonly",
//     ];

//     const scopes = SCOPES;

//     return createOAuthUrl(googleClientId, redirectUrl, SCOPES);
//   }

 
export async function createOAuthUrl( oauthSetting: 
    { googleClientId?: string, callbackUrl?: string, scopes: string[] } ): Promise<string> {
    
    const clientId = oauthSetting.googleClientId || process.env.FIREBASE_WEB_APP_GOOGLE_CLIENT_ID;

    const callbackUrl = oauthSetting.callbackUrl || process.env.GOOGLE_AUTH_CALL_BACK_URL;

    const scopes = oauthSetting.scopes;

    const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;

    if (!GOOGLE_OAUTH_URL) {
        throw new Error('**createOAuthUrl** Missing GOOGLE_OAUTH_URL environment variable');
    }

    if (!clientId ) {
        throw new Error('**createOAuthUrl** Missing googleClientId parameter or environmental variable FIREBASE_WEB_APP_GOOGLE_CLIENT_ID');
    }

    if (!callbackUrl) {
        throw new Error('**createOAuthUrl** Missing callbackUrl parameter or environmental variable GOOGLE_AUTH_CALL_BACK_URL');
    }

    if (!scopes || scopes.length === 0) {
        throw new Error('**createOAuthUrl** Missing scopes parameter');
    }

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

    return `${GOOGLE_OAUTH_URL}?${params}`;
}
