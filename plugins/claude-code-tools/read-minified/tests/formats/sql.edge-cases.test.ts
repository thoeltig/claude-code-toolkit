import { formatSql } from '../../src/formats/sql';

describe('SQL Edge Cases and Complex Scenarios', () => {
  describe('UPDATE with Complex WHERE Clauses', () => {
    test('should handle UPDATE with AND conditions', () => {
      const sql = 'UPDATE users SET status = \'active\' WHERE id > 10 AND role = \'admin\';';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].actions[0].where).toContain('AND');
      expect(result[0].actions[0].updates[0].value).toBe("'active'");
    });

    test('should handle UPDATE with OR conditions', () => {
      const sql = 'UPDATE logs SET archived = true WHERE level = \'DEBUG\' OR level = \'TRACE\';';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].actions[0].where).toContain('OR');
    });

    test('should handle UPDATE with comparison operators', () => {
      const sql = 'UPDATE products SET discount = 0.2 WHERE price > 100 AND stock <= 5;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].updates[0].column).toBe('discount');
      expect(result[0].actions[0].updates[0].value).toBe('0.2');
    });

    test('should handle UPDATE with IN clause', () => {
      const sql = 'UPDATE users SET verified = true WHERE id IN (1, 2, 3, 4, 5);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].where).toContain('IN');
    });

    test('should handle UPDATE with BETWEEN clause', () => {
      const sql = 'UPDATE orders SET status = \'shipped\' WHERE amount BETWEEN 100 AND 1000;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].where).toContain('BETWEEN');
    });

    test('should handle UPDATE with LIKE clause', () => {
      const sql = "UPDATE users SET marketing_opt_in = true WHERE email LIKE '%@example.com';";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].where).toContain('LIKE');
    });

    test('should handle UPDATE with IS NULL check', () => {
      const sql = 'UPDATE users SET last_login = NOW() WHERE last_login IS NULL;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].where).toContain('IS NULL');
    });

    test('should handle UPDATE with function calls in WHERE', () => {
      const sql = 'UPDATE accounts SET status = \'active\' WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].where).toContain('DATE_SUB');
    });
  });

  describe('UPDATE with Multiple Column Updates', () => {
    test('should parse all columns in UPDATE', () => {
      const sql = 'UPDATE users SET first_name = \'John\', last_name = \'Doe\', age = 30, active = true WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].updates).toHaveLength(4);
      expect(result[0].actions[0].updates.map((u: any) => u.column)).toEqual(['first_name', 'last_name', 'age', 'active']);
    });

    test('should handle numeric values in UPDATE', () => {
      const sql = 'UPDATE products SET price = 29.99, stock = 100, rating = 4.5 WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].updates).toHaveLength(3);
      expect(result[0].actions[0].updates[0].value).toBe('29.99');
      expect(result[0].actions[0].updates[1].value).toBe('100');
      expect(result[0].actions[0].updates[2].value).toBe('4.5');
    });

    test('should handle quoted values with special chars in UPDATE', () => {
      const sql = `UPDATE users SET bio = 'Developer at Big Corp', status = 'Active: working on project' WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].updates).toHaveLength(2);
    });

    test('should handle SQL-escaped quotes in UPDATE values', () => {
      const sql = `UPDATE users SET bio = 'It''s a wonderful day' WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].updates[0].value).toContain("''");
    });
  });

  describe('DELETE with Complex WHERE Clauses', () => {
    test('should handle DELETE with nested conditions', () => {
      const sql = 'DELETE FROM logs WHERE (level = \'ERROR\' AND retried = false) OR created_at < \'2025-01-01\';';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].actions[0].where).toContain('(');
    });

    test('should handle DELETE with IN clause', () => {
      const sql = 'DELETE FROM users WHERE status IN (\'inactive\', \'banned\', \'deleted\');';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('IN');
    });

    test('should handle DELETE without WHERE clause (cleanup)', () => {
      const sql = 'DELETE FROM temp_data;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should detect DELETE without WHERE
      expect(result).toHaveLength(1);
      expect(result[0].actions[0].action).toBe('DELETE');
      expect(result[0].actions[0].where).toBeUndefined();
    });

    test('should handle DELETE with date comparison', () => {
      const sql = 'DELETE FROM sessions WHERE expires_at < NOW();';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('NOW()');
    });
  });

  describe('INSERT and UPDATE Interaction', () => {
    test('should handle INSERT followed by UPDATE on same column', () => {
      const sql = `INSERT INTO users (id, name, status) VALUES (1, 'John', 'pending');
      UPDATE users SET status = 'active' WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('INSERT');
      expect(result[0].actions[1].action).toBe('UPDATE');
      expect(result[0].actions[1].where).toBe('id = 1');
    });

    test('should handle UPDATE before INSERT (unusual but valid)', () => {
      const sql = `UPDATE users SET login_count = login_count + 1 WHERE id = 1;
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].actions[1].action).toBe('INSERT');
    });

    test('should not group INSERT and UPDATE (different actions)', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      INSERT INTO users (id, name) VALUES (2, 'Jane');
      UPDATE users SET verified = true WHERE id = 1;
      INSERT INTO users (id, name) VALUES (3, 'Bob');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions).toHaveLength(3);
      expect(result[0].actions[0].action).toBe('INSERT');
      expect(result[0].actions[0].rowCount).toBe(2);
      expect(result[0].actions[1].action).toBe('UPDATE');
      expect(result[0].actions[2].action).toBe('INSERT');
      expect(result[0].actions[2].rowCount).toBe(1);
    });
  });

  describe('Multi-Table Operations', () => {
    test('should handle UPDATE on different tables', () => {
      const sql = `UPDATE users SET active = true WHERE id = 1;
      UPDATE products SET stock = 100 WHERE id = 5;
      UPDATE orders SET status = 'shipped' WHERE id = 10;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result.map((r: any) => r.table)).toEqual(['users', 'products', 'orders']);
    });

    test('should handle mixed CREATE, INSERT, UPDATE, DELETE', () => {
      const sql = `CREATE TABLE users (id INT);
      CREATE TABLE orders (id INT);
      INSERT INTO users (id) VALUES (1);
      INSERT INTO orders (id) VALUES (100);
      UPDATE users SET id = 2 WHERE id = 1;
      DELETE FROM orders WHERE id = 100;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.flatMap((r: any) => r.actions).map((a:any)=>a.action);
      expect(actions).toEqual(['CREATE', 'INSERT', 'UPDATE', 'CREATE', 'INSERT', 'DELETE']);
    });
  });

  describe('Whitespace and Formatting Handling', () => {
    test('should handle UPDATE with extra whitespace', () => {
      const sql = `UPDATE    users   SET    name   =   'John'    WHERE    id   =   1  ;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });

    test('should handle UPDATE with newlines in SET clause', () => {
      const sql = `UPDATE users SET
        name = 'John',
        email = 'john@example.com',
        active = true
      WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].updates).toHaveLength(3);
    });

    test('should handle DELETE with multiline WHERE clause', () => {
      const sql = `DELETE FROM logs
      WHERE
        level = 'ERROR'
        AND created_at < '2025-01-01'
        OR archived = true;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].where).toContain('ERROR');
      expect(result[0].actions[0].where).toContain('AND');
    });
  });

  describe('Comments in UPDATE/DELETE', () => {
    test('should handle comments before UPDATE', () => {
      const sql = `-- Update all inactive users
      UPDATE users SET active = false WHERE status = 'inactive';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('UPDATE');
    });

    test('should handle block comments in UPDATE', () => {
      const sql = `/* Set all old records as archived */
      UPDATE records SET archived = true WHERE created_at < '2020-01-01';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].actions[0].where).toContain('<');
    });

    test('should handle comments in DELETE', () => {
      const sql = `-- Remove old sessions
      DELETE FROM sessions WHERE expires_at < NOW(); -- Clean up expired`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DELETE');
    });
  });

  describe('Case Insensitivity', () => {
    test('should handle lowercase UPDATE', () => {
      const sql = 'update users set name = \'john\' where id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('UPDATE');
    });

    test('should handle mixed case UPDATE', () => {
      const sql = 'UpDaTe users SeT name = \'john\' WhErE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('UPDATE');
    });

    test('should handle lowercase DELETE', () => {
      const sql = 'delete from users where id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('DELETE');
    });
  });

  describe('Real-World SQL Dumps', () => {
    test('should handle migration script with multiple operations', () => {
      const sql = `CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO users (email) VALUES ('john@example.com'), ('jane@example.com');

      -- Fix duplicate emails
      UPDATE users SET email = 'john.old@example.com' WHERE id = 1;

      -- Audit trail
      DELETE FROM audit_logs WHERE created_at < '2025-01-01';`;

      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      const actions0 = result[0].actions.map((r: any) => r.action);
      expect(actions0).toContain('CREATE');
      expect(actions0).toContain('INSERT');
      expect(actions0).toContain('UPDATE');
      const actions1 = result[1].actions.map((r: any) => r.action);
      expect(actions1).toContain('DELETE');
    });

    test('should handle data export/import with transformations', () => {
      const sql = `-- Data transformation pipeline
      INSERT INTO archived_users (id, name, email, archived_at);
      SELECT id, name, email, NOW() FROM users WHERE status = 'deleted';

      UPDATE archived_users SET processed = true WHERE archived_at > '2025-01-01';

      DELETE FROM users WHERE id IN (
        SELECT user_id FROM archived_users WHERE processed = true
      );`;

      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].actions).toHaveLength(2);
      expect(result[1].actions).toHaveLength(2);
      const actions = result.flatMap((r: any) => r.actions).map((a:any)=>a.action);
      expect(actions).toEqual(['INSERT', 'UPDATE', 'SELECT', 'DELETE']);
    });
  });
});
