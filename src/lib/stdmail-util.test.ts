/**
 * @jest-environment node
 */

import { Noto_Sans_Wancho } from "next/font/google";
import logger, {
    LogContext,
    LogContextSchema,
    makeLogContext,
    makeLogEntry,
} from "./logger";
import { parseGmailMessage } from "./stdmail-util";
import { generateId } from "./uid-util";

const gmessage = {
    "id": "196f373962a23259",
    "threadId": "196f373962a23259",
    "labelIds": [
        "IMPORTANT",
        "CATEGORY_PERSONAL",
        "INBOX",
    ],
    "snippet": "can you create a task for this rfq?",
    "payload": {
        "partId": "",
        "mimeType": "multipart/mixed",
        "filename": "",
        "headers": [
            {
                "name": "Delivered-To",
                "value": "pcbot@paracognition.ai",
            },
            {
                "name": "Received",
                "value":
                    "by 2002:a54:30ca:0:b0:296:8e81:71cb with SMTP id e10csp1057440ecs;        Wed, 21 May 2025 08:26:02 -0700 (PDT)",
            },
            {
                "name": "X-Received",
                "value":
                    "by 2002:a17:903:2f0e:b0:22e:7f20:52ed with SMTP id d9443c01a7336-231d43b63b0mr248842195ad.20.1747841160751;        Wed, 21 May 2025 08:26:00 -0700 (PDT)",
            },
            {
                "name": "ARC-Seal",
                "value":
                    "i=1; a=rsa-sha256; t=1747841160; cv=none;        d=google.com; s=arc-20240605;        b=I4mxbSlF+RH5ih6aa6C7Ol4OPHK69/sW8fG78plszDri8hGL25KPhtw7gqq3txkUXe         XYz9ptoRViNXft1jJZDImT6+btx6m2HPH+kTzJWFhQx02vY/F87ZX6I5gtaY3Uzvyxta         zVUAGEKOeg711L116dmug9HDTj5yybookxq/fdyQjudx9TAPMH1YtWz0ObYeMM4GCN97         yNfJ4173aM5TbuM/QDGfFbbfBb5uytZj6+TRzOI+yBlhnAPgWSnOoqZEfSNYHX5BW5wc         bcJ7yNnomuax+29WKuFYgKZZgaaStyUxuIHu8ki8oRqZDeffUdzX7p3Mx0cQX1EIXuDl         3NHw==",
            },
            {
                "name": "ARC-Message-Signature",
                "value":
                    "i=1; a=rsa-sha256; c=relaxed/relaxed; d=google.com; s=arc-20240605;        h=to:subject:message-id:date:from:mime-version:dkim-signature;        bh=KYgEICCne4ujg/Y+SXBUG6xLBtld5Jj2kFGnyLiMnfU=;        fh=zdSr2JFS+5o66pBvGOQ35QIyeZYm/wj+XoaoU5DRm9E=;        b=drkY9nXFpZRiCYichc2T12Be658Mfs0SjGhjFUswfTtCeZLj/uLRIra3cYgiAWww+x         t3FIW3wcbhG/CvBqynK/Wm/XbGmNDiCiEvmW59Iany2ls7titv/ktEgrxZ0OyXiQ2cDo         umxv+ebeNADPt3mUAjYQuX98B+gDLQKadMF2gOLREANiDRsbrQctFkPNJH/QesEIvVyZ         HLnqYPCa3kd9KtOlHUS0b7rtygNHrQsp0Fwg1ZIcoWlXsDldGxLl7ovH1r2o5iEk2BKn         r6b+DVb7/BF105rSNIhduSl0TBp2Ofq5Y4QU4UhROlom7mfSFyAvZCEl2Yd//CCHofU5         cyNQ==;        dara=google.com",
            },
            {
                "name": "ARC-Authentication-Results",
                "value":
                    "i=1; mx.google.com;       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z3CEaLCJ;       spf=pass (google.com: domain of edwynzh@gmail.com designates 209.85.220.65 as permitted sender) smtp.mailfrom=edwynzh@gmail.com;       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com;       dara=pass header.i=@paracognition.ai",
            },
            {
                "name": "Return-Path",
                "value": "<edwynzh@gmail.com>",
            },
            {
                "name": "Received",
                "value":
                    "from mail-sor-f65.google.com (mail-sor-f65.google.com. [209.85.220.65])        by mx.google.com with SMTPS id d9443c01a7336-231d4d1fb38sor69857045ad.10.2025.05.21.08.26.00        for <pcbot@paracognition.ai>        (Google Transport Security);        Wed, 21 May 2025 08:26:00 -0700 (PDT)",
            },
            {
                "name": "Received-SPF",
                "value":
                    "pass (google.com: domain of edwynzh@gmail.com designates 209.85.220.65 as permitted sender) client-ip=209.85.220.65;",
            },
            {
                "name": "Authentication-Results",
                "value":
                    "mx.google.com;       dkim=pass header.i=@gmail.com header.s=20230601 header.b=Z3CEaLCJ;       spf=pass (google.com: domain of edwynzh@gmail.com designates 209.85.220.65 as permitted sender) smtp.mailfrom=edwynzh@gmail.com;       dmarc=pass (p=NONE sp=QUARANTINE dis=NONE) header.from=gmail.com;       dara=pass header.i=@paracognition.ai",
            },
            {
                "name": "DKIM-Signature",
                "value":
                    "v=1; a=rsa-sha256; c=relaxed/relaxed;        d=gmail.com; s=20230601; t=1747841159; x=1748445959; darn=paracognition.ai;        h=to:subject:message-id:date:from:mime-version:from:to:cc:subject         :date:message-id:reply-to;        bh=KYgEICCne4ujg/Y+SXBUG6xLBtld5Jj2kFGnyLiMnfU=;        b=Z3CEaLCJpMj0DoDkR8f/aV3ihbNLMCaNiUYfeDsDUzEldQF4JnglmqAXsP3qElrVTS         v8QojjlMj+l21pObfeCyn2QgIqFcuGaNRzf58rppqIvnmjMxJjvko0kMTMtaWk7CT0ji         LiLpT03AOQmpXhn4lEZomktVGGr9ul7cqoYEDqClHDx7xS7eVap99dWS2eseFr86Wx4+         T+q3tfMcNZLXT0H2brFJNeeCvEbxiHpq3NC72sO6ga5j7Mtdnu3LiYbgeo+l2Ldyaa7/         coRsrwNxSxxF03FfUiDwi8ngKv3CfKSnPv1GEMTONRPioxvTI8X0kCIK3wLQK6vRwL5f         BSKg==",
            },
            {
                "name": "X-Google-DKIM-Signature",
                "value":
                    "v=1; a=rsa-sha256; c=relaxed/relaxed;        d=1e100.net; s=20230601; t=1747841160; x=1748445960;        h=to:subject:message-id:date:from:mime-version:x-gm-message-state         :from:to:cc:subject:date:message-id:reply-to;        bh=KYgEICCne4ujg/Y+SXBUG6xLBtld5Jj2kFGnyLiMnfU=;        b=FMoT1/pojsPaYSmgZEmv/iWJvATf14j7lvRVReLeBmxDxXZ9DT3ID0mkZTT+pUt7y7         +yPBa5fVBbTnPkBGLMjxkTLRmX1ynMXEO01kzay0dW3gC6aHqtdsYsgHYHJHPY2V1lCC         j0nrHsms7RYoUHEhdi8hUmiV5kvWGtHcNFQGuqHPF3hpyvEPLAknf4amLXhXrVP2GPbP         ff2LQyQpbaJOHnt+6ZxMp2EnuVSAjbP4U+70IQ7Uq+auqT/+SHdTpyOK92+nfH+L3JdJ         czya++oPjpU6NNP3XHoBfHlfmv0OgNhNPYqYfSlxTzwNdS8xk5p8j2rJcDB/0I8sNXtf         +1pA==",
            },
            {
                "name": "X-Gm-Message-State",
                "value":
                    "AOJu0Ywc9iTZpE3KbffehrD2gREh4leXPr4vsaC8Z6Iw2FiSouEoDG7b jZunmy1lLoyoNdtVswIhhyREzlibeF+vNvN53BksDWjDcchGo9PWpKd+oLbgNPxnOBOg3vWwoVT QEZzyG8Jsa49ZDX00xg1ji1//z1RvD3tO/+ViSko=",
            },
            {
                "name": "X-Gm-Gg",
                "value":
                    "ASbGncu1CnOKgQ2E8Q2YcilVQDDeah0+MIIpoq75WCCILbprnaWutXpoDMRFw2UevJ/ ntMEP6Der4OZkU55YsIyQTrxOv08CUiP9KaOX+MFn4j5OLogqaSrlp9USAoR+xIEQH7GtlPB/MS qa1l0a/8O5dTxVUXMPRm91Lb2WVWka9vJ0yA4r69OHsuhrkiLSfuy8UbnvR/tdWCHff50=",
            },
            {
                "name": "X-Google-Smtp-Source",
                "value":
                    "AGHT+IGIE+FTaT61t/i7T4P3RUxvfE1uYGLGLPj5bMPepwoC7mxBBy8iEHQ8LW1LuQwpHawV7nR3dCsYPfxQvQXDWx0=",
            },
            {
                "name": "X-Received",
                "value":
                    "by 2002:a17:903:18d:b0:224:c47:cbd with SMTP id d9443c01a7336-231d3257fc6mr302658955ad.0.1747841159060; Wed, 21 May 2025 08:25:59 -0700 (PDT)",
            },
            {
                "name": "MIME-Version",
                "value": "1.0",
            },
            {
                "name": "From",
                "value": "Edwyn Z <edwynzh@gmail.com>",
            },
            {
                "name": "Date",
                "value": "Wed, 21 May 2025 10:25:47 -0500",
            },
            {
                "name": "X-Gm-Features",
                "value":
                    "AX0GCFt8GaNzMQFYa8nAVKIYtAxr5Tiixffh_yrqAeENEOpX42ZDxENwYi2Dzbw",
            },
            {
                "name": "Message-ID",
                "value":
                    "<CAJ9MOJijhfo_Oqj4PYwF=YcV81nLHTLwXOpsM+fK=m3QwM55TA@mail.gmail.com>",
            },
            {
                "name": "Subject",
                "value": "RFQ stuff",
            },
            {
                "name": "To",
                "value": "pcbot@paracognition.ai",
            },
            {
                "name": "Content-Type",
                "value":
                    'multipart/mixed; boundary="00000000000068fc700635a6fb67"',
            },
        ],
        "body": {
            "size": 0,
        },
        "parts": [
            {
                "partId": "0",
                "mimeType": "multipart/alternative",
                "filename": "",
                "headers": [
                    {
                        "name": "Content-Type",
                        "value":
                            'multipart/alternative; boundary="00000000000068fc6e0635a6fb65"',
                    },
                ],
                "body": {
                    "size": 0,
                },
                "parts": [
                    {
                        "partId": "0.0",
                        "mimeType": "text/plain",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": 'text/plain; charset="UTF-8"',
                            },
                        ],
                        "body": {
                            "size": 37,
                            "data":
                                "Y2FuIHlvdSBjcmVhdGUgYSB0YXNrIGZvciB0aGlzIHJmcT8NCg==",
                        },
                    },
                    {
                        "partId": "0.1",
                        "mimeType": "text/html",
                        "filename": "",
                        "headers": [
                            {
                                "name": "Content-Type",
                                "value": 'text/html; charset="UTF-8"',
                            },
                            {
                                "name": "Content-Transfer-Encoding",
                                "value": "quoted-printable",
                            },
                        ],
                        "body": {
                            "size": 72,
                            "data":
                                "PGRpdiBkaXI9Imx0ciI-Y2FuIHlvdSBjcmVhdGUgYSB0YXNrIGZvciB0aGlzIHJmcT_CoDxicj48YnI-PGJyPjwvZGl2Pg0K",
                        },
                    },
                ],
            },
            {
                "partId": "1",
                "mimeType": "application/pdf",
                "filename": "Sol_140P8525Q0015.pdf",
                "headers": [
                    {
                        "name": "Content-Type",
                        "value":
                            'application/pdf; name="Sol_140P8525Q0015.pdf"',
                    },
                    {
                        "name": "Content-Disposition",
                        "value": 'attachment; filename="Sol_140P8525Q0015.pdf"',
                    },
                    {
                        "name": "Content-Transfer-Encoding",
                        "value": "base64",
                    },
                    {
                        "name": "Content-ID",
                        "value": "<f_may3hkbd0>",
                    },
                    {
                        "name": "X-Attachment-Id",
                        "value": "f_may3hkbd0",
                    },
                ],
                "body": {
                    "attachmentId":
                        "ANGjdJ-190QLXAiFf2wzYqRCoX7578V5dKjKa02Rr69jQ_T2z2kcOGWzF6rzgRCuSaDc_q-o11WbCy3e91cxwGTYiFmnPHTaJ5TVIkot83_2VU6-aTpEuVmB8Qkk5fMVe2V8uZxTHbb-dQ5G5RNsCAgLyGg7zROfzEV9-uhz7HVk0vYQyDhNrUpkeX2XSAOuiMWRtvJUGSFyK4LU26YKZPtBWqGSWJjdepsa4HSpjJbJ_bnqaOkhSpoZiNQFxkcM5xxixfUoYPjkE4rEgqZn9PYeh66N8h7hkssMaqtqoXLSORO6252Gm5bgJ0c-z0Q636WHVc9IhuA6RxtotPWfOZZ2FtrJwA7_73EISylDxlp-VgT1nnNrO1jkwHxsuwWIpCOGCviLcuH8aW8xufiO",
                    "size": 415966,
                },
            },
        ],
    },
    "sizeEstimate": 575278,
    "historyId": "6039",
    "internalDate": "1747841147000",
};

describe("stdmail-util", () => {
    describe("parseGmailMessage", () => {
        const mockRequestId = generateId();
        const mockUserId = "ned.zhang@paracognition.ai".toLowerCase();

        const mockLogContext: LogContext = makeLogContext({
            requestId: mockRequestId,
            additional: {
                userId: mockUserId,
            },
        });

        it("parse gmail with an attachment to download", async () => {
            const stdMail = await parseGmailMessage(
                mockLogContext,
                mockUserId,
                gmessage,
                true,
            );

            logger.info(
                makeLogEntry(
                    {
                        ...mockLogContext,
                        time: Date.now(),
                        module: "stdmail-util.test",
                        function: "parse gmail with an attachment to download",
                    },
                    { stdMail },
                    "parse gmail with an attachment to download",
                ),
            );
        });
    });
});
