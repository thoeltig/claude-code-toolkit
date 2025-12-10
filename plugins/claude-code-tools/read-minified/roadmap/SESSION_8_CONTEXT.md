# Session 8 Context - CASE Statements Implementation

## Completed in Session 7
- Feature 1: Column Aliases (AS keyword, space-based) ✅
- Feature 2: JOINs (INNER, LEFT, RIGHT, FULL OUTER, CROSS) ✅
- Feature 3: GROUP BY / HAVING ✅
- Feature 5: UNION/INTERSECT/EXCEPT ✅
- Total tests: 976+ passing

## Feature 4: CASE Statements (Remaining)

### Scope
Parse CASE statements in SELECT clause:
- Simple CASE: `CASE status WHEN 'active' THEN 1 WHEN 'inactive' THEN 0 END`
- Searched CASE: `CASE WHEN age > 18 THEN 'adult' ELSE 'minor' END`
- Nested CASE
- CASE in column expressions, not subqueries

### Implementation Strategy

#### 1. Interface Updates
```typescript
caseStatements?: Array<{
  column?: string;     // Alias or position
  caseType: 'simple' | 'searched';
  whens: Array<{when: string; then: string}>;
  else?: string;
}>
```

#### 2. Parser Function Location
- File: `src/formats/sql.ts`
- Function: `parseCaseStatements(sql: string)`
- Call from: `parseSelectStatement()` after column parsing

#### 3. Regex Patterns Needed
- Simple CASE: `/CASE\s+(\w+)\s+WHEN\s+(...)\s+THEN\s+(...)/gi`
- Searched CASE: `/CASE\s+WHEN\s+(...)\s+THEN\s+(...)/gi`
- WHEN/THEN pairs: Extract all pairs until END
- Nested CASE: Handle parentheses depth or defer to unparsedContent

#### 4. Test Cases Needed (estimate 25-35 tests)
```
- Simple CASE (5 tests): basic, multiple WHEN, with ELSE, nested conditions
- Searched CASE (5 tests): simple, complex, multiple WHEN, with ELSE
- CASE with aliases (5 tests): AS keyword, space-based
- CASE in SELECT list (5 tests): single, multiple CASE statements
- CASE edge cases (5 tests): whitespace, case insensitivity
- Backward compatibility (3 tests): SELECT without CASE, mixed queries
```

#### 5. Decision Point
If CASE parsing becomes complex (>200 lines or <70% test pass):
- Use unparsedContent fallback for complex CASEs
- Parse only simple CASE statements
- Mark complex patterns for Session 9

### Commits Expected
1. `features/case-statements: Add CASE statement parsing`
   - parseCaseStatements() function
   - Interface updates
   - Integration with parseSelectStatement
   - 25-35 tests

### Known Complexity Areas
- Nested parentheses in WHEN conditions
- CASE within aggregate functions: `COUNT(CASE WHEN ... END)`
- Multiple CASE statements in same SELECT
- CASE with NULL comparisons

### Fallback Strategy
If complex: capture entire CASE ... END as unparsedContent, minimal field extraction

### Next Session: Feature Completion
After Feature 4, will have parsed:
1. Column aliases ✅
2. JOINs ✅
3. GROUP BY/HAVING ✅
4. CASE statements (pending)
5. UNION/INTERSECT ✅

Remaining for later: Subqueries, CTEs, Window functions

