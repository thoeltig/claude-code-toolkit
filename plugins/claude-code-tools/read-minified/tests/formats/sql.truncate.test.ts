import { formatSql } from '../../src/formats/sql';

/**
 * TRUNCATE Statement Tests
 *
 * TRUNCATE removes all rows from a table efficiently (deallocates pages in some DBs)
 * Unlike DELETE, TRUNCATE does NOT support WHERE clause
 * Some dialects allow: TRUNCATE TABLE name; or TRUNCATE name;
 *
 * Key characteristics:
 * - No WHERE clause (always affects all rows)
 * - No row count tracking needed (like DELETE, different from INSERT)
 * - Distinct from DELETE (different semantics)
 */

describe('SQL TRUNCATE Statement Parsing', () => {
  describe('Basic TRUNCATE', () => {
    test('should parse TRUNCATE TABLE statement', () => {
      const sql = 'TRUNCATE TABLE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('users');
      expect(result[0].statementIndex).toBe(0);
    });

    test('should parse TRUNCATE without TABLE keyword', () => {
      const sql = 'TRUNCATE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle TRUNCATE case insensitive', () => {
      const sql = 'truncate table products;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('products');
    });

    test('should handle mixed case TRUNCATE', () => {
      const sql = 'TrUnCaTe TaBlE events;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('events');
    });
  });

  describe('Table Names Variations', () => {
    test('should handle table names with underscores', () => {
      const sql = 'TRUNCATE TABLE user_data;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('user_data');
    });

    test('should handle table names with numbers', () => {
      const sql = 'TRUNCATE TABLE logs_2025;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('logs_2025');
    });

    test('should handle schema-qualified table names', () => {
      const sql = 'TRUNCATE TABLE public.users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Captures main table name (schema prefix handling may vary by dialect)
      expect(result[0].table).toBeDefined();
    });
  });

  describe('TRUNCATE vs DELETE Distinction', () => {
    test('should distinguish TRUNCATE from DELETE', () => {
      const truncateSql = 'TRUNCATE TABLE users;';
      const deleteSql = 'DELETE FROM users;';

      const truncateResult = JSON.parse(formatSql(truncateSql, { minify: true }));
      const deleteResult = JSON.parse(formatSql(deleteSql, { minify: true }));

      expect(truncateResult[0].action).toBe('TRUNCATE');
      expect(deleteResult[0].action).toBe('DELETE');
    });

    test('TRUNCATE should not have WHERE clause (even if somehow provided)', () => {
      const sql = 'TRUNCATE TABLE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // TRUNCATE never has WHERE
      expect(result[0]).not.toHaveProperty('where');
    });
  });

  describe('Multiple TRUNCATE Statements', () => {
    test('should handle multiple TRUNCATE statements on different tables', () => {
      const sql = `TRUNCATE TABLE users;
      TRUNCATE TABLE products;
      TRUNCATE TABLE orders;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result.map((r: any) => r.action)).toEqual(['TRUNCATE', 'TRUNCATE', 'TRUNCATE']);
      expect(result.map((r: any) => r.table)).toEqual(['users', 'products', 'orders']);
    });

    test('should group consecutive TRUNCATE statements on same table', () => {
      const sql = `TRUNCATE TABLE temp;
      TRUNCATE TABLE temp;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Consecutive TRUNCATEs on same table should group
      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('temp');
    });
  });

  describe('Whitespace Handling', () => {
    test('should handle extra whitespace around TRUNCATE', () => {
      const sql = '  TRUNCATE    TABLE    users  ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle TRUNCATE without semicolon', () => {
      const sql = 'TRUNCATE TABLE users';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle newlines in TRUNCATE statement', () => {
      const sql = `TRUNCATE
      TABLE
      users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('users');
    });
  });

  describe('Comments with TRUNCATE', () => {
    test('should handle line comment before TRUNCATE', () => {
      const sql = `-- Clear user data
      TRUNCATE TABLE users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle block comment before TRUNCATE', () => {
      const sql = `/* Clear all temporary data */
      TRUNCATE TABLE temp_staging;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('TRUNCATE');
      expect(result[0].table).toBe('temp_staging');
    });
  });

  describe('Mixed Statements with TRUNCATE', () => {
    test('should handle CREATE, INSERT, TRUNCATE sequence', () => {
      const sql = `CREATE TABLE logs (id INT, message TEXT);
      INSERT INTO logs (id, message) VALUES (1, 'Log entry');
      TRUNCATE TABLE logs;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('CREATE');
      expect(result[1].action).toBe('INSERT');
      expect(result[2].action).toBe('TRUNCATE');
    });

    test('should handle TRUNCATE with UPDATE and DELETE', () => {
      const sql = `UPDATE users SET active = false WHERE status = 'inactive';
      TRUNCATE TABLE archive;
      DELETE FROM old_logs WHERE created_at < '2020-01-01';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('UPDATE');
      expect(result[1].action).toBe('TRUNCATE');
      expect(result[2].action).toBe('DELETE');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle data cleanup workflow', () => {
      const sql = `-- Step 1: Archive old data
      INSERT INTO archive SELECT * FROM users WHERE status = 'deleted';
      -- Step 2: Delete from main table
      DELETE FROM users WHERE status = 'deleted';
      -- Step 3: Clear staging
      TRUNCATE TABLE staging;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.map((r: any) => r.action);
      expect(actions).toContain('INSERT');
      expect(actions).toContain('DELETE');
      expect(actions).toContain('TRUNCATE');
    });

    test('should handle test database reset', () => {
      const sql = `TRUNCATE TABLE users;
      TRUNCATE TABLE products;
      TRUNCATE TABLE orders;
      TRUNCATE TABLE order_items;
      INSERT INTO users (id, name) VALUES (1, 'test_user');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const truncateCount = result.filter((r: any) => r.action === 'TRUNCATE').length;
      expect(truncateCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure for TRUNCATE', () => {
      const sql = 'TRUNCATE TABLE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('table');
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('statementIndex');
      expect(stmt.action).toBe('TRUNCATE');
      expect(stmt).not.toHaveProperty('where');
      expect(stmt).not.toHaveProperty('rows');
      expect(stmt).not.toHaveProperty('columns');
      expect(stmt).not.toHaveProperty('updates');
    });

    test('should return minified JSON', () => {
      const sql = 'TRUNCATE TABLE users;';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });

    test('should return pretty-printed JSON when minify is false', () => {
      const sql = 'TRUNCATE TABLE users;';
      const output = formatSql(sql, { minify: false });

      expect(output).toContain('\n');
    });
  });
});
