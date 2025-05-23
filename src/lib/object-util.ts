
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
