# Read Efficient Plugin

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

1. **Detects file format** by extension (JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, Log files, SQL, plaintext, code)
2. **Minifies content** - Removes redundant whitespace and formatting noise
3. **Parses structure** - Converts files to minified JSON:
   - JSON files become structured objects for easier analysis
   - CSV/YAML/INI/XML/HTML files convert to structured JSON
   - Markdown converts to block-level JSON (headings, lists, code blocks, tables)
   - Log files auto-detect format and parse to structured arrays
   - SQL parses INSERT/SELECT/UPDATE/DELETE/CREATE with full statement support
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
# Includes anchor_line for each element to support precise navigation
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
- **Markdown files**: Minified JSON with block elements (headings, lists, code blocks, tables) with anchor_line extraction
- **Log files**: Structured JSON array with auto-detected format (Apache/Nginx/RFC 3164/RFC 5424 Syslog)
- **SQL files**: Structured objects with parsed statements (INSERT/SELECT/UPDATE/DELETE/CREATE/ALTER/DROP/TRUNCATE/GRANT/REVOKE/Transaction control)
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

## Output Limits & Auto-Caching

The `/read-efficient` slash command is preconfigured with `--max-output=29900` and fallback logic if output exceeds Claude Code's ~30,000 character slash command limit.

If you need to process larger files:
- **Increase bash output limit** in `.claude/settings.json`:
  ```json
  {
    "env": {
      "BASH_MAX_OUTPUT_LENGTH": "110000"
    }
  }
  ```

For complete configuration details and auto-caching behavior, see [SPECS.md](./SPECS.md#output-limits--auto-caching).

## Supported File Formats

| Extension | Type | Output Format | Behavior |
|-----------|------|---------------|----------|
| `.json` | JSON | ✓ Native | Parse and minify; fallback to plaintext on error |
| `.csv`, `.tsv` | CSV | ✓ Array of objects | Parse with intelligent delimiter detection |
| `.yaml`, `.yml` | YAML | ✓ Parsed structure | Parse indentation-based nesting |
| `.ini`, `.conf`, `.cfg`, `.properties` | INI | ✓ Parsed sections | Parse key=value with section support |
| `.ndjson`, `.jsonl` | NDJSON | ✓ Array of objects | Parse line-by-line JSON |
| `.md`, `.markdown` | Markdown | ✓ Block structure | Parse to JSON with heading hierarchy, lists, code blocks, tables |
| `.xml` | XML | ✓ Element structure | Parse with attributes, namespaces, CDATA |
| `.html`, `.htm` | HTML | ✓ Semantic structure | Strip visual tags, preserve semantic elements |
| `.log` | Log files | ✓ Structured array | Apache/Nginx/RFC 3164/RFC 5424 formats auto-detected |
| `.sql` | SQL dumps | ✓ Structured objects | Parse INSERT/SELECT/UPDATE/DELETE/CREATE with full statement support |
| `.txt`, `.text` | Plain text | ✗ As-is | Minify whitespace only |
| `.py`, `.js`, `.go`, etc. | Code (unknown) | ✗ As-is | Treat as plaintext; minify whitespace |
| Unknown | Plaintext | ✗ As-is | Minify whitespace only |

## Technical Overview

The tool is a standalone TypeScript/Node.js package with:
- **9 file format handlers** (JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, SQL, plaintext)
- **Batch processing** support for multiple mixed-format files
- **Smart format detection** with graceful fallback to plaintext
- **Optional disk caching** with conflict resolution and manifest generation
- **Zero external dependencies** - pure TypeScript/Node.js implementation
- **544 passing tests** with 78.79% statement coverage and 90.69% function coverage
- **Performance**: Processes 10+ files per second, minification reduces file size by 20-70%

### Command Flags

```bash
/read-efficient <path1> [path2 path3 ...] [flags]
```

- `--minify` (default: true) - Remove redundant whitespace
- `--to-json` - Convert to minified JSON format
- `--cache` - Save optimized file to disk
- `--overwrite` - Replace existing cache files
- `--no-output` - Return manifest instead of file content
- `--max-output=<number>` - Auto-switch to caching if output exceeds limit

For detailed technical specifications, architecture, format-specific parsing rules, and extensibility details, see [SPECS.md](./SPECS.md).

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history and release notes.

## Contributing & Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

## License

See root [LICENSE](../../LICENSE) for details.

---

**Author**: [Thore Höltig](https://github.com/thoeltig)
