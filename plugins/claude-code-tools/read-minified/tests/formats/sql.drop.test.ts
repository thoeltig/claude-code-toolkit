import { formatSql } from '../../src/formats/sql';

/**
 * DROP Statement Tests
 *
 * DROP removes database objects (tables, views, indexes, etc.)
 * Syntax patterns:
 * - DROP TABLE name;
 * - DROP INDEX name;
 * - DROP VIEW name;
 * - Optional: IF EXISTS clause
 * - Optional: CASCADE/RESTRICT clause (dialect-specific)
 *
 * Similar to TRUNCATE:
 * - Just needs table/object name
 * - No WHERE clause
 * - No data preservation
 */

describe('SQL DROP Statement Parsing', () => {
  describe('DROP TABLE', () => {
    test('should parse DROP TABLE statement', () => {
      const sql = 'DROP TABLE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].objectType).toBe('TABLE');
      expect(result[0].actions[0].statementIndex).toBe(0);
    });

    test('should parse DROP TABLE with IF EXISTS', () => {
      const sql = 'DROP TABLE IF EXISTS users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].objectType).toBe('TABLE');
      expect(result[0].actions[0].ifExists).toBe(true);
    });

    test('should parse DROP TABLE with CASCADE', () => {
      const sql = 'DROP TABLE users CASCADE;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].cascade).toBe(true);
    });

    test('should parse DROP TABLE with RESTRICT', () => {
      const sql = 'DROP TABLE users RESTRICT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].restrict).toBe(true);
    });

    test('should handle case insensitivity', () => {
      const sql = 'drop table users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].objectType).toBe('TABLE');
    });

    test('should handle mixed case', () => {
      const sql = 'DrOp TaBlE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('TABLE');
    });
  });

  describe('DROP INDEX', () => {
    test('should parse DROP INDEX statement', () => {
      const sql = 'DROP INDEX users_email_idx;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('INDEX');
      expect(result[0].actions[0].objectName).toBe('users_email_idx');
      expect(result[0].actions[0].statementIndex).toBe(0);
    });

    test('should parse DROP INDEX with IF EXISTS', () => {
      const sql = 'DROP INDEX IF EXISTS users_email_idx;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('INDEX');
      expect(result[0].actions[0].ifExists).toBe(true);
    });

    test('should parse DROP INDEX with ON table (MySQL syntax)', () => {
      const sql = 'DROP INDEX users_email_idx ON users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('INDEX');
      expect(result[0].actions[0].objectName).toBe('users_email_idx');
      expect(result[0].table).toBe('users');
    });
  });

  describe('DROP VIEW', () => {
    test('should parse DROP VIEW statement', () => {
      const sql = 'DROP VIEW users_summary;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('VIEW');
      expect(result[0].table).toBe('users_summary');
    });

    test('should parse DROP VIEW with IF EXISTS', () => {
      const sql = 'DROP VIEW IF EXISTS users_summary;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('VIEW');
      expect(result[0].actions[0].ifExists).toBe(true);
    });

    test('should parse DROP VIEW with CASCADE', () => {
      const sql = 'DROP VIEW users_summary CASCADE;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('VIEW');
      expect(result[0].actions[0].cascade).toBe(true);
    });
  });

  describe('DROP vs TRUNCATE vs DELETE Distinction', () => {
    test('should distinguish DROP, TRUNCATE, and DELETE', () => {
      const dropSql = 'DROP TABLE users;';
      const truncateSql = 'TRUNCATE TABLE users;';
      const deleteSql = 'DELETE FROM users;';

      const dropResult = JSON.parse(formatSql(dropSql, { minify: true }));
      const truncateResult = JSON.parse(formatSql(truncateSql, { minify: true }));
      const deleteResult = JSON.parse(formatSql(deleteSql, { minify: true }));

      expect(dropResult[0].actions[0].action).toBe('DROP');
      expect(truncateResult[0].actions[0].action).toBe('TRUNCATE');
      expect(deleteResult[0].actions[0].action).toBe('DELETE');
    });

    test('DROP should not have WHERE clause', () => {
      const sql = 'DROP TABLE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0]).not.toHaveProperty('where');
    });
  });

  describe('Multiple DROP Statements', () => {
    test('should handle multiple DROP TABLE statements', () => {
      const sql = `DROP TABLE users;
      DROP TABLE products;
      DROP TABLE orders;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      const actions = result.flatMap((r: any) => r.actions)
      expect(actions.map((a: any) => a.action)).toEqual(['DROP', 'DROP', 'DROP']);
      expect(actions.map((a: any) => a.objectType)).toEqual(['TABLE', 'TABLE', 'TABLE']);
    });

    test('should group consecutive DROP TABLE statements on same table', () => {
      const sql = `DROP TABLE IF EXISTS temp;
      DROP TABLE IF EXISTS temp;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Consecutive DROPs on same object should group
      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('TABLE');
    });

    test('should handle mixed DROP types (TABLE, INDEX, VIEW)', () => {
      const sql = `DROP TABLE users;
      DROP INDEX user_idx;
      DROP VIEW user_summary;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].actions[0].objectType).toBe('TABLE');
      expect(result[1].actions[0].objectType).toBe('INDEX');
      expect(result[2].actions[0].objectType).toBe('VIEW');
    });
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace', () => {
      const sql = '  DROP   TABLE   users  ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
    });

    test('should handle newlines', () => {
      const sql = `DROP
      TABLE
      users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
    });

    test('should handle DROP without semicolon', () => {
      const sql = 'DROP TABLE users';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('users');
    });
  });

  describe('Table/Object Name Variations', () => {
    test('should handle table names with underscores', () => {
      const sql = 'DROP TABLE user_data;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('user_data');
    });

    test('should handle table names with numbers', () => {
      const sql = 'DROP TABLE logs_2025;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('logs_2025');
    });

    test('should handle index names with patterns', () => {
      const sql = 'DROP INDEX idx_users_email_status;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].objectType).toBe('INDEX');
      expect(result[0].actions[0].objectName).toBe('idx_users_email_status');
    });
  });

  describe('Comments with DROP', () => {
    test('should handle line comment before DROP', () => {
      const sql = `-- Remove user table
      DROP TABLE users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].actions[0].objectType).toBe('TABLE');
    });

    test('should handle block comment before DROP', () => {
      const sql = `/* Cleanup old table */
      DROP TABLE old_users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DROP');
      expect(result[0].table).toBe('old_users');
    });
  });

  describe('Mixed Statements with DROP', () => {
    test('should handle CREATE and DROP sequence', () => {
      const sql = `CREATE TABLE temp_data (id INT);
      INSERT INTO temp_data VALUES (1);
      DROP TABLE temp_data;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions.length).toBeGreaterThanOrEqual(3);
      const actions = result.flatMap((r: any) => r.actions).map((a:any) => a.action);
      expect(actions).toContain('CREATE');
      expect(actions).toContain('INSERT');
      expect(actions).toContain('DROP');
    });

    test('should handle TRUNCATE and DROP', () => {
      const sql = `TRUNCATE TABLE staging;
      DROP TABLE staging;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('TRUNCATE');
      expect(result[0].actions[1].action).toBe('DROP');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle cleanup workflow', () => {
      const sql = `-- Clean up indexes first
      DROP INDEX IF EXISTS idx_users_email;
      DROP INDEX IF EXISTS idx_users_created;
      -- Then drop table
      DROP TABLE IF EXISTS users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const dropCount = result.flatMap((r: any) => r.actions).filter((a:any) => a.action === 'DROP').length;
      expect(dropCount).toBe(3);
    });

    test('should handle schema rebuild', () => {
      const sql = `DROP VIEW IF EXISTS user_summary CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      CREATE TABLE users (id INT, name VARCHAR(100));
      CREATE VIEW user_summary AS SELECT id, name FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.flatMap((r: any) => r.actions).map((a:any) => a.action);
      expect(actions).toContain('DROP');
      expect(actions).toContain('CREATE');
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure for DROP TABLE', () => {
      const sql = 'DROP TABLE users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0]).toHaveProperty('table');
      const stmt = result[0].actions[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('objectType');
      expect(stmt).toHaveProperty('statementIndex');
      expect(stmt.action).toBe('DROP');
      expect(stmt.objectType).toBe('TABLE');
      expect(stmt).not.toHaveProperty('where');
      expect(stmt).not.toHaveProperty('rows');
    });

    test('should have correct output structure for DROP INDEX', () => {
      const sql = 'DROP INDEX users_idx;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0].actions[0];
      expect(stmt).toHaveProperty('objectName');
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('objectType');
      expect(stmt.action).toBe('DROP');
      expect(stmt.objectType).toBe('INDEX');
    });

    test('should return minified JSON', () => {
      const sql = 'DROP TABLE users;';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });

    test('should return pretty-printed JSON when minify is false', () => {
      const sql = 'DROP TABLE users;';
      const output = formatSql(sql, { minify: false });

      expect(output).toContain('\n');
    });
  });
});
