import { formatSql } from '../../src/formats/sql';

/**
 * CREATE INDEX Statement Tests
 *
 * CREATE INDEX creates database indexes for faster query lookups
 * Syntax: CREATE [UNIQUE] INDEX name ON table (columns);
 *
 * Key characteristics:
 * - Requires index name, table name, and columns
 * - Optional UNIQUE constraint
 * - Optional IF NOT EXISTS clause
 */

describe('SQL CREATE INDEX Statement Parsing', () => {
  describe('Basic CREATE INDEX', () => {
    test('should parse simple CREATE INDEX', () => {
      const sql = 'CREATE INDEX users_email_idx ON users (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('INDEX');
      expect(result[0].indexName).toBe('users_email_idx');
      expect(result[0].table).toBe('users');
      expect(result[0].columns).toEqual(['email']);
    });

    test('should parse CREATE UNIQUE INDEX', () => {
      const sql = 'CREATE UNIQUE INDEX users_email_unique ON users (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('INDEX');
      expect(result[0].unique).toBe(true);
      expect(result[0].indexName).toBe('users_email_unique');
    });

    test('should parse CREATE INDEX with IF NOT EXISTS', () => {
      const sql = 'CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('INDEX');
      expect(result[0].ifNotExists).toBe(true);
    });

    test('should parse CREATE INDEX with multiple columns', () => {
      const sql = 'CREATE INDEX users_status_created_idx ON users (status, created_at);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toEqual(['status', 'created_at']);
    });

    test('should handle case insensitivity', () => {
      const sql = 'create index users_email_idx on users (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('INDEX');
    });
  });

  describe('Multiple Columns', () => {
    test('should parse composite index with 2 columns', () => {
      const sql = 'CREATE INDEX idx_user_status_date ON users (user_id, created_at);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toHaveLength(2);
      expect(result[0].columns).toEqual(['user_id', 'created_at']);
    });

    test('should parse composite index with 3+ columns', () => {
      const sql = 'CREATE INDEX idx_complex ON orders (customer_id, order_date, status, amount);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toHaveLength(4);
    });

    test('should preserve column order', () => {
      const sql = 'CREATE INDEX idx_order ON data (col_z, col_a, col_m);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toEqual(['col_z', 'col_a', 'col_m']);
    });
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace', () => {
      const sql = '  CREATE   INDEX   users_idx   ON   users   (email)  ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('INDEX');
      expect(result[0].indexName).toBe('users_idx');
    });

    test('should handle newlines', () => {
      const sql = `CREATE INDEX users_idx
      ON users
      (email);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('INDEX');
      expect(result[0].table).toBe('users');
      expect(result[0].columns).toEqual(['email']);
    });

    test('should handle spaces in column list', () => {
      const sql = 'CREATE INDEX idx ON t ( col1 , col2 , col3 );';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toEqual(['col1', 'col2', 'col3']);
    });
  });

  describe('Column Name Variations', () => {
    test('should handle underscored column names', () => {
      const sql = 'CREATE INDEX idx ON users (user_id, email_address);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toEqual(['user_id', 'email_address']);
    });

    test('should handle columns with numbers', () => {
      const sql = 'CREATE INDEX idx ON data (col1, col2, col3);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toEqual(['col1', 'col2', 'col3']);
    });
  });

  describe('Index Name Patterns', () => {
    test('should handle verbose index names', () => {
      const sql = 'CREATE INDEX idx_users_email_status ON users (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].indexName).toBe('idx_users_email_status');
    });

    test('should handle short index names', () => {
      const sql = 'CREATE INDEX idx1 ON t (c);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].indexName).toBe('idx1');
    });
  });

  describe('Comments with CREATE INDEX', () => {
    test('should handle line comment', () => {
      const sql = `-- Create index for email lookups
      CREATE INDEX users_email_idx ON users (email);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('INDEX');
    });

    test('should handle block comment', () => {
      const sql = `/* Index for faster queries */
      CREATE INDEX idx ON users (email);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('INDEX');
    });
  });

  describe('Mixed Statements', () => {
    test('should handle CREATE TABLE and CREATE INDEX', () => {
      const sql = `CREATE TABLE users (id INT, email VARCHAR(255));
      CREATE INDEX users_email_idx ON users (email);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('TABLE');
      expect(result[1].action).toBe('CREATE');
      expect(result[1].objectType).toBe('INDEX');
    });

    test('should handle multiple CREATE INDEX statements', () => {
      const sql = `CREATE INDEX idx_email ON users (email);
      CREATE INDEX idx_created ON users (created_at);
      CREATE UNIQUE INDEX idx_username ON users (username);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.filter((r: any) => r.objectType === 'INDEX').length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle database optimization workflow', () => {
      const sql = `CREATE TABLE products (id INT, name VARCHAR(255), price DECIMAL(10,2));
      CREATE INDEX idx_products_price ON products (price);
      CREATE UNIQUE INDEX idx_products_sku ON products (sku);
      INSERT INTO products (name, price) VALUES ('Widget', 9.99);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const indexCount = result.filter((r: any) => r.objectType === 'INDEX').length;
      expect(indexCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure', () => {
      const sql = 'CREATE INDEX users_email_idx ON users (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('objectType');
      expect(stmt).toHaveProperty('indexName');
      expect(stmt).toHaveProperty('table');
      expect(stmt).toHaveProperty('columns');
      expect(stmt).toHaveProperty('statementIndex');
    });

    test('should return minified JSON', () => {
      const sql = 'CREATE INDEX idx ON users (email);';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
    });
  });
});
