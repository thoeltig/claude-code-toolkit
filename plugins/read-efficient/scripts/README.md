# convert-to-compact-json

Optimize file reading for token efficiency. Convert files to minified format (JSON or plain text), removing formatting noise while preserving information density.

## Overview

`convert-to-compact-json"` is a TypeScript/Node.js tool designed to reduce token overhead when reading files into Claude Code. It removes redundant whitespace and formatting while preserving semantic structure. The tool automatically detects file formats and applies appropriate minification.

**Key Philosophy:** Information density over human readability.

## Features

- **Multi-Format Support:** JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, Log Files, SQL, Plain Text
- **Smart Format Detection:** Auto-detects file type by extension
- **Minification:** Remove redundant whitespace and formatting from any text file
- **Structured Parsing:** Convert formats to minified JSON with semantic structure:
  - Markdown: block-level elements (headings, paragraphs, lists, code blocks, tables) with anchor_line for efficient navigation
  - YAML: indentation-based nesting with list support
  - INI: section-based configuration
  - CSV/NDJSON: row/record structures as JSON objects
  - XML: full semantic preservation with element tags, flattened attributes (`attribute_` prefix), namespaces, CDATA
  - HTML: visual tag stripping with semantic structure preservation (headings, lists, tables)
  - Log files: Auto-detection of Apache, Nginx, RFC 3164, RFC 5424 formats with semantic field parsing
  - SQL: Comprehensive SQL statement parsing (INSERT/SELECT/UPDATE/DELETE/CREATE) with JOINs, aliases, aggregates, subqueries, and zero information loss
- **Graceful Degradation:** Parse errors fall back to minified plaintext automatically
- **Caching:** Optionally cache optimized files for reuse
- **Batch Processing:** Handle multiple files in one command
- **No Dependencies:** Pure TypeScript/Node.js, no external packages

## Installation

Or use directly:

```bash
node dist/index.js <path> [options]
```

## Usage

### Command Syntax

```bash
/read-efficient <path1> [path2 path3 ...] [flags]
```

### Flags

- `--minify` (default: true) - Remove redundant whitespace
- `--to-json` - Convert to minified JSON format (JSON files only)
- `--cache` - Save optimized file to disk
- `--overwrite` - Replace existing cache files
- `--no-output` - Return manifest instead of file content
- `--max-output=<number of characters>` - Auto-switch to caching if output exceeds limit

## Output Limits & Auto-Caching Behavior

When `--max-output=<number of characters>` is provided:

- **Threshold Check**: As files are processed, accumulated output size is tracked
- **Auto-Switch**: If total output would exceed the limit, `--cache` flag is automatically activated
- **Graceful Fallback**: Once triggered, all files (including those already processed) are cached
- **Mixed Output**: Cached results are returned with file references instead of inline content

## Format Detection & Fallback

The tool automatically detects file format based on file extension and applies appropriate parsing:

| Extension | Type | JSON Conversion | Behavior |
|-----------|------|-----------------|----------|
| `.json` | JSON | ✓ Native | Parse and minify; fallback to plaintext on error |
| `.csv`, `.tsv` | CSV | ✓ Array of objects | Parse with intelligent delimiter detection; fallback to plaintext |
| `.yaml`, `.yml` | YAML | ✓ Parsed structure | Parse indentation-based nesting; fallback to plaintext |
| `.ini`, `.conf`, `.cfg`, `.properties` | INI | ✓ Parsed sections | Parse key=value with section support; fallback to plaintext |
| `.ndjson`, `.jsonl` | NDJSON | ✓ Array of objects | Parse line-by-line JSON; invalid lines create error objects |
| `.md`, `.markdown` | Markdown | ✓ Block structure | Parse to JSON with heading hierarchy, lists, code blocks, tables |
| `.xml` | XML | ✓ Element structure | Parse with attributes, namespaces, CDATA, full semantic preservation |
| `.html`, `.htm` | HTML | ✓ Semantic structure | Strip visual tags, preserve semantic elements; optimized list/table formats |
| `.log` | Log files | ✓ Structured array | Apache/Nginx/RFC3164/RFC5424 formats auto-detected; fallback to plaintext |
| `.sql` | SQL dumps | ✓ Structured objects | Parse INSERT/SELECT/UPDATE/DELETE/CREATE with full statement support |
| `.txt`, `.text` | Plain text | ✗ As-is | Minify whitespace only |
| `.py`, `.js`, `.go`, etc. | Code (unknown) | ✗ As-is | Treat as plaintext; minify whitespace |
| Unknown | Plaintext | ✗ As-is | Minify whitespace only |

**Format-Specific Parsing:**
- **CSV**: Auto-detects delimiter (comma, semicolon, tab); converts to array of objects
- **YAML**: Handles nested structures via indentation; preserves lists and mappings
- **INI**: Supports sections ([section]) and root-level keys; ignores comments
- **NDJSON**: Parses JSON objects line-by-line; invalid lines become error objects
- **Markdown**: Converts to structured JSON with semantic blocks (headings, lists, code, tables, etc.) with anchor_line extraction for precise navigation of original document
- **XML**: Preserves element tags as field names, attributes with `attribute_` prefix, text content as is values, supports namespaces and CDATA
- **HTML**: Strips visual tags (`<b>`, `<i>`, `<font>`, etc.), auto-closes unclosed tags, generates optimized structures for lists (`{ordered, list}`) and tables (`{headers, rows}`)
- **Log files**: Auto-detects format from first line (Apache Combined, Nginx, RFC 3164 Syslog, RFC 5424 Syslog); parses to structured JSON array with semantic fields; fallback to minified plaintext
- **SQL**: Comprehensive SQL statement parsing - INSERT/SELECT/UPDATE/DELETE/CREATE with full support for aliases, JOINs, GROUP BY, HAVING, subqueries, UNION/INTERSECT/EXCEPT; type-aware value parsing; zero information loss via unparsedContent fallback

**Fallback Logic:**
- Parse error → gracefully degrade to minified plaintext
- Ensures broken files produce useful output instead of errors
- No file read will fail - always returns structured response with minified content

### Examples

**Single JSON file, minified output:**
```bash
/read-efficient document.json --minify
# Output: {"content":{...parsed json...},"cached":false}
```

**Plain text file:**
```bash
/read-efficient notes.txt --minify
# Output: {"content":"minified text content...","cached":false}
```

**Unknown file type (auto-detected as plaintext):**
```bash
/read-efficient script.py --minify
# Output: {"content":"minified python code...","cached":false}
```

**Broken JSON (fallback to plaintext):**
```bash
/read-efficient incomplete.json --minify
# Output: {"content":"{incomplete json...","cached":false}
# Note: No error; graceful degradation to minified string
```

**Batch process with mixed file types and caching:**
```bash
/read-efficient data.json notes.txt code.py --minify --cache
# Creates: data.compact.json, notes.compact.txt, code.compact.py
# Returns: NDJSON output for each file
```

**Large batch, cache only (no token bloat):**
```bash
/read-efficient large1.json large2.txt large3.py --minify --cache --no-output
# Returns: Manifest of cached file paths (minimal output)
# Writes: All files to disk
```

**Reprocess with overwrite:**
```bash
/read-efficient document.json --minify --cache --overwrite
# Overwrites existing document.compact.json
```

## Output Formats

### Single File - JSON Format
```json
{"file":"document.json","content":{"key":"value"},"cached":false}
```

### Single File - Plain Text Format
```json
{"file":"notes.txt","content":"minified text content...","cached":false}
```

### Multiple Files (NDJSON)
```json
{"file":"file1.json","content":{"parsed":"json"},"cached":true,"cachedPath":"/path/file1.compact.json"}
{"file":"file2.txt","content":"minified text...","cached":true,"cachedPath":"/path/file2.compact.txt"}
```

### No Output Mode (Manifest)
```json
{"processed":[{"file":"file1.json","cached":true,"path":"/path/file1.compact.json"},{"file":"file2.txt","cached":true,"path":"/path/file2.compact.txt"}],"total":2}
```

**Output Field Types:**
- JSON files: `content` is an object (parsed JSON)
- Plain text/unknown formats: `content` is a string (minified text)

## Programmatic Usage

```typescript
import {processFile, processFiles} from 'read-efficient';

// Single file
const result = await processFile('./data.json', {
  minify: true,
  toJson: false,
  cache: true,
  overwrite: false,
  noOutput: false
});

// Multiple files
const results = await processFiles(
  ['file1.json', 'file2.json'],
  {minify: true, cache: true}
);
```

## Performance

- Minification: Reduces file size by 20-70% depending on original formatting
- Speed: Processes 10+ files per second
- No artificial limits: Handles arbitrarily large files

## Test Coverage

- **Overall: 78.68%** statements, **81.93%** lines, **90.69%** functions
- **544 test cases** (543 passing, 1 unrelated failure) across 21 test suites:
  - formats/json.test.ts (13 tests)
  - formats/csv.test.ts (29 tests)
  - formats/yaml.test.ts (20 tests)
  - formats/ini.test.ts (15 tests)
  - formats/ndjson.test.ts (10 tests)
  - formats/markdown.test.ts (45 tests)
  - formats/xml.test.ts (60 tests)
  - formats/html.test.ts (61 tests) - **NEW**
  - formats/plaintext.test.ts (7 tests)
  - minifier.test.ts (10 tests)
  - utils/fileHandler.test.ts (7 tests)
  - utils/formatDetector.test.ts (8 tests)
  - cache.test.ts (15 tests)
  - index.test.ts (16 tests)
  - integration.test.ts (20 tests)
  - Other utilities (19 tests)

Run tests:
```bash
npm test
npm run test:coverage
```

## Development

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Development mode (ts-node)
npm run dev -- file.json
```

## Architecture

**Core Modules:**
- `src/types.ts` - Type definitions (options, processed files, etc.)
- `src/minifier.ts` - Whitespace minification (pure function)
- `src/utils/formatDetector.ts` - Auto-detect file format by extension
- `src/utils/fileHandler.ts` - File I/O operations (read, write, exists)

**Format Handlers:**
- `src/formats/json.ts` - JSON parsing and minification
- `src/formats/csv.ts` - CSV parsing with delimiter detection (comma, semicolon, tab)
- `src/formats/yaml.ts` - YAML parsing with indentation-based nesting
- `src/formats/ini.ts` - INI/properties parsing with section support
- `src/formats/ndjson.ts` - NDJSON line-by-line JSON parsing
- `src/formats/markdown.ts` - Markdown block-level parsing (headings, lists, code, tables, blockquotes) with anchor_line extraction
- `src/formats/xml.ts` - XML parsing with full semantic preservation (elements, attributes, namespaces, CDATA)
- `src/formats/html.ts` - HTML parsing with visual tag stripping, semantic structure preservation, optimized lists/tables
- `src/formats/plaintext.ts` - Plain text minification (fallback)

**Infrastructure:**
- `src/cache.ts` - Caching with conflict resolution and manifest generation
- `src/index.ts` - CLI orchestration, argument parsing, orchestration

**Processing Pipeline:**
```
File Input
  ↓
Read File (fileHandler)
  ↓
Minify (minifier) [if --minify flag]
  ↓
Detect Format (formatDetector)
  ↓
Parse Format (json/plaintext handler)
  ↓
Try JSON Parse → On Error → Fallback to Plaintext
  ↓
Cache Result [if --cache flag]
  ↓
Format Output (JSON/NDJSON/Manifest)
```

## Extensibility

The architecture is designed for easy format extension. Adding a new format is simple:

1. Create `src/formats/newformat.ts` with a handler function
2. Add format detection in `src/utils/formatDetector.ts`
3. Add tests in `tests/formats/newformat.test.ts`
4. Update orchestration logic in `src/index.ts` if needed

Example: To add CSV support, create `src/formats/csv.ts` with:
```typescript
export function formatCsv(content: string): any {
  // Parse CSV → convert to JSON array of objects
  // Return parsed structure
}
```

## Completed Formats

**v0.1.0.0:**
- ✅ **JSON** - Parse and minify JSON
- ✅ **Plain Text** - Minify whitespace (fallback)

**v0.2.0.0:**
- ✅ **CSV** - Parse CSV to JSON array of objects with intelligent delimiter detection
- ✅ **YAML** - Parse YAML to JSON with indentation-based nesting
- ✅ **INI** - Parse INI/properties files with section-based configuration
- ✅ **NDJSON** - Parse newline-delimited JSON for streaming data
- ✅ **Markdown** - Parse markdown to structured JSON (headings, lists, code blocks, tables, blockquotes)

**v0.3.0.0:**
- ✅ **XML** - Parse XML to JSON with full semantic preservation (elements, attributes, namespaces, CDATA)

**v0.4.0.0:**
- ✅ **HTML** - Parse HTML with visual tag stripping and semantic structure preservation
  - Strip presentation tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<span>` (without semantic attributes), `<font>`, `<br>`, `<hr>`, `<script>`, `<style>`
  - Preserve informational tags and semantic structure (`<h1>`-`<h6>`, `<p>`, `<code>`, `<li>`/`<ul>`/`<ol>`, `<table>`, etc.)
  - Auto-close unclosed HTML tags (browser-compatible)
  - Optimized semantic structures: lists `{ordered, list}`, tables `{headers, rows}`

**v0.5.0.0:**
- ✅ **Markdown anchor line extraction** - Precise navigation with `anchor_line` for key elements
- ✅ **Output limits handling** - Intelligent auto-caching when output exceeds configured limit
- ✅ **`--max-output` flag** - Dynamic configuration for output size thresholds
- ✅ 378 total tests with 88.98%+ statement coverage

**v0.6.0.0:**
- ✅ **Log file parsing** - Pattern-based for Apache, Nginx, RFC 3164 Syslog, RFC 5424 Syslog
  - Auto-detection from first line, structured JSON output with semantic fields
  - 25 comprehensive tests, all passing
- ✅ **SQL INSERT parsing** - Parse SQL dumps with table, columns, rows, type awareness
  - Support for multiple statements, quoted fields, NULL values, edge cases
  - 31 comprehensive tests, all passing
- ✅ 434 total tests with 89%+ statement coverage, 96.84%+ function coverage

**v0.7.0.0:**
- ✅ **Extended SQL Statement Parsing** - Support for additional statement types:
  - ALTER TABLE, GRANT/REVOKE, Transaction Control (BEGIN/COMMIT/ROLLBACK)
  - CREATE INDEX, DROP statements, TRUNCATE statements
- ✅ **Improved SELECT Parsing** - Fixed parsing logic for basic SELECT statements with edge cases
- ✅ **Fallback Mechanism** - Zero-information-loss strategy for complex patterns
- ✅ **Edge Case Testing** - Comprehensive tests for unparseable, edge case, and real-world SQL patterns
- ✅ **Benchmark Generation** - Performance analysis script for SQL statement parsing

**v0.8.0.0:**
- ✅ **Comprehensive SQL Statement Parsing** - Full support for SELECT, UPDATE, DELETE, CREATE, ALTER, DROP, Transactions
  - JOIN parsing (INNER, LEFT, RIGHT, FULL OUTER, CROSS) with conditions
  - Column aliases and table aliases
  - GROUP BY, HAVING, UNION/INTERSECT/EXCEPT
  - Complex WHERE clauses with nesting, subqueries, functions
  - CREATE TABLE schema extraction with constraints
  - Zero information loss: unparsedContent fallback for complex patterns
- ✅ **Test Suite Restructuring** - Replaced 976 shallow tests with 70 focused comprehensive tests
  - 26 non-overlapping statement tests (comprehensive.test.ts)
  - 44 real-world edge case tests (edge-cases-spotty.test.ts)
  - Each test validates 15-20+ assertions
  - Improved maintainability and 10x faster test execution
- ✅ 544 total tests with 78.68% statement coverage (70 SQL tests passing)

## Planned Formats (Phase 7+)

**Phase 7+ (v0.9.0.0+ roadmap):**
- **Window Functions** - PARTITION BY, ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD
- **CTEs (Common Table Expressions)** - Full WITH clause parsing
- **Complex Subqueries** - Nested subquery resolution
- **SQL Reconstruction** - Validate reconstruction accuracy improvements
- **Additional log formats** - Windows Event Log, CloudWatch, JSON log formats

**Future Research:**
- **Type Storage Review** - Test all parsers with real-world inputs to evaluate type handling improvements and potential benefits of rich type systems

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## License

See root [LICENSE](../../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)