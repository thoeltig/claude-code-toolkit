# Session 5 Starter Guide - ALTER TABLE Parser Implementation

## Quick Context

**What to implement**: ALTER TABLE statement parsing

**Where to start**: `src/formats/sql.ts` - Add `parseAlterStatement()` function

**Where to test**: `tests/formats/sql.alter-table.test.ts` - Create new test file

---

## Implementation Checklist

### Step 1: Add ALTER Detection
- [ ] Update `detectStatementType()` to recognize `ALTER TABLE`
- [ ] Update `extractTableName()` to handle ALTER statements

**Code location**: Around lines 237-264 in `sql.ts`

---

### Step 2: Create parseAlterStatement() Function

**Signature**:
```typescript
function parseAlterStatement(sql: string): ParsedAlter | null {
  // Extract: table, alterType, columnName, definition, etc.
}
```

**Output format**:
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

**Test cases to support** (priority order):
1. ADD COLUMN
2. DROP COLUMN
3. MODIFY COLUMN
4. RENAME TO (table rename)
5. ADD PRIMARY KEY
6. ADD UNIQUE
7. ADD FOREIGN KEY
8. DROP PRIMARY KEY
9. DROP FOREIGN KEY
10. CHANGE COLUMN (MySQL)

---

### Step 3: Update GroupedStatement Interface
- [ ] Add `alterType?: string`
- [ ] Add `columnName?: string`
- [ ] Add `definition?: string`

**Location**: Lines 84-95 in `sql.ts`

---

### Step 4: Update groupByTableAndAction()
- [ ] Handle ALTER statements in grouping logic
- [ ] Store ALTER details from parsed data

**Location**: Lines 649-735 in `sql.ts`

---

### Step 5: Update formatSql() Output
- [ ] Add ALTER case to result mapping
- [ ] Include alterType, columnName, definition in output

**Location**: Lines 29-56 in `sql.ts`

```typescript
} else if (group.action === 'ALTER') {
  const output: any = {
    table: group.table,
    action: 'ALTER',
    statementIndex: group.startIndex
  };
  if (group.alterType) output.alterType = group.alterType;
  if (group.columnName) output.columnName = group.columnName;
  if (group.definition) output.definition = group.definition;
  return output;
}
```

---

## Test File Template

Create `tests/formats/sql.alter-table.test.ts`:

```typescript
import { formatSql } from '../../src/formats/sql';

describe('SQL ALTER TABLE Parsing', () => {
  describe('ALTER ADD COLUMN', () => {
    test('should parse simple ADD COLUMN', () => {
      const sql = 'ALTER TABLE users ADD COLUMN phone VARCHAR(20);';
      const output = formatSql(sql, { minify: true });
      const result = JSON.parse(output);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('ALTER');
      expect(result[0].table).toBe('users');
      expect(result[0].alterType).toBe('ADD COLUMN');
      expect(result[0].columnName).toBe('phone');
      expect(result[0].definition).toBe('VARCHAR(20)');
    });

    // Add more tests...
  });

  describe('ALTER DROP COLUMN', () => {
    // Tests here
  });

  // ... etc
});
```

---

## Reference Documents

**For detailed requirements**:
- `roadmap/COMPLETE_SQL_ROADMAP.md` - Section 1.1 (ALTER TABLE)
- Lines 74-132 - Complete spec with all ALTER types

**For test strategy**:
- `roadmap/DATA_LOSS_VERIFICATION_SPEC.md` - Verification approach
- `tests/formats/sql.edge-cases.test.ts` - Example edge case tests

---

## Target Metrics

- **Tests**: 15-20 tests for ALTER TABLE
- **Coverage**: All 10 ALTER types from roadmap
- **Pass rate**: 100% (15-20/15-20)
- **Files modified**: 2 (sql.ts + new test file)
- **Estimated time**: 2-3 hours

---

## Helpful SQL Examples

```sql
-- ADD COLUMN
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- DROP COLUMN
ALTER TABLE users DROP COLUMN phone;

-- MODIFY COLUMN (MySQL)
ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NOT NULL;

-- CHANGE COLUMN (MySQL)
ALTER TABLE users CHANGE COLUMN age years INT;

-- RENAME TO
ALTER TABLE users RENAME TO customers;

-- ADD PRIMARY KEY
ALTER TABLE users ADD PRIMARY KEY (id);

-- ADD UNIQUE
ALTER TABLE users ADD UNIQUE KEY (email);

-- ADD FOREIGN KEY
ALTER TABLE users ADD FOREIGN KEY (role_id) REFERENCES roles(id);

-- DROP PRIMARY KEY
ALTER TABLE users DROP PRIMARY KEY;

-- DROP FOREIGN KEY
ALTER TABLE users DROP FOREIGN KEY fk_role;
```

---

## Key Points

1. **Information Parity**: Capture all details needed to reconstruct original ALTER statement
2. **Edge Cases**: Handle multiline definitions, multiple COLUMNs in one ALTER
3. **Type Detection**: ALTER uses different structure per ALTER TYPE
4. **Regex Carefully**: ALTER syntax varies by database (MySQL vs PostgreSQL)

---

## Success Criteria

- [ ] All 15-20 ALTER tests passing
- [ ] No regression in existing tests (145+ still passing)
- [ ] All ALTER information captured
- [ ] Zero data loss (can reconstruct SQL from JSON)

---

## Next Steps After ALTER TABLE

Once complete:
1. Run full test suite: `npm test -- tests/formats/sql`
2. Verify 160+ tests passing (145 existing + 15-20 new)
3. Commit changes
4. Move to DROP statement parser (Phase 7a Week 1, Day 2)

---

**Good luck! You've got all the context you need. Happy coding! 🚀**
