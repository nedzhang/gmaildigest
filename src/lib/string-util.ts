

export function decodeUnicodeEscapes(input: string): string {

    return input.replace(/\\u([\da-fA-F]{4})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

}


export function decodeBase64(base64Encoded: string): string {
    return Buffer.from(base64Encoded, "base64").toString("utf-8");
}


/**
 * Converts a Base64 URL encoded string to a Base64 encoded string
 * @param base64Url - Base64 URL encoded string
 * @returns Base64 encoded string
 */
export function base64UrlToBase64(base64Url: string): string {
    return base64Url.replace(/-/g, '+').replace(/_/g, '/');
}


/**
 * Converts a Base64 encoded string to a Base64 URL encoded string
 * @param base64 base64 encoded string
 * @returns base64 URL encoded string
 */
export function base64ToBase64Url(base64: string): string {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}