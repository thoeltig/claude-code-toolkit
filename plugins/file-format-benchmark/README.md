# File Format Token Efficiency Benchmark

Comprehensive benchmarking suite for measuring token efficiency and accuracy across file formats for LLM consumption.

## Overview

This framework validates which file formats deliver the most reliable information to LLMs with optimal token efficiency. The benchmark focuses on **structural and retrieval accuracy**—understanding data organization and extracting specific values—which are fundamental to avoiding context confusion.

**Note on Question Categories**: Complex filtering and mathematical aggregation are interesting but test the model's intelligence rather than format effectiveness. Also the accuracy for filtering and aggregation would be irrelevant if the data is prefiltered or the data contains fields with the calculated values. Structural questions (understanding data shape/organization) and retrieval questions (extracting specific values) directly validate format clarity.

## Initial Test Run & Methodology

The initial benchmark run (Dec 19, 2025) with Claude 4.5 Haiku tested 7 formats across 120 questions with weighted accuracy prioritizing structural understanding and retrieval (60% combined weight vs filtering/aggregation at 40%). 4 flat array data sets of variants 40 and 80 records, random optional fields and all mandatory fields.

**Key Findings** (see [BenchmarkReport.md](./benchmark_format_all_variant_all_haiku_off/BENCHMARK_REPORT.md)):
- **CSV**: Unbeatable for dense, mandatory data (70.98% weighted @ 9,008 tokens). Accuracy drops by ~15% with sparse data.
- **JSON Compact**: Recommended baseline. 1.46x tokens compared to CSV but 70.12% weighted accuracy with consistency across all variants.
- **JSON Pretty**: Not recommended. 1.88x tokens compared to JSON Compact with similiar accuracy. Formatting only adds tokens but does not increase accuracy.
- **YAML**: Highest accuracy (71.96% weighted) but 2.62x token compared to CSV.
- **TOON**: Close to CSV for dense, mandatory data. Accuracy stays consitent with sparse data but tokens increased by 2.17x.
- **Markdown**: Requieres x0.5 of CSV tokens but has a catastrophical weighted accuracy of 24.67%. ~75% of tokens wasted on wrong answers.
- **Linear Scaling Validated**: All formats and variants scale linearly with data volume (48-52% reduction from 80 to 40 records).

## Next Test Setup (Current Configuration)

**Active Formats** (6 total):
- CSV (baseline efficiency)
- JSON Compact (recommended baseline)
- JSON Pretty (formatting overhead reference)
- TOON (custom binary format)
- XML (newly added)
- YAML (highest accuracy, premium cost)

**Removed after Initial Test**:
- ❌ JSONL (streaming variant—less relevant for benchmark)
- ❌ Markdown (24.67% accuracy—unreliable)
- ❌ Apache Logs (irrelevant for general data benchmarking)

**Record Count**: 60 records (single standardized count, replaces 40/80 records)

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

A benchmark is executed over flat or nested structure to have a clear per structure analytics result which compares mandatory and optional variants for all formats. Running both structures at the same time is possible but analytics script is designed to compare the all formats per variants which currently does not include a grouping by structure.

1. **Run `npm run generate`** to ensure data and questionnaires are current
2. **Choose a structure** to test (flat or nested)
3. **Execute subagent tests** for each of 6 formats and variants
4. **Run `npm run analyze`** from generate results from system messages and validation results
5. **Analyze result** for accuracy or token usage

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

### Step 3: Validation

```bash
# After subagent saves answers, validate efficiency and accuracy:
npm run analyze --agent-ids "agent_ids.json" --output "benchmark"
```

This creates:
```
benchmarking/analytics_results.json # Ranked summary and also accuracy, token usage and efficiency breakdown per testcase
```

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

## Data Characteristics

All formats contain the same 60-record product dataset with 22 fields:

### Format Specifics
- **CSV**: A format for storing tabular data where each line is a record and columns are separated by commas.
- **JSON Pretty**: A format for storing structured data with key-value pairs and arrays. Indented for human readability.
- **JSON Compact**: Same as JSON Pretty but minified (no whitespace or new lines).
- **XML**: A format for storing structured data with hierarchical tags that separate information from its presentation. Indented for human readability.
- **TOON**: A compact, human-readable encoding of the JSON data model for LLM prompts (see [Token-Oriented Object Notation](https://toonformat.dev/))
- **YAML**: A format for storing structured data with hierarchical indentation for a human-readability.

### Record Count
- **60 records**
- 19 mandatory + 3 potencially optional fields per record × 60 records = 1140 to 1320 data points

### Standard Fields (All Formats)
- Product ID, Name, Category, Price, Description
- Stock quantity, Min/Max thresholds
- Supplier information, Lead times
- Timestamps, Last update
- And 12 additional mandatory fields

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

## Framework Extensibility

To modify test parameters:

1. **New Record Count**: Update `scripts/consts.ts` `RECORDS` constant, then `npm run generate`
2. **New Questions**: Edit question generators in `scripts/generators/`
3. **New Validation Method**: Update `scripts/validators/` logic
4. **New Metric**: Extend `scripts/analytics.ts` aggregation

---

## License

See root [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)