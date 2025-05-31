'use server';

/**
 * @fileOverview Summarizes an email thread using Genkit and Gemini.
 *
 * - summarizeEmailThread - A function that summarizes an email thread.
 * - SummarizeEmailThreadInput - The input type for the summarizeEmailThread function.
 * - SummarizeEmailThreadOutput - The return type for the summarizeEmailThread function.
 */

import { ai } from '@/ai/genkit';
import { StandardEmailSchema, StandardEmailThreadSchema } from '@/types/gmail';
import { z } from 'genkit';

const SummarizeEmailThreadInputSchema = StandardEmailThreadSchema;

export type SummarizeEmailThreadInput = z.infer<typeof SummarizeEmailThreadInputSchema>;

const SummarizeEmailThreadOutputSchema = z.object({
  summary: z.string().describe('A summary of the email thread.'),
});

export type SummarizeEmailThreadOutput = z.infer<typeof SummarizeEmailThreadOutputSchema>;

// const summarizeEmailThreadPrompt = ai.definePrompt({
//   name: 'summarizeEmailThreadPrompt',
//   // model: "googleai/gemini-2.0-flash-001",
//   model: "googleai/gemini-2.0-flash-lite-001",
//   // model: "googleai/gemini-2.5-flash-preview-05-20",
//   // model: 'googleai/gemini-2.5-flash-preview-04-17',
//   input: { schema: SummarizeEmailThreadInputSchema },
//   output: { schema: SummarizeEmailThreadOutputSchema },
//   prompt: `
// You are a procurement email analysis assistant supporting a business operations team that facilitates RFx (RFI, RFQ, RFP) processes between buyers/requesters and suppliers/vendors.

// Your task is to analyze the email thread and generate a clear, informative, and actionable summary to help the operations team understand and support the procurement process.

// Extract and present **all relevant RFx-related information**, based on what is available in the message.

// Focus on identifying and summarizing:

// - **Objective**: What is being sourced or requested?
// - **Document Number**: Is there a number reference such as requisition or procurement number?
// - **Vendor qualification requirements**: Any stated or implied criteria.
// - **RFx distribution process**: How the request/requisition will be sent or communicated.
// - **Clarification/Q&A process**: Instructions for vendor inquiries or clarification windows.
// - **Select and shortlist process**: Evaluation criteria, shortlisting plans, etc.
// - **Negotiation and award process**: Any information about pricing discussions, final selection, or contract award.
// - **Key dates and milestones**: Deadlines, events, decision points.
// - **Stakeholders and contacts**: Key people involved, roles, and contact details.

// {{#each messages}}

// ---
// ## **Email**
// - **From**: {{from}}
// - **Subject**: {{subject}}
// - **Received**: {{receivedAt}}

// **Email Summary**
// {{this.summary}}

// ---
// {{/each}}


// Analyze the email thread which is reverse chronological order (most recent first) and follow these steps:
// 1. Determine the **primary purpose** and **context**.
// 2. Extract all **available RFx-relevant details**, even if incomplete.
// 3. Connect information across the email and attachments.
// 4. Highlight **next steps, decisions, or follow-ups** needed.

// **Output**: Provide a **summary in markdown format** that is:
// - As long or short as needed, depending on the available relevant information.
// - Structured, clear, and easy for an operations team member to act on.
// - Comprehensive yet succinct — avoid fluff or repetition.
// `.trim()
// });

const summarizeEmailThreadPrompt = ai.prompt('email/email-thread-summarization');

const summarizeEmailThreadFlow = ai.defineFlow(
  {
    name: 'summarizeEmailThreadFlow',
    inputSchema: SummarizeEmailThreadInputSchema,
    outputSchema: SummarizeEmailThreadOutputSchema,
  },
  async input => {
    const { output } = await summarizeEmailThreadPrompt(input)
    return output!;
  }
);

export async function summarizeEmailThread(input: SummarizeEmailThreadInput): Promise<SummarizeEmailThreadOutput> {
  return summarizeEmailThreadFlow(input);
}