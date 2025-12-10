import { formatSql } from '../../src/formats/sql';

/**
 * PHASE 1 EDGE CASE TESTS
 *
 * Purpose: Establish edge case behavior and prevent rework during Phase 2.
 * These tests document critical decisions that must be consistent across
 * all statement types.
 *
 * Edge Cases Verified:
 * 1. INSERT without explicit columns → mark as '*' (all columns)
 * 2. NULL handling consistency across INSERT/UPDATE/DELETE
 * 3. DELETE with/without WHERE distinction
 * 4. Empty string vs NULL vs missing values
 */

describe('SQL Phase 1: Critical Edge Cases', () => {
  describe('INSERT Without Explicit Columns (Decision: columns: "*")', () => {
    test('should accept INSERT without column list and mark columns as "*"', () => {
      const sql = "INSERT INTO users VALUES (1, 'John', 'john@example.com');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions).toHaveLength(1);
      expect(result[0].table).toBe('users');
      expect(result[0].actions[0].action).toBe('INSERT');
      // DECISION: Mark as '*' to indicate full row (column mapping unknown)
      expect(result[0].actions[0].columns).toBe('*');
      expect(result[0].actions[0].rows).toHaveLength(1);
      expect(result[0].actions[0].rows[0]).toEqual([1, 'John', 'john@example.com']);
    });

    test('should handle multiple rows without column list', () => {
      const sql = "INSERT INTO products VALUES (1, 'Widget', 9.99), (2, 'Gadget', 19.99);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toBe('*');
      expect(result[0].actions[0].rows).toHaveLength(2);
      expect(result[0].actions[0].rows[0]).toEqual([1, 'Widget', 9.99]);
      expect(result[0].actions[0].rows[1]).toEqual([2, 'Gadget', 19.99]);
    });

    test('should handle mixed INSERT: some with columns, some without', () => {
      const sql = `
        INSERT INTO users (id, name) VALUES (1, 'John');
        INSERT INTO users VALUES (2, 'Jane', 'jane@example.com');
      `;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].actions).toHaveLength(2);
      // First: has explicit columns
      expect(result[0].actions[0].columns).toEqual(['id', 'name']);
      expect(result[0].actions[0].rows[0]).toEqual({ id: 1, name: 'John' });
      // Second: no columns
      expect(result[0].actions[1].columns).toBe('*');
      expect(result[0].actions[1].rows[0]).toEqual([2, 'Jane', 'jane@example.com']);
    });

    test('should handle INSERT without columns with NULL values', () => {
      const sql = "INSERT INTO users VALUES (1, NULL, 'john@example.com');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toBe('*');
      expect(result[0].actions[0].rows[0]).toEqual([1, null, 'john@example.com']);
    });

    test('should handle INSERT without columns with different data types', () => {
      const sql = "INSERT INTO data VALUES (42, 3.14, true, 'text', NULL);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].columns).toBe('*');
      expect(result[0].actions[0].rows[0]).toEqual([42, 3.14, true, 'text', null]);
    });
  });

  describe('NULL Handling Consistency', () => {
    describe('INSERT NULL Handling (omitted from row object)', () => {
      test('should omit NULL columns from row object when columns are explicit', () => {
        const sql = "INSERT INTO users (id, name, email) VALUES (1, 'John', NULL);";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].rows[0]).toEqual({ id: 1, name: 'John' });
        expect(result[0].actions[0].rows[0]).not.toHaveProperty('email');
      });

      test('should preserve NULL in array when columns are "*"', () => {
        const sql = "INSERT INTO users VALUES (1, 'John', NULL);";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].rows[0]).toEqual([1, 'John', null]);
      });
    });

    describe('UPDATE NULL Handling (as value)', () => {
      test('should preserve NULL as value in UPDATE SET', () => {
        const sql = "UPDATE users SET phone = NULL WHERE id = 1;";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].action).toBe('UPDATE');
        expect(result[0].actions[0].updates).toHaveLength(1);
        expect(result[0].actions[0].updates[0]).toEqual({ column: 'phone', value: 'NULL' });
      });

      test('should handle multiple columns with NULL in UPDATE', () => {
        const sql = "UPDATE users SET phone = NULL, bio = NULL WHERE id = 1;";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].updates).toHaveLength(2);
        expect(result[0].actions[0].updates[0].value).toBe('NULL');
        expect(result[0].actions[0].updates[1].value).toBe('NULL');
      });

      test('should handle mixed NULL and non-NULL in UPDATE', () => {
        const sql = "UPDATE users SET name = 'John', phone = NULL, email = 'john@example.com' WHERE id = 1;";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].updates).toHaveLength(3);
        expect(result[0].actions[0].updates[0].value).toBe("'John'");
        expect(result[0].actions[0].updates[1].value).toBe('NULL');
        expect(result[0].actions[0].updates[2].value).toBe("'john@example.com'");
      });
    });

    describe('DELETE NULL Handling (in WHERE clause)', () => {
      test('should preserve NULL check in DELETE WHERE', () => {
        const sql = "DELETE FROM users WHERE phone IS NULL;";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].where).toContain('NULL');
      });

      test('should handle IS NOT NULL in DELETE WHERE', () => {
        const sql = "DELETE FROM users WHERE phone IS NOT NULL;";
        const output = formatSql(sql, { minify: true });
        const result = JSON.parse(output);

        expect(result[0].actions[0].where).toContain('NOT NULL');
      });
    });
  });

  describe('DELETE Without WHERE: Critical Distinction', () => {
    test('should distinguish DELETE without WHERE (all rows) from DELETE with WHERE', () => {
      const deleteAllSql = 'DELETE FROM temp_data;';
      const deleteWithWhereSql = 'DELETE FROM temp_data WHERE id > 1000;';

      const resultAll = JSON.parse(formatSql(deleteAllSql, { minify: true }));
      const resultWhere = JSON.parse(formatSql(deleteWithWhereSql, { minify: true }));

      // DELETE without WHERE: where field is UNDEFINED
      expect(resultAll[0].actions[0].where).toBeUndefined();
      expect(resultAll[0].actions[0]).not.toHaveProperty('where');

      // DELETE with WHERE: where field is present
      expect(resultWhere[0].actions[0].where).toBeDefined();
      expect(resultWhere[0].actions[0].where).toBe('id > 1000');
    });

    test('should NOT confuse DELETE with no WHERE vs DELETE WHERE 1=1', () => {
      const deleteAllSql = 'DELETE FROM temp_data;';
      const deleteWhereOneSql = 'DELETE FROM temp_data WHERE 1=1;';

      const resultAll = JSON.parse(formatSql(deleteAllSql, { minify: true }));
      const resultWhere = JSON.parse(formatSql(deleteWhereOneSql, { minify: true }));

      // Must be distinguishable!
      expect(resultAll[0].actions[0].where).toBeUndefined();
      expect(resultWhere[0].actions[0].where).toBe('1=1');
    });

    test('should warn about DELETE without WHERE in multiple row context', () => {
      const sql = `
        CREATE TABLE temp_data (id INT);
        INSERT INTO temp_data (id) VALUES (1), (2), (3);
        DELETE FROM temp_data;
      `;
      const result = JSON.parse(formatSql(sql, { minify: true }));
      const deleteStmt = result[0].actions.find((stmt: any) => stmt.action === 'DELETE');

      expect(result[0].table).toEqual('temp_data');

      // CRITICAL: This deletes ALL 3 rows, must be obvious
      expect(deleteStmt.where).toBeUndefined();
      // No `affectsAllRows` flag needed if `where: undefined` is clear
      expect(result[0].table).toEqual('temp_data');
      expect(deleteStmt).toEqual({
        action: 'DELETE',
        statementIndex: expect.any(Number)
      });
    });
  });

  describe('Empty String vs NULL vs Missing Values', () => {
    test('should distinguish empty string from NULL in INSERT', () => {
      const sql = "INSERT INTO data (value) VALUES (''), (NULL), ('text');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].rows[0]).toEqual({ value: '' });  // Empty string preserved
      expect(result[0].actions[0].rows[1]).not.toHaveProperty('value');  // NULL omitted
      expect(result[0].actions[0].rows[2]).toEqual({ value: 'text' });  // Normal string
    });

    test('should preserve empty string in UPDATE', () => {
      const sql = "UPDATE users SET bio = '' WHERE id = 1;";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].updates[0]).toEqual({ column: 'bio', value: "''" });
    });
  });

  describe('Special Characters and Escaping with NULL', () => {
    test('should handle escaped quotes with NULL values', () => {
      const sql = "INSERT INTO quotes (text, other) VALUES ('It''s here', NULL), (NULL, 'Also here');";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].rows[0].text).toContain("'");
      expect(result[0].actions[0].rows[0]).not.toHaveProperty('other');
      expect(result[0].actions[0].rows[1]).not.toHaveProperty('text');
      expect(result[0].actions[0].rows[1].other).toBe('Also here');
    });
  });

  describe('UPDATE Without WHERE: Current Behavior', () => {
    test('should handle UPDATE without WHERE (rare but valid)', () => {
      const sql = 'UPDATE users SET backup_flag = true;';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].action).toBe('UPDATE');
      expect(result[0].actions[0].where).toBeUndefined();
      expect(result[0].actions[0].updates).toHaveLength(1);
      // DECISION: Same pattern as DELETE without WHERE
    });

    test('should NOT confuse UPDATE without WHERE vs UPDATE WHERE 1=1', () => {
      const updateAllSql = 'UPDATE users SET flag = true;';
      const updateWhereSql = 'UPDATE users SET flag = true WHERE 1=1;';

      const resultAll = JSON.parse(formatSql(updateAllSql, { minify: true }));
      const resultWhere = JSON.parse(formatSql(updateWhereSql, { minify: true }));

      expect(resultAll[0].actions[0].where).toBeUndefined();
      expect(resultWhere[0].actions[0].where).toBe('1=1');
    });
  });

  describe('Data Type Preservation with Edge Cases', () => {
    test('should preserve numeric types with NULL', () => {
      const sql = "INSERT INTO numbers (int_val, float_val) VALUES (NULL, 3.14), (42, NULL);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].rows[0]).not.toHaveProperty('int_val');
      expect(result[0].actions[0].rows[0].float_val).toBe(3.14);
      expect(result[0].actions[0].rows[1].int_val).toBe(42);
      expect(result[0].actions[0].rows[1]).not.toHaveProperty('float_val');
    });

    test('should preserve boolean types with NULL', () => {
      const sql = "INSERT INTO bools (flag) VALUES (true), (false), (NULL);";
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result[0].actions[0].rows[0].flag).toBe(true);
      expect(result[0].actions[0].rows[1].flag).toBe(false);
      expect(result[0].actions[0].rows[2]).not.toHaveProperty('flag');
    });
  });

  describe('Consistency Across Multiple Statements', () => {
    test('should maintain consistent NULL handling across INSERT and UPDATE', () => {
      const sql = `
        INSERT INTO users (id, name, email) VALUES (1, 'John', NULL);
        UPDATE users SET phone = NULL WHERE id = 1;
      `;
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      // INSERT: NULL omitted from object
      expect(result[0].actions[0].rows[0]).toEqual({ id: 1, name: 'John' });
      expect(result[0].actions[0].rows[0]).not.toHaveProperty('email');

      // UPDATE: NULL as value
      expect(result[0].actions[1].updates[0]).toEqual({ column: 'phone', value: 'NULL' });
    });

    test('should maintain consistent WHERE clause handling across UPDATE and DELETE', () => {
      const sqlWithWhere = `
        UPDATE users SET verified = true WHERE id = 1;
        DELETE FROM users WHERE id = 2;
      `;
      const sqlWithoutWhere = `
        UPDATE users SET verified = true;
        DELETE FROM users;
      `;

      const resultWith = JSON.parse(formatSql(sqlWithWhere, { minify: true }));
      const resultWithout = JSON.parse(formatSql(sqlWithoutWhere, { minify: true }));

      // WITH WHERE
      expect(resultWith[0].actions[0].where).toBe('id = 1');
      expect(resultWith[0].actions[1].where).toBe('id = 2');

      // WITHOUT WHERE
      expect(resultWithout[0].actions[0].where).toBeUndefined();
      expect(resultWithout[0].actions[1].where).toBeUndefined();
    });
  });
});
