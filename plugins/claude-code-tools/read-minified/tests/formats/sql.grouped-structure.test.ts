import { formatSql } from '../../src/formats/sql';

/**
 * Tests for the new table-grouped output structure
 * These tests verify the ACTUAL output format (not unwrapped)
 * ensuring the transformation is working correctly
 */
describe('SQL Grouped Structure Output', () => {
  describe('Basic Grouped Structure', () => {
    test('should output single table with single action in grouped format', () => {
      const sql = 'SELECT * FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Verify it's an array
      expect(Array.isArray(result)).toBe(true);

      // Verify first item is a table group
      expect(result[0]).toHaveProperty('table');
      expect(result[0]).toHaveProperty('actions');
      expect(Array.isArray(result[0].actions)).toBe(true);

      // Verify table name
      expect(result[0].table).toBe('users');

      // Verify action is inside actions array
      expect(result[0].actions[0]).toHaveProperty('action');
      expect(result[0].actions[0].action).toBe('SELECT');
    });

    test('should group multiple actions for same table', () => {
      const sql = 'CREATE TABLE users (id INT); INSERT INTO users VALUES (1);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 1 table group with 2 actions
      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(2);

      // Actions should not have table field (moved to parent)
      expect(result[0].actions[0]).not.toHaveProperty('table');
      expect(result[0].actions[1]).not.toHaveProperty('table');

      // Actions should have action field and other properties
      expect(result[0].actions[0].action).toBe('CREATE');
      expect(result[0].actions[1].action).toBe('INSERT');
      expect(result[0].actions[1].rows).toBeDefined();
    });

    test('should separate multiple tables into different groups', () => {
      const sql = `CREATE TABLE users (id INT);
                   CREATE TABLE products (id INT);
                   INSERT INTO users VALUES (1);
                   INSERT INTO products VALUES (1);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 2 table groups
      expect(result).toHaveLength(2);

      // First group: users with CREATE and INSERT
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(2);
      expect(result[0].actions[0].action).toBe('CREATE');
      expect(result[0].actions[1].action).toBe('INSERT');

      // Second group: products with CREATE and INSERT
      expect(result[1].table).toBe('products');
      expect(result[1].actions).toHaveLength(2);
      expect(result[1].actions[0].action).toBe('CREATE');
      expect(result[1].actions[1].action).toBe('INSERT');
    });
  });

  describe('Action-Specific Fields Placement', () => {
    test('should place table-agnostic fields inside action', () => {
      const sql = 'SELECT id, name FROM users WHERE age > 18;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];

      // These fields should be INSIDE the action, not at group level
      expect(action).toHaveProperty('columns');
      expect(action).toHaveProperty('where');
      expect(action.where).toBe('age > 18');
      expect(action.columns).toEqual(['id', 'name']);

      // Table should NOT be on the action
      expect(action).not.toHaveProperty('table');
    });

    test('should preserve statementIndex in action', () => {
      const sql = `CREATE TABLE users (id INT);
                   INSERT INTO users VALUES (1);
                   SELECT * FROM users;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result[0].actions;

      // statementIndex should be preserved in each action
      expect(actions[0].statementIndex).toBe(0);
      expect(actions[1].statementIndex).toBe(1);
      expect(actions[2].statementIndex).toBe(2);
    });

    test('should include INSERT rows inside action', () => {
      const sql = "INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const action = result[0].actions[0];

      expect(action).toHaveProperty('rows');
      expect(action).toHaveProperty('columns');
      expect(action).toHaveProperty('rowCount');
      expect(action.rowCount).toBe(2);
      expect(action.rows).toHaveLength(2);
    });
  });

  describe('System Statements (No Table)', () => {
    test('should include system statements at top level (not grouped)', () => {
      const sql = 'BEGIN; CREATE TABLE users (id INT); COMMIT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 3 items: BEGIN, users group, COMMIT
      expect(result.length).toBeGreaterThanOrEqual(2);

      // Find system statements (those without actions property)
      const systemStatements = result.filter((item: any) => !item.actions);
      const tableGroups = result.filter((item: any) => item.actions);

      expect(tableGroups).toHaveLength(1);
      expect(tableGroups[0].table).toBe('users');

      // System statements should exist
      expect(systemStatements.length).toBeGreaterThan(0);
      expect(systemStatements[0].action).toBe('BEGIN');
    });

    test('should preserve GRANT statement at top level', () => {
      const sql = 'GRANT SELECT ON users TO read_user;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // GRANT has no table, should be at top level
      const grantStmt = result.find((item: any) => item.action === 'GRANT');
      expect(grantStmt).toBeDefined();
      expect(grantStmt).not.toHaveProperty('actions');
      expect(grantStmt.grantee).toBe('read_user');
    });
  });

  describe('Token Efficiency Verification', () => {
    test('should reduce token count with grouped structure (multi-table)', () => {
      const sql = `CREATE TABLE users (id INT);
                   CREATE TABLE orders (id INT);
                   CREATE TABLE products (id INT);
                   INSERT INTO users VALUES (1);
                   INSERT INTO orders VALUES (1);
                   INSERT INTO products VALUES (1);
                   UPDATE users SET active = true;
                   UPDATE orders SET status = 'shipped';`;

      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 3 table groups
      expect(result.filter((r: any) => r.actions)).toHaveLength(3);

      // Count "table": occurrences - should be minimal (one per table group)
      const tableOccurrences = (output.match(/"table":/g) || []).length;
      expect(tableOccurrences).toBe(3); // Only 3 table declarations

      // In flat format, we'd have 8 operations × "table": reference
      // In grouped, we have 3 tables × "table": reference
      // This is the efficiency gain
      expect(tableOccurrences).toBeLessThan(8);
    });

    test('should show table grouping reduces JSON size', () => {
      const sql = `CREATE TABLE t1 (id INT);
                   INSERT INTO t1 VALUES (1);
                   UPDATE t1 SET x = 1;
                   DELETE FROM t1 WHERE id = 1;
                   SELECT * FROM t1;`;

      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Single table with 5 operations should have:
      // - 1 "table" field (in group)
      // - 5 "action" fields (in actions)
      // - 0 "table" fields in actions

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('t1');
      expect(result[0].actions).toHaveLength(5);

      // Verify no redundant table fields in actions
      const hasTableInActions = result[0].actions.some((a: any) => 'table' in a);
      expect(hasTableInActions).toBe(false);
    });
  });

  describe('Complex Queries Maintain Structure', () => {
    test('should maintain structure with CASE statements', () => {
      const sql = 'SELECT id, CASE status WHEN \'a\' THEN 1 END FROM users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].action).toBe('SELECT');
      expect(result[0].actions[0].caseStatements).toBeDefined();
    });

    test('should maintain structure with JOINs', () => {
      const sql = 'SELECT u.id FROM users u JOIN orders o ON u.id = o.user_id;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('users');
      const action = result[0].actions[0];
      expect(action.action).toBe('SELECT');
      expect(action.joins).toBeDefined();
      expect(action.joins[0].table).toBe('orders');
    });

    test('should maintain structure with GROUP BY and HAVING', () => {
      const sql = 'SELECT status, COUNT(*) FROM users GROUP BY status HAVING COUNT(*) > 5;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('users');
      const action = result[0].actions[0];
      expect(action.groupByColumns).toBeDefined();
      expect(action.havingClause).toBeDefined();
    });
  });

  describe('Format Consistency', () => {
    test('should maintain consistent structure across different statement types', () => {
      const sql = `CREATE TABLE users (id INT);
                   INSERT INTO users VALUES (1);
                   SELECT * FROM users;
                   UPDATE users SET active = true;
                   DELETE FROM users WHERE id > 100;
                   TRUNCATE users;`;

      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // All should be in same table group
      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions).toHaveLength(6);

      // All actions should have action field, none should have table field
      for (const action of result[0].actions) {
        expect(action).toHaveProperty('action');
        expect(action).not.toHaveProperty('table');
      }
    });

    test('should output valid minified JSON', () => {
      const sql = 'CREATE TABLE users (id INT); INSERT INTO users VALUES (1);';
      const output = formatSql(sql, { minify: true });

      // Should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();

      // Should be minified (single line)
      expect(output.includes('\n')).toBe(false);
    });

    test('should output valid pretty-printed JSON', () => {
      const sql = 'CREATE TABLE users (id INT); INSERT INTO users VALUES (1);';
      const output = formatSql(sql, { minify: false });

      // Should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();

      // Should have newlines (pretty-printed)
      expect(output.includes('\n')).toBe(true);

      // Should have proper indentation
      expect(output.includes('  ')).toBe(true);
    });
  });

  describe('Grouped Structure Benefits', () => {
    test('should provide table context at parent level', () => {
      const sql = 'CREATE TABLE users (id INT); INSERT INTO users VALUES (1); UPDATE users SET email = \'test\';';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Table name is clear at the top level (single reference)
      expect(result[0]).toHaveProperty('table');
      expect(result[0].table).toBe('users');

      // Reader knows all actions in this group are for 'users'
      // Much better semantic structure than flat array
      expect(result[0].actions.length).toBeGreaterThan(1);
    });

    test('should enable efficient filtering by table', () => {
      const sql = `CREATE TABLE users (id INT);
                   CREATE TABLE products (id INT);
                   INSERT INTO users VALUES (1);
                   INSERT INTO products VALUES (1);`;

      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Easy to find all operations on a specific table
      const userOps = result.find((r: any) => r.table === 'users');
      expect(userOps).toBeDefined();
      expect(userOps.actions).toHaveLength(2);

      const productOps = result.find((r: any) => r.table === 'products');
      expect(productOps).toBeDefined();
      expect(productOps.actions).toHaveLength(2);
    });
  });
});
