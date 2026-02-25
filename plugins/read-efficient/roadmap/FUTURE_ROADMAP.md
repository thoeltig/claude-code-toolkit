# Read-Efficient Plugin: Future Roadmap

**Last Updated**: 2026-02-24
**Current Version**: v0.10.0.0 (Minification Architecture Refactoring Complete)

---

## Next Priorities (v0.11.0.0+)

### Phase 1: SQL Parser Enhancements (High Value, Medium Effort)

**Estimated Effort**: 12-16 hours
**Impact**: Better SQL dump parsing, especially for complex queries

#### 1. CASE Statement Completion
- **Current**: Basic detection only
- **Goal**: Full parsing of simple and searched CASE variants
- **Tasks**:
  - Parse simple CASE: `CASE expr WHEN val THEN result ELSE result END`
  - Parse searched CASE: `CASE WHEN condition THEN result ELSE result END`
  - Extract WHEN/THEN pairs
  - Handle nested CASE statements
  - Add 15-20 comprehensive tests
- **Files to update**: `src/formats/sql.ts`, `tests/formats/sql.*.test.ts`

#### 2. Window Functions Support
- **Current**: Captured in `unparsedContent` (no parsing)
- **Goal**: Parse window function syntax and structure
- **Research needed**: Create `roadmap/WINDOW_FUNCTIONS_SPEC.md`
- **Scope**: ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD, aggregate functions with OVER clause
- **Tasks**:
  - Document window function syntax variants
  - Implement parser for PARTITION BY and ORDER BY clauses
  - Handle frame specifications (ROWS, RANGE)
  - Add comprehensive test coverage
- **Effort**: 8-10 hours

#### 3. CTE (Common Table Expressions) Full Support
- **Current**: Basic `WITH` detection, limited extraction
- **Goal**: Complete CTE parsing with recursion support
- **Research needed**: Create `roadmap/CTE_SPEC.md`
- **Tasks**:
  - Parse WITH clause structure
  - Extract CTE name and query
  - Handle recursive CTEs (`WITH RECURSIVE`)
  - Support multiple CTEs (chaining)
  - Test reconstruction: Can output be re-parsed? (≥95% target)
- **Effort**: 8-10 hours

#### 4. Subquery Validation & Improvement
- **Current**: Detected but not fully resolved
- **Goal**: Comprehensive subquery tracking and reconstruction
- **Tasks**:
  - Test: Can subqueries be fully reconstructed from parsed output?
  - Improve nested subquery handling (3+ levels deep)
  - Add depth tracking and validation
  - Target: ≥95% recovery rate
- **Effort**: 6-8 hours

#### 5. CREATE VIEW Support
- **Current**: Returns empty placeholder
- **Goal**: Parse view definitions similar to CREATE TABLE
- **Tasks**:
  - Extract view name and definition
  - Parse source table references
  - Handle WITH options (CHECK OPTION, etc.)
  - Add tests
- **Effort**: 4-5 hours

---

### Phase 2: New Format Support (Medium Value, Varies Effort)

**Recommendation**: Implement only if user demand exists

#### High Priority (If Requested)
- **TOML** (Config files) - Similar structure to YAML/INI
  - Effort: 6-8 hours + 15-20 tests
  - Format: Key-value with sections, arrays, tables

- **Java Properties Files** - `.properties` extension
  - Effort: 4-6 hours + 10-15 tests
  - Format: Key=value with comments and line continuation

#### Medium Priority (Niche Use Cases)
- **Protocol Buffers** (`.proto`) - Schema definitions
- **GraphQL** - Schema definitions and queries
- **Terraform** (`.tf`) - Infrastructure as code

#### Low Priority (Specialized/Binary)
- **AVRO** - Data format
- **MessagePack** - Binary format
- **Custom formats** - As requested

---

### Phase 3: Code Quality & Performance (Ongoing)

#### Code Coverage
- **Current**: ~80% (estimate based on 559 tests)
- **Goal**: 85%+ consistently
- **Areas to focus**:
  - SQL edge cases
  - Error handling paths
  - Fallback scenarios

#### Performance Optimization
- **Target**: <5ms per file (all formats)
- **Opportunities**:
  - Lazy parsing for large SQL files
  - Streaming support for NDJSON
  - Caching layer improvements

#### Refactoring Opportunities
- **Property minifier**: Consider moving type conversion to separate utility
- **Format handlers**: Consider base class pattern for consistency
- **Error handling**: Standardize across all handlers

---

## Not Planned (Deferred Indefinitely)

### Code to Structured Conversion
- **Status**: Explicitly deferred from v0.10.0.0
- **Reason**:
  - Minimal token savings over minification (10-20%)
  - No comprehension improvement - Claude reads code well
  - Would require AST parsing, significant complexity
  - Resources better spent on other priorities
- **Reconsider if**: Users specifically request it and provide use cases

---

## Session Pickup Guide

### For the Next Developer

1. **Start here**: Read this file and CHANGELOG.md
2. **Architecture**: Review SPECS.md "Architecture Overview" section
3. **Current state**: All tests passing (559 tests), v0.10.0.0 complete
4. **Key files**:
   - `src/utils/propertyMinifier.ts` - Core minification logic (add any enhancements here)
   - `src/formats/*.ts` - Format handlers (one file per format)
   - `src/index.ts` - Orchestration and routing logic
5. **Testing**: Run `npm test` before changes, `npm run test:coverage` to check coverage

### SQL Parser Pickup Notes

If resuming SQL work:
- Current limitations in `SPECS.md` line 896-903
- Test structure: `comprehensive` (happy path) + `edge-cases` (sad path)
- Fallback: `unparsedContent` field preserves original text for non-parsed content
- Pattern: Update handler → Update tests → Verify all 559 tests still pass

### For New Format Addition

1. Create `src/formats/newformat.ts` with handler function
2. Update `src/utils/formatDetector.ts` with extension detection
3. Create `tests/formats/newformat.test.ts` with comprehensive tests
4. Update `src/index.ts` routing logic if needed
5. Update README.md format table
6. Document in SPECS.md

---

## Known Limitations (Current)

| Limitation | Impact | Workaround | Priority |
|-----------|--------|-----------|----------|
| Window functions | Complex queries incomplete | Captured in unparsedContent | Phase 1 |
| CTEs (WITH) | Limited extraction | Basic support works | Phase 1 |
| CASE statements | Simple detection only | Full parsing deferred | Phase 1 |
| CREATE VIEW | Returns empty | Not common in dumps | Phase 1 |
| Subquery depth | Limited to 3+ levels | Works for most cases | Phase 1 |

---

## Release Checklist Template

Use this when releasing new versions:

- [ ] All tests passing (`npm test`)
- [ ] Coverage at 85%+ (`npm run test:coverage`)
- [ ] README.md updated with new features
- [ ] CHANGELOG.md entry created
- [ ] SPECS.md updated with architecture/limitations changes
- [ ] No secrets/API keys in code (security scan)
- [ ] Documentation links verified
- [ ] Git history clean (meaningful commits)
- [ ] Ready for merge to main

---

## Questions for Users / Future Discussion

- **TOML support**: Any demand for TOML config file parsing?
- **Performance**: Any performance issues with current minification?
- **Type conversion**: Should we add an option to disable type conversion?
- **Caching**: Users want caching optimization or current approach fine?
- **Other formats**: Any specific formats requested?

---

**For questions or clarifications, refer to**: SPECS.md, CHANGELOG.md, README.md, or plugin source code
