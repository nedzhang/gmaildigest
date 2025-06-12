/**
 * Error formatting utilities for consistent error messaging across applications
 * 
 * Features:
 * - Standardizes error messages from diverse sources (Javascript errors, API responses, raw objects)
 * - Safely handles various error representations
 * - Prevents overly long error messages with truncation
 * - Provides both general error formatting and API response-specific formatting
 */

import { stringifyError } from 'next/dist/shared/lib/utils';
import { ZodError } from 'zod';

/** Maximum allowed length for error messages */
const ERROR_MESSAGE_MAX_LENGTH = 480;

/**
 * Formats any error value into a consistent string representation
 * 
 * Handles various error types:
 * - Raw strings
 * - Zod validation errors
 * - JavaScript Error objects
 * - Error-like objects with message fields
 * - Arrays of errors
 * - Fallback to JSON serialization
 * 
 * @param error - The error to format
 * @returns Human-readable error message
 */
export function formatError(error: unknown): string {

    // Handle null or undefined
    if (!error) {
        return '';
    }

    // Handle strings directly
    if (typeof error === 'string') {
        return truncate(error, ERROR_MESSAGE_MAX_LENGTH);
    }

    // Handle Zod validation errors (multiple issues)
    if (error instanceof ZodError) {
        const messages = error.errors.map(e => e.message);
        return `Validation failed: ${messages.join(', ')}`;
    }

    // Handle standard JavaScript Error objects
    if (error instanceof Error) {
        return truncate(`${error.message}\n${error.stack}`, ERROR_MESSAGE_MAX_LENGTH);
        // return stringifyError(error);
    }

    // Handle error is an object but not Error
    if (error && typeof error === 'object') {
        return truncate(JSON.stringify(error), ERROR_MESSAGE_MAX_LENGTH);
    }

    // Fallback to generic error message
    return `formatError failed to extract error information ${error}`;
}

/**
 * Converts an Error object to a plain JSON-serializable object, including:
 * - Standard properties (name, message, stack)
 * - Nested errors in `cause` chain (recursively)
 * - Properties from AggregateError's `errors` array
 * - Any additional enumerable/non-enumerable own properties
 * - Circular reference protection
 */
export function jsonifyError(error: unknown): Record<string, any> {
    // Create a global WeakMap for circular reference tracking if doesn't exist
    const seen = new WeakMap<object, string>();

    function _jsonify(err: any, id: string): any {
        // Handle non-Error values
        if (!(err instanceof Error)) {
            return err;
        }

        // Handle circular references
        if (seen.has(err)) {
            return `[Circular: ${seen.get(err)}]`;
        }
        seen.set(err, id);

        const jsonError: Record<string, any> = {
            // name: err.name,
            // message: err.message,
            // stack: err.stack,
            type: error?.constructor?.name || 'unknown'
        };

        // Handle 'cause' property (standard Error cause)
        if ('cause' in err) {
            jsonError.cause = _jsonify(
                err.cause,
                `${id}.cause`
            );
        }

        // Handle AggregateError's 'errors' array
        if (isAggregateError(err)) {
            jsonError.errors = err.errors.map((e: any, i: number) =>
                _jsonify(e, `${id}.errors[${i}]`)
            );
        }

        // Handle all other own properties
        for (const key of getAllPropertyKeys(err)) {
            // if (key === 'cause' && 'cause' in jsonError) continue;
            // if (key === 'errors' && 'errors' in jsonError) continue;
            if (RESERVED_KEYS.includes(key as string)) continue;

            try {
                const value = (err as any)[key];
                jsonError[key as string] = _jsonify(value, `${id}.${String(key)}`);
            } catch (_) {
                // Skip inaccessible properties
            }
        }

        return jsonError;
    }

    return _jsonify(error, 'root');
}

// Helper to check if an error is an AggregateError (without relying on global)
function isAggregateError(error: Error): error is Error & { errors: any[] } {
    return Array.isArray((error as any).errors) &&
        error.constructor.name === 'AggregateError';
}

// Get all own property keys (strings and symbols)
function getAllPropertyKeys(obj: object): (string | symbol)[] {
    return [
        ...Object.getOwnPropertyNames(obj),
        ...Object.getOwnPropertySymbols(obj)
    ];
}

// Reserved keys for Error objects
const RESERVED_KEYS = ['cause', 'errors'];


/**
 * Formats errors specifically for HTTP response contexts
 * 
 * Combines HTTP status information with error content formatting
 * 
 * @param params - Formatting parameters
 * @param params.status - HTTP status code (optional)
 * @param params.statusText - HTTP status text (optional)
 * @param params.error - Error content (optional)
 * @returns Human-readable error message with HTTP context
 */
export function formatResponseError(params: {
    status?: number;
    statusText?: string;
    error?: unknown;
}): string {
    const { status, statusText, error } = params;

    // Create HTTP status prefix when available
    const httpPrefix = status !== undefined
        ? `[${status}${statusText ? ` ${statusText}` : ''}]`
        : '';

    // Format the error content (if exists)
    const errorMessage =
        error !== undefined && error !== null
            ? formatError(error)
            : '';

    // Combine HTTP context and error message
    const combinedMessage = [httpPrefix, errorMessage]
        .filter(part => part !== '')
        .join(' - ');

    // Use either the combined message, one of the parts, or a default
    return combinedMessage || httpPrefix || errorMessage || 'formatResponseError failed to generate error';
}

/**
 * Safely truncates text to specified length
 * 
 * @internal
 * @param text - Input text
 * @param maxLength - Maximum allowed length
 * @returns Truncated text with ellipsis if needed
 */
function truncate(text: string, maxLength: number): string {
    return text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
}
