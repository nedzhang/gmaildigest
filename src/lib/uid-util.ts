// uid-util.ts

// TODO: add logic to allow caller to decide the length of the id. Currently
// the id is 12 characters long (9 bytes (2^8) encode to Base64Url (2^6) = 9*8/6 = 12)
// the caller should be able to request 8 characters (6 bytes) or 16 characters (12 bytes)
// and the generateId should have the logic to distribute the bytes between random and timestamp
//  - for 8 characters, we should have 2 bytes of random (65536 possibilities) and 4 bytes timestamp (49.7 days cycle)
//  - for 12 characters, we should have 4 bytes of random (4,294,967,296 possibilities) and 5 bytes timestamp (34.8 years cycle)
//  - for 16 characters, we should have 6 bytes of random (2.8E+14 possibilities) and 6 bytes timestamp (8920.6 years cycle)
/**
 * Generates a unique ID combining cryptographic randomness and timestamp
 * @function generateId
 * @returns {string} A 12-character Base64URL-encoded string containing:
 * - 32-bit (4-byte) cryptographic random number
 * - 40-bit (5-byte) timestamp in milliseconds (lower bits) 
 * @example
 * // Returns a 12-character string like "A5Fg3j_81aBc"
 * const id = generateId();
 * @note
 * - Base64URL encoding is URL-safe and lacks padding characters
 * - Timestamp wraps around every ~34.8 years so afte 34.8 years, we will repeat the millisecond part
 * - Collision probability: ~1 in 4.3 billion per millisecond
 * - Works in both browser and Node.js environments
 */
export function generateId(): string {
    // Allocate buffer: 4 (random) + 5 (timestamp) = 9 bytes
    const buffer = new Uint8Array(9);
    
    // Generate 4 random bytes
    const randomBytes = getRandomBytes(4);
    buffer.set(randomBytes, 0);
    
    // Write timestamp as 40-bit big-endian
    writeTimestamp40(buffer);
    
    // Convert to Base64URL without padding (12 characters)
    return toBase64URL(buffer);
}

/** Gets cryptographically secure random bytes */
function getRandomBytes(length: number): Uint8Array {
    if (typeof window === 'undefined') {
        // Node.js environment
        const bufferRandom = Buffer.alloc(length);
        crypto.getRandomValues(bufferRandom);
        return bufferRandom;
    } else {
        // Browser environment
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return bytes;
    }
}

/** Writes current timestamp as 40-bit big-endian to buffer at offset 4 */
function writeTimestamp40(buffer: Uint8Array): void {
    const timestamp = BigInt(Date.now());
    // Extract lower 40 bits (5 bytes)
    const low40 = timestamp & 0xFFFFFFFFFFn;
    
    // Write big-endian using DataView
    const view = new DataView(buffer.buffer);
    view.setUint32(4, Number(low40 >> 8n), false);  // High 32 bits
    view.setUint8(8, Number(low40 & 0xFFn));       // Low 8 bits
}

/** Converts Uint8Array to Base64URL without padding */
function toBase64URL(data: Uint8Array): string {
    if (typeof window === 'undefined') {
        return Buffer.from(data).toString('base64url');
    }
    // Browser: manual conversion
    const base64 = btoa(String.fromCharCode(...data));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}