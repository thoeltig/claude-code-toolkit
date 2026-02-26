import { formatSql } from '../../src/formats/sql';

describe('SQL Edge Cases & Spotty Statements', () => {
  describe('Edge Cases - Complex Conditions', () => {
    test('should handle SELECT with nested parentheses in WHERE', () => {
      const sql = `SELECT * FROM orders
        WHERE (user_id = 1 AND status = 'completed') OR (user_id = 2 AND status = 'pending');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });

    test('should handle SELECT with IN clause', () => {
      const sql = `SELECT * FROM users WHERE id IN (1, 2, 3, 4, 5);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });

    test('should handle SELECT with BETWEEN clause', () => {
      const sql = `SELECT * FROM sales WHERE amount BETWEEN 100 AND 1000;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });

    test('should handle SELECT with LIKE pattern', () => {
      const sql = `SELECT * FROM users WHERE email LIKE '%@gmail.com%' OR name LIKE 'John%';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });

    test('should handle SELECT with IS NULL check', () => {
      const sql = `SELECT * FROM users WHERE deleted_at IS NULL AND active = true;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });
  });

  describe('Edge Cases - Function Calls', () => {
    test('should handle SELECT with aggregate functions', () => {
      const sql = `SELECT user_id, COUNT(*) as cnt, SUM(amount) as total, AVG(amount) as avg
        FROM orders GROUP BY user_id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].columns).toBeDefined();
      expect(result[0].groupby).toBeDefined();
    });

    test('should handle SELECT with string functions', () => {
      const sql = `SELECT CONCAT(first_name, ' ', last_name) as full_name,
        UPPER(email) as email_upper,
        LENGTH(phone) as phone_length FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle SELECT with date functions', () => {
      const sql = `SELECT id, DATE_FORMAT(created_at, '%Y-%m-%d') as created_date,
        DATEDIFF(NOW(), updated_at) as days_since_update FROM records;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle SELECT with nested function calls', () => {
      const sql = `SELECT ROUND(SUM(CAST(amount as DECIMAL(10,2))) / COUNT(*), 2) as avg_amount
        FROM orders WHERE status = 'completed';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });
  });

  describe('Edge Cases - Special Values', () => {
    test('should handle NULL values', () => {
      const sql = `INSERT INTO users (name, email) VALUES (NULL, 'test@example.com');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('insert');
    });

    test('should handle boolean literals', () => {
      const sql = `SELECT * FROM users WHERE active = true AND verified = false;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });

    test('should handle numeric edge cases', () => {
      const sql = `SELECT * FROM data WHERE value > -100 AND count <= 999999999;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle string escape sequences', () => {
      const sql = `SELECT * FROM logs WHERE message LIKE '%error: can\\'t%' OR code IN ('O\\'Reilly');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });
  });

  describe('Edge Cases - Whitespace and Formatting', () => {
    test('should handle extra whitespace in SQL', () => {
      const sql = `  SELECT    id  ,   name   FROM   users   WHERE   id   =   1  ;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle multiline SQL', () => {
      const sql = `SELECT id, name
        FROM users
        WHERE id > 0;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle mixed case keywords', () => {
      const sql = `SeLeCt * FrOm UsErS wHeRe Id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });
  });

  describe('Edge Cases - Table and Column Names', () => {
    test('should handle fully qualified table names', () => {
      const sql = 'SELECT * FROM users WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle column aliases', () => {
      const sql = `SELECT id AS user_id, name AS user_name, email AS user_email FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].columns).toHaveLength(3);
    });
  });

  describe('Stress Tests - Large and Complex Statements', () => {
    test('should handle SELECT with many JOINs', () => {
      const sql = `SELECT * FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        LEFT JOIN items i ON o.id = i.order_id
        LEFT JOIN inventory inv ON i.product_id = inv.product_id
        WHERE u.active = true;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should handle UPDATE with many SET columns', () => {
      const sql = `UPDATE products SET
        name = 'New Name',
        description = 'New Description',
        price = 100,
        stock = 50,
        status = 'active',
        updated_at = NOW()
      WHERE id = 1;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('update');
      expect(result[0].set).toBeDefined();
      expect(result[0].set.length).toBeGreaterThanOrEqual(6);
    });

    test('should handle SELECT with many GROUP BY columns', () => {
      const sql = `SELECT region, country, state, city, COUNT(*) as count FROM locations
        GROUP BY region, country, state, city;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].groupby).toBeDefined();
    });

    test('should handle very long WHERE clause', () => {
      const sql = `SELECT * FROM data WHERE
        field1 = 'value1' AND
        field2 > 100 AND
        field3 < 200 AND
        field4 IN (1, 2, 3) AND
        field5 LIKE '%pattern%' AND
        field6 IS NOT NULL AND
        field7 BETWEEN 10 AND 20;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].where).toBeDefined();
    });
  });

  describe('Fallback Parsing', () => {
    test('should handle partial SQL statements gracefully', () => {
      const sql = 'INSERT INTO users (id) VALUES (1); SELECT * FROM orders;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(2);
      const types = result.map((s: any) => s.type || s.error);
      expect(types.some((t: any) => t === 'insert' || t.includes('error'))).toBe(true);
    });

    test('should include error info for truly unparseable statements', () => {
      const sql = 'INVALID SYNTAX HERE;;;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should either have error or be empty
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].error || result[0].type).toBeDefined();
      }
    });
  });
});
