# read-efficient Roadmap

Long-term planning for format support and architectural improvements.

## Completed Phases

### Phase 1: Foundation (v0.1.0.0)
- ✅ Core minification engine
- ✅ JSON and plaintext parsing
- ✅ File I/O and caching infrastructure

### Phase 2: Multi-Format Support (v0.2.0.0)
- ✅ CSV with delimiter detection
- ✅ YAML with indentation-based nesting
- ✅ INI/properties with sections
- ✅ NDJSON line-by-line parsing
- ✅ Markdown with block-level structures

### Phase 3: Semantic Preservation (v0.3.0.0)
- ✅ Phase 3.1: XML with full semantic preservation
- ✅ Phase 3.2a: HTML basic handler with visual tag stripping (v0.4.0.0)
- ✅ Phase 3.2b: HTML semantic structures - optimized lists and tables (v0.4.0.0)

### Phase 4: Markdown Enhancements & Output Limits (v0.5.0.0)
- ✅ Markdown anchor line extraction for precise navigation
- ✅ Output limits handling with intelligent auto-caching fallback
- ✅ `--max-output` flag for dynamic output size configuration

---

## Phase 5+: Advanced Formats (v0.6.0.0+)

### Phase 5.1: Structured Logs (v0.6.0.0)

**Log File Format Handler**
- Parse common log formats to structured JSON
- Supported formats:
  - Apache Combined Log Format
  - Nginx access logs
  - Syslog (RFC 3164)
  - JSON logs (streaming)

**Implementation Plan:**
1. Design regex patterns for each log format
2. Create `src/formats/logs.ts` handler
3. Test with real-world log samples
4. Add file type detection for `.log` extension

**Challenges:**
- Parsing semi-structured text with variable fields
- Handling malformed/incomplete log entries
- Extracting key-value pairs from unstructured lines

### Phase 5.2: SQL Parsing (v0.6.0.0+)

**SQL Format Handler**
- Parse SQL dumps and INSERT statements to JSON
- Supported structures:
  - INSERT statements (single/multi-row)
  - CREATE TABLE definitions
  - SELECT query results
  - SQL comment preservation

**Implementation Plan:**
1. Create SQL parser `src/formats/sql.ts`
2. Handle common SQL dialects (PostgreSQL, MySQL, SQLite)
3. Convert table definitions to schema JSON
4. Convert data rows to JSON objects

**Challenges:**
- SQL dialect variations
- Complex nested queries
- Character encoding in string literals
- Balance between accuracy and simplicity

---

## Future Research: Type Storage Review

### Objective
Evaluate whether implementing a type system (numbers, booleans, null) would provide sufficient token efficiency and usability benefits to justify added complexity.

### Methodology

**Phase 1: Data Collection**
1. Collect real-world files from each format (HTML, XML, CSV, JSON, etc.)
2. Run existing parsers with current string-first approach
3. Generate baseline metrics:
   - Output size (bytes)
   - Token count (estimated)
   - Parsing performance

**Phase 2: Type System Implementation**
1. Implement optional type detection for each format
2. Add schema detection (infer types from data patterns)
3. Generate type-aware JSON output
4. Measure:
   - Output size reduction
   - Schema overhead
   - Parsing complexity

**Phase 3: Analysis & Decision**

**Metrics to Evaluate:**
- Net token savings = (size reduction) - (schema overhead)
- Usability impact = (type-aware benefits) - (complexity cost)
- Format-specific findings:
  - Which formats benefit most from typing?
  - Where is schema overhead prohibitive?
  - Can selective typing (types for numbers only) be optimal?

**Expected Outcomes:**
- Decision point: Implement full type system, selective types, or stay string-first?
- Recommendations for future formats
- Guidelines for type handling philosophy

### Timeline
- Session N+5 or N+6: Collect data and implement type-aware parsers
- Session N+7: Analysis and decision meeting

### Key Questions
1. For HTML/plain text, are types worth parsing?
2. For CSV/SQL, does schema detection help more than it complicates?
3. Can type detection be optional (e.g., `--infer-types` flag)?
4. What's the token break-even point for schema overhead?

---

## Potential Future Formats

**Beyond Phase 4.2:**
- **Protocol Buffers** (`.proto`) - Structured schema with binary representation
- **GraphQL** - Schema and query parsing
- **HTML Tables** - Extract tables as structured CSV/JSON
- **PDF** - Text extraction and layout preservation
- **Code** - Language-specific parsing (Python, JavaScript, Go, Rust)
- **Email** - MIME header parsing and body extraction
- **Archives** - Metadata extraction from ZIP/TAR/7Z files

---

## Architectural Improvements (Ongoing)

### Performance Optimization
- Profile large file handling (100MB+)
- Optimize XML/HTML parsing for streaming
- Consider parallel processing for batch operations

### Error Handling & Resilience
- Improve malformed input recovery
- Add detailed error context for debugging
- Consider "best effort" parsing modes

### Developer Experience
- Auto-generated TypeScript types from parsed data
- Plugin system for custom format handlers
- Configuration system for parser tuning

---

## Notes

- **String-First Philosophy (v0.4.0.0)**: All formats use strings as base representation for consistency. Type systems will be evaluated empirically in future phases.
- **Token Efficiency Focus**: Every new feature evaluated for net token impact
- **Graceful Degradation**: All formats maintain fallback to minified plaintext on parse errors
- **Zero Dependencies**: Maintain TypeScript/Node.js only, no external packages

