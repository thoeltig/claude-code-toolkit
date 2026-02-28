import * as yaml from 'js-yaml';

export function isValidYaml(content: string): boolean {
    return content.trim().length > 0;
}

export function parseYaml(content: string): any {
    try {
        const data = yaml.load(content);
        return data || {};
    } catch (err) {
        return { error: `Failed to parse YAML: ${err}`, content };
    }
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
