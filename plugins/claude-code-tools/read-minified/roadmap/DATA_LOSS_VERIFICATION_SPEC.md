# Data Loss Verification Specification

## Objective
Ensure that JSON parsing preserves 100% of information from original SQL. No information loss = ability to reconstruct original SQL from JSON output.

---

## INSERT Statement Verification

### Critical Information to Preserve
1. **Table name**
2. **Column list** (order matters)
3. **Row values** (data integrity)
4. **Data types** (implicit in SQL, explicit in JSON)
5. **Special values** (NULL, boolean, numbers, strings with escapes)

### Verification Test Template

```typescript
describe('INSERT Data Loss Verification', () => {
  test('should preserve all information from INSERT statement', () => {
    // ORIGINAL SQL
    const originalSql = `INSERT INTO users (id, name, email) VALUES
      (1, 'John', 'john@example.com'),
      (2, 'Jane O''Brien', 'jane@example.com');`;

    // PARSE TO JSON
    const parsed = JSON.parse(formatSql(originalSql, { minify: true }));

    // VERIFY TABLE NAME
    expect(parsed[0].table).toBe('users');

    // VERIFY COLUMN ORDER (CRITICAL!)
    expect(parsed[0].columns).toEqual(['id', 'name', 'email']);

    // VERIFY ROW COUNT
    expect(parsed[0].rows).toHaveLength(2);

    // VERIFY DATA INTEGRITY
    expect(parsed[0].rows[0]).toEqual({
      id: 1,
      name: 'John',
      email: 'john@example.com'
    });

    // VERIFY SPECIAL VALUES (escaped quotes)
    expect(parsed[0].rows[1].name).toBe('Jane O\'Brien');

    // RECONSTRUCT ORIGINAL (can you build SQL from JSON?)
    const reconstructed = reconstructInsertFromJson(parsed[0]);
    const normalized1 = normalizeWhitespace(originalSql);
    const normalized2 = normalizeWhitespace(reconstructed);
    expect(normalized2).toBe(normalized1);
  });
});
```

### Test Cases (Comprehensive)

#### 1. Basic INSERT
```sql
INSERT INTO users (id, name) VALUES (1, 'John');
```
**Verify**: Column order, row data, table name

#### 2. Multi-row INSERT
```sql
INSERT INTO users (id, name) VALUES (1, 'John'), (2, 'Jane');
```
**Verify**: Row count = 2, both rows correct

#### 3. INSERT with NULL
```sql
INSERT INTO users (id, name, phone) VALUES (1, 'John', NULL);
```
**Verify**: NULL omitted from row object (or explicit?)
**Question**: Should JSON have `"phone": null` or omit the key?
**Decision Needed**: Define NULL handling standard

#### 4. INSERT with STRING ESCAPES
```sql
INSERT INTO users (id, bio) VALUES (1, 'It''s a nice day');
```
**Verify**: Escaped quote `''` → single quote `'` in JSON

#### 5. INSERT with MIXED QUOTES
```sql
INSERT INTO users (id, comment) VALUES (1, 'He said "hello"');
```
**Verify**: Both quote types preserved

#### 6. INSERT with NUMBERS
```sql
INSERT INTO products (id, price, stock) VALUES (1, 19.99, 100);
```
**Verify**:
- Integer stays integer (100, not "100")
- Float stays float (19.99, not "19.99")

#### 7. INSERT with BOOLEAN
```sql
INSERT INTO users (id, active) VALUES (1, true), (2, false);
```
**Verify**: Boolean preserved as `true`/`false` not strings

#### 8. INSERT with SPECIAL CHARS
```sql
INSERT INTO users (id, bio) VALUES (1, 'Special: @#$%^&*()');
```
**Verify**: Special characters preserved

#### 9. INSERT without COLUMNS
```sql
INSERT INTO users VALUES (1, 'John', 'john@example.com');
```
**Verify**:
- Column list extracted from table schema or marked as "all"
- **Note**: This is ambiguous! Cannot reconstruct without schema

#### 10. REAL-WORLD INSERT
```sql
INSERT INTO logs (timestamp, level, message) VALUES
  ('2025-01-15 10:30:45', 'ERROR', 'Connection failed: timeout'),
  ('2025-01-15 10:31:00', 'WARN', 'Retry attempt 1'),
  ('2025-01-15 10:31:05', 'INFO', 'Connection restored');
```
**Verify**: Multiple rows with date/time, various levels

---

## UPDATE Statement Verification

### Critical Information to Preserve
1. **Table name**
2. **All SET columns and values**
3. **WHERE clause** (exact condition)
4. **Value formatting** (strings, numbers, functions)

### Verification Test Template

```typescript
describe('UPDATE Data Loss Verification', () => {
  test('should preserve complete UPDATE information', () => {
    const originalSql = `UPDATE users SET
      email = 'newemail@example.com',
      verified = true,
      updated_at = NOW()
      WHERE id = 1 AND status = 'pending';`;

    const parsed = JSON.parse(formatSql(originalSql, { minify: true }));

    // VERIFY TABLE
    expect(parsed[0].table).toBe('users');

    // VERIFY ALL SET COLUMNS
    expect(parsed[0].updates).toHaveLength(3);
    expect(parsed[0].updates.map(u => u.column))
      .toEqual(['email', 'verified', 'updated_at']);

    // VERIFY SET VALUES (including function calls!)
    expect(parsed[0].updates[0].value).toBe("'newemail@example.com'");
    expect(parsed[0].updates[1].value).toBe('true');
    expect(parsed[0].updates[2].value).toBe('NOW()');

    // VERIFY WHERE CLAUSE (VERBATIM!)
    expect(parsed[0].where).toBe("id = 1 AND status = 'pending'");

    // RECONSTRUCT
    const reconstructed = reconstructUpdateFromJson(parsed[0]);
    const normalized1 = normalizeWhitespace(originalSql);
    const normalized2 = normalizeWhitespace(reconstructed);
    expect(normalized2).toBe(normalized1);
  });
});
```

### Test Cases

#### 1. Single Column Update
```sql
UPDATE users SET status = 'active' WHERE id = 1;
```
**Verify**: Column, value, WHERE clause

#### 2. Multiple Column Update
```sql
UPDATE users SET email = 'new@example.com', verified = true WHERE id = 1;
```
**Verify**: Both columns captured, order preserved

#### 3. UPDATE with Expression
```sql
UPDATE users SET age = age + 1 WHERE id = 1;
```
**Verify**: Expression preserved as-is: `"age + 1"`

#### 4. UPDATE with Function
```sql
UPDATE users SET updated_at = NOW() WHERE id = 1;
```
**Verify**: Function preserved: `NOW()`

#### 5. UPDATE with Complex WHERE
```sql
UPDATE users SET active = true
WHERE (status = 'pending' OR status = 'reviewing')
AND created_at > '2025-01-01';
```
**Verify**: WHERE clause preserved exactly (including parentheses)

#### 6. UPDATE without WHERE (ALL ROWS!)
```sql
UPDATE users SET backup_flag = true;
```
**Verify**:
- `where` field is `undefined`
- Clear distinction from `WHERE 1=1`
- Must be obvious this affects ALL rows

#### 7. UPDATE with IN clause
```sql
UPDATE products SET discount = 0.2 WHERE id IN (1, 2, 3, 4, 5);
```
**Verify**: WHERE clause with IN preserved

#### 8. UPDATE with LIKE
```sql
UPDATE users SET newsletter = true WHERE email LIKE '%@example.com';
```
**Verify**: LIKE pattern preserved

#### 9. UPDATE with BETWEEN
```sql
UPDATE orders SET status = 'shipped' WHERE amount BETWEEN 100 AND 1000;
```
**Verify**: BETWEEN preserved

#### 10. UPDATE with NULL
```sql
UPDATE users SET phone = NULL WHERE deleted = true;
```
**Verify**: NULL as value preserved

#### 11. UPDATE with String Escapes
```sql
UPDATE users SET name = 'O''Brien' WHERE id = 1;
```
**Verify**: Escaped quote preserved

---

## DELETE Statement Verification

### Critical Information to Preserve
1. **Table name**
2. **WHERE clause** (or absence of it!)
3. **Clarity on row impact**

### Verification Test Template

```typescript
describe('DELETE Data Loss Verification', () => {
  test('should preserve DELETE with WHERE clause', () => {
    const originalSql = `DELETE FROM logs WHERE created_at < '2025-01-01' AND level = 'DEBUG';`;

    const parsed = JSON.parse(formatSql(originalSql, { minify: true }));

    // VERIFY TABLE
    expect(parsed[0].table).toBe('logs');

    // VERIFY WHERE CLAUSE PRESERVED
    expect(parsed[0].where)
      .toBe("created_at < '2025-01-01' AND level = 'DEBUG'");

    // VERIFY NOT AMBIGUOUS
    expect(parsed[0].where).toBeDefined(); // Clear that WHERE exists
  });

  test('should distinguish DELETE ALL from DELETE with WHERE', () => {
    const deleteAllSql = 'DELETE FROM temp_data;';
    const deleteWhereSql = 'DELETE FROM temp_data WHERE id > 1000;';

    const parsedAll = JSON.parse(formatSql(deleteAllSql, { minify: true }));
    const parsedWhere = JSON.parse(formatSql(deleteWhereSql, { minify: true }));

    // CRITICAL: Must be different!
    expect(parsedAll[0].where).toBeUndefined();  // All rows
    expect(parsedWhere[0].where).toBeDefined();  // Specific rows
  });
});
```

### Test Cases

#### 1. DELETE with Simple WHERE
```sql
DELETE FROM users WHERE id = 1;
```
**Verify**: WHERE preserved

#### 2. DELETE with Complex WHERE
```sql
DELETE FROM logs WHERE level IN ('DEBUG', 'TRACE') OR created_at < '2025-01-01';
```
**Verify**: WHERE with multiple conditions preserved

#### 3. DELETE ALL ROWS (NO WHERE)
```sql
DELETE FROM temp_staging;
```
**Verify**:
- `where` field is `undefined`
- **CRITICAL**: No ambiguity - must be clear this deletes ALL rows
- Could add `"affectsAllRows": true` for clarity

#### 4. DELETE with Function in WHERE
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```
**Verify**: Function preserved in WHERE

#### 5. DELETE with LIKE
```sql
DELETE FROM users WHERE email LIKE '%@oldomain.com';
```
**Verify**: LIKE pattern preserved

#### 6. DELETE with Complex Nested Condition
```sql
DELETE FROM orders WHERE
  (status = 'cancelled' AND created_at < '2025-01-01')
  OR total = 0;
```
**Verify**: WHERE preserved exactly (parentheses, logic)

---

## CREATE TABLE Verification

### Critical Information to Preserve
1. **Table name**
2. **Column names**
3. **Column types** (with parameters: VARCHAR(255), DECIMAL(10,2))
4. **All constraints** (PRIMARY KEY, NOT NULL, UNIQUE, DEFAULT, FOREIGN KEY)
5. **Table-level constraints**

### Verification Strategy

```typescript
describe('CREATE TABLE Data Loss Verification', () => {
  test('should preserve all schema information', () => {
    const originalSql = `CREATE TABLE users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      age INT CHECK (age >= 18),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    const parsed = JSON.parse(formatSql(originalSql, { minify: true }));
    const schema = parsed[0].schema;

    // VERIFY COLUMN COUNT
    expect(schema.columns).toHaveLength(5);

    // VERIFY EACH COLUMN
    const idCol = schema.columns[0];
    expect(idCol.name).toBe('id');
    expect(idCol.type).toBe('INT');
    expect(idCol.constraints).toContain('PRIMARY KEY');
    expect(idCol.constraints).toContain('AUTO_INCREMENT');

    // VERIFY PARAMETERIZED TYPES
    const emailCol = schema.columns[1];
    expect(emailCol.type).toBe('VARCHAR(255)');
    expect(emailCol.constraints).toContain('UNIQUE');
    expect(emailCol.constraints).toContain('NOT NULL');

    // VERIFY DEFAULT VALUES
    const statusCol = schema.columns[2];
    expect(statusCol.default).toBe("'pending'");

    // VERIFY CHECK CONSTRAINT
    const ageCol = schema.columns[3];
    expect(ageCol.constraints).toContain('CHECK (age >= 18)');

    // RECONSTRUCT
    const reconstructed = reconstructCreateTableFromJson(parsed[0]);
    const normalized1 = normalizeSchema(originalSql);
    const normalized2 = normalizeSchema(reconstructed);
    expect(normalized2).toEqual(normalized1);
  });
});
```

### Test Cases

#### 1. Basic Table
```sql
CREATE TABLE users (id INT, name VARCHAR(100));
```

#### 2. With PRIMARY KEY
```sql
CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100));
```

#### 3. With Composite PRIMARY KEY
```sql
CREATE TABLE order_items (
  order_id INT,
  item_id INT,
  quantity INT,
  PRIMARY KEY (order_id, item_id)
);
```

#### 4. With FOREIGN KEY
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 5. With DEFAULT Values
```sql
CREATE TABLE users (
  id INT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. With UNIQUE Constraint
```sql
CREATE TABLE users (
  id INT,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) NOT NULL UNIQUE
);
```

#### 7. Parametered Types
```sql
CREATE TABLE products (
  id INT,
  price DECIMAL(10,2),
  name VARCHAR(255),
  description TEXT
);
```

---

## Verification Checklist

### For Each Statement Type

- [ ] **Table name preserved**
- [ ] **Column names preserved** (in order for INSERT)
- [ ] **Data integrity** (values correct, escapes handled)
- [ ] **Special values** (NULL, boolean, functions)
- [ ] **WHERE clauses preserved verbatim**
- [ ] **Constraints preserved**
- [ ] **Comments removed** (not in output)
- [ ] **Whitespace normalized** (but meaning preserved)
- [ ] **Can reconstruct SQL from JSON**
- [ ] **No ambiguity** (e.g., DELETE with vs without WHERE)

### Final Verification Test

```typescript
function verifyNoDataLoss(originalSql: string) {
  // 1. Parse to JSON
  const json = JSON.parse(formatSql(originalSql, { minify: true }));

  // 2. Reconstruct SQL from JSON
  const reconstructedSql = reconstructSqlFromJson(json);

  // 3. Normalize both (ignore whitespace, case)
  const normalized1 = normalizeForComparison(originalSql);
  const normalized2 = normalizeForComparison(reconstructedSql);

  // 4. Compare
  if (normalized1 !== normalized2) {
    console.error('DATA LOSS DETECTED!');
    console.error('Original:', normalized1);
    console.error('Reconstructed:', normalized2);
    throw new Error('Information lost in parsing');
  }

  return true;
}
```

---

## Known Limitations (To Document)

1. **INSERT without column list**
   - `INSERT INTO users VALUES (1, 'John');`
   - Cannot determine column names without schema
   - **Decision**: Require column list for full parity

2. **UPDATE/DELETE without WHERE (affects all rows)**
   - Must have `where: undefined` to distinguish
   - Could add `affectsAllRows` flag for clarity

3. **Column order in INSERT**
   - Order matters! `(id, name)` ≠ `(name, id)`
   - Must preserve order in columns array

4. **Whitespace and formatting**
   - `WHERE a=1 AND b=2` normalized to `WHERE a = 1 AND b = 2`
   - Format not preserved, semantics preserved

5. **Comments**
   - Removed before parsing (not preserved in JSON)
   - **Decision**: Not required, but could store separately

