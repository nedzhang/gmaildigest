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
