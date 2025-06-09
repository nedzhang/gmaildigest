"use server";


import { ai } from "@/ai/genkit";
import { EmailAbstractAttachmentSchema } from "@/types/gmail";
import { z } from "genkit";

const SummarizeTextInputSchema = EmailAbstractAttachmentSchema
  .omit({
    summary: true,
    attachmentId: true,
  });

type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

ai.defineSchema("SummarizeTextInput", SummarizeTextInputSchema);

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe("A summary of the attachment."),
});

export type SummarizeTextOutput = z.infer<
  typeof SummarizeTextOutputSchema
>;

ai.defineSchema("SummarizeTextOutput", SummarizeTextOutputSchema);

const summarizeTextPrompt = ai.prompt(
  "email-summarize-attachment/deepseekv3text-v03",
);

const summarizeTextFlow = ai.defineFlow(
  {
    name: "summarizeTextFlow",
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    // // the input.data should be base64 encoded string
    // // but Googleapi returns base64url encoded. We need to change to base64 encoding
    // if (input.data) {
    //   input.data = base64UrlToBase64(input.data);
    // }
    const { output } = await summarizeTextPrompt(input);
    return output!;
  },
);

export async function summarizeText(
  input: SummarizeTextInput,
): Promise<SummarizeTextOutput> {
  return await summarizeTextFlow(input);
}
