import { formatSql } from '../../src/formats/sql';

/**
 * Transaction Control Statement Tests
 *
 * Transaction control manages database transactions
 * Statements: BEGIN, COMMIT, ROLLBACK, SAVEPOINT, RELEASE, ROLLBACK TO
 *
 * Key characteristics:
 * - No table required (database-wide operations)
 * - Optional: savepoint names, isolation levels
 * - Different syntax variants across SQL dialects
 */

describe('SQL Transaction Control Statement Parsing', () => {
  describe('Basic BEGIN', () => {
    test('should parse BEGIN', () => {
      const sql = 'BEGIN;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('BEGIN');
      expect(result[0]).not.toHaveProperty('table');
    });

    test('should parse BEGIN TRANSACTION', () => {
      const sql = 'BEGIN TRANSACTION;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });

    test('should parse START TRANSACTION', () => {
      const sql = 'START TRANSACTION;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });

    test('should handle case insensitivity', () => {
      const sql = 'begin;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });
  });

  describe('Basic COMMIT', () => {
    test('should parse COMMIT', () => {
      const sql = 'COMMIT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('COMMIT');
      expect(result[0]).not.toHaveProperty('table');
    });

    test('should parse COMMIT TRANSACTION', () => {
      const sql = 'COMMIT TRANSACTION;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('COMMIT');
    });

    test('should handle case insensitivity', () => {
      const sql = 'commit;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('COMMIT');
    });
  });

  describe('Basic ROLLBACK', () => {
    test('should parse ROLLBACK', () => {
      const sql = 'ROLLBACK;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('ROLLBACK');
      expect(result[0]).not.toHaveProperty('table');
    });

    test('should parse ROLLBACK TRANSACTION', () => {
      const sql = 'ROLLBACK TRANSACTION;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ROLLBACK');
    });

    test('should handle case insensitivity', () => {
      const sql = 'rollback;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ROLLBACK');
    });
  });

  describe('SAVEPOINT Management', () => {
    test('should parse SAVEPOINT', () => {
      const sql = 'SAVEPOINT sp1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('SAVEPOINT');
      expect(result[0].savepointName).toBe('sp1');
      expect(result[0]).not.toHaveProperty('table');
    });

    test('should parse RELEASE SAVEPOINT', () => {
      const sql = 'RELEASE SAVEPOINT sp1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('RELEASE');
      expect(result[0].savepointName).toBe('sp1');
    });

    test('should parse ROLLBACK TO SAVEPOINT', () => {
      const sql = 'ROLLBACK TO SAVEPOINT sp1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ROLLBACK');
      expect(result[0].savepointName).toBe('sp1');
      expect(result[0].toSavepoint).toBe(true);
    });

    test('should handle savepoint names with underscores', () => {
      const sql = 'SAVEPOINT my_savepoint_1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].savepointName).toBe('my_savepoint_1');
    });
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace in BEGIN', () => {
      const sql = '  BEGIN   ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });

    test('should handle extra whitespace in SAVEPOINT', () => {
      const sql = '  SAVEPOINT   sp1   ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('SAVEPOINT');
      expect(result[0].savepointName).toBe('sp1');
    });

    test('should handle newlines in transaction statements', () => {
      const sql = `BEGIN
      TRANSACTION;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });
  });

  describe('Comments with Transactions', () => {
    test('should handle line comment before BEGIN', () => {
      const sql = `-- Start transaction
      BEGIN;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });

    test('should handle block comment', () => {
      const sql = `/* Start of transaction block */
      BEGIN;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('BEGIN');
    });
  });

  describe('Transaction Sequences', () => {
    test('should handle BEGIN ... COMMIT sequence', () => {
      const sql = `BEGIN;
      INSERT INTO users (name) VALUES ('John');
      COMMIT;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.map((r: any) => r.action);
      expect(actions).toContain('BEGIN');
      expect(actions).toContain('COMMIT');
    });

    test('should handle BEGIN ... ROLLBACK sequence', () => {
      const sql = `BEGIN;
      DELETE FROM users;
      ROLLBACK;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.map((r: any) => r.action);
      expect(actions).toContain('BEGIN');
      expect(actions).toContain('ROLLBACK');
    });

    test('should handle SAVEPOINT sequences', () => {
      const sql = `BEGIN;
      SAVEPOINT sp1;
      INSERT INTO users (name) VALUES ('John');
      ROLLBACK TO SAVEPOINT sp1;
      COMMIT;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.map((r: any) => r.action);
      expect(actions).toContain('BEGIN');
      expect(actions).toContain('SAVEPOINT');
      expect(actions).toContain('ROLLBACK');
      expect(actions).toContain('COMMIT');
    });

    test('should handle multiple SAVEPOINTs', () => {
      const sql = `SAVEPOINT sp1;
      SAVEPOINT sp2;
      RELEASE SAVEPOINT sp1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const savepoints = result
        .filter((r: any) => r.savepointName)
        .map((r: any) => r.savepointName);
      expect(savepoints).toContain('sp1');
      expect(savepoints).toContain('sp2');
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle transaction with data modifications', () => {
      const sql = `BEGIN;
      INSERT INTO logs (message) VALUES ('Operation started');
      UPDATE stats SET count = count + 1;
      DELETE FROM temp WHERE expired = true;
      COMMIT;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const beginCount = result.filter((r: any) => r.action === 'BEGIN').length;
      const commitCount = result.filter((r: any) => r.action === 'COMMIT').length;
      expect(beginCount).toBe(1);
      expect(commitCount).toBe(1);
    });

    test('should handle rolled-back operations', () => {
      const sql = `BEGIN;
      INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
      INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com');
      ROLLBACK;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const rollbackCount = result.filter(
        (r: any) => r.action === 'ROLLBACK'
      ).length;
      expect(rollbackCount).toBe(1);
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure for BEGIN', () => {
      const sql = 'BEGIN;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('statementIndex');
      expect(stmt).not.toHaveProperty('table');
    });

    test('should have correct output structure for SAVEPOINT', () => {
      const sql = 'SAVEPOINT sp1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('savepointName');
      expect(stmt).toHaveProperty('statementIndex');
    });

    test('should return minified JSON', () => {
      const sql = 'BEGIN;';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });
  });
});
