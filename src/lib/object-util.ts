export function shallowCopyObjProperties(copyFrom: any, keysToKeep: string[]) {
    return Object.keys(copyFrom)
        .filter(key => keysToKeep.includes(key))
        .reduce((acc: any, key: string) => {
            acc[key] = copyFrom[key];
            return acc;
        }, {});
}

export function reverseString(numString: string): string {
    const reversedString = numString.split("").reverse().join("");
    return reversedString;
}