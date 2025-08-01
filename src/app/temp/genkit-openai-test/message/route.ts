import "@/ai/schema/email";

import {
  SummarizeEmailInput,
  SummarizeEmailInputSchema,
  SummarizeEmailOutput,
  SummarizeEmailOutputSchema,
} from "@/ai/schema/email";
import logger, { createLogContext, createLogger } from "@/lib/logger";
import dotenv from "dotenv";
import { ai } from "@/ai/genkit";
import { NextRequest, NextResponse } from "next/server";
import { summarizeEmailFlow } from "@/ai/flows/summarize-message";


dotenv.config();

// const openai = new OpenAI({
//   baseURL: "https://openrouter.ai/api/v1",
//   apiKey: process.env.OPENAI_API_KEY,
//   // defaultHeaders: {
//   //   'HTTP-Referer': '<YOUR_SITE_URL>', // Optional. Site URL for rankings on openrouter.ai.
//   //   'X-Title': '<YOUR_SITE_NAME>', // Optional. Site title for rankings on openrouter.ai.
//   // },
// });

// const ai = genkit({
//   plugins: [
//     openAI({
//       apiKey: process.env.OPENAI_API_KEY,
//       baseURL: "https://openrouter.ai/api/v1", // organization, project,
//     }),
//   ],
//   // You can specify a default model if desired:
//   // model: gpt35Turbo,
//   // model: deepseek/deepseek-chat-v3-0324:free
// });

// const prompt = ai.prompt('email/summarize-message');

// const flow = ai.defineFlow(
//   {
//     name: 'summarizeEmailFlow',
//     inputSchema: SummarizeEmailInputSchema,
//     outputSchema: SummarizeEmailOutputSchema,
//   },
//   async input => {
//     const { output } = await prompt(input)
//     return output!;
//   }
// );

const emailToTest: SummarizeEmailInput = {
  "messageId": "196a698900f5e94c",
  "from": "Gmail Team <mail-noreply@google.com>",
  "to": "Edwyn Zhang <ned.zhang@paracognition.ai>",
  "subject": "Get the official Gmail app",
  "receivedAt": "Tue, 6 May 2025 10:15:38 -0700",
  "snippet":
    "Get the official Gmail app The best features of paracognition ai Mail are only available on your phone and tablet with the official Gmail app. Download the app or go to gmail.com on your computer or",
  // "summary":
  //     "This email is a notification from the Gmail Team to promote the official Gmail app and does not contain any RFx-related information. No procurement or sourcing activity is indicated.",
  "dbThreadKey": "196a698900f5e94c",
  "body":
    '<!DOCTYPE html><html><head><meta http-equiv="content-type" content="text/html;charset=UTF-8"/><title>Get the official Gmail app</title></head><body style="direction:ltr;text-align:left;background-color:#f8f9fa; margin:20px 0;"><br/><div style="margin:2%;"><div style="width:100%;margin:0 auto 0 auto;"><table style="vertical-align:middle;width:580px;margin:0 auto 0 auto;border:1px; border-color:black;"><tr><td><img src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_2x_r2.png" srcset="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r2.png 1x, https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_2x_r2.png 2x" alt="Gmail" style="float:left;max-height:40px;margin:0 20px 10px 20px;"/></td></tr></table></div><div style="font-family:Roboto,\'Open sans\',Arial,sans-serif;color:#444; background-color:#fff;max-width:600px;margin:10px auto 0 auto;"><table style="background:#fff;width:100%;border-collapse:collapse;border-color:#e8eaed; border-spacing:0;border-style:solid;border-width:1px;display:table; padding:0 20px 0 20px;position:relative;"><tr><td style="padding:5px 20px 0 20px;"><div style="width:90%;padding-left:15px;"><p><span style="font-family:\'Google sans\',Arial,sans-serif;font-weight:700;line-height:32px; font-size:24px;">Get the official Gmail app</span></p></div><table><tr><td style="font-family:Roboto,\'Open sans\',Arial,sans-serif;padding-left:15px; padding-right:25px;width:60%;"><span style="color:#3c4043;font-family:Roboto,Helvetica,Arial,sans-serif;font-size:14px; font-weight:400;line-height:24px;">The best features of paracognition ai Mail are only available on your phone and tablet with the official Gmail app. Download the app or go to <a href="https://gmail.com" style="text-decoration:none;color:#15c;">gmail.com</a> on your computer or mobile device to get started.</span></td><td><img src="https://ssl.gstatic.com/accounts/services/mail/msa/gmail-app-mobile-ui2x.png" srcset="https://ssl.gstatic.com/accounts/services/mail/msa/gmail-app-mobile-ui1x.png 1x, https://ssl.gstatic.com/accounts/services/mail/msa/gmail-app-mobile-ui2x.png 2x" style="padding:0 0 0 0;display:inline;margin-left:auto;max-height:150px;"></td></tr></table></td></tr><tr><td style="padding:0 20px 0 20px;"><div style="margin:0 20px 20px 15px;"><table style="width:100%;border-collapse:collapse;border:0;"><tr><td style="width:50%;padding-left:0;"><a href="https://play.google.com/store/apps/details?id=com.google.android.gm&amp;hl=en"><img src="https://ssl.gstatic.com/accounts/services/mail/msa/google_play_store_badge_en.png" alt="Get it on Google Play" style="display:block;height:45px;padding-left:30px;"/></a></td><td style="width:50%;padding-right:20px;"><a href="https://apps.apple.com/app/gmail-email-by-google/id422689480?l=en"><img src="https://ssl.gstatic.com/accounts/services/mail/msa/apple_app_store_badge_en.png" alt="Apple App Store" style="display:block;height:45px;padding-right:60px;"/></a></td></tr><tr><td style="text-align:left;font-family:Roboto,\'Open sans\',Arial,sans-serif; vertical-align:bottom;"><br/><span style="color:#3c4043;font-family:\'Google Sans\',Helvetica,Arial,sans-serif;font-size:14px; font-weight:700;line-height:24px;">Happy emailing,</span><br/><span style="color:#3c4043;font-family:\'Google Sans\',Helvetica,Arial,sans-serif;font-size:14px; font-weight:700;line-height:24px;">The Gmail Team</span></td></tr></table></div></td></tr></table></div><div style="text-align:left;"><table style="vertical-align:middle;width:580px;margin:0 auto 0 auto;"><tr><td><img src="https://storage.googleapis.com/support-kms-prod/Yd1rPlunjtOKzNDXcw3eFmVCjI828xhBZqQy" alt="Google Cloud" style="float:left;width:140px;height:auto;margin:24px 20px 0 20px;"/></td></tr><tr><td style="margin-top:12px;"><p style="line-height:20px;color:#6c737f;font-size:12px;font-weight:400; margin:12px 20px 12px 20px;font-family:Roboto,Arial,Helvetica,sans-serif; text-align:left;">© 2025 Google LLC 1600 Amphitheatre Parkway, Mountain View, CA 94043</p><p style="line-height:20px;color:#6c737f;font-size:12px;font-weight:400; margin:12px 20px 12px 20px;font-family:Roboto,Arial,Helvetica,sans-serif; text-align:left;"><em>You’re receiving this mandatory email service announcement to update you about important changes to your Google Cloud product or account.</em></p></td></tr></table></div></div></body></html>\r\n',
};

export async function GET(req: NextRequest) {
  const logContext = createLogContext({ req });

  const functionLogger = createLogger(logContext, {
    module: 'genkit-openai-test',
    function: 'GET',
  })

  functionLogger.info(
    { ai },
    "**genkit-openai-test** genkit ai object initialized.",
  );

  const aiResponse = await summarizeEmailFlow(emailToTest);

  // const aiResponse = await openai.chat.completions.create({
  //   model: "deepseek/deepseek-chat-v3-0324:free",
  //   messages: [
  //     {
  //       role: "user",
  //       content: "What is the meaning of life?",
  //     },
  //   ],
  // });

  functionLogger.info(
    { aiResponse },
    "**genkit-openai-test** genkit ai flow responded.",
  );
  
  return NextResponse.json(aiResponse);
}
