# Phase 3.2 Roadmap: HTML Format Handler

**Target Version**: v0.3.1.0
**Estimated Session**: Session N+3
**Status**: Planning
**Previous**: Phase 3.1 (XML) - Completed

---

## Overview

HTML parsing builds on XML foundation with additional semantic understanding and visual tag stripping. Unlike standard XML (which is purely semantic), HTML contains both semantic tags and presentation-only tags that add visual formatting but no information density.

**Key Difference from XML:**
- XML: All tags are semantic (preserved as-is)
- HTML: Mixed semantic + presentation tags (selective stripping)

---

## Design Philosophy

**What to Keep:**
- Structural tags: `<h1>`-`<h6>`, `<p>`, `<section>`, `<article>`, `<div>` (with semantic attributes)
- Semantic tags: `<code>`, `<pre>`, `<kbd>`, `<strong>`, `<em>` (context-dependent meaning)
- List structure: `<ul>`, `<ol>`, `<li>` (hierarchy matters)
- Table structure: `<table>`, `<tr>`, `<td>`, `<th>` (tabular data)
- Semantic attributes: `class`, `id`, `data-*` (custom semantics)

**What to Strip:**
- Presentation-only: `<b>`, `<i>`, `<u>` (pure visual styling)
- Generic containers without semantics: `<span>` (when no class/id/data-*)
- Layout: `<br>`, `<hr>` (spacing, not content)
- Metadata: `<script>`, `<style>` (not user-facing content)
- Font styling: `<font>`, `<color>` (deprecated HTML)

**Text Merging:**
When stripping a tag, merge its text content into the parent element. Example:
```html
<p>Start <b>bold</b> end</p>
```
Becomes:
```json
{
  "p": "Start bold end"
}
```
Note: With the flattened XML format, simple text content is stored as direct values (no `_text` wrapper). The `_text` field only appears in mixed content scenarios (text alongside element nodes).

---

## Parsing Strategy

### Approach: Reuse XML Parser + Add Semantic Rules

1. **Parse HTML as XML** (use existing `parseXml()` as base)
   - HTML is mostly valid XML (with lenient tag closing)
   - Handle unclosed tags: `<p>`, `<li>`, `<tr>`, `<td>`, `<dd>`, `<dt>`, `<br>`, `<hr>`, `<img>`, `<input>`

2. **Filter Presentation Tags** during JSON conversion
   - Check tag name against stripping list
   - Check for semantic attributes (`class`, `id`, `data-*`)
   - If presentation-only: merge text into parent, discard tag

3. **Generate Semantic Structure** for specific tags
   - `<h1>`-`<h6>`: Include level information
   - `<ul>`/`<ol>`: Preserve ordered distinction
   - `<li>`: Keep list structure
   - `<table>`: Create structured table objects with rows

### Example Transformation

**Input HTML:**
```html
<article>
  <h1>Title</h1>
  <p>Start <b>bold</b> text with <code>function()</code> here.</p>
  <section>
    <h2>Subsection</h2>
    <ul>
      <li>First item</li>
      <li>Second <u>underlined</u> item</li>
      <li>Third item</li>
    </ul>
  </section>
  <table>
    <tr>
      <th>Name</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>foo</td>
      <td>123</td>
    </tr>
  </table>
</article>
```

**Output JSON:**
```json
{
  "article": {
    "h1": "Title",
    "p": {
      "_text": "Start bold text with here.",
      "code": "function()"
    },
    "section": {
      "h2": "Subsection",
      "ul": {
        "li": [
          "First item",
          "Second underlined item",
          "Third item"
        ]
      }
    },
    "table": {
      "_structure": "table",
      "rows": [
        [{"_type": "header", "_text": "Name"}, {"_type": "header", "_text": "Value"}],
        [{"_text": "foo"}, {"_text": "123"}]
      ]
    }
  }
}
```

**Key differences from nested approach:**
- Element text is stored as direct value (e.g., `"h1": "Title"` instead of `"h1": {"_text": "Title"}`)
- Attributes use `attribute_` prefix: `"attribute_id": "value"`
- `_text` field only appears in mixed content (text + elements at same level)
- Reduces JSON size by ~60-70% vs nested format, enabling better token efficiency

---

## Presentation Tag Stripping Rules

### Tags to Always Strip

| Tag | Reason | Merge Behavior |
|-----|--------|---|
| `<b>`, `<strong>` | Visual emphasis (but merge to parent) | Yes |
| `<i>`, `<em>` | Visual emphasis (but merge to parent) | Yes |
| `<u>` | Visual underline | Yes |
| `<font>`, `<color>` | Deprecated styling | Yes |
| `<span>` | Only if no `class`, `id`, `data-*` | Yes |
| `<br>` | Line break (layout) | No (discard, keep space) |
| `<hr>` | Horizontal rule (layout) | No (discard) |
| `<script>` | Metadata | No (discard) |
| `<style>` | Metadata | No (discard) |

### Tags to Preserve

| Tag | Reason |
|-----|--------|
| `<h1>`-`<h6>` | Structural (heading hierarchy) |
| `<p>` | Structural (paragraph) |
| `<code>`, `<pre>`, `<kbd>` | Semantic (code content) |
| `<strong>` with semantic intent | Informational |
| `<em>` with semantic intent | Informational |
| `<section>`, `<article>`, `<nav>`, `<aside>` | Structural |
| `<blockquote>` | Semantic (quoted content) |
| `<div>` | If has `class`, `id`, or `data-*` |
| `<span>` | If has `class`, `id`, or `data-*` |
| Anything with semantic attrs | Preserve with attributes |

---

## Implementation Details

### Phase 3.2a: Basic HTML Handler (20 tests)

```typescript
export function isValidHtml(content: string): boolean {
    return content.trim().length > 0;
}

export function parseHtml(htmlContent: string): any {
    // 1. Parse as XML (use parseXml() from xml.ts)
    // 2. Filter presentation tags during conversion
    // 3. Return merged JSON structure
}

export function formatHtml(rawContent: string, options: { minify: boolean }): string {
    // 1. Call parseHtml()
    // 2. Format as JSON (minified or pretty)
    // 3. Return minified JSON
}
```

**Test Coverage (20 tests):**
- Basic elements: `<p>`, `<h1>`, `<div>` (5 tests)
- Presentation stripping: `<b>`, `<i>`, `<span>` (5 tests)
- List structure: `<ul>`, `<ol>`, `<li>` (3 tests)
- Semantic attributes: `class`, `id`, `data-*` (3 tests)
- Mixed content preservation (2 tests)
- Malformed HTML graceful degradation (2 tests)

### Phase 3.2b: Semantic Structure + Tables (20 tests)

```typescript
interface HtmlTable {
    _structure: 'table';
    rows: Array<Array<{_type?: string, _text: string}>>;
}
```

**Test Coverage (20 tests):**
- Heading hierarchy levels (4 tests)
- Table parsing: headers, rows, cells (6 tests)
- Nested structures: section > h2 > p > code (4 tests)
- Edge cases: missing `<tbody>`, colspan/rowspan (3 tests)
- Real-world examples: HTML documents (3 tests)

### Phase 3.2c: Output & Integration (optional for this session)

**Test Coverage (if time permits):**
- Pretty vs minified output (2 tests)
- Error handling and malformed HTML (3 tests)
- Integration tests with real HTML pages (3 tests)

---

## Unclosed Tag Handling

HTML allows unclosed tags. Need to handle gracefully:

```html
<p>Paragraph 1
<p>Paragraph 2
<li>Item 1
<li>Item 2
```

**Solution:** Track auto-closeable tag list, close them when encountering:
- Same tag opening (e.g., `<p>` inside `<p>`)
- Parent closing tag
- Different block-level tag

```typescript
const AUTO_CLOSE_TAGS = new Set(['p', 'li', 'tr', 'td', 'th', 'dd', 'dt']);
```

---

## Real-World Test Cases (Planned)

1. **Blog Post HTML** - Headings, paragraphs, code blocks
2. **Documentation Page** - Sections, nested lists, tables
3. **Email Template** - Divs with classes, styling stripped
4. **Wikipedia-like Content** - Complex nesting, citation markup
5. **Bootstrap Component** - Heavy class attributes, semantic structure

---

## Session Outcomes

**Expected Results:**
- ✅ 30-40 total tests (all passing)
- ✅ >85% coverage for HTML handler
- ✅ Handles common HTML patterns (blog posts, docs, templates)
- ✅ Graceful degradation for malformed HTML

**To Discuss Next Session:**
1. Example HTML transformations with different complexity levels
2. Edge cases discovered during implementation
3. Performance characteristics (large documents, deep nesting)
4. Whether to include table `colspan`/`rowspan` handling

---

## Notes for Implementation

- **Don't over-engineer:** HTML is messier than XML; graceful degradation is more important than perfect parsing
- **Text merging:** When stripping `<b>Bold</b>`, ensure text "Bold" is preserved in parent
- **Semantic attributes:** Preserve `class`, `id`, `data-*` always; they define semantics
- **Real-world focus:** Prioritize common HTML patterns over edge cases
- **Test-first:** Write edge case tests before implementation to define behavior

---

**Readiness Check:**
- [x] Design finalized
- [x] Semantic rules documented
- [x] Examples provided
- [ ] Implementation (next session)
- [ ] Testing and discussion (next session)

Last Updated: 2025-12-08
