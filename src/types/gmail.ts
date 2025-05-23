import { z } from "zod";

const GmailHeaderSchema = z.object({
  name: z.string(),
  value: z.string(),
});

const GmailBodySchema = z.object({
  size: z.number(),
  data: z.string().optional(),
  attachmentId: z.string().optional(),
});

const GmailPartBaseSchame = z.object({
  partId: z.string(),
  mimeType: z.string(),
  filename: z.string(),
  headers: z.array(GmailHeaderSchema),
  body: GmailBodySchema,
});

export const GmailPartSchema = GmailPartBaseSchame.extend({
  parts: z.array(GmailPartBaseSchame).optional(), // Recursive structure
});

export type PayloadPart = z.infer<typeof GmailPartSchema>;

export const GmailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  snippet: z.string().optional(),
  payload: z.object({
    partId: z.string(),
    mimeType: z.string(),
    filename: z.string(),
    headers: z.array(GmailHeaderSchema),
    body: GmailBodySchema.optional(),
    summary: z.string().optional(),
    parts: z.array(GmailPartSchema).optional(),
  }).optional(),
  sizeEstimate: z.number().optional(),
  historyId: z.string().optional(),
  internalDate: z.string().optional(),
  summary: z.string().optional(),
});

export type GmailMessage = z.infer<typeof GmailMessageSchema>;

export const GmailThreadSchema = z.object({
  id: z.string(),
  dbThreadKey: z.string().optional().describe(
    "Unique key of the thread this email belong to. It is not the threadId from Gmail because Gmail's thread id changes.",
  ),
  snippet: z.string().optional(),
  historyId: z.string().optional(),
  summary: z.string().optional(),
  messages: z.array(GmailMessageSchema),
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
    code: z.number().optional().describe("HTTP status code"),
    message: z.string().describe("Human-readable error message"),
    errors: z.array(
      z.record(z.unknown()) // <-- Modified line
        .optional()
        .describe("Array of error objects with unknown structure"),
    ),
    status: z.string().optional().describe("Status category name"),
  }).describe("Main error container"),
}).describe("Standard Google API error response format");

export type GRestError = z.infer<typeof GRestErrorSchema>;

const EmailAbstractPartSchema = z.object({
  mimetype: z.string().optional().describe("MIME type, e.g. 'text/plain'."),
  data: z.string().optional().describe("Base64-encoded content of the part."),
  summary: z.string().optional(),
});

export const EmailAbstractAttachmentSchema = z.object({
    filename: z.string().describe("Name of the attachment."),
    mimetype: z.string().describe("MIME type of the attachment."),
    data: z.string().optional().describe("Base64-encoded content of the attachment."),
    summary: z.string().optional().describe("Summary of the attachment."),
    attachmentId: z.string().optional().describe("Attachment ID from Gmail."),
  });

export type EmailAbstractAttachment = z.infer<typeof EmailAbstractAttachmentSchema>;

export const StandardEmailSchema = z.object({
  messageId: z.string().optional().describe("Unique ID for the email."),
  from: z.string().optional().describe("Sender of the email."),
  to: z.string().optional().describe("Recipient of the email."),
  subject: z.string().optional().describe("Subject line of the email."),
  receivedAt: z.string().optional().describe(
    "Timestamp when the email was received (RFC 2822).",
  ),
  snippet: z.string().optional().describe("Short snippet of the email by the email provider."),
  summary: z.string().optional().describe("Summary of the email."),
  parts: z.array(EmailAbstractPartSchema).optional().describe(
    "MIME parts of the email.",
  ),
  dbThreadKey: z.string().optional().describe(
    "Unique key of the thread this email belong to. It is not the threadId from Gmail because Gmail's thread id changes.",
  ),
  body: z.string().optional().describe("Body of the email."),
  attachments: z.array(EmailAbstractAttachmentSchema).optional().describe("Attachments of the email."),
});

export const StandardEmailListSchema = z.array(StandardEmailSchema).describe(
  "List of parsed email messages.",
);

export type StandardEmail = z.infer<typeof StandardEmailSchema>;

export const StandardEmailThreadSchema = z.object({
  dbThreadKey: z.string().optional().describe("Unique identifier of the thread in database."),
  summary: z.string().optional().describe("Summary of the thread."),
  messageIds: z.array(z.string()).describe("List of message IDs in the thread."),
  snippet: z.string().optional().describe("Snippet of the thread."),
  messages: StandardEmailListSchema.optional().describe("List of messages in the thread."),
});

export type StandardEmailThread = z.infer<typeof StandardEmailThreadSchema>;

// /**
//  * Schema for a standard email message.
//  * This schema parses parts fields into a string body and array of attachments.
//  * It omits the parts field from the EmailAbstractSchema.
//  * @see EmailAbstractSchema
//  */
// export const StandarEmailSchema = EmailAbstractSchema
//   .omit({ parts: true })
//   .extend({
//     dbThreadKey: z.string().optional().describe(
//       "Unique key of the thread this email belong to. It is not the threadId from Gmail because Gmail's thread id changes.",
//     ),
//     body: z.string().optional().describe("Body of the email."),
//     attachments: z.array(z.object({
//       filename: z.string().describe("Name of the attachment."),
//       mimetype: z.string().describe("MIME type of the attachment."),
//       data: z.string().describe("Base64-encoded content of the attachment."),
//     })).optional().describe("Attachments of the email."),
//   });

// export type StandardEmail = z.infer<typeof StandarEmailSchema>;
// export const StandardEmailListSchema = z.array(StandarEmailSchema).describe(
//   "List of parsed email messages.",
// );
// export type StandardEmailList = z.infer<typeof StandardEmailListSchema>;
