import { formatSql } from '../../src/formats/sql';

describe('SQL SELECT Statement Parsing', () => {
  describe('SELECT Detection and Parsing', () => {
    test('should parse simple SELECT statement', () => {
      const sql = 'SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].table).toBe('users');
    });

    test('should parse multiple SELECT statements', () => {
      const sql = `SELECT * FROM users;
      SELECT id, name FROM products;
      SELECT COUNT(*) FROM logs;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result.every((r: any) => r.actions[0].action === 'SELECT')).toBe(true);
      expect(result[0].table).toBe('users');
      expect(result[1].table).toBe('products');
      expect(result[2].table).toBe('logs');
    });

    test('should parse SELECT with column list', () => {
      const sql = 'SELECT id, name, email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
    });

    test('should parse SELECT * (wildcard)', () => {
      const sql = 'SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Wildcard SELECT has no columns list
      expect(result[0].actions[0].columns).toBeUndefined();
    });

    test('should include SELECT when mixed with INSERT', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      SELECT * FROM users;
      INSERT INTO products (name) VALUES ('Widget');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      // First group: INSERT and SELECT on users table
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('INSERT');
      expect(result[0].actions[1].action).toBe('SELECT');
      // Second group: INSERT on products table
      expect(result[1].table).toBe('products');
      expect(result[1].actions[0].action).toBe('INSERT');
    });
  });

  describe('SELECT with WHERE Clause', () => {
    test('should parse SELECT with WHERE', () => {
      const sql = 'SELECT * FROM users WHERE active = true;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[0].where).toBe('active = true');
    });

    test('should parse SELECT with complex WHERE', () => {
      const sql = 'SELECT id, name FROM users WHERE age > 18 AND status = \'active\';';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[0].columns).toEqual(['id', 'name']);
      expect(result[0].actions[0].where).toContain('AND');
    });

    test('should parse SELECT with IN clause', () => {
      const sql = 'SELECT * FROM products WHERE category IN (\'electronics\', \'books\');';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('IN');
    });

    test('should parse SELECT with LIKE clause', () => {
      const sql = "SELECT * FROM users WHERE email LIKE '%@example.com';";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('LIKE');
    });

    test('should parse SELECT with date comparison', () => {
      const sql = 'SELECT * FROM orders WHERE created_at > \'2025-01-01\';';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('>');
    });
  });

  describe('SELECT with CREATE', () => {
    test('should include both CREATE and SELECT on same table', () => {
      const sql = `CREATE TABLE users (id INT);
      SELECT * FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('CREATE');
      expect(result[0].actions[1].action).toBe('SELECT');
    });

    test('should include CREATE and SELECT on different tables', () => {
      const sql = `CREATE TABLE users (id INT);
      SELECT * FROM products;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('CREATE');
      expect(result[0].table).toBe('users');
      expect(result[1].actions[0].action).toBe('SELECT');
      expect(result[1].table).toBe('products');
    });
  });

  describe('SELECT with other operations', () => {
    test('should parse mixed CREATE, INSERT, SELECT, UPDATE, DELETE', () => {
      const sql = `CREATE TABLE users (id INT);
      INSERT INTO users VALUES (1);
      SELECT * FROM users;
      UPDATE users SET active = true;
      DELETE FROM users WHERE id > 100;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(5);
      const actions = result[0].actions.map((a: any) => a.action);
      expect(actions).toEqual(['CREATE', 'INSERT', 'SELECT', 'UPDATE', 'DELETE']);
    });

    test('should handle SELECT with string literals containing FROM', () => {
      const sql = `SELECT * FROM users WHERE name = 'John FROM New York';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].table).toBe('users');
    });
  });

  describe('SELECT detection with comments', () => {
    test('should handle SELECT with line comments', () => {
      const sql = `-- Get all users
      SELECT * FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('SELECT');
    });

    test('should handle SELECT with block comments', () => {
      const sql = `/* Fetch user data */ SELECT * FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('SELECT');
    });
  });

  describe('SELECT edge cases', () => {
    test('should handle SELECT case insensitive', () => {
      const sql = 'select id, name from users where active = true;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('SELECT');
    });

    test('should handle SELECT with whitespace variations', () => {
      const sql = `SELECT   id,   name   FROM   users   WHERE   status = 'active' ;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].table).toBe('users');
    });

    test('should handle SELECT with multiline formatting', () => {
      const sql = `SELECT
        id,
        name,
        email
      FROM users
      WHERE active = true;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
    });

    test('should preserve WHERE clause exactly as written', () => {
      const sql = `SELECT * FROM logs WHERE   level = 'ERROR'  OR created_at < '2025-01-01' ;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('ERROR');
      expect(result[0].actions[0].where).toContain('OR');
    });
  });

  describe('SELECT with column expressions (basic)', () => {
    test('should skip columns with function calls (like COUNT)', () => {
      const sql = 'SELECT COUNT(*) FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Function calls are excluded from simple column extraction
      expect(result[0].actions[0].columns).toBeUndefined();
    });

    test('should handle simple column selections', () => {
      const sql = 'SELECT user_id, product_id, quantity FROM orders;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['user_id', 'product_id', 'quantity']);
    });
  });
});
