# Changelog

All notable changes to read-minified are documented here.

Format: [Common Changelog](https://common-changelog.org/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Planned: Phase 6+ (CREATE TABLE, SELECT, etc.)

- **SQL CREATE TABLE** - Schema extraction and structure analysis
- **SQL SELECT results** - Query output parsing and formatting
- **UPDATE/DELETE statements** - Modification tracking
- **Type Storage Review** - Test all parsers with real-world inputs to evaluate type handling improvements

## [0.6.0.0] - 2025-12-09

Log file and SQL INSERT statement parsing with structured JSON output.

### Added

- **Log file format handler** - Pattern-based parsing for common log formats:
  - **Apache/Nginx Combined Format** - Space-delimited with quoted fields, user agents, referrers
  - **RFC 3164 Syslog** - Traditional syslog format (priority, timestamp, hostname, tag, message)
  - **RFC 5424 Syslog** - Modern cloud syslog with structured data and ISO timestamps
  - Auto-detection from first line pattern (no config needed)
  - Structured JSON output with semantic meaning preserved
  - Graceful fallback to minified plaintext on parse error
- Auto-detection for `.log` file extension

- **SQL INSERT statement handler** - Parse SQL dumps and INSERT statements:
  - Extract table name, columns, action type (INSERT), and row data
  - Type-aware parsing: numbers, strings, booleans, NULL values
  - Schema context preserved in output (columns array, row count)
  - Handle multiple INSERT statements in single file
  - Case-insensitive, multiline, and quoted field support
  - Edge cases: escaped quotes, mixed quote types, special characters
- Auto-detection for `.sql` file extension

### Test Coverage

- **Log format handler**: 25 comprehensive tests covering all log types and edge cases
- **SQL handler**: 31 comprehensive tests covering INSERT variations and data types
- **Total tests**: 434 passing (was 378, added 56 tests)
- **Statement coverage**: 89%+
- **Function coverage**: 96.84%+

### Architecture

- Modular format handler pattern consistent with existing handlers
- Graceful degradation for malformed input
- String-first philosophy for logs (all values as strings)
- Type-aware parsing for SQL (numbers, booleans, NULL distinct)
- Auto-detection integrated into formatDetector.ts

[unreleased]: https://github.com/anthropics/claude-code/compare/v0.6.0.0...HEAD
[0.6.0.0]: https://github.com/anthropics/claude-code/compare/v0.5.0.0...v0.6.0.0

## [0.5.0.0] - 2025-12-08

Markdown anchor line extraction for precise navigation and intelligent output limits handling with auto-caching fallback.

### Added

- **Markdown anchor line extraction** - Improved original file navigation:
  - Extract `anchor_line` for key markdown elements to support precise navigation
  - Enables finding exact line numbers in source files from parsed output
- **Output limits handling with auto-caching** - Intelligent output management:
  - Added `--max-output` flag to script for dynamic output limit configuration
  - Automatic fallback to caching when accumulated output exceeds configured limit
  - No mixed output: either all minified or all cached based on size

### Fixed

- **Cached output scenarios** - Improved feedback when caching fallback is triggered:
  - Automatically informs Claude why caching summary is returned instead of full content
  - Better UX for batch operations exceeding size limits
- **Output truncation handling** - Detects and gracefully handles truncation when limits exceeded

## [0.4.0.0] - 2025-12-08

HTML format handler with optimized semantic structures and consistent string representation.

### Added

- **HTML format handler** - Parse HTML with visual tag stripping and semantic structure preservation:
  - Strip presentation tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<span>` (without semantic attributes), `<font>`, `<br>`, `<hr>`, `<script>`, `<style>`
  - Preserve informational tags: `<code>`, `<pre>`, `<kbd>` and anything with semantic attributes (`class`, `id`, `data-*`)
  - Auto-close unclosed HTML tags (browser-compatible: `<p>`, `<li>`, `<tr>`, `<td>`, `<th>`, etc.)
  - Generate optimized JSON structures from semantic tags:
    - **Headings**: Semantic encoding in tag names (`h1` vs `h2`); no redundant level markers
    - **Lists**: Compact format `{ordered: boolean, list: [...]}` vs nested `li` objects
    - **Tables**: Optimized format `{headers: [...], rows: [[]]}` vs complex cell structures
  - String-first representation: All HTML values as strings (HTML is text-based markup)
  - Graceful degradation for malformed HTML and complex nested structures

### Test Coverage

- **Total tests**: 378 passing (was 326, added 61 HTML tests)
- **HTML test suites**: 2 suites (Phase 3.2a + Phase 3.2b)
  - HTML Format Handler - Phase 3.2a: 40 tests
  - HTML Format Handler - Phase 3.2b Semantic Structures: 21 tests
- **Coverage**: Comprehensive testing of visual tag stripping, auto-closing, semantic structures, malformed HTML graceful degradation
- **Real-world patterns**: Blog posts, documentation, data tables, complex nested structures

### Architecture Notes

- Wrapper around XML parser (parseXml) for reuse without modification
- HTML preprocessing pipeline: auto-close tags → strip visual markup → parse as XML → apply semantic enhancements → JSON output

[unreleased]: https://github.com/anthropics/claude-code/compare/v0.5.0.0...HEAD
[0.5.0.0]: https://github.com/anthropics/claude-code/compare/v0.4.0.0...v0.5.0.0
[0.4.0.0]: https://github.com/anthropics/claude-code/compare/v0.3.0.0...v0.4.0.0

## [0.3.0.0] - 2025-12-08

XML format handler with full semantic preservation.

### Added

- **XML format handler** - Parse XML to JSON with full semantic preservation:
  - Element tags preserved as JSON field names
  - Attributes stored with `attribute_` prefix
  - Text-only elements preserved as is values
  - Namespace support: `ns:tagName` format preserved
  - CDATA sections: Content merged with text nodes
  - Comments and processing instructions: Properly skipped
  - Self-closing tags: Full support
  - Graceful degradation: Malformed XML returns error object with context
- Auto-detection for .xml file extension
- Format routing in index.ts with full `--to-json` support
- 60 comprehensive test cases covering:
  - Basic parsing: elements, attributes, nesting (8 tests)
  - Attributes: single, multiple, quoted, special characters, empty values (6 tests)
  - Text-only elements: text + elements, whitespace handling (3 tests)
  - Namespaces: prefixes, multiple namespaces, default declarations (4 tests)
  - CDATA sections: content preservation, special characters, newlines (3 tests)
  - Comments and processing instructions: single, multiple, special chars (4 tests)
  - Edge cases: deep nesting (50+ levels), large sibling count (100+), element naming (7 tests)
  - Malformed XML graceful degradation: missing tags, unclosed elements, incomplete declarations (8 tests)
  - Real-world examples: Maven POM, SOAP responses, RSS feeds, SVG, HTML-like XML (6 tests)
  - Output formatting: minified vs pretty JSON (4 tests)
  - Integration scenarios: complex nested structures with mixed attributes/content (3 tests)

### Test Coverage

- **Total tests**: 326 passing (was 266, added 60 XML tests)
- **Statement coverage**: 88.98%
- **Branch coverage**: 80.74% (XML handler: 83.07%)
- **Function coverage**: 96.84% (XML handler: 100%)
- **Line coverage**: 89.58%
- **Test suites**: 15 suites
- **Performance**: Full suite runs in ~5 seconds

[0.3.0.0]: https://github.com/anthropics/claude-code/releases/tag/v0.3.0.0

## [0.2.0.0] - 2025-12-08

Multi-format file reading with block-level structure support.

### Added

- **YAML format handler** - Parse YAML to JSON with indentation-based nesting, list support, and comment handling
- **INI format handler** - Parse INI/properties files with section-based configuration to JSON
- **NDJSON format handler** - Parse newline-delimited JSON for streaming logs and datasets
- **Markdown format handler** - Parse markdown to structured JSON with block-level elements:
  - Headings (all 6 levels with level tracking)
  - Paragraphs, lists (ordered/unordered), code blocks with language detection
  - Blockquotes, tables (headers + row objects), horizontal rules
  - Task lists with checked state, YAML front matter preservation
  - Inline formatting stripping (bold, italic, strikethrough noise removal)
  - Preserved markdown elements (links, inline code)
- Auto-detection for new file types (.yaml/.yml, .ini/.conf/.cfg/.properties, .ndjson/.jsonl, .md/.markdown)
- Format routing in index.ts with `--to-json` flag support for all new formats
- 118 new test cases covering all format handlers (45 markdown, 20 yaml, 15 ini, 10 ndjson tests)
- Comprehensive test coverage for edge cases: malformed input, missing fields, special characters, mixed data types

### Changed

- **Default behavior**: `--minify` and `--to-json` now enabled by default (use `--no-minify` or `--no-to-json` to disable)
- Improved error handling with graceful degradation for all format parsers
- Architecture: Separated format handlers into individual modules for modularity and testability

### Test Coverage

- **Total tests**: 266 passing (was 148, added 118 new)
- **Statement coverage**: 88.53%
- **Function coverage**: 96.47%
- **Line coverage**: 88.94%
- **Test suites**: 14 suites covering:
  - formats/csv.test.ts (29 tests)
  - formats/yaml.test.ts (20 tests)
  - formats/ini.test.ts (15 tests)
  - formats/ndjson.test.ts (10 tests)
  - formats/markdown.test.ts (45 tests)
  - formats/json.test.ts (13 tests)
  - formats/plaintext.test.ts (7 tests)
  - Utilities and integration tests

[0.2.0.0]: https://github.com/anthropics/claude-code/releases/tag/v0.2.0.0

## [0.1.0.0] - 2025-12-07

_First release: Foundation for token-efficient file reading._

### Added

- Core minification engine removing redundant whitespace while preserving information density
- **JSON format handler** - Parse and minify JSON with full validation
- **Plain text handler** - Minification with graceful fallback for unsupported formats
- Smart format detection by file extension (JSON, plaintext, code)
- Batch processing support for multiple files with NDJSON output
- Optional disk caching with conflict resolution and manifest generation
- Slash command `/read-efficient` integration with Claude Code
- Command-line flags: `--minify`, `--cache`, `--overwrite`, `--no-output`
- Zero external dependencies - pure TypeScript/Node.js implementation
- File I/O operations with caching logic (fileHandler.ts)
- Output formatting with structured response types (ProcessedFile, Manifest)

### Test Coverage

- **Total tests**: 148 passing
- **Test suites**: 8 test suites covering:
  - minifier.test.ts (10 tests)
  - formats/json.test.ts (13 tests)
  - formats/plaintext.test.ts (7 tests)
  - utils/fileHandler.test.ts (7 tests)
  - utils/formatDetector.test.ts (8 tests)
  - cache.test.ts (15 tests)
  - index.test.ts (16 tests)
  - integration.test.ts (20 tests)
- **Coverage**: 90%+ code coverage with graceful error handling

### Performance

- Minification reduces file size by 20-70% depending on original formatting
- Processes 10+ files per second
- No artificial limits: handles arbitrarily large files

[0.1.0.0]: https://github.com/anthropics/claude-code/releases/tag/v0.1.0.0
