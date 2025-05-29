// import { randomBytes } from "crypto";

/**
 * Generates a unique ID combining cryptographic randomness and timestamp
 * @function generateId
 * @returns {string} A 16-character Base64URL-encoded string containing:
 * - 32-bit (4-byte) cryptographic random number
 * - 64-bit (8-byte) timestamp in milliseconds
 * @example
 * // Returns a 16-character string like "A5Fg3j_81aBcdEfG"
 * const id = generateId();
 * @note
 * - Base64URL encoding is URL-safe and lacks padding characters
 * - Collision probability: ~1 in 4.3 billion per millisecond
 * - Timestamp valid until ~292 billion AD
 * - Requires Node.js 14+ for Buffer methods
 */
export function generateId(): string {
    // Allocate 12 bytes (4 random + 8 timestamp)
    const buffer =  Buffer.alloc(12);
    const bufferRandom = Buffer.alloc(4);
    crypto.getRandomValues(bufferRandom);

    // Copy first 4 bytes
    buffer.set(bufferRandom.subarray(0, 4), 0);

    buffer.writeBigInt64BE(BigInt(Date.now()), 4);
    // // Convert to Base64URL without padding
    // return buffer
    //     .toString('base64')
    //     .replace(/\+/g, '-')
    //     .replace(/\//g, '_')
    //     .replace(/=+$/, '');

    // Convert to Base64URL without padding
    return buffer.toString("base64url");
}

/**
 * Test suite for generateId function
 */
export function testGenerateId() {
    const assert = require("assert");
    const TOTAL_TESTS = 4;
    let testsCompleted = 0;

    const testResults = [];

    // Test 1: Validate output format
    (() => {
        const id = generateId();
        assert.strictEqual(id.length, 16, "ID should be 16 characters");
        assert.match(
            id,
            /^[A-Za-z0-9\-_]{16}$/,
            "Should only contain Base64URL chars",
        );
        testsCompleted++;
        testResults.push({ test: "Format", result: "Passed" });
    })();

    // Test 2: Verify timestamp encoding
    (() => {
        const testTime = Date.now();
        const buffer = Buffer.from(
            generateId()
                .replace(/-/g, "+")
                .replace(/_/g, "/"),
            "base64",
        );

        // Extract timestamp from last 8 bytes
        const timestamp = buffer.readBigUInt64BE(4);
        const timeDiff = Number(timestamp) - testTime;

        assert.ok(
            Math.abs(timeDiff) < 100,
            `Timestamp should be within 100ms (delta: ${timeDiff}ms)`,
        );
        testsCompleted++;
        testResults.push({ test: "Timestamp", result: "Passed" });
    })();

    // Test 3: Check uniqueness in rapid succession
    (() => {
        const iterations = 10_000;
        const ids = new Set<string>();

        for (let i = 0; i < iterations; i++) {
            ids.add(generateId());
        }

        assert.strictEqual(
            ids.size,
            iterations,
            `Generated ${iterations} unique IDs`,
        );
        testsCompleted++;
        testResults.push({ test: "Uniqueness", result: "Passed" });
    })();

    // Test 4: Verify byte structure
    (() => {
        const buffer = Buffer.from(
            generateId()
                .replace(/-/g, "+")
                .replace(/_/g, "/"),
            "base64",
        );

        assert.strictEqual(
            buffer.length,
            12,
            "Should decode to 12 original bytes",
        );
        assert.ok(
            buffer.readUInt32BE(0) > 0,
            "First 4 bytes should contain random data",
        );
        testsCompleted++;
        testResults.push({ test: "Byte structure", result: "Passed" });
    })();

    return testResults;
    // console.log(`All ${TOTAL_TESTS} tests passed successfully`);
}

// // Run tests when file is executed directly
// if (require.main === module) {
//     testGenerateId();
// }
