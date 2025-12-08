export function formatSql(rawContent: string, options: { minify: boolean }): string {
    try {
        const statements = parseSqlInserts(rawContent);

        if (statements.length === 0) return minifyJson([]);

        const result = statements.map(stmt => ({
            table: stmt.table,
            action: 'INSERT',
            columns: stmt.columns,
            rows: stmt.rows,
            rowCount: stmt.rows.length
        }));

        return options.minify ? minifyJson(result) : JSON.stringify(result, null, 2);
    } catch (err) {
        return minifyJson({ error: `Failed to parse SQL: ${err}`, content: rawContent });
    }
}

interface SqlInsert {
    table: string;
    columns: string[];
    rows: any[];
}

function parseSqlInserts(content: string): SqlInsert[] {
    const statements: SqlInsert[] = [];

    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*(.*?)(?:;|$)/gis;
    let match;

    while ((match = insertRegex.exec(content)) !== null) {
        const tableName = match[1];
        const columnsStr = match[2];
        const valuesStr = match[3];

        const columns = parseColumns(columnsStr);
        const rows = parseValues(valuesStr, columns);

        statements.push({
            table: tableName,
            columns,
            rows
        });
    }

    return statements;
}

function parseColumns(columnsStr: string): string[] {
    return columnsStr.split(',').map(col => col.trim()).filter(col => col.length > 0);
}

function parseValues(valuesStr: string, columns: string[]): any[] {
    const rows: any[] = [];
    const rowStrings = parseValueRows(valuesStr);

    for (const rowStr of rowStrings) {
        const values = parseRowValues(rowStr);
        if (values.length > 0) {
            const row: any = {};
            for (let i = 0; i < columns.length; i++) {
                if (i < values.length && values[i] !== null) {
                    row[columns[i]] = values[i];
                }
            }
            rows.push(row);
        }
    }

    return rows;
}

function parseValueRows(valuesStr: string): string[] {
    const rows: string[] = [];
    let current = '';
    let depth = 0;
    let inQuotes = false;

    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];

        if (char === '\'' || char === '"') {
            if (i > 0 && valuesStr[i - 1] === '\\') {
                current += char;
            } else {
                inQuotes = !inQuotes;
                current += char;
            }
        } else if (char === '(' && !inQuotes) {
            depth++;
            current += char;
        } else if (char === ')' && !inQuotes) {
            depth--;
            current += char;
            if (depth === 0) {
                const trimmed = current.trim();
                if (trimmed.length > 0) {
                    rows.push(trimmed);
                }
                current = '';
            }
        } else if (char === ',' && depth === 0 && !inQuotes) {
            continue;
        } else {
            current += char;
        }
    }

    return rows;
}

function parseRowValues(rowStr: string): any[] {
    const values: any[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let quotedValue = '';
    let wasQuoted = false;

    rowStr = rowStr.trim();
    if (rowStr.startsWith('(') && rowStr.endsWith(')')) {
        rowStr = rowStr.slice(1, -1);
    }

    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        const nextChar = i + 1 < rowStr.length ? rowStr[i + 1] : '';

        if ((char === '\'' || char === '"') && (i === 0 || rowStr[i - 1] !== '\\')) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
                quotedValue = '';
                current = '';
                wasQuoted = true;
            } else if (char === quoteChar) {
                if (nextChar === quoteChar) {
                    quotedValue += char;
                    i++;
                } else {
                    inQuotes = false;
                    current = quotedValue;
                    quoteChar = '';
                }
            } else {
                quotedValue += char;
            }
        } else if (char === ',' && !inQuotes) {
            const value = wasQuoted ? current : parseValue(current.trim());
            values.push(value);
            current = '';
            wasQuoted = false;
        } else if (inQuotes) {
            quotedValue += char;
        } else {
            current += char;
        }
    }

    if (current.trim().length > 0 || inQuotes) {
        const value = wasQuoted ? current : parseValue(current.trim());
        values.push(value);
    }

    return values;
}

function parseValue(val: string): any {
    if (!val) {
        return null;
    }

    const trimmed = val.trim();

    if (trimmed.toLowerCase() === 'null') {
        return null;
    }

    if (trimmed.toLowerCase() === 'true') {
        return true;
    }

    if (trimmed.toLowerCase() === 'false') {
        return false;
    }

    if (!isNaN(parseFloat(trimmed)) && isFinite(Number(trimmed))) {
        return parseFloat(trimmed);
    }

    return val;
}

function minifyJson(obj: any): string {
    return JSON.stringify(obj);
}
