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

**Note:** All flags use negative convention (`--no-*`). Default behavior is: minify=true, toJson=true, cache=false, overwrite=false, noOutput=false.

#### --no-minify
- **Default:** OFF (minification is applied by default)
- **Behavior:** Disable minification, keep original whitespace
  - Useful for preserving formatting structure
  - Only affects plaintext output (minification always happens before JSON conversion)

#### --no-to-json
- **Default:** OFF (JSON conversion is applied by default)
- **Behavior:** Disable JSON conversion, keep original file format
  - Returns minified plaintext instead of structured JSON
  - Useful for non-structured formats or when format preservation is needed

#### --cache
- **Default:** OFF (caching disabled)
- **Behavior:** Write processed file to disk with `.compact` suffix
  - Naming: `{original_filename}.compact.{extension}`
  - Location: Same directory as original file
  - Conflict handling: Use (1), (2), (3) suffix if file exists
  - User manages cleanup (no TTL, no auto-invalidation)
- **Example:** `products.csv` → `products.compact.csv`

#### --overwrite
- **Default:** OFF (create numbered duplicates)
- **Behavior:** Overwrite existing cached files instead of creating duplicates
- **Usage:** `--cache --overwrite` to replace cached versions
- **Note:** Only applies when `--cache` is enabled

#### --no-output
- **Default:** OFF (return content to Claude)
- **Behavior:** Do not output file contents to stdout
- **Purpose:** Avoid token bloat for large batches
- **Returns:** JSON manifest of processed files and cached paths instead of content

#### --max-output=<number>
- **Default:** Not set (no output limit)
- **Behavior:** Set maximum output size in bytes
- **Auto-caching:** If output would exceed limit, automatically enables `--cache` and `--no-output`
- **Example:** `--max-output=30000` limits output to 30KB, caches remainder
- **Use case:** Slash commands with output limits (~30KB in Claude Code)

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

### Single File, Default Processing (Minify + JSON)
```bash
/read-minified document.json
# Default: minify=true, toJson=true
# Returns: minified JSON content
# No caching
```

### Minified Plaintext Only (No JSON Conversion)
```bash
/read-minified document.csv --no-to-json
# Behavior: Minify but keep CSV format
# Returns: minified CSV plaintext (not JSON)
# Use case: Preserve original format structure
```

### Batch Process with Caching
```bash
/read-minified doc1.json doc2.json doc3.json --cache
# Behavior: Minify + JSON convert + cache
# Returns: NDJSON with each file's content
# Writes: doc1.compact.json, doc2.compact.json, doc3.compact.json
```

### Large Batch, Smart Output Limiting
```bash
/read-minified doc1.json doc2.json ... doc10.json --cache --max-output=30000
# Behavior: Process all files, auto-cache if output would exceed 30KB
# Returns: Manifest of cached paths (not full content)
# Writes: All compact files
# Use case: Slash commands with output limits
```

### Reprocess with Overwrite
```bash
/read-minified document.json --cache --overwrite
# Behavior: Minify + JSON convert + overwrite cache
# Returns: minified JSON content
# Writes: document.compact.json (overwrites if exists)
```

### Preserve Formatting (No Minification)
```bash
/read-minified document.json --no-minify
# Behavior: Keep original whitespace, convert to JSON
# Returns: Non-minified JSON (larger output)
# Use case: When structure visualization is important
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