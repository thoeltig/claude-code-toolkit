# Session 7 Test Templates

Ready-to-use test structure for next session.

## Template 1: Fallback Field Tests

```typescript
// tests/formats/sql.unparsed-content.test.ts

describe('SQL Unparsed Content Fallback', () => {
  describe('Zero Information Loss Guarantee', () => {
    test('should preserve complex SELECT in unparsedContent', () => {
      const sql = `SELECT u.id, u.name, COUNT(o.id) as order_count
                   FROM users u
                   LEFT JOIN orders o ON u.id = o.user_id
                   WHERE o.total > (SELECT AVG(total) FROM orders)
                   GROUP BY u.id, u.name
                   HAVING COUNT(o.id) > 5`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      // Structured parts we can parse
      expect(json.table).toBe('users');
      expect(json.action).toBe('SELECT');
      expect(json.columns).toBeDefined();

      // Complex parts in fallback
      expect(json.unparsedContent).toBeDefined();
      expect(json.unparsedContent).toContain('LEFT JOIN');
      expect(json.unparsedContent).toContain('GROUP BY');
      expect(json.unparsedContent).toContain('HAVING');

      // Zero information loss: reconstructed ≈ original
      const reconstructed = json.unparsedContent;
      expect(sql.toUpperCase()).toContain(reconstructed.toUpperCase());
    });

    test('should preserve subquery in WHERE', () => {
      const sql = `SELECT id, name FROM users
                   WHERE id IN (SELECT user_id FROM orders WHERE total > 1000)`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      // Can parse: basic SELECT
      expect(json.table).toBe('users');
      expect(json.action).toBe('SELECT');

      // Complex subquery in fallback
      expect(json.unparsedContent).toContain('IN (SELECT');
      expect(json.unparsedContent).toContain('WHERE total > 1000');
    });

    test('should preserve CTE in unparsedContent', () => {
      const sql = `WITH active_users AS (
                     SELECT id, name FROM users WHERE status = 'active'
                   )
                   SELECT * FROM active_users WHERE age > 18`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      // CTE is complex, goes to fallback
      expect(json.unparsedContent).toContain('WITH active_users');
      expect(json.unparsedContent).toContain('AS (');
    });
  });

  describe('Fallback Triggers', () => {
    const complexPatterns = [
      'CASE WHEN ... THEN ... END',
      'LEFT JOIN / RIGHT JOIN / INNER JOIN',
      'Subqueries in WHERE',
      'CTEs (WITH)',
      'Window functions (OVER)',
      'UNION / INTERSECT / EXCEPT',
      'Complex GROUP BY HAVING'
    ];

    test.each(complexPatterns)('should fallback for %s', (pattern) => {
      // Test that complex patterns trigger unparsedContent
      // Details depend on pattern
    });
  });
});
```

---

## Template 2: Reconstruction Decision Test

```typescript
// tests/formats/sql.reconstruction.test.ts

describe('SQL Reconstruction Decision Test', () => {
  describe('Basic Statements - Should Reconstruct Fully', () => {
    const basicStatements = [
      'SELECT id, name FROM users',
      'INSERT INTO users (name) VALUES ("John")',
      'UPDATE users SET status = "active" WHERE id = 1',
      'DELETE FROM users WHERE id = 1',
      'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(255))',
      'ALTER TABLE users ADD COLUMN email VARCHAR(255)',
    ];

    test.each(basicStatements)(
      'should reconstruct: %s',
      (sql) => {
        const json = JSON.parse(formatSql(sql, { minify: true }))[0];
        const reconstructed = reconstructSql(json);

        // Normalization: ignore whitespace, case
        const norm1 = sql.toUpperCase().replace(/\s+/g, ' ');
        const norm2 = reconstructed.toUpperCase().replace(/\s+/g, ' ');

        expect(norm2).toBe(norm1);
      }
    );
  });

  describe('Complex Statements - May Need Fallback', () => {
    const complexStatements = [
      'SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id',
      'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)',
      'WITH cte AS (...) SELECT * FROM cte',
    ];

    test.each(complexStatements)(
      'should handle (reconstruct or fallback): %s',
      (sql) => {
        const json = JSON.parse(formatSql(sql, { minify: true }))[0];

        // Either reconstructs fully OR uses unparsedContent
        if (json.unparsedContent) {
          // Fallback used - verify info preserved
          expect(sql).toContain(json.unparsedContent || '');
        } else {
          // Full reconstruction attempted
          const reconstructed = reconstructSql(json);
          expect(reconstructed).toBeTruthy();
        }
      }
    );
  });

  describe('Decision Metric', () => {
    test('should show reconstruction success rate', () => {
      const testSet = [/* all test cases */];
      const successful = testSet.filter(sql => {
        const json = JSON.parse(formatSql(sql, { minify: true }))[0];
        try {
          return reconstructSql(json) !== null;
        } catch {
          return false;
        }
      });

      const successRate = (successful.length / testSet.length) * 100;
      console.log(`Reconstruction success rate: ${successRate}%`);

      // Decision:
      // >80% → implement full reconstruction
      // 60-80% → hybrid (partial reconstruction + unparsedContent)
      // <60% → pure fallback (unparsedContent for complex)
    });
  });
});
```

---

## Template 3: Edge Cases - Low-Hanging Fruit

```typescript
// tests/formats/sql.edge-cases-advanced.test.ts

describe('Advanced Edge Cases', () => {
  describe('Multiple Values & Complex Expressions', () => {
    test('should parse INSERT with 10+ rows', () => {
      const sql = `INSERT INTO users (id, name) VALUES
                   (1, 'John'), (2, 'Jane'), (3, 'Bob'), (4, 'Alice'),
                   (5, 'Charlie'), (6, 'David'), (7, 'Eve'), (8, 'Frank'),
                   (9, 'Grace'), (10, 'Henry'), (11, 'Ivy')`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.rows).toHaveLength(11);
      expect(json.columns).toEqual(['id', 'name']);
    });

    test('should parse complex WHERE with multiple conditions', () => {
      const sql = `SELECT * FROM users
                   WHERE (age > 18 AND status = 'active')
                   OR (role = 'admin' AND created_at > '2024-01-01')
                   AND NOT deleted = true`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.where).toBeDefined();
      // WHERE is complex, verify it's captured (structured or fallback)
      expect(json.where || json.unparsedContent).toContain('age');
    });

    test('should handle arithmetic in SET clause', () => {
      const sql = `UPDATE products SET price = price * 1.1, stock = stock - 1
                   WHERE category = 'electronics'`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.table).toBe('products');
      // Expressions in SET - may go to unparsedContent
      expect(json.updates || json.unparsedContent).toBeDefined();
    });
  });

  describe('Function Calls', () => {
    test('should handle aggregate functions in SELECT', () => {
      const sql = `SELECT status, COUNT(*) as count, AVG(salary) as avg_salary,
                          MIN(hire_date) as earliest, MAX(hire_date) as latest
                   FROM employees
                   GROUP BY status`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.action).toBe('SELECT');
      // Functions may be in columns or unparsedContent
      expect(json.columns || json.unparsedContent).toBeDefined();
    });

    test('should handle functions in WHERE', () => {
      const sql = `SELECT * FROM orders WHERE YEAR(order_date) = 2024
                   AND MONTH(order_date) >= 3`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.action).toBe('SELECT');
      // Functions in WHERE - likely in unparsedContent
      expect(json.where || json.unparsedContent).toContain('YEAR');
    });
  });

  describe('Constraint Variations', () => {
    test('should parse multiple constraints on column', () => {
      const sql = `CREATE TABLE users (
                     id INT NOT NULL AUTO_INCREMENT PRIMARY KEY UNIQUE,
                     email VARCHAR(255) NOT NULL UNIQUE,
                     status VARCHAR(20) DEFAULT 'pending' NOT NULL
                   )`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.schema).toBeDefined();
      expect(json.schema.columns).toHaveLength(3);
    });

    test('should parse table-level constraints', () => {
      const sql = `CREATE TABLE orders (
                     id INT PRIMARY KEY,
                     user_id INT,
                     product_id INT,
                     FOREIGN KEY (user_id) REFERENCES users(id),
                     UNIQUE KEY unique_order (user_id, product_id)
                   )`;

      const json = JSON.parse(formatSql(sql, { minify: true }))[0];

      expect(json.schema).toBeDefined();
      expect(json.schema.tableConstraints).toBeDefined();
    });
  });
});
```

---

## Template 4: Real-World Test Suite

```typescript
// tests/formats/sql.real-world.test.ts

describe('Real-World SQL Patterns', () => {
  // Generated from generate-test-sql.ts
  // Test patterns that appear in production databases

  describe('Common e-commerce queries', () => {
    test('should parse order summary with joins and aggregates', () => {
      // This comes from generated-sql corpus
      const sql = generateTestSql('ecommerce-order-summary');
      const result = formatSql(sql, { minify: true });

      expect(result).toBeTruthy();
      const json = JSON.parse(result)[0];

      // Track what's parsed vs fallback
      console.log('Parsed:', Object.keys(json));
      console.log('Fallback used:', !!json.unparsedContent);
    });

    test('should parse inventory report', () => {
      const sql = generateTestSql('inventory-report');
      const json = JSON.parse(formatSql(sql, { minify: true }))[0];
      expect(json).toBeDefined();
    });
  });

  describe('Metrics', () => {
    test('should track parsing success rate across corpus', () => {
      const corpus = generateTestSql('all', { count: 100 });
      const results = corpus.map(sql => {
        try {
          const json = JSON.parse(formatSql(sql, { minify: true }));
          return { success: true, fallback: !!json[0].unparsedContent };
        } catch {
          return { success: false, fallback: false };
        }
      });

      const successRate = (results.filter(r => r.success).length / results.length) * 100;
      const fallbackRate = (results.filter(r => r.fallback).length / results.length) * 100;

      console.log(`Success rate: ${successRate}%`);
      console.log(`Fallback rate: ${fallbackRate}%`);

      // Target: 90%+ success
      expect(successRate).toBeGreaterThanOrEqual(90);
    });
  });
});
```

---

## Usage for Next Session

1. Copy these templates to actual test files
2. Implement `generateTestSql()` script (Part A)
3. Run fallback tests first (Part 2)
4. Run reconstruction decision test (Part 3)
5. Based on results, implement full reconstruction OR use unparsedContent fallback
6. Add edge case tests (Part 4)
7. Run real-world tests (Part 5)

