export function isValidIni(content: string): boolean {
    return content.trim().length > 0;
}

export function parseIni(content: string): any {
    const lines = content.split('\n');
    const result: any = {};
    let currentSection = null;

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
            continue;
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            currentSection = trimmed.substring(1, trimmed.length - 1).trim();
            if (currentSection) {
                result[currentSection] = {};
            }
            continue;
        }

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > 0) {
            const key = trimmed.substring(0, equalsIndex).trim();
            const value = trimmed.substring(equalsIndex + 1).trim();

            if (key && value) {
                if (currentSection && result[currentSection]) {
                    result[currentSection][key] = value;
                } else {
                    result[key] = value;
                }
            }
        }
    }

    return result;
}

export function formatIni(rawContent: string, options: { minify: boolean }): string {
    try {
        const data = parseIni(rawContent);
        if (options.minify) {
            return JSON.stringify(data);
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (err) {
        return JSON.stringify({ error: `Failed to format INI: ${err}`, content: rawContent });
    }
}
