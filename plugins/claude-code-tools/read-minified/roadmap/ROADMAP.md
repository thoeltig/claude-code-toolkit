# SQL Parser - Roadmap & Next Steps

## Current Status
- ✅ **Session 2 Complete**: INSERT, CREATE, UPDATE, DELETE, SELECT parsing implemented
- ✅ **Test Coverage**: 87/87 tests passing (100%)
- ✅ **Examples**: Simple and complex examples created
- ✅ **Documentation**: Usage guide and output examples documented

## Session 3: Enhanced Parsing & Documentation

### Phase 1: Update & Delete Conditions (Priority 1)

**Problem**: Currently UPDATE and DELETE nodes don't include WHERE clause conditions, making it unclear what data was affected.

**Solution**: Parse and include condition information in UPDATE/DELETE nodes.

#### UPDATE Node - Enhanced

Current:
```json
{
  "table": "users",
  "action": "UPDATE",
  "statementIndex": 3
}
```

Target:
```json
{
  "table": "users",
  "action": "UPDATE",
  "condition": {
    "raw": "id = 1",
    "parsed": {
      "column": "id",
      "operator": "=",
      "value": 1
    }
  },
  "statementIndex": 3
}
```

#### DELETE Node - Enhanced

Current:
```json
{
  "table": "products",
  "action": "DELETE",
  "statementIndex": 10
}
```

Target:
```json
{
  "table": "products",
  "action": "DELETE",
  "condition": {
    "raw": "id > 100",
    "parsed": {
      "column": "id",
      "operator": ">",
      "value": 100
    }
  },
  "statementIndex": 10
}
```

**Implementation Steps**:
1. Create `parseUpdateCondition()` function to extract WHERE clause
2. Create `parseDeleteCondition()` function to extract WHERE clause
3. Parse conditions into structured format (column, operator, value)
4. Handle complex conditions with AND/OR (Phase 2)
5. Add tests for condition parsing (15-20 tests)
6. Update existing tests to validate condition presence

### Phase 2: Examples & Documentation

**New Examples to Create**:

1. **SELECT Example** (`examples/select-example.ts`)
   - Show how SELECT statements are handled
   - Demonstrate exclusion from output
   - Show behavior when SELECT exists with CREATE

2. **Mixed INSERT & UPDATE Example** (`examples/mixed-insert-update.ts`)
   - Demonstrate grouping with alternating actions
   - Show condition information in UPDATE nodes
   - Display execution order preservation

**Tests to Add**:
- UPDATE condition parsing (10 tests)
- DELETE condition parsing (10 tests)
- Complex conditions (AND/OR) (5 tests)
- Edge cases (quoted values, functions) (5 tests)

### Phase 3: Documentation Updates

#### Script-Level Documentation

**Update Files**:
- `read-minified/README.md`
  - Add SQL parsing section
  - Document grouping logic
  - Include example output
  - Link to examples

- `read-minified/CHANGELOG.md`
  - Document v0.7.0 changes (conditions support)
  - List all new features
  - Breaking changes (if any)

#### Plugin-Level Documentation

**Update Files**:
- `plugins/claude-code-tools/README.md`
  - Document read-minified plugin
  - SQL parsing capabilities
  - Installation instructions

- `plugins/claude-code-tools/CHANGELOG.md`
  - Version history
  - v0.7.0 release notes

### Phase 4: Testing & Validation

**Test Plan**:
- 20 new tests for condition parsing
- 100% coverage of UPDATE/DELETE conditions
- Integration tests with mixed statements
- Performance tests for large SQL dumps

**Expected Results**:
- Total tests: 107+ (87 current + 20+ new)
- Pass rate: 100%
- All edge cases covered

## Session 4: Advanced Features (Future)

### Complex Conditions
- AND/OR operators
- Nested conditions
- BETWEEN, IN, LIKE operators
- Subqueries in conditions

### SELECT Details
- Column selection parsing
- JOIN information extraction
- ORDER BY, GROUP BY, LIMIT
- Alias handling

### ALTER Statements
- ALTER TABLE support
- Column modifications
- Index management

### Transaction Support
- BEGIN/COMMIT/ROLLBACK
- Grouped by transaction boundaries

## Files to Modify

### New Files
```
read-minified/
├── examples/
│   ├── select-example.ts          (NEW)
│   └── mixed-insert-update.ts     (NEW)
└── ROADMAP.md                      (NEW - this file)

plugins/claude-code-tools/
├── README.md                       (UPDATE)
└── CHANGELOG.md                    (UPDATE)
```

### Modified Files
```
read-minified/
├── src/formats/sql.ts
│   ├── parseUpdateStatement()      (ENHANCE - add conditions)
│   ├── parseDeleteStatement()      (ENHANCE - add conditions)
│   └── parseCondition()            (NEW helper function)
├── tests/formats/
│   ├── sql.update-delete.test.ts  (ADD 15+ tests)
│   └── sql.conditions.test.ts     (NEW - 10+ tests)
├── README.md                       (UPDATE - add SQL section)
├── CHANGELOG.md                    (UPDATE - v0.7.0)
└── PARSER_USAGE.md                (UPDATE - conditions section)
```

## Estimated Effort

| Task | Complexity | Time Est | Tests |
|------|-----------|----------|-------|
| Parse UPDATE conditions | Medium | 2h | 10 |
| Parse DELETE conditions | Medium | 2h | 10 |
| CREATE examples | Low | 1h | - |
| UPDATE tests | Medium | 1.5h | 15 |
| Documentation | Low | 2h | - |
| **Total** | **Medium** | **8.5h** | **35+** |

## Session 3 Checklist

- [ ] Implement condition parsing for UPDATE
- [ ] Implement condition parsing for DELETE
- [ ] Add structured condition output to UPDATE nodes
- [ ] Add structured condition output to DELETE nodes
- [ ] Create SELECT example
- [ ] Create mixed INSERT/UPDATE example
- [ ] Add 20+ tests for condition parsing
- [ ] Update PARSER_USAGE.md with condition info
- [ ] Update script-level README
- [ ] Update script-level CHANGELOG
- [ ] Update plugin-level README
- [ ] Update plugin-level CHANGELOG
- [ ] Run full test suite (target: 100+ tests, 100% pass)
- [ ] Test examples end-to-end
- [ ] Code review and cleanup

## Notes for Next Session

1. **Condition Parsing Strategy**:
   - Start simple: `column operator value`
   - Support: `=`, `!=`, `>`, `<`, `>=`, `<=`, `LIKE`, `IN`, `BETWEEN`
   - Handle quoted values correctly
   - Extract numeric values properly

2. **Documentation Priority**:
   - Script-level README is critical for users
   - Include actual JSON output examples
   - Link to examples folder
   - Document grouping behavior clearly

3. **Testing Approach**:
   - Create separate test file for conditions
   - Test each operator independently
   - Test complex value types (strings, numbers, booleans)
   - Test edge cases (quotes in conditions, NULL values)

4. **Future Considerations**:
   - Complex conditions with AND/OR may need tree structure
   - Consider how to represent in JSON cleanly
   - Performance impact of deep parsing
   - Support for functions in conditions (NOW(), DATE_ADD, etc.)

## Session 3 Success Criteria

✅ All listed tasks completed
✅ 100+ tests passing (100% pass rate)
✅ Conditions visible in UPDATE/DELETE nodes
✅ Examples runnable and documented
✅ README updated at both levels
✅ CHANGELOG updated at both levels
✅ Code review passed
✅ No regressions from Session 2
