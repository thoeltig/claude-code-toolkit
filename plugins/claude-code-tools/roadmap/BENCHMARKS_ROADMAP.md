# Benchmarks & Performance Comparison Roadmap

## Purpose

Demonstrate the token efficiency and information density gains of /read-minified through measurable, real-world examples. Show users the concrete value: less tokens consumed, better understanding, same data.

## Key Metrics

### 1. Character Count (Reference Only, NOT The Goal)
- **Original file:** Raw character count
- **With --minify:** Whitespace removed
- **With --to-json (if applicable):** Structure converted to JSON
- **Comparison:** `(original - minified) / original * 100%` = % change
- **⚠️ Important:** Character count may INCREASE for some formats (e.g., CSV → JSON adds overhead for key names, colons, quotes)
  - This is NOT a compression tool
  - Character count is provided for reference/transparency only
  - Real benefit comes from token efficiency, not file size

### 2. Token Usage (Claude's Tokenizer)
- **Original file:** Tokens when read as plaintext
- **Minified plaintext:** Tokens after minify only
- **Minified JSON:** Tokens after minified JSON conversion
- **Token savings:** `(original - minified_json) / original * 100%`

### 3. Comprehension/Understanding Efficiency
- **Original:** Time/clarity for Claude to parse and understand
- **Minified JSON:** Time/clarity for Claude to parse structure
- **Difference:** JSON structure vs. parsing noise
- **Metric:** Subjective clarity rating or objective inference quality

### 4. Format Comparison Table
- Show same data in different formats
- Character count per format
- Token count per format
- Which format is most efficient

## Benchmark Examples to Create

### Example 1: CSV Data (Structured)
**Scenario:** Product catalog with 50 items, 8 columns

**Files to benchmark:**
- `products.csv` (original, no headers, varied data)
- With `--minify`
- With `--to-json --minify`
- Alternative format: JSON original
- Alternative format: YAML original

**Measurements:**
```
Format          | Chars | % Δ   | Tokens | % Δ   | JSON? | Why
Original CSV    | 4,250 | -     | 890    | -     | No    | Baseline
CSV --minify    | 3,890 | -8.5% | 780    | -12%  | No    | Remove whitespace
CSV --to-json   | 4,510 | +6%   | 620    | -30%  | Yes   | Key overhead but token-efficient
JSON original   | 5,230 | +23%  | 1,045  | +17%  | Yes   | Verbose, repeated keys
YAML original   | 4,890 | +15%  | 950    | +7%   | No    | Indentation overhead
YAML --to-json  | 3,420 | -20%  | 680    | -24%  | Yes   | Most efficient overall
```

**Key Insight:** CSV → JSON increases character count (+6%) but **DECREASES tokens by 30%**. This is the sweet spot: structured format for better AI understanding + token efficiency, despite slightly larger file size.

### Example 2: Configuration File (INI/YAML)
**Scenario:** Application config file with sections, comments, whitespace

**Files:**
- `app.config` (original with comments)
- INI format original
- INI --to-json --minify
- YAML format original
- YAML --to-json --minify

**Show:** How comments inflate size; how structure helps understanding despite smaller token count

### Example 3: Markdown Documentation
**Scenario:** Technical README with headers, code blocks, tables

**Files:**
- `README.md` (original with formatting)
- Markdown --minify
- Markdown --to-json --minify
- Comparison: Same content as HTML vs. as plaintext

**Show:** Trade-offs between preserving structure (JSON) vs. plaintext compression

### Example 4: Log File (Mixed)
**Scenario:** Application logs, 100 lines with timestamps, levels, messages

**Files:**
- `app.log` (raw syslog format)
- --minify only
- --to-json --minify (parsed)
- Show: Parsed vs. unstructured

**Demonstrate:** How parsing into JSON enables queries/filtering despite smaller size

### Example 5: Complex Nested Data
**Scenario:** XML or nested JSON response (API data)

**Files:**
- `api-response.xml` (original, verbose)
- --minify plaintext
- --to-json --minify (converted to uniform JSON)
- Original JSON (same data)

**Show:** Format conversion efficiency

## Benchmark Output Formats

### Option A: Markdown Table (README/SPEC)
```markdown
## Performance Comparison: Real-World Examples

### Example: Product Catalog (50 items, CSV)

| Metric | Original CSV | +--minify | +--to-json | % Savings |
|--------|-------------|-----------|-----------|-----------|
| Character Count | 4,250 | 3,890 | 3,105 | **27%** |
| Tokens (Claude) | 890 | 780 | 620 | **30%** |
| Readability | Medium | Low | High | ✅ Improved |
| Format | Plaintext | Plaintext | JSON | Structured |
| Use Case | Human | Data size | AI/Claude | Best |

**Insight:** Converting to JSON reduces tokens by 30% while improving structure clarity for AI understanding.
```

### Option B: Detailed Breakdown (benchmarks.md)
```markdown
## Detailed Breakdown: Product Catalog Example

### Original CSV Format
- Character count: 4,250
- Lines: 51 (including header)
- Token count: 890 tokens
- Compression potential: High (whitespace, newlines)
- Format clarity: Good for humans, CSV parsing needed for AI

### After --minify (Plaintext)
- Character count: 3,890 (-8.5%)
- Tokens: 780 (-12.4%)
- Compression: Whitespace/newlines removed
- Readability: Reduced (harder for humans)
- Best for: Bandwidth savings only

### After --to-json --minify
- Character count: 4,510 (+6% - LARGER!)
- Tokens: 620 (-30.3% - MUCH SMALLER!)
- Structure: Object array with named fields
- Parsing: None needed (JSON native)
- Comprehension: Claude understands without parsing effort
- **Trade-off:** Slightly larger file, dramatically fewer tokens
- **Why:** JSON key overhead (e.g., `"sku":"SKU001"` vs. just `SKU001`) adds characters, but tokens count structure+content efficiently
- Best for: AI reading/understanding (token efficiency trumps file size)

### Comparison: Alternative Formats (Same Data)

JSON (Original):
- Characters: 5,230
- Tokens: 1,045
- Why: Verbose key names repeated, whitespace
- vs. CSV minified: +24% tokens

YAML (Original):
- Characters: 4,890
- Tokens: 950
- Why: Readable but indentation overhead
- vs. CSV minified: +22% tokens

YAML (--to-json):
- Characters: 3,420
- Tokens: 680
- Why: Structure without overhead
- vs. CSV minified: **-13% tokens better**
```

### Option C: Token Analysis Table (Advanced)
```markdown
## Token Efficiency Breakdown

Understanding WHERE tokens are used helps explain the savings:

| Component | Original CSV | Minified JSON | Explanation |
|-----------|-------------|---------------|------------|
| Headers/Keys | 120 | 85 | Repeated key names (u1 vs. full text) |
| Whitespace | 245 | 0 | No formatting overhead |
| Delimiters | 85 | 80 | CSV commas vs. JSON colons |
| Content | 440 | 455 | Data unchanged |
| **Total** | **890** | **620** | **30% savings** |

**Key insight:** Minification saves tokens by eliminating formatting overhead, while JSON structure adds minimal tokens (1 char per key reference).
```

## Benchmark Methodology

### Tools & Approach

1. **Character counting:** Simple string length (Python `len()`)
2. **Token counting:** Use Claude API's token counter or Anthropic SDK
   ```python
   from anthropic import Anthropic
   client = Anthropic()

   def count_tokens(text):
       # Use /messages API to estimate tokens
       response = client.messages.count_tokens(text)
       return response.tokens
   ```

3. **Real-world files:** Use actual data, anonymized if needed
4. **Multiple runs:** Average results (account for tokenizer variations)
5. **Reproducibility:** Include exact file contents in appendix

### Fairness Considerations

- **Same content:** Compare identical information in different formats
- **Fair comparison:** Don't optimize one format vs. others
- **Representative examples:** Use typical, real-world files (not worst-case)
- **Format-agnostic:** Show each format's best case
- **Transparent:** Include file contents so results are reproducible

## Content Placement Strategy

### Placement 1: README (Summary Table)
- 1-2 best examples showing token savings
- Quick visual impact
- "For detailed benchmarks, see [Benchmarks](./benchmarks.md)"

### Placement 2: benchmarks.md (Deep Dive)
- All 5 examples with full breakdowns
- Methodology explanation
- Token analysis tables
- Real file contents in appendix
- Updated with new Claude versions

### Placement 3: SPEC (Integration)
- Brief mention: "See benchmarks.md for performance analysis"
- Philosophy section references token efficiency
- Each format includes example benchmark numbers

## Benchmark File Structure

```
benchmarks/
├── benchmarks.md              # Main benchmark document
├── examples/
│   ├── products.csv          # Original
│   ├── products.csv.compact  # Minified
│   ├── app.config            # Original
│   ├── app.config.json       # Converted
│   ├── README.md             # Original markdown
│   ├── README.json           # Converted
│   ├── app.log               # Original logs
│   └── app.log.json          # Parsed logs
└── token-counts.json         # Cached token counts (reference)
```

## Implementation Timeline

### Phase 1: Create Benchmark Framework (Next Session)
- [ ] Set up token counting script
- [ ] Gather/create 5 real-world example files
- [ ] Run benchmarks, document methodology
- [ ] Create benchmarks.md template

### Phase 2: Execute Benchmarks (After Formats Stable)
- [ ] Run all 5 examples through latest formats
- [ ] Measure with Claude's current tokenizer
- [ ] Create comparison tables
- [ ] Write explanations

### Phase 3: Integrate into Documentation
- [ ] Add summary table to README
- [ ] Link to full benchmarks.md
- [ ] Update SPEC with performance notes
- [ ] Include in "Why use this?" section

### Phase 4: Maintenance
- [ ] Re-benchmark with new Claude versions
- [ ] Add new examples as requested
- [ ] Track tokenizer efficiency improvements
- [ ] Update README with latest numbers quarterly

## Example: Real-World Output

**README Summary (condensed):**
```markdown
## Performance: Real-World Impact

### Example: Product Catalog (CSV → JSON)
Typical use case: Reading a 50-item product catalog for AI analysis.

**Token Efficiency (The Real Benefit):**
- Original CSV: 890 tokens
- With --minify --to-json: **620 tokens** (-30% tokens!)
- File size: increases slightly (+6%) but tokens plummet

**What this means:**
- 30% fewer tokens consumed = faster Claude API calls, lower costs
- Structured JSON = better AI understanding, no parsing effort needed
- Trade-off: Slightly larger file (+6%) for dramatically better token efficiency
- No quality loss: same product data, better format for AI reading

**Real Use Case:** The 6% larger file costs you nothing. The 30% token savings saves real money and improves understanding.

[→ See full benchmarks for 5 real-world examples](./benchmarks.md)
```

## Success Criteria

- [ ] 5+ real-world examples benchmarked
- [ ] Token counts verified and reproducible
- [ ] Methodology transparent and documented
- [ ] Comparisons fair across formats
- [ ] README summary compelling and concise
- [ ] benchmarks.md is complete technical reference
- [ ] Examples include file contents (appendix)
- [ ] Maintenance plan established

## Notes

- **Token counting:** Use Anthropic SDK when available; manual count if needed
- **Reproducibility:** Store example files in repo, include exact content in benchmarks.md
- **Format changes:** Update benchmarks if processing logic changes significantly
- **Claude versions:** Re-run with new major Claude releases (note version in benchmarks)
- **Audience:** Show tokens for technical credibility (cost/efficiency story)

---

**Scheduled:** After initial format implementations (Phases 1-2 complete)
**Effort:** 2-3 hours for data gathering, running benchmarks, writing
**Maintenance:** Quarterly or with major updates
**Value:** Concrete proof of ROI for users
