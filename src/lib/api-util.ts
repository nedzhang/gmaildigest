// api-util.ts
import { z, ZodError, type ZodSchema } from 'zod';
import { formatError, formatResponseError } from './error-util';
import { removeNulls } from './object-util';

/**
 * Standardized API response type indicating success or failure
 * @template T Type of data expected on success
 */
export type ApiResponseResult<T> =
    | { success: true; data: T | undefined }
    | { success: false; errorMessage: string; errorData?: unknown };

/**
 * Parses and validates REST API responses with optional Zod schema validation
 * 
 * This function:
 * - Handles successful responses (2xx status codes)
 * - Processes error responses (4xx/5xx status codes)
 * - Manages 204 No Content responses
 * - Safely parses JSON responses
 * - Converts all exceptions to unified error format
 * 
 * @template T Expected response type (inferred from schema when provided)
 * @param {Response} response - Native fetch API response object
 * @param {ZodSchema<T>} [schema] - Optional Zod schema for response validation
 * @returns {Promise<ApiResponseResult<T>>} Standardized result object
 * 
 * @example
 * // Basic usage without validation
 * const result = await parseApiResponse(response);
 * 
 * @example
 * // With Zod schema validation
 * const userSchema = z.object({ id: z.number(), name: z.string() });
 * const result = await parseApiResponse(response, userSchema);
 * 
 * @example
 * // Handling results
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Error:', result.errorMessage);
 * }
 */
export async function parseApiResponse<T = unknown>(
    response: Response,
    schema?: ZodSchema<T>
): Promise<ApiResponseResult<T>> {

    // Handle 204 No Content response immediately
    if (response.status === 204) {
        return { success: true, data: undefined };
    }

    // Read response as text (safe for non-JSON responses)
    const responseText = await response.text();

    try {
        // Parse JSON if available, fallback to null for empty body
        const jsonData = responseText ? JSON.parse(responseText) : null;

        if (!jsonData) {
            // We got empty response.just return it.
            return { success: true, data: jsonData };
        }

        // Process error responses (HTTP status 400-599)
        if (!response.ok) {
            return {
                success: false,
                errorMessage: formatResponseError({
                    status: response.status,
                    statusText: response.statusText,
                }),
                errorData: responseText,
            };
        }

        const trimedJsonData = removeNulls(jsonData);

        // Return parsed data directly if no schema provided
        if (!schema) {
            return { success: true, data: trimedJsonData as T };
        }

        // Validate and return with Zod schema
        return validateWithSchema(trimedJsonData, schema);
    } catch (error) {
        // Catch-all safety: Convert ANY exception to standardized format
        return {
            success: false,
            errorMessage: formatError(error),
            errorData: { error, responseText },
        };
    }
}


/**
 * Safely validates data using Zod schema without throwing exceptions
 * 
 * Uses Zod's safeParse method to avoid risky try/catch blocks
 * 
 * @private
 * @template T Expected data type
 * @param {unknown} data - Parsed JSON data to validate
 * @param {ZodSchema<T>} schema - Schema for validation
 * @returns {ApiResponseResult<T>} Validated result with type-safe data or error
 */
function validateWithSchema<T>(
    data: unknown,
    schema: ZodSchema<T>
): ApiResponseResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    return {
        success: false,
        errorMessage: formatError(result.error),
        errorData: { data: data, error: result.error },
    };
}


