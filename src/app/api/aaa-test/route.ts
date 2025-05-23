import { getUser } from "@/lib/gduser-util";
import { GmailThread, GRestErrorSchema } from "@/types/gmail";
import { googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import { NextResponse } from "next/server";

import gmailThread from "../../../../email-store/thread-196f373962a23259.json"
import { hydrateThread, parseGmailMessage } from "@/lib/stdmail-util";
import { summarizeAttachment } from "@/ai/flows/summarize-attachment";

import { promises as fs } from "fs";
import path from "path";
import logger from "@/lib/logger";


export async function GET() {
    
    // return testSafeParse();

    // return getGenKitModels();

    // return await testSummarizeAttachment();

    return await testHydrateEmailThread();

    // const user = await getUser("ned.zhang@paracognition.ai");
    // // logger.info("**aaa-test** getUser: ", user);

    // return NextResponse.json(user);
}

async function testHydrateEmailThread() {

    const outfilepath = path.join(process.cwd(), "email-store", "thread-196e98bc041bf1fc.json");

    const gthread = await fs.readFile(outfilepath, "utf-8");

    const gmailThread:GmailThread = JSON.parse(gthread);

    const fullThread = await hydrateThread("ned.zhang@paracognition.ai", gmailThread);

    return NextResponse.json(fullThread);
}

async function  testSummarizeAttachment() {

    // gmailThread.messages[0].payload

    const stdEmail = await parseGmailMessage("ned.zhang@paracognition.ai", gmailThread.messages[0], true);

    // logger.info("**testSummarizeAttachment** stdEmail:", stdEmail);

    const outfilepath = path.join(process.cwd(), "email-store", "stdEmail.json");
    await fs.writeFile(outfilepath, JSON.stringify(stdEmail, null, 2));

    const summary = await summarizeAttachment(stdEmail.attachments![0]);

    stdEmail.attachments![0].summary = summary.summary;

    return NextResponse.json(summary);
}

function getGenKitModels() {

    return NextResponse.json(googleAI.toString());

}

function testSafeParse() {
    const response = {
        "threads": [
            {
                "id": "196f3e23c71b9d88",
                "snippet": "Do your best work with better tools. ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏",
                "historyId": "5010"
            },
            {
                "id": "196f373962a23259",
                "snippet": "can you create a task for this rfq?",
                "historyId": "4942"
            },
            {
                "id": "196e98bc041bf1fc",
                "snippet": "Put your subscription to work. Your paid subscription starts tomorrow. The billing period for your paid subscription to Google Workspace begins tomorrow. To view your account information, sign in to",
                "historyId": "4637"
            },
            {
                "id": "196e95c84cbbb12b",
                "snippet": "Firebase Gmail Digest Ned Zhang added you as a collaborator on the project &#39;Gmail Digest&#39; Ned Zhang ned.zhang@gmail.com ned.zhang@paracognition.ai, I&#39;ve given you access to the Firebase",
                "historyId": "4430"
            },
            {
                "id": "196d4f2440b8d1b1",
                "snippet": "Explore what you can do with Google Workspace Google Workspace offers professional email and more. When you set up your account, you can: Access Google Workspace from your iOS or Android device Give",
                "historyId": "3916"
            },
            {
                "id": "196b618cc77d0e8a",
                "snippet": "Save time with streamlined connections. ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏",
                "historyId": "3026"
            },
            {
                "id": "196b0e90602c045f",
                "snippet": "We think you&#39;ll love these tips. ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏ ‍͏ ͏",
                "historyId": "2678"
            },
            {
                "id": "196a719f88cbe0b2",
                "snippet": "Hi Ned, Things are progressing well on my end. I&#39;m still considering the best approach for our go-to-market strategy for the RFQ idea. Best, Edwyn On Tue, May 6, 2025 at 2:36 PM Ned Zhang &lt;ned.",
                "historyId": "2245"
            },
            {
                "id": "196a6bd85a8fffb4",
                "snippet": "Get the most out of your free trial. ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌ ‌",
                "historyId": "1846"
            },
            {
                "id": "196a6b14a102596a",
                "snippet": "Recovery email was verified for ned.zhang@paracognition.ai The recovery email edwynzh@gmail.com was verified for your account. Manage settings You can also see security activity at https://myaccount.",
                "historyId": "1593"
            },
            {
                "id": "196a6a9f4879e4b7",
                "snippet": "Dear Ned Z, Could you please verify your email address at your earliest convenience? Thank you for your attention to this matter. Best regards, Edwyn Zhang",
                "historyId": "2244"
            },
            {
                "id": "196a698914e2e973",
                "snippet": "Welcome to your inbox Find emails fast With the power of Google Search in your inbox, you can archive all your email and find it later in a flash. Your inbox stays tidy, and you never need to worry",
                "historyId": "1249"
            },
            {
                "id": "196a698900f5e94c",
                "snippet": "Get the official Gmail app The best features of paracognition ai Mail are only available on your phone and tablet with the official Gmail app. Download the app or go to gmail.com on your computer or",
                "historyId": "1180"
            }
        ],
        "resultSizeEstimate": 14
    }

    const parseResult = GRestErrorSchema.safeParse(response);

    logger.info("**testSafeParse** parseResult: ", parseResult);
}