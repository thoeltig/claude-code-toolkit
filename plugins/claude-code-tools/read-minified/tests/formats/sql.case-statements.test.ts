import { formatSql } from '../../src/formats/sql';

describe('SQL CASE Statement Parsing', () => {
  describe('Simple CASE Statements', () => {
    test('should parse simple CASE with single WHEN clause', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].caseStatements).toHaveLength(1);
      expect(result[0].caseStatements[0].caseType).toBe('simple');
      expect(result[0].caseStatements[0].whens).toHaveLength(1);
      expect(result[0].caseStatements[0].whens[0].when).toBe('\'active\'');
      expect(result[0].caseStatements[0].whens[0].then).toBe('1');
    });

    test('should parse simple CASE with multiple WHEN clauses', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 WHEN \'inactive\' THEN 0 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens).toHaveLength(2);
      expect(result[0].caseStatements[0].whens[0].when).toBe('\'active\'');
      expect(result[0].caseStatements[0].whens[0].then).toBe('1');
      expect(result[0].caseStatements[0].whens[1].when).toBe('\'inactive\'');
      expect(result[0].caseStatements[0].whens[1].then).toBe('0');
    });

    test('should parse simple CASE with ELSE clause', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 ELSE 0 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].else).toBe('0');
      expect(result[0].caseStatements[0].whens).toHaveLength(1);
    });

    test('should parse simple CASE with numeric comparison', () => {
      const sql = 'SELECT id, CASE level WHEN 1 THEN \'beginner\' WHEN 2 THEN \'intermediate\' ELSE \'advanced\' END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].caseType).toBe('simple');
      expect(result[0].caseStatements[0].whens[0].when).toBe('1');
      expect(result[0].caseStatements[0].whens[0].then).toBe('\'beginner\'');
    });

    test('should parse simple CASE with string results', () => {
      const sql = 'SELECT id, CASE priority WHEN \'high\' THEN \'urgent\' WHEN \'low\' THEN \'defer\' END FROM tasks;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens[1].then).toBe('\'defer\'');
    });
  });

  describe('Searched CASE Statements', () => {
    test('should parse searched CASE with simple condition', () => {
      const sql = 'SELECT id, CASE WHEN age > 18 THEN \'adult\' END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].caseStatements[0].caseType).toBe('searched');
      expect(result[0].caseStatements[0].whens[0].when).toBe('age > 18');
      expect(result[0].caseStatements[0].whens[0].then).toBe('\'adult\'');
    });

    test('should parse searched CASE with multiple conditions', () => {
      const sql = 'SELECT id, CASE WHEN age >= 18 THEN \'adult\' WHEN age >= 13 THEN \'teen\' ELSE \'child\' END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens).toHaveLength(2);
      expect(result[0].caseStatements[0].whens[0].when).toBe('age >= 18');
      expect(result[0].caseStatements[0].whens[1].when).toBe('age >= 13');
      expect(result[0].caseStatements[0].else).toBe('\'child\'');
    });

    test('should parse searched CASE with ELSE clause', () => {
      const sql = 'SELECT id, CASE WHEN status = \'active\' THEN 1 ELSE 0 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].else).toBe('0');
    });

    test('should parse searched CASE with complex conditions', () => {
      const sql = 'SELECT id, CASE WHEN salary > 50000 AND department = \'IT\' THEN \'high_it\' ELSE \'other\' END FROM employees;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens[0].when).toContain('salary > 50000');
      expect(result[0].caseStatements[0].caseType).toBe('searched');
    });

    test('should parse searched CASE with NULL comparison', () => {
      const sql = 'SELECT id, CASE WHEN email IS NULL THEN \'no_email\' ELSE \'has_email\' END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens[0].when).toContain('email');
      expect(result[0].caseStatements[0].whens[0].when).toContain('NULL');
    });
  });

  describe('CASE with Aliases', () => {
    test('should extract alias after CASE with AS keyword', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 ELSE 0 END AS status_code FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].column).toBe('status_code');
    });

    test('should extract alias after CASE without AS keyword (space-based)', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 ELSE 0 END status_flag FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].column).toBe('status_flag');
    });

    test('should extract alias from searched CASE with AS', () => {
      const sql = 'SELECT id, CASE WHEN age > 18 THEN \'adult\' ELSE \'minor\' END AS age_category FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].column).toBe('age_category');
    });

    test('should not confuse END alias with SQL keywords', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 END status_code FROM users WHERE id = 1;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].column).toBe('status_code');
      expect(result[0].where).toBe('id = 1');
    });

    test('should handle single-character alias', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN 1 END s FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].column).toBe('s');
    });
  });

  describe('Multiple CASE Statements', () => {
    test('should parse two CASE statements in same SELECT', () => {
      const sql = 'SELECT id, CASE status WHEN \'active\' THEN 1 ELSE 0 END AS s1, CASE priority WHEN \'high\' THEN 1 ELSE 0 END AS s2 FROM tasks;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toHaveLength(2);
      expect(result[0].caseStatements[0].column).toBe('s1');
      expect(result[0].caseStatements[1].column).toBe('s2');
    });

    test('should parse three CASE statements', () => {
      const sql = 'SELECT id, CASE WHEN a > 1 THEN 1 END c1, CASE WHEN b > 2 THEN 2 END c2, CASE WHEN c > 3 THEN 3 END c3 FROM data;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toHaveLength(3);
      expect(result[0].caseStatements[0].column).toBe('c1');
      expect(result[0].caseStatements[1].column).toBe('c2');
      expect(result[0].caseStatements[2].column).toBe('c3');
    });

    test('should parse mixed simple and searched CASE statements', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN 1 END s, CASE WHEN age > 18 THEN \'adult\' END a FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toHaveLength(2);
      expect(result[0].caseStatements[0].caseType).toBe('simple');
      expect(result[0].caseStatements[1].caseType).toBe('searched');
    });
  });

  describe('CASE Edge Cases and Whitespace', () => {
    test('should handle CASE with extra whitespace', () => {
      const sql = 'SELECT id, CASE   status   WHEN \'active\'   THEN   1   END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].caseStatements[0].whens[0].when).toBe('\'active\'');
    });

    test('should handle CASE with newlines', () => {
      const sql = `SELECT id, CASE status
        WHEN 'active' THEN 1
        WHEN 'inactive' THEN 0
        ELSE 2
      END FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens).toHaveLength(2);
    });

    test('should handle CASE with quoted strings containing keywords', () => {
      const sql = 'SELECT id, CASE status WHEN \'WHEN\' THEN 1 WHEN \'THEN\' THEN 2 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens[0].when).toBe('\'WHEN\'');
      expect(result[0].caseStatements[0].whens[1].when).toBe('\'THEN\'');
    });

    test('should be case-insensitive with keywords', () => {
      const sql = 'SELECT id, case status when \'a\' then 1 end FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].caseStatements[0].whens[0].then).toBe('1');
    });

    test('should handle CASE with function results', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN COUNT(*) ELSE 0 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens[0].then).toContain('COUNT');
    });
  });

  describe('CASE with Other SQL Features', () => {
    test('should parse CASE in SELECT with WHERE clause', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN 1 END FROM users WHERE age > 18;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].where).toBe('age > 18');
    });

    test('should parse CASE in SELECT with GROUP BY', () => {
      const sql = 'SELECT status, COUNT(*) FROM users GROUP BY CASE status WHEN \'a\' THEN \'active\' ELSE \'inactive\' END;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // CASE in GROUP BY should be parsed (even if in GROUP BY clause)
      expect(result[0].caseStatements).toBeDefined();
    });

    test('should parse CASE in SELECT with JOINs', () => {
      const sql = 'SELECT u.id, CASE u.status WHEN \'a\' THEN 1 END FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].joins).toBeDefined();
      expect(result[0].joins[0].table).toBe('orders');
    });

    test('should parse CASE in SELECT with column aliases and JOINs', () => {
      const sql = 'SELECT u.id AS user_id, CASE u.status WHEN \'a\' THEN 1 END status_num FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].columnAliases).toBeDefined();
      expect(result[0].joins).toBeDefined();
    });

    test('should parse CASE in SELECT with UNION', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN 1 END FROM users UNION SELECT id, CASE type WHEN \'b\' THEN 2 END FROM items;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeDefined();
      expect(result[0].unionType).toBe('UNION');
    });
  });

  describe('Backward Compatibility', () => {
    test('should parse SELECT without CASE', () => {
      const sql = 'SELECT id, name FROM users WHERE age > 18;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toBeUndefined();
      expect(result[0].where).toBe('age > 18');
      expect(result[0].columns).toBeDefined();
    });

    test('should not break existing SELECT with columns and aliases', () => {
      const sql = 'SELECT id AS user_id, name AS user_name FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].columnAliases).toBeDefined();
      expect(result[0].columnAliases).toHaveLength(2);
      expect(result[0].caseStatements).toBeUndefined();
    });

    test('should not break existing SELECT with JOINs', () => {
      const sql = 'SELECT u.id, o.id FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].joins).toBeDefined();
      expect(result[0].caseStatements).toBeUndefined();
    });

    test('should not break existing SELECT with GROUP BY and HAVING', () => {
      const sql = 'SELECT status, COUNT(*) cnt FROM users GROUP BY status HAVING COUNT(*) > 5;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].groupByColumns).toBeDefined();
      expect(result[0].havingClause).toBeDefined();
      expect(result[0].caseStatements).toBeUndefined();
    });
  });

  describe('Complex Real-World CASE Scenarios', () => {
    test('should parse employee salary band assignment with CASE', () => {
      const sql = 'SELECT emp_id, CASE WHEN salary < 30000 THEN \'Junior\' WHEN salary < 60000 THEN \'Mid\' WHEN salary < 100000 THEN \'Senior\' ELSE \'Executive\' END AS band FROM employees;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens).toHaveLength(3);
      expect(result[0].caseStatements[0].column).toBe('band');
      expect(result[0].caseStatements[0].else).toBe('\'Executive\'');
    });

    test('should parse product category mapping with CASE', () => {
      const sql = 'SELECT product_id, CASE category WHEN \'ELEC\' THEN \'Electronics\' WHEN \'HOME\' THEN \'Home\' WHEN \'FOOD\' THEN \'Groceries\' ELSE \'Other\' END AS category_name FROM products;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens).toHaveLength(3);
      expect(result[0].caseStatements[0].caseType).toBe('simple');
    });

    test('should parse order status tracking with multiple CASE', () => {
      const sql = 'SELECT order_id, CASE status WHEN \'P\' THEN \'Pending\' WHEN \'S\' THEN \'Shipped\' ELSE \'Delivered\' END status_text, CASE WHEN amount > 1000 THEN \'Large\' ELSE \'Regular\' END AS order_size FROM orders;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements).toHaveLength(2);
      expect(result[0].caseStatements[0].caseType).toBe('simple');
      expect(result[0].caseStatements[1].caseType).toBe('searched');
    });

    test('should parse demographic classification with CASE', () => {
      const sql = 'SELECT user_id, CASE WHEN gender = \'M\' AND age < 25 THEN \'Young_Male\' WHEN gender = \'M\' THEN \'Adult_Male\' WHEN gender = \'F\' AND age < 25 THEN \'Young_Female\' ELSE \'Adult_Female\' END AS demographic FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].whens).toHaveLength(3);
      expect(result[0].caseStatements[0].column).toBe('demographic');
    });
  });

  describe('CASE Statement Information Preservation', () => {
    test('should preserve all WHEN-THEN values in output', () => {
      const sql = 'SELECT id, CASE priority WHEN 1 THEN \'Low\' WHEN 2 THEN \'Medium\' WHEN 3 THEN \'High\' WHEN 4 THEN \'Critical\' END FROM tasks;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const caseStmt = result[0].caseStatements[0];
      expect(caseStmt.whens).toHaveLength(4);
      expect(caseStmt.whens.map((w: any) => w.when)).toEqual(['1', '2', '3', '4']);
      expect(caseStmt.whens.map((w: any) => w.then)).toEqual(['\'Low\'', '\'Medium\'', '\'High\'', '\'Critical\'']);
    });

    test('should preserve CASE structure with empty ELSE (undefined)', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN 1 WHEN \'b\' THEN 2 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].caseStatements[0].else).toBeUndefined();
      expect(result[0].caseStatements[0].whens).toHaveLength(2);
    });

    test('should not lose information for complex CASE structure', () => {
      const sql = 'SELECT CASE WHEN x = 1 THEN \'one\' WHEN x = 2 THEN \'two\' WHEN x = 3 THEN \'three\' ELSE \'many\' END FROM numbers;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0].caseStatements[0];
      expect(stmt.whens).toHaveLength(3);
      expect(stmt.else).toBe('\'many\'');
      // All information preserved
      expect(JSON.stringify(stmt).length).toBeGreaterThan(50);
    });
  });
});
