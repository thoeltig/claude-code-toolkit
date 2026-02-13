# read-efficient Plugin - Master Roadmap

**Current Version:** v0.8.0.0
**Last Updated:** 2025-12-13
**Status:** Complete overview - single source of truth

---

## Quick Navigation

- [Session 9 Priorities](#session-9-immediate-priorities) - What to do next
- [v0.9.0+ Planning](#version-roadmap) - Medium-term vision
- [Open Tasks](#open-tasks-detailed-breakdown) - All work items
- [Benchmarking Plan](#benchmarking-phase) - Token & efficiency testing
- [New Formats](#new-format-roadmap) - Future support

---

## Session 9 Immediate Priorities

**Estimated effort: 14-21 hours total**
**Recommended starting point: Code coverage**

### Priority 1: Code Coverage to 85% ⭐ (MUST DO)
- **Current:** 78.68% statements
- **Target:** 85%+
- **Effort:** 2-3 hours
- **What's missing:** sql.ts edge cases, index.ts CLI branches
- **Action:** Write 15-20 strategic tests, focus on high-impact untested code
- **Success metric:** `npm test -- --coverage` shows ≥85%
- **Blocker:** None — can start immediately

### Priority 2: CASE Statements Completion (MUST DO)
- **Status:** Partial detection added, full parsing needed
- **Effort:** 3-4 hours
- **What's needed:**
  - Parse CASE type: `simple` vs `searched`
  - Extract WHEN/THEN pairs as array
  - Extract ELSE clause
  - Handle nested CASE statements
  - Add 15-20 tests
- **Files to update:** `src/formats/sql.ts`, `tests/formats/sql.comprehensive.test.ts`
- **Success metric:** All CASE tests passing, `caseStatements` field populated correctly

### Priority 3: Window Functions Research (SHOULD DO)
- **Status:** Not started
- **Effort:** 2-3 hours
- **Deliverable:** `WINDOW_FUNCTIONS_SPEC.md`
- **What to investigate:**
  - Common functions: ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD(), AVG/SUM/COUNT with OVER
  - OVER clause components: PARTITION BY, ORDER BY, frame specification
  - Complexity assessment & real-world examples
  - Proposed test count: 12-15
  - Estimated implementation time if done: 4-6 hours
  - Feasibility: Easy/Medium/Hard
- **Decision:** Include in v0.9 or defer?

### Priority 4: CTE (WITH Clauses) Research (SHOULD DO)
- **Status:** Not started
- **Effort:** 2-3 hours
- **Deliverable:** `CTE_SPEC.md`
- **What to investigate:**
  - CTE syntax: single, multiple, recursive, nested
  - CTE in different statements: SELECT, INSERT, UPDATE, DELETE
  - Current fallback effectiveness (going to unparsedContent?)
  - Complexity assessment & real-world examples
  - Proposed test count: 8-12
  - Estimated implementation time if done: 5-7 hours
  - Feasibility: Easy/Medium/Hard
  - Recursion assessment needed
- **Decision:** Include in v0.9 or defer?

### Priority 5: Subquery Information Loss Validation (SHOULD DO)
- **Status:** Not started
- **Effort:** 2 hours
- **What to validate:**
  - Information recovery: Can subqueries be reconstructed from WHERE field?
  - Recovery rate target: ≥95%
  - Test with 10-15 SQL statements with subqueries
- **Success metric:** 95%+ of subquery SQL recoverable from parsed JSON

### Priority 6: SQL Reconstruction Function (OPTIONAL)
- **Status:** Not started
- **Effort:** 3-4 hours (decision gate)
- **What to test:**
  - Can we reconstruct 80%+ of parsed SQL back to original?
  - If >85% success: keep for v0.9
  - If 60-85% success: make optional, document tradeoffs
  - If <60% success: mark as limitation
- **Implementation scope:** Basic SELECT/INSERT/UPDATE/DELETE, JOINs, GROUP BY/HAVING, ORDER BY
- **Out of scope:** UNION/INTERSECT/EXCEPT, CTEs, complex subqueries, window functions

---

## Version Roadmap

### v0.8.0.0 (Current) ✅
**Status:** Released
- All 10 formats implemented: JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, Logs, SQL
- 544 tests passing, 78.68% coverage
- SQL parser comprehensive coverage
- Cache system, minification, output formatting complete

### v0.9.0.0 (Next - Session 9+)

**Decision: Which path to take?**
Choose ONE of these three strategic directions:

#### Option A: SQL Completion (Enterprise Focus)
- Complete CASE statements (Priority 2)
- Research & implement Window Functions
- Research & implement CTEs
- SQL reconstruction function (if viable)
- **Timeline:** 2-3 weeks
- **Value:** Full SQL query support, enterprise users

#### Option B: Python Parser (AI/ML Focus)
- AST-based Python code parsing
- Extract: functions, classes, imports, type hints, docstrings
- Size reduction: 40-60%
- **Timeline:** 2-3 weeks
- **Value:** High demand in AI/ML/Data Science community

#### Option C: Docker Support (DevOps Focus)
- Dockerfile parsing
- Docker Compose parsing (YAML-based)
- Extract: services, environment, volumes, networks
- **Timeline:** 1-2 weeks
- **Value:** DevOps/Cloud-native community, practical usage

**Recommended:** Start with SQL completion (A) since architecture is already there and Session 9 priorities are defined.

### v1.0.0.0 (Follow-up)
- JavaScript/TypeScript parser
- OpenAPI/Swagger support
- Kubernetes YAML parsing
- Package.json semantic parsing
- Documentation restructure (from DOCUMENTATION_RESTRUCTURE_ROADMAP.md)

### v1.1.0+ (Future)
- Go, Rust, Java parsers
- HCL (Terraform) support
- GraphQL schema parsing
- Jupyter notebooks
- Infrastructure configs (Prometheus, Nginx, Systemd)
- And 20+ additional formats (see [New Format Roadmap](#new-format-roadmap))

---

## Open Tasks Detailed Breakdown

### Code Coverage Gap (Session 9)
**File:** src/formats/sql.ts
**Current:** 69.99% statements
**Target:** 75%+
**Missing:** Edge case handling coverage

**File:** src/index.ts
**Current:** 57.72% statements
**Target:** 65%+
**Missing:** CLI argument branches

### CASE Statements (Session 9)
**Status:** Partial detection added, parsing incomplete

Example to parse:
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

Parsing strategy:
- Find CASE...END blocks in SELECT clause
- Determine simple vs searched by checking first keyword after CASE
- Extract condition/value and WHEN expressions
- Handle ELSE (optional)
- Support nesting by recursive function calls

Tests needed: 21 tests total
- Simple CASE with multiple WHEN (5 tests)
- Searched CASE with conditions (5 tests)
- Nested CASE (3 tests)
- CASE in different SELECT positions (2 tests)
- CASE with functions in THEN (3 tests)
- Edge cases: no ELSE, multiple nested levels (3 tests)

---

## Benchmarking Phase

**Timeline:** Sessions N+3 through N+6 (after SQL completion)
**Reference:** `BENCHMARKS_ROADMAP.md` (comprehensive 10-part plan)

### Phase Overview
1. **Smart shared base models** (550 lines code)
   - 4 base data models: nested hierarchy, tabular simple, tabular access, config sections
   - Convert to 10 format variants instead of building 10 generators
   - 50% less code, zero duplication (DRY principle)

2. **Shared questionnaires** (4 total, 75 questions each)
   - nested-hierarchy: 5 formats (JSON, XML, YAML, HTML, Markdown)
   - tabular-simple: 3 formats (CSV, SQL, NDJSON)
   - tabular-access: 4 formats (Apache, Nginx, RFC 3164, RFC 5424 syslog)
   - config-sections: 3 formats (INI, YAML, Markdown)

3. **Token usage measurement**
   - 3 variants per file: original, minified, minified+JSON
   - Multiple iterations, averaged results
   - Calculate token savings %

4. **Understanding efficiency testing**
   - Same questionnaire, 3 scenarios per format
   - Measure: accuracy, response time, comprehension improvement
   - Classify errors: incomplete, wrong value, reasoning, hallucination

5. **Result aggregation & analysis**
   - Combine all 30 token benchmarks
   - Combine all understanding efficiency tests
   - Validate hypotheses about format-specific patterns
   - Generate comprehensive markdown report

### Success Criteria
- ✅ Test data generated for all 10 formats
- ✅ 75-100 questions per format
- ✅ Token usage benchmarks completed
- ✅ Understanding efficiency tested (3 scenarios × 10 formats)
- ✅ Comprehensive markdown report created
- ✅ Key hypotheses validated or refined
- ✅ Maintenance plan established

### Key Hypotheses to Validate
1. **Token Savings Exist:** Structured formats reduce tokens 25-35% on average
2. **Format Conversion Improves Understanding:** JSON structure helps Claude, +3-5% accuracy
3. **Processing Speed Increases:** Structured JSON reduces comprehension time by 30-45%
4. **Format-Specific Patterns Emerge:** CSV→JSON shows highest gains, JSON→JSON shows minimal
5. **Question Category Performance Differs:** Extraction benefits most, deduction benefits from full optimization

---

## New Format Roadmap

### Supported Formats (v0.8.0.0)
✅ JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, Logs, SQL, Plaintext

### High Priority New Formats (v0.9.0+)

**Programming Languages**
- Python (2-3 weeks) - AST-based, extract: functions, classes, imports, type hints, docstrings
- JavaScript/TypeScript (2-3 weeks) - Babel or tree-sitter, exports, imports, type signatures
- Go (2-3 weeks) - Package structure, func/type/struct definitions
- Rust (3-4 weeks) - Impl blocks, traits, macro definitions
- Java/C# (3 weeks each)

**Container & DevOps**
- Dockerfile (4-6 hours) - Parse: FROM, RUN, COPY, CMD, EXPOSE
- Docker Compose (4-6 hours) - YAML-based, extract: services, volumes, networks, environment
- Kubernetes YAML (6-8 hours) - Deployments, Services, ConfigMaps
- Terraform/HCL (6-8 hours) - Parse infrastructure definitions

**Configuration Formats**
- TOML (4-5 hours) - Cargo.toml, pyproject.toml
- PROPERTIES files (2-3 hours) - Better comment handling, array syntax

**API & Specification**
- OpenAPI/Swagger (6-8 hours) - Endpoints, request/response schemas
- GraphQL Schema (4-6 hours) - Types, fields, arguments
- Protocol Buffers (4-6 hours) - Message definitions, services

**Build & Package**
- Package.json (3-4 hours enhancement) - Semantic parsing of dependencies
- requirements.txt (3-4 hours) - Python dependencies
- pom.xml / Gemfile (3-4 hours each) - Maven/Ruby dependencies

### Medium Priority Formats (30+ total formats detailed in FUTURE_IMPROVEMENTS.md)
- Database dumps, Avro, Parquet, Jupyter notebooks
- reStructuredText, Org-mode, AsciiDoc
- Prometheus config, Nginx/Apache config, Systemd units
- Makefile, CMakeLists.txt, Gradle/SBT
- Git config, Terraform state, CloudFormation templates

### Decision Framework: Should We Add This Format?
1. **Demand:** How many people use it? (100k+ = high, 10k-100k = medium, <10k = low)
2. **Value:** Token savings? (>60% = high, 40-60% = medium, <40% = low)
3. **Complexity:** Implementation time? (<4h = easy, 4-8h = medium, >8h = hard)
4. **Dependencies:** External libraries needed? (none = preferred, 1-2 = acceptable, 3+ = reconsider)

---

## Documentation Structure

### Active Roadmap Documents
- **CONSOLIDATED_ROADMAP.md** (THIS FILE) - Master overview, single source of truth
- **LAST_SQL_CHANGES_SUMMARY.md** - Session 8 completion report, Session 9 context
- **FUTURE_IMPROVEMENTS.md** - Detailed backlog of 30+ formats and features

### Detailed Planning Documents
- **BENCHMARKS_ROADMAP.md** - 10-part comprehensive benchmarking methodology
- **DOCUMENTATION_RESTRUCTURE_ROADMAP.md** - Plan to split SPECS.md (execute after Phase 3)

### Reference Documentation
- **SPECS.md** - Technical specifications (source of truth for current implementation)
- **README_TEST_DATA.md** - Test data files available for benchmarking

### Code Generators
- **generate-test-data.js** - Real-world log and SQL test data (for benchmarking)
- **generate-test-sql.ts** - SQL statement patterns (60+ templates, reusable)

**Delete:** READ_MINIFIED_SPECIFICATION.md (superseded by SPECS.md) ✅ DELETED

---

## Current State Summary

### Codebase
- **Lines of code:** ~2,500 (src/)
- **Test lines:** ~3,000+ (tests/)
- **Test count:** 544 passing
- **Coverage:** 78.68% statements, 81.93% lines, 90.69% functions, 70.53% branches

### Formats Implemented (10)
- Structured: JSON, CSV, YAML, INI, NDJSON
- Markup: Markdown, XML, HTML
- Text: Plaintext
- Specialized: Logs (Apache/Nginx/Syslog), SQL

### Features Complete
✅ Minification with format-safe detection
✅ Format conversion to JSON with file info node
✅ Anchor line tracking for Markdown
✅ Cache system with conflict resolution
✅ Manifest mode for batch operations
✅ Auto-caching when output limit exceeded
✅ Graceful degradation (unparsedContent fallback)

### Known Limitations (Deferred to Future Phases)
- Window Functions (captured in unparsedContent for SQL)
- CTEs/WITH clauses (basic detection, full extraction pending)
- CREATE VIEW (placeholder)
- Complex subquery resolution

---

## Key Decisions Still Needed

**Before starting Session 9:**
1. Accept 78% coverage or push for 85%?
2. Which v0.9 focus: SQL completion (A), Python parser (B), or Docker (C)?
3. Language parser strategy: AST-based, regex-based, or hybrid?

**Before benchmarking phase:**
1. How many formats to benchmark simultaneously?
2. Use Anthropic API for token counting or estimate?
3. Manual or automated answer verification?

---

## How to Use This Roadmap

1. **Starting a session:** Check [Session 9 Immediate Priorities](#session-9-immediate-priorities)
2. **Planning v0.9:** Review [Version Roadmap](#version-roadmap) and make decision on strategic direction
3. **Adding a format:** Check [New Format Roadmap](#new-format-roadmap) and decision framework
4. **Deep dive:** Link to specific detailed documents (BENCHMARKS_ROADMAP.md, FUTURE_IMPROVEMENTS.md)
5. **Reference implementation:** Check SPECS.md for current format specifications

---

**Last Review:** 2025-12-13
**Next Review:** Start of Session 9
**Owner:** Development team
