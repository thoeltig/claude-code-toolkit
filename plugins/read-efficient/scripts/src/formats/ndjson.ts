export function isValidNdjson(content: string): boolean {
    return content.trim().length > 0;
}

export function parseNdjson(content: string): any[] {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const result: any[] = [];

    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            result.push(parsed);
        } catch (err) {
            result.push({
                error: 'Invalid JSON in line',
                raw: line
            });
        }
    }

    return result;
}

export function formatNdjson(rawContent: string, options: { minify: boolean }): string {
    try {
        const data = parseNdjson(rawContent);

        if (data.length === 0) {
            return '[]';
        }

        if (options.minify) {
            return JSON.stringify(data);
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (err) {
        return JSON.stringify({ error: `Failed to format NDJSON: ${err}`, content: rawContent });
    }
}
