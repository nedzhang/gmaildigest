'use server';

/**
 * @fileOverview Summarizes an email thread using Genkit and Gemini.
 *
 * - summarizeEmailThread - A function that summarizes an email thread.
 * - SummarizeEmailThreadInput - The input type for the summarizeEmailThread function.
 * - SummarizeEmailThreadOutput - The return type for the summarizeEmailThread function.
 */

import { ai } from '@/ai/genkit';
import { EmailAbstractSchema } from '@/types/gmail';
import { z } from 'genkit';

// const SummarizeEmailThreadInputSchema = z.object({
//   threadId: z.string().describe('The ID of the email thread to summarize.'),
//   emails: z.array(
//     z.object({
//       sender: z.string().describe('The sender of the email.'),
//       subject: z.string().describe('The subject of the email.'),
//       body: z.string().describe('The body of the email.'),
//       receivedAt: z.string().describe('The time the email was received at.'),
//     })
//   ).describe('The emails in the thread.'),
// });
// export type SummarizeEmailThreadInput = z.infer<typeof SummarizeEmailThreadInputSchema>;

// const SummarizeEmailInputSchema = z.object({
//   messageId: z.string().describe('The ID of the email to summarize.'),
//   parts: z.array(
//     z.object({
//       mimetype: z.string().describe('mimetype of the part'),
//       data: z.string().describe('base64 of the data'),
//   })).optional().describe('The parts of the email to summarize.'),
// });


const GEmailAbstractPartSchema = z.object({
  mimetype: z.string().optional().describe("MIME type, e.g. 'text/plain'."),
  data: z.string().optional().describe("Base64-encoded content of the part."),
});

const GEmailAbstractSchema = z.object({
  messageId: z.string().optional().describe("Unique ID for the email."),
  from: z.string().optional().describe("Sender of the email."),
  to: z.string().optional().describe("Recipient of the email."),
  subject: z.string().optional().describe("Subject line of the email."),
  receivedAt: z.string().optional().describe("Timestamp when the email was received (RFC 2822)."),
  parts: z.array(GEmailAbstractPartSchema).optional().describe("MIME parts of the email.")
});

const SummarizeEmailInputSchema = GEmailAbstractSchema;

export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

// const SummarizeEmailThreadOutputSchema = z.object({
//   summary: z.string().describe('A concise summary of the email thread.'),
// });
// export type SummarizeEmailThreadOutput = z.infer<typeof SummarizeEmailThreadOutputSchema>;


const SummarizeEmailOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the email and its parts.'),
});

export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;


export async function summarizeEmail(input: SummarizeEmailInput): Promise<SummarizeEmailOutput> {
  return summarizeEmailThreadFlow(input);
}

// const prompt = ai.definePrompt({
//   name: 'summarizeEmailThreadPrompt',
//   input: {schema: SummarizeEmailInputSchema},
//   output: {schema: SummarizeEmailOutputSchema},
//   prompt: `You are an AI assistant tasked with summarizing email threads.

//   Given the following email thread, provide a concise and informative summary:

//   {% each emails %}
//   ------------------------------------
//   Sender: {{{this.sender}}}
//   Subject: {{{this.subject}}}
//   Received At: {{{this.receivedAt}}}
//   Body: {{{this.body}}}
//   ------------------------------------
//   {% endeach %}

//   Summary:`, // No Handlebars if/else blocks, function calls, or awaits.
// });

// - **To**: {{to}}

const summarizeEmailPrompt = ai.definePrompt({
  name: 'summarizeEmailPrompt',
  // model: "googleai/gemini-2.0-flash-001",
  // model: "googleai/gemini-2.0-flash-lite-001",
  model: "googleai/gemini-2.5-flash-preview-05-20",
  // model: 'googleai/gemini-2.5-flash-preview-04-17',
  input: { schema: SummarizeEmailInputSchema },
  output: { schema: SummarizeEmailOutputSchema },
  prompt: `
You are a procurement email analysis assistant supporting a business operations team that facilitates RFx (RFI, RFQ, RFP) processes between buyers/requesters and suppliers/vendors.

Your task is to analyze the email, which is in multiple parts, and generate a clear, informative, and actionable summary to help the operations team understand and support the procurement process — **even if the email is part of a longer thread or only provides partial context**.

Extract and present **all relevant RFx-related information**, based on what is available in the message.

Focus on identifying and summarizing:

- **Objective**: What is being sourced or requested?
- **Document Number**: Is there a number reference such as requisition or procurement number?
- **Vendor qualification requirements**: Any stated or implied criteria.
- **RFx distribution process**: How the request/requisition will be sent or communicated.
- **Clarification/Q&A process**: Instructions for vendor inquiries or clarification windows.
- **Select and shortlist process**: Evaluation criteria, shortlisting plans, etc.
- **Negotiation and award process**: Any information about pricing discussions, final selection, or contract award.
- **Key dates and milestones**: Deadlines, events, decision points.
- **Stakeholders and contacts**: Key people involved, roles, and contact details.

---

**Email Metadata**
- **From**: {{from}}
- **Subject**: {{subject}}
- **Received**: {{receivedAt}}

**Email Body**
The email includes its text/plain and text/html, which usualy have same content. If there is any attachment, it would be part of itself with its mimetype informatiob.

{{#each parts}}
**Part {{this.mimetype}}**

url=data:{{this.mimetype}};base64,{{this.data}}

{{/each}}

---

Analyze the email and attachments to:
1. Determine the **primary purpose** and **context**.
2. Extract all **available RFx-relevant details**, even if incomplete.
3. Connect information across the email and attachments.
4. Highlight **next steps, decisions, or follow-ups** needed.

**Output**: Provide a **summary in markdown format** that is:
- As long or short as needed, depending on the available relevant information.
- Structured, clear, and easy for an operations team member to act on.
- Comprehensive yet succinct — avoid fluff or repetition.
`.trim()
});

const summarizeEmailThreadFlow = ai.defineFlow(
  {
    name: 'summarizeEmailThreadFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
  },
  async input => {
    const { output } = await summarizeEmailPrompt(input)
    return output!;
  }
);
