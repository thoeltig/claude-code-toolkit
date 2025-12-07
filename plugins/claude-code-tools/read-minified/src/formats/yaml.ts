export function isValidYaml(content: string): boolean {
    return content.trim().length > 0;
}

export function parseYaml(content: string): any {
    try {
        const lines = content.split('\n');
        const baseIndent = 0;
        return parseYamlLines(lines, 0, baseIndent, lines.length).value;
    } catch (err) {
        return { error: `Failed to parse YAML: ${err}`, content };
    }
}

interface ParseResult {
    value: any;
    nextIndex: number;
}

function parseYamlLines(lines: string[], startIndex: number, baseIndent: number, endIndex: number): ParseResult {
    const result: any = {};
    let i = startIndex;

    while (i < endIndex) {
        const line = lines[i];
        const trimmed = line.trim();
        const indent = getIndentation(line);

        if (!trimmed || trimmed.startsWith('#')) {
            i++;
            continue;
        }

        if (indent < baseIndent) {
            return { value: result, nextIndex: i };
        }

        if (indent > baseIndent) {
            i++;
            continue;
        }

        if (trimmed.startsWith('- ')) {
            const listName = getLastKey(result);
            if (listName && Array.isArray(result[listName])) {
                const itemValue = trimmed.substring(2).trim();
                result[listName].push(itemValue);
            }
            i++;
        } else if (trimmed.includes(':')) {
            const colonIndex = trimmed.indexOf(':');
            const key = trimmed.substring(0, colonIndex).trim();
            let value = trimmed.substring(colonIndex + 1).trim();

            if (!key) {
                i++;
                continue;
            }

            if (value === '' && i + 1 < endIndex) {
                const nextLine = lines[i + 1];
                const nextIndent = getIndentation(nextLine);
                const nextTrimmed = nextLine.trim();

                if (nextIndent > baseIndent && nextTrimmed && !nextTrimmed.startsWith('#')) {
                    const nestedResult = parseYamlLines(lines, i + 1, indent + 2, endIndex);
                    result[key] = nestedResult.value;
                    i = nestedResult.nextIndex;
                } else if (nextTrimmed.startsWith('- ')) {
                    result[key] = [];
                    i++;
                } else {
                    result[key] = null;
                    i++;
                }
            } else {
                result[key] = value || null;
                i++;
            }
        } else {
            i++;
        }
    }

    return { value: result, nextIndex: endIndex };
}

function getIndentation(line: string): number {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') count++;
        else if (line[i] === '\t') count += 2;
        else break;
    }
    return count;
}

function getLastKey(obj: any): string | null {
    const keys = Object.keys(obj);
    return keys.length > 0 ? keys[keys.length - 1] : null;
}

export function formatYaml(rawContent: string, options: { minify: boolean }): string {
    try {
        const data = parseYaml(rawContent);
        if (options.minify) {
            return JSON.stringify(data);
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (err) {
        return JSON.stringify({ error: `Failed to format YAML: ${err}`, content: rawContent });
    }
}
