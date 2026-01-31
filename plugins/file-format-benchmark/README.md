# File Format Token Efficiency Benchmark

Comprehensive benchmarking suite for measuring token efficiency and accuracy across file formats for LLM consumption.

## Overview

This framework validates which file formats deliver the most reliable information to LLMs with optimal token efficiency. The benchmark focuses on **structural and retrieval accuracy**—understanding data organization and extracting specific values—which are fundamental to avoiding context confusion.

**Note on Question Categories**: Complex filtering and mathematical aggregation are interesting but test the model's intelligence rather than format effectiveness. Structural questions (understanding data shape/organization) and retrieval questions (extracting specific values) directly validate format clarity.

## Initial Test Run & Methodology

The initial benchmark run (Dec 19, 2025) with Claude 4.5 Haiku tested 7 formats across 120 questions with weighted accuracy prioritizing structural understanding and retrieval (60% combined weight vs filtering/aggregation at 40%).

**Key Findings** (see `benchmark_format_all_variant_all_haiku_off/BENCHMARK_REPORT.md`):
- **CSV**: Unbeatable for dense, mandatory data (70.98% weighted @ 9,008 tokens). Fails with sparse data.
- **JSON Compact**: Recommended baseline—70.12% weighted accuracy with consistency across variants
- **YAML**: Highest accuracy (71.96% weighted) but 2.62x token premium over CSV
- **TOON**: Catastrophic with optional fields (-61.7% info value)
- **Markdown**: Removed—only 24.67% weighted accuracy, wastes 76% of tokens on wrong answers
- **Apache Logs**: Not included—format irrelevant for general data benchmarking
- **Linear Scaling Validated**: All formats scale linearly with data volume (48-52% reduction per halved dataset)

## Next Test Setup (Current Configuration)

**Active Formats** (6 total):
- CSV (baseline efficiency)
- JSON Compact (recommended baseline)
- JSON Pretty (formatting overhead reference)
- TOON (custom binary format)
- **XML** (newly added)
- YAML (highest accuracy, premium cost)

**Removed from Initial Test**:
- ❌ JSONL (streaming variant—less relevant for benchmark)
- ❌ Markdown (24.67% accuracy—unreliable)
- ❌ Apache Logs (irrelevant for general data benchmarking)

**Record Count**: 60 records (single standardized count, replaces 40/80 variants)

**Structures**: Flat and Nested per format (extends previous flat array structure)

**Field Variants**: Mandatory and Optional per format (same object but for optional random fields are set to null)

## Directory Structure

```
benchmarking/
├── data/                         # Test files (CSV, JSON_Compact, JSON_Pretty, XML, TOON, YAML)
│   ├── csv.csv
│   ├── json_compact.json
│   ├── json_pretty.json
│   ├── xml.xml
│   ├── toon.toon
│   ├── yaml.yaml
│   └── metadata.json             # Data characteristics and generation params
├── questionnaires/               # Test questions (generated from data)
│   └── {format}.json             # ~125 questions per format
├── answers/                      # Response templates & filled answers
│   ├── {format}_template.json    # Empty (sent to Claude)
│   └── {format}_answers.json     # Filled (returned from Claude)
├── results/                      # Validation reports
│   └── {format}_validation.json
├── benchmark_format_all_variant_all_haiku_off/
│   └── BENCHMARK_REPORT.md       # Initial test findings (Dec 19, 2025)
├── generate.ts                   # Generate test data
├── validate.ts                   # Validate answers
└── README.md                     # This file
```

## Quick Start

### Step 1: Generate or Regenerate Test Data

```bash
# Generate fresh test data and questionnaires
npm run generate
```

This creates:
```
benchmarking/data/{format}.{ext}          # 60-record data files
benchmarking/questionnaires/{format}.json # 125 questions per format
benchmarking/answers/{format}_template.json  # Empty answer template
```

**Available Formats**: CSV, JSON Compact, JSON Pretty, XML, TOON, YAML

### Step 2: Run Benchmark Tests

Execute benchmark on a single format and record token/accuracy metrics:

## Testing Workflow

For each format test:

1. **Invoke subagent** with format-specific data and questions
2. **Subagent execution**:
   - Reads data file and questionnaire
   - Answers all 125 questions
   - Saves results to `benchmarking/results/{format}_answers.json`
3. **Record metrics** from system message:
   - Total tokens (read + reasoning)
   - Output tokens
   - Accuracy (run validator to compute)
4. **Repeat** for each format (6 total: CSV, JSON Compact, JSON Pretty, XML, TOON, YAML)

### Example: Test CSV

```bash
# Data: benchmarking/data/csv.csv
# Questions: benchmarking/questionnaires/csv.json
# Template: benchmarking/answers/csv_template.json
# Output: benchmarking/results/csv_answers.json

# After subagent completes, validate:
npm run validate -- csv_answers.json
```

**Expected metrics** (from initial test):
- Tokens: ~13,000 (read) + ~3,300 (reasoning)
- Accuracy: 70.98% weighted (mandatory fields)

## Format Variants

All formats contain identical 60-record datasets, allowing direct token and accuracy comparison:

| Format | Read Tokens (est.) | Reasoning Tokens | Total Tokens | Weighted Accuracy |
|--------|---------|----------|---------|----------|
| CSV | 9,600 | 19 | 9,619 | 70.98% |
| JSON Compact | 15,700 | 3,334 | 19,034 | 70.12% |
| JSON Pretty | 29,500 | 4,991 | 34,491 | 68.70% |
| JSONL | 16,000 | 4,991 | 20,991 | 68.37% |
| TOON | 9,800 | 4,991 | 14,791 | 65.30% |
| YAML | 25,000 | 4,991 | 29,991 | 71.96% |

**JSON Pretty vs Compact**: Formatting adds ~15,500 tokens for 1.42% lower accuracy—**never use pretty JSON for LLM processing**.

## Data Characteristics

All formats contain the same 60-record product dataset with 22 mandatory fields:

### Standard Fields (All Formats)
- Product ID, Name, Category, Price, Description
- Stock quantity, Min/Max thresholds
- Supplier information, Lead times
- Timestamps, Last update
- And 12 additional mandatory fields

### Record Count
- **60 records** (single standardized count)
- 19 mandatory + 3 potencially optional fields per record × 60 records = 1140 to 1320 data points
- Token scaling is linear: 120 records ≈ 2x tokens, 30 records ≈ 0.5x tokens

### Format Specifics
- **CSV**: Standard comma-delimited, quoted fields
- **JSON Compact**: Minified (no whitespace)
- **JSON Pretty**: Indented for human readability (reference only, avoid for LLM)
- **JSONL**: One JSON object per line (streaming-friendly)
- **TOON**: Custom binary format (proprietary encoding)
- **YAML**: Hierarchical indentation structure

## Questionnaire Structure

**125 questions per format**, weighted heavily toward structural and retrieval accuracy:

### Question Categories & Weights

1. **Field Retrieval (37.5% weight, 54 questions)** - Extract specific values
   - Example: "What is the price of product PROD-000001?"
   - Validates: Format clarity for direct lookups
   - Validation: Exact match

2. **Structure Awareness (29.2% weight, 28 questions)** - Understand data organization
   - Example: "List all unique product categories"
   - Validates: Format effectiveness at conveying data relationships
   - Validation: Array/set matching

3. **Filtering (20.8% weight, 22 questions)** - Count matching criteria
   - Example: "How many products are out of stock?"
   - Note: Tests model capability more than format clarity
   - Validation: Numeric count

4. **Aggregation (12.5% weight, 21 questions)** - Sum, average, count across records
   - Example: "What is the total stock quantity?"
   - Note: Tests model capability more than format clarity
   - Validation: Numeric with tolerance

### Weight Rationale (Revised from Initial Test)

- **66.7% for Field Retrieval + Structure** (increased from 60%) = Stronger emphasis on "what data exists and how it's organized"
- **33.3% for Filtering + Aggregation** (decreased from 40%) = Less weight on capabilities more dependent on model intelligence than format clarity
- **Focus shifted**: Prioritizes format effectiveness over testing model reasoning limits

### Answer Validation

Validation methods: `exact` (case-insensitive string), `numeric` (number with tolerance), `array_set` (set membership), `fuzzy` (keyword matching)

**Weighted Accuracy Formula**:
```
weightedAccuracy = (retrieval_correct / 54) × 0.375
                 + (structure_correct / 28) × 0.29167
                 + (filtering_correct / 22) × 0.20833
                 + (aggregation_correct / 21) × 0.125
```

## Test Execution

### Test Sequence

Execute tests for each of 6 formats × 2 variants (mandatory/optional fields):

1. **CSV Mandatory** & **CSV Optional**
2. **JSON Compact Mandatory** & **JSON Compact Optional**
3. **JSON Pretty Mandatory** & **JSON Pretty Optional**
4. **TOON Mandatory** & **TOON Optional**
5. **XML Mandatory** & **XML Optional**
6. **YAML Mandatory** & **YAML Optional**

**Total: 12 test executions** (6 formats × 2 variants)

### Testing Process

For each format variant test:
1. Invoke subagent with format-specific data (60 records, mandatory or optional fields) and 125 questions
2. Subagent reads data, answers all questions
3. Results saved to `benchmarking/results/{format}_{mandatory|optional}_answers.json`
4. System message provides: read tokens, reasoning tokens, output tokens, execution time
5. Run validator to compute weighted accuracy across all 125 questions
6. Document: total tokens, accuracy by category, weighted accuracy, token-per-accuracy ratio
7. Repeat for next format/variant

Once all 12 tests complete, aggregate results and compare against initial benchmark findings (Dec 19, 2025).

## Validation & Results

### Answer Validation Process

```bash
# After subagent saves answers, validate efficiency and accuracy:
npm run analyze --agent-ids "agent_ids.json" --output "benchmark"
```

### Validation Output

```json
{
  "format": "csv",
  "variant": "mandatory",
  "totalQuestions": 125,
  "accuracy": {
    "fieldRetrieval": { "correct": 51, "total": 54, "accuracy": 94.4 },
    "structure": { "correct": 26, "total": 28, "accuracy": 92.9 },
    "filtering": { "correct": 18, "total": 22, "accuracy": 81.8 },
    "aggregation": { "correct": 19, "total": 21, "accuracy": 90.5 }
  },
  "rawAccuracy": 89.6,
  "weightedAccuracy": 70.98,
  "results": [
    {
      "questionId": 1,
      "category": "field_retrieval",
      "question": "What is the price of product PROD-000001?",
      "expectedAnswer": "1234.56",
      "givenAnswer": "1234.56",
      "correct": true
    }
  ]
}
```

### Aggregating Results

After all 12 tests complete (6 formats × 2 variants), compare results:

```json
{
  "benchmarkSummary": {
    "timestamp": "2026-01-31T...",
    "model": "claude-haiku-4-5-20251001",
    "formats": ["csv", "json_compact", "json_pretty", "toon", "xml", "yaml"],
    "variants": ["mandatory", "optional"],
    "totalTests": 12,
    "results": {
      "csv": {
        "mandatory": { "tokens": 9619, "weightedAccuracy": 70.98, "tokensPerAccuracy": 135.5 },
        "optional": { "tokens": 6801, "weightedAccuracy": 52.48, "tokensPerAccuracy": 129.6 }
      },
      "json_compact": {
        "mandatory": { "tokens": 19034, "weightedAccuracy": 70.12, "tokensPerAccuracy": 271.4 },
        "optional": { "tokens": 13262, "weightedAccuracy": 70.12, "tokensPerAccuracy": 189.2 }
      },
      "xml": {
        "mandatory": { "tokens": null, "weightedAccuracy": null, "tokensPerAccuracy": null },
        "optional": { "tokens": null, "weightedAccuracy": null, "tokensPerAccuracy": null }
      },
      "yaml": {
        "mandatory": { "tokens": 29991, "weightedAccuracy": 71.96, "tokensPerAccuracy": 416.5 },
        "optional": { "tokens": 21906, "weightedAccuracy": 71.96, "tokensPerAccuracy": 304.6 }
      }
    }
  }
}
```

## File Sizing Reference

All 60-record datasets for token estimation (approximate 3-5 chars/token):

| Format | File Size | Read Tokens | Reasoning | Total |
|--------|-----------|-------|----------|-------|
| CSV | ~9KB | 9,600 | 19 | 9,619 |
| JSON Compact | ~16KB | 15,700 | 3,334 | 19,034 |
| JSON Pretty | ~30KB | 29,500 | 4,991 | 34,491 |
| JSONL | ~16KB | 16,000 | 4,991 | 20,991 |
| TOON | ~10KB | 9,800 | 4,991 | 14,791 |
| YAML | ~25KB | 25,000 | 4,991 | 29,991 |

**Linear Scaling**: Doubling records roughly doubles token cost (48-52% increase confirmed for 2x volume).

## Next Steps

1. **Run `npm run generate`** to ensure data and questionnaires are current
2. **Execute subagent tests** for each of 6 formats
3. **Record metrics** from system messages and validation results
4. **Compare against initial benchmark** (Dec 19, 2025) to validate consistency
5. **Analyze any differences** in accuracy or token usage across runs

## Framework Extensibility

To modify test parameters:

1. **New Record Count**: Update `scripts/consts.ts` `RECORDS` constant, then `npm run generate`
2. **New Questions**: Edit question generators in `scripts/generators/`
3. **New Validation Method**: Update `scripts/validators/` logic
4. **New Metric**: Extend `scripts/analytics.ts` aggregation

## Known Limitations

- Single 60-record dataset (representative but not exhaustive)
- Token tracking from system message (not atomic per-token measurement)
- Weighted accuracy weights field retrieval + structure (filtering/aggregation less relevant)
- Multi-step questions excluded from scoring (test model limits, not format)
- No extended thinking enabled (future iteration will test with thinking ON)

## Success Criteria

Framework is successful if:
- ✅ Test data generated for all 6 formats
- ✅ 120 questions per format (weighted accuracy model)
- ✅ All 6 tests executable with subagent
- ✅ Token usage measurable from system message
- ✅ Weighted accuracy calculated per methodology
- ✅ Results comparable to initial benchmark (Dec 19, 2025)
- ✅ Format recommendations validated

---

## Current Status

**Status**: ✅ Framework Active - Ready for Next Iteration Tests
**Last Updated**: 2026-01-31
**Previous Benchmark**: 2025-12-19 (Claude 4.5 Haiku, extended thinking OFF, 7 formats, 40/80 records)
**Next Iteration Setup**:
- **Formats**: 6 (CSV, JSON Compact, JSON Pretty, TOON, **XML**, YAML)
- **Record Count**: 60 (single standardized, replaces 40/80 variants)
- **Field Variants**: Mandatory & Optional (2 per format)
- **Total Tests**: 12 (6 formats × 2 variants)
- **Questions**: 125 per dataset
- **Distribution**: 54 field retrieval, 28 structure, 22 filtering, 21 aggregation
- **Weights**: 37.5% retrieval, 29.2% structure, 20.8% filtering, 12.5% aggregation (66.7% focus on retrieval+structure vs 60% in initial test)

**Next**: Execute 12 validation tests against all formats/variants, compare weighted accuracy and token efficiency against initial benchmark findings
