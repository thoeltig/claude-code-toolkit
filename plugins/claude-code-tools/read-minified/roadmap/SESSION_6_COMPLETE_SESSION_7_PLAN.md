# Session 6 Complete - Session 7 Strategy

## Session 6 Recap: Phase 3 Complete ✅

**Tests Implemented**: 366/366 passing
- Phase 2 baseline: 253 tests
- Phase 3 added: 113 tests
  - Transaction Control: 28 tests
  - GRANT/REVOKE: 43 tests
  - ALTER TABLE: 42 tests

**Statement Types Covered**: 13 major types with variants
- CREATE (TABLE, INDEX, VIEW)
- INSERT, SELECT, UPDATE, DELETE
- TRUNCATE, DROP, ALTER
- BEGIN, COMMIT, ROLLBACK, SAVEPOINT, RELEASE
- GRANT, REVOKE

---

## Session 7 Strategy: Information Preservation First

### Core Philosophy
**"Never lose information. Build incrementally. Test before implementing."**

### Implementation Approach

#### 1. Fallback Field Strategy (NO INFORMATION LOSS)

**Key Insight**: Rather than complex reconstruction, add a fallback field:

```json
{
  "action": "SELECT",
  "table": "users",
  "columns": ["id", "name"],
  "where": "status = 'active'",
  "unparsedContent": "LEFT JOIN orders ON users.id = orders.user_id WHERE orders.total > 1000",
  "statementIndex": 0
}
```

**Behavior**:
- Parse what we can support → structured fields
- Complex/unsupported parts → capture in `unparsedContent` (raw SQL string)
- Later: incrementally parse `unparsedContent` in follow-up sessions
- Result: Zero information loss + gradual improvement

**Example Evolution**:
```
Session 7: Parse basic JOINs, push complex subqueries to unparsedContent
Session 8: Parse subqueries from unparsedContent, push CTEs to unparsedContent
Session 9: Parse CTEs, push window functions to unparsedContent
```

#### 2. Test-Driven Reconstruction Decision

**Before implementing reconstruction**:
1. Write test comparing:
   ```typescript
   const original = 'SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)';
   const json = formatSql(original, { minify: true });
   const reconstructed = reconstructSql(json);
   const normalized1 = normalize(original);
   const normalized2 = normalize(reconstructed);
   expect(normalized2).toBe(normalized1);
   ```

2. **If simple** (80% coverage): Implement full reconstruction
3. **If medium complex** (60% coverage): Use `unparsedContent` field + keep original SQL available
4. **Measure complexity**: Estimate hours needed
5. **Decision gate**: Only implement if < 4 hours estimated

---

## Session 7 Detailed TODO

### Part A: Setup & Benchmarking Script (Day 1)

**1.1 Create Reusable SQL Generation Script**
- File: `scripts/generate-test-sql.ts`
- Purpose: Benchmark script reusable for future sessions
- Output: Generated SQL files with known patterns
- Coverage:
  - Basic CRUD (INSERT, SELECT, UPDATE, DELETE)
  - Multiple tables with JOINs
  - Subqueries
  - Constraints and indexes
  - Complex expressions
  - Transaction sequences
- Usage: `npm run generate-sql -- --count 100 --output ./benchmark.sql`

**1.2 Create Real-World Test Suite**
- File: `tests/formats/sql.real-world.test.ts`
- Source: Generated SQL from 1.1
- Separate from unit tests
- Tests:
  - Parsing success/failure rates
  - Token count vs original
  - Information preservation
  - Edge case patterns

---

### Part B: Information Preservation & Fallback (Day 2-3)

**2.1 Add `unparsedContent` Field to Schema**
- Update `GroupedStatement` interface
- Field: `unparsedContent?: string` (raw SQL for unsupported parts)
- Update all formatters to include it (if present)

**2.2 Implement Fallback in Parser**
- When unsupported SQL pattern detected:
  - Extract what we can → structured fields
  - Remaining text → `unparsedContent`
  - Example: Complex subqueries, JOINs with ON conditions, CASE statements

**2.3 Fallback Extraction Tests (30+ tests)**
- Complex SELECT with JOINs
  ```sql
  SELECT u.*, o.total
  FROM users u
  LEFT JOIN orders o ON u.id = o.user_id
  WHERE o.total > (SELECT AVG(total) FROM orders)
  ```
  - Extracts: table=users, action=SELECT, columns=[u.*, o.total]
  - Fallback: JOIN clause and complex WHERE

- Nested subqueries
- CTEs (WITH clauses)
- Window functions
- CASE statements in SELECT
- Complex expressions

**2.4 Zero Information Loss Verification**
- All unparsedContent + structured fields = original SQL (semantically)
- No data discarded
- Test: Hash(original) ≈ Hash(unparsedContent + reconstructed fields)

---

### Part C: Reconstruction (If Simple) (Day 3-4)

**3.1 Test-Driven Decision**
```typescript
describe('SQL Reconstruction', () => {
  const testCases = [
    // Basic cases - should work
    'SELECT id, name FROM users WHERE age > 18',
    'INSERT INTO users (name) VALUES ("John")',
    'UPDATE users SET status = "active" WHERE id = 1',
    'DELETE FROM users WHERE id = 1',
    // Complex cases - may use unparsedContent
    'SELECT * FROM users LEFT JOIN orders ON ...',
    'SELECT * FROM users WHERE id IN (SELECT ...)',
  ];

  test.each(testCases)('should reconstruct %s', (sql) => {
    const json = formatSql(sql, { minify: true });
    const reconstructed = reconstructSql(json);
    const normalized1 = normalize(sql);
    const normalized2 = normalize(reconstructed);

    // This test FAILS if reconstruction too complex
    // We then use unparsedContent strategy instead
    expect(normalized2).toBe(normalized1);
  });
});
```

**3.2 If Test Passes** (Simple enough):
- Implement `reconstructSql(json)` function
- Tests for all supported statement types
- File: `src/formats/sql-reconstruct.ts`

**3.3 If Test Fails** (Too complex):
- Mark as deferred
- Use `unparsedContent` as primary fallback
- Plan incremental parsing for Session 8

---

### Part D: Edge Cases & Comprehensive Testing (Day 4-5)

**4.1 Low-Hanging Fruit Edge Cases (20-30 tests)**
- Multiple values in INSERT
- Complex WHERE with multiple conditions
- Constraint variations in CREATE TABLE
- Multiple columns in indexes
- Case insensitivity edge cases
- Whitespace variations

**4.2 Complex Expressions (10-15 tests)**
- Arithmetic: `SET x = y + 1`
- Functions: `WHERE YEAR(date) = 2024`
- Subqueries: `WHERE id IN (SELECT ...)`
- Case statements: `SELECT CASE WHEN ... THEN ... END`
- Aggregate with HAVING: `GROUP BY status HAVING COUNT(*) > 5`

**4.3 Fallback Behavior Tests (15-20 tests)**
- Verify `unparsedContent` captures complex parts
- Verify structured fields still extract what they can
- Verify zero information loss on all patterns
- Test: original SQL ≈ structured + unparsedContent

---

### Part E: Real-World Validation (Day 5)

**5.1 Real-World SQL Test Suite**
- Use generated SQL from 1.1
- Run against parser
- Measure:
  - Success rate (% fully parsed)
  - Fallback rate (% using unparsedContent)
  - Token savings (JSON vs original)
  - Edge cases encountered

**5.2 Benchmarking Report**
- File: `benchmarks/session-7-results.md`
- Metrics:
  - Tests: unit (100+) vs real-world (50+)
  - Coverage: % of statement types
  - Quality: Zero information loss ✓
  - Performance: Token count reduction

---

## Expected Outcomes

### Tests
- Unit tests: +50-70 (edge cases, fallback, reconstruction decision)
- Real-world tests: +30-50 (generated SQL patterns)
- Total Phase 3-7: 450+ tests

### Code Changes
- `sql.ts`: Add unparsedContent field + fallback logic (~50-100 lines)
- `sql-reconstruct.ts`: Conditional based on test decision (0-200 lines)
- `generate-test-sql.ts`: Script for benchmarking (~150-200 lines)

### Quality Guarantee
- ✅ Zero information loss on all inputs
- ✅ Graceful degradation (parse what we can, fallback unknown)
- ✅ Incremental improvement path (reduce unparsedContent over time)
- ✅ Reusable benchmarking script
- ✅ Comprehensive real-world validation

---

## Decision Gates

### Gate 1: Fallback Testing
- If any test shows information loss → STOP, fix before proceeding
- All fallback tests must pass

### Gate 2: Reconstruction Test
- Run test suite before implementation
- If >80% pass → implement reconstruction
- If 60-80% pass → use unparsedContent + document reconstruction roadmap
- If <60% pass → pure fallback strategy

### Gate 3: Real-World Results
- Must achieve 90%+ success on generated SQL
- If lower → identify and add missing patterns

---

## Reusable Artifacts

1. **generate-test-sql.ts** - Reusable SQL generator
2. **Benchmarking script** - Can run monthly to track improvements
3. **Real-world test suite** - Corpus of tested patterns
4. **Fallback strategy** - Template for handling unsupported SQL in future features
5. **Reconstruction decision framework** - Guidance for future phases

