import pino, { Logger } from "pino";
import { NextRequest } from "next/server";
import { z } from "zod";

// Environment Configuration Checks
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test";
const HAS_LOGTAIL = !!(process.env.LOGTAIL_TOKEN && process.env.LOGTAIL_ENDPOINT);

/**
 * Logging Schema Definitions
 *
 * Structured field definitions to ensure consistent logging
 * formats across our application
 */
export const LogContextSchema = z.object({
  requestId: z.string().describe("Unique request identifier"),
  additional: z.record(z.string(), z.unknown())
    .optional()
    .describe("Context-specific metadata"),
});

export const LogEventSchema = LogContextSchema.extend({
  time: z.number().describe("Milliseconds since epoch"),
  module: z.string().describe("Source module name"),
  function: z.string().describe("Function name").default('global'),
  level: z.string().optional().describe("Log severity level"),
  runtime: z.string().optional().describe('run time of the event. could be node, edge, or browser.')
});

export type LogContext = z.infer<typeof LogContextSchema>;
export type LogEvent = z.infer<typeof LogEventSchema>;
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | string;

/**
 * Enhanced Child Logger Interface
 *
 * Provides both method-based logging (info, warn, etc) and
 * generic level-based logging interface
 */
export interface ChildLogger {
  (level: LogLevel, context: Record<string, unknown>, message?: string): void;
  trace: (context: Record<string, unknown>, message?: string) => void;
  debug: (context: Record<string, unknown>, message?: string) => void;
  info: (context: Record<string, unknown>, message?: string) => void;
  warn: (context: Record<string, unknown>, message?: string) => void;
  error: (context: Record<string, unknown>, message?: string) => void;
  fatal: (context: Record<string, unknown>, message?: string) => void;
  createChild: (context: Partial<Omit<LogEvent, 'requestId' | 'time'>>) => ChildLogger;
  getBaseEvent: () => LogEvent;
}

/**
 * Request Serialization Utilities
 *
 * Cleanly formats request objects for logging, including
 * security-conscious header handling
 */
const isNextRequest = (req: unknown): req is NextRequest =>
  !!(req && typeof (req as NextRequest).headers?.get === 'function');

export const reqSerializer = (req: NextRequest | Record<string, unknown>) => ({
  method: (req as NextRequest).method || "unknown",
  url: req.url?.toString() || "unknown",
  path: getRequestPath(req),
  headers: getSanitizedHeaders(req),
});

const getRequestPath = (req: NextRequest | Record<string, any>): string => {
  if (isNextRequest(req) && req.nextUrl?.pathname) return req.nextUrl.pathname;
  try {
    return req.url ? new URL(req.url.toString()).pathname : "unknown";
  } catch {
    return "invalid-url";
  }
};

const getSanitizedHeaders = (
  req: NextRequest | Record<string, any>
): Record<string, string | null> => {
  const headersToKeep = ["host", "user-agent", "referer", "content-type"];
  const headers: Record<string, string | null> = {};

  if (isNextRequest(req)) {
    headersToKeep.forEach(key => headers[key] = req.headers.get(key));
  } else if (req.headers) {
    headersToKeep.forEach(key => {
      const value = req.headers[key.toLowerCase()] || req.headers[key];
      headers[key] = typeof value === 'string' ? value : null;
    });
  }

  return headers;
};

/**
 * Semantic Field Constructor
 * 
 * Creates structured log entries with consistent top-level field names,
 * keeping source context and log content separate
 */
export function createLogEntry(
  event: LogEvent,
  context: Record<string, unknown>,
  message?: string
): Record<string, unknown> {
  return {
    logsource: {
      ...event,
      runtime: process.env.NEXT_RUNTIME || "unknown-nodejs",
    },
    ...context,
    ...(message && { message }),
  };
}

/**
 * Transport Configuration Manager
 *
 * Configures appropriate logging sinks for the current environment
 */
const configureTransports = (): pino.TransportTargetOptions[] => {
  const sinks: pino.TransportTargetOptions[] = [];

  // Development - Pretty-printed to stdout
  if (!IS_PRODUCTION && !IS_TEST) {
    sinks.push({
      target: "pino-pretty",
      level: "debug",
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    });
  }
  // Production & Test - Structured JSON
  else {
    sinks.push({
      target: "pino/file",
      level: IS_TEST ? "trace" : "info",
      options: { destination: 1 }, // stdout
    });
  }

  // Third-party logging service
  if (HAS_LOGTAIL) {
    sinks.push({
      target: "@logtail/pino",
      level: "trace",
      options: {
        sourceToken: process.env.LOGTAIL_TOKEN!,
        options: { endpoint: process.env.LOGTAIL_ENDPOINT! },
      },
    });
  }

  return sinks;
};

// Core Logger Instance
const baseLogger = pino({
  level: "trace", // Inherit level control from transports
  serializers: {
    err: pino.stdSerializers.err,
    req: reqSerializer,
    res: pino.stdSerializers.res,
  },
  transport: {
    targets: configureTransports()
  },
});

// Configuration warnings
if (IS_PRODUCTION && !HAS_LOGTAIL) {
  console.warn("Production logging using stdout fallback");
}

/**
 * Context Initializer
 *
 * Creates logging context from request objects or explicit parameters
 */
export function createLogContext(params: {
  req?: NextRequest;
  requestId?: string;
  additional?: Record<string, unknown>;
}): LogContext {
  const requestId = params.requestId || params.req?.headers.get("x-request-id") || "";
  if (!requestId) throw new Error("Missing request ID for logging context");

  return {
    requestId,
    ...(params.additional && { additional: params.additional }),
  };
}

/**
 * Child Logger Factory
 *
 * Creates scoped logger instances with contextual metadata inheritance
 */
export function createLogger(
  parentContext: LogContext,
  config: Partial<Omit<LogEvent, 'requestId' | 'time'>> = {}
): ChildLogger {
  if (!config.module) {
    console.warn("Creating logger without explicit module name. Recommend setting module.");
  }

  // Merge metadata from parent context and current config
  const metadata = {
    ...(parentContext.additional || {}),
    ...(config.additional || {})
  };

  // Base fields for all log entries
  const eventTemplate: LogEvent = {
    requestId: parentContext.requestId,
    time: 0, // Populated at log time
    module: config.module || 'uncategorized',
    function: config.function || 'global',
    ...(Object.keys(metadata).length > 0 && { additional: metadata })
  };

  const pinoChild = baseLogger.child({});

  /**
   * Flexible Logging Core
   * 
   * Handles all actual log writing with support for both
   * standard and custom log levels
   */
  const log = (
    level: LogLevel,
    context: Record<string, unknown>,
    message?: string
  ): void => {
    const timestamp = Date.now();
    const runtime = process.env.NEXT_RUNTIME || 'unknown';
    const logEvent: LogEvent = { ...eventTemplate, time: timestamp, level, runtime };
    const logEntry = createLogEntry(logEvent, context, message);

    // Standard level handling
    switch (level) {
      case 'fatal': return pinoChild.fatal(logEntry);
      case 'error': return pinoChild.error(logEntry);
      case 'warn': return pinoChild.warn(logEntry);
      case 'info': return pinoChild.info(logEntry);
      case 'debug': return pinoChild.debug(logEntry);
      case 'trace': return pinoChild.trace(logEntry);
    }

    // Custom level handling
    const loggerWithCustomTypes = pinoChild as unknown as Record<string, pino.LogFn | undefined>;
    const logMethod = loggerWithCustomTypes[level];

    if (typeof logMethod === 'function') {
      try {
        logMethod(logEntry);
      } catch (error) {
        pinoChild.warn({
          ...logEntry,
          logFailure: 'Custom level logging failed',
          customLevel: level,
          error
        }, `Logging failed for custom level: ${level}`);
      }
    } else {
      // Fallback with explicit custom level field
      pinoChild.info({
        ...logEntry,
        customLogLevel: level
      }, message);
    }
  };

  // Create public interface
  const loggerInterface = ((level: LogLevel, ctxt: Record<string, unknown>, msg?: string) => {
    log(level, ctxt, msg);
  }) as ChildLogger;

  // Standard level shorthand methods
  loggerInterface.trace = (c, m) => log('trace', c, m);
  loggerInterface.debug = (c, m) => log('debug', c, m);
  loggerInterface.info = (c, m) => log('info', c, m);
  loggerInterface.warn = (c, m) => log('warn', c, m);
  loggerInterface.error = (c, m) => log('error', c, m);
  loggerInterface.fatal = (c, m) => log('fatal', c, m);

  /**
   * Child Logger Generator
   * 
   * Creates nested loggers with merged context
   */
  loggerInterface.createChild = (childConfig) => {
    // Maintain core context
    const newContext: LogContext = {
      requestId: parentContext.requestId,
      ...(Object.keys(metadata).length > 0 && { additional: metadata })
    };

    // Merge additional metadata hierarchically
    const childMetadata = {
      ...metadata,
      ...(childConfig.additional || {})
    };

    return createLogger(
      newContext,
      {
        ...config,
        ...childConfig,
        // Pass merged metadata
        additional: Object.keys(childMetadata).length ? childMetadata : undefined
      }
    );
  };

  // Accessor for base event data
  loggerInterface.getBaseEvent = () => ({ ...eventTemplate });

  return loggerInterface;
}

export default baseLogger;
