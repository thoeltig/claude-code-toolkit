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

1. **Detects file format** - JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, plaintext, code by file extension
2. **Minifies content** - Removes redundant whitespace and formatting noise
3. **Parses structure** - Converts files to minified JSON:
   - JSON files become structured objects for easier analysis
   - CSV/YAML/INI/XML/HTML files convert to structured JSON
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
- **Markdown files**: Minified JSON with block elements (headings, lists, code blocks, tables) with anchor_line extraction for key elements to improve original file query
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

### Limitations

Claude Code has two output limits that affect `/read-efficient`:

1. **Bash Output Limit** (`BASH_MAX_OUTPUT_LENGTH`): Default 100,000 characters
   - Configured via: `BASH_MAX_OUTPUT_LENGTH` environment variable
   - Location: `.claude/settings.json` or `~/.claude/settings.json`

2. **SlashCommand Output Limit**: ~30,000 characters
   - Hardcoded limit in Claude Code for slash command display output
   - Cannot be configured, but can be worked around

### Configuration for SlashCommand

The `/read-efficient` slash command is preconfigured with `--max-output=29900` and a defined fallback logic if truncation is detected.

If output exceeds the slash command limit then call the Node script with a custom / configured bash output limit:
  ```bash
  !node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/index.js $ARGUMENTS --max-output=100000
  ```

If output is also exceeds the bash output limit then you need to override this:
- **Increase bash output limit** in `.claude/settings.json`:
  ```json
  {
    "env": {
      "BASH_MAX_OUTPUT_LENGTH": "110000"
    }
  }
  ```

## Technical Details

The tool is a standalone TypeScript/Node.js package with:
- Zero external dependencies
- 9 file format handlers (JSON, CSV, YAML, INI, NDJSON, Markdown, XML, HTML, SQL, plaintext)
- Batch processing support for multiple mixed-format files
- Smart format detection with graceful fallback to plaintext
- Optional disk caching
- 544 passing tests, 78.68% statement coverage, 90.69% function coverage
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

## Completed in v0.4.0.0

- ✅ **HTML format handler** - Parse HTML with visual tag stripping and semantic structure preservation
  - Strip presentation tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<span>`, `<font>`, `<br>`, `<hr>`, `<script>`, `<style>`
  - Preserve informational tags: `<code>`, `<pre>`, `<kbd>`, and elements with semantic attributes
  - Auto-close unclosed HTML tags (browser-compatible)
  - Optimized semantic structures: lists `{ordered, list}`, tables `{headers, rows}`
- ✅ 61 comprehensive HTML test cases
- ✅ 378 total tests with 88.98% statement coverage, 96.84% function coverage

## Completed in v0.6.0.0

- ✅ **Log file parsing** - Pattern-based parsing for common log formats:
  - Apache/Nginx Combined Format (space-delimited with quoted fields)
  - RFC 3164 Syslog (traditional format)
  - RFC 5424 Syslog (modern cloud format)
  - Auto-detection from first line pattern
  - 25 comprehensive tests, all passing
- ✅ **SQL INSERT statement parsing** - Parse SQL dumps and INSERT statements:
  - Extract table name, columns, row data with type awareness
  - Handle multiple statements, quoted fields, NULL values, escaped quotes
  - 31 comprehensive tests, all passing
- ✅ 434 total tests with 89%+ statement coverage, 96.84%+ function coverage

## Completed in v0.7.0.0

- ✅ **Extended SQL Statement Parsing** - Support for additional statement types:
  - ALTER TABLE statements with ADD COLUMN and constraint tracking
  - GRANT & REVOKE statements for permission management
  - Transaction Control (BEGIN, COMMIT, ROLLBACK)
  - CREATE INDEX statements
  - DROP statements with IF EXISTS support
  - TRUNCATE statements
- ✅ **Improved SELECT Parsing** - Fixed parsing logic for basic SELECT statements with edge cases
- ✅ **Fallback Mechanism** - Zero-information-loss strategy for complex patterns
- ✅ **Edge Case Testing** - Comprehensive tests for unparseable, edge case, and real-world SQL patterns
- ✅ **Benchmark Generation** - Performance analysis script for SQL statement parsing

## Completed in v0.8.0.0

- ✅ **Comprehensive SQL statement parsing** - Full support for all major SQL operations:
  - SELECT with aliases, JOINs (INNER/LEFT/RIGHT/FULL OUTER/CROSS), GROUP BY, HAVING, UNION/INTERSECT/EXCEPT
  - INSERT/UPDATE/DELETE with complex conditions
  - CREATE/ALTER/DROP TABLE with schema extraction
  - Subqueries, CASE statements, aggregate functions
  - Transaction control (BEGIN, COMMIT, ROLLBACK)
  - Zero information loss via unparsedContent fallback for complex patterns
- ✅ **Test suite restructuring** - Replaced 976 shallow tests with 70 comprehensive tests:
  - 26 non-overlapping statement tests validating complete parsing
  - 44 real-world edge case tests
  - Each test asserts 15-20+ parsed fields (vs previous 2-3 assertions)
  - 10x faster test execution (~2 seconds)
- ✅ 544 total tests with 78.68% statement coverage, 90.69% function coverage

## Planned for Phase 7+ (v0.9.0.0+)

- **Window Functions** - PARTITION BY, ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD
- **CTEs (Common Table Expressions)** - Full WITH clause parsing
- **Complex Subqueries** - Nested subquery resolution
- **Additional log formats** - Windows Event Log, CloudWatch, JSON log formats

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## License

See root [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)