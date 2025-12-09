# SQL Parser Roadmap - v0.6.1.0 to v0.7.0

## Vision
Complete CRUD statement support (SELECT, UPDATE, DELETE) following the same architecture as INSERT/CREATE, then fix edge cases for 100% test coverage.

## Current Status (End of Session 2)
- **Tests**: 523/531 passing (98.5%)
- **Statements**: INSERT ✅, CREATE TABLE ✅
- **Architecture**: Solid, extensible
- **Code**: ~525 lines, well-structured

---

# SESSION 3: Parser Completeness (CRUD Coverage)

## Goal
Add SELECT, UPDATE, DELETE parsing with full test coverage and grouping logic.

## Phase 1: Architecture Setup (1-2 hours)

### 1.1 Define Output Data Structures
**File**: `src/formats/sql.ts` - Add TypeScript interfaces

```typescript
// SELECT output (simpler - just metadata, no data parsing)
interface SelectData {
  tables: string[];      // FROM clauses
  columns: string[];     // SELECT list
  conditions?: string;   // WHERE clause (as-is)
}

// UPDATE output
interface UpdateData {
  columns: string[];     // SET clause columns
  values: any[];         // SET clause values
  conditions?: string;   // WHERE clause (as-is)
}

// DELETE output (minimal)
interface DeleteData {
  conditions?: string;   // WHERE clause (as-is)
}
```

### 1.2 Add Output Object Types to GroupedStatement
Extend interface to support SELECT/UPDATE/DELETE parsed data:
```typescript
interface GroupedStatement {
  // ... existing fields ...
  selectData?: SelectData;
  updateData?: UpdateData;
  deleteData?: DeleteData;
}
```

### 1.3 Update formatSql Output Logic
Add handling in `formatSql()` for new statement types:
- SELECT: output `{ table, action: 'SELECT', selectData, statementIndex }`
- UPDATE: output `{ table, action: 'UPDATE', updateData, statementIndex }`
- DELETE: output `{ table, action: 'DELETE', deleteData, statementIndex }`

---

## Phase 2: SELECT Implementation (2-3 hours)

### 2.1 Implement parseSelectStatement()

**Complexity**: Medium (table/column extraction)

```typescript
function parseSelectStatement(sql: string): SelectData | null {
  // Extract SELECT columns: everything between SELECT and FROM
  // Extract FROM table(s): table name after FROM
  // Extract WHERE conditions: everything after WHERE (keep as-is)
  // Handle JOINs: store all table names
  // Handle subqueries: optional, parse recursively or skip
}
```

**Test cases to write** (`tests/formats/sql.select.test.ts`):
1. Basic: `SELECT * FROM users`
2. Specific columns: `SELECT id, name FROM users`
3. With WHERE: `SELECT * FROM users WHERE id > 5`
4. Multiple tables/JOIN: `SELECT * FROM users JOIN orders ON ...`
5. Aggregate: `SELECT COUNT(*) FROM users`
6. DISTINCT, ORDER BY, GROUP BY
7. Nested SELECT (subqueries)
8. Case insensitivity

### 2.2 Test Execution
Run tests, debug, iterate until all SELECT tests pass.

---

## Phase 3: UPDATE Implementation (1.5-2 hours)

### 3.1 Implement parseUpdateStatement()

**Complexity**: Medium (SET clause parsing)

```typescript
function parseUpdateStatement(sql: string): UpdateData | null {
  // Extract table: UPDATE table_name
  // Extract columns and values from SET clause
  // Handle quotes in values
  // Extract WHERE conditions: keep as-is string
  // Return { columns, values, conditions }
}
```

**Test cases** (`tests/formats/sql.update.test.ts`):
1. Basic: `UPDATE users SET name='John' WHERE id=1`
2. Multiple columns: `UPDATE ... SET col1=val1, col2=val2 WHERE ...`
3. Expressions: `UPDATE ... SET count = count + 1`
4. Various data types: strings, numbers, NULL, expressions
5. Case insensitivity
6. Quoted values with escapes

### 3.2 Test Execution
Run tests, debug, iterate.

---

## Phase 4: DELETE Implementation (1-1.5 hours)

### 4.1 Implement parseDeleteStatement()

**Complexity**: Low (simplest statement)

```typescript
function parseDeleteStatement(sql: string): DeleteData | null {
  // Extract table: DELETE FROM table_name
  // Extract WHERE conditions: keep as-is
  // Return { conditions }
}
```

**Test cases** (`tests/formats/sql.delete.test.ts`):
1. Simple: `DELETE FROM users WHERE id=1`
2. No WHERE: `DELETE FROM users` (dangerous but valid)
3. Complex WHERE: with AND/OR conditions
4. Case insensitivity

### 4.2 Test Execution
Run tests, debug, iterate.

---

## Phase 5: Grouping & Mixed Statements (2-3 hours)

### 5.1 Update groupByTableAndAction()

Handle grouping for new statement types:
- **SELECT**: Don't group (each SELECT is independent query)
- **UPDATE**: Group consecutive same table+UPDATE
- **DELETE**: Group consecutive same table+DELETE
- **Mixed**: Maintain execution order, create new group for different action

**Logic**:
```
INSERT -> INSERT (same table) -> group
INSERT -> SELECT (same table) -> separate (SELECT breaks grouping)
UPDATE -> UPDATE (same table) -> group
UPDATE -> DELETE (same table) -> separate (different action)
```

### 5.2 Update formatSql() output

Ensure proper output for all combinations in result array.

### 5.3 Create comprehensive mixed-statement tests

**File**: `tests/formats/sql.crud-mixed.test.ts` (new file)

Test cases:
1. CREATE -> INSERT -> SELECT -> same table
2. INSERT -> UPDATE -> DELETE -> same table
3. Multiple tables interleaved
4. Execution order preserved
5. Grouping only for same table + same action
6. Real-world scenario: E-commerce dump with all CRUD ops

### 5.4 Test Execution
Run full test suite, debug any failures.

---

## Phase 6: Documentation & Metrics (1 hour)

### 6.1 Update TDD-PROGRESS.md
- Document all new statement type support
- Update test metrics (expected: 600+ tests total)
- Mark SELECT/UPDATE/DELETE as ✅ complete

### 6.2 Code Review
- Check for DRY violations
- Ensure consistent error handling
- Verify TypeScript types are strict

---

## Phase 7: Edge Cases Validation (1 hour)

### 7.1 Identify common edge cases for new types
- Semicolon handling
- Comment placement
- Complex WHERE clauses
- Special characters in strings

### 7.2 Document in code
Add comments explaining non-obvious parsing logic.

---

## Expected Outcomes (Session 3)

- ✅ SELECT parsing + tests (basic to complex)
- ✅ UPDATE parsing + tests (with expressions)
- ✅ DELETE parsing + tests
- ✅ Grouping logic for all statement types
- ✅ Mixed statement handling + comprehensive tests
- **Expected test count**: 600-650 tests
- **Expected pass rate**: 95%+ (some edge cases from Session 2 still failing)
- **Code size**: ~700-800 lines (added ~200 lines)

---

# SESSION 4: Edge Case Fixes & 100% Coverage

## Goals
Fix the 8 remaining failures + edge cases in new parsers for 100% pass rate.

### Priority 1: SQL Parser Edge Cases (2-3 hours)

1. **Escaped quotes in INSERT** (1 test)
   - Root cause: parseValueRows with `''` escape
   - Debug: Add logging to trace row splitting
   - Fix: Adjust state machine in parseValueRows
   - Verify: Test with multiple variations

2. **Composite table constraints** (1 test)
   - Root cause: Comma inside `PRIMARY KEY (col1, col2)`
   - Fix: Use smartSplit for table constraints parsing
   - Verify: Test with various constraint combinations

3. **SELECT grouping** (2 tests)
   - Likely: SELECT statements should/shouldn't create separate nodes
   - Debug: Check test expectations vs. implementation
   - Decision: Align grouping logic with requirements

### Priority 2: Non-SQL Test Failures (1-2 hours)

- outputFormatter tests (originalSize/newSize properties)
- formatDetector tests (log file detection)
- integration tests

These are outside SQL parser scope but needed for 100% pass rate.

### Priority 3: Comprehensive Edge Cases (2-3 hours)

For each statement type (INSERT, CREATE, SELECT, UPDATE, DELETE):
- Unicode characters in strings
- Very long strings (>1000 chars)
- Nested structures (subqueries)
- Comment placement
- Whitespace variations

---

## Expected Outcomes (Session 4)

- ✅ 531+ tests passing
- ✅ 100% pass rate for SQL parser
- ✅ Comprehensive edge case coverage
- ✅ All CRUD statements fully supported
- **Final code size**: ~750-850 lines
- **Total test suite**: 600-700 tests

---

# Implementation Order (Key Dependencies)

1. **Setup** → must be first (interfaces, types)
2. **SELECT** → simplest, good warm-up
3. **DELETE** → even simpler than UPDATE
4. **UPDATE** → most complex (SET clause parsing)
5. **Grouping** → depends on all parsers
6. **Mixed tests** → depends on grouping
7. **Edge cases** → depends on everything else

---

# Testing Strategy per Statement Type

## File Structure (New Test Files)
- `tests/formats/sql.select.test.ts` - SELECT parsing (30-40 tests)
- `tests/formats/sql.update.test.ts` - UPDATE parsing (25-30 tests)
- `tests/formats/sql.delete.test.ts` - DELETE parsing (15-20 tests)
- `tests/formats/sql.crud-mixed.test.ts` - All CRUD mixed (20-25 tests)

## Test Categories per Type

For SELECT:
- Basic column/table extraction
- WHERE clause handling
- JOIN statements
- Aggregate functions
- Subqueries (optional)
- Case variations

For UPDATE:
- SET clause parsing (single/multiple columns)
- Expression values (count+1, etc.)
- WHERE conditions
- Data type variations
- Quoted values with escapes

For DELETE:
- Basic DELETE
- WHERE required vs. optional
- Complex conditions
- Edge cases

---

# Git Workflow

```bash
# Session 3 structure
git commit "Add SELECT statement parsing and tests"
git commit "Add UPDATE statement parsing and tests"
git commit "Add DELETE statement parsing and tests"
git commit "Implement CRUD grouping logic for mixed statements"
git commit "Add comprehensive mixed-statement tests (600+ total tests)"

# Session 4 structure
git commit "Fix escaped quotes in multi-row INSERT (edge case)"
git commit "Fix composite table constraints parsing"
git commit "Fix SELECT grouping logic"
git commit "Fix non-SQL test failures (formatter, detector)"
git commit "Add comprehensive edge case coverage - 100% pass rate"
```

---

# Success Criteria

### Session 3: Parser Completeness ✅
- [ ] SELECT, UPDATE, DELETE fully implemented
- [ ] All new statement tests passing
- [ ] Grouping logic correct for all types
- [ ] Mixed statement tests comprehensive
- [ ] Pass rate: 95%+

### Session 4: 100% Coverage ✅
- [ ] All edge cases fixed
- [ ] 100% test pass rate (531+)
- [ ] Code well-documented
- [ ] Ready for production use

---

# Notes & Risks

## Risks
1. **Complex WHERE clauses** - May need special parsing beyond regex
   - Mitigation: Keep WHERE as-is string, don't parse deeply

2. **Subqueries** - Could complicate SELECT parsing
   - Mitigation: Support basic SELECT first, subqueries optional enhancement

3. **Performance** - Parser could slow with large dumps
   - Mitigation: Profile in Session 4 if needed

4. **Edge cases** - May discover more during implementation
   - Mitigation: Add to test suite incrementally

## Assumptions
- WHERE clauses can be kept as-is strings (don't need full parsing)
- Simple regex-based extraction sufficient for tables/columns
- Semicolons properly terminate statements (already handled)
- No exotic SQL dialects (MySQL, PostgreSQL specific)

---

# Files to Modify/Create

### New Files
- `tests/formats/sql.select.test.ts`
- `tests/formats/sql.update.test.ts`
- `tests/formats/sql.delete.test.ts`
- `tests/formats/sql.crud-mixed.test.ts`

### Modified Files
- `src/formats/sql.ts` (add parsers, update grouping, update output logic)
- `TDD-PROGRESS.md` (update after each session)

### No Changes Needed
- Other format parsers (json, xml, csv, etc.)
- Core CLI logic
- Caching logic
