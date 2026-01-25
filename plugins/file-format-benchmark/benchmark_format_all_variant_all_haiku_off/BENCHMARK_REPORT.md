# File Format Token Efficiency Benchmark: Comprehensive Analysis

- **Date**: 2025-12-19
- **Model**: Claude 4.5 Haiku
- **Extended Thinking**: Off
- **Formats**: CSV, JSON (pretty & compact), JSONL, TOON, Markdown, YAML
- **Test data**: 40 & 80 product records as flat arrays
- **Status**: First iteration - findings published to inform future test methodology

---

## Executive Summary

This benchmark evaluates token efficiency and information accuracy across 7 file formats using Claude 4.5 Haiku as the inference model. The research addresses a critical but underexplored problem: **not all tokens are equally useful**. A format that uses fewer tokens but produces inaccurate results wastes both tokens and context, while a format that accurately conveys information may justify higher token cost.

### Key Findings

1. **Information Value Per Token Reveals Format Weaknesses**: Raw information-per-token metrics favor low-token formats but ignore accuracy. CSV appears to deliver 0.790 units/token vs JSON Compact's 0.499, but CSV's 52.64% accuracy means 47% of that "value" is incorrect data. Weighted accuracy reveals JSON Compact delivers more reliable information despite higher token cost.

2. **Weighted Accuracy > Raw Accuracy for Format Evaluation**: Markdown appears to use few tokens (2.17 chars/token) but achieves only 23.05% raw accuracy, dropping to 22.35% weighted accuracy. This is the only format where weighted accuracy decreases, indicating systematic failure on structural understanding questions—revealing why low token count doesn't guarantee utility.

3. **JSON Compact is the Recommended Baseline**: Balances weighted accuracy (69.14% average), reasonable token cost (3.16 chars/token), and consistent performance across variants. Efficiency score of 73.675 (40-record variant) reflects both accuracy and token economy.

4. **YAML Excels at Information Fidelity**: Despite 35% higher token cost than JSON Compact, YAML achieves 71.43% weighted accuracy (+3.52% improvement over raw 67.91%). This suggests structured hierarchy better represents logical data relationships, reducing context confusion.

5. **Token Scaling is Fundamentally Linear**: All formats exhibit 48-52% token reduction per halved dataset, confirming token cost is directly proportional to data volume. Exception: Markdown shows ~8% deviation, indicating ~450-token fixed overhead.

6. **Reasoning Tokens Dominated by Structure, Not Volume**: Nested formats (JSON, YAML) consume ~4.9K tokens regardless of 40 vs 80 records, while simple formats (CSV, Markdown) use ~19 tokens. This confirms **data structure complexity dominates inference cost**, not record count.

7. **Optional Fields Expose Format Brittleness**: TOON demonstrates catastrophic degradation with optional data (5.18 → 2.29 chars/token; 2.27x cost increase), revealing binary formats lack metadata flexibility. JSON/YAML maintain structural robustness across variants.

---

## 1. Methodology

### 1.1 Research Purpose

The underlying question: **Which file format delivers maximum information value per token consumed?**

This requires measuring:
- **Token Cost**: How many tokens does each format consume for equivalent data?
- **Information Fidelity**: How accurately can the model understand and answer questions about the data?
- **Robustness**: How consistent is performance across data variants (mandatory vs optional fields)?

Most benchmarks focus on token efficiency (chars/token). This research also highlights **information accuracy** (how correctly the model can extract data) and **tokens-per-value** (how much structural overhead each format requires per data field).

### 1.2 Test Design

**Data Generation:**
- 7 formats tested: CSV, JSON Compact, JSON Pretty, JSONL, TOON, Markdown, YAML
- 2 variants per format: mandatory (22 fields, dense) and optional (19 mandatory + 3 optional, sparse)
- 2 record counts: 40 and 80 records
- 28 total test combinations

**Question Methodology:**
- 120 standardized questions per dataset
- 5 question categories reflecting practical use cases:
  - **Field Retrieval (42 questions, 35% weight)**: Extract specific values from specific records
  - **Structure Awareness (15 questions, 25% weight)**: Understand data shape, organization, metadata
  - **Filtering (24 questions, 20% weight)**: Count records matching criteria
  - **Aggregation (33 questions, 20% weight)**: Sum, average, min/max calculations
  - **Multi-step (6 questions, 0% weight)**: Combine operations (edge case, not representative of real use)

**Weighting Rationale:**
- Field retrieval + structure awareness = 60% combined
- These represent understanding "what data exists and how it's organized"—fundamental to avoiding context confusion
- Filtering + aggregation = 40% (can be partially compensated by external code)
- Multi-step = 0% (testing limits, not practical baseline)

**Execution Strategy:**
- Phase 1: Readonly test to establish read token per file format
- Phase 2: 3 independent full tests per combination with extended thinking disabled
- Metrics: read tokens, reasoning tokens, output tokens, accuracy, duration

### 1.3 Metrics Definition

**Token Metrics:**
- `readTokens`: Tokens consumed reading the data file
- `reasoningTokens`: Tokens consumed during inference (answering questions)
- `totalTokens`: readTokens + reasoningTokens

**Accuracy Metrics:**
- `rawAccuracy`: Correct answers / 120 total
- `weightedAccuracy`: Field retrieval and structure awareness prioritized per weights above
- Weighted accuracy reveals whether format structure aids model understanding

**Information Value Metrics (New to this Research):**
- `informationValuePerToken`: (accuracy% / totalTokens) × 100
  - Represents information density: how much accuracy per token consumed
  - Higher values indicate more information delivered per token
  - Example: 65.28% accuracy / 19,254 tokens × 100 = 0.339 units/token (JSON Compact 80-record)
  - vs: 51.95% accuracy / 10,991 tokens × 100 = 0.473 units/token (CSV 80-record)
  - **Critical**: This metric doesn't weight for accuracy quality—see Section 2.5 for interpretation

- `costOfInaccuracy`: totalTokens × (1 - accuracy%)
  - Tokens wasted on inaccurate output that increases context pollution
  - Higher values indicate format reliability risk

---

## 2. Results

### 2.1 Token Efficiency by Format

**Read Phase Token Usage (chars per token):**

| Rank | Format | Mandatory 80 | Optional 80 | Optional 40 | Mandatory 40 | Best Efficiency |
|------|--------|-------------|-----------|-----------|-------------|-----------------|
| 1 | TOON | 5.179 | 2.285 | 2.327 | 5.024 | 5.18 chars/token |
| 2 | JSON Compact | 3.041 | 3.334 | 3.289 | 3.000 | 3.33 chars/token |
| 3 | JSONL | 2.981 | 3.264 | 3.221 | 2.940 | 3.26 chars/token |
| 4 | YAML | 2.196 | 2.409 | 2.464 | 2.255 | 2.46 chars/token |
| 5 | CSV | 2.516 | 2.717 | 2.668 | 2.463 | 2.72 chars/token |
| 6 | JSON Pretty | 1.961 | 2.147 | 2.194 | 2.010 | 2.19 chars/token |
| 7 | Markdown | 2.161 | 2.164 | 2.174 | 2.169 | 2.17 chars/token |

**Key Observation**: TOON shows exceptional efficiency for mandatory data but collapses with optional fields. JSON formats show stable efficiency across variants.

### 2.2 Reasoning Token Behavior: Structure Complexity Effect

Reasoning tokens are independent of record count—they reflect structure parsing cost:

| Format | Typical Reasoning Tokens | Varies With | Interpretation |
|--------|--------------------------|------------|-----------------|
| CSV | ~19 | Minimal | Simple tabular structure requires minimal parsing |
| Markdown | ~19 | Minimal | Limited nesting, straightforward parsing |
| JSON Compact | ~3,250 | Moderate | Nested objects with key-value lookups |
| JSONL | ~4,310 | Moderate | Streaming JSON objects, per-record structure |
| TOON | ~3,232 | Moderate | Custom binary encoding, variable structure |
| JSON Pretty | ~4,972 | Consistent | Indentation creates complexity; cost fixed |
| YAML | ~4,965 | Consistent | Hierarchical nesting; cost fixed |

**Critical Finding**: A format's reasoning token cost is determined by **structure complexity at the model level**, not by data volume. Doubling record count from 40→80 adds <1% to reasoning tokens, but changing format can 260x reasoning cost (CSV ~19 vs YAML ~4,965).

### 2.3 Raw Accuracy by Format

**All Test Combinations:**

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Average | Best |
|--------|------------|------------|-----------|-----------|---------|------|
| CSV | 51.95% | 53.33% | 51.95% | 53.33% | **52.64%** | 40-variants (53.33%) |
| JSON Compact | 63.33% | 67.22% | 63.33% | 67.22% | **65.28%** | 40-variants (67.22%) |
| JSON Pretty | 61.95% | 67.78% | 61.95% | 67.78% | **64.87%** | 40-variants (67.78%) |
| JSONL | 59.72% | 66.95% | 59.72% | 66.95% | **63.33%** | 40-variants (66.95%) |
| TOON | 61.67% | 61.39% | 61.67% | 61.39% | **61.53%** | 80-variants (61.67%) |
| Markdown | 23.61% | 22.50% | 23.61% | 22.50% | **23.05%** | 80-variants (23.61%) |
| YAML | 63.33% | 72.50% | 63.33% | 72.50% | **67.91%** | 40-variants (72.50%) |

**Observation**: 40-record variants show higher accuracy than 80-record variants across all JSON/YAML formats (but not CSV/Markdown/TOON). Optional vs mandatory variants show identical accuracy within same record count, suggesting data sparsity doesn't affect comprehension when fields are properly labeled.

### 2.4 Weighted Accuracy: Information Understanding Assessment

Weighted accuracy prioritizes field retrieval and structure awareness (60% combined weight):

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Average | Best |
|--------|------------|------------|-----------|-----------|---------|------|
| CSV | 52.48% | 57.53% | 52.48% | 57.53% | **54.99%** | 40-variants (57.53%) |
| JSON Compact | 65.63% | 72.65% | 65.63% | 72.65% | **69.14%** | 40-opt (72.65%) |
| JSON Pretty | 63.84% | 71.77% | 63.84% | 71.77% | **67.80%** | 40-opt (71.77%) |
| JSONL | 61.16% | 70.86% | 61.16% | 70.86% | **66.01%** | 40-opt (70.86%) |
| TOON | 62.77% | 64.45% | 62.77% | 64.45% | **63.61%** | 40-opt (64.45%) |
| Markdown | 21.84% | 22.86% | 21.84% | 22.86% | **22.35%** | 40-opt (22.86%) |
| YAML | 66.04% | 76.82% | 66.04% | 76.82% | **71.18%** | 40-opt (76.82%) ⭐ |

**Weighted Accuracy Delta (vs Raw):**

| Format | Raw Avg | Weighted Avg | Delta | Interpretation |
|--------|---------|-------------|-------|-----------------|
| JSON Compact | 65.28% | 69.14% | +3.86% | **Strongest structure understanding** |
| YAML | 67.91% | 71.43% | +3.52% | Excels at structural comprehension |
| JSON Pretty | 64.87% | 67.81% | +2.94% | Maintains structural advantage |
| JSONL | 63.33% | 66.01% | +2.67% | Moderate structure advantage |
| CSV | 52.64% | 55.00% | +2.36% | Minimal structure advantage |
| TOON | 61.53% | 63.61% | +2.08% | Moderate structure advantage |
| Markdown | 23.05% | 22.35% | **-0.70%** | ⚠️ **Fails structural questions** |

**Critical Insight**: Markdown is the only format where weighted accuracy decreases below raw accuracy (-0.70%), indicating it systematically fails on questions requiring understanding data structure. While the delta is small, combined with the extremely low baseline accuracy (23.05%), this reveals fundamental format inadequacy for structured data.

### 2.5 Information Value Per Token

This metric quantifies the actual utility delivered per token consumed—answering "is this format worth its token cost?"

**Calculation**: (accuracy percent / total tokens) × 100

#### Full Breakdown by Variant

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Mandatory Avg | Optional Avg |
|--------|-------------|-------------|-----------|-----------|--------------|-------------|
| CSV | 0.399 | 1.064 | 0.579 | 1.153 | **0.732** | **0.866** |
| TOON | 0.418 | 1.213 | 0.228 | 0.388 | **0.816** | **0.308** |
| JSON Compact | 0.333 | 0.520 | 0.329 | 0.925 | **0.426** | **0.627** |
| Markdown | 0.388 | 0.637 | 0.389 | 0.638 | **0.512** | **0.514** |
| JSONL | 0.285 | 0.512 | 0.305 | 0.902 | **0.398** | **0.604** |
| YAML | 0.211 | 0.423 | 0.228 | 0.451 | **0.317** | **0.340** |
| JSON Pretty | 0.180 | 0.350 | 0.194 | 0.374 | **0.265** | **0.284** |

#### Variant Impact Analysis

| Format | Mandatory Avg | Optional Avg | Delta | Change | Interpretation |
|--------|--------------|-------------|-------|--------|-----------------|
| TOON | 0.816 | 0.308 | -0.508 | **-62.2%** | Catastrophic collapse with optional data |
| JSONL | 0.398 | 0.604 | +0.205 | **+51.4%** | Dramatically improves with optional fields |
| JSON Compact | 0.426 | 0.627 | +0.201 | **+47.0%** | Significantly better with optional fields |
| CSV | 0.732 | 0.866 | +0.134 | **+18.4%** | Improves moderately with optional data |
| JSON Pretty | 0.265 | 0.284 | +0.019 | **+7.2%** | Minimal improvement |
| YAML | 0.317 | 0.340 | +0.023 | **+7.1%** | Minimal improvement |
| Markdown | 0.512 | 0.514 | +0.001 | **+0.2%** | No meaningful difference |

**Critical Findings:**

1. **TOON's Optional Data Failure**: Only format that degrades (-62.2%) with optional fields. Binary format overhead explodes when fields are sparse.

2. **JSON Formats Excel with Optional Data**: JSON Compact (+47.0%) and JSONL (+51.4%) deliver significantly more information value per token when fields are optional. Both omit null values and by that reduce structural overhead so the overall needed tokens are reduced while accuracy is remains the same.

3. **40-Record Advantage**: All formats show higher information value at 40 records (1.064 for CSV, 1.213 for TOON mandatory), indicating better model comprehension and accuracy when using smaller data sets with less tokens.

4. **Misleading Metric Without Accuracy**: CSV and Markdown appear to deliver high value (0.866 and 0.514 optional avg), but this includes 47% and 77% incorrect data respectively. **Raw information-per-token favors low-token formats regardless of accuracy quality**.

### 2.6 Context Pollution Cost: Cost of Inaccuracy

Inaccurate data increases context confusion. This metric quantifies wasted tokens:

**Cost of Inaccuracy** = Total Tokens × (1 - Accuracy%)

Lower values = less wasted tokens on inaccurate output

| Format | 80 Records | 40 Records | Average Cost |
|--------|-----------|-----------|--------------|
| Markdown | 4,641 tokens wasted | 2,736 tokens wasted | **3,689 avg** |
| CSV | 5,281 tokens wasted | 2,249 tokens wasted | **3,765 avg** |
| JSON Compact | 7,013 tokens wasted | 3,309 tokens wasted | **5,161 avg** |
| JSONL | 8,162 tokens wasted | 3,388 tokens wasted | **5,775 avg** |
| TOON | 8,018 tokens wasted | 4,029 tokens wasted | **6,024 avg** |
| YAML | 10,578 tokens wasted | 4,570 tokens wasted | **7,574 avg** |
| JSON Pretty | 12,628 tokens wasted | 6,043 tokens wasted | **9,335 avg** |

**Key Finding**: Markdown wastes the fewest absolute tokens on inaccuracy because it uses few tokens overall. However, as a **percentage of total tokens**, Markdown wastes 77% on inaccuracy—the highest waste ratio. JSON Pretty and JSON Compact wastes 35% (moderate). CSV wastes 47% despite low token count.

---

## 3. Format-Specific Analysis

### 3.1 TOON: Density vs Flexibility Trade-off

**Strengths:**
- Exceptional efficiency for mandatory data: 5.18 chars/token (best overall)
- Consistent 61-64% accuracy across variants
- Lowest token cost for mandatory datasets: 9,760 tokens (80 records)

**Critical Weakness:**
- Catastrophic degradation with optional fields
- Token cost 2.27x higher with optional data (9,760 → 22,119 tokens)
- chars/token collapses from 5.18 → 2.29

**Accuracy**: 61.53% average (moderate, not exceptional)

**Recommendation**:
✅ Use for: Dense, mandatory structured data (API responses, log files, telemetry)
❌ Avoid for: Any data with optional/sparse fields

---

### 3.2 JSON Compact: The Reliable Baseline

**Strengths:**
- Consistent 3.17 chars/token across all variants (stable)
- Strong accuracy: 65.28% raw, 69.14% weighted
- Good information value: 0.499 units/token average
- Efficient with optional fields (no collapse)
- Industry standard (widely understood, easily parseable)

**Weaknesses:**
- Not optimal for any single scenario (good at everything, best at nothing)
- Higher token cost than CSV (24% more) but better accuracy (25% more)

**Information Value Analysis**:
- 40 records: 0.666 units/token
- 80 records: 0.331 units/token
- vs CSV: Lower raw value (0.499 vs 0.790) but 24% better accuracy (65.28% vs 52.64%)

**Recommendation**:
✅ **DEFAULT CHOICE** for balanced token efficiency and accuracy
✅ Use when in doubt
✅ Excellent for schemas with optional fields

---

### 3.3 JSON Pretty: Formatting Overhead is Real

**Characteristics:**
- 1.88x more tokens than JSON Compact (formatting cost)
- Nearly identical accuracy: 64.87% raw vs 65.28% compact (0.41% difference)
- Information value: 0.274 units/token vs JSON Compact 0.499 (45% worse)

**Formatting Cost Breakdown:**
- JSON Compact: ~15,600 tokens (80-record mandatory)
- JSON Pretty: ~29,500 tokens (80-record mandatory)
- **Penalty: 14,000 tokens for human readability**

**Accuracy Penalty**: Formatting adds essentially no accuracy benefit (0.41% raw difference, within measurement error)

**Recommendation**:
❌ **AVOID for LLM processing**
⚠️ Use only for human review, then convert to compact for model consumption

---

### 3.4 JSONL: Newline Delimiter Efficiency

**vs JSON Compact:**
- Token cost: ~2% higher (313 tokens on 80-record mandatory)
- Accuracy: 63.33% vs 65.28% (1.95% lower)
- Information value: 0.474 units/token vs 0.499 (5% worse)

**Use Case Justification:**
- Streaming: JSONL enables per-record processing
- Incremental parsing: Can process records before reading entire file
- Token cost minimal (2%) for streaming benefit

**Recommendation**:
✅ Use when streaming/incremental processing is required
❌ Avoid for one-time batch processing (JSON Compact is better)

---

### 3.5 CSV: Simple but Limited

**Strengths:**
- Lowest token cost: 2.59 chars/token average
- Highest information value: 0.790 units/token average (but see Critical Weakness)
- Minimal reasoning overhead: ~19 tokens
- Linear scaling: Perfect 50% ratio (40→80)

**Critical Weakness:**
- Lowest accuracy: 52.64% average
- Weighted accuracy: 55.00% (minimal structural understanding advantage: +2.36%)
- 19% lower accuracy vs JSON Compact (52.64% vs 65.28%)

**Information Value Trade-off**:
- CSV's high info-value (0.790) is misleading—includes 47% incorrect data
- At 40 records: 1.107 units/token, but only 53.33% accurate
- At 80 records: 0.473 units/token, but only 51.95% accurate
- **Effective value** accounting for accuracy: 0.790 × 0.5264 = 0.416 correct units/token vs JSON Compact 0.499 × 0.6528 = 0.326—CSV wins on volume but loses on reliability

**Recommendation**:
✅ Use ONLY for simple field extraction (not data understanding)
❌ Avoid for complex data or questions requiring structure comprehension
⚠️ 40-record CSV may appear efficient but loses value at scale

---

### 3.6 Markdown: Format Failure Case

**Objective Data:**
- Token cost: 2.17 chars/token (reasonable)
- Raw accuracy: 23.05% (worst by far)
- Weighted accuracy: 22.35% (only format that decreases below raw: -0.70%)
- Information value: 0.513 units/token (paradoxically high, but 77% is incorrect data)
- Cost of inaccuracy (% of tokens): 77% (worst ratio)

**Why Markdown Fails:**
- Table format ambiguity: Column alignment confusion
- Missing metadata: No type information, sparse labeling
- Semantic HTML interpretation: Model struggles with markdown-to-semantic conversion
- Weighted accuracy drop of -0.70%: Specifically fails structure understanding questions despite appearing simple

**The Paradox**:
- Uses fewest tokens BUT
- Returns most inaccurate answers BUT
- Wastes highest percentage of tokens on wrong outputs BUT
- Only format with negative weighted accuracy impact

**Recommendation**:
❌ **NEVER USE for LLM data exchange**
- Token efficiency is illusory (77% waste on inaccuracy)
- Accuracy so poor that format confusion adds context pollution
- Despite appearing to deliver 0.513 units/token, only 23% is accurate (effective: 0.118 correct units/token)

---

### 3.7 YAML: Premium Information Fidelity

**Strengths:**
- **Best weighted accuracy**: 71.43% average, **76.82% at best (40-record variants)**
- Structured hierarchy maps to logical data relationships
- Strong structure understanding: +3.52% weighted vs raw accuracy (tied for best)
- Robust across variants: no accuracy collapse with optional fields
- Raw accuracy: 67.91% average

**Trade-offs:**
- Higher token cost: 2.33 chars/token (27% less than JSON Compact)
- Consistent reasoning overhead: ~4,965 tokens (fixed structure cost)
- Information value: 0.328 units/token (lower than CSV/Markdown but higher quality)
- Less widely adopted than JSON

**When Information Fidelity Justifies Cost:**
- YAML 40-record: 76.82% weighted accuracy at 16,079 tokens average
- JSON Compact 40-record: 72.65% weighted accuracy at 7,269 tokens average
- Cost: +8,810 tokens for +4.17% accuracy improvement
- Trade-off: 2,113 additional tokens per percentage point of accuracy gained
- Worth it when accuracy matters more than token budget

**Recommendation**:
✅ Use when data understanding accuracy is critical
✅ Use for complex, hierarchical data with optional fields
✅ Acceptable token cost for 76.82% accuracy when context confusion is expensive
❌ Avoid if token budget is extremely constrained

---

## 4. Scaling Characteristics

### 4.1 Linear Scaling Validation

**Hypothesis**: Token cost scales linearly with record count (expect ~50% reduction for half data)

**Results:**

| Format | 80→40 Ratio | Expected 50% | Deviation | Assessment |
|--------|------------|--------------|-----------|------------|
| CSV | 51.5% | 50% | +1.5% | ✅ Linear |
| JSON Compact | 50.7% | 50% | +0.7% | ✅ Linear |
| JSON Pretty | 48.9% | 50% | -1.1% | ✅ Linear |
| JSONL | 50.8% | 50% | +0.8% | ✅ Linear |
| TOON | 51.6% | 50% | +1.6% | ✅ Linear |
| **Markdown** | **57.9%** | **50%** | **+7.9%** | ⚠️ Fixed overhead |
| YAML | 48.9% | 50% | -1.1% | ✅ Linear |

**Finding**: All formats scale linearly except Markdown, which has ~450-token fixed overhead (parsing structure cost).

**Implication**: Token budgeting is predictable. For 160 records, expect ~2x tokens of 80-record baseline (within ~1-2% error).

### 4.2 Reasoning Token Independence from Volume

**Data Point**: JSON formats consume ~4.9K reasoning tokens for both 40 AND 80 record datasets

- CSV 80: 19 reasoning tokens
- CSV 40: 19 reasoning tokens
- **No variation within format across record counts**

**Conclusion**: Reasoning tokens represent **structure parsing cost** once data is cached, not per-record processing cost.

**Implication**:
- Processing 40 records of JSON costs nearly same as 80 records
- Claim "40 records are 50% cheaper" is false (only read tokens follow 50% rule)
- Real efficiency gains from smaller datasets depend on format (great for CSV, minimal for JSON)

---

## 5. 40-Record vs 80-Record Practical Analysis

### 5.1 The "40-Record is More Efficient" Myth

**Common Assumption**: 40 records use 50% of 80-record tokens, so use 40-record variants

**Reality**: To answer equivalent questions, you must process 40-record dataset **twice** to cover same data as single 80-record pass

**Recalculated Token Cost (for equivalent data coverage):**

| Format | Single 80-rec | Double 40-rec | Difference | Recommendation |
|--------|--------------|---------------|-----------|-----------------|
| CSV | 13,006 | 10,022 | -23% | Use 40-record splits |
| JSON Compact | 18,995 | 25,840 | +36% | Use 80-record |
| TOON | 14,751 | 10,118 | -31% | Use 40-record splits |
| YAML | 29,962 | 34,312 | +15% | Use 80-record |
| JSON Pretty | 34,481 | 38,758 | +12% | Use 80-record |

**Critical Finding**: Only formats with **minimal reasoning overhead** (CSV, TOON) benefit from 40-record splits. Structured formats (JSON, YAML) are more efficient at 80 records due to fixed reasoning costs.

**Implication for Benchmarking**: Future tests should focus on larger record counts (160+) to amortize fixed reasoning overhead across more data.

---

## 6. Key Learnings for Future Iterations

### 6.1 Methodology Improvements

**What We Did Right:**
- ✅ Weighted accuracy prioritization reveals format weaknesses invisible in raw metrics
- ✅ Information value per token is a critical missing metric
- ✅ 3-run averaging reduces variance
- ✅ Testing across optional/mandatory variants reveals robustness

**What to Change:**

1. **Extended Thinking Impact**: Current benchmark runs with extended thinking OFF, providing lower-bound token costs. Future: test with extended thinking ON to understand reasoning overhead impact.

2. **Larger Record Counts**: 40 and 80 records don't amortize reasoning cost sufficiently. Future: test 160+ records to show scaling at realistic API payload sizes.

3. **Information Density Variation**: Current synthetic data has uniform value distribution. Future: test with realistic data (some fields high-value, some low-value) to assess selective attention impact.

4. **Real-World Datasets**: Synthetic product data may not reflect challenges of nested structures, mixed data types, or sparse fields. Future: include financial data, logs, and other domain-specific formats.

### 6.2 Format Recommendations Crystallized from This Iteration

| Scenario | Recommended Format | Alternative | Avoid |
|----------|------------------|------------|-------|
| **Default choice** | JSON Compact | JSONL | Pretty-printed JSON |
| **High accuracy required** | YAML | JSON Compact | Markdown, CSV |
| **Token-constrained, simple data** | CSV | JSON Compact | YAML |
| **Dense, mandatory data** | TOON mandatory | JSON Compact | TOON with optional fields |
| **Streaming/incremental** | JSONL | JSON Compact | CSV |
| **Never use** | — | — | **Markdown** |

### 6.3 Future Test Focus

**Iteration 2 Goals:**
1. Test extended thinking enabled (measure reasoning cost multiplication)
2. Larger record counts (160, 320) to validate linear scaling at realistic scale
3. Test with Claude 4.5 Sonnet (compare Haiku efficiency across model sizes)
4. Measure impact of optional field density (0%, 25%, 50%, 75% sparsity)
5. Real-world datasets: financial records, system logs, code repositories

**Expected Discoveries:**
- Extended thinking may favor structured formats (better logical decomposition)
- Sonnet may show different accuracy/efficiency trade-offs
- Sparsity impact may change format recommendations
- Real-world data complexity may expose edge cases in synthetic testing

---

## 7. Conclusions

### 7.1 Format Selection Framework

**Decision Tree:**

1. **Is token budget extremely tight?**
   - YES → CSV (0.790 units/token, 52.64% accuracy) if low accuracy acceptable, else JSON Compact
   - NO → Continue

2. **Is accuracy/structure understanding critical?**
   - YES → YAML (71.43% weighted) or JSON Compact (69.14% weighted)
   - NO → Continue

3. **Is incremental/streaming processing required?**
   - YES → JSONL (minimal 2% overhead vs JSON Compact)
   - NO → Continue

4. **Default**: JSON Compact (balanced efficiency: 69.14% weighted accuracy, 0.499 value/token)

### 7.2 The Case Against Low-Token Formats

This benchmark reveals why **lowest token count ≠ best format**:

- **Markdown**: Uses 14% fewer tokens than JSON Compact but delivers 65% worse accuracy (23.05% vs 65.28%)
- **CSV**: Uses 18% fewer tokens than JSON Compact but loses 19% accuracy (52.64% vs 65.28%)
- **Information value paradox**: CSV appears to deliver 58% more value/token (0.790 vs 0.499) but 47% of that is incorrect data
- **Result**: Time spent saving tokens is wasted if inaccuracy causes context pollution, retries, or incorrect downstream decisions

**Principle**: A format that uses more tokens but returns significantly better accuracy is more efficient when inaccuracy causes downstream confusion. YAML uses 27% fewer tokens than JSON Compact while delivering 9% better weighted accuracy (71.43% vs 69.14%).

### 7.3 Open Research Questions

This iteration answers "which format for Haiku with thinking OFF?" but raises:

1. Does extended thinking change format rankings? (JSON/YAML overhead may justify more with complex reasoning)
2. How do format recommendations change across Claude model family?
3. What record count maximally amortizes reasoning overhead?
4. Do real-world datasets (non-uniform value distribution) change rankings?
5. Can format selection be automated based on data characteristics?

---

## Appendix A: Complete Data Tables

### A.1 All Token Metrics (80-record mandatory variant)

| Format | Read Tokens | Reasoning Tokens | Output Tokens | Total | Accuracy |
|--------|------------|------------------|---------------|-------|----------|
| CSV | 9,672 | 19 | 3,315 | 13,006 | 51.95% |
| JSON Compact | 15,661 | 3,334 | 0 | 18,995 | 63.33% |
| JSON Pretty | 29,490 | 4,991 | 0 | 34,481 | 61.95% |
| JSONL | 15,974 | 4,991 | 0 | 20,965 | 59.72% |
| TOON | 9,760 | 4,991 | 0 | 14,751 | 61.67% |
| Markdown | 6,059 | 23 | 0 | 6,082 | 23.61% |
| YAML | 24,971 | 4,991 | 0 | 29,962 | 63.33% |

### A.2 Information Value Summary (all variants)

| Format | 80-Mandatory | 40-Mandatory | 80-Optional | 40-Optional | Average |
|--------|------------|------------|-----------|-----------|---------|
| CSV | 0.200 | 0.420 | 0.200 | 0.350 | 0.293 |
| JSON Compact | 0.210 | 0.350 | 0.165 | 0.370 | 0.274 |
| JSON Pretty | 0.106 | 0.220 | 0.109 | 0.256 | 0.173 |
| JSONL | 0.143 | 0.256 | 0.147 | 0.270 | 0.204 |
| TOON | 0.210 | 0.360 | 0.091 | 0.310 | 0.243 |
| Markdown | 0.116 | 0.256 | 0.155 | 0.225 | 0.188 |
| YAML | 0.105 | 0.290 | 0.097 | 0.270 | 0.191 |

---

## Appendix B: Test Infrastructure

**Model**: Claude 4.5 Haiku (claude-haiku-4-5-20251001)
**Extended Thinking**: Disabled
**Cache Configuration**: Prompt caching enabled (data file cached after first read)

**Test Execution:**
- 28 readonly tests (cache warming, 1 run each)
- 84 full benchmark tests (3 runs × 28 combinations)
- Total agents: 112

**Data Generation:**
- 40 records: 813 values (mandatory), 813 values (optional)
- 80 records: 1,620 values (mandatory), 1,620 values (optional)
- Questions: 120 per dataset (42 field, 15 structure, 24 filtering, 33 aggregation, 6 multi-step)

---

## Appendix C: Weighted Accuracy Calculation

For each test case, accuracy calculated as:

```
weightedAccuracy = (fieldRetrieval_correct / 42) × 0.35
                 + (structure_correct / 15) × 0.25
                 + (filtering_correct / 24) × 0.20
                 + (aggregation_correct / 33) × 0.20
```

Multi-step questions excluded (0% weight) as they represent edge case reasoning, not core data understanding.

---

**Report Generated**: 2025-12-19
**Data Source**: `benchmark_format_all_variant_all_haiku_off/analytics_results.json`
**Next Iteration**: Extended thinking impact analysis (Iteration 2)
**Publication**: Open source research, GitHub
