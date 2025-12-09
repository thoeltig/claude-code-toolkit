# Phase 2-3 Roadmap: Complete SQL Statement Coverage

**Status**: Phase 2 in progress - CREATE INDEX and CREATE VIEW implementations created but need final debugging

**Token Usage**: ~130k/200k (65k remaining for Phase 3 planning)

---

## Completed in Phase 2 ✅

### Statement Types Fully Implemented (4/7)
1. **TRUNCATE** - 23 tests passing ✅
2. **DROP** (TABLE, INDEX, VIEW) - 33 tests passing ✅
3. **CREATE INDEX** - Parser implemented, test file created (5 tests failing - minor bugs)
4. **CREATE VIEW** - Parser implemented, test file created (pending testing)

**Total Tests**: 208/241 passing (86%)

---

## Phase 2 Remaining Work (1-2 hours)

### CREATE INDEX & CREATE VIEW Debug
**File**: `read-minified/src/formats/sql.ts`

**Issue**: Tests failing because `objectType` isn't propagating through grouping logic properly

**Root Cause**:
- Parsing functions create `objectType` correctly
- Grouping logic filters on `objectType` mismatch
- But final output formatting may not be accessing fields properly

**Fix Required**:
1. Verify `objectType` is set in `GroupedStatement` after parsing (lines 968-983)
2. Check output formatting block for CREATE (lines 38-59)
3. Run tests: `npm test -- sql.create-index.test.ts sql.create-view.test.ts`
4. Expected: All 22 + 26 = 48 tests passing

**Estimated Time**: 30 minutes

---

## Phase 3: Remaining Statement Types (3 weeks)

### NOT IN PHASE 2 (Deferred for Phase 3)

#### 1. ALTER TABLE (Highest Complexity)
**Est. 60-80 tests | 15-20 test cases**

**Supported Variants**:
- `ALTER TABLE name ADD COLUMN ...`
- `ALTER TABLE name MODIFY COLUMN ...` (MySQL) / `ALTER COLUMN ...` (PostgreSQL)
- `ALTER TABLE name DROP COLUMN ...`
- `ALTER TABLE name ADD CONSTRAINT ...`
- `ALTER TABLE name DROP CONSTRAINT ...`
- `ALTER TABLE name RENAME TO ...`
- `ALTER TABLE name RENAME COLUMN ... TO ...`

**Output JSON Structure**:
```json
{
  "action": "ALTER",
  "table": "users",
  "alterationType": "ADD_COLUMN|MODIFY_COLUMN|DROP_COLUMN|ADD_CONSTRAINT|DROP_CONSTRAINT|RENAME_TABLE|RENAME_COLUMN",
  "columnDefinition": {...},  // For ADD/MODIFY
  "columnName": "...",         // For MODIFY/DROP/RENAME
  "constraint": {...},         // For ADD/DROP CONSTRAINT
  "statementIndex": 0
}
```

**Key Challenges**:
- Multiple dialect variations (MySQL vs PostgreSQL vs SQL Server)
- Complex column definitions with constraints
- Constraint syntax variations
- Order preservation (important for sequences of ALTER statements)

**Implementation Plan**:
1. Create comprehensive test file: `sql.alter-table.test.ts`
2. Implement variant detection in parseAlterTableStatement()
3. Add parsing for each ALTER variant
4. Test grouping behavior (multiple ALTER on same table)

**Estimated Implementation Time**: 1 week

---

#### 2. GRANT/REVOKE (Medium Complexity)
**Est. 25-35 tests | 8-10 test cases**

**Syntax**:
- `GRANT privilege ON object TO user [WITH GRANT OPTION];`
- `REVOKE privilege ON object FROM user;`

**Supported Variants**:
- Single privilege: `GRANT SELECT ON users TO john;`
- Multiple privileges: `GRANT SELECT, INSERT, UPDATE ON users TO john;`
- All privileges: `GRANT ALL ON users TO john;`
- Object types: TABLE, DATABASE, SCHEMA, PROCEDURE
- WITH GRANT OPTION (for GRANT)
- CASCADE | RESTRICT (for REVOKE)

**Output JSON Structure**:
```json
{
  "action": "GRANT|REVOKE",
  "privileges": ["SELECT", "INSERT", ...],
  "objectType": "TABLE|DATABASE|...",
  "objectName": "users",
  "grantee": "john",
  "grantOption": true,  // GRANT only
  "cascade": true,      // REVOKE only
  "restrict": true,     // REVOKE only
  "statementIndex": 0
}
```

**Key Challenges**:
- Variable privilege lists
- Different object types and naming
- Distinguishing grantee types (user vs role vs PUBLIC)
- Dialect differences (some DBs require WITH ADMIN OPTION)

**Estimated Implementation Time**: 3-4 days

---

#### 3. Transaction Control (Low Complexity)
**Est. 15-20 tests | 5-7 test cases**

**Statements**:
- `BEGIN;` / `BEGIN TRANSACTION;` / `START TRANSACTION;`
- `COMMIT;`
- `ROLLBACK;`
- `SAVEPOINT name;`
- `RELEASE SAVEPOINT name;`
- `ROLLBACK TO SAVEPOINT name;`
- `SET TRANSACTION ISOLATION LEVEL ...;`

**Special Characteristic**: No table required (transactions are system-level)

**Output JSON Structure**:
```json
{
  "action": "BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE",
  "savepointName": "sp1",        // For SAVEPOINT/RELEASE/ROLLBACK TO
  "isolationLevel": "READ_COMMITTED",  // For SET TRANSACTION
  "transactionType": "READ_ONLY|READ_WRITE",  // For SET TRANSACTION
  "statementIndex": 0
  // NO table field for transactions
}
```

**Key Characteristics**:
- Must NOT require table field (transactions are database-wide)
- Modify grouping logic to allow null/empty table
- Consider grouping multiple statements as atomic transaction block

**Estimated Implementation Time**: 2-3 days

---

## Implementation Priority

### Recommended Order:
1. **Transaction Control** (easiest, no table requirement)
2. **GRANT/REVOKE** (medium, cleaner syntax)
3. **ALTER TABLE** (most complex, most rewarding coverage)

---

## Code Patterns to Reuse

### Statement Parser Template
```typescript
function parseXxxStatement(sql: string): any | null {
    const result: any = { objectType: 'XXX' };

    // 1. Check for optional modifiers (IF EXISTS, CASCADE, etc.)
    if (/MODIFIER/i.test(sql)) {
        result.modifier = true;
    }

    // 2. Extract main components via regex
    const match = /PATTERN/i.exec(sql);
    if (!match) return null;

    result.name = match[1];
    result.table = match[2];  // if applicable

    // 3. Parse complex sublists
    if (match[3]) {
        result.items = parseList(match[3]);
    }

    return result;
}
```

### Output Formatting Template
```typescript
} else if (group.action === 'XXX') {
    const output: any = {
        action: 'XXX',
        statementIndex: group.startIndex
    };
    // Only include optional fields if present
    if (group.field) output.field = group.field;
    return output;
}
```

### Grouping Template
```typescript
} else if (action === 'XXX' && stmt.parsed) {
    group.field1 = stmt.parsed.field1;
    if (stmt.parsed.field2) group.field2 = stmt.parsed.field2;
}
```

---

## Testing Strategy

### Test File Structure (for each statement type)
```
describe('SQL XXX Statement Parsing', () => {
  describe('Basic XXX', () => {
    test('should parse simple XXX', () => {...});
    test('should parse XXX with optional clause', () => {...});
    test('should handle case insensitivity', () => {...});
  });

  describe('Complex XXX Variants', () => {
    test('should parse XXX with variant A', () => {...});
    test('should parse XXX with variant B', () => {...});
  });

  describe('Whitespace and Formatting', () => {
    test('should handle extra whitespace', () => {...});
    test('should handle multiline XXX', () => {...});
  });

  describe('Mixed Statements', () => {
    test('should handle XXX with other statements', () => {...});
  });

  describe('Output Format Verification', () => {
    test('should have correct output structure', () => {...});
    test('should return minified JSON', () => {...});
  });
});
```

---

## Phase Completion Checklist

### Phase 2 Final (Current)
- [ ] Debug and fix CREATE INDEX tests (30 min)
- [ ] Debug and fix CREATE VIEW tests (30 min)
- [ ] Run full test suite: `npm test -- sql` (expect 290+ tests passing)
- [ ] Update PHASE_2_EDGE_CASES.md with test results
- [ ] Commit: "Complete Phase 2: TRUNCATE, DROP, CREATE INDEX/VIEW (286+ tests)"

### Phase 3 Requirements
- [ ] Transaction Control implementation (20 tests)
- [ ] GRANT/REVOKE implementation (30 tests)
- [ ] ALTER TABLE implementation (70 tests)
- [ ] Structural optimization (refactoring, 145+ tests updated)
- [ ] Data loss verification tests (50+ tests)
- **Final Target**: 450+ tests, all statement types covered

---

## Known Issues & Solutions

### Issue: CREATE INDEX/VIEW Grouping with CREATE TABLE
**Symptom**: CREATE INDEX grouped with CREATE TABLE on same table

**Solution**:
- In `groupByTableAndAction()` line 931, check `objectType` match
- Already implemented - just needs debugging

### Issue: NULL Table Name for Transactions
**Future Problem**: BEGIN/COMMIT don't have table names

**Pre-Solution**:
- Modify `if (table)` check to allow empty table for transactions
- Update GroupedStatement to allow `table: ''`
- Add logic: `table = parsed.table || parsed.action;` for transactions

### Issue: Multi-line Regex Matching
**Pattern**: Statements spanning multiple lines fail regex

**Solution**: Use `is` flag on all regex (case-insensitive + dotall)
- Already done for most statements
- Verify all new statements use it

---

## Architecture Notes

### Why "Table" Field for All Statements?

The `GroupedStatement.table` field serves two purposes:
1. **Grouping Key**: Identifies which object is affected (users table, users_idx index, user_summary view)
2. **Organization**: Allows batch processing of all changes to one logical entity

For transactions, this becomes a special case - they should be grouped by... database? timestamp? A future enhancement: support `groupByEntity()` that handles non-table entities specially.

---

## Token Budget Notes

- **Phase 2 Debug**: ~15k tokens (CREATE INDEX/VIEW fixes)
- **Phase 3 Planning**: ~5k tokens per statement type
- **Phase 3 Implementation**: ~40-50k tokens per statement type
- **Total Budget for Phases 2-3**: ~150k tokens

**Current Status**: 130k/200k used, 70k remaining
- Enough for Phase 2 completion (15k) + Phase 3 start (30k)
- Phase 3 will require 2-3 additional sessions
