# Benchmarking Framework

Comprehensive benchmarking suite for measuring token efficiency and understanding quality across file formats.

## Framework Purpose

This is a **two-tier benchmarking framework** for comparing file format efficiency:

**Tier 1: Baseline (This Phase)**
- Test each file format in its native state
- Measure token usage and accuracy for CSV, JSON (pretty/compact), Markdown, YAML, Apache logs
- Establish baseline: which format is most token-efficient for Claude to read?
- Results serve as comparison baseline for Tier 2

**Tier 2: Parsing Tool Evaluation (Future)**
- Compare parsing tool output (minified JSON) against Tier 1 baseline
- Measure: does JSON conversion save tokens vs reading native format?
- Identify: at what data complexity/size does JSON become worthwhile?

## Why Two Tiers?

The baseline tier answers: **"Which native format is best?"**
The parsing tier answers: **"Does conversion to JSON improve efficiency?"**

By starting with native formats, we establish clear baselines before introducing format conversion overhead.

## Structure

```
benchmarking/
├── benchmarking/                 # Generated test data & questionnaires
│   ├── data/                     # Test files (CSV, JSON, Markdown, YAML, Apache logs)
│   │   ├── csv_100.csv, csv_50.csv
│   │   ├── json_100.json, json_50.json
│   │   ├── markdown_100.md, markdown_50.md
│   │   ├── yaml_100.yaml, yaml_50.yaml
│   │   ├── apache_100.log, apache_50.log
│   │   └── metadata.json         # Characteristics of all generated data
│   ├── questionnaires/           # Paired questions (generated from data)
│   │   └── {format}_{density}.json
│   ├── answers/                  # Empty answer templates & filled answers
│   │   ├── {format}_{density}_template.json  # Empty (sent to Claude)
│   │   └── {format}_{density}_answers.json   # Filled (returned from Claude)
│   └── results/                  # Validation reports
│       └── {format}_{density}_{scenario}_validation.json
├── generate.js                   # Generate all test data (RUN THIS FIRST)
└── README.md                     # This file
```

## Quick Start

### Step 1: Generate Test Data (Already Done)

Test data and questionnaires are in:
```
benchmarking/data/          # Test files (CSV, JSON pretty/compact, Markdown, YAML, Apache)
benchmarking/questionnaires/  # Questions (50 per format)
benchmarking/answers/       # Answer templates (blank)
benchmarking/subagent_output/  # Subagent results (auto-populated)
```

**Datasets:** 12 files (5 formats + JSON variants) × 2 densities = 12 test files
- CSV 100%, CSV 50%
- JSON Compact 100%, JSON Compact 50%
- JSON Pretty 100%, JSON Pretty 50%
- Markdown 100%, Markdown 50%
- YAML 100%, YAML 50%
- Apache Logs 100%, Apache Logs 50%

Each dataset includes:
- Data file (~60k characters)
- Questionnaire with 50 questions
- Empty answer template

### Step 2: Test Session (Baseline Tier)

For Tier 1 baseline testing, follow this session workflow:

## Testing Workflow (Session-Based)

The testing follows a **session-based workflow** where you control the pace:

### Phase 1: Subagent Execution
I invoke the subagent for a test case (format + density pair). The subagent:
1. Reads the data file and questionnaire
2. Answers all 50 questions
3. **Saves results to** `benchmarking/subagent_output/{format}_{density}_baseline_answers.json`
4. Confirms file save

### Phase 2: Metric Documentation
You record from the system message:
- **Token usage** (tokens used by subagent)
- **Time taken** (wall clock time)
- **Accuracy** (you can run validator.js on the answers if needed)

Save metrics to a text file:
```
csv_100_baseline
Tokens: XXXX
Time: Xs
Accuracy: XX%

csv_50_baseline
Tokens: XXXX
Time: Xs
Accuracy: XX%

... (repeat for all formats)
```

### Phase 3: Analysis
Once all baseline tests are documented, you provide the metrics file and I:
1. Aggregate results across all formats
2. Correlate with answer accuracy
3. Identify which format is most token-efficient
4. Prepare comparison baseline for Tier 2

### Example: Test CSV @ 100% Density

**Session Step 1 - I invoke subagent:**
```
Subagent: Read these files and answer all questions
- Data: benchmarking/data/csv_100.csv
- Questions: benchmarking/questionnaires/csv_100.json
- Template: benchmarking/answers/csv_100_template.json
- Save output to: benchmarking/subagent_output/csv_100_baseline_answers.json
```

**Session Step 2 - Subagent executes** (takes ~30-60 seconds)
Returns system message with token usage and time taken

**Session Step 3 - You document:**
```
csv_100_baseline
Tokens: 24500
Time: 45s
```

**Session Step 4 - Repeat** for next format+density pair

## Format Variants

### JSON Variants (Special)
JSON has two variants to measure formatting impact:
- **json_compact**: Minified JSON (no whitespace)
- **json_pretty**: Pretty-printed JSON (indented)

Both contain the same data, allowing token comparison:
```
json_100_compact.json  (60KB) vs json_100_pretty.json  (85KB+)
json_50_compact.json   (48KB) vs json_50_pretty.json   (70KB+)
```

**Expected:** Pretty JSON will use more tokens despite having identical information

## Data Characteristics

### CSV Files

- **100% Density**: ~60k characters, 15 fields per record, ~110 records
- **50% Density**: ~48k characters, ~7-10 fields per record (optional fields omitted)
- **Format**: Standard comma-delimited with quoted fields

### JSON Files

- **100% Density**: Full object structure with all fields
- **50% Density**: Omitted optional fields (`avgRating`, `shelfLife`, etc.)
- **Format**: Minified JSON (no pretty-printing)

### Markdown Files

- **100% Density**: Full product catalog with tables, sections by category
- **50% Density**: Same structure, fewer columns in tables
- **Format**: Markdown with headers, tables, list format

### YAML Files

- **100% Density**: Full YAML with all fields and indentation
- **50% Density**: Sparse YAML with optional fields omitted
- **Format**: YAML structure with proper indentation

### Apache Log Files

- **100% Density**: 110+ log entries with all fields
- **50% Density**: Same entries but fewer optional fields
- **Format**: Apache Combined Log Format

## Questionnaire Structure

50 questions per format, distributed by category and difficulty:

### Question Categories

1. **Field Retrieval (30%)** - Extract specific values
   - Difficulty: Easy
   - Example: "What is the price of product PROD-000001?"
   - Validation: Exact match

2. **Aggregation (30%)** - Sum, average, count across records
   - Difficulty: Medium
   - Example: "What is the total stock quantity?"
   - Validation: Numeric with tolerance

3. **Filtering (20%)** - Count matching criteria
   - Difficulty: Medium
   - Example: "How many products are out of stock?"
   - Validation: Numeric count

4. **Structure Awareness (15%)** - Understand data organization
   - Difficulty: Medium-Hard
   - Example: "List all unique product categories"
   - Validation: Array/set matching

5. **Deduction (5%)** - Infer relationships, reasoning
   - Difficulty: Hard
   - Example: "Which supplier supplies the most products?"
   - Validation: Fuzzy matching on keywords (for now), manual review (eventually)

### Answer Validation

**Deterministic validation methods:**
- `exact`: Case-insensitive string match
- `numeric`: Number with tolerance
- `array_set`: Check if expected items present in answer
- `fuzzy_deduction`: Check if keywords present (70% threshold)
- `manual`: Requires human review (deduction questions)

**Accuracy calculation:**
```
Accuracy = (Correct Answers / Total Validatable Answers) × 100
Note: Deduction questions (manual) are tracked separately
```

## Baseline Testing (Tier 1)

### Test Sequence

Test all formats and density variants:

1. **CSV 100%** - baseline
2. **CSV 50%** - baseline
3. **JSON Compact 100%** - baseline
4. **JSON Compact 50%** - baseline
5. **JSON Pretty 100%** - baseline
6. **JSON Pretty 50%** - baseline
7. **Markdown 100%** - baseline
8. **Markdown 50%** - baseline
9. **YAML 100%** - baseline
10. **YAML 50%** - baseline
11. **Apache 100%** - baseline
12. **Apache 50%** - baseline

**Total: 12 baseline test executions** (one per format+density combination)

### Testing Process

For each test:
1. I invoke subagent with format+density pair
2. Subagent reads data, answers 50 questions
3. Results saved to `benchmarking/subagent_output/{format}_{density}_baseline_answers.json`
4. System message provides tokens + time
5. You document metrics in text file
6. Repeat for next format+density pair

Once all 12 tests complete, you provide metrics aggregation and I analyze results.

## Validation & Results

### Answer Validation Process

```bash
# After subagent saves filled answers:
node validate.js \
  --answers benchmarking/subagent_output/csv_100_baseline_answers.json \
  --questionnaire benchmarking/questionnaires/csv_100.json \
  --output benchmarking/results/csv_100_baseline_validation.json
```

### Validation Output

```json
{
  "format": "csv",
  "density": 100,
  "tier": "baseline",
  "totalQuestions": 50,
  "accuracy": {
    "correct": 48,
    "incorrect": 1,
    "requiresReview": 1,
    "accuracyPercent": 96
  },
  "results": [
    {
      "questionId": 1,
      "question": "What is the price of product PROD-000001?",
      "givenAnswer": "1234.56",
      "expectedAnswer": "1234.56",
      "correct": true,
      "category": "field_retrieval",
      "method": "exact",
      "confidence": 1.0,
      "requiresManualReview": false
    }
    // ... more results
  ]
}
```

### Baseline Results Aggregation

After all 12 baseline tests complete, you provide metrics and I aggregate results:

```json
{
  "benchmarkSummary": {
    "timestamp": "2025-12-11T...",
    "tier": "baseline",
    "formats": ["csv", "json_compact", "json_pretty", "markdown", "yaml", "apache"],
    "densities": [100, 50],
    "totalTests": 12,
    "results": {
      "csv": {
        "100": { "accuracy": 94, "tokensUsed": 24500, "timeSeconds": 45 },
        "50": { "accuracy": 96, "tokensUsed": 18200, "timeSeconds": 42 }
      },
      "json_compact": {
        "100": { "accuracy": 92, "tokensUsed": 22100, "timeSeconds": 48 },
        "50": { "accuracy": 95, "tokensUsed": 16800, "timeSeconds": 44 }
      },
      "json_pretty": {
        "100": { "accuracy": 90, "tokensUsed": 28900, "timeSeconds": 50 },
        "50": { "accuracy": 94, "tokensUsed": 21400, "timeSeconds": 46 }
      }
      // ... more formats
    },
    "insights": [
      "Format efficiency ranking (by tokens per 50 questions)",
      "Impact of JSON formatting (pretty vs compact)",
      "Density impact on token usage and accuracy",
      "Ready for Tier 2 comparison with parsing tool"
    ]
  }
}
```

## File Sizing Reference

To help estimate token usage (3-5 chars/token):

| Format | 100% | 50% |
|--------|------|-----|
| CSV | 28KB | 22KB |
| JSON | 60KB | 48KB |
| Markdown | 16KB | 16KB |
| YAML | 70KB | 57KB |
| Apache Logs | 20KB | 20KB |

## Next Steps (Baseline Tier 1)

1. **I invoke first subagent** for CSV @ 100% density
2. **Subagent executes**, saves to `benchmarking/subagent_output/csv_100_baseline_answers.json`
3. **You document** tokens + time from system message
4. **I invoke next subagent** for CSV @ 50% density
5. **Repeat cycle** for all 12 format+density pairs
6. **You aggregate** all metrics into text file
7. **I analyze** results and prepare Tier 2 baseline

## Future: Tier 2 Testing

Once Tier 1 baseline complete:
1. You provide parsing tool output (minified JSON conversions)
2. I invoke subagents for Tier 2 tests (same questionnaires, tool-converted data)
3. Compare Tier 2 results against Tier 1 baseline
4. Measure: token savings vs accuracy impact

## Framework Extensibility

To add new test scenarios or formats:

1. **New Format**: Update `generate.js` converters section
2. **New Questions**: Modify `generateQuestionnaire()` in `generate.js`
3. **New Validation Method**: Update validator logic
4. **New Metrics**: Extend token tracking or results aggregation

All without modifying core framework structure.

## Known Limitations

- Deduction questions require manual review (2 per format)
- Token tracking relies on system message parsing (not atomic measurements)
- Single seed for all test data (reproducible but not representative of variance)
- Subagent must manually save files (could be automated in future)

## Success Criteria - Tier 1

Framework is successful if:
- ✅ Test data generated for all 6 formats (5 + JSON variants)
- ✅ 50 questions per format (deterministic answers)
- ✅ All 12 baseline tests executable
- ✅ Subagent saves results to proper output folder
- ✅ Token usage measurable from system message
- ✅ Accuracy metrics calculated from answers
- ✅ Results reproducible and analyzable
- ✅ Ready for Tier 2 tool comparison

---

**Status**: ✅ Tier 1 Framework Complete - Ready for Baseline Testing
**Last Updated**: 2025-12-11
**Phase**: Tier 1 Baseline (12 tests remaining)
**Next**: Execute baseline tests, document metrics, then move to Tier 2
