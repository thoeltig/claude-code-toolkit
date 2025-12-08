# Changelog

All notable changes to the "claude-code-tools" plugin for Claude Code are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Planned: Phase 6+ (SQL Schema, SELECT Results)

- **SQL CREATE TABLE** - Schema extraction from CREATE TABLE statements
- **SQL SELECT results** - Parse query output and result sets
- **UPDATE/DELETE** - Statement parsing for data modification tracking
- **Additional log formats** - Windows Event Log, CloudWatch, JSON log formats

## [0.6.0.0] - 2025-12-09

### Added

- **Log file parsing** - Pattern-based parsing for common log formats:
  - Apache/Nginx Combined Format with all headers and metadata
  - RFC 3164 Syslog (traditional format)
  - RFC 5424 Syslog (modern cloud format with structured data)
  - Auto-detection from file content (no config needed)
  - 25 comprehensive tests, all passing
- **SQL INSERT statement parsing** - Parse SQL dumps and INSERT statements:
  - Extract table name, columns, row data with type awareness
  - Support for multiple statements, quoted fields, NULL values
  - 31 comprehensive tests, all passing

## [0.5.0.0] - 2025-12-08

### Added

- **Markdown anchor line extraction** - Improved original file navigation:
  - Extract `anchor_line` for key markdown elements to support precise navigation
  - Enables finding exact line numbers in source files from parsed output
- **Output limits handling with auto-caching** - Intelligent output management:
  - Added `--max-output` flag to script for dynamic output limit configuration
  - Automatic fallback to caching when accumulated output exceeds configured limit
  - Slash command preconfigured with ~30,000 character limit with fallback logic
  - No mixed output: either all minified or all cached based on size

### Fixed

- **Slash command parameters** - Corrected parameter passing to improve reliability
- **Cached output scenarios** - Improved feedback when caching fallback is triggered:
  - Automatically informs Claude why caching summary is returned instead of full content
  - Better UX for batch operations exceeding size limits
- **Output truncation handling** - Detects and gracefully handles truncation when limits exceeded

### Changed

- **Documentation** - Comprehensive guide for output limits and auto-caching:
  - Added `Output Limits & Auto-Caching` section with configuration details
  - Documented both `BASH_MAX_OUTPUT_LENGTH` and slash command limits
  - Provided configuration examples for `.claude/settings.json`
  - Fallback logic clearly explained with usage instructions

## [0.4.0.0] - 2025-12-08

### Added

- **HTML format handler** - Parse HTML with visual tag stripping and semantic structure preservation:
  - Strip presentation tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<span>` (without semantic attributes), `<font>`, `<br>`, `<hr>`, `<script>`, `<style>`
  - Preserve informational tags: `<code>`, `<pre>`, `<kbd>` and anything with semantic attributes (`class`, `id`, `data-*`)
  - Auto-close unclosed HTML tags (browser-compatible)
  - Generate optimized JSON structures: headings preserve semantic level, lists use compact format, tables use optimized format
  - String-first representation: all HTML values as strings
  - Graceful degradation for malformed HTML and complex nested structures
- Auto-detection for `.html` and `.htm` file extensions
- 61 comprehensive HTML test cases (2 test suites: Phase 3.2a basic + Phase 3.2b semantic structures)
- Test suite now: 378 total tests, 88.98% statement coverage, 96.84% function coverage

## [0.3.0.0] - 2025-12-08

### Added

- **XML format support** - Parse XML to JSON with full semantic preservation:
  - Flattened attribute storage with `attribute_` prefix
  - Element tags preserved as JSON field names
  - Text-only elements as is values
  - Namespace support: `ns:tagName` format preserved
  - CDATA sections properly handled
  - Comments and processing instructions skipped
  - Self-closing tags fully supported
  - Graceful degradation for malformed XML
- Auto-detection for `.xml` file extension
- 60 comprehensive test cases for XML parsing
- Test suite now: 326 total tests, 88.98% statement coverage, 96.84% function coverage

## [0.2.0.0] - 2025-12-08

### Added

- **Multi-format support**: CSV, YAML, INI, NDJSON, and Markdown file parsing
- **CSV handling** - Auto-detects delimiter (comma, semicolon, tab); converts to JSON array of objects
- **YAML support** - Parses YAML with indentation-based nesting, lists, and comment handling
- **INI/properties files** - Parses configuration files with section support
- **NDJSON streaming** - Line-by-line JSON parsing for logs and datasets
- **Markdown parsing** - Converts to structured JSON with block elements:
  - All heading levels (1-6) with level tracking
  - Paragraphs, ordered/unordered lists, task lists with checked state
  - Code blocks with language detection
  - Tables with headers and row objects
  - Blockquotes and horizontal rules
  - YAML front matter preservation
  - Intelligent formatting stripping (removes noise like bold/italic markers)
- **Format routing** - Automatic detection and routing for all 7 file types
- **Test coverage** - 266 passing tests (118 new), 88%+ coverage

### Changed

- **Default behavior** - `--minify` and `--to-json` now enabled by default for all formats
- **Output structure** - All formats now convert to minified JSON for consistent parsing
- **Markdown formatting** - Bold, italic, and strikethrough markers are stripped as noise while preserving links and inline code

## [0.1.0.0] - 2025-12-07

### Added

- Initial release: token-efficient file reading tool
- Smart format detection by file extension (JSON, plaintext, code)
- Minification engine removing redundant whitespace while preserving information density
- JSON parsing and minification with graceful fallback to plaintext on parse errors
- Plain text minification for code and text files
- Batch processing support for multiple files
- Optional disk caching with conflict resolution
- Zero external dependencies - pure TypeScript/Node.js
- 90%+ test coverage (96 test cases across 8 test suites)
- Slash command `/read-optimized` for Claude Code integration
- 20-70% file size reduction through minification on typical files

[Unreleased]: https://github.com/anthropics/claude-code/compare/v0.5.0.0...HEAD
[0.5.0.0]: https://github.com/anthropics/claude-code/compare/v0.4.0.0...v0.5.0.0
[0.4.0.0]: https://github.com/anthropics/claude-code/compare/v0.3.0.0...v0.4.0.0
[0.3.0.0]: https://github.com/anthropics/claude-code/compare/v0.2.0.0...v0.3.0.0
[0.2.0.0]: https://github.com/anthropics/claude-code/compare/v0.1.0.0...v0.2.0.0
[0.1.0.0]: https://github.com/anthropics/claude-code/releases/tag/v0.1.0.0
