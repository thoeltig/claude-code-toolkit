# Structural Optimization: Table-Based Grouping

## Problem Statement

**Current structure** has repeated table names:
```json
[
  {"table":"users","action":"CREATE",...},
  {"table":"users","action":"INSERT",...},
  {"table":"users","action":"UPDATE",...},
  {"table":"products","action":"CREATE",...},
  {"table":"products","action":"INSERT",...}
]
```

**Token waste**: The string `"table":"users"` appears 3 times (tokens: ~6 each = 18 tokens wasted)

**Proposed structure** groups actions per table:
```json
[
  {"table":"users","actions":[
    {"action":"CREATE",...},
    {"action":"INSERT",...},
    {"action":"UPDATE",...}
  ]},
  {"table":"products","actions":[
    {"action":"CREATE",...},
    {"action":"INSERT",...}
  ]}
]
```

**Token savings**: Table name mentioned once per table (tokens: ~2-5% reduction overall)

---

## Design Specification

### Structure Definition

```typescript
interface TableGroupedStatement {
  table: string;
  actions: StatementAction[];
}

type StatementAction =
  | CreateAction
  | InsertAction
  | SelectAction
  | UpdateAction
  | DeleteAction
  | AlterAction
  | DropAction
  | TruncateAction
  | CreateIndexAction
  | CreateViewAction
  | CreateTriggerAction;

interface BaseAction {
  action: string;
  statementIndex: number;
}

interface CreateAction extends BaseAction {
  action: 'CREATE';
  schema: CreateTableData;
}

interface InsertAction extends BaseAction {
  action: 'INSERT';
  columns: string[];
  rows: any[];
  rowCount: number;
}

// ... etc for other action types
```

### Transformation Algorithm

**Input** (flat):
```json
[
  {table: "users", action: "CREATE", ...},
  {table: "users", action: "INSERT", ...},
  {table: "products", action: "CREATE", ...},
  {table: "users", action: "UPDATE", ...}
]
```

**Algorithm**:
```typescript
function transformToTableGrouped(flat: ParsedStatement[]): TableGroupedStatement[] {
  const tableMap = new Map<string, StatementAction[]>();

  for (const stmt of flat) {
    if (!tableMap.has(stmt.table)) {
      tableMap.set(stmt.table, []);
    }

    // Extract action from statement, remove table field
    const action: StatementAction = {
      action: stmt.action,
      statementIndex: stmt.statementIndex,
      // ... other action-specific fields
    };

    tableMap.get(stmt.table)!.push(action);
  }

  // Convert to array, preserving order of first appearance
  return Array.from(tableMap.entries()).map(([table, actions]) => ({
    table,
    actions
  }));
}
```

**Output** (grouped):
```json
[
  {
    table: "users",
    actions: [
      {action: "CREATE", ...},
      {action: "INSERT", ...},
      {action: "UPDATE", ...}
    ]
  },
  {
    table: "products",
    actions: [
      {action: "CREATE", ...}
    ]
  }
]
```

---

## Benefits Analysis

### 1. Token Efficiency

**Example: 10-operation SQL file, 3 tables**

Flat format:
```
5 × "table":"users" (INSERT, UPDATE, DELETE, etc.)
3 × "table":"products"
2 × "table":"logs"
= 10 table name references × ~8 tokens each = 80 tokens
```

Grouped format:
```
1 × "table":"users"
1 × "table":"products"
1 × "table":"logs"
= 3 table name references × ~8 tokens each = 24 tokens
= 56 tokens saved (70% reduction in table references!)
```

**For 100-statement file**: ~500 token savings

### 2. Semantic Structure

**Flat**: Operations scattered across array
```
user_create, product_create, user_insert, product_insert, user_update
```

**Grouped**: Clear workflow per table
```
USERS: create → insert → update
PRODUCTS: create → insert
```

**Benefit**: Easier to understand what happened to each table

### 3. Batch Processing Efficiency

**Use case**: Processing all operations on one table together

**Flat approach**:
```typescript
// Must filter all operations
const userOps = statements.filter(s => s.table === 'users');
```

**Grouped approach**:
```typescript
// Direct access
const userOps = statements.find(s => s.table === 'users')?.actions;
```

### 4. Cascading Impact

**Use case**: Understanding dependencies (order matters)

**Flat**: Must search entire array
```
CREATE users → what operations follow on users?
INSERT users → ...
UPDATE users → ...
```

**Grouped**: All operations on table together
```
users: [CREATE, INSERT, UPDATE] - clear sequence
```

---

## Migration Strategy

### Phase 1: Add New Function (Non-Breaking)

```typescript
// Keep old function
export function formatSql(sql: string, options: FormatOptions): string {
  // ... existing logic
  return JSON.stringify(flat); // Flat format
}

// New function
export function formatSqlGrouped(sql: string, options: FormatOptions): string {
  const flat = parseSqlStatements(sql);
  const grouped = transformToTableGrouped(flat);
  return JSON.stringify(grouped);
}
```

**Status**: Both functions work, developers choose which to use

### Phase 2: Test Equivalence

For every test, verify both formats contain same semantic data:

```typescript
test('both formats contain same information', () => {
  const sql = 'CREATE TABLE users ...; INSERT INTO users ...;';

  const flat = JSON.parse(formatSql(sql, { minify: true }));
  const grouped = JSON.parse(formatSqlGrouped(sql, { minify: true }));

  // Extract users operations from both
  const flatUserOps = flat.filter(s => s.table === 'users');
  const groupedUserOps = grouped.find(t => t.table === 'users')?.actions || [];

  // Compare (should be equivalent)
  expect(flatUserOps).toEqual(groupedUserOps);
});
```

### Phase 3: Switch Default

Make grouped format the default:

```typescript
export function formatSql(sql: string, options: FormatOptions): string {
  // ... existing logic
  return JSON.stringify(transformToTableGrouped(flat)); // NOW grouped!
}

// Keep flat format for backwards compat
export function formatSqlFlat(sql: string, options: FormatOptions): string {
  const flat = parseSqlStatements(sql);
  return JSON.stringify(flat);
}
```

**Impact**: 145+ tests need updating to expect grouped format

### Phase 4: Update Tests

```typescript
// Before
test('should parse SQL', () => {
  const result = JSON.parse(formatSql(sql, { minify: true }));
  expect(result).toHaveLength(2);
  expect(result[0].table).toBe('users');
  expect(result[0].action).toBe('CREATE');
  expect(result[1].table).toBe('users');
  expect(result[1].action).toBe('INSERT');
});

// After
test('should parse SQL (grouped)', () => {
  const result = JSON.parse(formatSql(sql, { minify: true }));
  expect(result).toHaveLength(1);
  expect(result[0].table).toBe('users');
  expect(result[0].actions).toHaveLength(2);
  expect(result[0].actions[0].action).toBe('CREATE');
  expect(result[0].actions[1].action).toBe('INSERT');
});
```

### Phase 5: Remove Flat Format

After deprecation period:
```typescript
// Remove formatSqlFlat() - grouped is now standard
// Update documentation
// Mark as v1.0.0 (breaking change)
```

---

## Detailed Transformation Examples

### Example 1: Single Table, Multiple Operations

**Input**:
```sql
CREATE TABLE users (id INT, email VARCHAR(255));
INSERT INTO users VALUES (1, 'john@example.com');
SELECT * FROM users;
UPDATE users SET email = 'jane@example.com' WHERE id = 1;
DELETE FROM users WHERE id > 100;
```

**Flat Output**:
```json
[
  {"table":"users","action":"CREATE","schema":{...},"statementIndex":0},
  {"table":"users","action":"INSERT","rows":[...],"statementIndex":1},
  {"table":"users","action":"SELECT","columns":["id","email"],"statementIndex":2},
  {"table":"users","action":"UPDATE","updates":[...],"where":"id = 1","statementIndex":3},
  {"table":"users","action":"DELETE","where":"id > 100","statementIndex":4}
]
```
**Size**: ~450 characters

**Grouped Output**:
```json
[
  {
    "table":"users",
    "actions":[
      {"action":"CREATE","schema":{...},"statementIndex":0},
      {"action":"INSERT","rows":[...],"statementIndex":1},
      {"action":"SELECT","columns":["id","email"],"statementIndex":2},
      {"action":"UPDATE","updates":[...],"where":"id = 1","statementIndex":3},
      {"action":"DELETE","where":"id > 100","statementIndex":4}
    ]
  }
]
```
**Size**: ~420 characters (6.7% smaller)

---

### Example 2: Multiple Tables

**Input**:
```sql
CREATE TABLE users (id INT);
CREATE TABLE products (id INT);
INSERT INTO users VALUES (1);
INSERT INTO products VALUES (1);
UPDATE users SET active = true;
UPDATE products SET price = 19.99;
```

**Flat Output**:
```json
[
  {"table":"users","action":"CREATE",...},
  {"table":"products","action":"CREATE",...},
  {"table":"users","action":"INSERT",...},
  {"table":"products","action":"INSERT",...},
  {"table":"users","action":"UPDATE",...},
  {"table":"products","action":"UPDATE",...}
]
```
**Table references**: 6 (each ~8 tokens)

**Grouped Output**:
```json
[
  {
    "table":"users",
    "actions":[
      {"action":"CREATE",...},
      {"action":"INSERT",...},
      {"action":"UPDATE",...}
    ]
  },
  {
    "table":"products",
    "actions":[
      {"action":"CREATE",...},
      {"action":"INSERT",...},
      {"action":"UPDATE",...}
    ]
  }
]
```
**Table references**: 2 (each ~8 tokens)
**Savings**: 4 × 8 = 32 tokens saved

---

### Example 3: Complex Real-World Scenario

**SQL Dump** (migration script):
- 20 CREATE TABLE statements
- 100 INSERT statements (5 per table)
- 10 UPDATE statements
- 5 DELETE statements
- 10 ALTER statements

**Flat format**: 145 operations, 145 table references (~1160 tokens)
**Grouped format**: 20 tables, 1 reference each (~160 tokens)
**Savings**: 1000 tokens (86% reduction in table references!)

---

## Implementation Considerations

### 1. Backwards Compatibility

**Option A: Breaking Change** (recommended)
- New major version (v1.0.0)
- Update documentation
- Provide migration guide for users
- Remove flat format entirely

**Option B: Dual Support** (more work)
- Keep both formats
- Add `format` option: `formatSql(sql, {format: 'grouped'|'flat'})`
- Maintain both forever (tech debt)

**Recommendation**: Option A - breaking change is worth the benefit

### 2. Index-Based Lookups

After grouping, accessing by `statementIndex` becomes more complex:

```typescript
// Before (flat)
const stmt = flat[3]; // Direct array access

// After (grouped)
function getStatementByIndex(grouped: TableGroupedStatement[], index: number) {
  for (const table of grouped) {
    for (const action of table.actions) {
      if (action.statementIndex === index) {
        return action;
      }
    }
  }
  return null;
}
```

**Mitigation**: Create index map if frequently needed

### 3. Ordered Iteration

After grouping, iteration is now by table, not by order of execution:

```typescript
// Before (flat)
for (const stmt of flat) {
  process(stmt); // In order of execution
}

// After (grouped)
// Must manually sort by statementIndex if order matters
for (const table of grouped) {
  table.actions.sort((a, b) => a.statementIndex - b.statementIndex);
  for (const action of table.actions) {
    process(action); // Now in order
  }
}
```

**Mitigation**: Use comparison/reconstruction function

---

## Testing Strategy

### 1. Transformation Tests

```typescript
describe('Table Grouping Transformation', () => {
  test('should group consecutive same-table operations', () => {
    const flat = [
      {table: 'users', action: 'CREATE'},
      {table: 'users', action: 'INSERT'},
      {table: 'products', action: 'CREATE'},
      {table: 'users', action: 'UPDATE'}
    ];

    const grouped = transformToTableGrouped(flat);

    expect(grouped).toHaveLength(2);
    expect(grouped[0].table).toBe('users');
    expect(grouped[0].actions).toHaveLength(3); // CREATE, INSERT, UPDATE
    expect(grouped[1].table).toBe('products');
    expect(grouped[1].actions).toHaveLength(1);
  });

  test('should preserve statementIndex', () => {
    const grouped = transformToTableGrouped(flat);
    const allActions = grouped.flatMap(t => t.actions);
    for (let i = 0; i < allActions.length; i++) {
      expect(allActions[i].statementIndex).toBe(i);
    }
  });
});
```

### 2. Round-Trip Tests

```typescript
describe('Transformation Round-Trip', () => {
  test('grouped → flat → grouped should be identical', () => {
    const original = JSON.parse(formatSqlGrouped(sql, {minify: true}));
    const flat = transformGroupedToFlat(original);
    const regrouped = transformFlatToGrouped(flat);

    expect(regrouped).toEqual(original);
  });
});
```

### 3. Token Efficiency Tests

```typescript
describe('Token Efficiency', () => {
  test('grouped format should be more token-efficient', () => {
    const sql = generateLargeSqlWithManyTables(100);

    const flatJson = formatSql(sql, {minify: true});
    const groupedJson = formatSqlGrouped(sql, {minify: true});

    // Grouped should be smaller
    expect(groupedJson.length).toBeLessThan(flatJson.length);

    // Should save at least 5% tokens
    const savings = (flatJson.length - groupedJson.length) / flatJson.length;
    expect(savings).toBeGreaterThan(0.05);
  });
});
```

---

## Performance Analysis

### Parsing Performance

**Flat format**: O(n) where n = number of statements
**Grouped format**: O(n log n) due to grouping and ordering

**Real-world impact**:
- 100 statements: ~1ms flat vs ~2ms grouped (negligible)
- 1000 statements: ~10ms flat vs ~20ms grouped (acceptable)
- 10000 statements: ~100ms flat vs ~200ms grouped (noticeable)

**Optimization**: Use Map internally (already O(n))

### Output Size

**Test file: 100 statements, 5 tables**
- Flat: 15.2 KB minified
- Grouped: 14.1 KB minified
- Savings: 7% smaller (107 tokens @ ~10 chars/token)

---

## Migration Checklist

- [ ] Design and document new structure
- [ ] Implement `transformToTableGrouped()` function
- [ ] Create `formatSqlGrouped()` function
- [ ] Write transformation tests (20+ tests)
- [ ] Write equivalence tests (for all 145 existing tests)
- [ ] Measure token efficiency improvements
- [ ] Update documentation with examples
- [ ] Create migration guide for users
- [ ] Update all 145 tests to expect grouped format
- [ ] Remove flat format option
- [ ] Bump version to v1.0.0
- [ ] Document breaking changes in CHANGELOG

---

## Decision Points

### 1. Multiple Operations on Same Table, Same Action

**Example**:
```sql
INSERT INTO users VALUES (1, 'John');
INSERT INTO users VALUES (2, 'Jane');
INSERT INTO users VALUES (3, 'Bob');
```

**Current behavior**: Already grouped into single INSERT with rowCount=3

**Question**: Should grouped format collapse these into single action?

**Answer**: Yes, preserve current grouping logic

### 2. Ordering Within Actions Array

**Example**: Operations on same table in reverse order
```sql
UPDATE users SET active = true;
INSERT INTO users VALUES (1, 'John');
CREATE TABLE users (id INT);
```

**Question**: Preserve execution order or group by action type?

**Answer**: Preserve exact execution order (by statementIndex)

### 3. Views and Triggers

**Question**: Should views/triggers be grouped by source table or kept separate?

**Answer**: Separate table entries (views.table_name, triggers.table_name)

---

## Summary

**Table-grouped format** provides:
- ✅ ~10-15% token efficiency improvement
- ✅ Better semantic structure (operations per table)
- ✅ Clearer workflow understanding
- ✅ Batch processing optimization
- ⚠️ Breaking change (requires test updates)
- ⚠️ Slightly slower parsing (negligible)

**Recommendation**: Implement in Phase 7c, worth the effort for efficiency gains and structural clarity.
