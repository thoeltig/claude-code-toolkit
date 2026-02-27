# Changelog

All notable changes to the read-efficient plugin are documented here.

Format: [Common Changelog](https://common-changelog.org/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.1.1.0] - 2026-02-26

### Changed

- Cleanup unused file 

## [1.1.0.0] - 2026-02-26

### Changed

- **Breaking:** SQL parser output changed from custom format to node-sql-parser AST
- Replace custom XML parser with `htmlparser2` in xmlMode for improved malformed XML handling
- Replace custom HTML parser with `htmlparser2` with better tag auto-closing and semantic preservation
- Replace custom SQL statement parser with `node-sql-parser` for full AST support with subqueries, CTEs, window functions
- Replace custom Markdown parser with `markdown-it` for proper support of complex markdown (nested blockquotes, setext headings)

### Added

- Add npm packages: `htmlparser2`, `domhandler`, `node-sql-parser`, `markdown-it` with TypeScript definitions

### Fixed

- Fix namespace attribute preservation in XML (colons no longer converted to underscores)
- Fix Markdown task list parsing with proper checkbox state detection
- Fix Markdown table format to use column headers as object keys
- Fix Markdown anchor_line calculations for front matter sections

## [1.0.0.0] - 2026-02-25

### Changed

- Replace double minification with property-level optimization (minify after parsing, not before)
- Minify string properties within JSON objects with safe whitespace reduction
- Convert safe types in properties (`"true"`/`"false"` → boolean, numeric strings → numbers)
- Omit null and empty string values while preserving empty arrays/objects for structure
- Return indent-based languages (Python, Makefile) raw to avoid semantic breakage

### Added

- Add property minifier utility (`src/utils/propertyMinifier.ts`) with type conversion and filtering

## [0.9.0.0] - 2025-12-11

### Added

- Add format-safe minification warnings for structure-dependent formats without JSON conversion
- Add `--no-anchor-lines` flag to remove navigation metadata from Markdown output
- Add file info node (`originalPath`, `format`, `originalSize`, `minifiedSize`) to CSV/YAML/INI/Markdown/XML/HTML/Log/SQL conversions

### Changed

- Treat NDJSON like JSON (minify directly without redundant format handler)
- Remove NDJSON formatter (`src/formats/ndjson.ts`) - consolidate into JSON handling

## [0.8.0.0] - 2025-12-11

### Added

- Add comprehensive SQL statement parsing: SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, ALTER TABLE, DROP, CREATE INDEX, TRUNCATE, transaction control
- Add support for complex SQL patterns: nested quotes, subqueries, JOINs, CASE statements, window functions, aggregate functions
- Add fallback mechanism for unparseable complex patterns with `unparsedContent` field

### Changed

- Restructure test suite: replace 1000+ shallow tests with 70 focused comprehensive tests across two files (`sql.comprehensive.test.ts`, `sql.edge-cases-spotty.test.ts`)

## [0.7.0.0] - 2025-12-11

### Added

- Add support for ALTER TABLE, GRANT/REVOKE, transaction control (BEGIN, COMMIT, ROLLBACK), CREATE INDEX, DROP, TRUNCATE statements
- Add fallback mechanism for zero information loss on complex patterns
- Add comprehensive edge case testing for unparseable content and real-world SQL patterns

### Changed

- Fix SELECT statement parsing that was incorrectly excluded by specification errors

## [0.6.0.0] - 2025-12-09

### Added

- Add log file format handler with auto-detection: Apache/Nginx Combined, RFC 3164 Syslog, RFC 5424 Syslog
- Add SQL INSERT statement handler with type-aware parsing (numbers, strings, booleans, NULL values)

## [0.5.0.0] - 2025-12-08

### Added

- Add Markdown anchor line extraction for precise source file navigation
- Add `--max-output` flag for dynamic output limit configuration with auto-caching fallback

### Fixed

- Improve feedback when caching fallback is triggered for batch operations exceeding limits

## [0.4.0.0] - 2025-12-08

### Added

- Add HTML format handler with visual tag stripping (b, i, u, em, strong, span, font, br, hr, script, style) and semantic preservation
- Auto-close unclosed HTML tags with browser-compatible rules
- Generate optimized JSON structures for headings, lists, and tables

## [0.3.0.0] - 2025-12-08

### Added

- Add XML format handler with semantic preservation: element tags as field names, attributes with `attribute_` prefix, namespace support, CDATA handling
- Add graceful degradation for malformed XML

## [0.2.0.0] - 2025-12-08

### Added

- Add YAML, INI, NDJSON, Markdown format handlers with structured JSON conversion
- Add auto-detection for .yaml, .yml, .ini, .conf, .cfg, .properties, .ndjson, .jsonl, .md, .markdown file types
- Add 118 comprehensive test cases for all new format handlers

### Changed

- Enable `--minify` and `--to-json` by default (use `--no-minify` or `--no-to-json` to disable)

## [0.1.0.0] - 2025-12-07

_First release: Foundation for token-efficient file reading._

### Added

- Add core minification engine for redundant whitespace removal
- Add JSON format handler with validation
- Add plaintext handler with graceful fallback
- Add smart format detection by file extension
- Add batch processing support with NDJSON output
- Add optional disk caching with conflict resolution
- Add slash command `/read-efficient` integration
- Add command-line flags: `--minify`, `--cache`, `--overwrite`, `--no-output`

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v1.1.0.0...HEAD
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v1.0.0.0...ReadEfficient_v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.9.0.0...ReadEfficient_v1.0.0.0
[0.9.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.8.0.0...ReadEfficient_v0.9.0.0
[0.8.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.7.0.0...ReadEfficient_v0.8.0.0
[0.7.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.6.0.0...ReadEfficient_v0.7.0.0
[0.6.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.5.0.0...ReadEfficient_v0.6.0.0
[0.5.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.4.0.0...ReadEfficient_v0.5.0.0
[0.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.3.0.0...ReadEfficient_v0.4.0.0
[0.3.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.2.0.0...ReadEfficient_v0.3.0.0
[0.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ReadEfficient_v0.1.0.0...ReadEfficient_v0.2.0.0
[0.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/ReadEfficient_v0.1.0.0