// src/lib/string-util.ts

/**
 * Decodes Unicode escape sequences (e.g., \u0020) into their corresponding characters.
 * @param input - The input string containing Unicode escapes.
 * @returns The decoded string.
 */
export function decodeUnicodeEscapes(input: string): string {
    // Matches \u followed by exactly 4 hex digits (case-insensitive via [\da-fA-F])
    return input.replace(/\\u([\da-fA-F]{4})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Decodes a Base64-encoded string into a UTF-8 string.
 * @param base64Encoded - The Base64-encoded string.
 * @returns The decoded UTF-8 string.
 */
export function decodeBase64(base64Encoded: string): string {
    return Buffer.from(base64Encoded, "base64").toString("utf-8");
}

/**
 * Converts a Base64 URL-safe encoded string to a standard Base64 string.
 * Replaces '-' with '+' and '_' with '/'.
 * @param base64UrlEncodedString - The URL-safe Base64 encoded string.
 * @returns Standard Base64 encoded string.
 */
export function base64UrlToBase64(base64UrlEncodedString: string): string {
    return base64UrlEncodedString.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * Converts a standard Base64 string to a URL-safe Base64 encoded string.
 * Replaces '+' with '-' and '/' with '_', and removes trailing padding '='.
 * @param base64EncodedString - The standard Base64 encoded string.
 * @returns URL-safe Base64 encoded string.
 */
export function base64ToBase64Url(base64EncodedString: string): string {
    return base64EncodedString
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Truncates a string to a specified number of words, preserving original whitespace structure.
 * Words are non-whitespace tokens separated by contiguous whitespace blocks.
 * 
 * Notes:
 * - Leading/trailing whitespace reduces available token slots for words (split creates empty tokens).
 * - Pure whitespace input truncates to an empty string if `numberOfWordsToKeep` exceeds word count (0).
 * 
 * @param content - Input string. Whitespace structure is preserved up to truncation.
 * @param numberOfWordsToKeep - Words to retain (integer ≥1).
 * @param appendix - Added if non-whitespace content is truncated (length 1-200).
 * @returns Truncated string with appendix if applicable.
 */
export function truncateWords(
    content: string,
    numberOfWordsToKeep: number,
    appendix: string = '...'
): string {
    if (numberOfWordsToKeep < 1) {
        throw new Error(`numberOfWordsToKeep must be positive integer. Received: ${numberOfWordsToKeep}`);
    }

    if (!appendix || appendix.length > 200) {
        // Handle empty string (passing `appendix = ""`) or invalid lengths
        const appendixStatus = !appendix ? "is empty/undefined" : `length ${appendix.length}`;
        throw new Error(`Invalid appendix: Required length 1-200. ${appendixStatus}`);
    }

    if (!content) return content;

    // Split into alternating tokens: ["word", "whitespace", "word", ...]
    const tokens = content.split(/(\s+)/);
    
    // Track tokens included before truncation (2n-1 captures whitespace between n words)
    const tokenCutoff = 2 * numberOfWordsToKeep - 1;
    const truncatedContent = tokens.slice(0, tokenCutoff).join("");

    // Check remaining content for non-whitespace to determine appendix
    const remainingContent = tokens.slice(tokenCutoff).join("").trim();
    return truncatedContent + (remainingContent ? appendix : "");
}

