import { formatSql } from '../../src/formats/sql';

/**
 * ALTER TABLE Statement Tests
 *
 * ALTER TABLE modifies table structure and definitions
 * Syntax: ALTER TABLE table_name action ...;
 *
 * Supported actions:
 * - ADD COLUMN
 * - MODIFY/ALTER COLUMN
 * - DROP COLUMN
 * - ADD CONSTRAINT
 * - DROP CONSTRAINT
 * - RENAME TO
 * - RENAME COLUMN
 */

describe('SQL ALTER TABLE Statement Parsing', () => {
  describe('ADD COLUMN', () => {
    test('should parse simple ADD COLUMN', () => {
      const sql = 'ALTER TABLE users ADD COLUMN email VARCHAR(255);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('ALTER');
      expect(result[0].table).toBe('users');
      expect(result[0].alterationType).toBe('ADD_COLUMN');
      expect(result[0].columnDefinition).toBeDefined();
    });

    test('should parse ADD COLUMN with constraints', () => {
      const sql = 'ALTER TABLE users ADD COLUMN age INT NOT NULL DEFAULT 18;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('ADD_COLUMN');
      expect(result[0].columnDefinition).toBeDefined();
    });

    test('should parse ADD COLUMN with PRIMARY KEY', () => {
      const sql = 'ALTER TABLE users ADD COLUMN id INT PRIMARY KEY;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('ADD_COLUMN');
    });

    test('should handle case insensitivity', () => {
      const sql = 'alter table users add column email varchar(255);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('ADD_COLUMN');
    });
  });

  describe('MODIFY COLUMN', () => {
    test('should parse MySQL MODIFY COLUMN', () => {
      const sql = 'ALTER TABLE users MODIFY COLUMN email VARCHAR(500);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('MODIFY_COLUMN');
      expect(result[0].columnName).toBe('email');
    });

    test('should parse PostgreSQL ALTER COLUMN', () => {
      const sql = 'ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(500);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('MODIFY_COLUMN');
    });

    test('should parse ALTER COLUMN SET DEFAULT', () => {
      const sql = "ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('MODIFY_COLUMN');
    });

    test('should parse ALTER COLUMN DROP DEFAULT', () => {
      const sql = 'ALTER TABLE users ALTER COLUMN status DROP DEFAULT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('MODIFY_COLUMN');
    });

    test('should parse ALTER COLUMN SET NOT NULL', () => {
      const sql = 'ALTER TABLE users ALTER COLUMN email SET NOT NULL;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('MODIFY_COLUMN');
    });

    test('should parse ALTER COLUMN DROP NOT NULL', () => {
      const sql = 'ALTER TABLE users ALTER COLUMN email DROP NOT NULL;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('MODIFY_COLUMN');
    });
  });

  describe('DROP COLUMN', () => {
    test('should parse simple DROP COLUMN', () => {
      const sql = 'ALTER TABLE users DROP COLUMN age;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('DROP_COLUMN');
      expect(result[0].columnName).toBe('age');
    });

    test('should parse DROP COLUMN with CASCADE', () => {
      const sql = 'ALTER TABLE users DROP COLUMN age CASCADE;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('DROP_COLUMN');
      expect(result[0].cascade).toBe(true);
    });

    test('should parse DROP COLUMN with RESTRICT', () => {
      const sql = 'ALTER TABLE users DROP COLUMN age RESTRICT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('DROP_COLUMN');
      expect(result[0].restrict).toBe(true);
    });

    test('should handle case insensitivity', () => {
      const sql = 'alter table users drop column age;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('DROP_COLUMN');
    });
  });

  describe('ADD CONSTRAINT', () => {
    test('should parse ADD PRIMARY KEY CONSTRAINT', () => {
      const sql = 'ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('ADD_CONSTRAINT');
      expect(result[0].constraintName).toBe('pk_users');
    });

    test('should parse ADD UNIQUE CONSTRAINT', () => {
      const sql = 'ALTER TABLE users ADD CONSTRAINT uq_email UNIQUE (email);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('ADD_CONSTRAINT');
      expect(result[0].constraintName).toBe('uq_email');
    });

    test('should parse ADD FOREIGN KEY CONSTRAINT', () => {
      const sql = 'ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('ADD_CONSTRAINT');
      expect(result[0].constraintName).toBe('fk_user');
    });

    test('should parse ADD CHECK CONSTRAINT', () => {
      const sql = 'ALTER TABLE users ADD CONSTRAINT ck_age CHECK (age >= 18);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('ADD_CONSTRAINT');
      expect(result[0].constraintName).toBe('ck_age');
    });
  });

  describe('DROP CONSTRAINT', () => {
    test('should parse simple DROP CONSTRAINT', () => {
      const sql = 'ALTER TABLE users DROP CONSTRAINT pk_users;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('DROP_CONSTRAINT');
      expect(result[0].constraintName).toBe('pk_users');
    });

    test('should parse DROP CONSTRAINT with CASCADE', () => {
      const sql = 'ALTER TABLE users DROP CONSTRAINT fk_user CASCADE;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('DROP_CONSTRAINT');
      expect(result[0].cascade).toBe(true);
    });

    test('should parse DROP CONSTRAINT with RESTRICT', () => {
      const sql = 'ALTER TABLE users DROP CONSTRAINT pk_users RESTRICT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('DROP_CONSTRAINT');
      expect(result[0].restrict).toBe(true);
    });
  });

  describe('RENAME TABLE', () => {
    test('should parse RENAME TO', () => {
      const sql = 'ALTER TABLE users RENAME TO accounts;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('RENAME_TABLE');
      expect(result[0].newName).toBe('accounts');
    });

    test('should parse RENAME TABLE syntax', () => {
      const sql = 'ALTER TABLE users RENAME TABLE users TO accounts;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('RENAME_TABLE');
    });

    test('should handle case insensitivity', () => {
      const sql = 'alter table users rename to accounts;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('RENAME_TABLE');
    });
  });

  describe('RENAME COLUMN', () => {
    test('should parse RENAME COLUMN', () => {
      const sql = 'ALTER TABLE users RENAME COLUMN old_name TO new_name;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('RENAME_COLUMN');
      expect(result[0].columnName).toBe('old_name');
      expect(result[0].newColumnName).toBe('new_name');
    });

    test('should parse PostgreSQL RENAME syntax', () => {
      const sql = 'ALTER TABLE users RENAME old_name TO new_name;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('RENAME_COLUMN');
    });

    test('should handle case insensitivity', () => {
      const sql = 'alter table users rename column old_name to new_name;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('RENAME_COLUMN');
    });
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace', () => {
      const sql = '  ALTER   TABLE   users   ADD   COLUMN   email   VARCHAR(255)  ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
      expect(result[0].alterationType).toBe('ADD_COLUMN');
    });

    test('should handle newlines', () => {
      const sql = `ALTER TABLE users
      ADD COLUMN email VARCHAR(255);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
    });

    test('should handle multiline constraints', () => {
      const sql = `ALTER TABLE orders
      ADD CONSTRAINT fk_user
      FOREIGN KEY (user_id)
      REFERENCES users(id);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].alterationType).toBe('ADD_CONSTRAINT');
    });
  });

  describe('Comments with ALTER TABLE', () => {
    test('should handle line comment', () => {
      const sql = `-- Add email column
      ALTER TABLE users ADD COLUMN email VARCHAR(255);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
    });

    test('should handle block comment', () => {
      const sql = `/* Add email column for contact */
      ALTER TABLE users ADD COLUMN email VARCHAR(255);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('ALTER');
    });
  });

  describe('Mixed Statements', () => {
    test('should handle multiple ALTER on same table', () => {
      const sql = `ALTER TABLE users ADD COLUMN email VARCHAR(255);
      ALTER TABLE users ADD COLUMN phone VARCHAR(20);
      ALTER TABLE users DROP COLUMN age;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const alterCount = result.filter((r: any) => r.action === 'ALTER').length;
      expect(alterCount).toBeGreaterThanOrEqual(3);
    });

    test('should handle ALTER on different tables', () => {
      const sql = `ALTER TABLE users ADD COLUMN email VARCHAR(255);
      ALTER TABLE orders ADD COLUMN notes TEXT;
      ALTER TABLE products DROP COLUMN obsolete_field;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const tables = result.map((r: any) => r.table);
      expect(tables).toContain('users');
      expect(tables).toContain('orders');
      expect(tables).toContain('products');
    });

    test('should handle ALTER with DML', () => {
      const sql = `ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';
      INSERT INTO users (name, status) VALUES ('John', 'active');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const alterCount = result.filter((r: any) => r.action === 'ALTER').length;
      const insertCount = result.filter((r: any) => r.action === 'INSERT').length;
      expect(alterCount).toBeGreaterThanOrEqual(1);
      expect(insertCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle schema evolution workflow', () => {
      const sql = `ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
      ALTER TABLE users ADD CONSTRAINT ck_email CHECK (email LIKE '%@%.%');
      ALTER TABLE users ADD COLUMN verified_at TIMESTAMP DEFAULT NULL;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    test('should handle constraint management workflow', () => {
      const sql = `ALTER TABLE orders ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id);
      ALTER TABLE orders ADD CONSTRAINT fk_product_id FOREIGN KEY (product_id) REFERENCES products(id);
      ALTER TABLE orders ADD CONSTRAINT ck_quantity CHECK (quantity > 0);`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const constraintCount = result.filter((r: any) => r.alterationType === 'ADD_CONSTRAINT').length;
      expect(constraintCount).toBeGreaterThanOrEqual(3);
    });

    test('should handle column maintenance workflow', () => {
      const sql = `ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE users ALTER COLUMN email SET NOT NULL;
      ALTER TABLE users RENAME COLUMN username TO login_name;
      ALTER TABLE users DROP COLUMN legacy_field;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure for ADD COLUMN', () => {
      const sql = 'ALTER TABLE users ADD COLUMN email VARCHAR(255);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('table');
      expect(stmt).toHaveProperty('alterationType');
      expect(stmt).toHaveProperty('statementIndex');
    });

    test('should have correct output structure for ADD CONSTRAINT', () => {
      const sql = 'ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('table');
      expect(stmt).toHaveProperty('alterationType');
      expect(stmt).toHaveProperty('constraintName');
    });

    test('should have correct output structure for RENAME COLUMN', () => {
      const sql = 'ALTER TABLE users RENAME COLUMN old_name TO new_name;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('table');
      expect(stmt).toHaveProperty('columnName');
      expect(stmt).toHaveProperty('newColumnName');
    });

    test('should return minified JSON', () => {
      const sql = 'ALTER TABLE users ADD COLUMN email VARCHAR(255);';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });
  });
});
