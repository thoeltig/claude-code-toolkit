import { formatSql } from '../../src/formats/sql';

describe('SQL CREATE TABLE Parsing', () => {
  describe('Basic Parsing', () => {
    test('should parse single table with basic column types', () => {
      const sql = `CREATE TABLE users (
        id INT,
        name VARCHAR(255),
        bio TEXT
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].action).toBe('CREATE');
      expect(result[0].schema).toBeDefined();
      expect(result[0].schema.columns).toHaveLength(3);
      expect(result[0].schema.columns[0]).toEqual({
        name: 'id',
        type: 'INT',
        constraints: []
      });
      expect(result[0].schema.columns[1]).toEqual({
        name: 'name',
        type: 'VARCHAR(255)',
        constraints: []
      });
      expect(result[0].schema.columns[2]).toEqual({
        name: 'bio',
        type: 'TEXT',
        constraints: []
      });
    });

    test('should parse multiple CREATE TABLE statements sequentially', () => {
      const sql = `CREATE TABLE users (id INT, name VARCHAR(100));
      CREATE TABLE products (sku VARCHAR(50), price DECIMAL(10,2));`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(2);
      expect(result[0].table).toBe('users');
      expect(result[0].action).toBe('CREATE');
      expect(result[1].table).toBe('products');
      expect(result[1].action).toBe('CREATE');
    });

    test('should parse table with many columns (10+)', () => {
      const sql = `CREATE TABLE big_table (
        col1 INT, col2 VARCHAR(50), col3 TEXT, col4 BOOLEAN,
        col5 DATE, col6 TIMESTAMP, col7 DECIMAL(10,2),
        col8 FLOAT, col9 BLOB, col10 UUID, col11 CHAR(10)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].schema.columns).toHaveLength(11);
      expect(result[0].schema.columns[10].name).toBe('col11');
    });

    test('should handle case insensitivity (CREATE, Create, create)', () => {
      const sql1 = 'CREATE TABLE test1 (id INT);';
      const sql2 = 'Create Table test2 (id INT);';
      const sql3 = 'create table test3 (id INT);';

      [sql1, sql2, sql3].forEach(sql => {
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);
        expect(result).toHaveLength(1);
        expect(result[0].action).toBe('CREATE');
      });
    });

    test('should handle multiline with various whitespace indentation', () => {
      const sql = `CREATE TABLE users (
\tid INT,
\t\tname VARCHAR(100),
  email TEXT
  )`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].schema.columns).toHaveLength(3);
    });
  });

  describe('Column Types', () => {
    test('should parse numeric types: INT, BIGINT, DECIMAL, FLOAT, DOUBLE', () => {
      const sql = `CREATE TABLE numbers (
        int_col INT,
        big_col BIGINT,
        dec_col DECIMAL(10,2),
        float_col FLOAT,
        double_col DOUBLE
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const types = result[0].schema.columns.map((c: any) => c.type);
      expect(types).toContain('INT');
      expect(types).toContain('BIGINT');
      expect(types).toContain('DECIMAL(10,2)');
      expect(types).toContain('FLOAT');
      expect(types).toContain('DOUBLE');
    });

    test('should parse string types: VARCHAR, TEXT, CHAR', () => {
      const sql = `CREATE TABLE strings (
        varchar_col VARCHAR(255),
        text_col TEXT,
        char_col CHAR(10)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const types = result[0].schema.columns.map((c: any) => c.type);
      expect(types).toContain('VARCHAR(255)');
      expect(types).toContain('TEXT');
      expect(types).toContain('CHAR(10)');
    });

    test('should parse date/time types: DATE, TIMESTAMP, DATETIME', () => {
      const sql = `CREATE TABLE dates (
        date_col DATE,
        timestamp_col TIMESTAMP,
        datetime_col DATETIME
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const types = result[0].schema.columns.map((c: any) => c.type);
      expect(types).toContain('DATE');
      expect(types).toContain('TIMESTAMP');
      expect(types).toContain('DATETIME');
    });

    test('should parse boolean types: BOOLEAN, BOOL', () => {
      const sql = `CREATE TABLE booleans (
        bool_col BOOLEAN,
        flag_col BOOL
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const types = result[0].schema.columns.map((c: any) => c.type);
      expect(types).toContain('BOOLEAN');
      expect(types).toContain('BOOL');
    });

    test('should parse special types: BLOB, UUID', () => {
      const sql = `CREATE TABLE special (
        blob_col BLOB,
        uuid_col UUID
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const types = result[0].schema.columns.map((c: any) => c.type);
      expect(types).toContain('BLOB');
      expect(types).toContain('UUID');
    });
  });

  describe('Constraints', () => {
    test('should parse PRIMARY KEY constraint (single column)', () => {
      const sql = 'CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const idCol = result[0].schema.columns.find((c: any) => c.name === 'id');
      expect(idCol.constraints).toContain('PRIMARY KEY');
    });

    test('should parse PRIMARY KEY constraint (composite)', () => {
      const sql = `CREATE TABLE order_items (
        order_id INT,
        product_id INT,
        quantity INT,
        PRIMARY KEY (order_id, product_id)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].schema.tableConstraints).toBeDefined();
      expect(result[0].schema.tableConstraints).toContain('PRIMARY KEY (order_id, product_id)');
    });

    test('should parse NOT NULL constraint', () => {
      const sql = 'CREATE TABLE users (id INT NOT NULL, email VARCHAR(100) NOT NULL);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      result[0].schema.columns.forEach((col: any) => {
        expect(col.constraints).toContain('NOT NULL');
      });
    });

    test('should parse UNIQUE constraint', () => {
      const sql = 'CREATE TABLE users (id INT PRIMARY KEY, email VARCHAR(100) UNIQUE);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const emailCol = result[0].schema.columns.find((c: any) => c.name === 'email');
      expect(emailCol.constraints).toContain('UNIQUE');
    });

    test('should parse DEFAULT constraint with various value types', () => {
      const sql = `CREATE TABLE config (
        string_val VARCHAR(100) DEFAULT 'active',
        numeric_val INT DEFAULT 0,
        bool_val BOOLEAN DEFAULT true,
        null_val TEXT DEFAULT NULL
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stringCol = result[0].schema.columns.find((c: any) => c.name === 'string_val');
      expect(stringCol.default).toBe("'active'");

      const numCol = result[0].schema.columns.find((c: any) => c.name === 'numeric_val');
      expect(numCol.default).toBe('0');

      const boolCol = result[0].schema.columns.find((c: any) => c.name === 'bool_val');
      expect(boolCol.default).toBe('true');

      const nullCol = result[0].schema.columns.find((c: any) => c.name === 'null_val');
      expect(nullCol.default).toBe('NULL');
    });

    test('should parse FOREIGN KEY constraint', () => {
      const sql = `CREATE TABLE orders (
        id INT PRIMARY KEY,
        user_id INT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].schema.tableConstraints).toBeDefined();
      expect(result[0].schema.tableConstraints).toContain('FOREIGN KEY (user_id) REFERENCES users(id)');
    });

    test('should parse CHECK constraint', () => {
      const sql = `CREATE TABLE products (
        id INT,
        price DECIMAL(10,2),
        CHECK (price > 0)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].schema.tableConstraints).toBeDefined();
      expect(result[0].schema.tableConstraints).toContain('CHECK (price > 0)');
    });

    test('should parse multiple constraints on single column', () => {
      const sql = `CREATE TABLE users (id INT PRIMARY KEY NOT NULL UNIQUE, email VARCHAR(100) NOT NULL UNIQUE DEFAULT 'user@example.com');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const idCol = result[0].schema.columns.find((c: any) => c.name === 'id');
      expect(idCol.constraints).toContain('PRIMARY KEY');
      expect(idCol.constraints).toContain('NOT NULL');
      expect(idCol.constraints).toContain('UNIQUE');

      const emailCol = result[0].schema.columns.find((c: any) => c.name === 'email');
      expect(emailCol.constraints).toContain('NOT NULL');
      expect(emailCol.constraints).toContain('UNIQUE');
      expect(emailCol.default).toBe("'user@example.com'");
    });
  });

  describe('Edge Cases', () => {
    test('should handle CREATE without semicolon', () => {
      const sql = 'CREATE TABLE users (id INT, name VARCHAR(100))';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
    });

    test('should handle comments in CREATE TABLE (ignored)', () => {
      const sql = `-- This is a comment
      CREATE TABLE users (
        -- User ID
        id INT PRIMARY KEY,
        /* Name field */ name VARCHAR(100)
      );`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].schema.columns).toHaveLength(2);
    });

    test('should handle table names with underscores and numbers', () => {
      const sql = 'CREATE TABLE user_data_v2 (id_num INT);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].table).toBe('user_data_v2');
    });

    test('should handle CREATE TABLE IF NOT EXISTS', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS users (id INT);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].table).toBe('users');
    });
  });

  describe('Output Format', () => {
    test('should return minified JSON by default', () => {
      const sql = 'CREATE TABLE users (id INT, name VARCHAR(100));';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });

    test('should return pretty-printed JSON when minify is false', () => {
      const sql = 'CREATE TABLE users (id INT);';
      const output = formatSql(sql, { minify: false });

      expect(output).toContain('\n');
    });

    test('should include statementIndex in output', () => {
      const sql = `CREATE TABLE users (id INT);
      CREATE TABLE products (sku VARCHAR(50));`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].statementIndex).toBe(0);
      expect(result[1].statementIndex).toBe(1);
    });

    test('should include schema with columns array', () => {
      const sql = 'CREATE TABLE test (id INT, name VARCHAR(100));';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].schema).toHaveProperty('columns');
      expect(Array.isArray(result[0].schema.columns)).toBe(true);
    });
  });
});
