import { formatSql } from '../../src/formats/sql';

describe('SQL UPDATE and DELETE Parsing', () => {
  describe('UPDATE Statement Parsing', () => {
    test('should detect and parse simple UPDATE statement', () => {
      const sql = 'UPDATE users SET active = true WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].statementIndex).toBe(0);
    });

    test('should parse UPDATE with multiple columns', () => {
      const sql = 'UPDATE products SET name = \'Widget\', price = 19.99 WHERE id = 5;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('products');
    });

    test('should parse UPDATE case insensitive', () => {
      const sql = 'update users set name = \'John\' where id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle multiple UPDATE statements on same table', () => {
      const sql = `UPDATE users SET active = true WHERE status = 'pending';
      UPDATE users SET verified = true WHERE email_verified = true;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Consecutive UPDATE statements on same table are grouped
      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle UPDATE with string values containing quotes', () => {
      const sql = `UPDATE users SET bio = 'He said "hello"' WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle UPDATE with SQL escaped quotes', () => {
      const sql = `UPDATE users SET name = 'It''s working' WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
    });
  });

  describe('DELETE Statement Parsing', () => {
    test('should detect and parse simple DELETE statement', () => {
      const sql = 'DELETE FROM users WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].statementIndex).toBe(0);
    });

    test('should parse DELETE with complex WHERE clause', () => {
      const sql = 'DELETE FROM logs WHERE created_at < NOW() - INTERVAL 30 DAY;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].table).toBe('logs');
    });

    test('should parse DELETE case insensitive', () => {
      const sql = 'delete from users where status = "inactive";';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].table).toBe('users');
    });

    test('should handle multiple DELETE statements', () => {
      const sql = `DELETE FROM logs WHERE level = 'ERROR';
      DELETE FROM sessions WHERE expires_at < NOW();`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].table).toBe('logs');
      expect(result[1].actions[0].action).toBe('DELETE');
      expect(result[1].table).toBe('sessions');
    });

    test('should handle DELETE with string values containing quotes', () => {
      const sql = `DELETE FROM comments WHERE text = 'User said "goodbye"';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].table).toBe('comments');
    });

    test('should handle DELETE with SQL escaped quotes', () => {
      const sql = `DELETE FROM users WHERE name = 'It''s temporary';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
    });
  });

  describe('Mixed UPDATE and DELETE', () => {
    test('should handle CREATE, UPDATE, DELETE together', () => {
      const sql = `CREATE TABLE users (id INT, name VARCHAR(100));
      UPDATE users SET name = 'John' WHERE id = 1;
      DELETE FROM users WHERE id = 2;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(3);
      expect(result[0].actions[0].action).toBe('CREATE');
      expect(result[0].actions[1].action).toBe('UPDATE');
      expect(result[0].actions[2].action).toBe('DELETE');
    });

    test('should handle INSERT, UPDATE, DELETE in sequence', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      UPDATE users SET active = true WHERE id = 1;
      DELETE FROM users WHERE id = 2;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(3);
      expect(result[0].actions[0].action).toBe('INSERT');
      expect(result[0].actions[1].action).toBe('UPDATE');
      expect(result[0].actions[2].action).toBe('DELETE');
    });

    test('should include SELECT statements in output', () => {
      const sql = `SELECT * FROM users;
      UPDATE users SET active = true WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[1].action).toBe('UPDATE');
    });
  });
});
