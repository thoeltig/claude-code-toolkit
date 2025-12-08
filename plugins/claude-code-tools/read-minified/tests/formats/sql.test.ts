import { formatSql } from '../../src/formats/sql';

describe('SQL Format Handler', () => {
  describe('Basic INSERT Parsing', () => {
    test('should parse single INSERT statement with multiple rows', () => {
      const sql = "INSERT INTO users (id, name, email) VALUES (1, 'John', 'john@example.com'), (2, 'Jane', 'jane@example.com');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].action).toBe('INSERT');
      expect(result[0].columns).toEqual(['id', 'name', 'email']);
      expect(result[0].rowCount).toBe(2);
      expect(result[0].rows).toHaveLength(2);
      expect(result[0].rows[0]).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com'
      });
      expect(result[0].rows[1]).toEqual({
        id: 2,
        name: 'Jane',
        email: 'jane@example.com'
      });
    });

    test('should parse single INSERT with one row', () => {
      const sql = "INSERT INTO products (sku, name, price) VALUES ('SKU001', 'Widget', 9.99);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('products');
      expect(result[0].rowCount).toBe(1);
      expect(result[0].rows[0]).toEqual({
        sku: 'SKU001',
        name: 'Widget',
        price: 9.99
      });
    });

    test('should parse multiple INSERT statements', () => {
      const sql = `INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');
      INSERT INTO products (sku, name) VALUES ('SKU001', 'Widget'), ('SKU002', 'Gadget');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].table).toBe('users');
      expect(result[0].rowCount).toBe(2);
      expect(result[1].table).toBe('products');
      expect(result[1].rowCount).toBe(2);
      expect(result[0].rows[0].name).toBe('John');
      expect(result[1].rows[0].name).toBe('Widget');
    });
  });

  describe('Data Type Handling', () => {
    test('should parse integers correctly', () => {
      const sql = "INSERT INTO data (count) VALUES (42), (100), (0), (-5);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].count).toBe(42);
      expect(result[0].rows[1].count).toBe(100);
      expect(result[0].rows[2].count).toBe(0);
      expect(result[0].rows[3].count).toBe(-5);
    });

    test('should parse float numbers correctly', () => {
      const sql = "INSERT INTO prices (amount) VALUES (9.99), (3.14159), (0.5);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].amount).toBe(9.99);
      expect(result[0].rows[1].amount).toBe(3.14159);
      expect(result[0].rows[2].amount).toBe(0.5);
    });

    test('should parse boolean values', () => {
      const sql = "INSERT INTO config (enabled, active) VALUES (true, false), (TRUE, FALSE);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].enabled).toBe(true);
      expect(result[0].rows[0].active).toBe(false);
      expect(result[0].rows[1].enabled).toBe(true);
    });

    test('should handle NULL values (omitted from row)', () => {
      const sql = "INSERT INTO users (id, name, email) VALUES (1, 'John', NULL), (2, NULL, 'jane@example.com');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toEqual({
        id: 1,
        name: 'John'
      });
      expect(result[0].rows[0]).not.toHaveProperty('email');
      expect(result[0].rows[1]).toEqual({
        id: 2,
        email: 'jane@example.com'
      });
      expect(result[0].rows[1]).not.toHaveProperty('name');
    });

    test('should distinguish NULL from string "NULL"', () => {
      const sql = "INSERT INTO data (value) VALUES (NULL), ('NULL');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).not.toHaveProperty('value');
      expect(result[0].rows[1]).toEqual({ value: 'NULL' });
    });
  });

  describe('String Handling', () => {
    test('should parse simple strings', () => {
      const sql = "INSERT INTO items (name) VALUES ('Apple'), ('Banana'), ('Cherry');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].name).toBe('Apple');
      expect(result[0].rows[1].name).toBe('Banana');
    });

    test('should handle strings with commas', () => {
      const sql = "INSERT INTO addresses (full_address) VALUES ('123 Main St, Springfield'), ('456 Oak Ave, Shelbyville, IL');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].full_address).toBe('123 Main St, Springfield');
      expect(result[0].rows[1].full_address).toBe('456 Oak Ave, Shelbyville, IL');
    });

    test('should handle escaped quotes in strings', () => {
      const sql = `INSERT INTO quotes (text) VALUES ('He said "hello"'), ('It''s working');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].text).toContain('hello');
      expect(result[0].rows[1].text).toContain("'");
    });

    test('should preserve spaces in quoted strings', () => {
      const sql = "INSERT INTO users (name) VALUES ('John Doe'), ('text with spaces');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].name).toBe('John Doe');
      expect(result[0].rows[1].name).toContain('spaces');
    });

    test('should handle special characters in strings', () => {
      const sql = "INSERT INTO data (value) VALUES ('test@example.com'), ('path/to/file'), ('$100.00');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0].value).toBe('test@example.com');
      expect(result[0].rows[1].value).toBe('path/to/file');
      expect(result[0].rows[2].value).toBe('$100.00');
    });
  });

  describe('Column Handling', () => {
    test('should handle various column counts', () => {
      const sql = "INSERT INTO tbl (a, b) VALUES (1, 2);\nINSERT INTO big (x, y, z, w) VALUES (1, 2, 3, 4);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toEqual({ a: 1, b: 2 });
      expect(result[1].rows[0]).toEqual({ x: 1, y: 2, z: 3, w: 4 });
    });

    test('should handle whitespace around column names', () => {
      const sql = "INSERT INTO users ( id , name , email ) VALUES (1, 'John', 'john@example.com');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toEqual({
        id: 1,
        name: 'John',
        email: 'john@example.com'
      });
    });

    test('should handle various column name styles', () => {
      const sql = "INSERT INTO table1 (ID, Name, Email_Address) VALUES (1, 'John', 'john@example.com');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toHaveProperty('ID');
      expect(result[0].rows[0]).toHaveProperty('Name');
      expect(result[0].rows[0]).toHaveProperty('Email_Address');
    });
  });

  describe('Case Insensitivity', () => {
    test('should handle lowercase INSERT', () => {
      const sql = "insert into users (id, name) values (1, 'John');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toEqual({ id: 1, name: 'John' });
    });

    test('should handle uppercase INSERT', () => {
      const sql = "INSERT INTO USERS (ID, NAME) VALUES (1, 'John');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toEqual({ ID: 1, NAME: 'John' });
    });

    test('should handle mixed case INSERT', () => {
      const sql = "InSeRt InTo users (Id, NaMe) VaLuEs (1, 'John');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).toEqual({ Id: 1, NaMe: 'John' });
    });

    test('should handle case-insensitive NULL', () => {
      const sql = "INSERT INTO users (id, name) VALUES (1, null), (2, NULL), (3, Null);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].rows[0]).not.toHaveProperty('name');
      expect(result[0].rows[1]).not.toHaveProperty('name');
      expect(result[0].rows[2]).not.toHaveProperty('name');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty SQL content', () => {
      const output = formatSql('', { minify: true });
      expect(output).toBe('[]');
    });

    test('should handle SQL with no INSERT statements', () => {
      const sql = 'SELECT * FROM users; CREATE TABLE users (id INT);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toEqual([]);
    });

    test('should handle SQL with comments (ignored)', () => {
      const sql = `-- This is a comment
      INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');
      /* Block comment */
      INSERT INTO products (sku) VALUES ('SKU001');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle INSERT without semicolon', () => {
      const sql = "INSERT INTO users (id, name) VALUES (1, 'John')";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].rows[0]).toEqual({ id: 1, name: 'John' });
    });

    test('should handle table names with underscores and numbers', () => {
      const sql = "INSERT INTO user_data_v2 (id, name) VALUES (1, 'John');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('user_data_v2');
      expect(result[0].rows[0]).toEqual({ id: 1, name: 'John' });
    });

    test('should gracefully handle malformed SQL', () => {
      const sql = "completely invalid sql content here";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toEqual([]);
    });
  });

  describe('Real-World Examples', () => {
    test('should parse user registration data', () => {
      const sql = `INSERT INTO users (user_id, username, email, phone, verified, created_at)
        VALUES
        (1001, 'john_doe', 'john@example.com', '555-1234', true, '2024-01-15 10:30:00'),
        (1002, 'jane_smith', 'jane@example.com', NULL, false, '2024-01-15 11:45:30');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].rowCount).toBe(2);
      expect(result[0].rows[0]).toHaveProperty('user_id', 1001);
      expect(result[0].rows[0]).toHaveProperty('verified', true);
      expect(result[0].rows[1]).not.toHaveProperty('phone');
    });

    test('should parse product inventory', () => {
      const sql = `INSERT INTO inventory (sku, product_name, quantity, price, category)
        VALUES
        ('PROD-001', 'Laptop Computer', 15, 899.99, 'Electronics'),
        ('PROD-002', 'USB Cable', 500, 5.99, 'Accessories'),
        ('PROD-003', 'Monitor Stand', 0, 24.99, 'Accessories');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('inventory');
      expect(result[0].rowCount).toBe(3);
      expect(result[0].rows[0].quantity).toBe(15);
      expect(result[0].rows[2].quantity).toBe(0);
    });

    test('should parse order data', () => {
      const sql = `INSERT INTO orders (order_id, customer_id, total_amount, status, notes)
        VALUES
        ('ORD-001', 1001, 1899.99, 'shipped', 'Express delivery'),
        ('ORD-002', 1002, 75.25, 'pending', NULL),
        ('ORD-003', 1001, 299.99, 'delivered', 'Arrived on 2024-01-20');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('orders');
      expect(result[0].rowCount).toBe(3);
      expect(result[0].rows[0].status).toBe('shipped');
      expect(result[0].rows[1]).not.toHaveProperty('notes');
    });
  });

  describe('Output Format', () => {
    test('should return minified JSON by default', () => {
      const sql = "INSERT INTO users (id, name) VALUES (1, 'John');";
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });

    test('should return pretty-printed JSON when minify is false', () => {
      const sql = "INSERT INTO users (id, name) VALUES (1, 'John');";
      const output = formatSql(sql, { minify: false });

      expect(output).toContain('\n');
    });
  });
});
