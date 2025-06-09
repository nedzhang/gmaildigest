'use server';

/**
 * @fileOverview Summarizes an email thread using Genkit and Gemini.
 *
 * - summarizeEmailThread - A function that summarizes an email thread.
 * - SummarizeEmailThreadInput - The input type for the summarizeEmailThread function.
 * - SummarizeEmailThreadOutput - The return type for the summarizeEmailThread function.
 */
import '@/ai/schema/email';
import { SummarizeEmailInput, SummarizeEmailInputSchema,
   SummarizeEmailOutput, SummarizeEmailOutputSchema } from '@/ai/schema/email';
import { ai } from '@/ai/genkit';


// const SummarizeEmailInputSchema = StandardEmailSchema;

// export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

// const SummarizeEmailOutputSchema = z.object({
//   summary: z.string().describe('Summary of the email and its attachments.'),
// });

// export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;




// - **To**: {{to}}

// const summarizeEmailPrompt = ai.definePrompt({
//   name: 'summarizeEmailPrompt',
//   // model: "googleai/gemini-2.0-flash-001",
//   model: "googleai/gemini-2.0-flash-lite-001",
//   // model: "googleai/gemini-2.5-flash-preview-05-20",
//   // model: 'googleai/gemini-2.5-flash-preview-04-17',
//   input: { schema: SummarizeEmailInputSchema },
//   output: { schema: SummarizeEmailOutputSchema },
//   prompt: `
// You are a procurement email analysis assistant supporting a business operations team that facilitates RFx (RFI, RFQ, RFP) processes between buyers/requesters and suppliers/vendors.

// Your task is to analyze the email and generate accurate, clear, and actionable summary to help the operations team understand and support the procurement process — **even if the email is part of a longer thread or only provides partial context**.

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

// ---

// **Email Metadata**
// - **From**: {{from}}
// - **Subject**: {{subject}}
// - **Received**: {{receivedAt}}

// **Email Body**

// {{body}}

// {{#if attachments.length}}
// **Attachments**
// {{#each attachments}}

// - **Filename**: {{this.filename}} 

// - **Summary**: 
// {{this.summary}}

// {{/each}}
// {{/if}}

// ---

// **Final Instructions**:

// Analyze the email and any attachments to:
// 1. Determine the **primary purpose** and **context**.
// 2. Extract all **available RFx-relevant details**, even if incomplete but do not make up any facts.
// 3. Connect information across the email and attachments.
// 4. Highlight **next steps, decisions, or follow-ups** needed.

// **Output**: Provide a **summary document in markdown format** that is:
// - As long or short as needed, depending on the available relevant information.
// - Accurate, structured, clear, and easy for an operations team member to act on. Not to make up any facts that are not present in the email.
// - Comprehensive yet succinct — avoid fluff or repetition.
// - without any greeting or chat-like language.
// `.trim()
// });

const prompt = ai.prompt('email-summarize-message/deekseek-chatv3-v01');
// const prompt = ai.prompt('email-summarize-message/googleai-v02');

const flow = ai.defineFlow(
  {
    name: 'summarizeEmailFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
  },
  async input => {
    const { output } = await prompt(input)
    return output!;
  }
);

export async function summarizeEmailFlow(input: SummarizeEmailInput): Promise<SummarizeEmailOutput> {
  return await flow(input);
}


