// vikunja-int.ts

import logger, { createLogger, LogContext, LogEvent } from '@/lib/logger';
import { parseApiResponse } from '@/lib/api-util';
import { z } from 'zod';
import { formatError, jsonifyError } from '@/lib/error-util';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Token TTL in milliseconds (default: 30 minutes) */
const TOKEN_TTL_MS = (Number(process.env.VIKUNJA_TOKEN_MIN) || 30) * 60 * 1000;
/** Timeout for Vikunja authentication API */
const VIKUNJA_LOGIN_TIMEOUT = 5000;

// Validate environment configuration at startup
const ENV_CONFIG = {
    vikunjaApiUrl: process.env.VIKUNJA_API_URL,
    vikunjaUsername: process.env.VIKUNJA_USERNAME,
    vikunjaPassword: process.env.VIKUNJA_PASSWORD
};

// =============================================================================
// TYPES & SCHEMAS
// =============================================================================

/** Response schema for Vikunja login endpoint */
const VikunjaLoginResponseSchema = z.object({
    token: z.string().describe('Authentication token string')
});
type VikunjaLoginResponse = z.infer<typeof VikunjaLoginResponseSchema>;

/** Interface for token response data */
export interface VikunjaTokenResult {
    token: string;
    expire: number;
    expires_in: number;
    cached: boolean;
}

// =============================================================================
// MANAGED STATE
// =============================================================================

/** Token management state */
const TokenManager = {
    token: null as string | null,
    expiry: 0,

    refresh(token: string) {
        this.token = token;
        this.expiry = Date.now() + TOKEN_TTL_MS;
    },

    isValid(): boolean {
        return !!this.token && Date.now() < this.expiry;
    },

    timeRemaining(): number {
        return Math.max(0, Math.floor((this.expiry - Date.now()) / 1000));
    }
};

// =============================================================================
// ERRORS
// =============================================================================

/** Custom error for token request failures */
export class TokenRequestError extends Error {
    /**
     * Create a token request error
     * @param message - Human-readable error description
     * @param code - HTTP status code if available
     * @param data - Additional error details
     */
    constructor(
        public message: string,
        public code?: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'TokenRequestError';
        Object.setPrototypeOf(this, TokenRequestError.prototype);
    }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Retrieves a Vikunja authentication token
 * 
 * Provides cached tokens when valid or fetches a new token when expired
 * 
 * @param logContext - Logging context for tracing
 * @returns Token data with cache status
 * @throws {TokenRequestError} if token retrieval fails
 */
export async function getVikunjaToken(
    logContext: LogContext
): Promise<VikunjaTokenResult> {

    const functionLogger = createLogger(logContext, {
        module: 'vikunja-token',
        function: 'getVikunjaToken'
    })
    try {
        validateEnvironmentConfig();

        if (TokenManager.isValid()) {
            functionLogger.trace(
                { expiresIn: TokenManager.timeRemaining() },
                'Serving cached Vikunja token'
            );
            return formatTokenResult(true);
        }

        return await acquireNewToken(logContext);

    } catch (error) {
        const errorMessage = formatError(error);

        // console.log('error: ', error.toString());
        const errorObj = jsonifyError(error);

        functionLogger.error(
            { error: errorObj },
            `**getVikunjaToken** getting token error: ${errorMessage}`
        );

        throw error;
    }
}

// =============================================================================
// PRIVATE HELPER FUNCTIONS
// =============================================================================

/**
 * Formats token response data consistently
 * @param fromCache - Whether token was served from cache
 * @returns Token data including expiration information
 */
function formatTokenResult(fromCache: boolean): VikunjaTokenResult {
    return {
        token: TokenManager.token!,
        expire: TokenManager.expiry,
        expires_in: TokenManager.timeRemaining(),
        cached: fromCache
    };
}

/**
 * Verifies required environment configuration
 * @throws {TokenRequestError} if any config is missing
 */
function validateEnvironmentConfig() {
    const { vikunjaApiUrl, vikunjaUsername, vikunjaPassword } = ENV_CONFIG;

    if (!!vikunjaApiUrl && !!vikunjaUsername && !!vikunjaPassword) return;

    const missing = {
        apiUrl: !vikunjaApiUrl,
        username: !vikunjaUsername,
        password: !vikunjaPassword
    };

    throw new TokenRequestError(
        "Vikunja credentials not configured",
        500,
        missing
    );
}

/**
 * Acquires and stores new authentication token
 * @param logBase - Logging context
 * @returns Token data with cache status
 */
async function acquireNewToken(logContext: LogContext): Promise<VikunjaTokenResult> {
    const functionLogger = createLogger(logContext, {
        module: 'notification-test',
        function: 'acquireNewToken',
    })

    const tokenResponse = await fetchToken();

    if (!tokenResponse || !tokenResponse.token) {
        throw new TokenRequestError(
            'Failed to get token from Vikunja. Unable to read tokenresponse or tokensResponse.token.',
            502
        );
    }

    TokenManager.refresh(tokenResponse.token);

    functionLogger.info(
        { expiry: TokenManager.expiry },
        'New Vikunja authentication token acquired'
    );

    return formatTokenResult(false);
}

/**
 * Authenticates with Vikunja API
 * @returns Authentication token response
 * @throws {TokenRequestError} on request failure
 */
async function fetchToken(): Promise<VikunjaLoginResponse> {
    const { vikunjaApiUrl, vikunjaUsername, vikunjaPassword } = ENV_CONFIG;

    const endpoint = `${vikunjaApiUrl}login`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            long_token: true,
            username: vikunjaUsername,
            password: vikunjaPassword,
        }),
        signal: AbortSignal.timeout(VIKUNJA_LOGIN_TIMEOUT),
    });

    const parsed = await parseApiResponse(response, VikunjaLoginResponseSchema);

    if (!parsed.success) {
        throw new TokenRequestError(
            `API request failed: ${parsed.errorMessage}`,
            response.status,
            parsed.errorData
        );
    }

    return parsed.data!;
}
