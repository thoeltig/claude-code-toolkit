# Session 3 Handoff - Question Redesign & Format Expansion

**Date:** 2025-12-12
**Status:** ✅ Phase 3 Prep Complete - Ready for Testing

---

## Phase 2 Critical Findings (Summary)

### The Efficiency-Accuracy Paradox

**Efficiency Rankings (theoretical best):**
- CSV Compact (parsed): 0.492 tokens/char (-41% vs CSV)
- JSON Compact: 0.509 tokens/char (-39% vs CSV)
- JSON Pretty: 0.688 tokens/char
- CSV native: 0.833 tokens/char

**Accuracy Results (all formats fail complex tasks):**
- CSV: 34% overall (100% field retrieval, 3% aggregation, 5% filtering)
- JSON Compact: 26% overall
- JSON Pretty: 25% overall
- CSV Compact: 31% overall

### Root Cause Analysis

**Problem identified:** Subagents attempted script generation instead of direct calculation
- Field retrieval: 100% accurate (direct lookups work)
- Aggregation: 0-3% accurate (calculation logic broken)
- Filtering: 5% accurate (counting logic broken)
- Complex reasoning: 0-40% accurate

**Not a format problem** - all formats fail equally on calculations.

---

## Session 3 Improvements

### 1. Question Redesign (COMPLETED)

**Problem:** Questions were 5-10 words, terse, essentially pattern-matching
**Solution:** Rewrite questions to be natural language, 15-25 words, with context

**Before (Bad):**
```
"What is the total stock quantity across all products?"
→ Too terse, direct statement of what to calculate
```

**After (Better):**
```
"Our warehouse manager needs to know the total amount of inventory we currently have
in stock across our entire product line. Looking at all products, what is the combined
stock quantity?"
→ Natural language, contextual, still clear about what's needed
```

**Updated Question Categories:**
- **Field Retrieval (30 questions):** Added context like "I need to look up...", "We're auditing...", "I'm checking..."
- **Aggregation (30 questions):** Added business context: "For pricing strategy", "For warehouse management", "For cost analysis"
- **Filtering (20 questions):** Added use cases: "stock recount", "compliance tracking", "shipping analysis"
- **Advanced categories (76 questions):** Already complex, kept as-is

**Generation:**
- Updated `generate.js` with new question templates
- Regenerated all 156 questionnaires with improved questions
- All answer keys and templates regenerated
- Format: ~20 words average per question (vs 5 before)

### 2. Subagent Prompt Enhancement (COMPLETED)

**Added explicit script prohibition (Version A approach):**
```
NEVER:
- Write scripts, code, pseudocode, or attempt to create programs
- Do NOT write Python, JavaScript, SQL, or any code
- Do NOT use pseudocode or algorithm descriptions
- Analyze and answer directly through reasoning only

ALWAYS:
- Perform calculations and filtering directly without coding
```

**Rationale:** Prevent the script generation attempts that caused Phase 2 failures

**Future:** Can test Version B (single script allowed) if Version A doesn't improve

### 3. Compressed JSON Format (READY TO TEST)

**File:** `C:\Users\ThoreHöltig\Documents\ClaudeCodeToolkit\plugins\claude-code-tools\benchmarking\benchmarking\data\json_100_pretty.moon.json`

**Compression Stats:**
- Original: 71,628 chars (json_100_pretty.json)
- Compressed: 21,209 chars
- Reduction: 50,419 chars (70.39% smaller!)
- Format: Still valid 100% JSON, just restructured

**Hypothesis:**
- Compression reduces whitespace AND restructures data
- May improve readability for models
- Worth testing: Does 70% size reduction offset any parsing overhead?

---

## Phase 3 Testing Plan (READY TO EXECUTE)

### Test Matrix

```
Test 1: CSV 100% - New Verbose Questions
- Data: benchmarking/data/csv_100.csv (37KB)
- Questions: benchmarking/questionnaires/csv_100.json (156 new verbose questions)
- Prompt: Version A (no scripts)
- Measure: Accuracy by category (should improve from 34%)

Test 2: JSON Compact 100% - New Verbose Questions
- Data: benchmarking/data/json_100_compact.json (81KB)
- Questions: benchmarking/questionnaires/json_100.json (156 new verbose questions)
- Prompt: Version A (no scripts)
- Measure: Accuracy by category (should improve from 26%)

Test 3: JSON Compressed 100% - New Verbose Questions
- Data: benchmarking/data/json_100_pretty.moon.json (21KB) ← NEW FORMAT
- Questions: benchmarking/questionnaires/json_100.json (156 new verbose questions)
- Prompt: Version A (no scripts)
- Measure: Accuracy by category + token efficiency
- Compare: vs JSON Pretty (71KB, 25% accuracy)
```

### Execution Steps

1. **Read-only tests** (same as Phase 2)
   - Measure token cost per format
   - Compare: CSV vs JSON Compact vs JSON Compressed

2. **Full analysis tests** (new)
   - Invokecsubagents with verbose questions
   - No-script prompt Version A
   - Document token usage, time, accuracy

3. **Validation** (same methodology)
   - Run validate.js on each answer set
   - Compare accuracy by difficulty tier:
     - Easy (field retrieval): expect 90%+
     - Medium (aggregation/filtering): hope for 50%+ (up from 3-5%)
     - Hard (complex reasoning): expect 30-50%+

### Success Criteria

**Minimum acceptable improvement:**
- Field retrieval: maintain 100% (should not regress)
- Aggregation: improve to 30%+ (from 0-3%)
- Filtering: improve to 25%+ (from 5%)
- Overall: 40%+ (from 25-34%)

**Format winner determination:**
- CSV with improved questions likely to win on accuracy
- JSON Compressed interesting wildcard (70% size reduction)
- JSON Compact for speed (already measured as 1m 3s vs 4m 50s)

---

## Files Modified

### Core Changes
1. **generate.js** - Question templates now verbose + natural language
2. **SUBAGENT_PROMPT.md** - Added explicit script prohibition
3. **Questionnaires** - All 12 files regenerated with 156 new questions each

### New Test Data Available
- `benchmarking/data/json_100_pretty.moon.json` - Compressed JSON (21KB)
- All answer keys updated
- All templates regenerated

### Git Status
- All changes checked into git
- Safe to rollback if needed
- Branch: feature/ReadMinified_SlashCommand

---

## Key Insights

### Question Quality Impact
- Verbose, natural language questions ≠ easier → still require real analysis
- Context helps models understand **intent** vs just seeing keywords
- Field name extractability from context (not explicit markers) is important

### Format Considerations
- CSV vs JSON format question **secondary** to question quality
- JSON compression aggressive (70%!) - worth testing
- Even best format (JSON Compact at 0.509 tokens/char) useless if accuracy fails

### Prompt Engineering
- "Don't write scripts" is explicit guard rail
- Models may struggle with direct calculation vs code-based approach
- Need to monitor if Version A improves or if Version B (allowed script) needed

---

## Next Session Checklist

- [ ] Run read-only tests for CSV, JSON Compact, JSON Compressed
- [ ] Document token usage per format
- [ ] Run analysis tests with improved questions + no-script prompt
- [ ] Validate all answer sets
- [ ] Compare accuracy improvements vs Phase 2
- [ ] Determine if question redesign fixed aggregation/filtering issues
- [ ] Evaluate JSON Compressed format ROI
- [ ] If accuracy still fails: decide on Version B (script allowed) test
- [ ] Update BENCHMARK.md with Phase 3 results
- [ ] Formulate final conclusions on format selection

---

## Data Locations

```
Test Data:
- CSV 100: benchmarking/data/csv_100.csv (37KB)
- JSON Compact: benchmarking/data/json_100_compact.json (81KB)
- JSON Compressed: benchmarking/data/json_100_pretty.moon.json (21KB) ← NEW

Questionnaires:
- All formats: benchmarking/questionnaires/csv_100.json, json_100.json, etc.
- Answer keys: benchmarking/questionnaires/*_answer_key.json
- Templates: benchmarking/answers/*_template.json

Subagent Output:
- Will save to: benchmarking/subagent_output/*_baseline_answers.json

Prompt:
- Updated: benchmarking/SUBAGENT_PROMPT.md (no scripts version)
```

---

## Session 3 Summary

**Status:** ✅ Complete - Ready for Phase 3 Testing
**Prep Work:** Question redesign + prompt enhancement
**Key Change:** Questions now 15-25 words with business context
**New Test:** JSON Compressed format (70% size reduction)
**Next:** Execute read-only and analysis tests, validate results

**Estimated Next Session Duration:** 30-45 minutes for tests + analysis

---

**Ready to begin Phase 3 testing in next session**
