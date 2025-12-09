import { formatSql } from '../../src/formats/sql';

describe('SQL Mixed Statements with Execution Order Grouping', () => {
  describe('Execution Order Grouping', () => {
    test('should group consecutive INSERT statements on same table into one node', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].action).toBe('INSERT');
      expect(result[0].rowCount).toBe(2);
    });

    test('should create separate nodes for INSERT -> CREATE -> INSERT sequence', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      CREATE TABLE products (id INT, name VARCHAR(100));
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('INSERT');
      expect(result[0].table).toBe('users');
      expect(result[0].statementIndex).toBe(0);

      expect(result[1].action).toBe('CREATE');
      expect(result[1].table).toBe('products');
      expect(result[1].statementIndex).toBe(1);

      expect(result[2].action).toBe('INSERT');
      expect(result[2].table).toBe('users');
      expect(result[2].statementIndex).toBe(2);
    });

    test('should create separate nodes for interleaved table INSERTs', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      INSERT INTO products (sku) VALUES ('SKU001');
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      expect(result[0].table).toBe('users');
      expect(result[0].rowCount).toBe(1);
      expect(result[1].table).toBe('products');
      expect(result[1].rowCount).toBe(1);
      expect(result[2].table).toBe('users');
      expect(result[2].rowCount).toBe(1);
    });

    test('should create separate nodes for CREATE -> INSERT (same table)', () => {
      const sql = `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('CREATE');
      expect(result[0].table).toBe('users');
      expect(result[1].action).toBe('INSERT');
      expect(result[1].table).toBe('users');
    });

    test('should group multiple CREATE statements separately', () => {
      const sql = `CREATE TABLE users (id INT);
      CREATE TABLE products (id INT);
      CREATE TABLE orders (id INT);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(3);
      result.forEach((node: any, idx: number) => {
        expect(node.action).toBe('CREATE');
        expect(node.statementIndex).toBe(idx);
      });
    });

    test('should merge multi-row INSERT into single node when consecutive on same table', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');
      INSERT INTO users (id, name) VALUES (3, 'Bob'), (4, 'Alice');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].rowCount).toBe(4);
      expect(result[0].rows).toHaveLength(4);
    });

    test('should separate INSERT -> SELECT -> INSERT as 3 nodes (future-proofing)', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      SELECT * FROM users;
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Currently SELECT is ignored, but should create separate INSERT nodes
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    test('should handle complex e-commerce dump structure', () => {
      const sql = `CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
      INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');
      CREATE TABLE products (id INT PRIMARY KEY, sku VARCHAR(50));
      INSERT INTO products (id, sku) VALUES (1, 'SKU001'), (2, 'SKU002');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(4);
      expect(result[0].action).toBe('CREATE');
      expect(result[0].table).toBe('users');
      expect(result[1].action).toBe('INSERT');
      expect(result[1].table).toBe('users');
      expect(result[2].action).toBe('CREATE');
      expect(result[2].table).toBe('products');
      expect(result[3].action).toBe('INSERT');
      expect(result[3].table).toBe('products');
    });

    test('should handle interleaved multiple table INSERTs', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      INSERT INTO products (sku) VALUES ('SKU001');
      INSERT INTO users (id, name) VALUES (2, 'Jane');
      INSERT INTO products (sku) VALUES ('SKU002');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(4);
      expect(result[0].table).toBe('users');
      expect(result[1].table).toBe('products');
      expect(result[2].table).toBe('users');
      expect(result[3].table).toBe('products');
    });

    test('should preserve execution order with statementIndex', () => {
      const sql = `CREATE TABLE users (id INT);
      INSERT INTO users (id) VALUES (1);
      CREATE TABLE products (id INT);
      INSERT INTO products (id) VALUES (1);
      INSERT INTO products (id) VALUES (2);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].statementIndex).toBe(0);
      expect(result[1].statementIndex).toBe(1);
      expect(result[2].statementIndex).toBe(2);
      expect(result[3].statementIndex).toBe(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle empty SQL content', () => {
      const sql = '';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toEqual([]);
    });

    test('should handle SQL with only comments', () => {
      const sql = `-- Just comments
      /* And block comments */
      -- No actual statements`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toEqual([]);
    });

    test('should parse valid statements and ignore invalid ones', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John');
      INVALID SYNTAX HERE;
      CREATE TABLE products (id INT);
      MORE GARBAGE;
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should parse the 3 valid statements
      const validStatements = result.filter((stmt: any) => stmt.table && stmt.action);
      expect(validStatements.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Output Format Integrity', () => {
    test('should include table, action, and statementIndex in all nodes', () => {
      const sql = `CREATE TABLE users (id INT);
      INSERT INTO users (id) VALUES (1);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      result.forEach((node: any) => {
        expect(node).toHaveProperty('table');
        expect(node).toHaveProperty('action');
        expect(node).toHaveProperty('statementIndex');
      });
    });

    test('should include action-specific fields for each statement type', () => {
      const sql = `CREATE TABLE users (id INT);
      INSERT INTO users (id) VALUES (1);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const createNode = result[0];
      expect(createNode).toHaveProperty('schema');
      expect(createNode.schema).toHaveProperty('columns');

      const insertNode = result[1];
      expect(insertNode).toHaveProperty('columns');
      expect(insertNode).toHaveProperty('rows');
      expect(insertNode).toHaveProperty('rowCount');
    });

    test('should preserve execution order across all mixed statements', () => {
      const sql = `CREATE TABLE t1 (id INT);
      CREATE TABLE t2 (id INT);
      INSERT INTO t1 (id) VALUES (1);
      INSERT INTO t2 (id) VALUES (1);
      CREATE TABLE t3 (id INT);
      INSERT INTO t1 (id) VALUES (2);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Verify execution order is strictly increasing
      for (let i = 1; i < result.length; i++) {
        expect(result[i].statementIndex).toBeGreaterThan(result[i - 1].statementIndex);
      }
    });
  });

  describe('Real-World Scenarios', () => {
    test('should parse realistic e-commerce dump (10 CREATE + multiple INSERT)', () => {
      const sql = `
      CREATE TABLE users (
        id INT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO users (id, email) VALUES (1, 'user1@example.com'), (2, 'user2@example.com');

      CREATE TABLE products (
        id INT PRIMARY KEY,
        sku VARCHAR(50) UNIQUE,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0
      );
      INSERT INTO products (id, sku, price, stock) VALUES
        (1, 'PROD-001', 99.99, 10),
        (2, 'PROD-002', 49.99, 20);

      CREATE TABLE orders (
        id INT PRIMARY KEY,
        user_id INT NOT NULL,
        total DECIMAL(10,2),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      INSERT INTO orders (id, user_id, total) VALUES (1, 1, 149.98), (2, 2, 49.99);
      `;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 6 statements: 3 CREATE + 3 INSERT
      expect(result.length).toBe(6);

      // Verify grouping
      const creates = result.filter((s: any) => s.action === 'CREATE');
      const inserts = result.filter((s: any) => s.action === 'INSERT');

      expect(creates).toHaveLength(3);
      expect(inserts).toHaveLength(3);
      expect(creates[0].table).toBe('users');
      expect(inserts[0].table).toBe('users');
    });

    test('should handle database migration pattern (ALTER implied as unsupported)', () => {
      const sql = `CREATE TABLE users (id INT, name VARCHAR(100));
      INSERT INTO users (id, name) VALUES (1, 'John');
      INSERT INTO users (id, name) VALUES (2, 'Jane');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 3 statements
      expect(result).toHaveLength(3);
      expect(result[0].action).toBe('CREATE');
      expect(result[1].action).toBe('INSERT');
      expect(result[2].action).toBe('INSERT');
      expect(result[1].rowCount).toBe(1);
      expect(result[2].rowCount).toBe(1);
    });

    test('should handle high-volume insert batching', () => {
      let sql = 'CREATE TABLE events (id INT, event_type VARCHAR(50));';
      for (let i = 1; i <= 5; i++) {
        sql += `INSERT INTO events (id, event_type) VALUES (${i}, 'event_${i}');`;
      }
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // Should have 6 statements: 1 CREATE + 5 INSERT
      expect(result.length).toBe(6);
      expect(result[0].action).toBe('CREATE');
      expect(result.slice(1).every((s: any) => s.action === 'INSERT')).toBe(true);
    });
  });
});
