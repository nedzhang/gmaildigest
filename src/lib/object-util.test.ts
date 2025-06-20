import {
    shallowCopyObjProperties,
    reverseString,
    areStringListsEqual,
    hasProperty,
    removeNulls,
    deepMergeObjects,
} from './object-util';

describe('object-util', () => {
    // shallowCopyObjProperties tests
    describe('shallowCopyObjProperties', () => {
        it('copies non-null/undefined/empty values', () => {
            const input = {
                a: 1,
                b: 'test',
                c: null,
                d: undefined,
                e: '',
                f: false
            };
            const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
            const result = shallowCopyObjProperties(input, keys);
            expect(result).toEqual({
                a: 1,
                b: 'test',
                f: false  // false is preserved!
            });
        });

        it('preserves falsy-but-allowed values', () => {
            const input = {
                falseValue: false,
                zero: 0,
                nan: NaN,
                emptyString: '',
                nullValue: null
            };
            const keysToKeep = ['falseValue', 'zero', 'nan', 'emptyString', 'nullValue'];
            const result = shallowCopyObjProperties(input, keysToKeep);

            // Should preserve:
            expect(result.falseValue).toBe(false);
            expect(result.zero).toBe(0);
            expect(isNaN(result.nan)).toBe(true);

            // Should skip:
            expect(result).not.toHaveProperty('emptyString');
            expect(result).not.toHaveProperty('nullValue');
        });

        it('copies specified truthy properties', () => {
            const input = { a: 1, b: 'test', c: null, d: undefined, e: '' };
            const keys = ['a', 'b', 'c', 'd', 'e'];
            const result = shallowCopyObjProperties(input, keys);
            expect(result).toEqual({ a: 1, b: 'test' });
        });

        it('returns empty object when no keys match', () => {
            const input = { a: 1 };
            const result = shallowCopyObjProperties(input, ['b', 'c']);
            expect(result).toEqual({});
        });

        it('handles empty input object', () => {
            const result = shallowCopyObjProperties({}, ['a']);
            expect(result).toEqual({});
        });

        it('should preserve boolean false values when explicitly kept', () => {
            // Create an object with various falsy values we want to keep
            const input = {
                importantFalse: false,
                importantZero: 0,
                importantEmptyString: '',
                importantNull: null,
                importantUndefined: undefined,
                omittedTruthy: 'should-be-omitted',
            };

            const keysToKeep = [
                'importantFalse',
                'importantZero',
                'importantEmptyString',
                'importantNull',
                'importantUndefined'
            ];

            const result = shallowCopyObjProperties(input, keysToKeep);

            // Verify false and other important falsy values are preserved
            expect(result).toEqual({
                importantFalse: false,
                importantZero: 0,
                // importantEmptyString: '',
                // importantNull: null,
                // importantUndefined: undefined
            });

            // Specifically verify false is present
            expect(result).toHaveProperty('importantFalse', false);
            // Verify that the truthy property not in keysToKeep is omitted
            expect(result).not.toHaveProperty('omittedTruthy');
        });
    });

    // reverseString tests
    describe('reverseString', () => {
        it('reverses string correctly', () => {
            expect(reverseString('hello')).toBe('olleh');
            expect(reverseString('123')).toBe('321');
        });

        it('handles empty string', () => {
            expect(reverseString('')).toBe('');
        });
    });

    // areStringListsEqual tests
    describe('areStringListsEqual', () => {
        it('returns true for same elements regardless of order', () => {
            expect(areStringListsEqual(['a', 'b'], ['b', 'a'])).toBe(true);
        });

        it('returns false for different arrays', () => {
            expect(areStringListsEqual(['a', 'b'], ['a'])).toBe(false);
            expect(areStringListsEqual(['a', 'b'], ['a', 'c'])).toBe(false);
        });

        it('handles empty arrays', () => {
            expect(areStringListsEqual([], [])).toBe(true);
        });
    });

    // hasProperty tests
    describe('hasProperty', () => {
        it('returns false for empty objects', () => {
            expect(hasProperty({})).toBe(false);
        });

        it('returns true for non-empty objects', () => {
            expect(hasProperty({ a: 1 })).toBe(true);
            expect(hasProperty({ a: undefined })).toBe(true);
        });

        it('handles falsy values', () => {
            expect(hasProperty(null as any)).toBe(false);
            expect(hasProperty(undefined as any)).toBe(false);
        });
    });

    // removeNulls tests
    describe('removeNulls', () => {
        it('removes top-level null/undefined', () => {
            const input = { a: 1, b: null, c: undefined, d: 'test' };
            expect(removeNulls(input)).toEqual({ a: 1, d: 'test' });
        });

        it('removes nulls in nested objects', () => {
            const input = { a: { b: null, c: { d: undefined } } };
            expect(removeNulls(input)).toEqual({ a: { c: {} } });
        });

        it('cleans arrays', () => {
            const input = { arr: [1, null, undefined, 'test'] };
            expect(removeNulls(input)).toEqual({ arr: [1, 'test'] });
        });

        it('handles nested arrays and objects', () => {
            const input = [null, [undefined, 2], { a: null }];
            expect(removeNulls(input)).toEqual([[2], {}]);
        });

        it('returns undefined for pure null', () => {
            expect(removeNulls(null)).toBeUndefined();
            expect(removeNulls(undefined)).toBeUndefined();
        });
    });

    // mergeDeepObjects tests
    describe('mergeDeepObjects', () => {
        it('returns other object when one is null/undefined', () => {
            expect(deepMergeObjects(null, { a: 1 })).toEqual({ a: 1 });
            expect(deepMergeObjects(undefined, { a: 1 })).toEqual({ a: 1 });
            expect(deepMergeObjects({ a: 1 }, null)).toEqual({ a: 1 });
        });

        it('merges plain objects recursively', () => {
            const obj1 = { a: 1, b: { c: 2 } };
            const obj2 = { b: { d: 3 }, e: 4 };
            expect(deepMergeObjects(obj1, obj2)).toEqual({
                a: 1,
                b: { c: 2, d: 3 },
                e: 4,
            });
        });

        it('concatenates arrays', () => {
            const obj1 = { items: [1, 2] };
            const obj2 = { items: [3, 4] };
            expect(deepMergeObjects(obj1, obj2)).toEqual({ items: [1, 2, 3, 4] });
        });

        it('throws error with array/non-array conflict', () => {
            const obj1 = { items: [1, 2] };
            const obj2 = { items: 'test' };
            expect(() => deepMergeObjects(obj1, obj2)).toThrow(
                'Cannot merge array with non-array'
            );
        });

        it('overwrites primitives with rightmost value', () => {
            expect(deepMergeObjects(1, 2)).toBe(2);
            expect(deepMergeObjects('a', 'b')).toBe('b');
            expect(deepMergeObjects(true, false)).toBe(false);
            expect(deepMergeObjects({ a: 1 }, 2)).toBe(2);
        });

        it('handles complex nesting', () => {
            const obj1 = {
                a: 1,
                b: [1, 2],
                c: { d: 3, e: { f: 4 } },
                g: null,
            };
            const obj2 = {
                a: undefined,
                b: [3],
                c: { e: { g: 5 }, h: 6 },
                i: [null],
            };
            const result = deepMergeObjects(obj1, obj2);
            expect(result).toEqual({
                a: 1, // obj1 value persists since obj2.a is undefined
                b: [1, 2, 3],
                c: { d: 3, e: { f: 4, g: 5 }, h: 6 },
                g: null,
                i: [null],
            });
        });

        // Add new tests for array merging with ID matching
        describe('array merging with identifier keys', () => {
            it('merges arrays of objects by matching "id" field', () => {
                const base = [
                    { id: 1, name: 'Item 1', value: 'Original', role: 'admin' },
                    { id: 2, name: 'Item 2', value: 'Original' }
                ];

                const override = [
                    { id: 2, value: 'Updated', role: 'manager' },
                    { id: 3, name: 'New Item', value: 'Added' }
                ];

                const result = deepMergeObjects(base, override);

                expect(result).toEqual([
                    { id: 1, name: 'Item 1', value: 'Original', role: 'admin' },
                    { id: 2, name: 'Item 2', value: 'Updated', role: 'manager' },
                    { id: 3, name: 'New Item', value: 'Added' }
                ]);
            });

            it('works with nested objects that contain arrays with IDs', () => {
                const base = {
                    project: {
                        id: 101,
                        tasks: [
                            { task_id: 1, title: 'First' },
                            { task_id: 2, title: 'Second' }
                        ]
                    }
                };

                const override = {
                    project: {
                        tasks: [
                            { task_id: 2, status: 'completed' },
                            { task_id: 3, title: 'Third' }
                        ]
                    }
                };

                const result = deepMergeObjects(
                    base,
                    override,
                    'task_id' // Custom identifier
                );

                expect(result).toEqual({
                    project: {
                        id: 101,
                        tasks: [
                            { task_id: 1, title: 'First' },
                            { task_id: 2, title: 'Second', status: 'completed' },
                            { task_id: 3, title: 'Third' }
                        ]
                    }
                });
            });

            it('uses custom identifier key when provided', () => {
                const base = [
                    { uuid: 'a', value: 1 },
                    { uuid: 'b', value: 2 }
                ];

                const override = [
                    { uuid: 'b', value: 22 },
                    { uuid: 'c', value: 3 }
                ];

                const result = deepMergeObjects(base, override, 'uuid');

                expect(result).toEqual([
                    { uuid: 'a', value: 1 },
                    { uuid: 'b', value: 22 },
                    { uuid: 'c', value: 3 }
                ]);
            });

            it('preserves array order with schema changes', () => {
                const base = [
                    { id: 1, name: 'First' },
                    { id: 2, name: 'Second' }
                ];

                const override = [
                    { id: 2, description: 'Middle item' },
                    { id: 1 } // Doesn't change original order
                ];

                const result = deepMergeObjects(base, override);

                expect(result[0]).toEqual({ id: 1, name: 'First' });
                expect(result[1]).toEqual({ id: 2, name: 'Second', description: 'Middle item' });
                expect(result.map(i => i.id)).toEqual([1, 2]); // Order preserved
            });

            it('concatenates primitive arrays without merging', () => {
                const base = [1, 2, 3];
                const override = [4, 5];
                expect(deepMergeObjects(base, override)).toEqual([1, 2, 3, 4, 5]);
            });

            it('concatenates mixed-type arrays', () => {
                const base = [1, { id: 1, value: 'A' }];
                const override = [2, { id: 2, value: 'B' }];
                const result = deepMergeObjects(base, override);

                expect(result).toEqual([
                    1,
                    { id: 1, value: 'A' },
                    2,
                    { id: 2, value: 'B' }
                ]);
            });

            it('handles arrays where some objects are missing IDs', () => {
                const base = [
                    { id: 1, value: 'Base' },
                    { value: 'Object without ID' }
                ];

                const override = [
                    { id: 1, value: 'Override' },
                    { value: 'New object without ID' }
                ];

                const result = deepMergeObjects(base, override);

                expect(result).toEqual([
                    { id: 1, value: 'Base' },
                    { value: 'Object without ID' },
                    { id: 1, value: 'Override' }, // Treated as new object
                    { value: 'New object without ID' }
                ]);
            });

            it('merges deeply nested array properties', () => {
                const base = {
                    data: {
                        items: [
                            { id: 'a', details: { version: 1, tags: ['old'] } },
                        ]
                    }
                };

                const override = {
                    data: {
                        items: [
                            { id: 'a', details: { version: 2, tags: ['new'] } },
                            { id: 'b', value: 'New' }
                        ]
                    }
                };

                const result = deepMergeObjects(base, override);

                expect(result).toEqual({
                    data: {
                        items: [
                            {
                                id: 'a',
                                details: {
                                    version: 2,
                                    tags: ['old', 'new'] // Arrays concatenated at this level
                                }
                            },
                            { id: 'b', value: 'New' }
                        ]
                    }
                });
            });

            it('concatenates arrays when duplicate IDs are present', () => {
                const base = [
                    { id: 1, values: [1] },
                    { id: 1, values: [2] } // Duplicate ID in base array
                ];

                const override = [
                    { id: 1, values: [3] }, // Duplicate ID in override array
                    { id: 2, values: [4] }
                ];

                const result = deepMergeObjects(base, override);

                // Should concat instead of merging by ID
                expect(result).toEqual([
                    { id: 1, values: [1] },
                    { id: 1, values: [2] },
                    { id: 1, values: [3] },
                    { id: 2, values: [4] }
                ]);
            });

            it('merges arrays normally when IDs are unique', () => {
                const base = [
                    { id: 1, value: 'A' },
                    { id: 2, value: 'B' }
                ];

                const override = [
                    { id: 2, value: 'B Updated' },
                    { id: 3, value: 'C' }
                ];

                const result = deepMergeObjects(base, override);

                expect(result).toEqual([
                    { id: 1, value: 'A' },
                    { id: 2, value: 'B Updated' },
                    { id: 3, value: 'C' }
                ]);
            });

            it('concatenates when one item in base array has duplicate ID', () => {
                const base = [
                    { id: 1, value: 'A' },
                    { id: 1, value: 'A2' } // Duplicate
                ];

                const override = [
                    { id: 2, value: 'B' }
                ];

                const result = deepMergeObjects(base, override);

                expect(result).toEqual([
                    { id: 1, value: 'A' },
                    { id: 1, value: 'A2' },
                    { id: 2, value: 'B' }
                ]);
            });

            it('concatenates when one item in override array has duplicate ID', () => {
                const base = [
                    { id: 1, value: 'A' }
                ];

                const override = [
                    { id: 2, value: 'B' },
                    { id: 2, value: 'B2' } // Duplicate
                ];

                const result = deepMergeObjects(base, override);

                expect(result).toEqual([
                    { id: 1, value: 'A' },
                    { id: 2, value: 'B' },
                    { id: 2, value: 'B2' }
                ]);
            });

            it('merges empty arrays properly', () => {
                expect(deepMergeObjects([], [])).toEqual([]);
                expect(deepMergeObjects([1, 2], [])).toEqual([1, 2]);
                expect(deepMergeObjects([], [{ id: 1 }])).toEqual([{ id: 1 }]);
            });
        });
    });
});
