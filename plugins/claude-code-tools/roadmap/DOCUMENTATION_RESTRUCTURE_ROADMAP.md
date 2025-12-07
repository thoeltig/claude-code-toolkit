# Documentation Restructure Roadmap

## Overview

Restructure `READ_MINIFIED_SPECIFICATION.md` into a comprehensive technical specification suitable for porting the implementation to other languages, while streamlining README.md to focus on package features and quick-start guides.

## Timeline

**When:** After all format implementations complete (end of Phase 3)
**Why:** Need concrete, tested format implementations as reference examples
**Duration:** ~1-2 sessions depending on format count

## Goals

1. **Create portable technical reference** - Enable developers in any language to implement /read-minified following same algorithms
2. **Separate concerns** - README = marketing/quick-start, SPEC = technical deep-dive
3. **Establish contribution template** - Clear format specification pattern for future additions
4. **Document all edge cases** - Ensure consistency across implementations and ports

## Deliverables

### 1. Enhanced READ_MINIFIED_SPECIFICATION.md

**New Structure:**

```
# /read-minified Technical Specification

## 1. Executive Summary
- High-level purpose and use case
- Key philosophy: information density, graceful degradation, no dependencies

## 2. Architecture Overview
- Component diagram/relationships
- Data flow: File → Format Detector → Parser → Minifier → Output Formatter → Cache
- Type system overview

## 3. Type Definitions & Data Structures
- ReadMinifiedOptions interface
- ProcessedFile interface
- FileFormat union type
- All return types with examples

## 4. Core Components Specification

### 4.1 Minifier Module
- Algorithm: Whitespace reduction strategy
- Pseudo-code or step-by-step logic
- Rules: What constitutes "redundant" whitespace
- Examples: Input/output pairs
- Edge cases: Mixed newlines, tabs, quotes

### 4.2 Format Detector
- Extension → format mapping table
- Future content-sniffing strategy
- Supported extensions list
- Fallback behavior

### 4.3 Output Formatter
- 8 output scenarios with detailed specs:
  1. Single file, no cache (raw content)
  2. Single file + cache (wrapped with metadata)
  3. Single file + error (error structure)
  4. Multiple files, no cache (NDJSON)
  5. Multiple files + cache (NDJSON with metadata)
  6. Multiple files + errors (mixed)
  7. Manifest mode (--no-output)
  8. Empty/invalid cases
- JSON structure definitions for each
- Error format specification

### 4.4 Cache Module
- Naming convention: `{basename}.compact.{ext}`
- Conflict resolution: `(1)`, `(2)` numbering
- File location strategy
- Overwrite behavior specification

## 5. Format Specifications

**Template for each format:**

### Format: {NAME}

#### 5.{N}.1 Overview
- Purpose and typical use cases
- Common extensions
- Difficulty level: Simple/Medium/Complex

#### 5.{N}.2 Parsing Algorithm
- Step-by-step pseudo-code
- Decision tree for ambiguous cases
- Header detection logic (if applicable)

#### 5.{N}.3 Field Naming Convention
- How headers become object keys
- Unknown field handling: `u1, u2, u3...` pattern
- Field position calculation
- Example mapping

#### 5.{N}.4 Data Type Handling
- All fields treated as strings initially
- When to convert (if ever)
- Null/undefined/empty field behavior
- Mixed type field handling

#### 5.{N}.5 Edge Cases & Graceful Degradation

For each edge case, specify:
- **Condition:** What constitutes this edge case
- **Expected Behavior:** How to handle it
- **Output:** What the result should look like
- **Example:** Input and expected output JSON

Example edge cases template:
```
Case: Missing/Incomplete Rows
- Condition: Data row has fewer fields than headers
- Behavior: Omit missing field from object (don't include null/undefined)
- Output: Object only contains fields with values
- Example:
  Input: "name,age,city\nJohn,30"
  Output: {"name":"John","age":"30"}

Case: Extra Fields
- Condition: Data row has more fields than headers
- Behavior: Map excess fields to u{position} keys
- Output: Standard object with u{N} keys for overflow
- Example:
  Input: "name,age\nJohn,30,Engineer,Active"
  Output: {"name":"John","age":"30","u3":"Engineer","u4":"Active"}

Case: Malformed Input
- Condition: Syntax error prevents optimal parsing
- Behavior: Attempt fallback parsing; if all else fails, return graceful error
- Output: {error: "reason", raw: "content", format: "plaintext"}
```

#### 5.{N}.6 Implemented Edge Cases (from test suite)
- List all test cases from `tests/formats/{format}.test.ts`
- Reference test file location
- Test count and coverage

#### 5.{N}.7 Example: Well-Formed Input
- Real-world example with full input/output

#### 5.{N}.8 Example: Edge Case Handling
- Show graceful degradation example

---

**Formats Documented (by completion order):**
- 5.1 CSV
- 5.2 JSON (minimal, mostly reference)
- 5.3 Plaintext (fallback)
- 5.4 YAML
- 5.5 INI/Properties
- 5.6 NDJSON
- 5.7 Markdown
- 5.8 XML
- 5.9 Logs (pattern-based)
- 5.10 SQL

## 6. CLI Interface Specification

### 6.1 Command Syntax
```
/read-minified <path1> [path2 path3 ...] [flags]
```

### 6.2 Flags Reference Table
- Flag name, alias (if any), default, behavior, examples

### 6.3 Exit Codes
- 0: Success
- 1: No files provided
- 2: File not found
- 3: Access denied

## 7. Implementation Checklist for New Formats

Template for adding a new format:

```
## Adding a New Format: {NAME}

### Step 1: Create Format Handler
- [ ] Create `src/formats/{name}.ts`
- [ ] Implement `is{Name}Valid(content: string): boolean`
- [ ] Implement `parse{Name}(content: string): any`
- [ ] Implement `format{Name}(content: string, options: {minify: boolean}): string`
- [ ] Handle all documented edge cases
- [ ] Graceful degradation to plaintext fallback

### Step 2: Wire Format Detection
- [ ] Add extension mappings to `formatDetector.ts`
- [ ] Update FileFormat union type
- [ ] Update detectFormat() switch statement

### Step 3: Integrate with Main Processing
- [ ] Add format handling to `index.ts` processFile()
- [ ] Test with --cache, --minify flags
- [ ] Verify output format matches spec

### Step 4: Create Test Suite
- [ ] Create `tests/formats/{name}.test.ts`
- [ ] Happy path tests (well-formed input)
- [ ] Missing/extra field tests
- [ ] Malformed input tests
- [ ] Edge case tests (minimum 15-20 tests)
- [ ] Real-world example tests (2-3)
- [ ] Target: >85% coverage for format module

### Step 5: Integration Tests
- [ ] Add examples to `tests/integration.test.ts`
- [ ] Test single file vs. multiple files
- [ ] Test with/without cache
- [ ] Test manifest mode (--no-output)

### Step 6: Documentation
- [ ] Update SPEC with format section (5.{N})
- [ ] Add format to README supported formats list
- [ ] Include example input/output
```

## 8. README.md Restructure

### Current Problem
- Too long
- Mixes conceptual content with deep technical details
- Unclear what's quick-start vs. reference material

### New Structure

**README.md** (Marketing + Quick-Start focus):
```
# /read-minified

[Logo/Badge area]

## What It Does

2-3 paragraph overview with examples

## Quick Start

- Installation
- Basic usage examples (3-4 most common scenarios)
- Supported formats at-a-glance
- Key features bullets

## Installation

Installation instructions

## Flags at a Glance

Quick reference table of main flags

## Examples

- Example 1: Read JSON file
- Example 2: Read CSV with minify
- Example 3: Cache a file
- Example 4: Process multiple files

## Supported Formats

- Supported formats table: Name | Extensions | Description
- "For detailed format specifications, see [Technical Specification](./roadmap/READ_MINIFIED_SPECIFICATION.md)"

## Contributing

How to add new formats (reference checklist in SPEC)

## License

License info

---

**For detailed technical specifications, see [READ_MINIFIED_SPECIFICATION.md](./roadmap/READ_MINIFIED_SPECIFICATION.md)**
```

## 9. Supporting Files

### support/format-implementation-template.md
Template markdown file developers can copy when implementing new format

### support/edge-cases-checklist.md
Checklist of common edge cases to test for any format

### support/format-examples/
Directory with sample files for each format

## Work Breakdown for Restructure Session

### Task 1: Audit Current Implementations
- [ ] Gather all format specs from code comments + tests
- [ ] Document all edge cases discovered
- [ ] Create edge case matrix (format × case type)

### Task 2: Write SPEC Core Sections (1-4)
- [ ] Executive summary
- [ ] Architecture overview (with ASCII diagram if helpful)
- [ ] Type definitions with examples
- [ ] Core components detailed specs

### Task 3: Write Format Specifications (Section 5)
- [ ] CSV (convert test cases to spec format)
- [ ] JSON (minimal reference)
- [ ] Plaintext (fallback)
- [ ] For each format: use test cases as source material
  - Happy path examples from tests
  - Edge cases from test names
  - Examples from real-world test cases

### Task 4: Complete Sections (6-9)
- [ ] CLI interface specification
- [ ] Implementation checklist
- [ ] Supporting documentation

### Task 5: Restructure README
- [ ] Extract quick-start content
- [ ] Remove deep technical content (move to SPEC)
- [ ] Add links to SPEC
- [ ] Review for marketing clarity

### Task 6: Quality Pass
- [ ] All code examples tested
- [ ] All format specs have edge case coverage
- [ ] Cross-references work
- [ ] Table of contents accurate
- [ ] Peer review for clarity

## Success Criteria

- [ ] SPEC is self-contained; someone in another language can implement CSV following only the SPEC
- [ ] README is <2000 words, clear entry point
- [ ] Every format in SPEC references corresponding test cases
- [ ] Implementation checklist tested with next format addition
- [ ] No broken links or examples
- [ ] Edge case coverage documented for all formats

## Notes

- **Data source:** Use test suite as source of truth for edge cases and examples
- **Audience:** Experienced developers, but possibly unfamiliar with TypeScript
- **Tone:** Technical, precise, no unnecessary prose
- **Maintenance:** Update SPEC when adding formats; README stays stable

---

**Scheduled:** After Phase 3 complete (all formats implemented and tested)
**Estimated effort:** 2-3 hours focused documentation work
**Blocks:** None (documentation doesn't block feature work)
