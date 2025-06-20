// lib/logger.ts
/**
 * Centralized Logging Module
 *
 * Implements structured logging with:
 * - Environment-specific configurations (development/production)
 * - Multiple transport targets (console, Logtail)
 * - Zod schema validation for log sources
 * - Safe request serialization
 * - Type-safe log entry construction
 *
 * Designed for optimal performance with Pino's low-overhead logging
 */

import pino from "pino";
import { NextRequest } from "next/server";
import { z } from "zod";
import { hasProperty } from "./object-util";

// Constants for environment detection
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test";

const LOGTAIL_CONFIGURED =
  !!(process.env.LOGTAIL_TOKEN && process.env.LOGTAIL_ENDPOINT);

/**
 * Zod Schema Definitions
 *
 * Ensures consistent log structure across:
 * - Frontend components
 * - Middleware
 * - API routes
 */
export const LogContextSchema = z.object({
  requestId: z.string().describe("Unique identifier for request tracing"),
  additional: z.record(z.string(), z.unknown())
    .optional()
    .describe("Additional context-specific metadata"),
});

export const LogEventSchema = LogContextSchema.extend({
  time: z.number().describe("Unix timestamp in milliseconds"),
  module: z.string().describe("Originating module/component"),
  function: z.string().describe("Source function/method name"),
  level: z.string().optional().describe("Log level (trace, debug, info, warn, error)"),
});

export type LogContext = z.infer<typeof LogContextSchema>;
export type LogEvent = z.infer<typeof LogEventSchema>;

/**
 * Type-safe request serializer that handles:
 * - NextRequest objects
 * - Plain request-like objects
 * - Sensitive header filtering
 * - Consistent path resolution
 */
export const reqSerializer = (req: NextRequest | Record<string, unknown>) => {
  return {
    method: (req as NextRequest).method || "unknown",
    url: req.url?.toString() || "unknown",
    path: getRequestPath(req),
    headers: getSafeHeaders(req),
  };
};

/**
 * Constructs standardized log entries with:
 * - Zod-validated source metadata
 * - Environment context (server/client)
 * - Type-safe context object merging
 * - Message normalization
 */
export function makeLogEntry(
  event: LogEvent,
  content: Record<string, unknown>,
  message?: string,
): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    logsource: {
      ...event,
      runtime: process.env.NEXT_RUNTIME || "unknown",
    },
    ...content,
  };

  if (!!message) {
    entry.message = (!!entry.message) ? entry.message + " " + message : message;
  }

  return entry;
}

// Helper function to safely extract headers
function getSafeHeaders(
  req: NextRequest | Record<string, any>,
): Record<string, string | null> {
  const headers: Record<string, string | null> = {};
  const safeHeaders = [
    "host",
    "user-agent",
    "referer",
    "content-type",
    "x-request-id",
    "x-forwarded-for",
  ];

  if (isNextRequest(req)) {
    safeHeaders.forEach((key) => headers[key] = req.headers.get(key));
  } else if (req.headers) {
    safeHeaders.forEach((key) => {
      headers[key] = req.headers[key.toLowerCase()] || req.headers[key] || null;
    });
  }

  return headers;
}

// Type guard for NextRequest detection
function isNextRequest(req: unknown): req is NextRequest {
  return !!(
    req &&
    typeof (req as NextRequest).headers?.get === "function" &&
    typeof (req as NextRequest).nextUrl === "object"
  );
}

// Unified path resolution logic
function getRequestPath(req: NextRequest | Record<string, any>): string {
  if (isNextRequest(req) && req.nextUrl?.pathname) {
    return req.nextUrl.pathname;
  }

  try {
    return req.url ? new URL(req.url.toString()).pathname : "unknown";
  } catch {
    return "invalid-url";
  }
}

// Transport configuration optimized for performance
function configureTransports(): pino.TransportTargetOptions[] {
  const transports: pino.TransportTargetOptions[] = [];

  if (IS_PRODUCTION) {
    // Production default: JSON-formatted console logs
    transports.push({
      target: "pino/file",
      level: "info",
      options: { destination: 1 }, // stdout
    });
  }else if (IS_TEST) {
    // We don't want too large log message to contaiminate the test output.
    transports.push({
      target: "pino/file",
      level: "error",
      options: { destination: 1 }, // stdout
    });
  } else {
    transports.push({
      target: "pino-pretty",
      level: "debug",
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    });
  }

  // We would like to have logtail in all environments
  if (LOGTAIL_CONFIGURED) {
    transports.push({
      target: "@logtail/pino",
      level: "trace",
      options: {
        sourceToken: process.env.LOGTAIL_TOKEN!,
        options: {
          endpoint: process.env.LOGTAIL_ENDPOINT!,
        },
      },
    });
  }

  return transports;
}

// Logger instance with optimized configuration
const logger = pino({
  level: IS_PRODUCTION ? "trace" : "trace", // Have logger always log trace level and let transport decide what level to transport out.
  serializers: {
    err: pino.stdSerializers.err,
    req: reqSerializer,
    res: pino.stdSerializers.res,
  },
  transport: {
    targets: configureTransports(),
  },
});

// Runtime configuration validation
if (IS_PRODUCTION && !LOGTAIL_CONFIGURED) {
  logger.warn("Production logging operating in fallback mode (stdout only)");
}

export function makeLogContext(context: { req?: NextRequest, requestId?: string, additional?: Record<string, unknown> }) {

  const id = context.requestId || context.req?.headers.get("x-request-id") || "";

  if (!id) {
    throw new Error(`**makeLogContext** both req and requestId are undefined.`);
  }

  const ctx: LogContext = {
    requestId: id,
  };

  if (context.additional && hasProperty(context.additional as object)) {
    ctx.additional = context.additional;
  }

  return ctx
}


export default logger;
