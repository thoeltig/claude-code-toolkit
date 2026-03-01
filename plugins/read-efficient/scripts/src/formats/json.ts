export function isValidJson(content: string): boolean {
    try {
        JSON.parse(content);
        return true;
    } catch {
        return false;
    }
}

export function parseJson(content: string): any {
    return JSON.parse(content);
}

export function minifyJson(input: string | any): string {
    const obj = typeof input === 'string' ? JSON.parse(input) : input;
    return JSON.stringify(obj);
}

export function formatJson(rawContent: string, options: { minify: boolean }): string {
    if (!isValidJson(rawContent)) {
        throw new Error('Invalid JSON: unable to parse content');
    } try {
        const parsed = parseJson(rawContent);
        if (options.minify) {
            return minifyJson(parsed);
        } 

        return JSON.stringify(parsed);
    } catch (err) {
        throw new Error(`Failed to format JSON: ${err}`);
    }
};
