# read-token-optimized

Token-efficient file reading for Claude Code - minify files to reduce context pollution and operating costs.

## Philosophy: Less is More

Context is precious. Every character you read costs tokens. By minifying files - removing redundant whitespace and formatting noise while preserving information density - we dramatically reduce overhead without sacrificing understanding.

**This is your default file reading tool when cost and efficiency matter.**

## Quick Start

```bash
/read-optimized path/to/file.json
```

## When to Use

**Use `/read-optimized` instead of native Read for:**
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

1. **Detects file format** - JSON, plaintext, code by file extension
2. **Minifies content** - Removes redundant whitespace and formatting
3. **Parses structure** - JSON files become structured objects for easier analysis
4. **Gracefully falls back** - If JSON parsing fails, returns minified plaintext instead
5. **Caches results** (optional) - Reuse minified versions to avoid re-processing

## How It Works

### Single file
```bash
/read-optimized data.json
# Returns minified JSON object
```

### Multiple files
```bash
/read-optimized api.js utils.js types.ts
# Returns newline-delimited JSON (one result per file)
```

### With caching (reuse minified version)
```bash
/read-optimized huge-dataset.json --cache
# Creates cached version for future reads
```

### Force plaintext mode
```bash
/read-optimized script.py --format plaintext
# Skips JSON parsing, returns minified text
```

## Output

- **JSON files**: Minified parsed JSON object (easy to analyze)
- **Code/text**: Minified plaintext (whitespace removed, content intact)
- **Multiple files**: One line per file (NDJSON format)
- **Parsing fails**: Gracefully degrades to minified plaintext (never errors)

## Token Impact

By minifying instead of reading raw files:
- ✓ 30-70% reduction in file size on average
- ✓ Lower per-operation cost
- ✓ Information density preserved - nothing lost, just optimized
- ✓ More context available for actual reasoning

## Technical Details

For package documentation, CLI usage, and programmatic API, see:
`plugins/read-token-optimized/read-minified/README.md`

The tool is a standalone TypeScript/Node.js package with:
- Zero external dependencies
- Batch processing support
- Smart format detection with graceful fallback
- Optional disk caching
- 90%+ test coverage
- Processes 10+ files per second

## Future Enhancements

Planned format support (see roadmap/):
- CSV parsing and minification
- YAML support
- Markdown structured parsing
- XML to JSON conversion

All formats benefit from automatic minification and fallback behavior.

## Installation

The plugin is installed as part of Claude Code. Use the `/read-optimized` command directly.

## License

MIT
