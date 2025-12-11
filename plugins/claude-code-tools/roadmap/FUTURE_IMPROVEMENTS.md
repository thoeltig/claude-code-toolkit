# Future Improvements & Feature Roadmap

**Document Purpose**: Track all open tasks, potential features, and future formats not yet implemented.
**Last Updated**: 2025-12-11 (v0.8.0.0)
**Status**: Comprehensive backlog for planning future sessions

---

## 🔴 Open Tasks - Current Session Gaps

### Task 1: Code Coverage to 85% (2-3 hours)
**Status**: Not started
**Priority**: High (blocks v0.8.0.0 quality gate)
**Impact**: Completes quality validation

**What's Needed**:
- sql.ts: 69.99% → 75%+ (edge case handling coverage)
- index.ts: 57.72% → 65%+ (CLI argument branches)
- Overall: 78.68% → 85%+

**Approach**:
- Identify uncovered lines in coverage report
- Write 15-20 strategic tests
- Focus on high-impact, untested code paths
- Run coverage analysis again

**Success Metric**: `npm test -- --coverage` shows ≥85% overall statements

---

### Task 2: CASE Statements Full Implementation (3-4 hours)
**Status**: Partial (detection added, parsing incomplete)
**Priority**: High (feature expectation)
**Impact**: Completes SELECT feature set

**What's Needed**:
- Parse CASE type: `simple` vs `searched`
- Extract WHEN/THEN pairs as array
- Extract ELSE clause
- Handle nested CASE statements (recursion)
- Store in `caseStatements` array in GroupedStatement

**Example to Parse**:
```sql
SELECT
  id,
  CASE status
    WHEN 'active' THEN 1
    WHEN 'inactive' THEN 0
    ELSE -1
  END as status_code,
  CASE
    WHEN age > 18 THEN 'adult'
    WHEN age > 13 THEN 'teen'
    ELSE 'child'
  END as age_group
FROM users;
```

**Parsing Strategy**:
- Find CASE...END blocks in SELECT clause
- Determine simple vs searched by checking first keyword after CASE
- Extract condition/value and WHEN expressions
- Handle ELSE (optional)
- Support nesting by recursive function calls

**Tests Needed**:
- Simple CASE with multiple WHEN (5 tests)
- Searched CASE with conditions (5 tests)
- Nested CASE (3 tests)
- CASE in different SELECT positions (2 tests)
- CASE with functions in THEN (3 tests)
- Edge cases: no ELSE, multiple nested levels (3 tests)

**Files to Update**:
- `src/formats/sql.ts` - Complete/enhance `parseCaseStatements()`
- `tests/formats/sql.comprehensive.test.ts` - Add tests

**Success Metric**: All CASE tests passing, caseStatements field populated correctly

---

### Task 3: Window Functions Research & Planning (2-3 hours)
**Status**: Not started
**Priority**: Medium (needed for v0.9.0.0 planning)
**Impact**: Informs implementation strategy

**What to Investigate**:
1. **Common Window Functions**
   - ROW_NUMBER() - Sequential numbering
   - RANK() - Ranking with gaps
   - DENSE_RANK() - Ranking without gaps
   - LAG() / LEAD() - Offset rows
   - AVG/SUM/COUNT with OVER - Aggregate windows
   - FIRST_VALUE() / LAST_VALUE() - Window bounds

2. **OVER Clause Components**
   - PARTITION BY - Group rows
   - ORDER BY - Sort within partition
   - Frame specification (ROWS/RANGE)
   - Current row vs unbounded rows

3. **Complexity Assessment**
   - How many regex patterns needed?
   - How many edge cases?
   - Reconstruction difficulty

4. **Real-World Examples**
   - Generate 5-10 real SQL examples
   - Categorize by complexity: Easy, Medium, Hard
   - Identify patterns

**Deliverable**: `WINDOW_FUNCTIONS_SPEC.md`
- 5-10 SQL examples
- Parsing strategy (approach, not code)
- Complexity assessment
- Proposed test count: 12-15
- Estimated implementation time: 4-6 hours
- Feasibility rating: Easy/Medium/Hard

---

### Task 4: CTE (Common Table Expression) Research & Planning (2-3 hours)
**Status**: Not started
**Priority**: Medium (needed for v0.9.0.0 planning)
**Impact**: Informs implementation strategy

**What to Investigate**:
1. **CTE Syntax Variations**
   - Single CTE: `WITH cte AS (...) SELECT * FROM cte`
   - Multiple CTEs: `WITH cte1 AS (...), cte2 AS (...) ...`
   - CTE recursion: `WITH RECURSIVE cte AS (...)`
   - Nested CTEs: CTE in subquery within CTE

2. **CTE in Different Statements**
   - CTE with SELECT
   - CTE with INSERT
   - CTE with UPDATE
   - CTE with DELETE

3. **Current Fallback Effectiveness**
   - Are CTEs currently going to unparsedContent?
   - Can we recover the full CTE from unparsedContent?
   - Is partial parsing (CTE name) valuable?

4. **Complexity Assessment**
   - How much recursion needed?
   - Edge cases (recursive CTEs)
   - Interaction with subqueries

5. **Real-World Examples**
   - Generate 5-10 real SQL examples
   - Categorize by complexity: Easy, Medium, Hard

**Deliverable**: `CTE_SPEC.md`
- 5-10 SQL examples
- Parsing strategy (approach, not code)
- Complexity assessment
- Proposed test count: 8-12
- Estimated implementation time: 5-7 hours
- Feasibility rating: Easy/Medium/Hard
- Recursion assessment

---

### Task 5: Subquery Information Loss Validation (2 hours)
**Status**: Not started
**Priority**: Medium (verify no data loss)
**Impact**: Confirms information preservation guarantee

**What to Validate**:
1. **Subquery Patterns**
   - WHERE IN (SELECT ...)
   - WHERE = (SELECT ...)
   - WHERE EXISTS (SELECT ...)
   - FROM (SELECT ...) AS subquery
   - JOIN ... ON with subquery

2. **Information Recovery Check**
   - Can subquery be reconstructed from WHERE field?
   - Does unparsedContent capture everything?
   - Information recovery rate: Target ≥95%

3. **Test Cases**
   - 10-15 SQL statements with subqueries
   - Measure: Original SQL length vs reconstructed length
   - Track: Character-level differences

**Success Metric**: 95%+ of subquery SQL recoverable from parsed JSON

---

### Task 6: SQL Reconstruction Function (3-4 hours, optional)
**Status**: Deferred
**Priority**: Low (nice-to-have, decision pending)
**Impact**: Enables SQL round-trip validation

**Decision Gate**: Can we reconstruct 80%+ of parsed SQL back to original?

**Implementation Plan**:
```
reconstructSql(parsed: GroupedStatement): string | null
```

**What to Reconstruct**:
- Basic SELECT: SELECT columns FROM table WHERE ...
- INSERT: INSERT INTO table (cols) VALUES (...)
- UPDATE: UPDATE table SET col=val WHERE ...
- DELETE: DELETE FROM table WHERE ...
- JOINs: Apply JOIN conditions
- GROUP BY/HAVING: Add clauses
- ORDER BY: Add sorting (if captured)

**What NOT to Reconstruct** (use unparsedContent):
- UNION/INTERSECT/EXCEPT (too complex)
- CTEs (too complex)
- Subqueries in WHERE (use unparsedContent)
- Window functions (use unparsedContent)

**Testing Strategy**:
- Test with 20 SQL statements from `sql.comprehensive.test.ts`
- Normalize both original and reconstructed: uppercase, minify whitespace
- Compare: Are they semantically equivalent?
- Success metric: 80%+ match

**Decision Logic**:
- **If >85% success**: Keep for v0.9.0.0, ship with feature
- **If 60-85% success**: Make optional, document tradeoffs
- **If <60% success**: Mark as limitation, recommend unparsedContent fallback

---

## 🟡 Potential New File Formats

### High Priority (Most Requested)

#### 1. **Programming Language-Specific Parsing**

**Language: Python** (2-3 weeks research + implementation)
- Parse: Function definitions, classes, imports, type hints
- Extract: Function signatures, docstrings, class hierarchy
- Use Case: Understanding Python codebase structure
- Complexity: Medium
- Benefit: 40-60% size reduction vs raw code

**Example Output**:
```json
{
  "functions": [
    {
      "name": "calculate_total",
      "params": ["price", "tax_rate"],
      "returns": "float",
      "docstring": "Calculate total with tax",
      "decorators": ["@staticmethod"]
    }
  ],
  "classes": [
    {
      "name": "Invoice",
      "methods": ["__init__", "add_item", "calculate_total"],
      "base_classes": ["BaseDocument"]
    }
  ],
  "imports": ["typing", "dataclasses"]
}
```

**Language: JavaScript/TypeScript** (2-3 weeks)
- Parse: Exports, imports, function/class definitions
- Extract: Type signatures, JSDoc comments, async/await markers
- Use Case: Understanding JS/TS library structure
- Complexity: Medium
- Benefit: 50-70% size reduction

**Language: Go** (2-3 weeks)
- Parse: Package structure, func/type/struct definitions
- Extract: Interfaces, error handling patterns
- Use Case: Understanding Go service architecture
- Complexity: Medium-High
- Benefit: 40-60% reduction

**Language: Rust** (3-4 weeks)
- Parse: Impl blocks, traits, macro definitions
- Extract: Public API surface, lifetimes, generics
- Use Case: Understanding Rust library API
- Complexity: Hard (complex syntax)
- Benefit: 50-70% reduction

**Language: Java/C#** (3 weeks each)
- Parse: Class/interface/enum definitions
- Extract: Method signatures, annotations, inheritance
- Complexity: Medium
- Benefit: 50-65% reduction

**Implementation Strategy**:
- Start with Python (most common in AI context)
- Build reusable parser framework (AST-based or regex-based)
- Each language as separate module
- Fallback to minified plaintext if parse fails

---

#### 2. **Docker/Container Formats**

**Docker Compose** (4-6 hours)
- Parse YAML with semantic structure
- Extract: Services, volumes, networks, environment variables
- Minify: Remove comments, consolidate spacing
- Example: 500 lines → 100 lines

```json
{
  "version": "3.8",
  "services": {
    "api": {
      "image": "myapp:latest",
      "ports": ["8080:8080"],
      "environment": {"DEBUG": "true"}
    }
  }
}
```

**Dockerfile** (4-6 hours)
- Parse: FROM, RUN, COPY, CMD, EXPOSE
- Extract: Base image, layers, entry point
- Minify: Consolidate RUN commands, remove unnecessary layers

```json
{
  "base_image": "node:18",
  "layers": [
    {"type": "RUN", "command": "apt-get update"},
    {"type": "COPY", "src": ".", "dest": "/app"}
  ],
  "exposed_ports": [3000],
  "entry_point": ["node", "app.js"]
}
```

**Kubernetes YAML** (6-8 hours)
- Parse: Deployments, Services, ConfigMaps
- Extract: Container specs, resource limits, env vars
- Complexity: High (nested structures)

---

#### 3. **Configuration File Formats** (Already have most, but can expand)

**TOML** (4-5 hours)
- Currently: Treated as plaintext
- Enhancement: Parse as structured TOML
- Use: Cargo.toml, pyproject.toml parsing
- Benefit: Extract dependencies, version info

```json
{
  "project": {"name": "myapp", "version": "1.0.0"},
  "dependencies": {"serde": "1.0", "tokio": "1.0"}
}
```

**HCL (HashiCorp Config Language)** (6-8 hours)
- Parse Terraform files
- Extract: Resources, variables, outputs
- Use: Infrastructure as Code analysis

**Properties files (Java)** (2-3 hours)
- Currently: Handled as INI
- Enhancement: Better comment handling, array syntax

---

#### 4. **API/Specification Formats**

**OpenAPI/Swagger** (6-8 hours)
- Parse: Endpoints, request/response schemas
- Extract: API routes, parameters, status codes
- Minify: Remove redundant schema definitions

```json
{
  "paths": {
    "/users": {
      "GET": {"summary": "List users", "responses": [200, 404]},
      "POST": {"summary": "Create user"}
    }
  }
}
```

**GraphQL Schema** (4-6 hours)
- Parse: Types, fields, arguments
- Extract: API surface, relationships
- Use: Understanding GraphQL APIs

**Protocol Buffers** (4-6 hours)
- Parse: Message definitions, services
- Extract: Field types, nested messages
- Use: Understanding gRPC/protobuf APIs

---

#### 5. **Build & Package Formats**

**Package.json** (3-4 hours enhancement)
- Currently: Handled as JSON
- Enhancement: Semantic parsing of dependencies
- Extract: Version constraints, peer dependencies, scripts

```json
{
  "name": "myapp",
  "version": "1.0.0",
  "dependencies": {
    "react": {"version": "18.0.0", "type": "peer"},
    "express": {"version": "4.18.0"}
  },
  "scripts": {"build": "webpack", "test": "jest"}
}
```

**requirements.txt (Python)** (3-4 hours)
- Parse: Package names, versions, extras
- Extract: Dependency graph, version constraints

**Gemfile (Ruby)** (3-4 hours)
- Parse: Gem dependencies, groups, sources

**pom.xml (Maven)** (4-5 hours)
- Parse: Dependencies, plugins, repositories
- Extract: Build configuration

---

### Medium Priority (Useful but Less Common)

#### 6. **Database Schema Formats**

**Database Dumps** (6-8 hours)
- Parse: CREATE TABLE statements (already do this partially)
- Extract: Schema, constraints, relationships
- Support: MySQL, PostgreSQL, SQLite variations

**Database Connection URLs** (2-3 hours)
- Parse: Connection strings
- Extract: Host, port, database, user
- Minify: Keep structure, remove redundant spaces

---

#### 7. **Data Exchange Formats (Beyond CSV/JSON)**

**Apache Avro** (4-6 hours)
- Parse: Schema definitions
- Extract: Field types, nested records
- Use: Understanding data pipeline schemas

**Apache Parquet Metadata** (4-6 hours)
- Parse: Column metadata
- Extract: Data types, compression, statistics

**MessagePack** (3-4 hours)
- Parse: Binary format to JSON
- Minify: Already binary, but validate structure

---

#### 8. **Documentation Formats** (Beyond Markdown)

**reStructuredText (RST)** (4-5 hours)
- Parse: Sections, directives, code blocks
- Similar to Markdown parsing

**Org-mode** (4-5 hours)
- Parse: Outline structure, properties
- Use: Obsidian/Org users

**AsciiDoc** (4-5 hours)
- Parse: Sections, blocks, includes
- Similar to Markdown/RST

**Jupyter Notebooks (.ipynb)** (6-8 hours, complex)
- Parse: Code cells, markdown cells, outputs
- Extract: Code snippets, documentation
- Complexity: High (nested JSON + binary outputs)

**Sphinx/Doxygen Config** (3-4 hours)
- Parse: Documentation build config
- Extract: Source directories, output formats, extensions

---

#### 9. **Infrastructure & Monitoring**

**Prometheus Configuration** (3-4 hours)
- Parse: Scrape configs, relabel rules
- Extract: Targets, metrics, alert rules

**Nginx/Apache Configuration** (4-6 hours)
- Parse: Blocks, directives, upstream servers
- Extract: Routes, SSL config, performance tuning

**Systemd Unit Files** (3-4 hours)
- Parse: Sections, directives
- Extract: Service dependencies, environment

---

### Low Priority (Niche, Lower Impact)

#### 10. **Specialized Formats**

**Makefile** (3-4 hours)
- Parse: Targets, rules, variables
- Extract: Build steps, dependencies

**CMakeLists.txt** (3-4 hours)
- Parse: Project definition, targets, dependencies

**Gradle/SBT** (4-5 hours each)
- Parse: Build definitions
- Extract: Plugins, dependencies, tasks

**Git Config (.gitconfig)** (2-3 hours)
- Parse: Sections, key-value pairs
- Already similar to INI

**Terraform State** (4-6 hours)
- Parse: Resource definitions
- Extract: Infrastructure state, dependencies

**CloudFormation/ARM Templates** (6-8 hours)
- Parse: Resources, parameters
- Extract: Infrastructure definitions

---

## 📊 File Format Implementation Roadmap

### v0.8.0.0 (Current) ✅
- JSON, CSV, YAML, INI, NDJSON
- Markdown, XML, HTML
- Plain Text
- Log Files (Apache, Nginx, Syslog)
- **SQL** (Comprehensive)

### v0.9.0.0 (Next - Suggested)
- **Python Parser** (High ROI - common in AI)
- **Dockerfile/Docker Compose** (High practical value)
- **TOML** (Cargo.toml, pyproject.toml)

### v1.0.0.0 (Follow-up)
- JavaScript/TypeScript Parser
- OpenAPI/Swagger
- Package.json enhancements
- YAML enhancements (Kubernetes)

### v1.1.0.0+
- Go, Rust, Java parsers
- HCL (Terraform)
- GraphQL schema
- Jupyter notebooks
- Additional infrastructure configs

---

## 🛠️ Technical Considerations for Language Parsers

### Parser Implementation Approaches

**Option 1: Regex-Based (Simple)**
- ✅ Fast, low dependencies
- ✅ Good for structured formats
- ❌ Hard to handle complex nesting
- ❌ Error-prone for real-world code
- **Best for**: Configuration files, Docker, Terraform

**Option 2: AST-Based (Robust)**
- ✅ Handles complex syntax
- ✅ Extracts semantic information
- ✅ More reliable
- ❌ Slower, requires parser library
- ❌ Larger bundle size
- **Best for**: Programming languages (Python, JS, Rust)
- **Libraries**: Babel (JS), Tree-sitter (multi-language), AST parsers per language

**Option 3: Hybrid (Balanced)**
- Use simple regex for common patterns
- Fall back to full parsing for complex cases
- Graceful degradation
- **Best for**: Most formats

### Recommendation

Start with **Regex-Based** for:
- Configuration formats (Docker, TOML, HCL)
- Structured formats (OpenAPI, GraphQL)

Use **AST-Based** for:
- Python (use built-in `ast` module or `tree-sitter-python`)
- JavaScript (use Babel or `tree-sitter-javascript`)
- Other languages (use `tree-sitter` for multi-language support)

---

## 📈 Implementation Complexity Matrix

```
Complexity vs Time to Implement

Hard        │ Jupyter  Rust Java  Go   Kubernetes
            │ Notebooks         Complex SQL
Medium-Hard │ Python TypeScript  GraphQL  gRPC
            │ Docker/K8s        Terraform
Medium      │ TOML  Dockerfile  OpenAPI
            │ Nginx Apache  Prometheus
Easy        │ TOML Makefile  Git Config
            │ env files
```

---

## 💡 Strategic Recommendations

### Phase 1: Quick Wins (v0.9.0.0)
1. **Python Parser** (2-3 weeks, high value)
   - Common in AI/ML context
   - Medium complexity
   - Clear ROI

2. **Docker Support** (1-2 weeks, high practical value)
   - Dockerfile + Docker Compose
   - Straightforward regex-based
   - High real-world usage

3. **TOML Support** (4-6 hours, quick add)
   - Already have YAML parser
   - Minimal incremental effort

### Phase 2: Ecosystem (v1.0.0.0+)
1. **JavaScript/TypeScript** (2-3 weeks)
   - High demand in web context
   - Babel integration option

2. **OpenAPI/GraphQL** (1-2 weeks each)
   - API documentation focus
   - Clear use case

3. **Infrastructure** (Terraform, Kubernetes)
   - Growing importance
   - IaC trend

### Phase 3: Language-Complete (v1.1.0+)
1. Go, Rust, Java parsers
2. Complete DevOps toolchain
3. Specialized formats (Jupyter, Protocol Buffers)

---

## 🎯 Decision Framework: Should We Add This Format?

Ask these questions:

1. **Demand**: How many people use this format?
   - High (100k+ users) = High priority
   - Medium (10k-100k) = Medium priority
   - Low (<10k) = Low priority

2. **Value**: How much token savings?
   - >60% reduction = High value
   - 40-60% reduction = Medium value
   - <40% reduction = Low value

3. **Complexity**: How hard to implement?
   - <4 hours = Easy (add it)
   - 4-8 hours = Medium (consider it)
   - >8 hours = Hard (plan carefully)

4. **Dependencies**: External libraries needed?
   - None = Preferred
   - 1-2 = Acceptable
   - 3+ = Reconsider

---

## 📝 Open Questions

1. **Language Parsers**: AST-based or Regex-based approach?
2. **Scope Creep**: How many formats before we lose focus?
3. **Dependencies**: Accept 1-2 parser libraries for language support?
4. **User Feedback**: What formats do users actually request?

---

## 🔄 Progress Tracking

| Format | Priority | Status | Est. Hours | Target Version |
|--------|----------|--------|-----------|-----------------|
| Python | High | Not started | 15-20 | v0.9.0 |
| Dockerfile | High | Not started | 6-8 | v0.9.0 |
| TOML | High | Not started | 4-6 | v0.9.0 |
| TypeScript | Medium | Not started | 15-20 | v1.0.0 |
| Terraform | Medium | Not started | 8-12 | v1.0.0 |
| OpenAPI | Medium | Not started | 8-10 | v1.0.0 |
| Go | Low | Not started | 15-20 | v1.1.0+ |
| Rust | Low | Not started | 20-25 | v1.1.0+ |
| Java | Low | Not started | 15-20 | v1.1.0+ |

---

**Document Status**: Living roadmap - update as priorities change
**Last Review**: 2025-12-11
**Next Review**: Start of v0.9.0.0 planning
