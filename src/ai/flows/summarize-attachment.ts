"use server";

/**
 * @fileOverview Summarizes an email thread using Genkit and Gemini.
 *
 * - summarizeEmailThread - A function that summarizes an email thread.
 * - SummarizeEmailThreadInput - The input type for the summarizeEmailThread function.
 * - SummarizeEmailThreadOutput - The return type for the summarizeEmailThread function.
 */

import { ai } from "@/ai/genkit";
import {
  StandardEmail,
  EmailAbstractAttachmentSchema,
  StandardEmailSchema,
} from "@/types/gmail";
import { z } from "genkit";

const SummarizeAttachmentInputSchema = EmailAbstractAttachmentSchema.omit({
  summary: true,
  attachmentId: true,
});

type SummarizeAttacmentInput = z.infer<typeof SummarizeAttachmentInputSchema>;

const SummarizeAttachmentOutputSchema = z.object({
  summary: z.string().describe("A summary of the attachment."),
});

export type SummarizeAttachmentOutput = z.infer<
  typeof SummarizeAttachmentOutputSchema
>;

export async function summarizeAttachment(
  input: SummarizeAttacmentInput,
): Promise<SummarizeAttachmentOutput> {
  return await summarizeAttachmentFlow(input);
}


const summarizeAttachmentPrompt = ai.definePrompt({
  name: "summarizeAttachmentPrompt",
  // model: "googleai/gemini-2.0-flash-001",
  // model: "googleai/gemini-2.0-flash-lite-001",
  model: "googleai/gemini-2.5-flash-preview-05-20",
  // model: 'googleai/gemini-2.5-flash-preview-04-17',
  input: { schema: SummarizeAttachmentInputSchema },
  output: { schema: SummarizeAttachmentOutputSchema },
  config:  {temperature:0.1, topK:32, topP:0.95},
  prompt: `
{{role "user"}}
You are an **document analysis assistant** supporting a business operations team that facilitates RFx (RFI, RFQ, RFP) processes between buyers/requesters and suppliers/vendors. 


- Analyze an attachment document the team has received and provide a summary in markdown format without any greeting or conversation. 
- Provide a clear, informative, and actionable summary of file content. List out objective, key dates, contacts, qualification, and processes.

## Attachment Document 

- file name: {{filename}}

,media url:{{mimetype}};base64,
{{data}}
`.trim(),
});

const summarizeAttachmentFlow = ai.defineFlow(
  {
    name: 'summarizeAttachmentFlow',
    inputSchema: SummarizeAttachmentInputSchema,
    outputSchema: SummarizeAttachmentOutputSchema,
  },
  async input => {
    const { output } = await summarizeAttachmentPrompt(input)
    return output!;
  }
);

