# Read Efficient

Token-efficient file reading for Claude Code.

## What It Does

Converts files to compact JSON and removes redundant whitespace. Supports 10+ formats: JSON, CSV, YAML, XML, HTML, Markdown, SQL, logs, and plain text.

**How it saves tokens**:
- **Structured formats** (YAML, XML, HTML, JSON): Converts to minified JSON, typically 30-50% smaller
- **Parsed formats** (Markdown, SQL, logs): Parses to structured JSON, removes noise while preserving meaning
- **Simple formats** (CSV, plain text): Removes whitespace and extra newlines

## Why Use It

Every character in context costs tokens.
- ✓ Save 30-70% tokens on file reads
- ✓ Fit more content in your token budget
- ✓ Faster and cheaper analysis
- ✓ Better for batch processing multiple files

## Quick Start

```bash
/read-efficient path/to/file.json
```

## Usage Examples

**Single file**:
```bash
/read-efficient data.csv
/read-efficient config.yaml
/read-efficient README.md
```

**Multiple files** (mixed formats at once):
```bash
/read-efficient config.yaml data.csv README.md script.html
```

**With caching** (save result to avoid re-processing):
```bash
/read-efficient huge-dataset.csv --cache
```

## Supported Formats

| Format | Extensions | Output |
|--------|-----------|--------|
| JSON | `.json` | Minified JSON object |
| CSV | `.csv`, `.tsv` | Array of objects with column headers |
| YAML | `.yaml`, `.yml` | Parsed structure as JSON |
| INI | `.ini`, `.conf`, `.cfg`, `.properties` | Sections as nested objects |
| NDJSON | `.ndjson`, `.jsonl` | Array of parsed objects |
| Markdown | `.md`, `.markdown` | Block elements (headings, lists, tables) with line references |
| XML | `.xml` | Elements with attributes and namespaces preserved |
| HTML | `.html`, `.htm` | Semantic structure (visual markup removed) |
| Logs | `.log` | Structured array (auto-detects Apache/Nginx/Syslog formats) |
| SQL | `.sql` | Parsed statements as JSON (SELECT/INSERT/UPDATE/DELETE/CREATE) |
| Plain text | `.txt`, `.text`, unknown | Minified whitespace |

## Key Features

- **Auto-detection** - Detects 10+ file formats by extension
- **Format conversion** - Converts any format to structured JSON
- **Minification** - Removes redundant whitespace and noise
- **Type conversion** - Converts `"true"` to boolean, `"123"` to number for efficiency
- **Smart fallback** - Parsing errors degrade to minified plaintext (never crashes)
- **Batch processing** - Handle multiple mixed-format files in one command
- **Caching** - Optional disk caching to skip re-processing large files
- **Pure TypeScript** - No external dependencies

## Command Options

```bash
/read-efficient <file1> [file2 ...] [flags]
```

**Default behavior**:
- Minify whitespace
- Convert to JSON format

**Optional flags**:
- `--cache` - Save result to disk for faster future reads
- `--overwrite` - Replace existing cached files
- `--no-minify` - Keep original formatting
- `--no-to-json` - Skip format conversion (minified plaintext only)
- `--no-output` - Return manifest instead of file content
- `--no-anchor-lines` - Remove line number references from Markdown

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