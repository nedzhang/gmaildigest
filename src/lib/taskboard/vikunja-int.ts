// vikunja-int.ts
import logger, { createLogger, LogContext } from '@/lib/logger';
import { ApiResponseResult, parseApiResponse } from '@/lib/api-util';
import { NotificationsArraySchema, TaskSchema } from './vikunja-schema';
import { getVikunjaToken } from './vikunja-auth';
import { ZodSchema } from 'zod';

const VIKUNJA_API_TIMEOUT = 10000;
const VIKUNJA_API_URL = process.env.VIKUNJA_API_URL!; // Ensured by deployment validation

/**
 * Configuration interface for Vikunja API requests
 * @template T - Expected response type (inferred from Zod schema)
 * @param logContext - Logging context object
 * @param functionName - Name of calling function for logs
 * @param endpoint - API endpoint path (e.g., '/notifications')
 * @param method - HTTP method ('GET' by default)
 * @param queryParams - Optional query parameters
 * @param body - Optional request body
 * @param schema - Zod schema for response validation
 */
interface VikunjaRequestConfig<T> {
    logContext: LogContext;
    functionName: string;
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    queryParams?: Record<string, string>;
    body?: unknown;
    schema: ZodSchema<T>;
}

/**
 * Makes authenticated requests to the Vikunja API
 * - Handles token management, logging, and response validation
 * - Ensures consistent request/response handling across endpoints
 * 
 * @template T - Expected response type
 * @param config - Request configuration object
 * @returns Promise resolving to validated response data
 */
async function vikunjaRequest<T>(config: VikunjaRequestConfig<T>): Promise<ApiResponseResult<T>> {
    // Extract configuration with defaults
    const {
        logContext,
        functionName,
        path,
        method = 'GET',
        queryParams,
        body,
        schema
    } = config;

    const functionLogger = createLogger(logContext, {
        module: 'vikunja-int',
        function: functionName,
    })
    // // Create shared logging metadata
    // const logBase = {
    //     ...logContext,
    //     module: 'vikunja-int',
    //     function: functionName,
    // };

    try {
        // Retrieve authentication token
        const tokenHolder = await getVikunjaToken(logContext);

        // Construct full URL with query params
        const url = new URL(path, VIKUNJA_API_URL);
        if (queryParams) {
            url.search = new URLSearchParams(queryParams).toString();
        }

        // Prepare request options
        const requestOptions: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenHolder.token}`,
                'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(VIKUNJA_API_TIMEOUT),
            body: body ? JSON.stringify(body) : undefined
        };

        // if (!!body) requestOptions.body = JSON.stringify(body);

        // Log outgoing request
        functionLogger.debug(
            { url, method },
            `Initiating Vikunja API request: ${method} ${url}`
        );

        // Execute network request
        const response = await fetch(url.toString(), requestOptions);

        // Parse and validate response
        const result = await parseApiResponse(response, schema);

        // Log parsed response
        functionLogger.debug(
            { status: response.status, result },
            `Received API response status: ${response.status} success: ${result.success}`
        );

        return result;

    } catch (error) {
        // Log error with original message and context
        functionLogger.error(
            { error },
            `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        throw error; // Propagate for callers to handle
    }
}

// --- Public API Functions --- //

/**
 * Fetches paginated notifications from Vikunja API
 * 
 * @param logContext - Logging context
 * @param page - Page number (default: 1)
 * @param perPage - Items per page (default: 100)
 * @returns Array of validated notification objects
 */
export async function getNotifications(
    logContext: LogContext,
    page = 1,
    perPage = 100
) {
    return vikunjaRequest({
        logContext,
        functionName: 'getNotifications',
        path: 'notifications',
        queryParams: {
            page: page.toString(),
            per_page: perPage.toString()
        },
        schema: NotificationsArraySchema
    });
}

/**
 * Fetches a single task by its ID
 * 
 * @param logContext - Logging context
 * @param taskId - Numerical task identifier
 * @returns Validated task object
 */
export async function getTask(
    logContext: LogContext,
    taskId: number
) {
    return vikunjaRequest({
        logContext,
        functionName: 'getTask',
        path: `tasks/${taskId}`,
        queryParams: {
            expand: 'comments'
        },
        schema: TaskSchema
    });
}
