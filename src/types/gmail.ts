import { z } from "zod";

const HeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const BodySchema = z.object({
  size: z.number(),
  data: z.string().optional(),
  attachmentId: z.string().optional(),
});

const PayloadPartBaseSchame= z.object({
  partId: z.string(),
  mimeType: z.string(),
  filename: z.string(),
  headers: z.array(HeaderSchema),
  body: BodySchema,
});

export const PayloadPartSchema = PayloadPartBaseSchame.extend({
  parts: z.array(PayloadPartBaseSchame).optional(), // Recursive structure
});

export type PayloadPart = z.infer<typeof PayloadPartSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  snippet: z.string().optional(),
  payload: z.object({
    partId: z.string(),
    mimeType: z.string(),
    filename: z.string(),
    headers: z.array(HeaderSchema),
    body: BodySchema.optional(),
    summary: z.string().optional(),
    parts: z.array(PayloadPartSchema).optional(),
  }).optional(),
  sizeEstimate: z.number().optional(),
  historyId: z.string().optional(),
  internalDate: z.string().optional(),
  summary: z.string().optional(),
});

export type GmailMessage = z.infer<typeof MessageSchema>;

export const GmailThreadSchema = z.object({
  id: z.string(),
  historyId: z.string(),
  summary: z.string().optional(),
  messages: z.array(MessageSchema),
});

export type GmailThread = z.infer<typeof GmailThreadSchema>;

export const GmailThreadListSchema = z.object({
  threads: z.array(GmailThreadSchema).optional(),
  nextPageToken: z.string().optional(),
  resultSizeEstimate: z.number().optional(),
});

export type GmailThreadList = z.infer<typeof GmailThreadListSchema>;


export const GRestErrorSchema = z.object({
  error: z.object({
    code: z.number().optional().describe('HTTP status code'),
    message: z.string().describe('Human-readable error message'),
    errors: z.array(z.record(z.unknown()) // <-- Modified line
      .optional()
      .describe('Array of error objects with unknown structure')),
    status: z.string().optional().describe('Status category name'),
  }).describe('Main error container'),
}).describe('Standard Google API error response format');

export type GRestError = z.infer<typeof GRestErrorSchema>;

const EmailAbstractPartSchema = z.object({
  mimetype: z.string().optional().describe("MIME type, e.g. 'text/plain'."),
  data: z.string().optional().describe("Base64-encoded content of the part."),
  summary: z.string().optional(),
});

export const EmailAbstractSchema = z.object({
  messageId: z.string().optional().describe("Unique ID for the email."),
  from: z.string().optional().describe("Sender of the email."),
  to: z.string().optional().describe("Recipient of the email."),
  subject: z.string().optional().describe("Subject line of the email."),
  receivedAt: z.string().optional().describe("Timestamp when the email was received (RFC 2822)."),
  summary: z.string().optional(),
  parts: z.array(EmailAbstractPartSchema).optional().describe("MIME parts of the email.")
});

export const EmailAbstractListSchema = z.array(EmailAbstractSchema).describe("List of parsed email messages.");

export type EmailAbstract = z.infer<typeof EmailAbstractSchema>

