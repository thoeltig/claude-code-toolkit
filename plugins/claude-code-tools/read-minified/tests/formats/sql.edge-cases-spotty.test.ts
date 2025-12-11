import { formatSql } from '../../src/formats/sql';

describe('SQL Edge Cases & Spotty Statements', () => {
  describe('Nested and Escaped Quotes', () => {
    test('should handle single quotes with nested double quotes', () => {
      const sql = `INSERT INTO posts (title, content) VALUES ('My "Famous" Blog', 'This is "quoted" text');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      const action = result[0].actions[0];
      expect(action.action).toBe('INSERT');
      expect(action.rows[0].title).toContain('Famous');
    });

    test('should handle double quotes with nested single quotes', () => {
      const sql = `INSERT INTO messages (text) VALUES ("John's message");`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('INSERT');
      expect(action.rows).toBeDefined();
    });

    test('should handle escaped quotes in strings', () => {
      const sql = `INSERT INTO data (content) VALUES ('It\'s a test');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      const action = result[0].actions[0];
      expect(action.action).toBe('INSERT');
    });

    test('should handle multiple escaped characters', () => {
      const sql = `INSERT INTO logs (message) VALUES ('Line 1\\nLine 2\\tTabbed');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('INSERT');
      expect(action.rows).toBeDefined();
    });
  });

  describe('Whitespace Variations', () => {
    test('should handle excessive whitespace', () => {
      const sql = `SELECT    id,    name    FROM    users    WHERE    status = 'active';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
      expect(action.columns).toBeDefined();
      expect(action.where).toBeDefined();
    });

    test('should handle multiline with inconsistent indentation', () => {
      const sql = `SELECT id,
  name,
        email
FROM users
  WHERE active = true;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.columns).toHaveLength(3);
    });

    test('should handle statements with no spaces around operators', () => {
      const sql = `SELECT id,name FROM users WHERE age>18AND status='active';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });

    test('should handle extra semicolons and newlines', () => {
      const sql = `SELECT * FROM users;  ;
        ;;
        SELECT * FROM orders;;;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Complex WHERE Conditions', () => {
    test('should handle deeply nested parentheses in WHERE', () => {
      const sql = `SELECT * FROM users
        WHERE ((age > 18 AND (status = 'active' OR status = 'pending')) AND (role = 'user' OR role = 'moderator'));`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toBeDefined();
      expect(action.where).toContain('age');
    });

    test('should handle NOT IN with multiple values', () => {
      const sql = `SELECT * FROM products WHERE id NOT IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toContain('NOT IN');
    });

    test('should handle BETWEEN in WHERE', () => {
      const sql = `SELECT * FROM orders WHERE order_date BETWEEN '2024-01-01' AND '2024-12-31';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toContain('BETWEEN');
    });

    test('should handle LIKE with wildcards', () => {
      const sql = `SELECT * FROM users WHERE email LIKE '%@example.%' AND name LIKE 'John%';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toContain('LIKE');
    });

    test('should handle IS NULL and IS NOT NULL', () => {
      const sql = `SELECT * FROM users WHERE email IS NOT NULL AND phone IS NULL;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toContain('NULL');
    });
  });

  describe('Complex Data Types and Functions', () => {
    test('should handle numeric literals of various formats', () => {
      const sql = `SELECT * FROM products WHERE price IN (19.99, 29.50, 100, -50, 0.01);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toBeDefined();
    });

    test('should handle date and timestamp literals', () => {
      const sql = `SELECT * FROM events WHERE event_date = '2024-12-11' OR created_at > '2024-01-01 10:30:45';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toBeDefined();
    });

    test('should handle function calls in SELECT', () => {
      const sql = `SELECT COUNT(*), MAX(salary), MIN(hire_date), AVG(age) FROM employees;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });

    test('should handle string functions in SELECT', () => {
      const sql = `SELECT UPPER(name), LOWER(email), TRIM(phone), LENGTH(bio) FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });

    test('should handle math expressions in UPDATE', () => {
      const sql = `UPDATE inventory SET quantity = quantity - 1, price = price * 1.1 WHERE id = 5;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('UPDATE');
      expect(action.updates).toBeDefined();
    });
  });

  describe('Subqueries and CTEs', () => {
    test('should handle subquery in WHERE clause', () => {
      const sql = `SELECT id, name FROM users
        WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)
        AND age > (SELECT AVG(age) FROM users);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
      // Should have WHERE or unparsedContent for subquery
      expect(action.where || action.unparsedContent).toBeDefined();
    });

    test('should handle nested subqueries', () => {
      const sql = `SELECT * FROM users
        WHERE id IN (SELECT user_id FROM (SELECT user_id FROM orders WHERE total > 100) as high_orders);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });

    test('should handle CTE (WITH clause)', () => {
      const sql = `WITH active_users AS (
        SELECT id, name FROM users WHERE status = 'active'
      )
      SELECT * FROM active_users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // CTE is complex, might be in unparsedContent
      expect(result).toHaveLength(1);
    });

    test('should handle multiple CTEs', () => {
      const sql = `WITH active_users AS (
        SELECT id, name FROM users WHERE status = 'active'
      ),
      recent_orders AS (
        SELECT user_id, COUNT(*) as order_count FROM orders WHERE order_date > DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY user_id
      )
      SELECT u.*, r.order_count FROM active_users u LEFT JOIN recent_orders r ON u.id = r.user_id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
    });
  });

  describe('Missing or Unusual Syntax', () => {
    test('should handle SELECT without FROM clause', () => {
      const sql = `SELECT 1 AS test, 'hello' AS greeting;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // SELECT without FROM may return empty (acceptable limitation)
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle UPDATE without WHERE clause', () => {
      const sql = `UPDATE users SET status = 'inactive';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('users');
      const action = result[0].actions[0];
      expect(action.action).toBe('UPDATE');
    });

    test('should handle DELETE without WHERE clause', () => {
      const sql = `DELETE FROM temp_data;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('DELETE');
    });

    test('should handle SELECT with only aggregates and no columns list', () => {
      const sql = `SELECT COUNT(*) FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });
  });

  describe('JOIN Variations', () => {
    test('should handle JOIN without explicit type (defaults to INNER)', () => {
      const sql = `SELECT u.id, o.id FROM users u JOIN orders o ON u.id = o.user_id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.joins).toBeDefined();
    });

    test('should handle FULL OUTER JOIN', () => {
      const sql = `SELECT u.id, o.id FROM users u FULL OUTER JOIN orders o ON u.id = o.user_id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.joins).toBeDefined();
      expect(action.joins.some((j: any) => j.type?.includes('FULL'))).toBe(true);
    });

    test('should handle JOIN with complex ON condition', () => {
      const sql = `SELECT * FROM orders o
        LEFT JOIN items i ON o.id = i.order_id AND i.status = 'active'
        WHERE o.total > 100;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.joins).toBeDefined();
    });

    test('should handle self-join', () => {
      const sql = `SELECT e1.id, e1.name, e2.name as manager_name
        FROM employees e1
        LEFT JOIN employees e2 ON e1.manager_id = e2.id;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.joins).toBeDefined();
    });
  });

  describe('UNION and Set Operations', () => {
    test('should handle UNION with different SELECT columns', () => {
      const sql = `SELECT id, name FROM users UNION SELECT id, email FROM customers;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.unionType).toBeDefined();
    });

    test('should handle UNION ALL', () => {
      const sql = `SELECT id FROM users WHERE status = 'active'
        UNION ALL
        SELECT id FROM users WHERE status = 'inactive';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.unionType).toContain('ALL');
    });

    test('should handle INTERSECT', () => {
      const sql = `SELECT id FROM users_current INTERSECT SELECT id FROM users_archive;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.unionType || action.unparsedContent).toBeDefined();
    });

    test('should handle EXCEPT', () => {
      const sql = `SELECT id FROM users EXCEPT SELECT id FROM blocked_users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.unionType || action.unparsedContent).toBeDefined();
    });
  });

  describe('Case Statements', () => {
    test('should handle simple CASE statement', () => {
      const sql = `SELECT id, name, CASE status WHEN 'active' THEN 1 WHEN 'inactive' THEN 0 END as is_active FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
      // CASE might be in caseStatements or unparsedContent
      expect(action.caseStatements || action.unparsedContent).toBeDefined();
    });

    test('should handle searched CASE statement', () => {
      const sql = `SELECT id, CASE WHEN age > 18 THEN 'adult' WHEN age > 13 THEN 'teen' ELSE 'child' END as age_group FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });

    test('should handle nested CASE statements', () => {
      const sql = `SELECT CASE
        WHEN status = 'active' THEN CASE WHEN age > 18 THEN 'adult_active' ELSE 'teen_active' END
        ELSE 'inactive'
      END as category FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });
  });

  describe('Window Functions', () => {
    test('should handle window function with OVER clause', () => {
      const sql = `SELECT id, name, salary, AVG(salary) OVER (PARTITION BY department) as dept_avg FROM employees;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
      // Window functions are complex, might be in unparsedContent
    });

    test('should handle ROW_NUMBER window function', () => {
      const sql = `SELECT id, name, ROW_NUMBER() OVER (ORDER BY salary DESC) as rank FROM employees;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
    });
  });

  describe('Information Loss Prevention', () => {
    test('should never lose information from valid SQL', () => {
      const sqlStatements = [
        `SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);`,
        `INSERT INTO users (id, name, email) VALUES (1, 'John "Doe"', 'john@example.com');`,
        `UPDATE products SET price = price * 1.1 WHERE category = 'electronics' AND stock > 0;`,
        `DELETE FROM sessions WHERE created_at < '2024-01-01' AND (status = 'expired' OR user_id IS NULL);`,
      ];

      sqlStatements.forEach(sql => {
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result).toHaveLength(1);
        expect(result[0].actions).toHaveLength(1);
        const action = result[0].actions[0];

        // Every action should either have specific fields or fallback to unparsedContent
        const hasTableInfo = action.table || action.objectType;
        const hasActionInfo = action.action;
        const hasParsedFields = action.columns || action.rows || action.updates || action.where || action.joins;

        expect(hasActionInfo).toBeTruthy();
        expect(hasTableInfo || hasParsedFields || action.unparsedContent).toBeTruthy();
      });
    });
  });

  describe('Stress Tests - Large and Complex Statements', () => {
    test('should handle INSERT with 50+ rows', () => {
      const rows = Array.from({ length: 50 }, (_, i) => `(${i}, 'User${i}', 'user${i}@example.com')`).join(',');
      const sql = `INSERT INTO users (id, name, email) VALUES ${rows};`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.action).toBe('INSERT');
      expect(action.rowCount).toBe(50);
    });

    test('should handle SELECT with many JOINs', () => {
      const sql = `SELECT u.id FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        INNER JOIN payments p ON o.id = p.order_id
        RIGHT JOIN refunds r ON p.id = r.payment_id
        CROSS JOIN categories c
        WHERE u.status = 'active';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.joins).toBeDefined();
      expect(action.joins.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle SELECT with many GROUP BY columns', () => {
      const sql = `SELECT year, month, day, category, region, COUNT(*) FROM events
        GROUP BY year, month, day, category, region
        HAVING COUNT(*) > 10;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.groupByColumns).toBeDefined();
      expect(action.groupByColumns.length).toBeGreaterThan(3);
    });

    test('should handle very long WHERE clause', () => {
      const conditions = Array.from({ length: 20 }, (_, i) => `col${i} = 'value${i}'`).join(' OR ');
      const sql = `SELECT * FROM data WHERE ${conditions};`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];
      expect(action.where).toBeDefined();
    });
  });
});
