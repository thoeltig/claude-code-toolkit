import { formatSql } from '../../src/formats/sql';

describe('SQL Column Aliases, GROUP BY, HAVING, and UNION', () => {
  describe('Column Aliases - AS keyword', () => {
    test('should parse single column with AS alias', () => {
      const sql = 'SELECT id AS user_id FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions[0].columns).toEqual(['id']);
      expect(result[0].actions[0].columnAliases).toEqual([{ column: 'id', alias: 'user_id' }]);
    });

    test('should parse multiple columns with AS aliases', () => {
      const sql = 'SELECT id AS user_id, name AS user_name, email AS user_email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].actions[0].columnAliases).toEqual([
        { column: 'id', alias: 'user_id' },
        { column: 'name', alias: 'user_name' },
        { column: 'email', alias: 'user_email' }
      ]);
    });

    test('should parse mixed columns with and without AS aliases', () => {
      const sql = 'SELECT id AS user_id, name, email AS user_email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].actions[0].columnAliases).toEqual([
        { column: 'id', alias: 'user_id' },
        { column: 'name', alias: undefined },
        { column: 'email', alias: 'user_email' }
      ]);
    });
  });

  describe('Column Aliases - Space-based (no AS keyword)', () => {
    test('should parse single column with space-based alias', () => {
      const sql = 'SELECT id user_id FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id']);
      expect(result[0].actions[0].columnAliases).toEqual([{ column: 'id', alias: 'user_id' }]);
    });

    test('should parse multiple columns with space-based aliases', () => {
      const sql = 'SELECT id user_id, name user_name, email user_email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].actions[0].columnAliases).toEqual([
        { column: 'id', alias: 'user_id' },
        { column: 'name', alias: 'user_name' },
        { column: 'email', alias: 'user_email' }
      ]);
    });

    test('should parse mixed space-based and AS aliases', () => {
      const sql = 'SELECT id user_id, name AS user_name, email user_email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].actions[0].columnAliases).toEqual([
        { column: 'id', alias: 'user_id' },
        { column: 'name', alias: 'user_name' },
        { column: 'email', alias: 'user_email' }
      ]);
    });
  });

  describe('Column Aliases - Edge cases', () => {
    test('should preserve column names without aliases', () => {
      const sql = 'SELECT id, name, email FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
      // columnAliases should not be present if there are no aliases
      expect(result[0].actions[0].columnAliases).toBeUndefined();
    });

    test('should handle whitespace variations in aliases', () => {
      const sql = 'SELECT id   AS   user_id,  name  user_name FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name']);
      expect(result[0].actions[0].columnAliases).toBeDefined();
    });

    test('should handle special characters in column aliases', () => {
      const sql = 'SELECT id AS user_id_v2, name AS first_name FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columnAliases).toEqual([
        { column: 'id', alias: 'user_id_v2' },
        { column: 'name', alias: 'first_name' }
      ]);
    });

    test('should handle table.column notation with aliases', () => {
      const sql = 'SELECT u.id AS user_id, u.name AS user_name FROM users u;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['u.id', 'u.name']);
      expect(result[0].actions[0].columnAliases).toEqual([
        { column: 'u.id', alias: 'user_id' },
        { column: 'u.name', alias: 'user_name' }
      ]);
    });
  });

  describe('GROUP BY Parsing', () => {
    test('should parse simple GROUP BY', () => {
      const sql = 'SELECT status, COUNT(*) FROM users GROUP BY status;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].groupByColumns).toEqual(['status']);
    });

    test('should parse multiple columns in GROUP BY', () => {
      const sql = 'SELECT country, city, COUNT(*) FROM users GROUP BY country, city;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].groupByColumns).toEqual(['country', 'city']);
    });

    test('should parse GROUP BY with HAVING clause', () => {
      const sql = 'SELECT status, COUNT(*) as cnt FROM users GROUP BY status HAVING COUNT(*) > 5;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].groupByColumns).toEqual(['status']);
      expect(result[0].actions[0].havingClause).toBeDefined();
    });

    test('should handle GROUP BY with whitespace variations', () => {
      const sql = 'SELECT status FROM users GROUP BY status;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].groupByColumns).toEqual(['status']);
    });
  });

  describe('HAVING Clause Parsing', () => {
    test('should parse HAVING with simple condition', () => {
      const sql = 'SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 10;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].havingClause).toBeDefined();
      expect(result[0].actions[0].havingClause).toContain('COUNT(*)');
    });

    test('should parse HAVING with multiple conditions', () => {
      const sql = 'SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 10 AND SUM(age) < 500;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].havingClause).toBeDefined();
    });

    test('should preserve HAVING clause text', () => {
      const sql = 'SELECT dept, AVG(salary) FROM employees GROUP BY dept HAVING AVG(salary) > 50000;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].havingClause).toContain('AVG(salary)');
      expect(result[0].actions[0].havingClause).toContain('50000');
    });
  });

  describe('UNION/INTERSECT/EXCEPT Parsing', () => {
    test('should detect UNION', () => {
      const sql = 'SELECT id FROM users UNION SELECT id FROM customers;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].unionType).toBe('UNION');
    });

    test('should detect UNION ALL', () => {
      const sql = 'SELECT id FROM users UNION ALL SELECT id FROM customers;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].unionType).toBe('UNION ALL');
    });

    test('should detect INTERSECT', () => {
      const sql = 'SELECT id FROM users INTERSECT SELECT id FROM active_users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].unionType).toBe('INTERSECT');
    });

    test('should detect EXCEPT', () => {
      const sql = 'SELECT id FROM users EXCEPT SELECT id FROM deleted_users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].unionType).toBe('EXCEPT');
    });

    test('should not mark regular SELECT as UNION', () => {
      const sql = 'SELECT id FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].unionType).toBeUndefined();
    });
  });

  describe('Complex queries with multiple features', () => {
    test('should handle aliases with GROUP BY and HAVING', () => {
      const sql = 'SELECT status AS user_status, COUNT(*) as user_count FROM users GROUP BY status HAVING COUNT(*) > 5;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columnAliases).toBeDefined();
      expect(result[0].actions[0].groupByColumns).toEqual(['status']);
      expect(result[0].actions[0].havingClause).toBeDefined();
    });

    test('should handle aliases with WHERE and GROUP BY', () => {
      const sql = 'SELECT dept AS department, COUNT(*) AS emp_count FROM employees WHERE status="active" GROUP BY dept;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columnAliases).toBeDefined();
      expect(result[0].actions[0].where).toBeDefined();
      expect(result[0].actions[0].groupByColumns).toEqual(['dept']);
    });

    test('should handle SELECT with aliases and UNION', () => {
      const sql = 'SELECT id AS user_id, name AS user_name FROM users UNION SELECT id, name FROM customers;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columnAliases).toBeDefined();
      expect(result[0].actions[0].unionType).toBe('UNION');
    });
  });

  describe('Backward compatibility - existing behavior', () => {
    test('should still extract columns correctly', () => {
      const sql = 'SELECT id, name, email FROM users WHERE status="active";';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[0].where).toBeDefined();
    });

    test('should handle wildcard SELECT', () => {
      const sql = 'SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toBeUndefined();
      expect(result[0].actions[0].columnAliases).toBeUndefined();
    });

    test('should maintain zero information loss with unparsedContent', () => {
      const sql = 'SELECT id AS user_id, name FROM users LEFT JOIN orders ON users.id = orders.user_id WHERE orders.total > (SELECT AVG(total) FROM orders);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should capture aliases
      expect(result[0].actions[0].columnAliases).toBeDefined();
      // Should parse simple JOIN
      expect(result[0].actions[0].joins).toBeDefined();
      // Complex WHERE with subquery preserved in where field
      expect(result[0].actions[0].where).toBeDefined();
      expect(result[0].actions[0].where).toContain('SELECT');
    });
  });
});
