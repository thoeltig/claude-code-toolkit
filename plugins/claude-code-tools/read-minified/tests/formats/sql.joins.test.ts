import { formatSql } from '../../src/formats/sql';

describe('SQL JOIN Parsing', () => {
  describe('Basic JOIN Types', () => {
    test('should parse implicit INNER JOIN', () => {
      const sql = 'SELECT u.id, u.name FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('users');
      expect(result[0].joins).toBeDefined();
      expect(result[0].joins).toHaveLength(1);
      expect(result[0].joins[0].type).toBe('INNER');
      expect(result[0].joins[0].table).toBe('orders');
      expect(result[0].joins[0].alias).toBe('o');
      expect(result[0].joins[0].condition).toBeDefined();
    });

    test('should parse explicit INNER JOIN', () => {
      const sql = 'SELECT * FROM users INNER JOIN orders ON users.id = orders.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toHaveLength(1);
      expect(result[0].joins[0].type).toBe('INNER');
      expect(result[0].joins[0].table).toBe('orders');
    });

    test('should parse LEFT JOIN', () => {
      const sql = 'SELECT u.id FROM users u LEFT JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].type).toBe('LEFT');
      expect(result[0].joins[0].table).toBe('orders');
      expect(result[0].joins[0].alias).toBe('o');
    });

    test('should parse RIGHT JOIN', () => {
      const sql = 'SELECT * FROM users u RIGHT JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].type).toBe('RIGHT');
      expect(result[0].joins[0].table).toBe('orders');
    });

    test('should parse LEFT OUTER JOIN', () => {
      const sql = 'SELECT * FROM users u LEFT OUTER JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].type).toBe('LEFT');
      expect(result[0].joins[0].table).toBe('orders');
    });

    test('should parse RIGHT OUTER JOIN', () => {
      const sql = 'SELECT * FROM users u RIGHT OUTER JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].type).toBe('RIGHT');
      expect(result[0].joins[0].table).toBe('orders');
    });

    test('should parse FULL OUTER JOIN', () => {
      const sql = 'SELECT * FROM users u FULL OUTER JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].type).toBe('FULL OUTER');
      expect(result[0].joins[0].table).toBe('orders');
    });
  });

  describe('JOIN Conditions', () => {
    test('should parse simple equality condition', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].condition).toContain('u.id');
      expect(result[0].joins[0].condition).toContain('o.user_id');
    });

    test('should preserve ON condition text', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].condition).toBeDefined();
    });

    test('should handle comparison operators in conditions', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].condition).toBeDefined();
    });
  });

  describe('JOIN with Aliases', () => {
    test('should parse JOIN with table alias using AS keyword', () => {
      const sql = 'SELECT * FROM users AS u JOIN orders AS o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].alias).toBe('o');
    });

    test('should parse JOIN with space-based table alias', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].alias).toBe('o');
    });

    test('should parse JOIN without alias', () => {
      const sql = 'SELECT * FROM users JOIN orders ON users.id = orders.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].table).toBe('orders');
      expect(result[0].joins[0].alias).toBeUndefined();
    });
  });

  describe('Multiple JOINs', () => {
    test('should parse two JOINs', () => {
      const sql = `SELECT *
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN products p ON o.product_id = p.id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toHaveLength(2);
      expect(result[0].joins[0].table).toBe('orders');
      expect(result[0].joins[1].table).toBe('products');
    });

    test('should parse three JOINs with mixed types', () => {
      const sql = `SELECT *
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        INNER JOIN products p ON o.product_id = p.id
        RIGHT JOIN categories c ON p.category_id = c.id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toHaveLength(3);
      expect(result[0].joins[0].type).toBe('LEFT');
      expect(result[0].joins[1].type).toBe('INNER');
      expect(result[0].joins[2].type).toBe('RIGHT');
    });

    test('should parse multiple JOINs with different aliases', () => {
      const sql = `SELECT u.id, o.id, p.id
        FROM users u
        JOIN orders o ON u.id = o.user_id
        JOIN products p ON o.product_id = p.id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].alias).toBe('o');
      expect(result[0].joins[1].alias).toBe('p');
    });
  });

  describe('JOINs with Column Aliases', () => {
    test('should parse JOINs and column aliases together', () => {
      const sql = 'SELECT u.id AS user_id, o.id AS order_id FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columnAliases).toBeDefined();
      expect(result[0].joins).toBeDefined();
      expect(result[0].columnAliases).toHaveLength(2);
      expect(result[0].joins).toHaveLength(1);
    });

    test('should parse JOINs with WHERE and column aliases', () => {
      const sql = 'SELECT u.id AS user_id FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = "active";';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columnAliases).toBeDefined();
      expect(result[0].joins).toBeDefined();
      expect(result[0].where).toBeDefined();
    });
  });

  describe('JOINs with GROUP BY', () => {
    test('should parse JOINs with GROUP BY', () => {
      const sql = 'SELECT u.status, COUNT(*) FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.status;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].groupByColumns).toEqual(['u.status']);
    });

    test('should parse JOINs with GROUP BY and HAVING', () => {
      const sql = `SELECT u.status, COUNT(*) cnt
        FROM users u
        JOIN orders o ON u.id = o.user_id
        GROUP BY u.status
        HAVING COUNT(*) > 5;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].groupByColumns).toEqual(['u.status']);
      expect(result[0].havingClause).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    test('should still parse SELECT without JOINs', () => {
      const sql = 'SELECT id, name FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('users');
      expect(result[0].columns).toEqual(['id', 'name']);
      expect(result[0].joins).toBeUndefined();
    });

    test('should maintain zero information loss with complex JOINs', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE o.total > 100 AND o.status IN (SELECT status FROM active_orders);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should capture basic JOINs
      expect(result[0].joins).toBeDefined();
      // Complex conditions should be in unparsedContent
      expect(result[0].unparsedContent).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle JOIN with whitespace variations', () => {
      const sql = 'SELECT * FROM users u   JOIN   orders o   ON   u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].joins[0].table).toBe('orders');
    });

    test('should handle case insensitivity', () => {
      const sql = 'select * from users u join orders o on u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].joins[0].type).toBe('INNER');
    });

    test('should handle mixed case JOIN keywords', () => {
      const sql = 'SELECT * FROM users u LeFt JoIn orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins[0].type).toBe('LEFT');
    });

    test('should handle JOIN ending with semicolon', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
    });

    test('should handle JOIN followed by WHERE', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id WHERE u.status = "active";';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].where).toBeDefined();
    });

    test('should handle JOIN followed by GROUP BY', () => {
      const sql = 'SELECT * FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].groupByColumns).toBeDefined();
    });
  });

  describe('Complex Real-World JOINs', () => {
    test('should parse e-commerce JOIN pattern', () => {
      const sql = `SELECT
        u.id AS user_id,
        u.name AS user_name,
        COUNT(o.id) AS order_count
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.name
      HAVING COUNT(o.id) > 0;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columnAliases).toBeDefined();
      expect(result[0].joins).toBeDefined();
      expect(result[0].joins[0].type).toBe('LEFT');
      expect(result[0].groupByColumns).toBeDefined();
    });

    test('should parse multi-table JOIN', () => {
      const sql = `SELECT u.name, p.product_name, c.category_name
      FROM users u
      JOIN orders o ON u.id = o.user_id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toHaveLength(4);
      expect(result[0].joins.map((j: any) => j.table)).toEqual(['orders', 'order_items', 'products', 'categories']);
    });
  });
});
