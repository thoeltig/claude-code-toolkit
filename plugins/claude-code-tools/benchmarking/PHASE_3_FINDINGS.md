# Phase 3 Benchmarking Results - Comprehensive Findings

**Date:** 2025-12-12
**Focus:** Question Redesign + Prompt Enhancement Testing
**Models Tested:** Haiku 4.5 (baseline), Claude Sonnet (comparison)
**Data Formats:** CSV 100, JSON Compact 100, JSON Moon (3 compression variants)

---

## Executive Summary

**Overall Results:**
- CSV 100 (Haiku): **50%** (78/157 correct)
- JSON Compact 100 (Haiku): **45%** (70/157 correct)
- JSON Moon - Improved 48% compression (Haiku): **47%** (74/157 correct)
- JSON Moon - Less aggressive 34% compression (Haiku): **48%** (75/157 correct)
- JSON Moon - Improved 48% compression (Sonnet): **46%** (72/157 correct)

**Key Finding:** Version A prompt (no scripts) improved filtering performance but **calculation accuracy remains fundamentally broken** across all formats and models.

---

## Critical Performance Issues by Category

### 🔴 Catastrophic Failures (0% Accuracy)

**Edge Cases (0/5 for Haiku, 0/5 for Sonnet)**
- Q109: Excluding zero-stock products from average calculation
- Q110: Percentage calculation of discontinued products
- Q111: Finding smallest category
- Q112: Counting products without rating information
- Q113: Counting products that are both hazardous AND fragile

**Root Cause:** Models cannot perform conditional aggregations or handle null/missing value logic.

**Hypothetical Scenarios (0/5 for both models)**
- Q117: Total cost if discontinued products removed
- Q118: New average price if increased by 10%
- Q119: Total weight if hazardous products tripled
- Q120: Total inventory value (stock × cost)
- Q121: Products below reorder point

**Root Cause:** Models struggle with sequential "what-if" calculations requiring multiple steps.

**Temporal Reasoning (0/3 for Haiku, 0/3 for Sonnet)**
- Q144: Products restocked within last 30 days
- Q145: Products not restocked in 90+ days
- Q146: Average age of last restock (days)

**Root Cause:** Date arithmetic and relative comparisons fail consistently.

### 🟠 Severe Failures (5-20% Accuracy)

**Advanced Analysis (14-21% for Haiku, 7% for Sonnet)**
- Q122: Average rating of products above average price (38% vs expected 3.2)
- Q123: Category with highest profit margin ratio
- Q125: Products >5x reorder point (Haiku: 48 vs 131, Sonnet: 48 vs 131)
- Q127: High-value fragile items (3 vs 13, Sonnet even worse)
- Q133-135: Revenue/profit calculations (wildly wrong magnitudes)

**Issue:** Advanced calculations involving multiple conditions fail; magnitudes off by 100x+

**Statistical Analysis (13-38% for Haiku, 13% for Sonnet)**
- Q138: Products with above-average stock turnover (75 vs 27)
- Q139: Median cost price (1357.83 vs 1369.41) - close but not exact
- Q140: Coefficient of variation percentage (62.84% vs 61.17%)
- Q142: Percentage of products below average pricing (49.33% vs 54%)
- Q143: Products with thin margins <50% cost (59 vs 80)

**Issue:** Percentage and ratio calculations imprecise; statistical concepts misunderstood

**Multi-step Reasoning (20% for Haiku, 40% for Sonnet)**
- Q104: Products no stock + price > average (Haiku: correct, Sonnet: correct)
- Q105: Electronics with above-average stock (Haiku: 14 vs 15, Sonnet: 8 vs 15)
- Q106: Products profitable AND fragile (37 vs 28, Sonnet: 37 vs 28)
- Q107: Profit margin >150% of average (75 vs 64, Sonnet: 75 vs 64)
- Q108: Supplier with most fragile products (14 vs 11, Sonnet: 11 vs 11)

**Issue:** Conditional counting breaks; average calculations used incorrectly

### 🟡 Moderate Failures (35-50% Accuracy)

**Aggregation (35-39% for both models)**

**Pattern of Failures:**
- Sums consistently off by 2-7% (Q31: 381,698 vs 359,335)
- Averages missing decimal places or inverted math
- Min/Max for weights return product IDs instead of values (Q37-Q38: "PROD-000063" vs 1.99)
- Shelf life calculations massively wrong (Q58-Q60)

**Specific Problem Questions:**
- Q31: Total prices (381,698 vs 359,335) - **6% error**
- Q32: Average price (2544.66 vs 2395.57) - **6% error**
- Q35: Combined weight (36,958 vs 37,834) - **2% error**
- Q37: Lowest weight (returns "PROD-000063" - wrong field!)
- Q38: Highest weight (returns "PROD-000084" - wrong field!)
- Q39: Sum stock quantities (751,430 vs 694,505) - **8% error**
- Q47: Sum cost prices (189,050 vs 196,556) - **4% error**
- Q58-60: Shelf life calculations (157,835 vs 156,695, returns 165 for min when expecting 0)

**Root Cause:** Models calculate sums/averages with rounding errors; lose track of which field they're aggregating; return wrong field values entirely

**Filtering (42-58% accuracy depending on compression)**

**Improved Performance with Moon (58%):**
- Q64: Hazardous count (improved compression: 28 vs 31)
- Q66: Fragile count (improved: 42 vs 39)
- Q68: Electronics category (improved: 19 vs 34)
- Q72: Singapore location (improved: 25 vs 35)

**Still Failing Consistently:**
- Q78: Specific date filtering (3 vs 4, off by 1)
- Q80-81: Date range filtering (mostly correct)
- Q86-99: Structure awareness mostly passes

**Issue:** Exact counting for specific conditions unreliable; format impacts performance

---

## Worst Performing Questions (Top 20 Failures)

| Q# | Category | Expected | Got (Haiku) | Error Type | Root Cause |
|---|----------|----------|------------|-----------|-----------|
| Q110 | edge_case | 10 | "7 products are discontinued which is 4.67%" | Format + calc | Percentage calculation, verbose answer |
| Q120 | hypothetical | 915329222.94 | 6318943587.51 | Magnitude | Inventory value calc off by 6.8x |
| Q144 | temporal | 57 | 9 | Date math | Cannot calculate days since date |
| Q153 | adversarial | 112607173.79 | 9019.76 | Magnitude | Dead inventory cost 12.5x wrong |
| Q146 | temporal | 43 | 76.01 | Calculation | Average days wrong entirely |
| Q119 | hypothetical | 54488.65 | 42009.65 | Calculation | Weight multiplication off by 22% |
| Q127 | advanced | 13 | 3 | Complex filter | High-value fragile items way off |
| Q125 | advanced | 131 | 48 | Complex filter | Overstocked items (>5x) miscount |
| Q145 | temporal | 2 | 0 | Date range | Date comparison fails |
| Q133 | advanced | 1693809499.19 | 19096836.05 | Magnitude | Revenue potential 88x too small |
| Q135 | advanced | 778480276.25 | 12777892517.54 | Magnitude | Profit potential off by 16x |
| Q124 | advanced | 0 | 0 | -- | CORRECT but rare |
| Q138 | statistical | 27 | 75 | Logic | Inverted or miscounted |
| Q142 | statistical | 54 | "49.33%" | Format | Percentage format instead of count |
| Q129 | advanced | 66.12 | "20.15%" | Format | Returns percentage, expects decimal |
| Q148 | correlation | 4 | 0 | Logic | Risk assessment fails |
| Q151 | adversarial | 12 | 3-6 (varies by model) | Count | Fragile + high-value count off |
| Q152 | adversarial | 14 | 9-15 (varies) | Count | High-value fragile shipping risk |
| Q154 | adversarial | 47 | 5-23 (varies) | Count | Negative profit products miscounted |
| Q157 | complex | 84.46 | "13.04%" / "77.33" | Format/calc | ROI calculation broken |

---

## Format Impact Analysis

### CSV vs JSON vs Compression

**Field Retrieval (The Only Category That Works):**
- CSV: 100% (30/30)
- JSON Compact: 100% (30/30)
- JSON Moon (Improved 48%): 100% (30/30) ✓ **Compression doesn't hurt direct lookups**
- JSON Moon (Less aggressive 34%): 100% (30/30)
- Sonnet Moon: 97% (29/30) - **Lost 1 answer** (concerning!)

**Filtering Performance by Compression:**
- CSV: 50% (12/24)
- JSON Compact: 42% (10/24)
- JSON Moon Improved (48%): 42% (10/24)
- JSON Moon Less Aggressive (34%): **58%** (14/24) - **Best filtering!**
- Sonnet Moon: 50% (12/24)

**Insight:** Less aggressive compression helps filtering but overall accuracy stays flat.

**Aggregation (Consistently Broken):**
- CSV: 39% (12/31)
- JSON Compact: 35% (11/31)
- JSON Moon Improved: 39% (12/31)
- JSON Moon Less Aggressive: 35% (11/31)
- Sonnet Moon: 39% (12/31)

**Key Finding:** Format/compression doesn't fix the core calculation problems - they're systematic failures in the model's reasoning, not data presentation issues.

---

## Question Type Analysis

### Perfect Performance (100%)
✅ **Field Retrieval** - Direct value extraction from specific records
- All models, all formats succeed at finding and returning exact values
- Format/compression irrelevant - data structure preserved

### Strong Performance (75%+)
✅ **Deduction** (75%) - Pattern identification and grouping
- Q100-103: Supplier product counts, category stock sums, etc.
- Works because it requires manual inspection rather than calculation

✅ **Structure Awareness** (71-79%) - Unique values, distinct counts
- Q86-99: Lists of categories, suppliers, locations, manufacturers
- Mostly correct; some JSON format issues with array serialization

### Moderate Performance (39-50%)
🟡 **Aggregation** (35-39%) - Sums, averages, min/max
- Models calculate correctly ~40% of the time
- Systematic errors in rounding, field reference, magnitude

🟡 **Filtering** (42-58%) - Counting records matching conditions
- Counting logic works better than aggregation
- Exact counts off by small numbers (±3-5)
- Improved performance with format changes

### Poor Performance (0-33%)
❌ **Multi-step Reasoning** (20-40%) - Conditional logic chains
- Cannot maintain state across multiple conditions
- "If A and B then sum C" - usually fails on the conditions

❌ **Advanced Analysis** (7-21%) - Complex business logic
- Regression analysis, quartiles, rankings fail
- Profit margin concepts misunderstood
- Correlation analysis broken

❌ **Statistical Analysis** (13-38%) - Percentiles, variance, distributions
- Median/percentile calculations completely off
- Coefficient of variation not understood
- Percentage formatting confused with actual percentages

❌ **Edge Cases** (0%) - Null handling, special conditions
- Cannot exclude records based on conditions
- Cannot handle "zero stock" special case
- Cannot count missing values

❌ **Hypothetical Scenarios** (0%) - What-if calculations
- Sequential transformations fail
- Cannot multiply all values by constant then sum
- Cannot calculate inventory values (quantity × price)

❌ **Temporal Reasoning** (0%) - Date arithmetic
- Cannot calculate days between dates
- Cannot compare dates to find recent records
- Cannot compute average age in days

---

## Model Comparison: Haiku vs Sonnet

### Haiku (Baseline) Strengths
- **Filtering:** 50% (12/24) - Better counting logic
- **Structure Awareness:** 79% (11/14) - Better list generation
- **Statistical Analysis:** 25% (2/8) - Slightly better
- **Overall:** 47% accuracy

### Sonnet Strengths
- **Multi-step Reasoning:** 40% (2/5) vs Haiku 20% (1/5) - **+20%**
- **Filtering:** 50% (12/24) - Tied with Haiku
- **Deduction:** 75% (3/4) - Tied with Haiku

### Sonnet Weaknesses
- **Field Retrieval:** 97% (29/30) vs Haiku 100% (30/30) - **Lost 1 basic lookup!**
- **Advanced Analysis:** 7% (1/14) vs Haiku 14% (2/14) - **-7%**
- **Correlation Analysis:** 0% (0/3) vs Haiku 33% (1/3) - **-33%**
- **Statistical Analysis:** 13% (1/8) vs Haiku 25% (2/8) - **-12%**
- **Overall:** 46% accuracy (1% worse than Haiku)

**Conclusion:** Haiku is more reliable overall. Sonnet is better at multi-step logic but worse at statistical analysis and basic lookups. **Recommend Haiku for this task.**

---

## Prompt Version A (No Scripts) Assessment

**Objective:** Test whether prohibiting script generation improves accuracy

**Results vs Phase 2 (Original Prompt):**

| Category | Phase 2 | Phase 3 (No Scripts) | Change |
|----------|---------|-------------------|--------|
| Field Retrieval | 100% | 100% | → Same |
| Aggregation | 3% | 39% | ↑ **+36%** |
| Filtering | 5% | 42% | ↑ **+37%** |
| Structure Awareness | 40% | 79% | ↑ **+39%** |
| Overall | 34% | 50% | ↑ **+16%** |

**Assessment:** Version A successfully improved simple tasks (filtering, structure awareness) but **failed to fix calculation problems**. The prohibition on scripts may have prevented attempts at actual computation, forcing pure reasoning which models are bad at.

**Recommendation:** Test **Version B** (allow single script execution) to see if permitting code generation for calculations improves aggregation/hypothetical accuracy.

---

## Compression Trade-offs Summary

| Compression Level | Size Reduction | Field Retrieval | Filtering | Aggregation | Overall | Recommendation |
|------------------|----------------|-----------------|-----------|-------------|---------|---|
| Original (Pretty JSON) | 0% (80KB) | 100% | 50% | 39% | 50% | Baseline |
| Minified (Compact JSON) | ~0% (81KB) | 100% | 42% | 35% | 45% | Worse |
| Moon - Improved (48%) | 48% (42KB) | 100% | 42% | 39% | 47% | **Best** |
| Moon - Less Agg (34%) | 34% (53KB) | 100% | **58%** | 35% | 48% | Filtering peak |
| Moon - Aggressive (70%) | 70% (21KB) | 77% | 25% | 39% | 40% | Too aggressive |

**Winner:** JSON Moon Improved (48% compression) achieves **47% accuracy with 48% smaller file** - best balance of token efficiency and accuracy.

---

## Next Steps (Recommendations)

1. **Test Version B Prompt** (allow single script) on CSV 100 to measure if code generation helps calculation accuracy
2. **Investigate aggregation failures** - Why are sums 2-7% off? Floating point? Field selection?
3. **Test 50% density variants** - Do sparse datasets perform differently?
4. **Analyze edge case patterns** - Why do all 5 edge cases fail universally?
5. **Document token usage** - Compare tokens per format across read vs answer phases

---

## Data Locations

```
Test Results:
- CSV 100: benchmarking/subagent_output/csv_100_baseline_answers.json
- JSON Compact: benchmarking/subagent_output/json_100_compact_baseline_answers.json
- JSON Moon Improved: benchmarking/subagent_output/json_100_compact_moon_baseline_answers.json
- Sonnet Moon: benchmarking/subagent_output/json_100_compact_moon_sonnet_answers.json

Test Data:
- CSV: benchmarking/data/csv_100.csv
- JSON Moon: benchmarking/data/json_100_compact.moon.json
- Questionnaires: benchmarking/questionnaires/csv_100.json, json_100.json
- Answer Keys: benchmarking/questionnaires/csv_100_answer_key.json, json_100_answer_key.json
```

---

**Phase 3 Complete - Ready for Phase 4: Version B Prompt Testing**
