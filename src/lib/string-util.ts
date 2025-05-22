

export function decodeUnicodeEscapes(input: string): string {

    return input.replace(/\\u([\da-fA-F]{4})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

}