import { formatSql } from '../../src/formats/sql';

/**
 * GRANT/REVOKE Statement Tests
 *
 * GRANT and REVOKE manage database object permissions
 * Syntax: GRANT privileges ON object TO user [WITH GRANT OPTION];
 *         REVOKE privileges ON object FROM user [CASCADE|RESTRICT];
 *
 * Key characteristics:
 * - Can grant/revoke single or multiple privileges
 * - Support different object types (TABLE, DATABASE, SCHEMA, etc)
 * - Optional GRANT OPTION and CASCADE/RESTRICT modifiers
 * - No table required (these are system operations)
 */

describe('SQL GRANT/REVOKE Statement Parsing', () => {
  describe('Basic GRANT', () => {
    test('should parse simple GRANT SELECT', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('GRANT');
      expect(result[0].privileges).toEqual(['SELECT']);
      expect(result[0].objectType).toBe('TABLE');
      expect(result[0].objectName).toBe('users');
      expect(result[0].grantee).toBe('john');
    });

    test('should parse GRANT with multiple privileges', () => {
      const sql = 'GRANT SELECT, INSERT, UPDATE ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toEqual(['SELECT', 'INSERT', 'UPDATE']);
      expect(result[0].privileges).toHaveLength(3);
    });

    test('should parse GRANT ALL', () => {
      const sql = 'GRANT ALL ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('ALL');
    });

    test('should parse GRANT with WITH GRANT OPTION', () => {
      const sql = 'GRANT SELECT ON users TO john WITH GRANT OPTION;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].grantOption).toBe(true);
    });

    test('should handle case insensitivity', () => {
      const sql = 'grant select on users to john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('GRANT');
      expect(result[0].privileges).toEqual(['SELECT']);
    });
  });

  describe('Basic REVOKE', () => {
    test('should parse simple REVOKE SELECT', () => {
      const sql = 'REVOKE SELECT ON users FROM john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('REVOKE');
      expect(result[0].privileges).toEqual(['SELECT']);
      expect(result[0].objectType).toBe('TABLE');
      expect(result[0].objectName).toBe('users');
      expect(result[0].grantee).toBe('john');
    });

    test('should parse REVOKE with multiple privileges', () => {
      const sql = 'REVOKE SELECT, INSERT, UPDATE ON users FROM john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toEqual(['SELECT', 'INSERT', 'UPDATE']);
    });

    test('should parse REVOKE ALL', () => {
      const sql = 'REVOKE ALL ON users FROM john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('ALL');
    });

    test('should parse REVOKE with CASCADE', () => {
      const sql = 'REVOKE SELECT ON users FROM john CASCADE;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].cascade).toBe(true);
    });

    test('should parse REVOKE with RESTRICT', () => {
      const sql = 'REVOKE SELECT ON users FROM john RESTRICT;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].restrict).toBe(true);
    });

    test('should handle case insensitivity', () => {
      const sql = 'revoke select on users from john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('REVOKE');
      expect(result[0].privileges).toEqual(['SELECT']);
    });
  });

  describe('Object Types', () => {
    test('should handle TABLE object type', () => {
      const sql = 'GRANT SELECT ON TABLE users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('TABLE');
      expect(result[0].objectName).toBe('users');
    });

    test('should handle DATABASE object type', () => {
      const sql = 'GRANT CREATE ON DATABASE mydb TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('DATABASE');
      expect(result[0].objectName).toBe('mydb');
    });

    test('should handle SCHEMA object type', () => {
      const sql = 'GRANT USAGE ON SCHEMA public TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('SCHEMA');
      expect(result[0].objectName).toBe('public');
    });

    test('should handle PROCEDURE object type', () => {
      const sql = 'GRANT EXECUTE ON PROCEDURE my_func() TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('PROCEDURE');
    });

    test('should infer TABLE when no type specified', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].objectType).toBe('TABLE');
    });
  });

  describe('Privilege Types', () => {
    test('should handle SELECT privilege', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('SELECT');
    });

    test('should handle INSERT privilege', () => {
      const sql = 'GRANT INSERT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('INSERT');
    });

    test('should handle UPDATE privilege', () => {
      const sql = 'GRANT UPDATE ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('UPDATE');
    });

    test('should handle DELETE privilege', () => {
      const sql = 'GRANT DELETE ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('DELETE');
    });

    test('should handle CREATE privilege', () => {
      const sql = 'GRANT CREATE ON DATABASE mydb TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('CREATE');
    });

    test('should handle EXECUTE privilege', () => {
      const sql = 'GRANT EXECUTE ON PROCEDURE my_func TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('EXECUTE');
    });

    test('should handle USAGE privilege', () => {
      const sql = 'GRANT USAGE ON SCHEMA public TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toContain('USAGE');
    });
  });

  describe('Grantee Variations', () => {
    test('should handle user grantee', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].grantee).toBe('john');
    });

    test('should handle role grantee', () => {
      const sql = 'GRANT SELECT ON users TO admin_role;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].grantee).toBe('admin_role');
    });

    test('should handle PUBLIC grantee', () => {
      const sql = 'GRANT SELECT ON users TO PUBLIC;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].grantee).toBe('PUBLIC');
    });

    test('should handle quoted grantee names', () => {
      const sql = 'GRANT SELECT ON users TO "john@example.com";';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].grantee).toBeDefined();
    });
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace', () => {
      const sql = '  GRANT   SELECT   ON   users   TO   john  ;  ';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('GRANT');
      expect(result[0].privileges).toEqual(['SELECT']);
    });

    test('should handle newlines in GRANT', () => {
      const sql = `GRANT
      SELECT
      ON users
      TO john;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('GRANT');
    });

    test('should handle multiple privileges with newlines', () => {
      const sql = `GRANT
      SELECT,
      INSERT,
      UPDATE
      ON users
      TO john;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].privileges).toHaveLength(3);
    });

    test('should handle newlines in REVOKE', () => {
      const sql = `REVOKE
      SELECT
      ON users
      FROM john;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('REVOKE');
    });
  });

  describe('Comments with GRANT/REVOKE', () => {
    test('should handle line comment', () => {
      const sql = `-- Grant read access
      GRANT SELECT ON users TO john;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('GRANT');
    });

    test('should handle block comment', () => {
      const sql = `/* Grant permission for read access */
      GRANT SELECT ON users TO john;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].action).toBe('GRANT');
    });
  });

  describe('Mixed Statements', () => {
    test('should handle GRANT followed by REVOKE', () => {
      const sql = `GRANT SELECT ON users TO john;
      REVOKE SELECT ON users FROM john;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const actions = result.map((r: any) => r.action);
      expect(actions).toContain('GRANT');
      expect(actions).toContain('REVOKE');
    });

    test('should handle multiple GRANTs', () => {
      const sql = `GRANT SELECT ON users TO john;
      GRANT INSERT ON users TO jane;
      GRANT DELETE ON users TO admin;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.filter((r: any) => r.action === 'GRANT').length).toBe(3);
    });

    test('should handle GRANT and DML together', () => {
      const sql = `GRANT SELECT ON users TO john;
      INSERT INTO logs (action) VALUES ('Permission granted');`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const grantCount = result.filter((r: any) => r.action === 'GRANT').length;
      const insertCount = result.filter((r: any) => r.action === 'INSERT').length;
      expect(grantCount).toBeGreaterThanOrEqual(1);
      expect(insertCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Real-World Scenarios', () => {
    test('should handle permission setup workflow', () => {
      const sql = `GRANT SELECT ON users TO analyst WITH GRANT OPTION;
      GRANT SELECT, INSERT, UPDATE ON users TO data_admin;
      GRANT ALL ON users TO owner;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const grantCount = result.filter((r: any) => r.action === 'GRANT').length;
      expect(grantCount).toBeGreaterThanOrEqual(3);
    });

    test('should handle permission revocation workflow', () => {
      const sql = `REVOKE SELECT ON users FROM john CASCADE;
      REVOKE INSERT, UPDATE, DELETE ON users FROM jane RESTRICT;
      REVOKE ALL ON users FROM temp_user;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const revokeCount = result.filter((r: any) => r.action === 'REVOKE').length;
      expect(revokeCount).toBeGreaterThanOrEqual(3);
    });

    test('should handle database-level permissions', () => {
      const sql = `GRANT CREATE ON DATABASE production TO developers;
      GRANT CONNECT ON DATABASE production TO readers;
      REVOKE CREATE ON DATABASE production FROM temp_devs;`;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure for GRANT', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('privileges');
      expect(stmt).toHaveProperty('objectType');
      expect(stmt).toHaveProperty('objectName');
      expect(stmt).toHaveProperty('grantee');
      expect(stmt).toHaveProperty('statementIndex');
    });

    test('should have correct output structure for REVOKE', () => {
      const sql = 'REVOKE SELECT ON users FROM john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      const stmt = result[0];
      expect(stmt).toHaveProperty('action');
      expect(stmt).toHaveProperty('privileges');
      expect(stmt).toHaveProperty('objectName');
      expect(stmt).toHaveProperty('grantee');
      expect(stmt).toHaveProperty('statementIndex');
    });

    test('should not include table property for GRANT/REVOKE', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0]).not.toHaveProperty('table');
    });

    test('should return minified JSON', () => {
      const sql = 'GRANT SELECT ON users TO john;';
      const output = formatSql(sql, { minify: true });

      expect(output).not.toContain('\n');
      expect(output).not.toContain('  ');
    });
  });
});
