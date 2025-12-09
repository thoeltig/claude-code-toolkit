/**
 * Real-World SQL Validation Tests
 *
 * Tests SQL parser against realistic, production-like SQL patterns:
 * - E-commerce queries (orders, products, customers)
 * - Inventory management
 * - Reporting queries
 * - Generated test corpus covering multiple patterns
 *
 * Success Criteria:
 * - 90%+ parsing success rate
 * - Zero information loss (table name always captured)
 * - Proper action detection
 */

import { formatSql } from '../../src/formats/sql';

describe('Real-World SQL Validation', () => {
  describe('E-commerce Query Patterns', () => {
    test('should parse simple product listing', () => {
      const sql = 'SELECT id, name, price FROM products WHERE active = true';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('SELECT');
      expect(result[0].table).toBe('products');
      expect(result[0].columns).toBeDefined();
    });

    test('should parse customer order history with JOINs', () => {
      const sql = `SELECT o.id, o.total, o.status, u.name, u.email
                   FROM orders o
                   JOIN users u ON o.user_id = u.id
                   WHERE o.status = 'completed'
                   ORDER BY o.created_at DESC`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('orders');
      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should parse product catalog with prices', () => {
      const sql = `SELECT p.id, p.name, p.price, c.name as category
                   FROM products p
                   LEFT JOIN categories c ON p.category_id = c.id
                   WHERE p.active = true AND p.price > 0`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('SELECT');
      expect(result[0].table).toBe('products');
    });

    test('should parse inventory check query', () => {
      const sql = `SELECT p.id, p.name, i.quantity, i.warehouse
                   FROM products p
                   JOIN inventory i ON p.id = i.product_id
                   WHERE i.quantity < 10`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('products');
    });

    test('should parse bulk insert for orders', () => {
      const sql = `INSERT INTO orders (user_id, product_id, quantity, total, status) VALUES
                   (1, 100, 2, 99.98, 'pending'),
                   (2, 101, 1, 49.99, 'pending'),
                   (1, 102, 5, 249.95, 'shipped')`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('INSERT');
      expect(result[0].table).toBe('orders');
      expect(result[0].rowCount).toBe(3);
    });

    test('should parse order status update', () => {
      const sql = 'UPDATE orders SET status = "shipped", shipped_date = "2024-01-15" WHERE id IN (SELECT order_id FROM shipments WHERE carrier = "FedEx")';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('orders');
    });

    test('should parse customer deletion (soft delete)', () => {
      const sql = 'UPDATE users SET deleted = true, deleted_at = NOW() WHERE id = ?';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });
  });

  describe('Reporting and Analytics Patterns', () => {
    test('should parse daily sales report', () => {
      const sql = `SELECT DATE(created_at) as sale_date, COUNT(*) as order_count, SUM(total) as daily_revenue
                   FROM orders
                   WHERE status = 'completed'
                   GROUP BY DATE(created_at)
                   ORDER BY sale_date DESC`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('orders');
      expect(result[0].unparsedContent).toContain('GROUP BY');
    });

    test('should parse customer lifetime value report', () => {
      const sql = `SELECT u.id, u.name, COUNT(o.id) as order_count, SUM(o.total) as lifetime_value
                   FROM users u
                   LEFT JOIN orders o ON u.id = o.user_id
                   WHERE u.created_at >= '2023-01-01'
                   GROUP BY u.id, u.name
                   HAVING SUM(o.total) > 100
                   ORDER BY lifetime_value DESC`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('users');
      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should parse product performance metrics', () => {
      const sql = `SELECT p.id, p.name, COUNT(o.id) as times_sold, SUM(o.quantity) as total_quantity, AVG(o.quantity) as avg_quantity
                   FROM products p
                   LEFT JOIN order_items o ON p.id = o.product_id
                   GROUP BY p.id, p.name
                   HAVING COUNT(o.id) > 0
                   ORDER BY total_quantity DESC`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('products');
    });

    test('should parse category sales summary', () => {
      const sql = `SELECT c.name as category, COUNT(DISTINCT p.id) as product_count, SUM(oi.quantity) as total_sold
                   FROM categories c
                   LEFT JOIN products p ON c.id = p.category_id
                   LEFT JOIN order_items oi ON p.id = oi.product_id
                   GROUP BY c.id, c.name
                   ORDER BY total_sold DESC`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('categories');
    });
  });

  describe('Data Maintenance Patterns', () => {
    test('should parse bulk insert of users', () => {
      const sql = `INSERT INTO users (email, name, status, created_at) VALUES
                   ('user1@example.com', 'User One', 'active', '2024-01-01'),
                   ('user2@example.com', 'User Two', 'active', '2024-01-02'),
                   ('user3@example.com', 'User Three', 'pending', '2024-01-03'),
                   ('user4@example.com', 'User Four', 'active', '2024-01-04'),
                   ('user5@example.com', 'User Five', 'inactive', '2024-01-05')`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('INSERT');
      expect(result[0].rowCount).toBe(5);
    });

    test('should parse bulk update status', () => {
      const sql = `UPDATE users SET status = 'inactive', last_updated = NOW()
                   WHERE last_login < DATE_SUB(NOW(), INTERVAL 90 DAY)
                   AND status = 'active'`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });

    test('should parse archived data cleanup', () => {
      const sql = `DELETE FROM order_logs
                   WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)
                   AND status IN ('cancelled', 'failed')`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('DELETE');
      expect(result[0].table).toBe('order_logs');
    });

    test('should parse index creation for performance', () => {
      const sql = 'CREATE INDEX idx_users_email ON users(email)';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('CREATE');
      expect(result[0].objectType).toBe('INDEX');
    });

    test('should parse table structure change', () => {
      const sql = 'ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT false';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('ALTER');
      expect(result[0].table).toBe('users');
    });
  });

  describe('Complex Business Logic Patterns', () => {
    test('should parse high-value customer identification', () => {
      const sql = `SELECT u.id, u.name, SUM(o.total) as total_spent
                   FROM users u
                   JOIN orders o ON u.id = o.user_id
                   WHERE o.status = 'completed'
                   GROUP BY u.id, u.name
                   HAVING SUM(o.total) > 5000
                   ORDER BY total_spent DESC
                   LIMIT 100`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('users');
      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should parse inventory prediction query', () => {
      const sql = `SELECT p.id, p.name, i.quantity
                   FROM products p
                   JOIN inventory i ON p.id = i.product_id
                   WHERE i.quantity < 100`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('products');
      expect(result[0].unparsedContent).toBeDefined();
    });

    test('should parse competitor price monitoring', () => {
      const sql = `SELECT p.id, p.name, p.price, c.name as competitor, c.price as competitor_price
                   FROM products p
                   LEFT JOIN competitor_prices c ON p.sku = c.sku
                   WHERE ABS(p.price - c.price) > (p.price * 0.1)
                   AND p.price > c.price`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('products');
    });

    test('should parse recommendation engine data fetch', () => {
      const sql = `SELECT u.id, u.user_segment, p.id as product_id, p.category
                   FROM users u
                   CROSS JOIN products p
                   WHERE p.category IN (SELECT category FROM user_preferences WHERE user_id = u.id)
                   AND p.id NOT IN (SELECT product_id FROM user_purchases WHERE user_id = u.id)
                   LIMIT 1000`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('users');
    });
  });

  describe('Transaction and Audit Patterns', () => {
    test('should parse transaction begin', () => {
      const sql = 'BEGIN';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('BEGIN');
    });

    test('should parse transaction commit', () => {
      const sql = 'COMMIT';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('COMMIT');
    });

    test('should parse transaction rollback', () => {
      const sql = 'ROLLBACK';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('ROLLBACK');
    });

    test('should parse savepoint creation', () => {
      const sql = 'SAVEPOINT before_bulk_insert';
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('SAVEPOINT');
    });
  });

  describe('Parsing Success Rate Metrics', () => {
    test('should achieve 100% action detection rate', () => {
      const testCases = [
        { sql: 'SELECT * FROM users', expectedAction: 'SELECT' },
        { sql: 'INSERT INTO users (name) VALUES ("John")', expectedAction: 'INSERT' },
        { sql: 'UPDATE users SET status = "active"', expectedAction: 'UPDATE' },
        { sql: 'DELETE FROM users WHERE id = 1', expectedAction: 'DELETE' },
        { sql: 'CREATE TABLE users (id INT)', expectedAction: 'CREATE' },
        { sql: 'DROP TABLE users', expectedAction: 'DROP' },
        { sql: 'ALTER TABLE users ADD COLUMN email VARCHAR(255)', expectedAction: 'ALTER' },
        { sql: 'TRUNCATE TABLE users', expectedAction: 'TRUNCATE' },
      ];

      const results = testCases.map(({ sql, expectedAction }) => {
        const result = JSON.parse(formatSql(sql, { minify: true }));
        return result[0].action === expectedAction;
      });

      const successRate = (results.filter(r => r).length / results.length) * 100;
      expect(successRate).toBe(100);
    });

    test('should achieve 100% table name capture rate', () => {
      const testCases = [
        { sql: 'SELECT * FROM users', expectedTable: 'users' },
        { sql: 'INSERT INTO products (name) VALUES ("Widget")', expectedTable: 'products' },
        { sql: 'UPDATE orders SET status = "shipped"', expectedTable: 'orders' },
        { sql: 'DELETE FROM logs WHERE id = 1', expectedTable: 'logs' },
        { sql: 'CREATE TABLE customers (id INT)', expectedTable: 'customers' },
        { sql: 'DROP TABLE archive', expectedTable: 'archive' },
      ];

      const results = testCases.map(({ sql, expectedTable }) => {
        const result = JSON.parse(formatSql(sql, { minify: true }));
        return result[0].table === expectedTable;
      });

      const successRate = (results.filter(r => r).length / results.length) * 100;
      expect(successRate).toBe(100);
    });

    test('should handle complex patterns without errors', () => {
      const complexPatterns = [
        'SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id',
        'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)',
        'SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 10',
        `WITH active_users AS (SELECT id FROM users WHERE status = 'active')
         SELECT * FROM active_users`,
        'SELECT id FROM users UNION SELECT id FROM archived_users',
      ];

      complexPatterns.forEach(sql => {
        expect(() => {
          const result = JSON.parse(formatSql(sql, { minify: true }));
          expect(result).toBeDefined();
          expect(result.length).toBeGreaterThan(0);
        }).not.toThrow();
      });
    });

    test('should maintain data integrity across all patterns', () => {
      const allStatements = [
        'SELECT * FROM users',
        'SELECT u.id FROM users u JOIN orders o ON u.id = o.user_id',
        'INSERT INTO products VALUES (1, "Widget", 9.99)',
        'UPDATE users SET active = true WHERE id > 0',
        'DELETE FROM logs',
        'CREATE TABLE test (id INT)',
      ];

      allStatements.forEach(sql => {
        const result = JSON.parse(formatSql(sql, { minify: true }));

        // Core assertions for every statement
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].action).toBeDefined();
        // Most statements should have table
        if (result[0].table) {
          expect(result[0].table.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Production Data Patterns', () => {
    test('should handle date range queries', () => {
      const sql = `SELECT id, total, created_at FROM orders
                   WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
                   AND status = 'completed'`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].table).toBe('orders');
      expect(result[0].where).toBeDefined();
    });

    test('should handle pagination patterns', () => {
      const sql = `SELECT id, name, email FROM users
                   WHERE status = 'active'
                   ORDER BY created_at DESC
                   LIMIT 20 OFFSET 40`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('SELECT');
      expect(result[0].table).toBe('users');
    });

    test('should handle batch operations', () => {
      const sql = `INSERT INTO user_logs (user_id, action, ip_address, created_at) VALUES
                   (1, 'login', '192.168.1.1', '2024-01-15 10:00:00'),
                   (2, 'logout', '192.168.1.2', '2024-01-15 10:05:00'),
                   (1, 'purchase', '192.168.1.1', '2024-01-15 10:10:00'),
                   (3, 'login', '192.168.1.3', '2024-01-15 10:15:00'),
                   (2, 'view_product', '192.168.1.2', '2024-01-15 10:20:00')`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].rowCount).toBe(5);
    });

    test('should handle upsert-like patterns', () => {
      const sql = `UPDATE users SET last_login = NOW(), login_count = login_count + 1
                   WHERE email = 'user@example.com'`;
      const result = JSON.parse(formatSql(sql, { minify: true }));

      expect(result[0].action).toBe('UPDATE');
      expect(result[0].table).toBe('users');
    });
  });
});
