'use server';

/**
 * @fileOverview Summarizes an email thread using Genkit and Gemini.
 *
 * - summarizeEmailThread - A function that summarizes an email thread.
 * - SummarizeEmailThreadInput - The input type for the summarizeEmailThread function.
 * - SummarizeEmailThreadOutput - The return type for the summarizeEmailThread function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEmailThreadInputSchema = z.object({
  threadId: z.string().describe('The ID of the email thread to summarize.'),
  emails: z.array(
    z.object({
      sender: z.string().describe('The sender of the email.'),
      subject: z.string().describe('The subject of the email.'),
      body: z.string().describe('The body of the email.'),
      receivedAt: z.string().describe('The time the email was received at.'),
    })
  ).describe('The emails in the thread.'),
});
export type SummarizeEmailThreadInput = z.infer<typeof SummarizeEmailThreadInputSchema>;

const SummarizeEmailThreadOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the email thread.'),
});
export type SummarizeEmailThreadOutput = z.infer<typeof SummarizeEmailThreadOutputSchema>;

export async function summarizeEmailThread(input: SummarizeEmailThreadInput): Promise<SummarizeEmailThreadOutput> {
  return summarizeEmailThreadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEmailThreadPrompt',
  input: {schema: SummarizeEmailThreadInputSchema},
  output: {schema: SummarizeEmailThreadOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing email threads.

  Given the following email thread, provide a concise and informative summary:

  {% each emails %}
  ------------------------------------
  Sender: {{{this.sender}}}
  Subject: {{{this.subject}}}
  Received At: {{{this.receivedAt}}}
  Body: {{{this.body}}}
  ------------------------------------
  {% endeach %}

  Summary:`, // No Handlebars if/else blocks, function calls, or awaits.
});

const summarizeEmailThreadFlow = ai.defineFlow(
  {
    name: 'summarizeEmailThreadFlow',
    inputSchema: SummarizeEmailThreadInputSchema,
    outputSchema: SummarizeEmailThreadOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
