import {
  EmailAbstractAttachmentSchema,
  StandardEmailSchema,
  StandardEmailThreadSchema,
} from "@/types/gmail";
import { z } from "zod";
import { ai } from "../genkit";

// ##############################################################
// ************************ Email Thread ************************
// ##############################################################

const SummarizeEmailThreadInputSchema = StandardEmailThreadSchema;

// Define the schema so we can use it in our prompt files.
ai.defineSchema(
  "SummarizeEmailThreadInputSchema",
  SummarizeEmailThreadInputSchema,
);

export const SummarizeEmailThreadOutputSchema = z.object({
  summary: z.string().describe("A summary of the email thread."),
});

export type SummarizeEmailThreadOutput = z.infer<
  typeof SummarizeEmailThreadOutputSchema
>;

// Define the schema so we can use it in our prompt files.
ai.defineSchema(
  "SummarizeEmailThreadOutputSchema",
  SummarizeEmailThreadOutputSchema,
);

// ##############################################################
// ************************ Attachment **************************
// ##############################################################
export const SummarizeAttachmentInputSchema = EmailAbstractAttachmentSchema.omit({
  summary: true,
  attachmentId: true,
});

export type SummerizeAttachmentInput = z.infer<
  typeof SummarizeAttachmentInputSchema
>;

ai.defineSchema(
  "SummarizeAttachmentInputSchema",
  SummarizeAttachmentInputSchema,
);

export const SummarizeAttachmentOutputSchema = z.object({
  summary: z.string().describe("A summary of the attachment."),
});

export type SummarizeAttachmentOutput = z.infer<
  typeof SummarizeAttachmentOutputSchema
>;

ai.defineSchema(
  "SummarizeAttachmentOutputSchema",
  SummarizeAttachmentOutputSchema,
);

// ##############################################################
// ************************ Email *******************************
// ##############################################################

export const SummarizeEmailInputSchema = StandardEmailSchema;

export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

ai.defineSchema("SummarizeEmailInputSchema", SummarizeEmailInputSchema);

export const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe("Summary of the email and its attachments."),
});

export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;

ai.defineSchema("SummarizeEmailOutputSchema", SummarizeEmailOutputSchema);
