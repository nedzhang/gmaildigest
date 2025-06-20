// api/openai-proxy/[...slug].ts

"use server";

import logger, { createLogContext, createLogger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * OpenAI Proxy POST Handler
 *
 * Fix for Z_DATA_ERROR compression issues:
 * 1. Explicitly set compression handling in fetch
 * 2. Preserve compression headers
 * 3. Add debug logging for headers
 *
 * @param req - The incoming Next.js request object
 * @param params - Route parameters containing the slug path segments
 * @returns A response that either streams from OpenAI or returns JSON data
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string[] } },
) {

    const logContext = createLogContext({
        req
    });

    const functionLogger = createLogger(logContext, {
        module: 'openai-proxy/[...slug]/route',
        function: 'POST',
    })

    const slugs = (await params).slug; // `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
    const queryParams = req.nextUrl.searchParams;

    if (!slugs || !Array.isArray(slugs)) {
        return NextResponse.json(
            { error: "Slugs must be a non-empty array" },
            { status: 400 },
        );
    }

    const OPENAI_BASEURL = process.env.OPENAI_BASEURL;

    if (!OPENAI_BASEURL) {
        return NextResponse.json(
            { error: "OPENAI_BASEURL is not configured" },
            { status: 500 },
        );
    }



    functionLogger.info(
        { slugs, queryParams },
        `**openai-proxy/handler** received openai request`,
    );

    try {
        // Construct target URL
        let targetUrl = `${OPENAI_BASEURL}/${slugs.join("/")}`;

        if (queryParams.toString()) {
            targetUrl += `?${queryParams.toString()}`;
        }

        // Clone headers to preserve original
        const headers = new Headers(req.headers);

        // Remove problematic headers
        headers.delete("content-length"); // Let fetch recalculate
        headers.delete("connection");
        headers.delete("host"); // Prevent host header conflicts

        // Add any required OpenAI headers
        if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        // NEW: Capture request body for logging
        let bodyForLog: any = null;
        let bodyToForward = req.body;

        if (req.body) {
            try {
                // Create a clone of the body to read for logging
                const [logStream, forwardStream] = req.body.tee();
                bodyToForward = forwardStream;

                const reader = logStream.getReader();
                const decoder = new TextDecoder();
                let bodyText = '';
                const maxBytes = 10240; // 10KB limit
                let bytesRead = 0;
                let done = false;

                while (!done && bytesRead < maxBytes) {
                    const { value, done: readDone } = await reader.read();
                    done = readDone;
                    if (value) {
                        bytesRead += value.length;
                        // If we're going to exceed the limit, truncate
                        if (bytesRead > maxBytes) {
                            const take = maxBytes - (bytesRead - value.length);
                            bodyText += decoder.decode(value.subarray(0, take), { stream: true });
                            bodyText += '... (truncated)';
                            break;
                        } else {
                            bodyText += decoder.decode(value, { stream: true });
                        }
                    }
                }
                bodyForLog = bodyText;
                reader.releaseLock();
            } catch (e: any) {
                bodyForLog = `Error reading body: ${e.message || e}`;
            }
        }


        // Debug: Log request before forwarding
        functionLogger.debug(
            { headers: Object.fromEntries(headers.entries()), body: bodyForLog },
            `**openai-proxy** Request send to ${targetUrl}`,
        );

        // Forward request to OpenAI with compression handling
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: headers,
            body: bodyToForward,
            // @ts-ignore - Next.js types don't include duplex yet
            duplex: "half", // Required for streaming
            // compress: false, // CRITICAL: Disable automatic decompression
        });

        // Determine if response is streaming
        const contentType = response.headers.get("content-type") || "";
        const isStreaming = contentType.includes("text/event-stream");

        // Handle streaming responses
        if (isStreaming && response.body) {
            functionLogger.debug(
                {
                    status: response.status,
                    headers: Object.fromEntries(response.headers.entries()),
                    note: "Streaming response - body not logged",
                },
                `Streaming response from OpenAI: ${targetUrl}`,
            );

            return new Response(response.body, {
                headers: response.headers,
                status: response.status,
            });
        } else {
            // Handle non-streaming responses
            let responseData = null;
            if (response.body) {
                responseData = await response.json();

                // NEW: Log non-streaming response body
                functionLogger.debug(
                    {
                        status: response.status,
                        headers: Object.fromEntries(response.headers.entries()),
                        responseBody: responseData
                    },
                    `**openai-proxy** text response from OpenAI: ${targetUrl}`,
                );
            }

            return NextResponse.json(responseData, { status: response.status });
        }
    } catch (error: any) {
        functionLogger.error(
            { err: error },
            `**openai-proxy/POST** proxy error:`,
        );

        return NextResponse.json(
            {
                error: "Internal server error",
                details: error.message,
            },
            { status: 500 },
        );
    }
}
