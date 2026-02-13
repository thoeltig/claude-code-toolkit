# Technical Specifications

Complete technical documentation for the read-efficient plugin.

## Architecture Overview

### Processing Pipeline

```
File Input
  ↓
Read File (fileHandler)
  ↓
Minify (minifier) [if --minify flag]
  ↓
Detect Format (formatDetector)
  ↓
Parse Format (format-specific handler)
  ↓
Try Structured Parse → On Error → Fallback to Plaintext
  ↓
Cache Result [if --cache flag]
  ↓
Format Output (JSON/NDJSON/Manifest)
```

### Core Modules

**Type System** (`src/types.ts`)
- Type definitions for options, processed files, manifest, cache operations

**Minifier** (`src/minifier.ts`)
- Whitespace minification (pure function)
- Removes redundant spacing while preserving information structure

**Format Detection** (`src/utils/formatDetector.ts`)
- Auto-detect file format by extension
- Returns format identifier for routing to appropriate handler
- Supported extensions: `.json`, `.csv`, `.tsv`, `.yaml`, `.yml`, `.ini`, `.conf`, `.cfg`, `.properties`, `.ndjson`, `.jsonl`, `.md`, `.markdown`, `.xml`, `.html`, `.htm`, `.log`, `.sql`, and plaintext fallback

**File Handler** (`src/utils/fileHandler.ts`)
- File I/O operations (read, write, exists)
- Encoding-safe operations
- Error handling with graceful degradation

**Cache Manager** (`src/cache.ts`)
- Disk caching with conflict resolution
- Manifest generation for batch operations
- Overwrite protection and validation

**CLI Orchestration** (`src/index.ts`)
- Argument parsing and validation
- Pipeline orchestration
- Format routing logic
- Output formatting (JSON/NDJSON/Manifest)

## Format Handlers

### JSON Handler (`src/formats/json.ts`)

**Parsing Strategy**
- Native JSON.parse() with full validation
- Preserves all data types: objects, arrays, strings, numbers, booleans, null
- Fallback to minified plaintext on parse error

**Output**
- Parsed JSON object (minified)
- Type preservation for all JSON types

**Error Handling**
- Invalid JSON gracefully degrades to minified plaintext
- No information loss - original content recoverable

---

### CSV Handler (`src/formats/csv.ts`)

**Parsing Strategy**
- Intelligent delimiter detection (comma, semicolon, tab)
- Header row detection from first line
- Returns array of objects with headers as keys

**Type Inference**
- Strings preserved as-is
- Numbers detected and converted
- Boolean values ("true", "false") recognized
- Null values represented as `null`

**Supported Features**
- Quoted fields with embedded delimiters
- Escaped quotes within fields
- Mixed quote types
- Special character handling
- Multiline fields (CRLF handling)

**Output**
```json
[{"col1":"val1","col2":"val2"},{"col1":"val3","col2":"val4"}]
```

---

### YAML Handler (`src/formats/yaml.ts`)

**Parsing Strategy**
- Indentation-based nesting (2 or 4 spaces)
- List support (both `-` and `*` styles)
- Mapping (key-value) support
- Comment handling (lines starting with `#`)

**Type Inference**
- Strings preserved as-is
- Numbers detected: integers and floats
- Booleans: `true`, `false`, `yes`, `no`
- Null: empty values or `null` keyword

**Supported Features**
- Nested structures via indentation
- Mixed lists and mappings
- Multiline strings (via `|` and `>`)
- Anchors and aliases (basic support)

**Output**
```json
{"key":"value","nested":{"inner":"data"},"list":["item1","item2"]}
```

---

### INI Handler (`src/formats/ini.ts`)

**Parsing Strategy**
- Section-based organization (`[section]`)
- Key-value pairs: `key=value`
- Root-level keys outside sections
- Comment handling (`;` and `#`)

**Supported Features**
- Multiple sections
- Keys without sections
- Quoted values with spaces
- Special character support
- Case preservation

**Output**
```json
{"section1":{"key1":"val1"},"section2":{"key2":"val2"}}
```

---

### NDJSON Handler (`src/formats/ndjson.ts`)

**Parsing Strategy**
- Line-by-line JSON parsing
- One JSON object per line
- Invalid lines generate error objects
- Preserves valid data despite invalid entries

**Output**
```json
[{"parsed":"line1"},{"parsed":"line2"},{"error":"Invalid JSON on line 3"}]
```

---

### Markdown Handler (`src/formats/markdown.ts`)

**Block Elements Parsed**
- Headings (all 6 levels with level tracking)
- Paragraphs (consecutive lines)
- Ordered lists (numbered)
- Unordered lists (bullet points)
- Task lists (with checked state)
- Code blocks (with language detection)
- Tables (with headers and row objects)
- Blockquotes
- Horizontal rules
- YAML front matter (preserved as-is)

**Anchor Line Extraction**
- Key markdown elements tagged with `anchor_line` field
- Points to exact line number in original file
- Enables precise navigation to source location

**Formatting Handling**
- Inline markdown stripped as noise: `**bold**` → "bold", `*italic*` → "italic", `~~strikethrough~~` → "strikethrough"
- Preserved elements: links `[text](url)`, inline code `` `code` ``
- Whitespace normalization within paragraphs

**Output**
```json
[
  {"type":"heading","level":1,"content":"Title","anchor_line":1},
  {"type":"paragraph","content":"Text here","anchor_line":3},
  {"type":"list","ordered":false,"items":["item1","item2"],"anchor_line":5},
  {"type":"code_block","language":"js","content":"code here","anchor_line":8}
]
```

---

### XML Handler (`src/formats/xml.ts`)

**Semantic Preservation**
- Element tags preserved as JSON field names
- Attributes stored with `attribute_` prefix (e.g., `id="x"` → `attribute_id: "x"`)
- Text-only elements stored as `_text` or direct string value
- Namespace support: `ns:tagName` format preserved in output

**CDATA Handling**
- CDATA content merged with text nodes
- Special characters escaped appropriately

**Comment & Processing Instructions**
- Comments skipped (not preserved)
- Processing instructions skipped

**Self-Closing Tags**
- Full support for self-closing elements

**Error Handling**
- Graceful degradation: Malformed XML returns error object with context
- Never fails completely - always returns interpretable output

**Output**
```json
{
  "root": {
    "element": {
      "attribute_id": "123",
      "_text": "Content here"
    }
  }
}
```

---

### HTML Handler (`src/formats/html.ts`)

**Visual Tag Stripping**
- Removed tags: `<b>`, `<i>`, `<u>`, `<em>`, `<strong>`, `<span>` (without semantic attributes), `<font>`, `<br>`, `<hr>`, `<script>`, `<style>`
- Removed tag content is preserved, just the tag markup stripped

**Semantic Tags Preserved**
- Information-bearing tags: `<code>`, `<pre>`, `<kbd>`, `<mark>`, `<ins>`, `<del>`, `<sub>`, `<sup>`
- Elements with semantic attributes: `class`, `id`, `data-*`

**Auto-Closing Unclosed Tags**
- Browser-compatible auto-closing for: `<p>`, `<li>`, `<tr>`, `<td>`, `<th>`, `<dd>`, `<dt>`, `<option>`
- Handles common malformed HTML gracefully

**Optimized Semantic Structures**
- Headings: `<h1>`-`<h6>` encode level in tag name; no redundant attributes
- Lists: Compact format `{ordered: boolean, items: [...]}` vs nested `li` objects
- Tables: Optimized format `{headers: [...], rows: [[]]}` vs complex cell nesting

**String-First Representation**
- All HTML values as strings (HTML is text-based markup)
- No type coercion or arbitrary objects

**Output**
```json
{
  "h1": "Title",
  "paragraph": "Text here",
  "list": {"ordered": false, "items": ["item1", "item2"]},
  "table": {"headers": ["Col1", "Col2"], "rows": [["a", "b"]]}
}
```

---

### Log File Handler (`src/formats/log.ts`)

**Format Auto-Detection**
- Detects from first line pattern
- No configuration needed

**Supported Formats**

**Apache/Nginx Combined Log**
- Pattern: `IP IDENT USER [DATE] "REQUEST" STATUS BYTES "REFERRER" "USER-AGENT"`
- Parsed fields: `ip`, `identity`, `user`, `timestamp`, `method`, `path`, `protocol`, `status`, `bytes`, `referrer`, `user_agent`
- Type-aware: status and bytes as numbers

**RFC 3164 Syslog (Traditional)**
- Pattern: `PRIORITY TIMESTAMP HOSTNAME TAG[PID]: MESSAGE`
- Parsed fields: `priority`, `severity`, `facility`, `timestamp`, `hostname`, `tag`, `pid`, `message`

**RFC 5424 Syslog (Modern/Cloud)**
- Pattern: `PRIORITY VERSION TIMESTAMP HOSTNAME APP PID MSGID [STRUCTURED_DATA] MESSAGE`
- Parsed fields: `priority`, `severity`, `facility`, `version`, `timestamp`, `hostname`, `app`, `pid`, `msgid`, `structured_data`, `message`
- ISO 8601 timestamp support

**Parsing Behavior**
- Space-delimited with quoted field support
- Graceful fallback to minified plaintext on parse error
- String-first philosophy: all values as strings except parsed numbers

**Output**
```json
[
  {"ip":"192.168.1.1","user":"-","timestamp":"01/Jan/2025:12:34:56","status":200,"bytes":1234},
  {"ip":"10.0.0.1","user":"admin","timestamp":"01/Jan/2025:12:35:00","status":404,"bytes":512}
]
```

---

### SQL Handler (`src/formats/sql.ts`)

**Statement Types Supported**

**SELECT Statements**
- Column selection with aliases: `col1 AS alias1`
- Table aliases: `FROM table1 t1`
- JOINs: INNER, LEFT, RIGHT, FULL OUTER, CROSS
- Join conditions with complex WHERE logic
- GROUP BY and HAVING clauses
- Set operations: UNION, INTERSECT, EXCEPT
- Subqueries in SELECT, FROM, WHERE clauses
- Aggregate functions: COUNT, SUM, AVG, MIN, MAX
- ORDER BY with ASC/DESC

**INSERT Statements**
- Multi-row inserts: `INSERT INTO table VALUES (...), (...), (...)`
- Single and bulk operations
- Type-aware value parsing: numbers, strings, booleans, NULL
- Column list optional (assumes all columns)
- Schema context: columns array, row count

**UPDATE Statements**
- Complex SET clauses with expressions
- WHERE conditions with deep nesting
- Multiple column updates

**DELETE Statements**
- WHERE conditions with complex logic
- Multi-condition support

**CREATE TABLE Statements**
- Schema extraction with column names and types
- Constraint parsing: PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, DEFAULT, NOT NULL
- Index definitions

**ALTER TABLE Statements**
- ADD COLUMN with constraints
- Column modification tracking
- Constraint management

**DDL Statements**
- DROP TABLE with IF EXISTS support
- CREATE INDEX
- TRUNCATE TABLE

**Transaction Control**
- BEGIN, START TRANSACTION
- COMMIT
- ROLLBACK
- SAVEPOINT

**Permission Statements**
- GRANT statements
- REVOKE statements

**Edge Case Handling**

**Quote & Escape Handling**
- Nested quotes: `"text with 'quotes' inside"`
- Escaped quotes: `\'`, `\"`
- Multiline strings
- Mixed quote types

**Complex Expressions**
- Deep WHERE nesting (10+ levels supported)
- Function calls in conditions
- CASE statements (simple and searched)
- Window functions (basic detection)
- Subquery depth (3+ levels)

**Stress Testing**
- 50+ row INSERTs
- Many JOINs (10+ tables)
- Complex expressions (100+ character conditions)
- Deeply nested subqueries

**Zero Information Loss**
- Fallback: `unparsedContent` field for patterns not yet fully parsed
- Complex statements recoverable via `unparsedContent`
- Graceful degradation for advanced features
- No data discarded

**Parsed Fields** (varies by statement type)
- `statement_type`: INSERT, SELECT, UPDATE, etc.
- `tables`: Array of tables involved
- `columns`: Column list (for INSERT/CREATE)
- `joins`: Join information (for SELECT)
- `where_clause`: WHERE condition text
- `values`: Data rows (for INSERT)
- `conditions`: Parsed WHERE conditions
- `unparsedContent`: Complex patterns not fully parsed
- `row_count`: Number of rows (INSERT)
- `schema`: Column definitions with types (CREATE TABLE)

**Output Examples**

```json
{
  "statement_type": "SELECT",
  "tables": ["users", "orders"],
  "joins": [
    {"type": "INNER", "table": "orders", "on": "users.id = orders.user_id"}
  ],
  "columns": ["users.id", "orders.total"],
  "where_clause": "users.status = 'active'"
}
```

```json
{
  "statement_type": "INSERT",
  "table": "products",
  "columns": ["id", "name", "price"],
  "rows": [
    {"id": 1, "name": "Widget", "price": 9.99},
    {"id": 2, "name": "Gadget", "price": 19.99}
  ],
  "row_count": 2
}
```

---

### Plaintext Handler (`src/formats/plaintext.ts`)

**Fallback Handler**
- Used when format detection fails
- Used when specialized parser fails
- Used for `.txt`, `.text`, and unknown file types

**Minification**
- Removes redundant whitespace
- Preserves paragraph structure (double newlines)
- Normalizes single spaces

**No Structured Parsing**
- Returns minified string directly
- Information preserved, formatting optimized

---

## Format Detection & Fallback

**Detection Logic**
1. Examine file extension
2. Match against registered formats
3. Return detected format or "plaintext" default

**Fallback Cascade**
1. Attempt specialized parser (JSON, CSV, YAML, etc.)
2. On parse error → minify and return as plaintext
3. Never fails completely - always returns usable output
4. Error object with context provided where applicable

**Key Principle**: No file read will fail. Broken files produce useful output instead of errors.

---

## New Features (Recent Additions)

### Format-Safe Minification

**Problem**: Minifying structure-dependent formats (YAML, INI) without converting to JSON loses semantic meaning (indentation-based nesting, implicit typing).

**Solution**:
- Detect when `--minify` is used without `--to-json` for YAML/INI
- Add `minification_note` field to output warning user
- Example:
  ```bash
  /read-efficient config.yaml --minify --no-to-json
  # Output: {"content": "key:value", "minification_note": "YAML minified without --to-json..."}
  ```

**Formats Protected**:
- YAML (`.yaml`, `.yml`)
- INI (`.ini`, `.conf`, `.cfg`, `.properties`)

### NDJSON Special Handling

**Optimization**: NDJSON is already JSON (newline-delimited), so doesn't need format handler.

**Behavior**:
- NDJSON minified directly like JSON
- Skip redundant `formatNdjson` handler
- `--to-json` flag ignored (silent, no warning)
- Minified output: single-line NDJSON with no extra formatting

**Implementation**: Detected before format handlers, treated as native JSON format.

### `--no-anchor-lines` Flag

**Purpose**: Remove navigation metadata from Markdown output.

**Use Cases**:
- Users wanting parsed Markdown structure without position markers
- Reducing output size when anchor_line fields not needed
- API responses where navigation metadata is unnecessary

**Behavior**:
- Removes all `anchor_line` fields recursively from content
- Only applies to Markdown (other formats don't have anchor_line)
- Default: preserves anchor_lines (backward compatible)

**Example**:
```bash
# With anchor_line (default)
/read-efficient doc.md --to-json
# Returns: [{"type": "heading", "level": 1, "content": "Title", "anchor_line": 1}, ...]

# Without anchor_line
/read-efficient doc.md --to-json --no-anchor-lines
# Returns: [{"type": "heading", "level": 1, "content": "Title"}, ...]
```

### File Info Node

**Purpose**: Add context metadata to converted formats.

**When Applied**: Only for converted formats with `--to-json`:
- ✅ Applied: CSV, YAML, INI, Markdown, XML, HTML, Log files, SQL
- ❌ Not applied: JSON, NDJSON, plaintext (already have clear structure)

**Structure**:
```json
{
  "fileInfo": {
    "originalPath": "config.yaml",
    "format": "yaml",
    "originalSize": 1024,
    "minifiedSize": 512
  },
  "content": {...parsed content...}
}
```

**Benefits**:
- Clear source document reference
- Format identification (useful in batch operations)
- Compression statistics (original vs minified size)
- Helps users understand conversion context

**Not Applied When**:
- `--to-json` is false (minified plaintext only)
- Format is JSON/NDJSON/plaintext (already unambiguous)
- Processing multiple files without cache (NDJSON output per line)

---

## Output Limits & Auto-Caching

### Slash Command Limit
- Default: ~30,000 characters for slash command output display
- Cannot be reconfigured in Claude Code
- Preconfigured flag: `--max-output=29900`

### Bash Output Limit
- Default: 100,000 characters (`BASH_MAX_OUTPUT_LENGTH`)
- Configurable in `.claude/settings.json`:
  ```json
  {
    "env": {
      "BASH_MAX_OUTPUT_LENGTH": "110000"
    }
  }
  ```

### Auto-Caching Behavior

**When `--max-output=<number>` is provided:**

1. **Threshold Check**: As files are processed, accumulated output size is tracked
2. **Auto-Switch**: If total output would exceed the limit, `--cache` flag is automatically activated
3. **Graceful Fallback**: Once triggered, all files (including those already processed) are cached
4. **No Mixed Output**: Either all minified inline OR all cached based on size - never mixed

**Configuration Examples**

For slash command (default):
```bash
node dist/index.js file.json --max-output=29900
```

For bash with increased limit:
```bash
BASH_MAX_OUTPUT_LENGTH=110000 node dist/index.js file.json
```

With custom settings:
```json
{
  "env": {
    "BASH_MAX_OUTPUT_LENGTH": "150000"
  }
}
```

---

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

**Field Types:**
- `content` (JSON files): Parsed JSON object
- `content` (plaintext/unknown): Minified string
- `cached` (boolean): Whether result was cached to disk
- `cachedPath` (string, optional): Path to cached file if cached=true

---

## Programmatic Usage

```typescript
import {processFile, processFiles} from 'read-efficient';

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

**Options Interface**
```typescript
interface ProcessOptions {
  minify?: boolean;           // Default: true
  toJson?: boolean;           // Default: true
  cache?: boolean;            // Default: false
  overwrite?: boolean;        // Default: false
  noOutput?: boolean;         // Default: false
  maxOutput?: number;         // Default: undefined (no limit)
}
```

---

## Extensibility

Adding new format support is straightforward:

### Step 1: Create Handler
Create `src/formats/newformat.ts`:
```typescript
export function formatNewFormat(content: string): any {
  // Parse content to structured format
  // Return parsed structure or throw on error
  // Handler will fallback to plaintext on error
  return parsedData;
}
```

### Step 2: Register Detection
Update `src/utils/formatDetector.ts`:
```typescript
case 'newformat':
  return detectExtension(path, ['.newext']);
```

### Step 3: Add Tests
Create `tests/formats/newformat.test.ts` with comprehensive test coverage

### Step 4: Update Orchestration
Update `src/index.ts` format routing if needed

### Example: CSV Handler Added
Created `src/formats/csv.ts` with:
- Delimiter detection (comma, semicolon, tab)
- Type inference for numbers/booleans/null
- Quote and escape handling
- Header row parsing
- Result: Array of objects with headers as keys

---

## Test Coverage

### Test Statistics
- **Total tests**: 536 passing (8 NDJSON formatter tests consolidated into edge cases)
- **Test suites**: 20 comprehensive suites
- **Code coverage**: 79.75% statements, 79.55% lines, 90.64% functions, 70.53% branches
- **New edge case tests**: 11 comprehensive tests for new features

### Test Organization
```
tests/
├── formats/
│   ├── json.test.ts              (13 tests)
│   ├── csv.test.ts               (29 tests)
│   ├── yaml.test.ts              (20 tests)
│   ├── ini.test.ts               (15 tests)
│   ├── ndjson.test.ts            (10 tests)
│   ├── markdown.test.ts          (45 tests)
│   ├── xml.test.ts               (60 tests)
│   ├── html.test.ts              (61 tests)
│   ├── sql.test.ts               (70 tests - comprehensive + edge cases)
│   └── plaintext.test.ts         (7 tests)
├── minifier.test.ts              (10 tests)
├── utils/
│   ├── fileHandler.test.ts       (7 tests)
│   └── formatDetector.test.ts    (8 tests)
├── cache.test.ts                 (15 tests)
├── index.test.ts                 (16 tests)
└── integration.test.ts           (20 tests)
```

### SQL Test Strategy
- **Comprehensive tests** (26): Non-overlapping statement types with all parsed fields validated
- **Edge case tests** (44): Real-world patterns, complex nesting, malformed input
- **Quality improvement**: 15-20+ assertions per test (vs previous 2-3 assertions)
- **Execution speed**: ~2 seconds (vs 30 seconds for previous 1000+ tests)

### Coverage by Module
- Overall: 78.79% statements
- SQL parser: 70.01% statements (high complexity from edge case parsing)
- Format handlers: 85%+ statements (most fully covered)
- Utilities: 90%+ statements (comprehensive)

---

## Performance Characteristics

### Minification
- **Reduction**: 20-70% file size reduction depending on original formatting
- **Speed**: 10+ files per second
- **Memory**: No artificial limits; handles arbitrarily large files
- **Scalability**: Streaming-ready for batch operations

### Format Parsing
- **JSON**: Milliseconds (native parser)
- **CSV**: 100+ MB files in seconds
- **Markdown**: Line-by-line parsing, negligible overhead
- **XML**: Recursive parsing with depth handling
- **SQL**: Regex-based statement detection with fallback

### Caching
- **Disk I/O**: Minimal overhead for cache write
- **Manifest**: Generated efficiently for batch operations
- **Conflict Resolution**: Automatic with user control via flags

---

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

---

## Known Limitations (Deferred to Phase 7+)

- **Window Functions**: Currently captured in `unparsedContent` for SQL
- **CTEs (WITH clauses)**: Basic detection, full extraction pending
- **CREATE VIEW**: Returns empty placeholder
- **Complex Subquery Resolution**: Detected but full nested resolution pending

All limitations use graceful fallback - `unparsedContent` preserves original text for recovery.

---

## Planned Architecture Optimizations (v0.10.0.0+)

### Performance Improvements

**Current Issues:**
- Minify entire file first, then convert to JSON (redundant)
- Handle anchor lines after conversion (two-pass processing)
- No type-aware string minification in JSON values
- Minify whole file even when converting to JSON (already produces minified output)

**Proposed Solutions:**

#### 1. Single-Pass Processing Order
```
Read → Detect Format → Convert (with minify flag) → JSON.stringify
```
- Remove initial file minification step
- Format handlers control minification during parsing

#### 2. Minify Flag Per Format Handler
Pass `minify` option to each format handler:
```typescript
interface FormatOptions {
  minify: boolean;
  noAnchorLines?: boolean; // Markdown only
}
```

During parsing, handlers check `minify` flag:
- If `true`: Minify string values
  - Multiple consecutive spaces → single space
  - Multiple consecutive newlines → single newline
- If `false`: Keep string values as-is
- Only strings minified (numbers/booleans/null unchanged)

#### 3. Anchor Line Handling (Markdown Only)
- Add `noAnchorLines` parameter during parsing
- Skip generating anchor_line fields if flag set
- Other formats: Don't add anchor_line (not applicable)

#### 4. Conditional JSON Output Formatting
```typescript
const jsonOutput = minify
  ? JSON.stringify(data)           // Compact/minified
  : JSON.stringify(data, null, 2); // Pretty with 2-space indent
```
- Unified approach for minify true/false cases
- Applied consistently across all converted formats
- Handles all minification scenarios

#### 5. Plaintext Minification
- Keep as-is: Minify whole file only for plaintext/non-JSON output
- Only when `--no-to-json` is used or format is plaintext

**Expected Benefits:**
- 🚀 **Performance**: Single-pass processing (no redundant minification)
- 📉 **Efficiency**: Type-aware minification (strings only)
- 💾 **Output**: More compact when minified, readable when pretty
- ⚡ **Architecture**: Cleaner separation of concerns
- 🎯 **Consistency**: Unified minify handling across all formats
