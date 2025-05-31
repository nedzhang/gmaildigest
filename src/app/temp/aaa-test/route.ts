import { getUser } from "@/lib/gduser-util";
import { GmailThread, GRestErrorSchema } from "@/types/gmail";
import { googleAI } from "@genkit-ai/googleai";
import { genkit } from "genkit";
import { NextRequest, NextResponse } from "next/server";

import gmailThread from "../../../../email-store/thread-196f373962a23259.json"
import { hydrateThread, parseGmailMessage } from "@/lib/stdmail-util";
import { summarizeAttachment } from "@/ai/flows/summarize-attachment";

import { promises as fs } from "fs";
import path from "path";
import logger, { LogContext, makeLogEntry } from "@/lib/logger";
import { getAttachment } from "@/lib/gmail-util";
import { runUserEmailThreadsSummarization } from "@/job/emailThreadSummarization";


export async function GET(req: NextRequest) {
    
    const requestId = req.headers.get("x-request-id") || "";

    // return await testGetAttachment();
    // return testSafeParse();

    // return getGenKitModels();

    // return await testSummarizeAttachment(requestId);

    // return await testHydrateEmailThread(requestId);

    return await testRunUserEmailThreadsSummarization(requestId);

    // const user = await getUser("ned.zhang@paracognition.ai");
    // // logger.info("**aaa-test** getUser: ", user);

    // return NextResponse.json(user);
}

async function testGetAttachment(requestId: string) {
    const attachment = await getAttachment({ requestId }, "ned.zhang@paracognition.ai", 
        "196f373962a23259", 
        "ANGjdJ8-xiqcs8tmfFx1p1SNaS_dodp7ZppjTQjQEjhu5mHz14pSKmZMW3-uImfGekAXEBy3h42AoxS5SSf8D0qBKAZB8UYcI7K9vS6nazq-Yd4llKDVlfX45TvWrNRBl1MiEXUsGHtW4gROPJofmdoeCbCzpTozB_5WT_RhO7uMLS6LjdboKwFE53s-7PIziEeVAehRy4sqEiB32uJBqcvOHqh64wHurWlfFBsm71EwkofzNIfaayFzo3rVDp-srEmxrPQnlQieKXivkGhmXZQRTji8jx-rgQw2fG-uH1jzA7V9AniVAoQt8evQZi28Cv3LWrOJeHWjIgH_oJV94mBOXMpoGj-6PRHGqXqidfsEFTxFGmbo9883W5xekNp8n4owsJq9m_CM3XjEAO1R");
    return NextResponse.json(attachment);
}

async function testHydrateEmailThread(requestId: string) {

    const outfilepath = path.join(process.cwd(), "email-store", "thread-196e98bc041bf1fc.json");

    const gthread = await fs.readFile(outfilepath, "utf-8");

    const gmailThread:GmailThread = JSON.parse(gthread);

    const fullThread = await hydrateThread( { requestId }, "ned.zhang@paracognition.ai", gmailThread);

    return NextResponse.json(fullThread);
}

async function  testSummarizeAttachment(requestId: string) {

    // gmailThread.messages[0].payload

    const stdEmail = await parseGmailMessage({ requestId }, "ned.zhang@paracognition.ai", gmailThread.messages[0], true);

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

async function testRunUserEmailThreadsSummarization(requestId: string) {
    await runUserEmailThreadsSummarization({ requestId }, "ned.zhang@paracognition.ai");
    return NextResponse.json({ message: "runUserEmailThreadsSummarization started" });
}

function testSafeParse(requestId: string) {
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

    logger.info(makeLogEntry( {
        time: Date.now(),
        module: "aaa-test",
        function: "testSafeParse",
        requestId,
    }, { parseResult }, "**testSafeParse** safePrase returned result."));
}