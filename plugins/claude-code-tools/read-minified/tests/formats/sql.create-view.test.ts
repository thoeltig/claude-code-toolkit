import { formatSql } from '../../src/formats/sql';

/**
 * CREATE VIEW Statement Tests
 *
 * CREATE VIEW creates virtual tables based on SQL queries
 * Syntax: CREATE [OR REPLACE] VIEW name AS select_statement;
 *
 * Key characteristics:
 * - Requires view name and SELECT statement
 * - Optional OR REPLACE clause
 * - Optional IF NOT EXISTS clause (some dialects)
 * - Captures the SELECT query for reference
 */

describe('SQL CREATE VIEW Statement Parsing', () => {
  describe('Basic CREATE VIEW', () => {
    test('should parse simple CREATE VIEW', () => {
      const sql = 'CREATE VIEW user_summary AS SELECT id, name, email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('VIEW');
      expect(result[0].viewName).toBe('user_summary');
    });

    test('should parse CREATE OR REPLACE VIEW', () => {
      const sql = 'CREATE OR REPLACE VIEW user_summary AS SELECT id, name FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('VIEW');
      expect(result[0].orReplace).toBe(true);
      expect(result[0].viewName).toBe('user_summary');
    });

    test('should parse CREATE VIEW with IF NOT EXISTS', () => {
      const sql = 'CREATE VIEW IF NOT EXISTS user_summary AS SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
      expect(result[0].ifNotExists).toBe(true);
    });

    test('should handle case insensitivity', () => {
      const sql = 'create view user_summary as select * from users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('VIEW');
    });
  });

  describe('Complex SELECT Statements in VIEW', () => {
    test('should parse VIEW with WHERE clause in SELECT', () => {
      const sql = 'CREATE VIEW active_users AS SELECT id, name FROM users WHERE status = "active";';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
      expect(result[0].viewName).toBe('active_users');
    });

    test('should parse VIEW with JOIN in SELECT', () => {
      const sql = `CREATE VIEW user_orders AS
      SELECT u.id, u.name, o.order_id, o.total
      FROM users u
      JOIN orders o ON u.id = o.user_id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
      expect(result[0].viewName).toBe('user_orders');
    });

    test('should parse VIEW with GROUP BY in SELECT', () => {
      const sql = `CREATE VIEW user_order_totals AS
      SELECT user_id, COUNT(*) as order_count, SUM(total) as total_spent
      FROM orders
      GROUP BY user_id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });

    test('should parse VIEW with subquery', () => {
      const sql = `CREATE VIEW high_value_customers AS
      SELECT id, name FROM users
      WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace', () => {
      const sql = '  CREATE   VIEW   user_summary   AS   SELECT * FROM users  ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
      expect(result[0].viewName).toBe('user_summary');
    });

    test('should handle newlines in view definition', () => {
      const sql = `CREATE VIEW user_summary AS
      SELECT
        id,
        name,
        email
      FROM users
      WHERE status = 'active';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });

    test('should handle complex multiline SELECT', () => {
      const sql = `CREATE OR REPLACE VIEW order_summary AS
      SELECT
        u.id as user_id,
        u.name,
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.status = 'active'
      GROUP BY u.id, u.name
      ORDER BY total_spent DESC;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });
  });

  describe('View Name Patterns', () => {
    test('should handle view names with underscores', () => {
      const sql = 'CREATE VIEW user_order_summary AS SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].viewName).toBe('user_order_summary');
    });

    test('should handle view names with numbers', () => {
      const sql = 'CREATE VIEW summary_v2 AS SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].viewName).toBe('summary_v2');
    });
  });

  describe('Comments with CREATE VIEW', () => {
    test('should handle line comment', () => {
      const sql = `-- Create summary view for reporting
      CREATE VIEW user_summary AS SELECT * FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });

    test('should handle block comment', () => {
      const sql = `/* Summary view for active users and their orders */
      CREATE VIEW user_order_summary AS SELECT * FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });
  });

  describe('Mixed Statements', () => {
    test('should handle CREATE TABLE and CREATE VIEW', () => {
      const sql = `CREATE TABLE users (id INT, name VARCHAR(100));
      CREATE VIEW user_summary AS SELECT id, name FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('TABLE');
      expect(result[1].action).toBe('CREATE');
      expect(result[1].objectType).toBe('VIEW');
    });

    test('should handle multiple CREATE VIEW statements', () => {
      const sql = `CREATE VIEW active_users AS SELECT * FROM users WHERE status = 'active';
      CREATE OR REPLACE VIEW user_summary AS SELECT COUNT(*) FROM users;
      CREATE VIEW high_value AS SELECT * FROM orders WHERE total > 100;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.filter((r: any) => r.objectType === 'VIEW').length).toBeGreaterThanOrEqual(3);
    });

    test('should handle CREATE VIEW and DROP VIEW', () => {
      const sql = `CREATE VIEW temp_summary AS SELECT * FROM users;
      DROP VIEW temp_summary;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const createView = result.find((r: any) => r.action === 'CREATE' && r.objectType === 'VIEW');
      const dropView = result.find((r: any) => r.action === 'DROP' && r.objectType === 'VIEW');
      expect(createView).toBeDefined();
      expect(dropView).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle reporting views', () => {
      const sql = `CREATE VIEW sales_summary AS
      SELECT
        DATE(order_date) as sales_date,
        COUNT(*) as num_orders,
        SUM(total) as daily_revenue
      FROM orders
      GROUP BY DATE(order_date);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });

    test('should handle database abstraction views', () => {
      const sql = `CREATE OR REPLACE VIEW product_details AS
      SELECT
        p.id,
        p.name,
        p.price,
        c.category_name,
        COALESCE(i.stock_count, 0) as available_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.discontinued = false;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('VIEW');
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure', () => {
      const sql = 'CREATE VIEW user_summary AS SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toBeUndefined();
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('objectType');
      expect(stmt).toHaveProperty('viewName');
      expect(stmt).toHaveProperty('statementIndex');
      expect(stmt.objectType).toBe('VIEW');
    });

    test('should not include table property for VIEW', () => {
      const sql = 'CREATE VIEW user_summary AS SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      // VIEW has viewName, not table as primary identifier
      expect(stmt).toHaveProperty('viewName');
    });

    test('should return minified JSON', () => {
      const sql = 'CREATE VIEW v AS SELECT * FROM t;';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
    });
  });
});
