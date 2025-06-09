// middleware.ts

import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { generateId } from "./lib/uid-util";
import { LogEvent, makeLogEntry, reqSerializer } from "./lib/logger";
import { getSession } from "./lib/session";
import { hasProperty } from "./lib/object-util";

/**
 * Module identifier for logging and error tracking
 */
const MODULE_NAME = "middleware";

/**
 * Next.js middleware configuration
 * @constant
 * @type {Object}
 * @property {string[]} matcher - URL patterns to match
 * 
 * Exclusions prevent:
 * - Infinite logging loops from /logapi calls
 * - Redundant processing of static assets
 */
export const config = {
  matcher: [
    "/((?!logapi|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.well-known).*)",
  ],
};

/**
 * Secure log submission handler with session context
 * @async
 * @function sendLogEntry
 * @param {string} hostUrl - Base URL for logging endpoint
 * @param {string} requestId - Unique request identifier
 * @param {number} time - Event timestamp (epoch ms)
 * @param {string} module - Source module name
 * @param {string} functionName - Calling function name
 * @param {string} level - Log severity level
 * @param {Object} context - Structured log data
 * @param {string} [message] - Human-readable message
 * @returns {Promise<void>}
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

    const logContent = makeLogEntry(event, context, message);
    
    await fetch(`${hostUrl}/logapi/reqreslogger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logContent),
    });
  } catch (error) {
    console.error(
      `[${MODULE_NAME}] Logging failed for ${requestId}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Core request processing middleware
 * @function middleware
 * @param {NextRequest} req - Incoming request object
 * @param {NextFetchEvent} event - Fetch event context
 * @returns {NextResponse} Modified response with headers
 * 
 * Key responsibilities:
 * - Generates unique request IDs
 * - Propagates headers through request chain
 * - Initiates async request logging
 */
export function middleware(
  req: NextRequest,
  event: NextFetchEvent,
): NextResponse {
  // Generate and propagate request identifiers
  const requestId = generateId();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-request-id-orig", req.headers.get("x-request-id") || "");

  // Async logging with original message format
  event.waitUntil(
    sendLogEntry(
      req.nextUrl.origin + req.nextUrl.basePath,
      requestId,
      Date.now(),
      MODULE_NAME,
      'middleware',
      "debug", 
      { req: reqSerializer(req) },
      `**middleware** Incoming request Received @ ${req.nextUrl.pathname}`
    )
  );

  return NextResponse.next({ request: { headers: requestHeaders } }); // Pass x-request-id to the rest of the chain
}