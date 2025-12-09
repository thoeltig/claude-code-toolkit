export function formatSql(rawContent: string, options: { minify: boolean }): string {
    try {
        const statements = parseSqlStatements(rawContent);
        if (statements.length === 0) return minifyJson([]);

        const grouped = groupByTableAndAction(statements);
        const result = grouped.map(group => {
            if (group.action === 'INSERT') {
                return {
                    table: group.table,
                    action: 'INSERT',
                    columns: group.columns,
                    rows: group.rows,
                    rowCount: group.rowCount,
                    statementIndex: group.startIndex
                };
            } else if (group.action === 'CREATE') {
                return {
                    table: group.table,
                    action: 'CREATE',
                    schema: group.schema,
                    statementIndex: group.startIndex
                };
            }
            return null;
        }).filter((item: any) => item !== null);

        return options.minify ? minifyJson(result) : JSON.stringify(result, null, 2);
    } catch (err) {
        return minifyJson({ error: `Failed to parse SQL: ${err}`, content: rawContent });
    }
}

interface SqlStatement {
    type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'UNKNOWN';
    table: string;
    raw: string;
    statementIndex: number;
    parsed: any;
}

interface ColumnDefinition {
    name: string;
    type: string;
    constraints: string[];
    default?: string;
}

interface CreateTableData {
    columns: ColumnDefinition[];
    tableConstraints?: string[];
}

interface GroupedStatement {
    table: string;
    action: string;
    statements: SqlStatement[];
    startIndex: number;
    columns?: string[];
    rows?: any[];
    rowCount?: number;
    schema?: CreateTableData;
}

function parseSqlStatements(content: string): SqlStatement[] {
    const statements: SqlStatement[] = [];
    const cleaned = removeComments(content);
    const sqlStatements = splitSqlStatements(cleaned);

    for (let i = 0; i < sqlStatements.length; i++) {
        const raw = sqlStatements[i].trim();
        if (raw.length === 0) continue;

        const type = detectStatementType(raw);
        let table = extractTableName(raw, type);
        let parsed: any = null;

        if (type === 'INSERT') {
            parsed = parseInsertStatement(raw);
            if (parsed) {
                table = parsed.table;
            }
        } else if (type === 'CREATE') {
            parsed = parseCreateTableStatement(raw);
            if (parsed) {
                table = parsed.table;
            }
        }

        if (table) {
            statements.push({
                type,
                table,
                raw,
                statementIndex: statements.length,
                parsed
            });
        }
    }

    return statements;
}

function removeComments(content: string): string {
    let result = '';
    let i = 0;
    let inQuotes = false;
    let quoteChar = '';

    while (i < content.length) {
        const char = content[i];
        const nextChar = i + 1 < content.length ? content[i + 1] : '';

        if ((char === '"' || char === "'") && (i === 0 || content[i - 1] !== '\\')) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
                result += char;
            } else if (char === quoteChar) {
                inQuotes = false;
                result += char;
            } else {
                result += char;
            }
        } else if (!inQuotes && char === '-' && nextChar === '-') {
            i = content.indexOf('\n', i);
            if (i === -1) break;
        } else if (!inQuotes && char === '/' && nextChar === '*') {
            const endComment = content.indexOf('*/', i + 2);
            if (endComment === -1) {
                i = content.length;
            } else {
                i = endComment + 1;
            }
        } else {
            result += char;
        }
        i++;
    }

    return result;
}

function splitSqlStatements(content: string): string[] {
    const statements: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = i + 1 < content.length ? content[i + 1] : '';

        if ((char === '"' || char === "'") && (i === 0 || content[i - 1] !== '\\')) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                if (nextChar === quoteChar) {
                    current += char + char;
                    i++;
                } else {
                    inQuotes = false;
                }
            }
        }

        current += char;

        if (char === ';' && !inQuotes) {
            statements.push(current.slice(0, -1));
            current = '';
        }
    }

    if (current.trim().length > 0) {
        statements.push(current);
    }

    return statements;
}

function detectStatementType(sql: string): 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'UNKNOWN' {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('CREATE TABLE')) return 'CREATE';
    if (trimmed.startsWith('INSERT INTO')) return 'INSERT';
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';

    return 'UNKNOWN';
}

function extractTableName(sql: string, type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'UNKNOWN'): string {
    const trimmed = sql.trim();

    if (type === 'CREATE') {
        const match = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'INSERT') {
        const match = /INSERT\s+INTO\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'UPDATE') {
        const match = /UPDATE\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'DELETE') {
        const match = /DELETE\s+FROM\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    }

    return '';
}

function parseCreateTableStatement(sql: string): CreateTableData | null {
    try {
        const parenStart = sql.indexOf('(');
        const parenEnd = sql.lastIndexOf(')');

        if (parenStart === -1 || parenEnd === -1 || parenEnd <= parenStart) {
            return null;
        }

        const content = sql.substring(parenStart + 1, parenEnd);
        const lines = content.split(',').map(line => line.trim());

        const columns: ColumnDefinition[] = [];
        const tableConstraints: string[] = [];

        for (const line of lines) {
            if (line.length === 0) continue;

            const upper = line.toUpperCase();

            if (upper.startsWith('PRIMARY KEY') || upper.startsWith('FOREIGN KEY') ||
                upper.startsWith('CHECK') || upper.startsWith('UNIQUE')) {
                tableConstraints.push(line);
            } else {
                const column = parseColumnDefinition(line);
                if (column) {
                    columns.push(column);
                }
            }
        }

        return {
            columns,
            tableConstraints: tableConstraints.length > 0 ? tableConstraints : undefined
        };
    } catch (err) {
        return null;
    }
}

function parseColumnDefinition(def: string): ColumnDefinition | null {
    const parts = def.trim().split(/\s+/);
    if (parts.length < 2) return null;

    const name = parts[0];
    let type = '';
    const constraints: string[] = [];
    let defaultValue: string | undefined;

    let i = 1;

    while (i < parts.length) {
        const token = parts[i].toUpperCase();

        if (token === 'PRIMARY' && i + 1 < parts.length && parts[i + 1].toUpperCase() === 'KEY') {
            constraints.push('PRIMARY KEY');
            i += 2;
        } else if (token === 'NOT' && i + 1 < parts.length && parts[i + 1].toUpperCase() === 'NULL') {
            constraints.push('NOT NULL');
            i += 2;
        } else if (token === 'UNIQUE') {
            constraints.push('UNIQUE');
            i += 1;
        } else if (token === 'DEFAULT') {
            if (i + 1 < parts.length) {
                const defVal = parts.slice(i + 1).join(' ');
                const match = defVal.match(/^'([^']*)'|^(\w+)|^(\d+\.?\d*)/);
                if (match) {
                    defaultValue = match[0];
                    i = parts.length;
                } else {
                    i += 2;
                }
            } else {
                i += 1;
            }
        } else if (type.length === 0) {
            if (i + 1 < parts.length && parts[i + 1] === '(') {
                const typeStart = parts[i];
                let j = i + 2;
                let typeEnd = '';
                while (j < parts.length && !parts[j].includes(')')) {
                    typeEnd += parts[j] + ' ';
                    j++;
                }
                if (j < parts.length) {
                    typeEnd += parts[j];
                    type = typeStart + '(' + typeEnd;
                    i = j + 1;
                } else {
                    type = parts[i];
                    i += 1;
                }
            } else {
                type = parts[i];
                i += 1;
            }
        } else {
            i += 1;
        }
    }

    return {
        name,
        type,
        constraints,
        ...(defaultValue && { default: defaultValue })
    };
}

function parseInsertStatement(sql: string): { table: string; columns: string[]; rows: any[] } | null {
    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*(.*?)$/is;
    const match = insertRegex.exec(sql);

    if (!match) return null;

    const table = match[1];
    const columnsStr = match[2];
    const valuesStr = match[3];

    const columns = parseColumns(columnsStr);
    const rows = parseValues(valuesStr, columns);

    return {
        table,
        columns,
        rows
    };
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
        const prevChar = i > 0 ? rowStr[i - 1] : '';

        if ((char === '\'' || char === '"') && prevChar !== '\\') {
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

    if (current.length > 0 || wasQuoted) {
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

function groupByTableAndAction(statements: SqlStatement[]): GroupedStatement[] {
    const result: GroupedStatement[] = [];

    for (const stmt of statements) {
        if (stmt.type === 'UNKNOWN') continue;

        const action = stmt.type;
        const lastGroup = result.length > 0 ? result[result.length - 1] : null;

        if (lastGroup && lastGroup.table === stmt.table && lastGroup.action === action) {
            lastGroup.statements.push(stmt);

            if (action === 'INSERT' && stmt.parsed) {
                if (!lastGroup.columns) lastGroup.columns = stmt.parsed.columns;
                if (!lastGroup.rows) lastGroup.rows = [];
                lastGroup.rows.push(...stmt.parsed.rows);
                lastGroup.rowCount = lastGroup.rows.length;
            }
        } else {
            const group: GroupedStatement = {
                table: stmt.table,
                action,
                statements: [stmt],
                startIndex: stmt.statementIndex
            };

            if (action === 'INSERT' && stmt.parsed) {
                group.columns = stmt.parsed.columns;
                group.rows = stmt.parsed.rows;
                group.rowCount = stmt.parsed.rows.length;
            } else if (action === 'CREATE' && stmt.parsed) {
                group.schema = stmt.parsed;
            }

            result.push(group);
        }
    }

    return result;
}

function minifyJson(obj: any): string {
    return JSON.stringify(obj);
}
