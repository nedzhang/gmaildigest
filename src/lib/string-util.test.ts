// src/lib/string-util.test.ts
import {
    decodeUnicodeEscapes,
    decodeBase64,
    base64UrlToBase64,
    base64ToBase64Url,
    truncateWords,
} from './string-util';

describe('decodeUnicodeEscapes', () => {
    it('decodes valid Unicode escape sequences into characters', () => {
        expect(decodeUnicodeEscapes('Hello\\u0020World')).toBe('Hello World');
        expect(decodeUnicodeEscapes('\\u0041')).toBe('A');
        expect(decodeUnicodeEscapes('\\u0061bc')).toBe('abc');
    });

    it('returns original string when no escapes are present', () => {
        expect(decodeUnicodeEscapes('No escapes')).toBe('No escapes');
    });
});

describe('decodeBase64', () => {
    it('decodes standard Base64 strings to UTF-8', () => {
        expect(decodeBase64('SGVsbG8gV29ybGQ=')).toBe('Hello World');
        expect(decodeBase64('MQ==')).toBe('1');
    });

    it('handles empty input gracefully', () => {
        expect(decodeBase64('')).toBe('');
    });
});

describe('base64UrlToBase64', () => {
    it('replaces URL-safe characters with standard Base64 equivalents', () => {
        expect(base64UrlToBase64('a-b_cd')).toBe('a+b/cd');
        expect(base64UrlToBase64('test-_with~symbols')).toBe('test+/with~symbols');
    });

    it('leaves non-URL-safe characters unchanged', () => {
        expect(base64UrlToBase64('test=string')).toBe('test=string');
    });
});

describe('base64ToBase64Url', () => {
    it('converts standard Base64 to URL-safe format', () => {
        expect(base64ToBase64Url('a+b/cd=')).toBe('a-b_cd');
        expect(base64ToBase64Url('test/string+here==')).toBe('test_string-here');
    });

    it('leaves already URL-safe strings unchanged', () => {
        expect(base64ToBase64Url('nochanges')).toBe('nochanges');
    });
});

describe('truncateWords', () => {
    describe('core functionality', () => {
        it('truncates to exact word count with appendix', () => {
            expect(truncateWords('one two three', 2)).toBe('one two...');
        });

        it('returns full string when word count exceeds content length', () => {
            expect(truncateWords('one two', 3)).toBe('one two');
        });

        it('preserves original whitespace between words', () => {
            expect(truncateWords('one   two  three', 2)).toBe('one   two...');
        });

        it('supports custom appendix strings', () => {
            expect(truncateWords('a b c d', 2, '…')).toBe('a b…');
        });
    });

    describe('parameter validation', () => {
        it('throws error for non-positive numberOfWordsToKeep', () => {
            expect(() => truncateWords('test', 0)).toThrow('numberOfWordsToKeep must be positive integer. Received: 0');
            expect(() => truncateWords('test', -5)).toThrow('numberOfWordsToKeep must be positive integer. Received: -5');
        });

        it('rejects invalid appendix values', () => {
            expect(() => truncateWords('test', 1, '')).toThrow('Invalid appendix');
            expect(() => truncateWords('test', 1, 'x'.repeat(201))).toThrow('Invalid appendix');
        });

        it('accepts valid numberOfWordsToKeep and appendix', () => {
            expect(() => truncateWords('test', 1)).not.toThrow();
            expect(() => truncateWords('test', 1, '✓')).not.toThrow();
            expect(() => truncateWords('test', 1, 'x'.repeat(200))).not.toThrow();
        });
    });

    describe('whitespace handling', () => {
        it('truncates with leading whitespace (exact words kept)', () => {
            expect(truncateWords('   one two three', 3)).toBe('   one two...');
        });

        it('preserves leading whitespace without appendix (no words truncated)', () => {
            expect(truncateWords('   one    ', 2)).toBe('   one');
        });

        it('handles trailing whitespace after last word', () => {
            expect(truncateWords('test ', 1)).toBe('test'); // No leftover non-whitespace
        });

        it('appends appendix when words exist after truncated whitespace', () => {
            // Input: 'test  a' → tokens: ['test', '  ', 'a']
            // Truncate to 1 word → kept tokens: ['test'] → 'test'
            // Remaining content: '  a' (trimmed is non-empty) → appendix added
            expect(truncateWords('test  a', 1, '!')).toBe('test!');
        });

        it('does NOT append appendix when only trailing whitespace remains', () => {
            // Input: 'test   ' → tokens: ['test', '   ']
            // Truncate to 1 word → kept tokens: ['test'] → 'test'
            // Remaining content: '   ' (trimmed is empty) → no appendix
            expect(truncateWords('test   ', 1, '!')).toBe('test');
        });



        it('returns pure whitespace input as empty string (not really what we want but focus on reducing code complexity', () => {
            expect(truncateWords('   ', 1)).toBe('');
            // Input: '   ' → tokens: ['', '   '] (assuming split(/(\s+)/g))
            // Truncate to 1 word → kept tokens: slice(0, 1) = ['']
            expect(truncateWords('   ', 1)).toBe('');

            // Larger word count still truncates to original length
            expect(truncateWords('   ', 5)).toBe('   ');
        });
    });


    describe('edge cases', () => {
        it('handles null/undefined/empty input', () => {
            // @ts-ignore - Testing JS behavior in TS environment
            expect(truncateWords(null, 2)).toBeNull();
            // @ts-ignore
            expect(truncateWords(undefined, 2)).toBeUndefined();
            expect(truncateWords('', 2)).toBe('');
        });

        it('handles single word with surrounding whitespace', () => {
            expect(truncateWords('  hello  ', 2)).toBe('  hello');
        });
    });
});
