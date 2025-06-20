// lib/object-util.ts

/**
 * Utility functions for object operations
 */

/**
 * Shallow copies specified properties from an object, skipping null, undefined, and empty strings
 * @param copyFrom - Source object to copy properties from
 * @param keysToKeep - Array of property keys to copy
 * @returns New object with properties from allowed keys that are not null/undefined/''
 */
export function shallowCopyObjProperties(copyFrom: any, keysToKeep: string[]) {
  return Object.keys(copyFrom)
    .filter(key => keysToKeep.includes(key))
    .reduce((acc: any, key: string) => {
      const value = copyFrom[key];
      // Skip only null, undefined and empty strings
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
}

/**
 * Reverses a string
 * @param str - Input string to reverse
 * @returns Reversed string
 */
export function reverseString(str: string): string {
  return str.split("").reverse().join("");
}

/**
 * Compares two string arrays ignoring element order
 * @param a - First string array
 * @param b - Second string array
 * @returns True if arrays contain the same elements (order-independent)
 */
export function areStringListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, index) => val === sortedB[index]);
}

/**
 * Checks if an object has any enumerable properties
 * @param obj - Object to check
 * @returns True if object has at least one enumerable property
 * 
 * @example
 * hasProperty({}) // false
 * hasProperty({a: 1}) // true
 * hasProperty(null) // false
 */
export function hasProperty(obj: object): boolean {
  return !!obj && Object.keys(obj).length > 0;
}

export function removeInvalid<T>(
  obj: T,
  isValid: (value: any) => boolean,
): any {
  // Handle null/undefined according to validation first
  if (obj === null || obj === undefined) {
    return isValid(obj) ? obj : undefined;
  }

  // Process arrays by recursively cleaning and filtering invalid elements
  if (Array.isArray(obj)) {
    const processedArray = (obj as any[])
      .map(item => removeInvalid(item, isValid))
      .filter(item => item !== undefined);
    return isValid(processedArray) ? processedArray : undefined;
  }

  // Process objects by recursively cleaning properties
  if (typeof obj === 'object') {
    const processedObject = Object.entries(obj).reduce((acc, [key, value]) => {
      const processedValue = removeInvalid(value, isValid);
      if (processedValue !== undefined) {
        acc[key] = processedValue;
      }
      return acc;
    }, {} as Record<string, any>);
    return isValid(processedObject) ? processedObject : undefined;
  }

  // Handle primitive values directly
  return isValid(obj) ? obj : undefined;
}

/**
 * Recursively removes values from objects and arrays that fail the validation function
 * @param obj - Input value to clean
 * @param isValid - Synchronous validation function (returns true to keep the value)
 * @returns New object/array with invalid values removed
 */
export function removeNulls<T>(obj: T): any {
  return removeInvalid(obj, v => v !== null && v !== undefined);
}


// /**
//  * Checks if a value is a plain JS object (not array, date, etc.)
//  * @param value - Value to check
//  * @returns True if plain object
//  */
// function isPlainObject(value: unknown): boolean {
//   return Object.prototype.toString.call(value) === '[object Object]';
// }

/**
 * Deep merges two objects with customizable array merging based on an identifier key
 * @param baseObject - Primary object providing base structure
 * @param overrideObject - Secondary object providing overrides
 * @param arrayItemIdKey - Key used to identify objects for array merging (default: 'id')
 * @returns Merged result with enhanced array merging capabilities
 * 
 * ## Enhanced Array Merging Rules
 * - For arrays of objects with identifier key: Merges items by matching identifier
 * - For primitive arrays: Concatenates items
 * - Mixed arrays: Concatenates (preserving all items)
 * 
 * ## Standard Merging Rules
 * - If either is null/undefined: Returns non-null object
 * - Both plain objects: Recursively merges
 * - One array + one non-array: Throws error
 * - Others: OverrideObject takes precedence
 */
export function deepMergeObjects(
  baseObject: any,
  overrideObject: any,
  arrayItemIdKey: string = 'id'
): any {
  // Handle nullish base cases
  if (baseObject == null) return overrideObject;
  if (overrideObject == null) return baseObject;

  // Smart array merging
  if (Array.isArray(baseObject) && Array.isArray(overrideObject)) {
    return mergeArrays(baseObject, overrideObject, arrayItemIdKey);
  }

  // Enforce consistent array merging
  if (Array.isArray(baseObject) || Array.isArray(overrideObject)) {
    throw new Error("Cannot merge array with non-array");
  }

  // Recursively merge plain objects
  if (isPlainObject(baseObject) && isPlainObject(overrideObject)) {
    const result: Record<string, any> = { ...baseObject };
    for (const key in overrideObject) {
      if (Object.hasOwnProperty.call(overrideObject, key)) {
        result[key] = deepMergeObjects(
          baseObject[key], 
          overrideObject[key], 
          arrayItemIdKey
        );
      }
    }
    return result;
  }

  // Default: overrideObject takes precedence
  return overrideObject;
}

// Helper function to determine if all array items are objects with a specific key
function areAllObjectsWithKey(arr: any[], key: string): boolean {
  if (arr.length === 0) return false;
  return arr.every(item => 
    item != null && 
    typeof item === 'object' && 
    key in item
  );
}

function hasUniqueKeyValues(arr: any[], key: string): boolean {
  const valueMap = new Set();
  for (const item of arr) {
    const value = item[key];
    if (valueMap.has(value)) {
      return false;
    }
    valueMap.add(value);
  }
  return true;
}

// Implementation of advanced array merging logic
function mergeArrays(baseArray: any[], overrideArray: any[], idKey: string): any[] {
  // Create initial combined array
  const combined = [...baseArray];
  
  // Only process key-based merging if both arrays contain objects with the key
  const shouldMergeByKey =     
    areAllObjectsWithKey(baseArray, idKey) && 
    areAllObjectsWithKey(overrideArray, idKey) &&
    hasUniqueKeyValues(baseArray, idKey) &&
    hasUniqueKeyValues(overrideArray, idKey);
  
  if (shouldMergeByKey) {
    const itemMap = new Map();
    
    // Create lookup map of base objects
    baseArray.forEach(item => itemMap.set(item[idKey], item));
    
    // Process override objects
    for (const overrideItem of overrideArray) {
      const keyValue = overrideItem[idKey];
      const baseItem = itemMap.get(keyValue);

      if (baseItem) {
        // Merge matched objects recursively
        itemMap.set(
          keyValue, 
          deepMergeObjects(baseItem, overrideItem, idKey)
        );
      } else {
        // Add new object to the map and combined array
        itemMap.set(keyValue, overrideItem);
        combined.push(overrideItem);
      }
    }
    
    // Assemble final array by replacing merged versions of existing items
    return combined.map(item => (itemMap.get(item[idKey]) || item));
  }
  
  // Default merging for primitive or non-uniform arrays
  return [...baseArray, ...overrideArray];
}

// Helper function to check for plain objects
function isPlainObject(obj: any): boolean {
  return obj != null && 
         typeof obj === 'object' && 
         !Array.isArray(obj) &&
         obj.constructor === Object;
}
