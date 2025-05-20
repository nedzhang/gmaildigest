import { z } from "zod";

export const GoogleOAuthTokenSchema = z.object({
  access_token: z.string().describe("OAuth 2.0 access token used to authorize API requests.").optional(),
  expires_in: z.number().describe("Lifespan of the access token in seconds.").optional(),
  refresh_token: z.string().describe("Token used to obtain a new access token when the current one expires.").optional(),
  scope: z.string().describe("OAuth 2.0 scopes granted by the user.").optional(),
  token_type: z.literal("Bearer").describe("Type of token issued. Always 'Bearer' for Google OAuth 2.0.").optional(),
  id_token: z.string().describe("JWT that contains identity information about the user.").optional(),
  refresh_token_expires_in: z.number().describe("Lifespan of the refresh token in seconds.").optional(),
  payload: z
    .object({
      iss: z.string().url().describe("Issuer of the ID token. Should be https://accounts.google.com.").optional(),
      azp: z.string().describe("Authorized party - the client ID of the app.").optional(),
      aud: z.string().describe("Audience - the client ID that this ID token is intended for.").optional(),
      sub: z.string().describe("Subject - a unique identifier for the user.").optional(),
      hd: z.string().describe("G Suite domain of the user, if applicable.").optional(),
      email: z.string().email().describe("The user's email address.").optional(),
      email_verified: z.boolean().describe("Whether the user's email address has been verified.").optional(),
      at_hash: z.string().describe("Access token hash, for verifying token integrity.").optional(),
      iat: z.number().describe("Issued At - time the token was issued (Unix timestamp).").optional(),
      exp: z.number().describe("Expiration time of the token (Unix timestamp).").optional(),
    })
    .describe("Decoded JWT payload containing user identity claims.")
    .optional(),
});

export type GoogleOAuthToken = z.infer<typeof GoogleOAuthTokenSchema>;