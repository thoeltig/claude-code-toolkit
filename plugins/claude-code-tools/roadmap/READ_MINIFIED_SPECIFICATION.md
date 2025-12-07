# /read-minified Slash Command Specification

## Purpose
Optimize file reading for token efficiency and semantic clarity by converting any file format to structured minified JSON, removing formatting noise while preserving information density.

## Philosophy
- Information density over human readability
- Semantic structure preserved, formatting noise stripped
- No external dependencies (TypeScript standalone package)
- Progressive extension: JSON first, then other formats

## Slash Command Specification

### Command Name
`/read-minified`

### Usage
```bash
/read-minified <path1> [path2 path3 ...] [flags]
```

### Flags

#### --minify
- **Default:** Applied to all reads
- **Behavior:** Removes redundant whitespace and newlines
  - Multiple spaces → single space
  - Multiple empty lines (`\n\n\n`) → single newline
  - Trim start/end of file
  - Works on any text format

#### --to-json
- **Default:** Not applied (keep original format structure)
- **Behavior:** Convert file format to JSON
  - Currently supported: JSON (first version)
  - Future: XML, CSV, YAML, Markdown
- **Output:** Minified JSON

#### --cache / --store / --save
- **Default:** false
- **Behavior:** Write optimized file to disk with suffix
  - Naming: `{original_filename}.compact.{extension}`
  - Location: Same directory as original file
  - Conflict handling: Use (1), (2), (3) suffix if file exists
  - User manages cleanup (no TTL, no auto-invalidation)

#### --overwrite
- **Default:** false (create numbered duplicates)
- **Behavior:** Overwrite existing cached files
- **Usage:** `--cache --overwrite` to replace cached versions

#### --no-output
- **Default:** false (return content to Claude)
- **Behavior:** Do not output file contents to Claude
- **Purpose:** Avoid token bloat for large batches
- **Output:** Return manifest of cached/processed file paths instead

### Output Format

#### Standard Output (no --no-output)
Single file:
```json
{"content": {...minified_json...}, "cached": "/path/to/original.compact.json"}
```

Multiple files (NDJSON):
```json
{"file": "file1.json", "content": {...}}
{"file": "file2.json", "content": {...}}
{"file": "file3.json", "cached": "/path/to/file3.compact.json"}
```

#### No-Output Mode (--no-output)
Manifest list:
```json
{
  "processed": [
    {"file": "file1.json", "cached": false},
    {"file": "file2.json", "cached": true, "path": "/path/to/file2.compact.json"},
    {"file": "file3.json", "cached": true, "path": "/path/to/file3.compact.json"}
  ],
  "total": 3
}
```

## Input/Output Data Formats

### Minified JSON
- No whitespace (except required spaces in strings)
- No newlines
- No trailing commas
- Format: `{"key":"value","nested":{"x":1},"array":[1,2,3]}`

### Whitespace Minification Algorithm
1. Remove redundant spaces (multiple spaces → single space)
2. Collapse empty lines (multiple `\n` → single `\n`)
3. Trim leading/trailing whitespace from entire file
4. Preserve necessary whitespace:
   - Spaces within strings
   - Single newlines for structure
   - Content indentation in code blocks

## Data Type Conversion (JSON First)

### JSON Format
- Minify: Remove all unnecessary whitespace
- Validate: Check JSON structure integrity
- Output: Minified JSON object or array

### Future Formats (Not in v1)
- XML → JSON (element structure + attributes)
- CSV → JSON (header as schema, rows as objects)
- YAML → JSON (structure preservation)
- Markdown → JSON (with custom conversion rules)
- Plain text (no markdown structure) -> only minified, no JSON

### Markdown → JSON Conversion Rules (Future)

**Headers**
- `# Title` → Nested objects by level depth
- Header text becomes `"_heading"` field in parent object
- Content under header becomes sibling fields

**Lists**
- Unordered (`-`) and ordered (`1.`) → JSON arrays
- Nested lists → recursive array nesting based on indentation level
- State machine tracks: current depth, parent node, array index

**Tables**
- Header row → schema (field names)
- Data rows → array of objects matching schema
- Malformed rows: values shift to available fields left-to-right
- Extra columns: `undefined1`, `undefined2`, etc. auto-generated fields
- Per-row graceful fallback (individual rows can be malformed)

**Code Blocks**
- Detected by triple backticks: ` ```language code``` `
- Structured output: `{"code": {"language": "typescript", "content": "const x = 1;"}}`
- Language detected from opening fence, defaulted to "text" if missing
- Content stripped of markdown identifiers

**Inline Formatting**
- Stripped completely (`*bold*`, `**bold**`, `_italic_` → plain text)
- No semantic distinction needed; content is readable without markup
- Reduces token noise

**Unparseable Content**
- Any content that doesn't fit above patterns
- Captured in `"_unparseable"` string field
- Allows graceful degradation: 80% perfect JSON >> raw text

### Error Handling
- **File not found:** Return error message
- **Invalid format:** For JSON, return parse error
- **Encoding issues:** Attempt UTF-8 first, fallback to latin1
- **Large files:** No artificial limit; script handles streaming if needed

## Use Cases

### Single File, No Cache
```bash
/read-minified document.json --minify --to-json
# Returns: minified JSON content
```

### Batch Process, Cache Results
```bash
/read-minified doc1.json doc2.json doc3.json --minify --cache
# Returns: NDJSON with each file
# Writes: doc1.compact.json, doc2.compact.json, doc3.compact.json
```

### Large Batch, No Output, Just Cache
```bash
/read-minified doc1.json doc2.json ... doc10.json --minify --cache --no-output
# Returns: Manifest of cached paths
# Writes: All compact files
# (Avoids token bloat, manifest tells Claude where cached files are)
```

### Reprocess with Overwrite
```bash
/read-minified document.json --minify --cache --overwrite
# Returns: minified content
# Writes: document.compact.json (overwrites if exists)
```

## Implementation Constraints

### V1 (JSON Only)
- Single file format: JSON
- Full minification support
- Cache logic implemented
- Unit tests for all features

### Future Versions
- Add format converters (XML, CSV, YAML, Markdown, Plain text)
- Extend test suite for each new format
- Keep minification/cache logic unchanged

## Performance Goals
- No external dependencies
- Fast TypeScript execution
- Suitable for batch processing (10+ files)
- Tokens saved should exceed manifest overhead