# claude-code-tools

Token-efficient file reading for Claude Code - minify files to reduce context pollution and operating costs.

## Philosophy: Less is More

Context is precious. Every character you read costs tokens. By minifying files - removing redundant whitespace and formatting noise while preserving information density - we dramatically reduce overhead without sacrificing understanding.

**This is your default file reading tool when cost and efficiency matter.**

## Quick Start

```bash
/read-efficient path/to/file.json
```

## When to Use

**Use `/read-efficient` instead of native Read for:**
- JSON files (typically 30-70% size reduction)
- Large text or code files
- Multiple file reads in a single workflow
- Cost-conscious analysis sessions
- Batch reading operations

**The native Read tool is still fine for:**
- Quick single-value lookups where minification overhead isn't worth it
- Preserving exact original formatting (rare)

## What It Does

The tool automatically:

1. **Detects file format** - JSON, CSV, YAML, INI, NDJSON, Markdown, XML, plaintext, code by file extension
2. **Minifies content** - Removes redundant whitespace and formatting noise
3. **Parses structure** - Converts files to minified JSON:
   - JSON files become structured objects for easier analysis
   - CSV/YAML/INI/XML files convert to structured JSON
   - Markdown converts to block-level JSON (headings, lists, code blocks, tables)
   - NDJSON processes line-by-line JSON
4. **Gracefully falls back** - If parsing fails, returns minified plaintext instead
5. **Caches results** (optional) - Reuse minified versions to avoid re-processing

## How It Works

### Single JSON file
```bash
/read-efficient data.json
# Returns minified parsed JSON
```

### CSV, YAML, or INI file
```bash
/read-efficient config.yaml
# Auto-detects YAML, converts to minified JSON
/read-efficient data.csv
# Auto-detects CSV, converts to array of objects in minified JSON
/read-efficient settings.ini
# Auto-detects INI, converts to JSON with sections
```

### Markdown file
```bash
/read-efficient README.md
# Converts to minified JSON with block structure (headings, lists, code blocks, tables)
```

### Multiple files (mixed formats)
```bash
/read-efficient config.yaml data.csv README.md script.py
# Returns newline-delimited JSON (one result per file, auto-detected format)
```

### With caching (reuse minified version)
```bash
/read-efficient huge-dataset.csv --cache
# Creates cached version for future reads
```

### Disable minification (preserve whitespace)
```bash
/read-efficient document.md --no-minify
# Keeps original spacing while converting format
```

## Output

- **JSON files**: Minified parsed JSON object (easy to analyze)
- **CSV files**: Minified JSON array of objects with intelligent delimiter detection
- **YAML files**: Minified JSON with nested structure preserved
- **INI files**: Minified JSON with sections as nested objects
- **NDJSON files**: Minified JSON array of parsed objects
- **Markdown files**: Minified JSON with block elements (headings, lists, code blocks, tables)
- **Code/text**: Minified plaintext (whitespace removed, content intact)
- **Multiple files**: One line per file (NDJSON format), auto-detected format per file
- **Parsing fails**: Gracefully degrades to minified plaintext (never errors)

## Token Impact

By minifying and converting to structured JSON:
- ✓ **30-70% reduction** in file size on average through minification alone
- ✓ **Additional 20-40% reduction** by converting structured formats (CSV, YAML, etc.) to compact JSON
- ✓ **Information density preserved** - no content lost, just optimized structure
- ✓ **Parser-friendly output** - structured JSON easier to understand than raw text
- ✓ **Lower per-operation cost** for batch processing
- ✓ **More context available** for actual reasoning with same token budget

## Technical Details

For package documentation, CLI usage, and programmatic API, see:
`plugins/claude-code-tools/read-minified/README.md`

The tool is a standalone TypeScript/Node.js package with:
- Zero external dependencies
- 8 file format handlers (JSON, CSV, YAML, INI, NDJSON, Markdown, XML, plaintext)
- Batch processing support for multiple mixed-format files
- Smart format detection with graceful fallback to plaintext
- Optional disk caching
- 326 passing tests (60 XML tests), 88.98% statement coverage, 96.84% function coverage
- Processes 10+ files per second

## Completed in v0.2.0.0

- ✅ CSV parsing and minification (with delimiter detection)
- ✅ YAML support (with nesting and lists)
- ✅ INI/properties files (with sections)
- ✅ NDJSON streaming JSON parsing
- ✅ Markdown structured parsing (block-level elements)
- ✅ 266 passing tests with 88%+ coverage

## Completed in v0.3.0.0

- ✅ **XML to JSON** - Parse XML with flattened attributes (`attribute_` prefix), namespaces, CDATA
- ✅ Full semantic preservation with 60-70% token efficiency vs nested format
- ✅ 60 comprehensive XML test cases
- ✅ 326 total tests with 88.98% statement coverage, 96.84% function coverage

## Planned for Phase 3.2+ (v0.3.1.0+)

- **HTML parsing** - Text extraction and semantic structure with visual tag stripping
- **Log file parsing** - Pattern-based parsing for common log formats
- **SQL parsing** - SQL dumps and INSERT statements

See `read-minified/roadmap/` for detailed Phase 3+ planning.

All formats benefit from automatic minification and graceful fallback behavior.

## Installation

The plugin is installed as part of Claude Code. Use the `/read-efficient` command directly.

## License

MIT
