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
                const output: any = {
                    action: 'CREATE',
                    objectType: group.objectType,
                    statementIndex: group.startIndex
                };
                if (group.objectType === 'INDEX') {
                    if (group.indexName) output.indexName = group.indexName;
                    if (group.table) output.table = group.table;
                    if (group.columns) output.columns = group.columns;
                    if (group.unique) output.unique = group.unique;
                    if (group.ifNotExists) output.ifNotExists = group.ifNotExists;
                } else if (group.objectType === 'VIEW') {
                    if (group.viewName) output.viewName = group.viewName;
                    if (group.orReplace) output.orReplace = group.orReplace;
                    if (group.ifNotExists) output.ifNotExists = group.ifNotExists;
                } else {
                    // CREATE TABLE
                    output.table = group.table;
                    if (group.schema) output.schema = group.schema;
                }
                return output;
            } else if (group.action === 'SELECT') {
                const output: any = {
                    table: group.table,
                    action: 'SELECT',
                    statementIndex: group.startIndex
                };
                if (group.columns) output.columns = group.columns;
                if (group.columnAliases) output.columnAliases = group.columnAliases;
                if (group.where) output.where = group.where;
                if (group.groupByColumns) output.groupByColumns = group.groupByColumns;
                if (group.havingClause) output.havingClause = group.havingClause;
                if (group.joins) output.joins = group.joins;
                if (group.unionType) output.unionType = group.unionType;
                if (group.caseStatements) output.caseStatements = group.caseStatements;
                if (group.unparsedContent) output.unparsedContent = group.unparsedContent;
                return output;
            } else if (group.action === 'TRUNCATE') {
                return {
                    table: group.table,
                    action: 'TRUNCATE',
                    statementIndex: group.startIndex
                };
            } else if (group.action === 'DROP') {
                const output: any = {
                    action: 'DROP',
                    statementIndex: group.startIndex
                };
                if (group.objectType) output.objectType = group.objectType;
                if (group.objectName) output.objectName = group.objectName;
                if (group.table) output.table = group.table;
                if (group.ifExists) output.ifExists = group.ifExists;
                if (group.cascade) output.cascade = group.cascade;
                if (group.restrict) output.restrict = group.restrict;
                return output;
            } else if (group.action === 'BEGIN') {
                return {
                    action: 'BEGIN',
                    statementIndex: group.startIndex
                };
            } else if (group.action === 'COMMIT') {
                return {
                    action: 'COMMIT',
                    statementIndex: group.startIndex
                };
            } else if (group.action === 'ROLLBACK') {
                const output: any = {
                    action: 'ROLLBACK',
                    statementIndex: group.startIndex
                };
                if (group.toSavepoint) output.toSavepoint = group.toSavepoint;
                if (group.savepointName) output.savepointName = group.savepointName;
                return output;
            } else if (group.action === 'SAVEPOINT') {
                const output: any = {
                    action: 'SAVEPOINT',
                    statementIndex: group.startIndex
                };
                if (group.savepointName) output.savepointName = group.savepointName;
                return output;
            } else if (group.action === 'RELEASE') {
                const output: any = {
                    action: 'RELEASE',
                    statementIndex: group.startIndex
                };
                if (group.savepointName) output.savepointName = group.savepointName;
                return output;
            } else if (group.action === 'GRANT') {
                const output: any = {
                    action: 'GRANT',
                    statementIndex: group.startIndex
                };
                if (group.privileges) output.privileges = group.privileges;
                if (group.objectType) output.objectType = group.objectType;
                if (group.objectName) output.objectName = group.objectName;
                if (group.grantee) output.grantee = group.grantee;
                if (group.grantOption) output.grantOption = group.grantOption;
                return output;
            } else if (group.action === 'REVOKE') {
                const output: any = {
                    action: 'REVOKE',
                    statementIndex: group.startIndex
                };
                if (group.privileges) output.privileges = group.privileges;
                if (group.objectType) output.objectType = group.objectType;
                if (group.objectName) output.objectName = group.objectName;
                if (group.grantee) output.grantee = group.grantee;
                if (group.cascade) output.cascade = group.cascade;
                if (group.restrict) output.restrict = group.restrict;
                return output;
            } else if (group.action === 'ALTER') {
                const output: any = {
                    action: 'ALTER',
                    table: group.table,
                    statementIndex: group.startIndex
                };
                if (group.alterationType) output.alterationType = group.alterationType;
                if (group.columnDefinition) output.columnDefinition = group.columnDefinition;
                if (group.columnName) output.columnName = group.columnName;
                if (group.newColumnName) output.newColumnName = group.newColumnName;
                if (group.constraintName) output.constraintName = group.constraintName;
                if (group.newName) output.newName = group.newName;
                if (group.cascade) output.cascade = group.cascade;
                if (group.restrict) output.restrict = group.restrict;
                return output;
            }
            return null;
        }).filter((item: any) => item !== null);

        return options.minify ? minifyJson(result) : JSON.stringify(result, null, 2);
    } catch (err) {
        return minifyJson({ error: `Failed to parse SQL: ${err}`, content: rawContent });
    }
}

interface SqlStatement {
    type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'DROP' | 'BEGIN' | 'COMMIT' | 'ROLLBACK' | 'SAVEPOINT' | 'RELEASE' | 'GRANT' | 'REVOKE' | 'ALTER' | 'UNKNOWN';
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
    schema?: CreateTableData;  // For CREATE TABLE
    updates?: Array<{column: string; value: string}>;  // For UPDATE
    where?: string;      // For UPDATE and DELETE and SELECT
    objectType?: string;  // For DROP and CREATE (TABLE, INDEX, VIEW)
    objectName?: string;  // For DROP (for INDEX objects)
    ifExists?: boolean;   // For DROP
    cascade?: boolean;    // For DROP
    restrict?: boolean;   // For DROP
    indexName?: string;   // For CREATE INDEX
    unique?: boolean;     // For CREATE INDEX
    ifNotExists?: boolean; // For CREATE INDEX and VIEW
    viewName?: string;    // For CREATE VIEW
    orReplace?: boolean;  // For CREATE VIEW
    savepointName?: string;  // For SAVEPOINT, RELEASE, ROLLBACK TO
    toSavepoint?: boolean;   // For ROLLBACK TO SAVEPOINT
    privileges?: string[];   // For GRANT/REVOKE
    grantee?: string;        // For GRANT/REVOKE
    grantOption?: boolean;   // For GRANT
    alterationType?: string;  // For ALTER (ADD_COLUMN, DROP_COLUMN, MODIFY_COLUMN, etc)
    columnName?: string;      // For ALTER (column being modified/dropped/renamed)
    columnDefinition?: any;   // For ALTER ADD/MODIFY COLUMN
    constraintName?: string;  // For ALTER ADD/DROP CONSTRAINT
    newName?: string;         // For ALTER RENAME TABLE
    newColumnName?: string;   // For ALTER RENAME COLUMN
    unparsedContent?: string; // Fallback: remainder of statement we couldn't parse (zero information loss)
    columnAliases?: Array<{column: string; alias?: string}>; // For SELECT: columns with optional aliases
    groupByColumns?: string[]; // For SELECT: GROUP BY columns
    havingClause?: string; // For SELECT: HAVING condition
    joins?: Array<{type: string; table: string; alias?: string; condition?: string}>; // For SELECT: basic JOINs
    unionType?: string; // For SELECT: UNION, UNION ALL, INTERSECT, EXCEPT
    caseStatements?: Array<{column: string; cases: Array<{when: string; then: string}>; else?: string}>; // For SELECT: CASE statements
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
            if (/CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(raw)) {
                parsed = parseCreateIndexStatement(raw);
                if (parsed) table = parsed.table || '';
            } else if (/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW/i.test(raw)) {
                parsed = parseCreateViewStatement(raw);
                if (parsed) table = parsed.viewName || '';
            } else {
                parsed = parseCreateTableStatement(raw);
                // Don't override table - we already have it from extractTableName
            }
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
        } else if (type === 'DROP') {
            parsed = parseDropStatement(raw);
            if (parsed) {
                // For DROP, use table if available, otherwise use objectName
                table = parsed.table || parsed.objectName || '';
            }
        } else if (type === 'BEGIN') {
            parsed = parseBeginStatement(raw);
        } else if (type === 'COMMIT') {
            parsed = parseCommitStatement(raw);
        } else if (type === 'ROLLBACK') {
            parsed = parseRollbackStatement(raw);
        } else if (type === 'SAVEPOINT') {
            parsed = parseSavepointStatement(raw);
        } else if (type === 'RELEASE') {
            parsed = parseReleaseStatement(raw);
        } else if (type === 'GRANT') {
            parsed = parseGrantStatement(raw);
        } else if (type === 'REVOKE') {
            parsed = parseRevokeStatement(raw);
        } else if (type === 'ALTER') {
            parsed = parseAlterTableStatement(raw);
        }

        // Include statement if it has a table OR if it's a transaction/permission statement (no table required)
        const isSpecialStatement = type === 'BEGIN' || type === 'COMMIT' || type === 'ROLLBACK' || type === 'SAVEPOINT' || type === 'RELEASE' || type === 'GRANT' || type === 'REVOKE';
        if (table || isSpecialStatement) {
            statements.push({
                type,
                table: table || type,  // Use type as fallback for transactions
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

function detectStatementType(sql: string): 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'DROP' | 'BEGIN' | 'COMMIT' | 'ROLLBACK' | 'SAVEPOINT' | 'RELEASE' | 'GRANT' | 'REVOKE' | 'ALTER' | 'UNKNOWN' {
    const trimmed = sql.trim().toUpperCase();

    if (trimmed.startsWith('CREATE TABLE')) return 'CREATE';
    if (/^CREATE\s+(?:UNIQUE\s+)?INDEX/i.test(trimmed)) return 'CREATE';
    if (/^CREATE\s+(?:OR\s+REPLACE\s+)?VIEW/i.test(trimmed)) return 'CREATE';
    if (trimmed.startsWith('INSERT INTO')) return 'INSERT';
    if (trimmed.startsWith('WITH')) return 'SELECT';  // CTE (Common Table Expression) - treat as SELECT
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    if (trimmed.startsWith('TRUNCATE')) return 'TRUNCATE';
    if (trimmed.startsWith('DROP')) return 'DROP';
    if (trimmed.startsWith('ALTER')) return 'ALTER';
    if (/^BEGIN/i.test(trimmed)) return 'BEGIN';
    if (/^START\s+TRANSACTION/i.test(trimmed)) return 'BEGIN';
    if (/^COMMIT/i.test(trimmed)) return 'COMMIT';
    if (/^ROLLBACK\s+TO/i.test(trimmed)) return 'ROLLBACK';
    if (/^ROLLBACK/i.test(trimmed)) return 'ROLLBACK';
    if (/^SAVEPOINT/i.test(trimmed)) return 'SAVEPOINT';
    if (/^RELEASE\s+SAVEPOINT/i.test(trimmed)) return 'RELEASE';
    if (/^GRANT/i.test(trimmed)) return 'GRANT';
    if (/^REVOKE/i.test(trimmed)) return 'REVOKE';

    return 'UNKNOWN';
}

function extractTableName(sql: string, type: 'CREATE' | 'INSERT' | 'SELECT' | 'UPDATE' | 'DELETE' | 'TRUNCATE' | 'DROP' | 'BEGIN' | 'COMMIT' | 'ROLLBACK' | 'SAVEPOINT' | 'RELEASE' | 'GRANT' | 'REVOKE' | 'ALTER' | 'UNKNOWN'): string {
    const trimmed = sql.trim();

    // Transactions and permission statements don't have tables (except ALTER has table)
    if (type === 'BEGIN' || type === 'COMMIT' || type === 'ROLLBACK' || type === 'SAVEPOINT' || type === 'RELEASE' || type === 'GRANT' || type === 'REVOKE') {
        return '';
    }

    // Handle ALTER TABLE
    if (type === 'ALTER') {
        const match = /ALTER\s+TABLE\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
        return '';
    }

    if (type === 'CREATE') {
        // CREATE TABLE
        let match = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i.exec(trimmed);
        if (match) return match[1];
        // CREATE INDEX: extract table from ON clause
        match = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?\w+\s+ON\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
        // CREATE VIEW: use view name as placeholder (will be overridden by parseCreateViewStatement)
        match = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i.exec(trimmed);
        if (match) return match[1];
        return '';
    } else if (type === 'INSERT') {
        const match = /INSERT\s+INTO\s+(\w+)/i.exec(trimmed);
        if (match) return match[1];
    } else if (type === 'SELECT') {
        // Handle CTE: WITH cte_name AS (...) SELECT ... FROM table
        if (trimmed.startsWith('WITH')) {
            // Extract the CTE name or the main table from the inner SELECT
            const match = /FROM\s+(\w+)/i.exec(trimmed);
            if (match) return match[1];
            // If no FROM found, use CTE name
            const cteMatch = /WITH\s+(\w+)/i.exec(trimmed);
            if (cteMatch) return cteMatch[1];
        }
        // Regular SELECT: Extract table from SELECT ... FROM table_name
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
    } else if (type === 'DROP') {
        // DROP will be handled by parseDropStatement, return placeholder as fallback
        // Try to extract table/object name
        const match = /DROP\s+(?:TABLE|INDEX|VIEW)\s+(?:IF\s+EXISTS\s+)?(\w+)/i.exec(trimmed);
        if (match) return match[1];
        // If regex doesn't match (e.g., multiline), return placeholder
        return 'DROP_OBJECT';
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

function parseSelectStatement(sql: string): any | null {
    // Special handling for CTEs (WITH clauses) - store entire thing as unparsed
    if (/^WITH\s+/i.test(sql.trim())) {
        // Find the main SELECT's table
        const mainSelectMatch = /SELECT.*?\s+FROM\s+(\w+)/i.exec(sql);
        const table = mainSelectMatch ? mainSelectMatch[1] : 'CTE';

        // For CTEs, the entire content is unparsed (too complex to parse now)
        return {
            table,
            unparsedContent: sql
        };
    }

    // Extract table name from FROM clause
    const fromMatch = /FROM\s+(\w+)/i.exec(sql);
    if (!fromMatch) return null;

    const table = fromMatch[1];

    // Extract columns from SELECT clause with alias support
    const selectMatch = /SELECT\s+([\s\S]*?)\s+FROM/i.exec(sql);
    let columns: string[] = [];
    let columnAliases: Array<{column: string; alias?: string}> = [];
    if (selectMatch) {
        const columnStr = selectMatch[1].trim();
        if (columnStr !== '*') {
            const columnParts = columnStr.split(',');
            for (const part of columnParts) {
                const trimmed = part.trim();
                if (trimmed.length === 0 || trimmed.includes('(')) continue;  // Exclude functions for now

                // Parse column and alias: "id AS user_id" or "id user_id" or "id"
                const asMatch = /^\s*(\S+)\s+(?:AS\s+)?(\S+)\s*$/i.exec(trimmed);
                if (asMatch) {
                    const col = asMatch[1];
                    const alias = asMatch[2];
                    columns.push(col);
                    columnAliases.push({ column: col, alias });
                } else {
                    // No alias, just column name
                    columns.push(trimmed);
                    columnAliases.push({ column: trimmed });
                }
            }
        }
    }

    // Extract WHERE clause
    const whereMatch = /WHERE\s+([\s\S]*)$/i.exec(sql);
    let where: string | undefined;
    if (whereMatch) {
        where = whereMatch[1].trim();
    }

    // Detect GROUP BY (including table-qualified columns like u.status)
    const groupByMatch = /\bGROUP\s+BY\s+([\w.,\s]+?)(?=\s*(?:HAVING|ORDER|LIMIT|;|$))/i.exec(sql);
    let groupByColumns: string[] | undefined;
    if (groupByMatch) {
        groupByColumns = groupByMatch[1]
            .split(',')
            .map(col => col.trim())
            .filter(col => col.length > 0);
    }

    // Detect HAVING
    const havingMatch = /\bHAVING\s+([\s\S]*?)(?=\s*(?:ORDER|LIMIT|;|$))/i.exec(sql);
    let havingClause: string | undefined;
    if (havingMatch) {
        havingClause = havingMatch[1].trim();
    }

    // Detect UNION/INTERSECT/EXCEPT
    let unionType: string | undefined;
    if (/\bUNION\s+ALL\b/i.test(sql)) {
        unionType = 'UNION ALL';
    } else if (/\bUNION\b/i.test(sql)) {
        unionType = 'UNION';
    } else if (/\bINTERSECT\b/i.test(sql)) {
        unionType = 'INTERSECT';
    } else if (/\bEXCEPT\b/i.test(sql)) {
        unionType = 'EXCEPT';
    }

    // Detect and parse JOINs
    let joins: Array<{type: string; table: string; alias?: string; condition?: string}> | undefined;
    const hasJoin = /\bJOIN\b/i.test(sql);
    if (hasJoin) {
        joins = parseJoins(sql);
    }

    // Detect unparsed content: subqueries, complex conditions, etc.
    let unparsedContent: string | undefined;
    const hasInSubquery = /\bIN\s*\(\s*SELECT/i.test(sql);
    const hasComplexJoinConditions = /\bJOIN\b.*\bON\b.*\b(AND|OR|IN|EXISTS|CASE|WHEN)\b/i.test(sql);

    if (hasInSubquery || hasComplexJoinConditions) {
        // Extract everything after "FROM tablename"
        const fromPos = (fromMatch.index || 0) + fromMatch[0].length;
        let afterFrom = sql.substring(fromPos).trim();

        // Handle table aliases: if the next word looks like an alias (2-3 chars or single letter), skip it
        const aliasMatch = /^([a-z]\w?)\s+/i.exec(afterFrom);
        if (aliasMatch) {
            afterFrom = afterFrom.substring(aliasMatch[0].length).trim();
        }

        if (afterFrom.length > 0) {
            unparsedContent = afterFrom;
        }
    }

    return {
        table,
        ...(columns.length > 0 && { columns }),
        ...(columnAliases.length > 0 && columnAliases.some(ca => ca.alias) && { columnAliases }),
        ...(where && { where }),
        ...(groupByColumns && { groupByColumns }),
        ...(havingClause && { havingClause }),
        ...(joins && { joins }),
        ...(unionType && { unionType }),
        ...(unparsedContent && { unparsedContent })
    };
}

function parseJoins(sql: string): Array<{type: string; table: string; alias?: string; condition?: string}> {
    const joins: Array<{type: string; table: string; alias?: string; condition?: string}> = [];

    // Match all JOIN clauses
    // Pattern: (LEFT|RIGHT|INNER|FULL OUTER|CROSS)? JOIN table_name [alias] ON condition
    // Condition should stop at next JOIN, WHERE, GROUP, HAVING, ORDER, LIMIT, UNION, etc.
    const joinPattern = /\b(LEFT\s+OUTER|RIGHT\s+OUTER|FULL\s+OUTER|CROSS|LEFT|RIGHT|INNER|JOIN)?\s*JOIN\s+(\w+)(?:\s+(?:AS\s+)?(\w+))?\s+ON\s+([^;]*?)(?=\s+(?:WHERE|GROUP|HAVING|ORDER|LIMIT|UNION|INTERSECT|EXCEPT)\b|(?=\s+(?:LEFT|RIGHT|INNER|FULL|CROSS)\s+JOIN)|(?=\s+JOIN\s+)|;|$)/gi;

    let match;
    while ((match = joinPattern.exec(sql)) !== null) {
        let joinType = 'INNER';  // Default to INNER

        // Determine JOIN type
        if (match[1]) {
            const typeStr = match[1].toUpperCase().trim();
            if (typeStr.includes('LEFT')) joinType = 'LEFT';
            else if (typeStr.includes('RIGHT')) joinType = 'RIGHT';
            else if (typeStr.includes('FULL')) joinType = 'FULL OUTER';
            else if (typeStr.includes('CROSS')) joinType = 'CROSS';
            else if (typeStr === 'JOIN') joinType = 'INNER';  // Explicit or implicit
        }

        const joinedTable = match[2];
        const alias = match[3];
        const condition = match[4].trim();

        joins.push({
            type: joinType,
            table: joinedTable,
            ...(alias && { alias }),
            ...(condition && { condition })
        });
    }

    return joins.length > 0 ? joins : undefined as any;
}

function parseCreateIndexStatement(sql: string): any | null {
    const result: any = { objectType: 'INDEX' };

    // Check for UNIQUE
    if (/CREATE\s+UNIQUE\s+INDEX/i.test(sql)) {
        result.unique = true;
    }

    // Check for IF NOT EXISTS
    if (/IF\s+NOT\s+EXISTS/i.test(sql)) {
        result.ifNotExists = true;
    }

    // Extract index name and table
    const match = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s+ON\s+(\w+)\s*\((.*?)\)/is.exec(sql);
    if (!match) return null;

    result.indexName = match[1];
    result.table = match[2];

    // Parse columns
    const columnsStr = match[3];
    result.columns = columnsStr.split(',').map((col: string) => col.trim()).filter((col: string) => col.length > 0);

    return result;
}

function parseCreateViewStatement(sql: string): any | null {
    const result: any = { objectType: 'VIEW' };

    // Check for OR REPLACE
    if (/CREATE\s+OR\s+REPLACE\s+VIEW/i.test(sql)) {
        result.orReplace = true;
    }

    // Check for IF NOT EXISTS
    if (/IF\s+NOT\s+EXISTS/i.test(sql)) {
        result.ifNotExists = true;
    }

    // Extract view name
    const match = /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i.exec(sql);
    if (!match) return null;

    result.viewName = match[1];

    return result;
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

function parseDropStatement(sql: string): any | null {
    const result: any = {};
    const upper = sql.trim().toUpperCase();

    // Detect DROP object type (TABLE, INDEX, VIEW, etc.)
    let objectType = '';
    if (upper.includes('DROP TABLE')) {
        objectType = 'TABLE';
    } else if (upper.includes('DROP INDEX')) {
        objectType = 'INDEX';
    } else if (upper.includes('DROP VIEW')) {
        objectType = 'VIEW';
    } else {
        return null;
    }

    result.objectType = objectType;

    // Check for IF EXISTS
    if (/DROP\s+\w+\s+IF\s+EXISTS/i.test(sql)) {
        result.ifExists = true;
    }

    // Check for CASCADE
    if (/CASCADE/i.test(sql)) {
        result.cascade = true;
    }

    // Check for RESTRICT
    if (/RESTRICT/i.test(sql)) {
        result.restrict = true;
    }

    // Extract object name
    let nameMatch;
    if (objectType === 'TABLE') {
        // DROP TABLE [IF EXISTS] name [CASCADE|RESTRICT]
        nameMatch = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i.exec(sql);
        if (nameMatch) {
            result.table = nameMatch[1];
        }
    } else if (objectType === 'INDEX') {
        // DROP INDEX [IF EXISTS] name [ON table] [CASCADE|RESTRICT]
        nameMatch = /DROP\s+INDEX\s+(?:IF\s+EXISTS\s+)?(\w+)/i.exec(sql);
        if (nameMatch) {
            result.objectName = nameMatch[1];
        }
        // Check for ON table clause (MySQL syntax)
        const onMatch = /ON\s+(\w+)/i.exec(sql);
        if (onMatch) {
            result.table = onMatch[1];
        }
    } else if (objectType === 'VIEW') {
        // DROP VIEW [IF EXISTS] name [CASCADE|RESTRICT]
        nameMatch = /DROP\s+VIEW\s+(?:IF\s+EXISTS\s+)?(\w+)/i.exec(sql);
        if (nameMatch) {
            result.table = nameMatch[1];
        }
    }

    return result;
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
        // For CREATE: only group CREATE TABLE statements (never group INDEX/VIEW even on same table)
        // For transactions: never group (each transaction statement stands alone)
        let canGroup = true;
        if (action === 'INSERT') {
            canGroup = areInsertColumnsCompatible(lastGroup?.columns, stmt.parsed?.columns);
        } else if (action === 'CREATE') {
            // Don't group CREATE INDEX or CREATE VIEW - each should be its own statement
            // Only group CREATE TABLE statements
            canGroup = stmt.parsed?.objectType === 'TABLE' && lastGroup?.objectType === 'TABLE';
        } else if (action === 'BEGIN' || action === 'COMMIT' || action === 'ROLLBACK' || action === 'SAVEPOINT' || action === 'RELEASE' || action === 'GRANT' || action === 'REVOKE' || action === 'ALTER') {
            // Never group transaction/permission/alter statements
            canGroup = false;
        }

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
                if (!lastGroup.columnAliases) lastGroup.columnAliases = stmt.parsed.columnAliases;
                if (!lastGroup.where) lastGroup.where = stmt.parsed.where;
                if (!lastGroup.groupByColumns) lastGroup.groupByColumns = stmt.parsed.groupByColumns;
                if (!lastGroup.havingClause) lastGroup.havingClause = stmt.parsed.havingClause;
                if (!lastGroup.joins) lastGroup.joins = stmt.parsed.joins;
                if (!lastGroup.unionType) lastGroup.unionType = stmt.parsed.unionType;
                if (!lastGroup.caseStatements) lastGroup.caseStatements = stmt.parsed.caseStatements;
                if (!lastGroup.unparsedContent) lastGroup.unparsedContent = stmt.parsed.unparsedContent;
            } else if (action === 'TRUNCATE' && stmt.parsed) {
                // TRUNCATE has no additional data to merge
            } else if (action === 'DROP' && stmt.parsed) {
                // DROP: merge optional properties
                if (!lastGroup.objectType) lastGroup.objectType = stmt.parsed.objectType;
                if (!lastGroup.objectName) lastGroup.objectName = stmt.parsed.objectName;
                if (!lastGroup.ifExists) lastGroup.ifExists = stmt.parsed.ifExists;
                if (!lastGroup.cascade) lastGroup.cascade = stmt.parsed.cascade;
                if (!lastGroup.restrict) lastGroup.restrict = stmt.parsed.restrict;
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
                if (stmt.parsed.objectType === 'INDEX') {
                    group.objectType = 'INDEX';
                    group.indexName = stmt.parsed.indexName;
                    group.columns = stmt.parsed.columns;
                    group.unique = stmt.parsed.unique;
                    group.ifNotExists = stmt.parsed.ifNotExists;
                } else if (stmt.parsed.objectType === 'VIEW') {
                    group.objectType = 'VIEW';
                    group.viewName = stmt.parsed.viewName;
                    group.orReplace = stmt.parsed.orReplace;
                    group.ifNotExists = stmt.parsed.ifNotExists;
                } else {
                    // CREATE TABLE
                    group.objectType = 'TABLE';
                    group.schema = stmt.parsed;
                }
            } else if (action === 'UPDATE' && stmt.parsed) {
                group.updates = stmt.parsed.updates;
                group.where = stmt.parsed.where;
            } else if (action === 'DELETE' && stmt.parsed) {
                group.where = stmt.parsed.where;
            } else if (action === 'SELECT' && stmt.parsed) {
                group.columns = stmt.parsed.columns;
                if (stmt.parsed.columnAliases) group.columnAliases = stmt.parsed.columnAliases;
                group.where = stmt.parsed.where;
                if (stmt.parsed.groupByColumns) group.groupByColumns = stmt.parsed.groupByColumns;
                if (stmt.parsed.havingClause) group.havingClause = stmt.parsed.havingClause;
                if (stmt.parsed.joins) group.joins = stmt.parsed.joins;
                if (stmt.parsed.unionType) group.unionType = stmt.parsed.unionType;
                if (stmt.parsed.caseStatements) group.caseStatements = stmt.parsed.caseStatements;
                if (stmt.parsed.unparsedContent) group.unparsedContent = stmt.parsed.unparsedContent;
            } else if (action === 'TRUNCATE' && stmt.parsed) {
                // TRUNCATE has no additional data
            } else if (action === 'DROP' && stmt.parsed) {
                group.objectType = stmt.parsed.objectType;
                if (stmt.parsed.objectName) group.objectName = stmt.parsed.objectName;
                if (stmt.parsed.ifExists) group.ifExists = stmt.parsed.ifExists;
                if (stmt.parsed.cascade) group.cascade = stmt.parsed.cascade;
                if (stmt.parsed.restrict) group.restrict = stmt.parsed.restrict;
            } else if ((action === 'BEGIN' || action === 'COMMIT' || action === 'ROLLBACK' || action === 'SAVEPOINT' || action === 'RELEASE') && stmt.parsed) {
                if (stmt.parsed.toSavepoint) group.toSavepoint = stmt.parsed.toSavepoint;
                if (stmt.parsed.savepointName) group.savepointName = stmt.parsed.savepointName;
            } else if ((action === 'GRANT' || action === 'REVOKE') && stmt.parsed) {
                if (stmt.parsed.privileges) group.privileges = stmt.parsed.privileges;
                if (stmt.parsed.objectType) group.objectType = stmt.parsed.objectType;
                if (stmt.parsed.objectName) group.objectName = stmt.parsed.objectName;
                if (stmt.parsed.grantee) group.grantee = stmt.parsed.grantee;
                if (stmt.parsed.grantOption) group.grantOption = stmt.parsed.grantOption;
                if (stmt.parsed.cascade) group.cascade = stmt.parsed.cascade;
                if (stmt.parsed.restrict) group.restrict = stmt.parsed.restrict;
            } else if (action === 'ALTER' && stmt.parsed) {
                if (stmt.parsed.alterationType) group.alterationType = stmt.parsed.alterationType;
                if (stmt.parsed.columnDefinition) group.columnDefinition = stmt.parsed.columnDefinition;
                if (stmt.parsed.columnName) group.columnName = stmt.parsed.columnName;
                if (stmt.parsed.newColumnName) group.newColumnName = stmt.parsed.newColumnName;
                if (stmt.parsed.constraintName) group.constraintName = stmt.parsed.constraintName;
                if (stmt.parsed.newName) group.newName = stmt.parsed.newName;
                if (stmt.parsed.cascade) group.cascade = stmt.parsed.cascade;
                if (stmt.parsed.restrict) group.restrict = stmt.parsed.restrict;
            }

            result.push(group);
        }
    }

    return result;
}

function parseBeginStatement(_sql: string): any | null {
    return { action: 'BEGIN' };
}

function parseCommitStatement(_sql: string): any | null {
    return { action: 'COMMIT' };
}

function parseRollbackStatement(sql: string): any | null {
    const result: any = { action: 'ROLLBACK' };

    // Check for ROLLBACK TO SAVEPOINT
    if (/ROLLBACK\s+TO\s+SAVEPOINT/i.test(sql)) {
        result.toSavepoint = true;
        const match = /ROLLBACK\s+TO\s+SAVEPOINT\s+(\w+)/i.exec(sql);
        if (match) {
            result.savepointName = match[1];
        }
    }

    return result;
}

function parseSavepointStatement(sql: string): any | null {
    const result: any = { action: 'SAVEPOINT' };

    // Extract savepoint name
    const match = /SAVEPOINT\s+(\w+)/i.exec(sql);
    if (match) {
        result.savepointName = match[1];
    }

    return result;
}

function parseReleaseStatement(sql: string): any | null {
    const result: any = { action: 'RELEASE' };

    // Extract savepoint name from RELEASE SAVEPOINT
    const match = /RELEASE\s+SAVEPOINT\s+(\w+)/i.exec(sql);
    if (match) {
        result.savepointName = match[1];
    }

    return result;
}

function parseGrantStatement(sql: string): any | null {
    const result: any = { action: 'GRANT' };

    // Parse: GRANT privilege(s) ON [object_type] object TO grantee [WITH GRANT OPTION]

    // Extract privileges (before ON)
    const privilegesMatch = /GRANT\s+(.*?)\s+ON/is.exec(sql);
    if (privilegesMatch) {
        const privStr = privilegesMatch[1].trim();
        if (privStr.toUpperCase() === 'ALL') {
            result.privileges = ['ALL'];
        } else {
            result.privileges = privStr.split(',').map((p: string) => p.trim().toUpperCase()).filter((p: string) => p.length > 0);
        }
    }

    // Extract object type and name (ON clause)
    // Could be: ON object OR ON TABLE object OR ON DATABASE object, etc.
    let objectTypeMatch = /ON\s+(TABLE|DATABASE|SCHEMA|PROCEDURE|INDEX|VIEW|SEQUENCE)\s+(\w+)/i.exec(sql);
    if (objectTypeMatch) {
        result.objectType = objectTypeMatch[1].toUpperCase();
        result.objectName = objectTypeMatch[2];
    } else {
        // Infer TABLE if no explicit type
        const simpleMatch = /ON\s+(\w+)/i.exec(sql);
        if (simpleMatch) {
            result.objectType = 'TABLE';
            result.objectName = simpleMatch[1];
        }
    }

    // Extract grantee (TO clause)
    const granteeMatch = /TO\s+(\w+|"[^"]+"|'[^']+')(?:\s|;|WITH|$)/i.exec(sql);
    if (granteeMatch) {
        let grantee = granteeMatch[1];
        if (grantee.startsWith('"') || grantee.startsWith("'")) {
            grantee = grantee.slice(1, -1);
        }
        result.grantee = grantee;
    }

    // Check for WITH GRANT OPTION
    if (/WITH\s+GRANT\s+OPTION/i.test(sql)) {
        result.grantOption = true;
    }

    return result;
}

function parseRevokeStatement(sql: string): any | null {
    const result: any = { action: 'REVOKE' };

    // Parse: REVOKE privilege(s) ON [object_type] object FROM grantee [CASCADE|RESTRICT]

    // Extract privileges (before ON)
    const privilegesMatch = /REVOKE\s+(.*?)\s+ON/is.exec(sql);
    if (privilegesMatch) {
        const privStr = privilegesMatch[1].trim();
        if (privStr.toUpperCase() === 'ALL') {
            result.privileges = ['ALL'];
        } else {
            result.privileges = privStr.split(',').map((p: string) => p.trim().toUpperCase()).filter((p: string) => p.length > 0);
        }
    }

    // Extract object type and name (ON clause)
    let objectTypeMatch = /ON\s+(TABLE|DATABASE|SCHEMA|PROCEDURE|INDEX|VIEW|SEQUENCE)\s+(\w+)/i.exec(sql);
    if (objectTypeMatch) {
        result.objectType = objectTypeMatch[1].toUpperCase();
        result.objectName = objectTypeMatch[2];
    } else {
        // Infer TABLE if no explicit type
        const simpleMatch = /ON\s+(\w+)/i.exec(sql);
        if (simpleMatch) {
            result.objectType = 'TABLE';
            result.objectName = simpleMatch[1];
        }
    }

    // Extract grantee (FROM clause)
    const granteeMatch = /FROM\s+(\w+|"[^"]+"|'[^']+')(?:\s|;|CASCADE|RESTRICT|$)/i.exec(sql);
    if (granteeMatch) {
        let grantee = granteeMatch[1];
        if (grantee.startsWith('"') || grantee.startsWith("'")) {
            grantee = grantee.slice(1, -1);
        }
        result.grantee = grantee;
    }

    // Check for CASCADE or RESTRICT
    if (/CASCADE/i.test(sql)) {
        result.cascade = true;
    }
    if (/RESTRICT/i.test(sql)) {
        result.restrict = true;
    }

    return result;
}

function parseAlterTableStatement(sql: string): any | null {
    const result: any = { action: 'ALTER' };

    // ADD COLUMN
    if (/ADD\s+COLUMN/i.test(sql)) {
        result.alterationType = 'ADD_COLUMN';
        const match = /ADD\s+COLUMN\s+(\w+)\s+(\w+(?:\([^)]+\))?)/i.exec(sql);
        if (match) {
            result.columnDefinition = { name: match[1], type: match[2] };
        }
    }
    // MODIFY COLUMN (MySQL) or ALTER COLUMN (PostgreSQL)
    else if (/MODIFY\s+COLUMN/i.test(sql)) {
        result.alterationType = 'MODIFY_COLUMN';
        const match = /MODIFY\s+COLUMN\s+(\w+)/i.exec(sql);
        if (match) result.columnName = match[1];
    }
    else if (/ALTER\s+COLUMN/i.test(sql)) {
        result.alterationType = 'MODIFY_COLUMN';
        const match = /ALTER\s+COLUMN\s+(\w+)/i.exec(sql);
        if (match) result.columnName = match[1];
    }
    // DROP COLUMN
    else if (/DROP\s+COLUMN/i.test(sql)) {
        result.alterationType = 'DROP_COLUMN';
        const match = /DROP\s+COLUMN\s+(\w+)/i.exec(sql);
        if (match) result.columnName = match[1];
        if (/CASCADE/i.test(sql)) result.cascade = true;
        if (/RESTRICT/i.test(sql)) result.restrict = true;
    }
    // ADD CONSTRAINT
    else if (/ADD\s+CONSTRAINT/i.test(sql)) {
        result.alterationType = 'ADD_CONSTRAINT';
        const match = /ADD\s+CONSTRAINT\s+(\w+)/i.exec(sql);
        if (match) result.constraintName = match[1];
    }
    // DROP CONSTRAINT
    else if (/DROP\s+CONSTRAINT/i.test(sql)) {
        result.alterationType = 'DROP_CONSTRAINT';
        const match = /DROP\s+CONSTRAINT\s+(\w+)/i.exec(sql);
        if (match) result.constraintName = match[1];
        if (/CASCADE/i.test(sql)) result.cascade = true;
        if (/RESTRICT/i.test(sql)) result.restrict = true;
    }
    // RENAME COLUMN (check before RENAME TABLE since it's more specific)
    else if (/RENAME\s+(?:COLUMN\s+)?(\w+)\s+TO/i.test(sql) && !/RENAME\s+TABLE/i.test(sql)) {
        result.alterationType = 'RENAME_COLUMN';
        const match = /RENAME\s+(?:COLUMN\s+)?(\w+)\s+TO\s+(\w+)/i.exec(sql);
        if (match) {
            result.columnName = match[1];
            result.newColumnName = match[2];
        }
    }
    // RENAME TABLE
    else if (/RENAME/i.test(sql) && /TO\s+\w+/i.test(sql)) {
        result.alterationType = 'RENAME_TABLE';
        const renameMatch = /TO\s+(\w+)/i.exec(sql);
        if (renameMatch) {
            result.newName = renameMatch[1];
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
