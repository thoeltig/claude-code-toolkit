# Phase 6+ Roadmap: Structured Logs & SQL Parsing

## Completed (Phase 5)

### v0.6.0.0 

#### Logs Support ✅
- **Apache Combined Log Format** - Space-delimited with quoted fields
  - Fields: ip, logname, user, timestamp, request, status, bytes, referer, useragent
  - Handles multi-word values in quotes
  - Tests: 6 (basic parsing, user handling, DELETE requests, Nginx parity)

- **RFC 3164 Syslog** - Traditional syslog format
  - Fields: priority, timestamp, hostname, tag, message
  - Format: `<PRI>Month Day Time hostname tag: message`
  - Handles process IDs in tags
  - Tests: 5 (basic parsing, kernel tags, process IDs)

- **RFC 5424 Syslog** - Modern/cloud syslog (newer standard)
  - Fields: priority, version, timestamp, hostname, appName, procId, msgId, structuredData, message
  - Format: `<PRI>1 ISO8601timestamp hostname appname procid msgid [structured-data] message`
  - Parses structured data key=value pairs
  - Tests: 5 (basic parsing, multi-field data, no structured data)

- **Auto-detection** - Detects log type from first line
  - RFC 5424: `<PRI>1 ` prefix
  - RFC 3164: `<PRI>[Month]` format
  - Apache/Nginx: No `<` prefix

- **Test Coverage**: 25 tests total
  - Apache/Nginx: 6 tests
  - RFC 3164: 5 tests
  - RFC 5424: 5 tests
  - Mixed formats: 3 tests
  - Edge cases: 4 tests
  - Output format: 2 tests

#### SQL INSERT Support ✅
- **INSERT Statement Parsing**
  - Extracts: table name, columns, rows, action type
  - Output includes schema context (columns, action, table)

- **Data Type Support**
  - Integers & floats (numeric parsing)
  - Booleans (true/false, case-insensitive)
  - NULL values (omitted from row objects)
  - Strings (with proper quote/escape handling)
  - Quoted strings preserve commas and spaces

- **Edge Cases**
  - Multiple INSERT statements per file
  - Case-insensitive keywords (INSERT, VALUES, NULL)
  - Quoted values with escaped quotes ('' → ')
  - Multiline INSERT statements
  - Optional semicolons

- **Test Coverage**: 31 tests total
  - Basic parsing: 3 tests
  - Data types: 7 tests
  - String handling: 5 tests
  - Column handling: 3 tests
  - Case insensitivity: 4 tests
  - Edge cases: 6 tests
  - Real-world examples: 3 tests

---

## Planned (Phase 6+)

### v0.6.1.0 - SQL CREATE TABLE Support
**Goal**: Extract schema definitions for easier analysis

**Scope**:
- Parse `CREATE TABLE` statements
- Extract: table name, columns, data types, constraints
- Handle: PRIMARY KEY, NOT NULL, DEFAULT, UNIQUE, FOREIGN KEY
- Output: Table schema as structured JSON
  ```json
  {
    "table": "users",
    "action": "CREATE",
    "columns": [
      {"name": "id", "type": "INT", "constraints": ["PRIMARY KEY", "NOT NULL"]},
      {"name": "email", "type": "VARCHAR(255)", "constraints": ["UNIQUE", "NOT NULL"]}
    ]
  }
  ```

**Estimated tests**: 15-20
- Basic CREATE TABLE parsing
- Column types (INT, VARCHAR, TEXT, DECIMAL, DATE, TIMESTAMP, etc.)
- Constraints (PK, FK, NOT NULL, UNIQUE, DEFAULT)
- Table constraints (CHECK, UNIQUE combinations)
- Multiline definitions

---

### v0.6.2.0 - SQL SELECT Results Support
**Goal**: Parse query result sets

**Scope**:
- Parse SELECT query results (as SQL dumps or tabular format)
- Extract: column names, data types (inferred), rows
- Handle: multiple result sets, NULL values
- Output: Rows as JSON array with schema
  ```json
  {
    "action": "SELECT",
    "columns": ["id", "name", "email"],
    "rows": [...],
    "rowCount": 100
  }
  ```

**Estimated tests**: 12-15
- Result set parsing
- Multiline SELECT dumps
- Type inference
- NULL handling
- Large result sets

---

### v0.6.3.0 - SQL UPDATE & DELETE Support
**Goal**: Parse modification statements

**Scope**:
- UPDATE statements: table, SET columns, WHERE conditions
- DELETE statements: table, WHERE conditions
- Output: Action, table, affected rows/conditions
  ```json
  {
    "table": "users",
    "action": "UPDATE",
    "updates": [{"column": "status", "value": "active"}],
    "where": "id > 100"
  }
  ```

**Estimated tests**: 10-12
- Basic UPDATE parsing
- UPDATE with WHERE clause
- UPDATE multiple columns
- DELETE statements
- Complex WHERE conditions

---

### v0.6.4.0 - SQL Dump Files Support
**Goal**: Parse complete SQL dumps (with CREATE + INSERT + potentially SELECT)

**Scope**:
- Auto-detect and parse mixed dump files
- Preserve order: CREATE TABLE → INSERT → SELECT (if present)
- Aggregate related statements by table
- Output: Hierarchical structure
  ```json
  [
    {
      "table": "users",
      "schema": {...},
      "data": [{...}, {...}]
    }
  ]
  ```

**Estimated tests**: 15-20
- Complete dump parsing
- Multiple tables
- Dependencies (FK relationships)
- Mixed statement types
- Comment handling

---

## Not in Scope (Future Research)

### Type System Evaluation (Empirical Analysis)
- Measure token impact of adding explicit type information
- Compare: string-only vs type-aware JSON output
- Determine: when typing is worth the overhead
- Expected: Q1-Q2 after Phase 6 completion

### SQL Dialects
- PostgreSQL-specific features
- MySQL-specific syntax
- SQLite compatibility
- Future: Version-specific handling

### Advanced SQL
- Stored procedures/functions
- Triggers and events
- Views and materialized views
- Window functions in SELECT

---

## Test Data Generated

### Real-World Logs (`real-world-logs/`)
- **apache_combined_200.log** - 200 Apache access log entries
  - Various HTTP methods (GET, POST, PUT, DELETE)
  - Different status codes (2xx, 3xx, 4xx, 5xx)
  - Mixed response sizes
  - Real-looking URLs and user agents

- **nginx_access_200.log** - 200 Nginx access log entries
  - Similar to Apache but with Nginx conventions
  - Various request types and response times

- **syslog_rfc3164_200.log** - 200 traditional syslog entries
  - Various facilities and severities
  - Common tags (kernel, auth, cron, mail, etc.)
  - Mix of warning/error/notice messages

- **syslog_rfc5424_200.log** - 200 modern syslog entries
  - Cloud platform logs (AWS CloudWatch, GCP)
  - Structured data with key-value fields
  - ISO 8601 timestamps with microseconds

### Real-World SQL (`real-world-sql/`)
- **ecommerce_dump.sql** - Complete e-commerce schema + data
  - Tables: users, products, orders, order_items, reviews
  - INSERT statements with realistic data
  - ~1000 rows total across tables
  - Various data types and constraints

- **user_registration.sql** - User registration dump
  - users table with email, phone, verified status
  - timestamps and metadata
  - ~500 user records
  - NULL values for optional fields

- **product_catalog.sql** - Product inventory dump
  - products table with SKU, prices, categories
  - inventory quantities
  - ~100 product records
  - Decimal prices, stock levels

- **order_transactions.sql** - Order history dump
  - orders + order_items relationships
  - timestamps, amounts, statuses
  - ~200 orders with items
  - Various order states (pending, shipped, delivered, cancelled)

---

## Next Session Checklist
- [ ] Load test data files (real-world logs and SQL)
- [ ] Measure token usage on complete datasets
- [ ] Decide: Continue SQL parsing or pivot to type system research?
- [ ] Implement CREATE TABLE parser
- [ ] Implement SELECT result parser
- [ ] Consider: SQL dump aggregation strategy

---

## Architecture Notes
- One file per format (single responsibility)
- Minification + JSON conversion separated
- Auto-detection by file extension
- Graceful degradation on parse errors
- No external dependencies (TypeScript + Node.js only)
- Test coverage minimum: 80%
