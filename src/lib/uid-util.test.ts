// uid-util.test.ts

import { generateId } from './uid-util';

describe('generateId', () => {
  it('generates an ID of length 12', () => {
    const id = generateId();
    expect(id.length).toBe(12); // Updated from 16 to 12
  });

  it('uses URL-safe Base64 encoding without padding', () => {
    const id = generateId();
    expect(id).toMatch(/^[A-Za-z0-9_-]{12}$/); // Updated length to 12
    expect(id).not.toContain('+');
    expect(id).not.toContain('/');
    expect(id).not.toContain('=');
  });

  it('embeds the current timestamp in the lower 40 bits', () => {
    const now = Date.now();
    const id = generateId();
    
    // Decode ID to buffer
    const buffer = Buffer.from(id, 'base64url');
    expect(buffer.length).toBe(9); // 9 bytes (4 random + 5 timestamp)
    
    // Extract timestamp portion (last 5 bytes)
    const timePart = buffer.subarray(4, 9); // Updated to 5 bytes
    const view = new DataView(
      timePart.buffer,
      timePart.byteOffset,
      timePart.byteLength
    );
    
    // Reconstruct 40-bit timestamp (big-endian)
    const high32 = view.getUint32(0, false);
    const low8 = view.getUint8(4);
    const storedTimestamp = (BigInt(high32) << 8n) | BigInt(low8);
    
    // Verify only lower 40 bits are stored
    const expected = BigInt(now) & 0xFFFFFFFFFFn;
    expect(storedTimestamp).toBe(expected);
  });

  it('generates unique IDs', () => {
    const ids = new Set();
    const count = 1000;
    
    for (let i = 0; i < count; i++) {
      ids.add(generateId());
    }
    
    expect(ids.size).toBe(count);
  });
});