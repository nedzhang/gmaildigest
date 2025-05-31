import * as genkit from '@genkit-ai/core';
import { generate } from '@genkit-ai/ai';
import fs from 'fs';
import { StandardEmail, GmailMessage, GmailThread, PayloadPart } from '@/types/gmail';
import { getAttachment } from '@/lib/gmail-util';
import { getSession } from '@/lib/session';
import { NextDataPathnameNormalizer } from 'next/dist/server/normalizers/request/next-data';
import { NextRequest, NextResponse } from 'next/server';
import { decodeUnicodeEscapes } from '@/lib/string-util';
import { getEmailAbstract } from '@/lib/gduser-util';
import { summarizeEmailFlow } from '@/ai/flows/summarize-message'
import path from 'path';
import logger, { LogContext } from '@/lib/logger';


const testThread: GmailThread = {
    "id": "196f373962a23259",
    "historyId": "4942",
    "messages": [
        {
            "id": "196f373962a23259",
            "threadId": "196f373962a23259",
            "labelIds": [
                "UNREAD",
                "IMPORTANT",
                "CATEGORY_PERSONAL",
                "INBOX"
            ],
            "snippet": "can you create a task for this rfq?",
            "payload": {
                "partId": "",
                "mimeType": "multipart/mixed",
                "filename": "",
                "headers": [
                    {
                        "name": "Delivered-To",
                        "value": "pcbot@paracognition.ai"
                    },
                    {
                        "name": "Received",
                        "value": "by 2002:a54:30ca:0:b0:296:8e81:71cb with SMTP id e10csp1057440ecs;        Wed, 21 May 2025 08:26:02 -0700 (PDT)"
                    },
                    {
                        "name": "X-Received",
                        "value": "by 2002:a17:903:2f0e:b0:22e:7f20:52ed with SMTP id d9443c01a7336-231d43b63b0mr248842195ad.20.1747841160751;        Wed, 21 May 2025 08:26:00 -0700 (PDT)"
                    },
                    {
                        "name": "ARC-Seal",
                        "value": "i=1; a=rsa-sha256; t=1747841160; cv=none;        d=google.com; s=arc-20240605;        b=I4mxbSlF+RH5ih6aa6C7Ol4OPHK69/sW8fG78plszDri8hGL25KPhtw7gqq3txkUXe         XYz9ptoRViNXft1jJZDImT6+btx6m2HPH+kTzJWFhQx02vY/F87ZX6I5gtaY3Uzvyxta         zVUAGEKOeg711L116dmug9HDTj5yybookxq/fdyQjudx9TAPMH1YtWz0ObYeMM4GCN97         yNfJ4173aM5TbuM/QDGfFbbfBb5uytZj6+TRzOI+yBlhnAPgWSnOoqZEfSNYHX5BW5wc         bcJ7yNnomuax+29WKuFYgKZZgaaStyUxuIHu8ki8oRqZDeffUdzX7p3Mx0cQX1EIXuDl         3NHw=="
                    },
                    {
                        "name": "ARC-Message-Signature",
                        "value": "i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;        h=to:subject:message-id:date:from:mime-version:dkim-signature;        bh=KYgEICCne4ujg/Y+SXBUG6xLBtld5Jj2kFGnyLiMnfU=;        fh=zdSr2JFS+5o66pBvGOQ35QIyeZYm/wj+XoaoU5DRm9E=;        b=drkY9nXFpZRiCYichc2T12Be658Mfs0SjGhjFUswfTtCeZLj/uLRIra3cYgiAWww+x         t3FIW3wcbhG/CvBqynK/Wm/XbGmNDiCiEvmW59Iany2ls7titv/ktEgrxZ0OyXiQ2cDo         umxv+ebeNADPt3mUAjYQuX98B+gDLQKadMF2gOLREANiDRsbrQctFkPNJH/QesEIvVyZ         HLnqYPCa3kd9KtOlHUS0b7rtygNHrQsp0Fwg1ZIcoWlXsDldGxLl7ovH1r2o5iEk2BKn         r6b+DVb7/BF105rSNIhduSl0TBp2Ofq5Y4QU4UhROlom7mfSFyAvZCEl2Yd//CCHofU5         cyNQ==;        dara=google.com"
                    },
                    {
                        "name": "ARC-Authentication-Results",
                        "value": "i=1; mx.google.com;       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z3CEaLCJ;       spf=pass (google.com: domain of edwynzh@gmail.com designates 209.85.220.65 as permitted sender) smtp.mailfrom=edwynzh@gmail.com;       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com;       dara=pass header.i=@paracognition.ai"
                    },
                    {
                        "name": "Return-Path",
                        "value": "\u003Cedwynzh@gmail.com\u003E"
                    },
                    {
                        "name": "Received",
                        "value": "from mail-sor-f65.google.com (mail-sor-f65.google.com. [209.85.220.65])        by mx.google.com with SMTPS id d9443c01a7336-231d4d1fb38sor69857045ad.10.2025.05.21.08.26.00        for \u003Cpcbot@paracognition.ai\u003E        (Google Transport Security);        Wed, 21 May 2025 08:26:00 -0700 (PDT)"
                    },
                    {
                        "name": "Received-SPF",
                        "value": "pass (google.com: domain of edwynzh@gmail.com designates 209.85.220.65 as permitted sender) client-ip=209.85.220.65;"
                    },
                    {
                        "name": "Authentication-Results",
                        "value": "mx.google.com;       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z3CEaLCJ;       spf=pass (google.com: domain of edwynzh@gmail.com designates 209.85.220.65 as permitted sender) smtp.mailfrom=edwynzh@gmail.com;       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com;       dara=pass header.i=@paracognition.ai"
                    },
                    {
                        "name": "DKIM-Signature",
                        "value": "v=1; a=rsa-sha256; c=relaxed/relaxed;        d=gmail.com; s=20230601; t=1747841159; x=1748445959; darn=paracognition.ai;        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject         :date:message-id:reply-to;        bh=KYgEICCne4ujg/Y+SXBUG6xLBtld5Jj2kFGnyLiMnfU=;        b=Z3CEaLCJpMj0DoDkR8f/aV3ihbNLMCaNiUYfeDsDUzEldQF4JnglmqAXsP3qElrVTS         v8QojjlMj+l21pObfeCyn2QgIqFcuGaNRzf58rppqIvnmjMxJjvko0kMTMtaWk7CT0ji         LiLpT03AOQmpXhn4lEZomktVGGr9ul7cqoYEDqClHDx7xS7eVap99dWS2eseFr86Wx4+         T+q3tfMcNZLXT0H2brFJNeeCvEbxiHpq3NC72sO6ga5j7Mtdnu3LiYbgeo+l2Ldyaa7/         coRsrwNxSxxF03FfUiDwi8ngKv3CfKSnPv1GEMTONRPioxvTI8X0kCIK3wLQK6vRwL5f         BSKg=="
                    },
                    {
                        "name": "X-Google-DKIM-Signature",
                        "value": "v=1; a=rsa-sha256; c=relaxed/relaxed;        d=1e100.net; s=20230601; t=1747841160; x=1748445960;        h=to:subject:message-id:date:from:mime-version:x-gm-message-state         :from:to:cc:subject:date:message-id:reply-to;        bh=KYgEICCne4ujg/Y+SXBUG6xLBtld5Jj2kFGnyLiMnfU=;        b=FMoT1/pojsPaYSmgZEmv/iWJvATf14j7lvRVReLeBmxDxXZ9DT3ID0mkZTT+pUt7y7         +yPBa5fVBbTnPkBGLMjxkTLRmX1ynMXEO01kzay0dW3gC6aHqtdsYsgHYHJHPY2V1lCC         j0nrHsms7RYoUHEhdi8hUmiV5kvWGtHcNFQGuqHPF3hpyvEPLAknf4amLXhXrVP2GPbP         ff2LQyQpbaJOHnt+6ZxMp2EnuVSAjbP4U+70IQ7Uq+auqT/+SHdTpyOK92+nfH+L3JdJ         czya++oPjpU6NNP3XHoBfHlfmv0OgNhNPYqYfSlxTzwNdS8xk5p8j2rJcDB/0I8sNXtf         +1pA=="
                    },
                    {
                        "name": "X-Gm-Message-State",
                        "value": "AOJu0Ywc9iTZpE3KbffehrD2gREh4leXPr4vsaC8Z6Iw2FiSouEoDG7b jZunmy1lLoyoNdtVswIhhyREzlibeF+vNvN53BksDWjDcchGo9PWpKd+oLbgNPxnOBOg3vWwoVT QEZzyG8Jsa49ZDX00xg1ji1//z1RvD3tO/+ViSko="
                    },
                    {
                        "name": "X-Gm-Gg",
                        "value": "ASbGncu1CnOKgQ2E8Q2YcilVQDDeah0+MIIpoq75WCCILbprnaWutXpoDMRFw2UevJ/ ntMEP6Der4OZkU55YsIyQTrxOv08CUiP9KaOX+MFn4j5OLogqaSrlp9USAoR+xIEQH7GtlPB/MS qa1l0a/8O5dTxVUXMPRm91Lb2WVWka9vJ0yA4r69OHsuhrkiLSfuy8UbnvR/tdWCHff50="
                    },
                    {
                        "name": "X-Google-Smtp-Source",
                        "value": "AGHT+IGIE+FTaT61t/i7T4P3RUxvfE1uYGLGLPj5bMPepwoC7mxBBy8iEHQ8LW1LuQwpHawV7nR3dCsYPfxQvQXDWx0="
                    },
                    {
                        "name": "X-Received",
                        "value": "by 2002:a17:903:18d:b0:224:c47:cbd with SMTP id d9443c01a7336-231d3257fc6mr302658955ad.0.1747841159060; Wed, 21 May 2025 08:25:59 -0700 (PDT)"
                    },
                    {
                        "name": "MIME-Version",
                        "value": "1.0"
                    },
                    {
                        "name": "From",
                        "value": "Edwyn Z \u003Cedwynzh@gmail.com\u003E"
                    },
                    {
                        "name": "Date",
                        "value": "Wed, 21 May 2025 10:25:47 -0500"
                    },
                    {
                        "name": "X-Gm-Features",
                        "value": "AX0GCFt8GaNzMQFYa8nAVKIYtAxr5Tiixffh_yrqAeENEOpX42ZDxENwYi2Dzbw"
                    },
                    {
                        "name": "Message-ID",
                        "value": "\u003CCAJ9MOJijhfo_Oqj4PYwF=YcV81nLHTLwXOpsM+fK=m3QwM55TA@mail.gmail.com\u003E"
                    },
                    {
                        "name": "Subject",
                        "value": "RFQ stuff"
                    },
                    {
                        "name": "To",
                        "value": "pcbot@paracognition.ai"
                    },
                    {
                        "name": "Content-Type",
                        "value": "multipart/mixed; boundary=\"00000000000068fc700635a6fb67\""
                    }
                ],
                "body": {
                    "size": 0
                },
                "parts": [
                    {
                        "partId": "0",
                        "mimeType": "multipart/alternative",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": "multipart/alternative; boundary=\"00000000000068fc6e0635a6fb65\""
                            }
                        ],
                        "body": {
                            "size": 0
                        },
                        "parts": [
                            {
                                "partId": "0.0",
                                "mimeType": "text/plain",
                                "filename": "",
                                "headers": [
                                    {
                                        "name": "Content-Type",
                                        "value": "text/plain; charset=\"UTF-8\""
                                    }
                                ],
                                "body": {
                                    "size": 37,
                                    "data": "Y2FuIHlvdSBjcmVhdGUgYSB0YXNrIGZvciB0aGlzIHJmcT8NCg=="
                                }
                            },
                            {
                                "partId": "0.1",
                                "mimeType": "text/html",
                                "filename": "",
                                "headers": [
                                    {
                                        "name": "Content-Type",
                                        "value": "text/html; charset=\"UTF-8\""
                                    },
                                    {
                                        "name": "Content-Transfer-Encoding",
                                        "value": "quoted-printable"
                                    }
                                ],
                                "body": {
                                    "size": 72,
                                    "data": "PGRpdiBkaXI9Imx0ciI-Y2FuIHlvdSBjcmVhdGUgYSB0YXNrIGZvciB0aGlzIHJmcT_CoDxicj48YnI-PGJyPjwvZGl2Pg0K"
                                }
                            }
                        ]
                    },
                    {
                        "partId": "1",
                        "mimeType": "application/pdf",
                        "filename": "Sol_140P8525Q0015.pdf",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": "application/pdf; name=\"Sol_140P8525Q0015.pdf\""
                            },
                            {
                                "name": "Content-Disposition",
                                "value": "attachment; filename=\"Sol_140P8525Q0015.pdf\""
                            },
                            {
                                "name": "Content-Transfer-Encoding",
                                "value": "base64"
                            },
                            {
                                "name": "Content-ID",
                                "value": "\u003Cf_may3hkbd0\u003E"
                            },
                            {
                                "name": "X-Attachment-Id",
                                "value": "f_may3hkbd0"
                            }
                        ],
                        "body": {
                            "attachmentId": "ANGjdJ_HDPL8d6RikW5AASMno85VQVAsUu0aQIpCY664PUnzgUtJXuG7QdRHtUu-5KEgX0Q7MrxOJQ2B3medhH-eppCcaYedqI3oDpj61w5-x2jDRecwQRQjDmisieVmIaIbJNxG9tl0gcjJ4Co9HWE9n_AjO5K88dnHKEFoMnvA-9y2hj3zpwl7AQxRkZnW36_L-mcmGn3YzkVtA3WGUn_-HN2YOdcaDIFig2sOmXexaWrWVY0JwFiWxLdXqEqA1PHJ6MCPiTOD73WO_5rYTSAwGSEBE4JZbjIjxrjBNMUCT1DunlbKzRVLCbX9dLddfzUWvwJgEtrB4R5SIdJMKvToHR04qPIbQYr3-D2DjDkx9qsA8ZjolCLYok50kfhmwY1_HqXK6RBFxRc0SwgD",
                            "size": 415966
                        }
                    }
                ]
            },
            "sizeEstimate": 575278,
            "historyId": "4942",
            "internalDate": "1747841147000"
        }
    ]
}
    ;

// export async function GET(request: Request) {
//   const pdfPath = './email/test.pdf';
//   const pdfBuffer = fs.readFileSync(pdfPath);

//   const text = await extractTextFromPdf(pdfBuffer);

//   const prompt = `Summarize the following document:\n\n${text}`;

//   const summary = await generate({
//     model: "models/gemini-2.5-flash-preview-05-20",
//     prompt: prompt,
//   });

//   return new Response(JSON.stringify({ summary: summary.text() }), {
//     status: 200,
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   });

// }


/**
 * Recursively processes MIME parts to extract content and attachments
 * @param {string} userId - Authenticated user ID
 * @param {string} messageId - Gmail message ID
 * @param {PayloadPart} part - MIME part to process
 * @returns {Promise<Array<{ mimetype: string, data: string }>>} Processed content array
 */
async function collectPartsInAMessage(
    logContext: LogContext,
    userId: string,
    messageId: string,
    part: PayloadPart
): Promise<Array<{ mimetype: string; data: string }>> {
    // Handle nested multipart content
    if (part.mimeType.startsWith('multipart/')) {
        const subParts = await Promise.all(
            (part.parts || []).map(p => collectPartsInAMessage(logContext, userId, messageId, p))
        );
        return subParts.flat();
    }

    // Initialize data with base content
    let data = part.body?.data || '';

    // Handle file attachments
    if (part.filename && part.body?.attachmentId) {
        const attachment = await getAttachment(
            logContext,
            userId,
            messageId,
            part.body.attachmentId
        );

        if (attachment) {
            data = attachment.data;
            logger.info(
                `Processed attachment: ${part.filename}, Size: ${attachment.size} bytes`
            );
        }
    }

    return [{
        mimetype: part.mimeType,
        data: data
    }];
}

async function selectEmailParts(
    logContext: LogContext,
    userId: string,
    messageId: string,
    part: PayloadPart
  ): Promise<Array<{ mimetype: string; data: string }>> {
  
    const parts = await collectPartsInAMessage(logContext, userId, messageId, part);
  
    // Find indices of text/plain and text/html
    const textPlainIndex = parts.findIndex(p => p.mimetype === 'text/plain');
    const textHtmlIndex = parts.findIndex(p => p.mimetype === 'text/html');
  
    // If text/html appears after text/plain, skip the plain part
    return parts.filter((p, index) => {
      if (p.mimetype === 'text/plain' && textHtmlIndex === (textPlainIndex + 1)) {
        return false; // skip text/plain if text/html follows
      }
      return true;
    });
  }

async function summarizeMessage(logContext: LogContext, userId: string, messageAbstract: StandardEmail): Promise<StandardEmail> {
    
    const emailAbs = await getEmailAbstract(logContext, userId, messageAbstract.messageId!);
    
    logger.debug("**summarizeMessage** emailAbs:", emailAbs);

    if (emailAbs) { // We have already summerized the email. get it from the database.
        return emailAbs;
    } else { // this email has not been summarized yet. 
        // messageAbstract.parts?.splice(0,2);
        logger.debug('messageAbstract is now: ', messageAbstract);
        logger.debug("**summarizeMessage** Start summariziation");
        const result = await summarizeEmailFlow(messageAbstract);
        logger.debug("**summarizeMessage** End summariziation");
        logger.debug("**summarizeMessage** result: ", result);
        return result;
    }

}

async function processMessage(logContext: LogContext, userId: string, message: GmailMessage): Promise<StandardEmail>{

    //convert header from an array to a dict
    const headerDictionary = message.payload?.headers?.reduce<Record<string, string>>(
        (acc, header) => {
            if (header.name) {
                acc[header.name.toLowerCase()] = header.value; // case-insensitive
            }
            return acc;
        },
        {}
    ) || {};

    logger.debug("from: ", headerDictionary['from']);
    
    const messageData = {
        messageId: message.id,
        from: headerDictionary['from'] || '',
        to: headerDictionary['to'] || '',
        subject: headerDictionary['subject'] || '',
        receivedAt: headerDictionary['date'] || '',
        parts: (await Promise.all(
            (message.payload?.parts || []).map(part => selectEmailParts(logContext, userId, message.id, part)
            )
        )).flat(),
    };

    // get summaries from DB or create them with AI and save to DB

    const messageWithSummary = summarizeMessage(logContext, userId, messageData)

    return messageWithSummary;
}


async function processEmailThread(logContext: LogContext, userId:string, thread: GmailThread) {
    
    // @refresh reset

    return await Promise.all(
        thread.messages.map(async (message) => {
            await processMessage(logContext, userId, message)
        }));
}


/**
 * GET endpoint handler for processing email thread messages and their attachments
 * 
 * Handles recursive processing of MIME parts including:
 * - Nested multipart content
 * - File attachments
 * - Text/html content
 * 
 * @param {Request} request - Next.js request object
 * @returns {NextResponse} JSON response containing processed messages with decoded content
 */
export async function GET(request: NextRequest) {
    try {
        const requestId = request.headers.get('x-request-id');

        if (!requestId) {
            throw new Error('**aisum** Request ID not found in headers');
        }

        const session = await getSession();

        // Validate user session
        if (!session.userEmail) {
            throw new Error('User email not found in session');
        }

        
        const logContext: LogContext = {
            requestId,
            additional: {
                userId: session.userEmail
            }
        }

        // Process all messages in parallel
        const neoMessages = await processEmailThread(logContext, session.userEmail, testThread);

        return NextResponse.json(neoMessages);

    } catch (error) {
        logger.error('Thread processing failed:', error);
        return NextResponse.json(
            { error: 'Failed to process email thread' },
            { status: 500 }
        );
    }
}

