# Next Session Roadmap: Multi-Format File Reader

## Current Status

✅ **Completed:**
- Core infrastructure (types, minifier, cache, fileHandler, outputFormatter)
- Output format refactoring (V1.1: default minify + toJson enabled, opt-out flags)
- JSON format handler
- CSV format handler with intelligent header detection (100% string validation)
- Plaintext fallback format
- 148 passing tests | 87.81% coverage
- Field naming consolidation: `u1, u2, u3` for unknown/extra fields

## Strategic Format Priorities

### Phase 1: Low-Hanging Fruit (Session N+1)
Easy formats with high utility. Minimal parsing logic, strong use cases.

#### YAML (Most Valuable)
- **Why:** Config files, K8s manifests, structured data
- **Difficulty:** Medium (key:value with indentation, lists, nested objects)
- **Edge Cases:**
  - Missing colons in keys (return as plain text)
  - Malformed indentation (graceful degradation)
  - Multiline strings with `|` or `>` (preserve as single field)
  - Anchor/alias references (include as raw)
- **Tests:** ~20 test cases covering all edge cases

#### INI/Properties Files (Simple but Useful)
- **Why:** Application config, .env-style files
- **Difficulty:** Low (simple key=value parsing)
- **Structure:**
  ```ini
  [section]
  key=value
  another_key=another_value
  ```
- **Output:** `{section: {key: "value", another_key: "another_value"}}`
- **Edge Cases:**
  - Missing sections (root level keys)
  - Malformed lines without `=` (collect in `_unparseable`)
  - Comments (`#`, `;`) (strip silently)
  - Empty values (omit from object, like CSV)
  - Duplicate keys (last one wins)
- **Tests:** ~15 test cases

#### TSV (Trivial Extension of CSV)
- **Why:** Tab-separated variant, common in data exports
- **Difficulty:** Minimal (reuse CSV logic with tab delimiter)
- **Note:** CSV already auto-detects tabs, so mostly testing
- **Tests:** ~5 test cases

#### NDJSON (Newline-Delimited JSON)
- **Why:** Streaming JSON logs, large datasets
- **Difficulty:** Low (parse each line, return array)
- **Structure:** Each line is valid JSON
- **Output:** `[{...}, {...}, ...]`
- **Edge Cases:**
  - Invalid JSON on a line (store as `{error: "message", raw: "line"}`)
  - Mixed object/array lines (allow naturally)
  - Empty lines (skip)
- **Tests:** ~10 test cases

### Phase 2: Medium Complexity (Session N+2)
More structured formats requiring sophisticated parsing.

#### Markdown (Hierarchical Content)
- **Why:** Documentation, notes, readme files
- **Difficulty:** High (multiple element types, nesting)
- **Conversion Strategy:**
  - Headers → nested object hierarchy by level
  - Lists → arrays
  - Tables → array of objects (from spec)
  - Code blocks → `{code: {language, content}}`
  - Inline formatting stripped (`*bold*` → `bold`)
- **Edge Cases:**
  - Malformed tables (missing columns → undefined fields)
  - Mixed list types (ordered/unordered)
  - Unclosed code blocks (include remainder)
  - Headers without content (create empty sections)
- **Tests:** ~25 test cases

#### XML (Nested + Attributes)
- **Why:** Legacy data, config files, API responses
- **Difficulty:** High (mixed content, attributes, namespaces)
- **Conversion Strategy:**
  - Elements → objects/arrays
  - Attributes → `_attributes` object
  - Mixed text+elements → `_text` + element keys
  - Namespaces → include in key name (e.g., `ns:key`)
- **Edge Cases:**
  - Malformed XML (attempt partial parse)
  - CDATA sections (treat as string content)
  - Comments (strip or include as `_comments`)
  - Self-closing tags
- **Tests:** ~20 test cases

### Phase 3: Specialized Formats (Session N+3)
Domain-specific formats, fallback parsing for logs.

#### Log Files (Pattern-Based)
- **Why:** Application logs, server logs, diagnostics
- **Difficulty:** Very High (format detection, regex)
- **Strategy:**
  - Detect format: Apache, Nginx, Syslog, ISO timestamps, etc.
  - Parse into `{timestamp, level, message, source, ...}`
  - Fallback: line-by-line array if format unknown
- **Edge Cases:**
  - Multiline log entries (detect continuation)
  - Malformed entries (assign to nearest time/level)
  - Mixed formats in same file (best-effort parsing)
  - Very large logs (stream/sample)
- **Tests:** ~20 test cases

#### SQL Dumps (Tables + Schema)
- **Why:** Database exports, backups
- **Difficulty:** High (complex grammar)
- **Strategy:**
  - Parse INSERT statements → array of objects
  - Parse CREATE TABLE → schema metadata
  - Fallback to line-by-line
- **Tests:** ~15 test cases

## Implementation Strategy

### Consistent Edge Case Handling Pattern

Every format should follow this principle:
```typescript
try {
  // Attempt optimal parsing
  return formatData(content);
} catch (parseErr) {
  // Graceful degradation #1: Try simpler parsing
  try {
    return fallbackParse(content);
  } catch (fallbackErr) {
    // Graceful degradation #2: Return structured error + raw content
    return {
      error: "Parse failed",
      reason: fallbackErr.message,
      raw: content,
      format: "plaintext"
    };
  }
}
```

### Testing Pattern (From CSV Success)

1. **Happy Path:** Standard, well-formatted examples
2. **Missing Fields:** Required fields absent → omit from output
3. **Extra Fields:** More data than expected → `uN` prefix
4. **Malformed Input:** Invalid syntax → graceful degradation
5. **Mixed Data:** Inconsistent content → best-effort parsing
6. **Real-World Examples:** 3-5 actual use cases per format

### Code Organization

```
src/formats/
├── csv.ts          ✅ Complete
├── json.ts         ✅ Complete
├── plaintext.ts    ✅ Complete
├── yaml.ts         → Phase 1
├── ini.ts          → Phase 1
├── ndjson.ts       → Phase 1
├── markdown.ts     → Phase 2
├── xml.ts          → Phase 2
├── logs.ts         → Phase 3
└── sql.ts          → Phase 3

tests/formats/
├── csv.test.ts     ✅ Complete (29 tests)
├── json.test.ts    ✅ Complete (13 tests)
├── yaml.test.ts    → Phase 1
├── ini.test.ts     → Phase 1
├── ndjson.test.ts  → Phase 1
└── ...
```

## Format Auto-Detection Logic

Current: File extension → format

Future enhancement: Content sniffing for ambiguous cases
- If `.txt`: Try YAML, INI, Markdown, Plaintext (in order)
- If `.log`: Try Log pattern detection
- If unknown extension: Content analysis

## Deletion Safety Check

### Roadmap Files Status:

- **READ_MINIFIED_ROADMAP.md** → Covered by implementation, specific to v1.0 phases ✅ **Safe to delete**
- **READ_MINIFIED_ARCHITECTURE.md** → Architecture is stable/complete ✅ **Safe to delete**
- **READ_MINIFIED_SPECIFICATION.md** → Still valid reference for feature spec (keep for now)
- **READ_MINIFIED_TEST_STRATEGY.md** → Testing patterns documented in code comments ✅ **Safe to delete**
- **OUTPUT_FORMAT_REFACTOR.md** → Implemented and tested ✅ **Safe to delete**

**Recommendation:** Keep only `READ_MINIFIED_SPECIFICATION.md` as reference. All others documented in code/commit history.

## Session N+1 Detailed Plan

### Tasks (Priority Order)

1. **YAML Format Handler**
   - `src/formats/yaml.ts` with intelligent key:value parsing
   - Handle nested structures via indentation detection
   - 20+ test cases covering edge cases
   - Update `index.ts` to route `.yaml/.yml` files

2. **INI Format Handler**
   - `src/formats/ini.ts` with section detection `[section]`
   - Root-level keys without section prefix
   - 15+ test cases
   - Handle `#` and `;` comments

3. **Integration & Testing**
   - Update integration tests with YAML + INI examples
   - Run full test suite (target: >85% coverage maintained)
   - Update formatDetector.ts for new extensions

4. **Documentation**
   - Add format examples to README
   - Document edge case handling per format
   - List all supported formats + what they convert to

### Success Criteria
- All new tests passing (40+ combined)
- Coverage ≥85%
- Edge case graceful degradation verified
- At least 2 real-world examples per format tested

## Field Naming Finalized
✅ **Unknown/Extra fields:** `u1, u2, u3...` (semantic clarity)
- All formats will use this convention
- Consistent across CSV, YAML, INI, etc.

## Notes for Next Session

- **Don't re-architect:** Current module structure works well
- **Test-first approach:** Write edge cases, then implementation
- **Graceful degradation:** Always attempt parsing, never crash
- **Data integrity:** `uN` prefix signals schema mismatch; document why
- **Token efficiency:** Minify is default; users opt-out with flags

---

**Last Updated:** 2025-12-07
**Session Completed:** Output format refactoring + CSV implementation
**Next Session Focus:** YAML + INI formats (low-hanging fruit phase)
