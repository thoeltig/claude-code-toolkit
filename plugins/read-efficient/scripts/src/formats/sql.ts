import { Parser } from 'node-sql-parser';

export function isValidSql(content: string): boolean {
    return content.trim().length > 0;
}

export function formatSql(rawContent: string, options: { minify: boolean }): string {
    try {
        const parser = new Parser();

        // Try to parse as complete SQL
        try {
            const ast = parser.astify(rawContent.trim(), { database: 'MySQL' });
            const statements = Array.isArray(ast) ? ast : [ast];

            if (options.minify) {
                return JSON.stringify(statements);
            } else {
                return JSON.stringify(statements, null, 2);
            }
        } catch (parseErr) {
            // Fallback: try splitting by semicolon and parse individually
            const parts = rawContent.split(';').filter(s => s.trim());
            const results = parts.map(part => {
                try {
                    return parser.astify(part.trim(), { database: 'MySQL' });
                } catch (err) {
                    return { error: `Failed to parse: ${part.trim().substring(0, 50)}` };
                }
            });

            // Flatten any nested arrays
            const flat = results.flatMap(r => Array.isArray(r) ? r : [r]);

            if (options.minify) {
                return JSON.stringify(flat);
            } else {
                return JSON.stringify(flat, null, 2);
            }
        }
    } catch (err) {
        return JSON.stringify({
            error: `Failed to parse SQL: ${err}`,
            content: rawContent.substring(0, 200)
        });
    }
}
