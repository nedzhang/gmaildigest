// middleware.ts

import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { generateId } from "./lib/uid-util";
import { createLogEntry, LogEvent, reqSerializer } from "./lib/logger";
import { getSession } from "./lib/session";
import { hasProperty } from "./lib/object-util";

/**
 * Module identifier for logging context
 */
const MODULE_NAME = "middleware";

/**
 * Middleware matching configuration
 * 
 * Exclude certain routes from being intercepted:
 * - /logapi: to prevent infinite loops
 * - /_next/static|image: Next.js static assets
 * - common public files: e.g. favicon, sitemap, etc.
 */
export const config = {
  matcher: [
    "/((?!logapi|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};

/**
 * Sends a structured log entry to the server-side logger endpoint
 * 
 * @param hostUrl - Base URL for the current request
 * @param requestId - Unique ID for tracing this request
 * @param time - Timestamp in ms
 * @param module - Module name for logging context
 * @param functionName - Function name for log trace
 * @param level - Log level (e.g. debug, info, error)
 * @param context - Structured payload to log
 * @param message - Optional human-readable log message
 */
async function sendLogEntry(
  hostUrl: string,
  requestId: string,
  time: number,
  module: string,
  functionName: string,
  level: string,
  context: Record<string, unknown>,
  message?: string,
): Promise<void> {
  try {
    const session = await getSession();
    
    const event: LogEvent = {
      requestId,
      time,
      module,
      function: functionName,
      level,
      additional: session && hasProperty(session) ? { session } : undefined,
    };

    const logContent = createLogEntry(event, context, message);

    await fetch(`${hostUrl}/logapi/reqreslogger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logContent),
    });
  } catch (error) {
    console.error(
      `[${MODULE_NAME}] Logging failed for request ${requestId}. URL: ${hostUrl}/logapi/reqreslogger`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Middleware entry point for all matched requests
 * 
 * Responsibilities:
 * - Assigns a unique request ID
 * - Fixes proxy-origin misdetection under localhost container environments
 * - Logs request metadata asynchronously
 * - Forwards modified headers
 */
export function middleware(
  req: NextRequest,
  event: NextFetchEvent,
): NextResponse {
  // Generate unique request ID and carry over original one if exists
  const requestId = generateId();
  const originalRequestId = req.headers.get("x-request-id") || "";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-request-id-orig", originalRequestId);

  // Fix: When behind a proxy (e.g., Traefik), Next.js infers incorrect origin
  const origin =
    req.nextUrl.origin === "https://localhost:9002"
      ? "http://localhost:9002"
      : req.nextUrl.origin;

  // Trigger structured logging asynchronously without blocking the request
  event.waitUntil(
    sendLogEntry(
      origin + req.nextUrl.basePath,
      requestId,
      Date.now(),
      MODULE_NAME,
      "middleware",
      "debug",
      { req: reqSerializer(req) },
      `**middleware** Incoming request received at ${req.nextUrl.pathname}`
    )
  );

  // Forward updated headers (incl. x-request-id) down the request chain
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
