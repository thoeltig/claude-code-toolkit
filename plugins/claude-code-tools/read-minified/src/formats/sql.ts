export function formatSql(rawContent: string, options: { minify: boolean }): string {
    try {
        const statements = parseSqlStatements(rawContent);
        if (statements.length === 0) return minifyJson([]);

        const grouped = groupByTableAndAction(statements);

        // If no results, return empty
        if (grouped.length === 0) return minifyJson([]);

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
            } else if (group.action === 'UPDATE') {
                const output: any = {
                    table: group.table,
                    action: 'UPDATE',
                    statementIndex: group.startIndex
                };
                if (group.updates) output.updates = group.updates;
                if (group.where) output.where = group.where;
                return output;
            } else if (group.action === 'DELETE') {
                const output: any = {
                    table: group.table,
                    action: 'DELETE',
                    statementIndex: group.startIndex
                };
                if (group.where) output.where = group.where;
                return output;
            } else if (group.action === 'CREATE') {
                return {
                    table: group.table,
                    action: 'CREATE',
                    schema: group.schema,
                    statementIndex: group.startIndex
                };
            } else if (group.action === 'SELECT') {
                const output: any = {
                    table: group.table,
                    action: 'SELECT',
                    statementIndex: group.startIndex
                };
                if (group.columns) output.columns = group.columns;
                if (group.where) output.where = group.where;
                return output;
            } else if (group.action === 'TRUNCATE') {
                return {
                    table: group.table,
                    action: 'TRUNCATE',
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
    type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'UNKNOWN';
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
    columns?: string[] | '*';  // For INSERT and SELECT. '*' means all columns (no mapping)
    rows?: any[];        // For INSERT
    rowCount?: number;   // For INSERT
    schema?: CreateTableData;  // For CREATE
    updates?: Array<{column: string; value: string}>;  // For UPDATE
    where?: string;      // For UPDATE and DELETE and SELECT
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
            // Don't override table - we already have it from extractTableName
        } else if (type === 'UPDATE') {
            parsed = parseUpdateStatement(raw);
            // Table already extracted from regex
        } else if (type === 'DELETE') {
            parsed = parseDeleteStatement(raw);
            // Table already extracted from regex
        } else if (type === 'SELECT') {
            parsed = parseSelectStatement(raw);
            // Table already extracted from regex
        } else if (type === 'TRUNCATE') {
            parsed = parseTruncateStatement(raw);
            // Table already extracted from regex
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
                current += char;
            } else if (char === quoteChar) {
                if (nextChar === quoteChar) {
                    // SQL escape: '' or "" - add both quotes and skip next char
                    current += char + char;
                    i++;
                } else {
                    // End of quoted string
                    inQuotes = false;
                    current += char;
                }
            } else {
                current += char;
            }
        } else {
            current += char;
        }

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

function detectStatementType(sql: string): 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'UNKNOWN' {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('CREATE TABLE')) return 'CREATE';
    if (trimmed.startsWith('INSERT INTO')) return 'INSERT';
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('TRUNCATE')) return 'TRUNCATE';

    return 'UNKNOWN';
}

function extractTableName(sql: string, type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'UNKNOWN'): string {
    const trimmed = sql.trim();

    if (type === 'CREATE') {
        const match = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'INSERT') {
        const match = /INSERT\s+INTO\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'SELECT') {
        // Extract table from SELECT ... FROM table_name
        const match = /FROM\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'UPDATE') {
        const match = /UPDATE\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'DELETE') {
        const match = /DELETE\s+FROM\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'TRUNCATE') {
        // TRUNCATE TABLE name or TRUNCATE name
        const match = /TRUNCATE\s+(?:TABLE\s+)?(\w+)/i.exec(trimmed);
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
        const lines = smartSplit(content);

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

function smartSplit(content: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
        } else if (char === ',' && depth === 0) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim().length > 0) {
        result.push(current.trim());
    }

    return result;
}

function parseColumnDefinition(def: string): ColumnDefinition | null {
    const trimmed = def.trim();
    if (!trimmed) return null;

    // Extract name (first word)
    const nameMatch = trimmed.match(/^(\w+)\s+/);
    if (!nameMatch) return null;

    const name = nameMatch[1];
    let rest = trimmed.substring(nameMatch[0].length).trim();

    // Extract type (can include parentheses like VARCHAR(255) or DECIMAL(10,2))
    let type = '';
    let i = 0;
    let parenDepth = 0;

    while (i < rest.length) {
        const char = rest[i];
        if (char === '(') {
            parenDepth++;
        } else if (char === ')') {
            parenDepth--;
        } else if (char === ' ' && parenDepth === 0) {
            break;
        }
        type += char;
        i++;
    }

    if (!type) return null;

    rest = rest.substring(i).trim();

    // Parse constraints
    const constraints: string[] = [];
    let defaultValue: string | undefined;

    while (rest.length > 0) {
        const upper = rest.toUpperCase();

        if (upper.startsWith('PRIMARY KEY')) {
            constraints.push('PRIMARY KEY');
            rest = rest.substring(11).trim();
        } else if (upper.startsWith('NOT NULL')) {
            constraints.push('NOT NULL');
            rest = rest.substring(8).trim();
        } else if (upper.startsWith('UNIQUE')) {
            constraints.push('UNIQUE');
            rest = rest.substring(6).trim();
        } else if (upper.startsWith('DEFAULT')) {
            rest = rest.substring(7).trim();
            const defMatch = rest.match(/^'([^']*)'|^(\w+)|^(\d+\.?\d*)/);
            if (defMatch) {
                defaultValue = defMatch[0];
                rest = rest.substring(defMatch[0].length).trim();
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return {
        name,
        type,
        constraints,
        ...(defaultValue && { default: defaultValue })
    };
}

function parseInsertStatement(sql: string): { table: string; columns: string[] | '*'; rows: any[] } | null {
    // Try to match INSERT with explicit columns first
    const insertWithColumnsRegex = /INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*(.*?)$/is;
    let match = insertWithColumnsRegex.exec(sql);

    if (match) {
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

    // Try to match INSERT without explicit columns
    const insertWithoutColumnsRegex = /INSERT\s+INTO\s+(\w+)\s+VALUES\s+(.*?)$/is;
    match = insertWithoutColumnsRegex.exec(sql);

    if (match) {
        const table = match[1];
        const valuesStr = match[2];

        // Parse as arrays (no column mapping)
        const rows = parseValuesAsArrays(valuesStr);

        return {
            table,
            columns: '*',  // Mark as "all columns, mapping unknown"
            rows
        };
    }

    return null;
}

function parseUpdateStatement(sql: string): { table: string; updates?: Array<{column: string; value: string}>; where?: string } | null {
    // Extract table name and SET clause
    const tableMatch = /UPDATE\s+(\w+)\s+SET/i.exec(sql);
    if (!tableMatch) return null;

    const table = tableMatch[1];

    // Extract SET clause (everything between SET and WHERE or end)
    const setMatch = /SET\s+([\s\S]*?)(?:\s+WHERE\s+([\s\S]*))?$/i.exec(sql);
    if (!setMatch) return null;

    let setClause = setMatch[1].trim();
    let whereClause = setMatch[2] ? setMatch[2].trim() : undefined;

    // Normalize whitespace in SET clause
    setClause = setClause.replace(/\s+/g, ' ');

    const updates: Array<{column: string; value: string}> = [];

    // Parse SET column = value pairs
    const setParts = smartSplit(setClause);
    for (const part of setParts) {
        const eqIndex = part.indexOf('=');
        if (eqIndex > -1) {
            const column = part.substring(0, eqIndex).trim();
            const value = part.substring(eqIndex + 1).trim();
            updates.push({ column, value });
        }
    }

    return {
        table,
        ...(updates.length > 0 && { updates }),
        ...(whereClause && { where: whereClause })
    };
}

function parseDeleteStatement(sql: string): { table: string; where?: string } | null {
    // Handle standard DELETE FROM syntax
    const deleteMatch = /DELETE\s+FROM\s+(\w+)/i.exec(sql);
    if (deleteMatch) {
        const table = deleteMatch[1];
        const whereMatch = /WHERE\s+([\s\S]*)$/i.exec(sql);
        return {
            table,
            ...(whereMatch && { where: whereMatch[1].trim() })
        };
    }

    // Try MySQL syntax: DELETE alias FROM table WHERE ...
    const mysqlMatch = /DELETE\s+(\w+)\s+FROM\s+(\w+)/i.exec(sql);
    if (mysqlMatch) {
        const table = mysqlMatch[2];
        const whereMatch = /WHERE\s+([\s\S]*)$/i.exec(sql);
        return {
            table,
            ...(whereMatch && { where: whereMatch[1].trim() })
        };
    }

    return null;
}

function parseSelectStatement(sql: string): { table: string; columns?: string[]; where?: string } | null {
    // Extract table name from FROM clause
    const fromMatch = /FROM\s+(\w+)/i.exec(sql);
    if (!fromMatch) return null;

    const table = fromMatch[1];

    // Extract columns from SELECT clause
    const selectMatch = /SELECT\s+([\s\S]*?)\s+FROM/i.exec(sql);
    let columns: string[] = [];
    if (selectMatch) {
        const columnStr = selectMatch[1].trim();
        if (columnStr !== '*') {
            columns = columnStr
                .split(',')
                .map(col => col.trim())
                .filter(col => col.length > 0 && !col.includes('('));  // Exclude functions for now
        }
    }

    // Extract WHERE clause
    const whereMatch = /WHERE\s+([\s\S]*)$/i.exec(sql);
    let where: string | undefined;
    if (whereMatch) {
        where = whereMatch[1].trim();
    }

    return {
        table,
        ...(columns.length > 0 && { columns }),
        ...(where && { where })
    };
}

function parseTruncateStatement(sql: string): { table: string } | null {
    // TRUNCATE TABLE name or TRUNCATE name
    const match = /TRUNCATE\s+(?:TABLE\s+)?(\w+)/i.exec(sql);
    if (!match) return null;

    const table = match[1];

    return {
        table
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
    let quoteChar = '';

    for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        const nextChar = i + 1 < valuesStr.length ? valuesStr[i + 1] : '';

        if ((char === '\'' || char === '"') && !(i > 0 && valuesStr[i - 1] === '\\')) {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
                current += char;
            } else if (char === quoteChar) {
                if (nextChar === quoteChar) {
                    // SQL escape: '' or "" represents literal quote
                    current += char + quoteChar;
                    i++;
                } else {
                    // End of quoted string
                    inQuotes = false;
                    quoteChar = '';
                    current += char;
                }
            } else {
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

function parseValuesAsArrays(valuesStr: string): any[] {
    const rows: any[] = [];
    const rowStrings = parseValueRows(valuesStr);

    for (const rowStr of rowStrings) {
        const values = parseRowValues(rowStr);
        if (values.length > 0) {
            rows.push(values);
        }
    }

    return rows;
}

function groupByTableAndAction(statements: SqlStatement[]): GroupedStatement[] {
    const result: GroupedStatement[] = [];

    for (const stmt of statements) {
        if (stmt.type === 'UNKNOWN') continue;

        const action = stmt.type;
        const lastGroup = result.length > 0 ? result[result.length - 1] : null;

        // Group consecutive statements with same table AND same action
        // For INSERT: only group if columns structure is compatible
        const canGroup = action === 'INSERT' ?
            areInsertColumnsCompatible(lastGroup?.columns, stmt.parsed?.columns) :
            true;

        if (lastGroup && lastGroup.table === stmt.table && lastGroup.action === action && canGroup) {
            lastGroup.statements.push(stmt);

            if (action === 'INSERT' && stmt.parsed) {
                if (!lastGroup.columns) lastGroup.columns = stmt.parsed.columns;
                if (!lastGroup.rows) lastGroup.rows = [];
                lastGroup.rows.push(...stmt.parsed.rows);
                lastGroup.rowCount = lastGroup.rows.length;
            } else if (action === 'UPDATE' && stmt.parsed) {
                if (!lastGroup.updates) lastGroup.updates = stmt.parsed.updates;
                if (!lastGroup.where) lastGroup.where = stmt.parsed.where;
            } else if (action === 'DELETE' && stmt.parsed) {
                if (!lastGroup.where) lastGroup.where = stmt.parsed.where;
            } else if (action === 'SELECT' && stmt.parsed) {
                if (!lastGroup.columns) lastGroup.columns = stmt.parsed.columns;
                if (!lastGroup.where) lastGroup.where = stmt.parsed.where;
            } else if (action === 'TRUNCATE' && stmt.parsed) {
                // TRUNCATE has no additional data to merge
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
            } else if (action === 'UPDATE' && stmt.parsed) {
                group.updates = stmt.parsed.updates;
                group.where = stmt.parsed.where;
            } else if (action === 'DELETE' && stmt.parsed) {
                group.where = stmt.parsed.where;
            } else if (action === 'SELECT' && stmt.parsed) {
                group.columns = stmt.parsed.columns;
                group.where = stmt.parsed.where;
            } else if (action === 'TRUNCATE' && stmt.parsed) {
                // TRUNCATE has no additional data
            }

            result.push(group);
        }
    }

    return result;
}

function areInsertColumnsCompatible(groupColumns: string[] | '*' | undefined, stmtColumns: string[] | '*' | undefined): boolean {
    // If group doesn't have columns yet, it's compatible
    if (!groupColumns) return true;
    // If both are '*', compatible
    if (groupColumns === '*' && stmtColumns === '*') return true;
    // If both are arrays, compatible (can merge rows with same columns)
    if (Array.isArray(groupColumns) && Array.isArray(stmtColumns)) return true;
    // Different types: '*' vs array, not compatible
    return false;
}

function minifyJson(obj: any): string {
    return JSON.stringify(obj);
}
