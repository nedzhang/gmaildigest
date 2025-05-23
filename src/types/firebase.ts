import { z } from "zod";

export const FirebaseServiceAccountSchema = z.object({
  type: z.string().describe("The type of credential, always 'service_account' for Firebase admin SDK."),
  project_id: z.string().describe("The Firebase project ID."),
  private_key_id: z.string().describe("Unique identifier for the private key."),
  private_key: z.string().describe("The private key used for signing tokens."),
  client_email: z.string().email().describe("The service account's email address."),
  client_id: z.string().describe("The numeric ID of the service account."),
  auth_uri: z.string().url().describe("The OAuth 2.0 authorization endpoint."),
  token_uri: z.string().url().describe("The OAuth 2.0 token exchange endpoint."),
  auth_provider_x509_cert_url: z.string().url().describe("URL of the public x509 certificate for the auth provider."),
  client_x509_cert_url: z.string().url().describe("URL of the public x509 certificate for the client."),
  universe_domain: z.string().describe("Domain for Google APIs, typically 'googleapis.com'.")
});

export type FirebaseServiceAccount = z.infer<typeof FirebaseServiceAccountSchema>;


export const PayloadSchema = z.object({
  at_hash: z.string().optional().describe("Access token hash for integrity check."),
  aud: z.string().optional().describe("Audience for which the token is intended."),
  azp: z.string().optional().describe("Authorized party - the client ID of the app."),
  email: z.string().optional().describe("Email address of the user."),
  email_verified: z.boolean().optional().describe("Whether the email has been verified."),
  exp: z.number().optional().describe("Expiration time of the token (Unix timestamp)."),
  hd: z.string().optional().describe("Hosted domain of the user's Google Workspace account."),
  iat: z.number().optional().describe("Issued-at time of the token (Unix timestamp)."),
  iss: z.string().optional().describe("Issuer of the token."),
  sub: z.string().optional().describe("Subject - unique identifier for the user.")
}).describe("Decoded ID token payload with user identity claims.");


export const OAuthTokenSchema = z.object({
  access_token: z.string().describe("OAuth 2.0 access token used to authorize API requests."),
  db_id: z.string().optional().describe("Internal database ID associated with the token."),
  expires_in: z.number().describe("Access token expiration time in seconds."),
  expires_at: z.number().optional(),
  id_token: z.string().describe("JWT that contains user identity information."),
  refresh_token: z.string().optional().describe("Token used to refresh the access token."),
  refresh_token_expires_in: z.number().optional().describe("Refresh token expiration time in seconds."),
  refresh_token_expires_at: z.number().optional(),
  scope: z.string().optional().describe("Scopes granted with this token."),
  token_type: z.string().optional().describe("Type of token issued, typically 'Bearer'."),
  payload: PayloadSchema.optional()
});

export type OAuthToken = z.infer<typeof OAuthTokenSchema>;

export const UserSecurityProfileSchema = z.object({
  login_email: z.string().optional(),
  email_verified: z.boolean().optional(),
  full_name: z.string().optional(),
  preferred_name: z.string().optional(),
  communication_email: z.string().optional(),
  latest_token_id: z.string().optional(),
  latest_token: OAuthTokenSchema.optional(),
  tokens: z.array(OAuthTokenSchema).optional(),
  created: z.number().optional(),
  updated: z.number().optional(),
  accessed: z.number().optional(),
});

export type UserSecurityProfile = z.infer<typeof UserSecurityProfileSchema>;

