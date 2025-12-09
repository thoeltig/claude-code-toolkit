# Complete SQL Parser Roadmap - Phase 6-7

## Current Status (End of Phase 6)
- ✅ CREATE TABLE parsing
- ✅ INSERT parsing with data
- ✅ SELECT parsing with columns and WHERE
- ✅ UPDATE parsing with SET columns and WHERE
- ✅ DELETE parsing with WHERE
- ❌ Missing statement types (ALTER, DROP, TRUNCATE, CREATE INDEX, etc.)
- ❌ No structural optimization (table-based grouping not implemented)

**Test Status**: 145/147 passing (98.6%) - Missing statements cause 2 failures in old test file

---

## Phase 7: Complete SQL Coverage + Structural Optimization

### Section 1: Missing Statement Types (Priority Order)

#### 1.1 ALTER TABLE (High Priority)
**Why Important**: Schema modifications are critical for migration tracking

**Parsing Requirements**:
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NOT NULL;
ALTER TABLE users RENAME TO customers;
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ADD UNIQUE KEY (email);
ALTER TABLE users ADD INDEX idx_status (status);
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);
ALTER TABLE users DROP PRIMARY KEY;
ALTER TABLE users DROP FOREIGN KEY fk_role;
ALTER TABLE users CHANGE COLUMN age years INT;
```

**Extraction Requirements**:
- Table name
- ALTER type (ADD, DROP, MODIFY, RENAME, CHANGE)
- Column name(s) affected (if applicable)
- Column definition (new type, constraints)
- Index/Key name
- Referenced table (for FOREIGN KEY)

**Output Format**:
```json
{
  "table": "users",
  "action": "ALTER",
  "alterType": "ADD COLUMN",
  "columnName": "phone",
  "definition": "VARCHAR(20)",
  "statementIndex": 0
}
```

**Edge Cases**:
- Multiple ALTERs in one statement: `ALTER TABLE t1 ADD col1 INT, ADD col2 VARCHAR(50);`
- Column renaming with CHANGE vs RENAME
- Constraint definitions: `CONSTRAINT fk_name FOREIGN KEY`
- Multiline ALTER definitions

**Test Count**: 15-20 tests

---

#### 1.2 DROP TABLE/INDEX/VIEW (High Priority)
**Why Important**: Destructive operations must be visible

**Parsing Requirements**:
```sql
DROP TABLE users;
DROP TABLE IF EXISTS users;
DROP TABLE users, products;
DROP INDEX idx_email ON users;
DROP VIEW v_active_users;
DROP DATABASE mydb;
DROP SCHEMA myschema;
```

**Output Format**:
```json
{
  "action": "DROP",
  "dropType": "TABLE",
  "objectName": "users",
  "ifExists": true,
  "statementIndex": 0
}
```

**Critical Detail**: Multiple object drops in one statement
```json
[
  {"action": "DROP", "dropType": "TABLE", "objectName": "users"},
  {"action": "DROP", "dropType": "TABLE", "objectName": "products"}
]
```

**Test Count**: 12-15 tests

---

#### 1.3 TRUNCATE TABLE (Medium Priority)
**Why Important**: Bulk delete operation (different from DELETE)

**Parsing Requirements**:
```sql
TRUNCATE TABLE users;
TRUNCATE users;
```

**Output Format**:
```json
{
  "table": "users",
  "action": "TRUNCATE",
  "statementIndex": 0
}
```

**Key Difference from DELETE**:
- No WHERE clause
- Resets auto_increment
- Faster (deallocates pages)
- Cannot be rolled back in some DBs

**Test Count**: 5-8 tests

---

#### 1.4 CREATE INDEX/VIEW/TRIGGER (Medium Priority)
**Why Important**: Schema extensions and computed views

**Parsing Requirements**:

**CREATE INDEX**:
```sql
CREATE INDEX idx_email ON users (email);
CREATE UNIQUE INDEX idx_username ON users (username);
CREATE INDEX idx_composite ON users (status, created_at);
CREATE FULLTEXT INDEX idx_content ON articles (content);
```

**Output Format**:
```json
{
  "action": "CREATE INDEX",
  "indexName": "idx_email",
  "table": "users",
  "columns": ["email"],
  "unique": false,
  "statementIndex": 0
}
```

**CREATE VIEW**:
```sql
CREATE VIEW v_active_users AS SELECT * FROM users WHERE active = true;
CREATE OR REPLACE VIEW v_summary AS SELECT ...;
```

**Output Format**:
```json
{
  "action": "CREATE VIEW",
  "viewName": "v_active_users",
  "sourceTable": "users",
  "definition": "SELECT * FROM users WHERE active = true",
  "statementIndex": 0
}
```

**CREATE TRIGGER**:
```sql
CREATE TRIGGER tr_update_timestamp BEFORE UPDATE ON users
FOR EACH ROW SET NEW.updated_at = NOW();
```

**Output Format**:
```json
{
  "action": "CREATE TRIGGER",
  "triggerName": "tr_update_timestamp",
  "table": "users",
  "event": "UPDATE",
  "timing": "BEFORE",
  "statementIndex": 0
}
```

**Test Count**: 20-25 tests (combined)

---

#### 1.5 GRANT/REVOKE (Low Priority - Access Control)
**Why Important**: Audit trail for permission changes

**Parsing Requirements**:
```sql
GRANT SELECT, INSERT ON users TO user1@localhost;
GRANT ALL PRIVILEGES ON db.* TO user2;
REVOKE DELETE ON users FROM user1@localhost;
```

**Output Format**:
```json
{
  "action": "GRANT",
  "privileges": ["SELECT", "INSERT"],
  "object": "users",
  "user": "user1@localhost",
  "statementIndex": 0
}
```

**Test Count**: 8-10 tests

---

#### 1.6 BEGIN/COMMIT/ROLLBACK (Low Priority - Transactions)
**Why Important**: Transaction boundaries for grouping operations

**Parsing Requirements**:
```sql
BEGIN;
INSERT INTO users ...;
UPDATE products ...;
COMMIT;

BEGIN;
DELETE FROM logs ...;
ROLLBACK;
```

**Output Format**:
```json
{
  "action": "BEGIN",
  "statementIndex": 0
}
```

**Grouping Strategy**: Mark transaction start/end for nesting

**Test Count**: 10-12 tests

---

### Section 2: Data Loss Verification for CRUD Operations

**Goal**: Ensure JSON representation can reconstruct original SQL without loss

#### 2.1 INSERT Verification Strategy

**Test Pattern**:
```typescript
function verifyInsertParity(originalSql: string, parsed: ParsedInsert) {
  // 1. Check all columns captured
  expect(parsed.columns).toEqual(extractColumnsFromSql(originalSql));

  // 2. Check all rows captured with correct data types
  expect(parsed.rows.length).toBe(countRowsInSql(originalSql));

  // 3. Check data integrity (special chars, escapes, nulls)
  expect(JSON.stringify(parsed.rows))
    .toBe(JSON.stringify(reconstructRowsFromSql(originalSql)));

  // 4. Verify table name
  expect(parsed.table).toBe(extractTableFromSql(originalSql));
}
```

**Test Coverage**:
- ✅ Basic columns and values
- ✅ NULL values handling
- ✅ String escaping (single quotes, double quotes)
- ✅ SQL-escaped quotes ('')
- ✅ Data types (int, float, boolean, string, date)
- ✅ Multi-row inserts
- ✅ Mixed data types in same statement
- ✅ Special characters in strings
- ✅ Comments in SQL
- ✅ Multiline formatting
- ❓ Subquery inserts: `INSERT INTO users SELECT * FROM backup_users;`

**Current Status**: 31 tests, need to verify no loss in all 31

**Additional Tests Needed**:
- Subquery INSERT (complex)
- DEFAULT values
- Column count mismatch with values

---

#### 2.2 UPDATE Verification Strategy

**Test Pattern**:
```typescript
function verifyUpdateParity(originalSql: string, parsed: ParsedUpdate) {
  // 1. Check all SET columns captured
  expect(parsed.updates.map(u => u.column)).toEqual(
    extractSetColumnsFromSql(originalSql)
  );

  // 2. Check all values captured
  expect(parsed.updates.map(u => u.value)).toEqual(
    extractSetValuesFromSql(originalSql)
  );

  // 3. Check WHERE clause preserved verbatim
  expect(parsed.where).toBe(extractWhereFromSql(originalSql));

  // 4. Verify table name
  expect(parsed.table).toBe(extractTableFromSql(originalSql));
}
```

**Test Coverage**:
- ✅ Single column update
- ✅ Multiple column updates
- ✅ Complex WHERE with AND/OR
- ✅ WHERE with IN clause
- ✅ WHERE with functions
- ✅ String values with escapes
- ✅ Numeric values
- ✅ NULL values
- ✅ Case insensitivity
- ❓ UPDATE with JOIN
- ❓ UPDATE with subquery in WHERE
- ❓ UPDATE with LIMIT clause

**Current Status**: 15 tests, need to verify parity

**Additional Tests Needed**:
- UPDATE ... FROM (PostgreSQL)
- UPDATE with LIMIT
- UPDATE with JOIN
- Value expressions: `SET col = col + 1`

---

#### 2.3 DELETE Verification Strategy

**Test Pattern**:
```typescript
function verifyDeleteParity(originalSql: string, parsed: ParsedDelete) {
  // 1. Check table name
  expect(parsed.table).toBe(extractTableFromSql(originalSql));

  // 2. Check WHERE clause preserved (if present)
  if (hasWhereClause(originalSql)) {
    expect(parsed.where).toBe(extractWhereFromSql(originalSql));
  } else {
    expect(parsed.where).toBeUndefined();
  }
}
```

**Critical Cases**:
- ✅ DELETE with WHERE (specific rows)
- ✅ DELETE without WHERE (all rows - must be clear!)
- ✅ Complex WHERE conditions
- ✅ WHERE with functions
- ❓ DELETE with JOIN (MySQL)
- ❓ DELETE with subquery
- ❓ DELETE with LIMIT

**Current Status**: 15 tests, need to verify parity

**Risk Assessment**:
- **HIGH**: DELETE without WHERE looks same as with WHERE in parsing
- Need clear distinction: `undefined` for no WHERE vs explicit WHERE clause

---

### Section 3: Structural Optimization - Table-Based Grouping

**Current Structure** (flat array):
```json
[
  {"table": "users", "action": "CREATE", "schema": {...}},
  {"table": "users", "action": "INSERT", "rows": [...]},
  {"table": "users", "action": "UPDATE", "where": "..."},
  {"table": "products", "action": "CREATE", "schema": {...}},
  {"table": "products", "action": "INSERT", "rows": [...]}
]
```

**Proposed Structure** (table-grouped):
```json
[
  {
    "table": "users",
    "actions": [
      {"action": "CREATE", "schema": {...}},
      {"action": "INSERT", "rows": [...]},
      {"action": "UPDATE", "where": "..."}
    ]
  },
  {
    "table": "products",
    "actions": [
      {"action": "CREATE", "schema": {...}},
      {"action": "INSERT", "rows": [...]}
    ]
  }
]
```

**Benefits**:
1. **Eliminates table name duplication** - saves ~5-10% tokens for multi-operation tables
2. **Clearer workflow per table** - easier to understand sequence of operations on one table
3. **Better for batch processing** - process all operations on table together
4. **Structural value** - groups related operations semantically

**Trade-offs**:
- ✅ Saves tokens (no repeated table names)
- ✅ Better semantic grouping
- ❓ Requires different parsing logic (not just array transformation)
- ❓ Different access pattern (need to search within actions array)

**Implementation Approach**:

**Option A: Post-processing transformation** (simplest)
```typescript
function groupByTable(flat: ParsedStatement[]): TableGroupedStatement[] {
  const grouped = new Map<string, ParsedStatement[]>();
  for (const stmt of flat) {
    if (!grouped.has(stmt.table)) {
      grouped.set(stmt.table, []);
    }
    grouped.get(stmt.table)!.push(stmt);
  }
  return Array.from(grouped.entries()).map(([table, actions]) => ({
    table,
    actions
  }));
}
```

**Option B: Modify grouping logic** (more efficient)
- Combine with existing `groupByTableAndAction`
- Output directly in table-grouped format

**Decision**: Option B is better - build it into the main logic

**Refactoring Impact**:
- Rewrite `groupByTableAndAction()` → `groupByTable()`
- Update output format in `formatSql()`
- Update all tests (significant change!)
- Update documentation

**Implementation Phases**:
1. Add transformation function (non-breaking)
2. Test both formats produce correct output
3. Make table-grouped format the default
4. Update all tests
5. Remove flat format support

**Test Strategy**:
- Before: 145 tests passing with flat format
- During: Run tests with both formats, verify equivalence
- After: 145 tests passing with table-grouped format
- New tests: Verify grouping logic, table deduplication

---

## Phase 7 Implementation Plan

### Phase 7a: Missing Statement Types (Weeks 1-2)

**Week 1**:
- [ ] ALTER TABLE parser (15-20 tests)
  - ADD/DROP COLUMN
  - MODIFY/CHANGE COLUMN
  - ADD/DROP KEY/INDEX
  - ADD/DROP FOREIGN KEY

- [ ] DROP TABLE/INDEX parser (12-15 tests)
  - Single and multiple drops
  - IF EXISTS handling
  - Different object types

**Week 2**:
- [ ] TRUNCATE parser (5-8 tests)
- [ ] CREATE INDEX parser (8-10 tests)
- [ ] CREATE VIEW parser (8-10 tests)
- [ ] CREATE TRIGGER parser (5-8 tests)

**Deliverables**:
- ~80-90 new tests
- 6 new statement type parsers
- Updated interface for GroupedStatement
- Comprehensive documentation

---

### Phase 7b: Data Loss Verification (Week 3)

**Approach**:
- Create verification test suite for each statement type
- Reconstruct original SQL from JSON output
- Compare with normalized original
- Document any limitations/assumptions

**For each statement type**:
1. Extract data from original SQL using regex
2. Parse to JSON
3. Reconstruct from JSON
4. Compare

**Test Matrix**:
```
              Basic  Edge Case  Real-World  Complex
INSERT         ✅      ✅          ✅         ?
UPDATE         ✅      ✅          ✅         ?
DELETE         ✅      ✅          ✅         ?
CREATE TABLE   ✅      ✅          ✅         ✅
ALTER TABLE    ✅      ✅          ?          ?
```

**Deliverables**:
- Verification test suite (50+ tests)
- Data loss report per statement type
- Documentation of known limitations

---

### Phase 7c: Structural Optimization (Week 4)

**Step 1: Add table-grouped format**
- New function: `formatSqlGrouped()`
- Keep old function for backwards compat
- Both output same semantic data

**Step 2: Test equivalence**
- For every test, run both formats
- Verify they parse to same semantic structure
- Document any differences

**Step 3: Switch to table-grouped default**
- Make `formatSql()` return table-grouped format
- Update all tests (expect updated output)
- Performance testing (verify token savings)

**Step 4: Benchmark token savings**
```
Test case: 100-statement SQL file

Flat format:    X tokens
Table-grouped:  X - 15% tokens (estimated)
Savings:        15% reduction from grouping
```

**Deliverables**:
- New grouping logic
- 145+ updated tests
- Performance report
- Token efficiency comparison

---

## Success Criteria

### Phase 7a Completion
- [ ] All missing statement types parsed
- [ ] 80+ new tests passing
- [ ] Each statement type has basic, edge case, and complex examples
- [ ] Documentation for each new parser

### Phase 7b Completion
- [ ] No data loss in INSERT/UPDATE/DELETE parsing
- [ ] Verification test suite passing
- [ ] Data loss report completed
- [ ] Known limitations documented

### Phase 7c Completion
- [ ] Table-grouped format implemented
- [ ] All 145+ tests updated and passing
- [ ] Token savings measured (target: 10-15%)
- [ ] Performance verified (no slowdown)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Missing edge cases | Data loss | Comprehensive verification suite |
| Complex ALTER syntax | Parse failures | Incremental implementation, test-first |
| Breaking test changes | Test churn | Run both formats during transition |
| Performance regression | Slow parsing | Benchmark each phase |
| Complex regexes | Maintenance burden | Use tested patterns, document clearly |

---

## Testing Strategy Summary

**Total Test Count by Phase**:
- Phase 6: 145 tests (baseline)
- Phase 7a: +80-90 tests (missing statements)
- Phase 7b: +50 tests (data loss verification)
- Phase 7c: 145+ tests (restructured, no new count)

**Final**: ~250+ tests total, 100% pass rate

---

## Example: Complete Workflow After All Phases

**Input SQL**:
```sql
-- Create base table
CREATE TABLE users (
  id INT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
);

-- Add audit columns
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Populate data
INSERT INTO users (id, email, status) VALUES
  (1, 'john@example.com', 'active'),
  (2, 'jane@example.com', 'pending');

-- Verify data
SELECT id, email FROM users WHERE status = 'active';

-- Update status
UPDATE users SET status = 'active' WHERE id = 2;

-- Cleanup
DELETE FROM users WHERE id > 100;

-- Create view
CREATE VIEW v_active_users AS SELECT * FROM users WHERE status = 'active';

-- Cleanup old records
DROP VIEW IF EXISTS v_inactive_users;
```

**Output** (table-grouped):
```json
[
  {
    "table": "users",
    "actions": [
      {
        "action": "CREATE",
        "schema": {
          "columns": [
            {"name": "id", "type": "INT", "constraints": ["PRIMARY KEY"]},
            {"name": "email", "type": "VARCHAR(255)", "constraints": ["UNIQUE", "NOT NULL"]},
            {"name": "status", "type": "VARCHAR(20)", "default": "'pending'"}
          ]
        },
        "statementIndex": 0
      },
      {
        "action": "ALTER",
        "alterType": "ADD COLUMN",
        "columnName": "created_at",
        "definition": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "statementIndex": 1
      },
      {
        "action": "ALTER",
        "alterType": "ADD COLUMN",
        "columnName": "updated_at",
        "definition": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        "statementIndex": 2
      },
      {
        "action": "INSERT",
        "columns": ["id", "email", "status"],
        "rows": [
          {"id": 1, "email": "john@example.com", "status": "active"},
          {"id": 2, "email": "jane@example.com", "status": "pending"}
        ],
        "rowCount": 2,
        "statementIndex": 3
      },
      {
        "action": "SELECT",
        "columns": ["id", "email"],
        "where": "status = 'active'",
        "statementIndex": 4
      },
      {
        "action": "UPDATE",
        "updates": [{"column": "status", "value": "'active'"}],
        "where": "id = 2",
        "statementIndex": 5
      },
      {
        "action": "DELETE",
        "where": "id > 100",
        "statementIndex": 6
      }
    ]
  },
  {
    "table": "v_active_users",
    "actions": [
      {
        "action": "CREATE VIEW",
        "sourceTable": "users",
        "definition": "SELECT * FROM users WHERE status = 'active'",
        "statementIndex": 7
      }
    ]
  },
  {
    "table": "v_inactive_users",
    "actions": [
      {
        "action": "DROP",
        "dropType": "VIEW",
        "ifExists": true,
        "statementIndex": 8
      }
    ]
  }
]
```

**Analysis**:
- No information lost ✅
- All operations visible ✅
- Table grouping shows workflow per table ✅
- Compact representation ✅
- Token efficient ✅

---

## Next Steps

1. **Immediately**: Run through data loss verification on current CRUD ops
2. **Week 1**: Implement ALTER TABLE parser
3. **Week 2**: Implement remaining statement types
4. **Week 3**: Complete data loss verification
5. **Week 4**: Implement table-grouped format
6. **Final**: Comprehensive documentation and examples

