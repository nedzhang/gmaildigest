
/**
 * Shallow copy an object and only keep the properties specified in keysToKeep.
 * If the property value is undefined or null or '' (basically !value), it will not be copied.
 * @param copyFrom 
 * @param keysToKeep 
 * @returns 
 */
export function shallowCopyObjProperties(copyFrom: any, keysToKeep: string[]) {
  return Object.keys(copyFrom)
    .filter(key => keysToKeep.includes(key))
    .reduce((acc: any, key: string) => {
      if (copyFrom[key]) {
        acc[key] = copyFrom[key];
      }
      return acc;
    }, {});
}

export function reverseString(numString: string): string {
  const reversedString = numString.split("").reverse().join("");
  return reversedString;
}


export function areStringListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((val, index) => val === sortedB[index]);
}

export function hasProperty(obj: object): boolean {

  return !!obj && !(Object.keys(obj).length === 0);
}


/**
 * remove fields that are null from the object to simplify the zod parsing process
 * @param obj 
 * @returns 
 */
export function removeNulls(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(removeNulls).filter(val => val !== undefined);
  }

  // Handle objects
  if (typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const value = removeNulls(obj[key]);
      return value === undefined ? acc : { ...acc, [key]: value };
    }, {});
  }

  return obj;
}
