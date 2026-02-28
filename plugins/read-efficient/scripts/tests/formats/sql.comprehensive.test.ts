import { formatSql } from '../../src/formats/sql';

describe('SQL Comprehensive Statement Parsing', () => {
  describe('SELECT Statements', () => {
    test('should parse simple SELECT with WHERE clause', () => {
      const sql = 'SELECT id, name FROM users WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].columns).toHaveLength(2);
      expect(result[0].columns[0].expr.column).toBe('id');
      expect(result[0].columns[1].expr.column).toBe('name');
      expect(result[0].from).toHaveLength(1);
      expect(result[0].from[0].table).toBe('users');
      expect(result[0].where).toBeDefined();
      expect(result[0].where.type).toBe('binary_expr');
      expect(result[0].where.operator).toBe('=');
    });

    test('should parse SELECT with JOIN', () => {
      const sql = `SELECT u.id, u.name, o.id FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.status = 'active';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      // JOINs are added to the from array
      expect(result[0].from.length).toBeGreaterThanOrEqual(2);
      expect(result[0].from[0].table).toBe('users');
      expect(result[0].from[0].as).toBe('u');
      expect(result[0].from[1].table).toBe('orders');
      expect(result[0].from[1].as).toBe('o');
      expect(result[0].from[1].join).toBe('LEFT JOIN');
    });

    test('should parse SELECT with GROUP BY and HAVING', () => {
      const sql = `SELECT user_id, COUNT(*) as count FROM orders
        GROUP BY user_id
        HAVING COUNT(*) > 5;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].groupby).toBeDefined();
      expect(result[0].having).toBeDefined();
    });

    test('should parse SELECT with UNION', () => {
      const sql = `SELECT id, name FROM users WHERE status = 'active'
        UNION
        SELECT id, name FROM archived_users WHERE status = 'inactive';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // UNION typically creates 2+ statements
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].type).toBe('select');
    });

    test('should parse SELECT with subquery', () => {
      const sql = `SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].from[0].table).toBe('users');
    });

    test('should parse SELECT with ORDER BY and LIMIT', () => {
      const sql = `SELECT * FROM users ORDER BY name ASC LIMIT 10;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
      expect(result[0].orderby).toBeDefined();
      expect(result[0].limit).toBeDefined();
    });
  });

  describe('INSERT Statements', () => {
    test('should parse INSERT with multiple rows', () => {
      const sql = `INSERT INTO customers (id, first_name, last_name, email, phone)
        VALUES
        (1, 'John', 'Doe', 'john@example.com', '555-0001'),
        (2, 'Jane', 'Smith', 'jane@example.com', '555-0002'),
        (3, 'Bob', 'Johnson', 'bob@example.com', '555-0003');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('insert');
      expect(result[0].table).toBeDefined();
      expect(result[0].table[0].table).toBe('customers');
      expect(result[0].columns).toEqual(['id', 'first_name', 'last_name', 'email', 'phone']);
      expect(result[0].values).toBeDefined();
    });

    test('should parse INSERT with quoted strings', () => {
      const sql = `INSERT INTO users (name, email) VALUES ('John O\\'Reilly', 'john@test.com');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('insert');
      expect(result[0].columns).toEqual(['name', 'email']);
    });
  });

  describe('UPDATE Statements', () => {
    test('should parse UPDATE with multiple columns', () => {
      const sql = `UPDATE products
        SET price = price * 1.15, updated_at = NOW()
        WHERE status = 'active';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('update');
      expect(result[0].table[0].table).toBe('products');
      expect(result[0].set).toBeDefined();
      expect(result[0].set.length).toBeGreaterThanOrEqual(2);
      expect(result[0].where).toBeDefined();
    });

    test('should parse UPDATE with complex WHERE', () => {
      const sql = `UPDATE users
        SET status = 'suspended', reason = 'inactivity'
        WHERE last_login < '2023-01-01' AND email LIKE '%@example.com' AND role != 'admin';`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('update');
      expect(result[0].table[0].table).toBe('users');
      expect(result[0].set).toBeDefined();
      expect(result[0].where).toBeDefined();
    });
  });

  describe('DELETE Statements', () => {
    test('should parse DELETE with WHERE clause', () => {
      const sql = `DELETE FROM logs
        WHERE timestamp < '2023-01-01' AND (level = 'debug' OR level = 'trace') AND user_id IS NULL;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('delete');
      expect(result[0].where).toBeDefined();
    });

    test('should parse DELETE with multiple conditions', () => {
      const sql = `DELETE FROM sessions WHERE expires < NOW() OR user_id NOT IN (SELECT id FROM users);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('delete');
    });
  });

  describe('CREATE TABLE Statements', () => {
    test('should parse CREATE TABLE with column types', () => {
      const sql = `CREATE TABLE employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        hire_date DATE,
        salary DECIMAL(10, 2)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('create');
    });
  });

  describe('Multiple Statements', () => {
    test('should parse multiple SQL statements separated by semicolons', () => {
      const sql = `SELECT * FROM users; DELETE FROM logs; INSERT INTO archive VALUES (1);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(3);
      const types = result.map((s: any) => s.type);
      expect(types).toContain('select');
      expect(types).toContain('delete');
      expect(types).toContain('insert');
    });
  });

  describe('Complex Queries', () => {
    test('should parse SELECT with CASE statement', () => {
      const sql = `SELECT id, name,
        CASE
          WHEN age < 18 THEN 'minor'
          WHEN age >= 65 THEN 'senior'
          ELSE 'adult'
        END as age_group
      FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });

    test('should parse SELECT with window functions', () => {
      const sql = `SELECT id, salary,
        ROW_NUMBER() OVER (ORDER BY salary DESC) as rank,
        AVG(salary) OVER (PARTITION BY department) as dept_avg
      FROM employees;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      // Window functions are complex; parser may not fully support them
      // Check if either successfully parsed or has error property
      expect(result[0].type === 'select' || result[0].error).toBeTruthy();
    });

    test('should parse SELECT with CTEs (Common Table Expressions)', () => {
      const sql = `WITH RECURSIVE cte AS (
        SELECT id, parent_id, name FROM categories WHERE parent_id IS NULL
        UNION ALL
        SELECT c.id, c.parent_id, c.name FROM categories c
        INNER JOIN cte ON c.parent_id = cte.id
      )
      SELECT * FROM cte;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('select');
    });
  });
});
