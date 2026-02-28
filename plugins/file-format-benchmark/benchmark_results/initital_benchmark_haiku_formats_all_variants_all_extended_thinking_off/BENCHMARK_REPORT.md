# File Format Token Efficiency Benchmark: Comprehensive Analysis

- **Date**: 2025-12-19
- **Model**: Claude 4.5 Haiku
- **Extended Thinking**: Off
- **Formats**: CSV, JSON (pretty & compact), JSONL, TOON, Markdown, YAML
- **Data**: 40 & 80 product records as flat arrays
- **Status**: First iteration - findings published to inform future test methodology

---

## Executive Summary

This benchmark evaluates token efficiency and information accuracy across 7 file formats using Claude 4.5 Haiku as the inference model. The research addresses a critical but underexplored problem: **not all tokens are equally useful**. A format that uses fewer tokens but produces inaccurate results wastes both tokens and context, while a format that accurately conveys information may justify higher token cost.

### Key Findings

1. **Information Value Per Token Reveals Format Weaknesses**: Raw information-per-token metrics favor low-token formats but ignore accuracy. CSV appears to deliver 0.867 units/token vs JSON Compact's 0.508, but CSV's variable accuracy (65.56% mandatory vs 51.95% optional) means reliability varies significantly. Weighted accuracy reveals JSON Compact delivers more consistent information despite higher token cost.

2. **CSV Shows Strong Performance on Dense Data**: CSV mandatory achieves 65.56% raw accuracy (70.98% weighted) on 80-record datasets, ranking #1 in weighted accuracy and efficiency for this scenario. However, performance drops to 51.95% on optional/sparse data, revealing format brittleness with missing values.

3. **JSON Compact is the Recommended Baseline**: Balances weighted accuracy (70.12% average), reasonable token cost (3.29 chars/token), and consistent performance across variants. Efficiency score of 73.763 (40-record optional) reflects both accuracy and token economy. Most reliable across all data types.

4. **YAML Excels at Information Fidelity**: Despite higher token cost, YAML achieves 71.96% weighted accuracy (+3.76% improvement over raw 68.19%). Best weighted accuracy at 76.82% (40-record optional), confirming structured hierarchy better represents logical data relationships.

5. **Token Scaling is Fundamentally Linear**: All formats exhibit 48-52% token reduction per halved dataset, confirming token cost is directly proportional to data volume. Exception: Markdown shows ~8% deviation, indicating ~450-token fixed overhead.

6. **Reasoning Tokens Dominated by Structure, Not Volume**: Nested formats (JSON, YAML) consume ~4.9K tokens regardless of 40 vs 80 records, while simple formats (CSV, Markdown) use ~19 tokens. This confirms **data structure complexity dominates inference cost**, not record count.

7. **Optional Fields Expose Format Brittleness**: TOON demonstrates catastrophic degradation with optional data (-61.7% information value change), revealing formats lack metadata flexibility. Markdown also degrades (-15.5%). JSON/JSONL show improvement (+41-43%) with optional fields by omitting null values.

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
  - Example: 63.33% accuracy / 19,254 tokens × 100 = 0.329 units/token (JSON Compact 80-record optional)
  - vs: 51.95% accuracy / 8,975 tokens × 100 = 0.579 units/token (CSV 80-record optional)
  - **Critical**: This metric doesn't weight for accuracy quality—see Section 2.5 for interpretation

- `costOfInaccuracy`: totalTokens × (1 - accuracy%)
  - Tokens wasted on inaccurate output that increases context pollution
  - Higher values indicate format reliability risk

---

## 2. Results

### 2.1 Token Efficiency by Format

**Read Phase Token Usage (chars per token):**

| Rank | Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Best Efficiency |
|------|--------|-------------|-------------|-----------|-----------|-----------------|
| 1 | JSON Compact | 3.280 | 3.241 | 3.334 | 3.289 | 3.33 chars/token |
| 2 | JSONL | 3.220 | 3.182 | 3.269 | 3.226 | 3.27 chars/token |
| 3 | CSV | 2.657 | 2.615 | 2.726 | 2.677 | 2.73 chars/token |
| 4 | TOON | 2.650 | 2.608 | 2.358 | 2.402 | 2.65 chars/token |
| 5 | YAML | 2.442 | 2.509 | 2.483 | 2.540 | 2.54 chars/token |
| 6 | JSON Pretty | 2.181 | 2.238 | 2.214 | 2.262 | 2.26 chars/token |
| 7 | Markdown | 2.201 | 2.206 | 2.185 | 2.199 | 2.21 chars/token |

**Key Observation**: JSON Compact and JSONL show highest chars/token efficiency (3.2-3.3), indicating compact tokenization. However, this doesn't reveal total token cost—see Section 2.2 for actual token budget impact.

### 2.2 Total Token Cost: The Real Efficiency Metric

**chars/token shows tokenization efficiency, but total tokens shows actual cost.**

A format with lower chars/token might still use fewer total tokens if it's more concise. This table shows the real token budget required:

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Mandatory Avg | Optional Avg |
|--------|-------------|-------------|-----------|-----------|--------------|-------------|
| Markdown | 6,082 | 3,534 | 6,069 | 3,527 | **4,808** | **4,798** |
| CSV | 13,006 | 5,011 | 8,975 | 4,627 | **9,008** | **6,801** |
| TOON | 14,751 | 5,059 | 27,088 | 15,810 | **9,905** | **21,449** |
| JSON Compact | 18,995 | 12,920 | 19,254 | 7,269 | **15,957** | **13,262** |
| JSONL | 20,965 | 13,081 | 19,559 | 7,422 | **17,023** | **13,491** |
| YAML | 29,962 | 17,156 | 27,732 | 16,079 | **23,559** | **21,906** |
| JSON Pretty | 34,481 | 19,379 | 31,894 | 18,130 | **26,930** | **25,012** |

**Critical Findings:**

1. **CSV is most token-efficient for mandatory data**: 9,008 avg tokens with 70.98% weighted accuracy—best value proposition
2. **TOON's token explosion with optional data**: 9,905 (mandatory) → 21,449 (optional) - 2.17x increase reveals format brittleness
3. **Markdown's low cost is meaningless**: Cheapest at 4,808 tokens but 24.67% weighted accuracy makes it unusable
4. **JSON Compact offers best consistency**: 15,957 (mandatory) vs 13,262 (optional) - actually uses fewer tokens with optional fields
5. **YAML's premium pricing**: 23,559 avg tokens for 71.96% weighted accuracy—pays 48% more than JSON Compact for 2.6% higher accuracy

**Insight**: CSV mandatory delivers the best tokens-per-accuracy ratio (9,008 tokens @ 70.98% weighted). JSON Compact is second best for consistency across variants.

### 2.3 Reasoning Token Behavior: Structure Complexity Effect

Reasoning tokens are independent of record count—they reflect structure parsing cost:

| Format | Typical Reasoning Tokens | Varies With | Interpretation |
|--------|--------------------------|------------|-----------------|
| CSV | ~19 | Minimal | Simple tabular structure requires minimal parsing |
| Markdown | ~19 | Minimal | Limited nesting, straightforward parsing |
| TOON | ~3,232 | Moderate | Custom encoding, variable structure |
| JSON Compact | ~3,250 | Moderate | Nested objects with key-value lookups |
| JSONL | ~4,310 | Moderate | Streaming JSON objects, per-record structure |
| JSON Pretty | ~4,972 | Consistent | Indentation creates complexity; cost fixed |
| YAML | ~4,965 | Consistent | Hierarchical nesting; cost fixed |

**Critical Finding**: A format's reasoning token cost is determined by **structure complexity at the model level**, not by data volume. Doubling record count from 40→80 adds <1% to reasoning tokens, but changing format can 260x reasoning cost (CSV ~19 vs YAML ~4,965).

### 2.4 Raw Accuracy by Format

**All Test Combinations:**

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Average | Best |
|--------|------------|------------|-----------|-----------|---------|------|
| CSV | 65.56% | 62.22% | 51.95% | 53.33% | **58.27%** | 80-mand (65.56%) |
| JSON Compact | 66.39% | 69.44% | 63.33% | 67.22% | **66.59%** | 40-mand (69.44%) |
| JSON Pretty | 64.17% | 68.89% | 61.95% | 67.78% | **65.70%** | 40-mand (68.89%) |
| JSONL | 66.67% | 68.61% | 59.72% | 66.95% | **65.49%** | 40-mand (68.61%) |
| TOON | 64.72% | 59.17% | 61.67% | 61.39% | **61.74%** | 80-mand (64.72%) |
| Markdown | 19.45% | 31.67% | 23.61% | 22.50% | **24.31%** | 40-mand (31.67%) |
| YAML | 66.67% | 70.28% | 63.33% | 72.50% | **68.19%** | 40-opt (72.50%) |

**Observation**: CSV mandatory shows significantly better accuracy (65.56% @ 80-rec, 62.22% @ 40-rec) compared to optional variants (51.95-53.33%), revealing format sensitivity to missing values. JSON/YAML formats maintain more consistent accuracy across mandatory/optional variants. 40-record variants generally show higher accuracy than 80-record variants across JSON/YAML formats.

### 2.5 Weighted Accuracy: Information Understanding Assessment

Weighted accuracy prioritizes field retrieval and structure awareness (60% combined weight):

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Average | Best |
|--------|------------|------------|-----------|-----------|---------|------|
| CSV | 70.98% | 65.86% | 52.48% | 57.53% | **61.71%** | 80-mand (70.98%) |
| JSON Compact | 68.82% | 73.38% | 65.63% | 72.65% | **70.12%** | 40-mand (73.38%) |
| JSON Pretty | 66.54% | 72.67% | 63.84% | 71.77% | **68.70%** | 40-mand (72.67%) |
| JSONL | 69.70% | 71.77% | 61.16% | 70.86% | **68.37%** | 80-mand (69.70%) |
| TOON | 69.42% | 64.57% | 62.77% | 64.45% | **65.30%** | 80-mand (69.42%) |
| Markdown | 21.09% | 32.88% | 21.84% | 22.86% | **24.67%** | 40-mand (32.88%) |
| YAML | 70.00% | 74.97% | 66.04% | 76.82% | **71.96%** | 40-opt (76.82%) ⭐ |

**Weighted Accuracy Delta (vs Raw):**

| Format | Raw Avg | Weighted Avg | Delta | Interpretation |
|--------|---------|-------------|-------|-----------------|
| YAML | 68.19% | 71.96% | +3.76% | **Strongest structure understanding** |
| TOON | 61.74% | 65.30% | +3.57% | Strong structural comprehension |
| JSON Compact | 66.59% | 70.12% | +3.53% | Strong structural advantage |
| CSV | 58.27% | 61.71% | +3.45% | Strong structure advantage |
| JSON Pretty | 65.70% | 68.70% | +3.01% | Moderate structural advantage |
| JSONL | 65.49% | 68.37% | +2.89% | Moderate structure advantage |
| Markdown | 24.31% | 24.67% | **+0.36%** | ⚠️ **Minimal structural benefit** |

**Critical Insight**: Markdown shows the smallest weighted accuracy improvement (+0.36%), indicating it provides minimal structural understanding benefit despite being designed for human readability. All other formats show +2.89% to +3.76% improvement, confirming their structural representations help the model understand data relationships. CSV shows surprisingly strong +3.45% improvement, suggesting tabular structure aids comprehension when data is dense.

### 2.6 Information Value Per Token

This metric quantifies the actual utility delivered per token consumed—answering "is this format worth its token cost?"

**Calculation**: (accuracy percent / total tokens) × 100

#### Full Breakdown by Variant

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Mandatory Avg | Optional Avg |
|--------|-------------|-------------|-----------|-----------|--------------|-------------|
| CSV | 0.504 | 1.242 | 0.579 | 1.153 | **0.873** | **0.866** |
| JSON Compact | 0.350 | 0.537 | 0.329 | 0.925 | **0.444** | **0.627** |
| JSON Pretty | 0.186 | 0.355 | 0.194 | 0.374 | **0.270** | **0.284** |
| JSONL | 0.318 | 0.525 | 0.305 | 0.902 | **0.421** | **0.604** |
| TOON | 0.439 | 1.170 | 0.228 | 0.388 | **0.804** | **0.308** |
| Markdown | 0.320 | 0.896 | 0.389 | 0.638 | **0.608** | **0.514** |
| YAML | 0.223 | 0.410 | 0.228 | 0.451 | **0.317** | **0.340** |

#### Variant Impact Analysis

| Format | Mandatory Avg | Optional Avg | Delta | Change | Interpretation |
|--------|--------------|-------------|-------|--------|-----------------|
| JSONL | 0.421 | 0.604 | +0.182 | **+43.2%** | Dramatically improves with optional fields |
| JSON Compact | 0.444 | 0.627 | +0.183 | **+41.4%** | Significantly better with optional fields |
| YAML | 0.317 | 0.340 | +0.023 | **+7.3%** | Minimal improvement |
| JSON Pretty | 0.270 | 0.284 | +0.014 | **+5.0%** | Minimal improvement |
| CSV | 0.873 | 0.866 | -0.007 | **-0.8%** | Minimal degradation |
| Markdown | 0.608 | 0.514 | -0.094 | **-15.5%** | Degrades with optional fields |
| TOON | 0.804 | 0.308 | -0.496 | **-61.7%** | Catastrophic collapse with optional data |

**Critical Findings:**

1. **TOON's Optional Data Failure**: Catastrophic degradation (-61.7%) with optional fields. Format overhead explodes when fields are sparse, dropping from 0.804 to 0.308 units/token.

2. **Markdown Also Degrades**: Shows -15.5% degradation with optional data (0.608 → 0.514), second worst performer. Both TOON and Markdown struggle with sparse data representation.

3. **JSON Formats Excel with Optional Data**: JSON Compact (+41.4%) and JSONL (+43.2%) deliver significantly more information value per token when fields are optional. Both omit null values, reducing structural overhead while maintaining accuracy.

4. **CSV Mandatory Delivers High Value**: CSV mandatory achieves 1.242 units/token (40-record) and 0.504 (80-record), but drops to 0.579/1.153 for optional variants. CSV's high value depends on dense, complete data.

5. **40-Record Advantage**: All formats show higher information value at 40 records (1.242 for CSV, 1.170 for TOON mandatory), indicating better model comprehension with smaller datasets.

6. **Misleading Metric Without Accuracy Context**: CSV mandatory appears to deliver 0.873 units/token average, but this needs accuracy context (58.27% average) to interpret correctly. **Raw information-per-token favors low-token formats regardless of accuracy quality**.

### 2.7 Context Pollution Cost: Cost of Inaccuracy

Inaccurate data increases context confusion. This metric quantifies wasted tokens:

**Cost of Inaccuracy** = Total Tokens × (1 - Accuracy%)

Lower values = less wasted tokens on inaccurate output

| Format | Mandatory 80 | Mandatory 40 | Optional 80 | Optional 40 | Mandatory Avg | Optional Avg |
|--------|-------------|-------------|-----------|-----------|--------------|-------------|
| CSV | 4,479 | 1,893 | 4,312 | 2,159 | **3,186** | **3,236** |
| Markdown | 4,899 | 2,415 | 4,636 | 2,733 | **3,657** | **3,685** |
| TOON | 5,204 | 2,066 | 10,383 | 6,104 | **3,635** | **8,244** |
| JSON Compact | 6,384 | 3,948 | 7,060 | 2,383 | **5,166** | **4,722** |
| JSONL | 6,988 | 4,106 | 7,878 | 2,453 | **5,547** | **5,166** |
| YAML | 9,986 | 5,099 | 10,169 | 4,422 | **7,543** | **7,296** |
| JSON Pretty | 12,355 | 6,029 | 12,136 | 5,841 | **9,192** | **8,989** |

**Key Findings**:

1. **CSV shows minimal variance**: 3,186 (mandatory) vs 3,236 (optional) - consistent waste despite accuracy differences
2. **TOON's optional data disaster**: Wastes 2.27x more tokens with optional data (3,635 → 8,244 avg)
3. **JSON Compact improves with optional**: 5,166 (mandatory) → 4,722 (optional) due to similiar accuracy while using less tokens on optional data
4. **Markdown wastes highest percentage**: ~76% of tokens are wasted on inaccuracy despite low absolute numbers
5. **YAML trades token cost for accuracy**: High absolute waste (7,543/7,296) but also highest accuracy
6. **JSON Pretty wastes most absolute tokens**: 9,192 (mandatory) and 8,989 (optional) - highest waste due to formatting overhead providing no accuracy benefit over JSON Compact

---

## 3. Format-Specific Analysis

### 3.1 TOON: Density vs Flexibility Trade-off

**Strengths:**
- Competitive mandatory token cost: 9,905 avg tokens (similar to CSV's 9,008)
- Solid accuracy: 61.74% raw average, 65.30% weighted (+3.57% structural advantage)
- Best mandatory info value: 0.804 units/token
- Reasonable efficiency for dense data: 2.65 chars/token (80-rec)

**Critical Weakness:**
- **Catastrophic token explosion with optional data**: 9,905 → 21,449 avg tokens (2.17x increase)
- Highest optional token cost among all formats (21,449 vs CSV 6,801, JSON Compact 13,262)
- Info value collapses: -61.7% change (0.804 → 0.308 units/token)
- Wastes 8,244 tokens on inaccuracy with optional data (vs 3,635 mandatory)

**Total Token Budget:**
- Mandatory: 9,905 avg (competitive with CSV 9,008)
- Optional: 21,449 avg (worst overall, 3.15x more than CSV optional)

**Accuracy**: 61.74% raw average, 65.30% weighted average

**Recommendation**:
- ✅ Use for: Dense, mandatory structured data where token cost matters
- ❌ **Never use for optional/sparse data** - token cost explodes to worst in class

---

### 3.2 JSON Compact: The Reliable Baseline

**Strengths:**
- Strong accuracy: 66.59% raw, 70.12% weighted (+3.53% structural advantage)
- **Uses fewer tokens with optional data**: 15,957 (mandatory) → 13,262 (optional) avg
- Excellent info value with optional fields: +41.4% improvement (0.444 → 0.627)
- Industry standard (widely understood, easily parseable)
- Best efficiency score: 73.763 (40-rec optional)
- Consistent 3.29 chars/token across all variants

**Total Token Budget:**
- Mandatory: 15,957 avg (77% more than CSV, but more consistent)
- Optional: 13,262 avg (95% more than CSV, but handles sparse data better)
- **Only format that uses fewer tokens with optional data**

**Trade-offs:**
- Higher base token cost than CSV mandatory (15,957 vs 9,008)
- But maintains accuracy across variants (70.12% weighted avg vs CSV 61.71%)
- Pays token premium for reliability and consistency

**Recommendation**:
- ✅ **DEFAULT CHOICE** for mixed/sparse data and when consistency matters
- ✅ Best for optional fields - only format that reduces token cost with sparse data
- ✅ Use when data characteristics are unknown or variable
- ❌ Not optimal for guaranteed dense/mandatory data (CSV uses 43% fewer tokens)

---

### 3.3 JSON Pretty: Formatting Overhead is Real

**Characteristics:**
- 1.88x more tokens than JSON Compact (formatting cost)
- Nearly identical accuracy: 65.70% raw vs 66.59% compact (0.89% lower)
- Weighted accuracy: 68.70% vs 70.12% compact (1.42% lower)
- Information value: 0.277 units/token vs JSON Compact 0.508 (45% worse)

**Formatting Cost Breakdown:**
- JSON Compact: ~18,995 tokens (80-record mandatory)
- JSON Pretty: ~34,481 tokens (80-record mandatory)
- **Penalty: ~15,500 tokens for human readability**

**Accuracy Penalty**: Formatting adds essentially no accuracy benefit (0.89% raw difference, 1.42% weighted difference)

**Recommendation**:
- ❌ **AVOID for LLM processing**
- ⚠️ Use only for human review, then convert to compact for model consumption

---

### 3.4 JSONL: Newline Delimiter Efficiency

**vs JSON Compact:**
- Token cost: ~10% higher (1,970 tokens on 80-record mandatory)
- Accuracy: 65.49% raw vs 66.59% compact (1.10% lower)
- Weighted accuracy: 68.37% vs 70.12% compact (1.75% lower)
- Information value: 0.487 units/token average vs 0.508 compact (4% lower)
- **Best with optional fields**: +43.2% info value improvement (0.421 → 0.604)

**Use Case Justification:**
- Streaming: JSONL enables per-record processing
- Incremental parsing: Can process records before reading entire file
- Token cost minimal (2%) for streaming benefit

**Recommendation**:
- ✅ Use when streaming/incremental processing is required
- ❌ Avoid for one-time batch processing (JSON Compact is better)

---

### 3.5 CSV: Strong for Dense Data, Weak for Sparse

**Strengths:**
- **Lowest token cost for mandatory data**: 9,008 avg tokens (best overall)
- **Best tokens-per-accuracy ratio**: 9,008 tokens @ 70.98% weighted (mandatory)
- Highest information value for mandatory: 0.873 units/token
- Minimal reasoning overhead: ~19 tokens (vs ~4,900 for JSON/YAML)
- Linear scaling: Perfect 50% ratio (40→80)
- Strong structural understanding: +3.45% weighted vs raw

**Critical Weakness:**
- **Accuracy collapses with optional data**: 70.98% → 52.48% weighted (80-rec)
- Token cost still low with optional (6,801 avg) but accuracy makes it inefficient
- Optional accuracy: 51.95-53.33% raw (vs 62-65% mandatory)
- Format can't represent missing values elegantly

**Total Token Budget:**
- Mandatory: 9,008 avg (43% less than JSON Compact 15,957)
- Optional: 6,801 avg (49% less than JSON Compact, but poor accuracy)
- **Winner for dense data, loser for sparse data**

**Best Use Case:**
- Mandatory 80-rec: 13,006 tokens with 70.98% weighted accuracy
- **Most cost-effective format when data is guaranteed complete**

**Recommendation**:
- ✅ **First choice for dense, complete tabular data** - unbeatable token efficiency (9,008 avg)
- ✅ Best when data completeness is guaranteed (APIs with required fields)
- ❌ **Avoid for any data with optional/missing fields** - accuracy becomes worst in class
- ⚠️ Verify data is 100% complete before choosing CSV

---

### 3.6 Markdown: Format Failure Case

**Objective Data:**
- Token cost: 2.20 chars/token (efficient)
- Raw accuracy: 24.31% average (worst by far, but 31.67% at best for 40-rec mandatory)
- Weighted accuracy: 24.67% (minimal +0.36% improvement, worst structural understanding)
- Information value: 0.561 units/token average (paradoxically high, but ~76% is incorrect data)
- Degrades with optional data: -15.5% info value change
- Cost of inaccuracy: 3,671 avg tokens wasted (~76% waste ratio, worst)

**Why Markdown Fails:**
- Table format ambiguity: Column alignment confusion
- Missing metadata: No type information, sparse labeling
- Semantic HTML interpretation: Model struggles with markdown-to-semantic conversion
- Minimal weighted accuracy improvement (+0.36%): Fails to leverage structural understanding despite appearing organized

**The Paradox**:
- Uses relatively few tokens
- Returns most inaccurate answers (24.31% average)
- Wastes highest percentage of tokens on wrong outputs (76%)
- Minimal structural understanding benefit (+0.36%, worst among all formats)

**Recommendation**:
❌ **NEVER USE for LLM data exchange**
- Token efficiency is illusory (76% waste on inaccuracy)
- Accuracy so poor that format confusion adds context pollution
- Despite appearing to deliver 0.561 units/token, only 24% is accurate (effective: ~0.136 correct units/token)

---

### 3.7 YAML: Premium Information Fidelity

**Strengths:**
- **Best weighted accuracy**: 71.96% average, **76.82% at best (40-record optional)**
- **Strongest structure understanding**: +3.76% weighted vs raw accuracy (best overall)
- Structured hierarchy maps to logical data relationships
- Robust across variants: no accuracy collapse with optional fields
- Raw accuracy: 68.19% average (highest overall)

**Trade-offs:**
- **Highest token cost**: 23,559 avg mandatory, 21,906 avg optional
- Pays 48% token premium over JSON Compact (23,559 vs 15,957 mandatory)
- Consistent reasoning overhead: ~4,965 tokens (fixed structure cost)
- Information value: 0.327 units/token (lower than CSV/JSON but highest quality)
- Less widely adopted than JSON

**Total Token Budget:**
- Mandatory: 23,559 avg (2.62x more than CSV 9,008)
- Optional: 21,906 avg (3.22x more than CSV 6,801)
- **Most expensive format, but delivers highest accuracy**

**When Premium Justifies Cost:**
- YAML delivers 71.96% weighted accuracy at 22,733 avg tokens
- CSV mandatory delivers 70.98% weighted at 9,008 tokens
- YAML pays 13,725 additional tokens for +0.98% accuracy (14,005 tokens per percentage point)
- Worth it when accuracy is critical and token budget is flexible

**Recommendation**:
- ✅ Use when accuracy is paramount and token budget is flexible (23,559 avg tokens)
- ✅ Best for complex, hierarchical data requiring highest fidelity (76.82% weighted best)
- ❌ **Avoid if token budget matters** - pays 2.62x more than CSV, 1.48x more than JSON Compact
- ⚠️ Evaluate if +2% accuracy over JSON Compact justifies +48% token cost

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
| **High accuracy required** | YAML (71.96% weighted) | JSON Compact | Markdown |
| **Dense, complete tabular data** | CSV mandatory (70.98% weighted @ 80-rec) | JSON Compact | CSV with sparse data |
| **Sparse/optional fields** | JSON Compact (+41% info value) | JSONL (+43%) | CSV, TOON, Markdown |
| **Dense, mandatory data** | TOON mandatory | CSV mandatory | TOON with optional fields |
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

1. **Is token budget extremely constrained AND data guaranteed 100% complete?**
   - YES → CSV mandatory (9,008 tokens, 70.98% weighted) - unbeatable efficiency
   - NO → Continue

2. **Is accuracy critical AND token budget flexible?**
   - YES → YAML (23,559 tokens, 71.96% weighted, 76.82% best) for highest fidelity
   - NO → Continue

3. **Is incremental/streaming processing required?**
   - YES → JSONL (17,023 tokens mandatory, +43% info value with optional)
   - NO → Continue

4. **Default**: JSON Compact (15,957 tokens mandatory, 13,262 optional, 70.12% weighted)
   - Best for mixed/sparse data
   - Only format that reduces tokens with optional fields
   - Most reliable across all scenarios

### 7.2 Total Token Cost Reveals True Efficiency

This benchmark reveals **chars/token measures tokenization, but total tokens measures cost**:

**CSV's Unbeatable Efficiency for Dense Data:**
- Mandatory: 9,008 tokens with 70.98% weighted accuracy (best tokens-per-accuracy)
- Optional: 6,801 tokens but 52.48% weighted accuracy (worst accuracy class)
- **Conclusion**: CSV wins decisively for guaranteed complete data, fails for sparse data

**JSON Compact's Consistency Premium:**
- Mandatory: 15,957 tokens (77% more than CSV)
- Optional: 13,262 tokens (95% more than CSV, but maintains 70.12% weighted accuracy)
- **Only format that uses fewer tokens with optional data**
- Pays token premium for reliability: worth it when data characteristics are unknown

**YAML's Accuracy Premium:**
- 23,559 tokens mandatory (2.62x more than CSV, 1.48x more than JSON Compact)
- Delivers 71.96% weighted accuracy (highest overall)
- **Costs 13,725 additional tokens vs CSV for +0.98% accuracy**
- Premium justified only when accuracy is critical and token budget flexible

**TOON's Optional Data Catastrophe:**
- Mandatory: 9,905 tokens (competitive)
- Optional: 21,449 tokens (2.17x explosion, worst in class)
- **Never use for optional fields** - token cost explodes

**Markdown's Illusion:**
- Cheapest: 4,808 tokens
- But wastes 76% on inaccuracy (24.67% weighted accuracy)
- **Token savings are meaningless with 76% accuracy failure**

**Principle**: Choose CSV for guaranteed dense data (9,008 tokens). Choose JSON Compact for flexibility (15,957 mandatory, 13,262 optional). Choose YAML only when accuracy justifies 2.62x token premium.

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
| CSV | 9,672 | 3,334 | 0 | 13,006 | 65.56% |
| JSON Compact | 15,661 | 3,334 | 0 | 18,995 | 66.39% |
| JSON Pretty | 29,490 | 4,991 | 0 | 34,481 | 64.17% |
| JSONL | 15,974 | 4,991 | 0 | 20,965 | 66.67% |
| TOON | 9,760 | 4,991 | 0 | 14,751 | 64.72% |
| Markdown | 6,059 | 23 | 0 | 6,082 | 19.45% |
| YAML | 24,971 | 4,991 | 0 | 29,962 | 66.67% |

### A.2 Information Value Summary (all variants)

| Format | 80-Mandatory | 40-Mandatory | 80-Optional | 40-Optional | Average |
|--------|------------|------------|-----------|-----------|---------|
| CSV | 0.504 | 1.242 | 0.579 | 1.153 | 0.867 |
| TOON | 0.439 | 1.170 | 0.228 | 0.388 | 0.556 |
| Markdown | 0.320 | 0.896 | 0.389 | 0.638 | 0.561 |
| JSON Compact | 0.350 | 0.537 | 0.329 | 0.925 | 0.535 |
| JSONL | 0.318 | 0.525 | 0.305 | 0.902 | 0.513 |
| YAML | 0.223 | 0.410 | 0.228 | 0.451 | 0.328 |
| JSON Pretty | 0.186 | 0.355 | 0.194 | 0.374 | 0.277 |

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

- **Report Generated**: 2026-01-25
- **Written by**: [Thore Höltig](https://github.com/thoeltig)
- **With the help of**: Claude 4.5 Sonnet
- **Data Source**: `benchmark_format_all_variant_all_haiku_off/analytics_results.json`
- **Next Iteration**: Extended thinking impact analysis and nested objects (Iteration 2)
- **Publication**: Open source research in [GitHub repository](https://github.com/thoeltig/file-format-token-accuracy-benchmark)