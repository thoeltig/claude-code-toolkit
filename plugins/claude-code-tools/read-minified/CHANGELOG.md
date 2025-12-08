# Changelog

All notable changes to read-minified are documented here.

Format: [Common Changelog](https://common-changelog.org/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Planned: Phase 3.2 (HTML Handler)

- **HTML format handler** - Parse HTML with visual tag stripping and semantic structure preservation
  - Strip presentation tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<span>` (without semantic attributes), `<font>`, `<br>`, `<hr>`, `<script>`, `<style>`
  - Preserve informational tags: `<code>`, `<pre>`, `<kbd>` and anything with semantic attributes (`class`, `id`, `data-*`)
  - Generate JSON structure from semantic tags: `<h1>`-`<h6>`, `<p>`, `<li>`/`<ul>`/`<ol>`, `<blockquote>`, `<section>`, `<article>`, `<table>`
  - Combined structure: HTML semantics + underlying XML tree
  - Expected: 30-40 tests, >85% coverage
  - Discussion: Example scenarios and edge cases (next session)

[unreleased]: https://github.com/anthropics/claude-code/compare/v0.3.0.0...HEAD

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
