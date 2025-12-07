# read-minified

Optimize file reading for token efficiency. Convert files to minified format (JSON or plain text), removing formatting noise while preserving information density.

## Overview

`read-minified` is a TypeScript/Node.js tool designed to reduce token overhead when reading files into Claude Code. It removes redundant whitespace and formatting while preserving semantic structure. The tool automatically detects file formats and applies appropriate minification.

**Key Philosophy:** Information density over human readability.

## Features

- **Smart Format Detection:** Auto-detects file type (JSON, plaintext, or unknown) by extension
- **Minification:** Remove redundant whitespace and formatting from any text file
- **JSON Support:** Parse and minify JSON with full validation
- **Plain Text Fallback:** Gracefully handle non-JSON files and parsing errors
- **Caching:** Optionally cache optimized files for reuse
- **Batch Processing:** Handle multiple files in one command
- **No Dependencies:** Pure TypeScript/Node.js, no external packages

## Installation

```bash
npm install read-minified
```

Or use directly:

```bash
node dist/index.js <path> [options]
```

## Usage

### Command Syntax

```bash
/read-minified <path1> [path2 path3 ...] [flags]
```

### Flags

- `--minify` (default: true) - Remove redundant whitespace
- `--to-json` - Convert to minified JSON format (JSON files only)
- `--cache` - Save optimized file to disk
- `--overwrite` - Replace existing cache files
- `--no-output` - Return manifest instead of file content

## Format Detection & Fallback

The tool automatically detects file format based on file extension:

| Extension | Type | Behavior |
|-----------|------|----------|
| `.json` | JSON | Parse and minify as JSON; fallback to plaintext on parse error |
| `.txt`, `.text` | Plain text | Minify whitespace only |
| `.py`, `.js`, `.go`, etc. | Code (unknown) | Treat as plaintext; minify whitespace |
| Unknown | Plaintext | Minify whitespace only |

**Fallback Logic:**
- If a file appears to be JSON but fails to parse, the tool gracefully degrades to minified plaintext
- This ensures broken JSON files still produce useful output instead of errors
- No file read will ever fail - always returns structured response with minified content

### Examples

**Single JSON file, minified output:**
```bash
/read-minified document.json --minify
# Output: {"content":{...parsed json...},"cached":false}
```

**Plain text file:**
```bash
/read-minified notes.txt --minify
# Output: {"content":"minified text content...","cached":false}
```

**Unknown file type (auto-detected as plaintext):**
```bash
/read-minified script.py --minify
# Output: {"content":"minified python code...","cached":false}
```

**Broken JSON (fallback to plaintext):**
```bash
/read-minified incomplete.json --minify
# Output: {"content":"{incomplete json...","cached":false}
# Note: No error; graceful degradation to minified string
```

**Batch process with mixed file types and caching:**
```bash
/read-minified data.json notes.txt code.py --minify --cache
# Creates: data.compact.json, notes.compact.txt, code.compact.py
# Returns: NDJSON output for each file
```

**Large batch, cache only (no token bloat):**
```bash
/read-minified large1.json large2.txt large3.py --minify --cache --no-output
# Returns: Manifest of cached file paths (minimal output)
# Writes: All files to disk
```

**Reprocess with overwrite:**
```bash
/read-minified document.json --minify --cache --overwrite
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
import {processFile, processFiles} from 'read-minified';

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

- **Overall: 90.06%** code coverage (exceeds 85% target)
- **96 test cases** across 8 test suites:
  - minifier.test.ts (10 tests)
  - formats/json.test.ts (13 tests)
  - formats/plaintext.test.ts (7 tests)
  - utils/fileHandler.test.ts (7 tests)
  - utils/formatDetector.test.ts (8 tests)
  - cache.test.ts (15 tests)
  - index.test.ts (16 tests)
  - integration.test.ts (20 tests, including plaintext and fallback scenarios)

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

## Planned Formats

- **CSV** (v1.1) - Parse CSV to JSON array of objects
- **YAML** (v1.2) - Parse YAML to JSON
- **Markdown** (v1.3) - Parse markdown to structured JSON (headers, lists, code blocks)
- **XML** (future) - Parse XML to JSON

All formats benefit from automatic minification and fallback logic.

## License

MIT
