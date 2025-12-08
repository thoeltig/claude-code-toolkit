# Phase 3 Roadmap: Medium Complexity Formats

**Target Version**: v0.3.0.0
**Estimated Session**: Session N+2
**Status**: Planning

## Current Status

✅ **Phase 1-2 Complete**:
- Core infrastructure: minifier, cache, fileHandler, outputFormatter
- 6 format handlers: JSON, CSV, YAML, INI, NDJSON, Markdown
- 266 passing tests | 88.53% coverage
- Full `--minify` and `--to-json` flag support for all formats

## Strategic Format Priorities

### Phase 3: Low-Hanging Fruit with Medium Complexity

These formats have moderate parsing complexity but strong utility for common use cases.

#### XML (Most Valuable - High Priority)

**Why**:
- Legacy data export format
- Configuration files (e.g., Maven POM, web.config)
- API responses in enterprise systems
- Data interchange in older systems

**Difficulty**: High (nested elements, attributes, namespaces, mixed content)

**Conversion Strategy**:
- Elements → objects/arrays
- Attributes → `_attributes` object
- Mixed text+elements → `_text` + element keys
- Namespaces → include in key name (e.g., `ns:tag`)
- CDATA sections → treat as string content
- Comments → skip or collect in `_comments`

**Output Examples**:
```json
{
  "root": {
    "_attributes": {"version": "1.0"},
    "item": [
      {"_text": "First item", "_attributes": {"id": "1"}},
      {"_text": "Second item", "_attributes": {"id": "2"}}
    ]
  }
}
```

**Edge Cases**:
- Malformed XML (attempt partial parse)
- Self-closing tags (`<tag/>`)
- Nested namespaces
- Deeply nested elements (performance)
- Mixed content (text + child elements)

**Tests**: ~25 test cases covering:
- Basic parsing (elements, attributes, nesting)
- Namespaces and prefixes
- Mixed content and CDATA
- Malformed XML graceful degradation
- Real-world examples (Maven POM, SOAP response)

#### HTML (Medium Priority)

**Why**:
- Static HTML files
- Exported content
- Email templates
- Web content parsing

**Difficulty**: High (more lenient than XML, complex DOM structure)

**Conversion Strategy - Two Approaches**:

**Option A: Text Extraction** (simpler)
- Extract plain text content only
- Strip all tags and attributes
- Join text nodes
- Useful for content-only use cases

**Option B: Structured JSON** (more complex)
- Preserve element hierarchy
- Keep semantically important attributes (id, class, data-*)
- Create structured representation

**Decision**: Implement both, let `--to-json` flag handle text extraction

**Edge Cases**:
- Unclosed tags (auto-close)
- Script/style content (skip or preserve)
- HTML entities (`&nbsp;`, `&amp;`)
- Malformed nesting
- Comments and doctype

**Tests**: ~15 test cases for text extraction, ~15 for structured JSON

---

## Phase 3 Implementation Plan

### Session N+2: XML + HTML (Low-Hanging Fruit)

**Task Breakdown (Priority Order)**:

1. **XML Format Handler** (2-3 hours)
   - `src/formats/xml.ts` with DOM-like parsing
   - Handle attributes, namespaces, mixed content
   - 25+ test cases covering edge cases
   - Update `formatDetector.ts` for `.xml` extension
   - Route in `index.ts`

2. **HTML Text Extraction** (1-2 hours)
   - `src/formats/html.ts` with text-only extraction
   - Strip tags, join text nodes
   - Handle entities
   - 15+ test cases

3. **HTML Structured JSON** (2-3 hours) - Optional for this session
   - Extend `html.ts` for structured JSON output
   - Preserve hierarchy, semantic attributes
   - 15+ test cases
   - Can defer to Phase 4 if time-constrained

4. **Integration & Testing** (1 hour)
   - Update integration tests with XML + HTML examples
   - Run full test suite (target: >85% coverage maintained)
   - Validate graceful degradation

**Success Criteria**:
- All new tests passing (40+ minimum)
- Coverage ≥85%
- Edge case graceful degradation verified
- At least 2 real-world examples per format tested

### Session N+3: Specialized Formats (Phase 4)

**Planning for future**:
- **Log Files** - Pattern-based parsing (very complex)
- **SQL** - Statement parsing (complex grammar)

These require more sophisticated parsing and pattern detection. Consider for Phase 4.

---

## Architecture Notes

**For XML/HTML handlers**:
- Use similar structure to existing handlers (separate functions for validation, parsing, formatting)
- Implement error recovery for malformed input
- Preserve graceful degradation pattern (parse error → minified plaintext)

**Format Detection**:
```typescript
case '.xml': return 'xml';
case '.html': case '.htm': return 'html';
```

**Routing in index.ts**:
```typescript
} else if (format === 'xml' && options.toJson) {
  const xmlJson = formatXml(minifiedContent, { minify: true });
  processedContent = JSON.parse(xmlJson);
} else if (format === 'html' && options.toJson) {
  const htmlJson = formatHtml(minifiedContent, { minify: true });
  processedContent = JSON.parse(htmlJson);
}
```

---

## Field Naming & Standards

**Preserve from v0.2.0.0**:
- Unknown/extra fields: `u1, u2, u3...` (for CSV, etc.)
- Consistent JSON output across all formats
- Minified by default; `--no-minify` to preserve whitespace

**New for XML/HTML**:
- Attributes: `_attributes` object
- Text content: `_text` key (when mixed with child elements)
- Comments: `_comments` array (if preserved)
- Namespaced elements: `ns:tagName` format

---

## Testing Strategy

**Test Pattern** (from Phase 1-2):
1. Happy path: well-formatted standard examples
2. Edge cases: malformed input, empty elements, special characters
3. Real-world examples: 2-3 actual use cases per format
4. Graceful degradation: invalid input produces structured error

**File Organization**:
```
src/formats/
├── xml.ts ← NEW
├── html.ts ← NEW
└── (existing handlers)

tests/formats/
├── xml.test.ts ← NEW
├── html.test.ts ← NEW
└── (existing tests)
```

---

## Known Unknowns & Decisions

1. **HTML structured JSON**: Defer to Phase 4 if time-constrained. Start with text extraction only.
2. **Namespace handling in XML**: Simple approach (prefix:tag in key name) vs. nested objects? Keep simple.
3. **HTML entity decoding**: Yes, decode to preserve semantics (`&nbsp;` → space)
4. **Script/style content in HTML**: Skip during text extraction to avoid JS/CSS noise

---

## Notes for Next Session

- **Don't re-architect**: Current module structure works well
- **Test-first approach**: Write edge cases before implementation
- **Graceful degradation**: Always attempt parsing; never crash
- **Token efficiency**: Minify is default; users opt-out with flags
- **Real-world testing**: Include actual XML config files and HTML pages
- **Performance check**: Deeply nested XML shouldn't cause timeouts

---

**Last Updated**: 2025-12-08
**Session Completed**: Phase 1-2 (YAML, INI, NDJSON, Markdown)
**Next Session Focus**: Phase 3 (XML, HTML) - v0.3.0.0
