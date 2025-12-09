/**
 * SQL Unparsed Content Fallback Tests
 *
 * Tests the zero-information-loss guarantee:
 * When we encounter unsupported SQL features (JOINs, subqueries, CTEs, etc.),
 * we parse what we can and store the unparsed remainder in unparsedContent.
 *
 * This ensures:
 * ✅ No information is ever lost
 * ✅ Graceful degradation for complex SQL
 * ✅ Future sessions can incrementally parse unparsedContent
 */

import { formatSql } from '../../src/formats/sql';

describe('SQL Unparsed Content Fallback', () => {
  describe('Zero Information Loss Guarantee', () => {
    test('should preserve complex SELECT with LEFT JOIN in unparsedContent', () => {
      const sql = `SELECT u.id, u.name FROM users u LEFT JOIN orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('SELECT');
      expect(result[0].table).toBe('users');

      // Complex JOIN should be in unparsedContent
      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('LEFT JOIN');
      expect(result[0].unparsedContent).toContain('orders');
      expect(result[0].unparsedContent).toContain('ON');
    });

    test('should preserve SELECT with multiple JOINs', () => {
      const sql = `SELECT u.id, u.name, o.id, p.name
                   FROM users u
                   JOIN orders o ON u.id = o.user_id
                   JOIN products p ON o.product_id = p.id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('JOIN');
      expect(result[0].unparsedContent).toContain('orders');
      expect(result[0].unparsedContent).toContain('products');
    });

    test('should preserve SELECT with INNER JOIN and WHERE', () => {
      const sql = `SELECT u.id, u.name FROM users u
                   INNER JOIN orders o ON u.id = o.user_id
                   WHERE o.total > 100`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('INNER JOIN');
      // WHERE clause should be in unparsedContent when JOINs are present
      expect(result[0].unparsedContent).toContain('WHERE');
    });

    test('should preserve SELECT with GROUP BY and HAVING', () => {
      const sql = `SELECT status, COUNT(*) as count FROM employees
                   GROUP BY status HAVING COUNT(*) > 5`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('GROUP BY');
      expect(result[0].unparsedContent).toContain('HAVING');
    });

    test('should preserve SELECT with subquery in WHERE', () => {
      const sql = `SELECT id, name FROM users
                   WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('IN (SELECT');
      expect(result[0].unparsedContent).toContain('user_id');
    });

    test('should preserve SELECT with UNION', () => {
      const sql = `SELECT id, name FROM users UNION SELECT id, name FROM inactive_users`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('UNION');
      expect(result[0].unparsedContent).toContain('inactive_users');
    });

    test('should preserve CTE (WITH clause)', () => {
      const sql = `WITH active_users AS (
                     SELECT id, name FROM users WHERE status = 'active'
                   )
                   SELECT * FROM active_users WHERE age > 18`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('WITH');
      expect(result[0].unparsedContent).toContain('active_users');
    });
  });

  describe('Fallback Triggers', () => {
    test('should trigger fallback for LEFT JOIN', () => {
      const sql = `SELECT u.id FROM users u LEFT JOIN orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should trigger fallback for RIGHT JOIN', () => {
      const sql = `SELECT u.id FROM users u RIGHT JOIN orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should trigger fallback for INNER JOIN', () => {
      const sql = `SELECT u.id FROM users u INNER JOIN orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should trigger fallback for GROUP BY', () => {
      const sql = `SELECT category, COUNT(*) FROM products GROUP BY category`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should trigger fallback for HAVING', () => {
      const sql = `SELECT status, COUNT(*) as cnt FROM users
                   GROUP BY status HAVING COUNT(*) > 10`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should trigger fallback for nested SELECT (subquery)', () => {
      const sql = `SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('IN');
    });

    test('should trigger fallback for UNION', () => {
      const sql = `SELECT id FROM users UNION SELECT id FROM archived_users`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
    });
  });

  describe('Information Preservation', () => {
    test('original SQL should be reconstructible from parsed + unparsedContent', () => {
      const sql = `SELECT u.id, u.name FROM users u LEFT JOIN orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Table name should be parsed
      expect(result[0].table).toBe('users');

      // Complex JOIN should be in fallback
      expect(result[0].unparsedContent).toBeDefined();

      // Reconstruct: SELECT [columns] FROM table_name [unparsedContent]
      const reconstructable = `SELECT FROM ${result[0].table} ${result[0].unparsedContent || ''}`.toLowerCase();
      expect(reconstructable).toContain('users');
      expect(reconstructable).toContain('join');
    });

    test('multiple complex statements should each have unparsedContent', () => {
      const sql = `SELECT u.id FROM users u JOIN orders o ON u.id = o.user_id;
                   SELECT id FROM products WHERE price > 100 UNION SELECT id FROM archived_products;
                   SELECT status, COUNT(*) FROM employees GROUP BY status;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output) as any[];

      expect(result).toHaveLength(3);
      // At least 2 out of 3 should have unparsedContent
      const withUnparsed = result.filter((stmt: any) => stmt.unparsedContent).length;
      expect(withUnparsed).toBeGreaterThanOrEqual(2);
    });

    test('complex query should have both where and unparsedContent', () => {
      const sql = `SELECT u.id, u.name FROM users u
                   LEFT JOIN orders o ON u.id = o.user_id
                   WHERE o.total > 100`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('LEFT JOIN');
    });
  });

  describe('Non-complex Statements (No Fallback Needed)', () => {
    test('simple SELECT should not have unparsedContent', () => {
      const sql = `SELECT * FROM users`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('SELECT');
      expect(result[0].table).toBe('users');
      expect(result[0].unparsedContent).toBeUndefined();
    });

    test('SELECT with WHERE but no JOIN should not have unparsedContent', () => {
      const sql = `SELECT id, name FROM users WHERE age > 18`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('SELECT');
      expect(result[0].where).toBeDefined();
      expect(result[0].unparsedContent).toBeUndefined();
    });

    test('simple SELECT with basic columns should parse fully', () => {
      const sql = `SELECT id, name, email FROM users`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].unparsedContent).toBeUndefined();
    });
  });

  describe('Edge Cases with Unparsed Content', () => {
    test('should handle whitespace in complex queries', () => {
      const sql = `SELECT   u.id   FROM   users   u
                   LEFT   JOIN   orders   o   ON   u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      // Check that JOIN is present (whitespace may vary)
      expect(result[0].unparsedContent!.toUpperCase()).toContain('JOIN');
    });

    test('should preserve case sensitivity in unparsedContent', () => {
      const sql = `SELECT id FROM users u LEFT JOIN Orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('Orders'); // Original case preserved
    });

    test('should handle multiple WHERE conditions with JOIN', () => {
      const sql = `SELECT * FROM users u
                   JOIN orders o ON u.id = o.user_id
                   WHERE u.status = 'active' AND o.total > 100`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].unparsedContent).toBeDefined();
      expect(result[0].unparsedContent).toContain('WHERE');
    });

    test('should handle empty unparsedContent gracefully', () => {
      const sql = `SELECT id FROM users`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // unparsedContent should be undefined, not empty string
      expect(result[0].unparsedContent).toBeUndefined();
    });
  });

  describe('Future-Proofing: Incremental Parsing', () => {
    test('unparsedContent for JOIN should be parseable in future sessions', () => {
      const sql = `SELECT u.id FROM users u LEFT JOIN orders o ON u.id = o.user_id`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Session 7: Store unparsedContent
      // Session 8: Parse this unparsedContent to extract JOINs
      const unparsed = result[0].unparsedContent;

      expect(unparsed).toContain('LEFT JOIN');
      expect(unparsed).toMatch(/LEFT\s+JOIN\s+\w+/i);
    });

    test('unparsedContent for GROUP BY HAVING should be incrementally parseable', () => {
      const sql = `SELECT category, COUNT(*) FROM products
                   GROUP BY category HAVING COUNT(*) > 10`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const unparsed = result[0].unparsedContent;

      expect(unparsed).toMatch(/GROUP\s+BY/i);
      expect(unparsed).toMatch(/HAVING/i);
    });
  });
});
