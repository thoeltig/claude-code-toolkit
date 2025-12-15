---
description: Orchestrate comprehensive benchmarking tests for file format token efficiency (CSV, JSON (compact/pretty), JSONL, TOON, Markdown, YAML, Apache). Generates test data, executes sequential tests with configurable model (haiku/sonnet) and thinking mode, validates results, and calculates efficiency metrics. Triggers: benchmark, format efficiency, token measurement, performance testing
argument-hint: [--formats csv,json_compact,json_pretty,jsonl,toon,markdown,yaml,apache] [--variant optional,mandatory] [--model haiku|sonnet] [--thinking on|off]
allowed-tools: Bash
---

# Benchmarking Test Orchestration

You are orchestrating a comprehensive benchmarking test suite for measuring file format token efficiency.

## Primary Scripts

**Main Orchestration & Validation Entry Points:**
- `orchestrator.ts` → `dist/orchestrator.js` - Generates test data and metadata
- `validate.ts` → `dist/validate.js` - **Primary validation script** (compiles AnswerValidator class)
- `analytics.ts` → `dist/analytics.js` - Generates efficiency metrics and rankings

**Supporting Utilities:**
- `validators/index.ts` - Core AnswerValidator class (used by validate.ts)
- `generators/` - Data generation utilities
- `converters/` - Format conversion tools

## Parse Arguments

Extract from $ARGUMENTS:
- `--formats`: Comma-separated list of formats to test (default: all - csv,json_compact,json_pretty,jsonl,toon,markdown,yaml,apache)
- `--variant`: Data variant with optional or mandatory values (default: both - optional,mandatory)
- `--model`: haiku or sonnet (default: haiku)
- `--thinking`: on or off (default: on)

Example:
- `--formats csv,markdown` → Test only CSV and Markdown
- `--model sonnet --thinking off` → Use Sonnet without extended thinking
- No args → Test all formats with Haiku and thinking enabled

## Step 1: Generate Test Data

Build the TypeScript project and run test data generation:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts
npm run build
npm run generate
```

This:
1. Installs dependencies (TypeScript)
2. Compiles TypeScript to JavaScript (orchestrator.ts, analytics.ts, etc.)
3. Generates test data:
   - Data files (CSV, JSON compact/pretty, JSONL, TOON, Markdown, YAML, Apache logs)
   - 2 data variants: optional, mandatory
   - Record count format: 100, 50
   - Questionnaires with 100+ questions per dataset
   - Answer templates
   - metadata.json with all dataset information
   - Directory structure for test execution

## Step 2: Load Test Configuration

Read `${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/metadata.json` to get all test cases.

For each format in the selected formats list:
  For each optional data variant in the selected variant list:
    For each recordCount (100, 50):
      Create a test case: `{format}_{variant}_{recordCount}_{model}_{thinking}`

Example test cases:
- csv_optional_100_haiku_on
- csv_mandatory_75_haiku_on
- json_mandatory_compact_50_sonnet_off
- markdown_optional_25_haiku_on

**Total test cases**: selected_formats × selected_variant × 2 record counts

If all 9 formats selected: 8 x 2 × 2 = 32 test cases

## Step 3: Execute Tests SEQUENTIALLY

**CRITICAL**: Tests must run sequentially (NOT parallel). User needs to see token usage after each test.

For EACH test case in order:

### 3a. Invoke Read-Only Test

```
Use the Task tool:

Task(
  description: "Read-only test for {format}_{variant}_{recordCount}",
  subagent_type: "benchmark-read-only",
  model: "{model}",
  prompt: "Read the data file at: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/data/{format}/{format}_with_{variant}_{recordCount}_records.{ext}",
  thinking_mode: "{thinking}"
)
```

Replace:
- `{format}`: Format name (csv, json_compact, json_pretty, jsonl, toon, markdown, yaml, apache)
- `{recordCount}`: Row count (100, 50)
- `{ext}`: File extension (.csv, .json, .jsonl, .toon, .md, .yaml, .log)
- `{model}`: haiku or sonnet
- `{thinking}`: on or off

Wait for completion. Display the token usage from the system message (note it).

### 3b. Invoke Full Test

```
Use the Task tool:

Task(
  description: "Full test for {format}_{variant}_{recordCount}",
  subagent_type: "benchmark-full-test",
  model: "{model}",
  prompt: "
Format: {format}
Variant: {variant}
Record Count: {recordCount}

Files to process:
- Data file: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/data/{format}/{format}_with_{variant}_{recordCount}_records.{ext}
- Questionnaire: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/questions/questions_for_{variant}_{recordCount}_records.json
- Answer template: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/answers_template/answers_for_{variant}_{recordCount}_records_template.json
- Output path: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/subagent_outputs/{format}/answers_for_{variant}_{recordCount}_records.json

Read the data file, questionnaire, and answer template. Answer all questions based ONLY on data in the file. Save results to the output path.
  ",
  thinking_mode: "{thinking}"
)
```

Wait for completion. Display the token usage from the system message (note it).

### 3c. Move to Next Test Case

Repeat 3a and 3b for the next test case.

**Example sequence** (if --formats csv,json_compact --variant optional):
1. Read: csv_optional_100_haiku_on
2. Full: csv_optional_100_haiku_on
5. Read: csv_optional_50_haiku_on
6. Full: csv_optional_50_haiku_on
9. Read: json_compact_optional_100_haiku_on
10. Full: json_compact_optional_100_haiku_on
... (and so on)

## Step 4: Run Validation

After ALL tests complete, validate all answers using the TypeScript validator:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

# For each format × recordCount combination, validate the answers
node dist/validate.js \
  ./benchmarking/subagent_outputs/{format}/answers_for_{variant}_{recordCount}_records.json \
  ./benchmarking/answers_validation/questions_and_answers_for_{variant}_{recordCount}_records.json \
  ./benchmarking/results/{format}_{variant}_{recordCount}_validation.json

# Repeat for each test case
```

This will output validation results showing:
- Questions answered correctly
- Questions answered incorrectly
- Overall accuracy percentage per test case

Results will be written to `./benchmarking/results/` directory.

**Note:** The `validate.ts` script (compiled to `dist/validate.js`) is the primary validation entry point. It uses the AnswerValidator class to deterministically validate answers against ground truth questionnaires.

## Step 5: Collect User Metrics

Pause and request metrics from the user:

"✓ All tests complete. Validation results written to ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/results/

Now I need the token and time metrics for each test. Please provide the metrics JSON file.

Expected location: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/metrics_{model}_{thinking}.json

The file should contain an array of test results with this structure:

```json
[
  {
    "testCase": "csv_optional_100_haiku_on",
    "readDuration": 12,
    "readTokens": 2450,
    "fullDuration": 45,
    "fullTokens": 18500
  },
  {
    "testCase": "csv_optional_75_haiku_on",
    "readDuration": 11,
    "readTokens": 2100,
    "fullDuration": 42,
    "fullTokens": 17200
  },
  ... more test cases ...
]
```

You can generate this file template using the orchestrator (or extend generate.js), then fill in the actual token usage and time values from the system messages above.

Please provide the file path when ready."

## Step 6: Run Analytics

Once user provides the metrics file path:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts
node dist/analytics.js \
  --metrics {user_provided_path} \
  --metadata ./benchmarking/metadata.json \
  --validation-dir ./benchmarking/results/ \
  --output ./benchmarking/analytics_results_{model}_{thinking}.json
```

The analytics script will:
1. Load all metrics from user-provided JSON
2. Load metadata with character counts and record info
3. Load validation results for accuracy data
4. Calculate efficiency scores (chars/token, tokens/question, etc.)
5. Compare formats and record counts
6. Generate insights and rankings
7. Write comprehensive results JSON

**Note:** The `analytics.ts` script (compiled to `dist/analytics.js`) loads the `filesPerRecordCount` metadata structure and generates efficiency rankings and insights.

## Step 7: Display Results Summary

After analytics completes, read the output file and display:

```
=================================================================
BENCHMARKING RESULTS
=================================================================

Test Configuration:
- Model: {model}
- Thinking: {thinking}
- Formats tested: {formats}
- Total test cases: {count}

Key Rankings:
- Most token-efficient format: {format} ({chars_per_token} chars/token)
- Highest accuracy: {format} ({accuracy}%)
- Best overall: {format} (efficiency: {score})

Insights:
- {insight 1}
- {insight 2}
- {insight 3}
- {insight 4}

Full results saved to: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/analytics_results_{model}_{thinking}.json
=================================================================
```

## File Structure Reference

```
${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/
├── benchmarking/
│   ├── data/
│   │   ├── {format}/
│   │   │   ├── {format}_with_{variant}_100_records.{ext}
│   │   │   ├── {format}_with_{variant}_50_records.{ext}
│   │   └── metadata.json
│   ├── questions/
│   │   ├── questions_for_{variant}_100_records.json
│   │   ├── questions_for_{variant}_50_records.json
│   ├── answers_template/
│   │   ├── answers_for_{variant}_100_records_template.json
│   │   ├── answers_for_{variant}_50_records_template.json
│   ├── answers_validation/
│   │   └── questions_and_answers_for_{variant}_{recordCount}_records.json
│   ├── subagent_outputs/
│   │   └── {format}/
│   │       ├── answers_for_{variant}_100_records.json
│   │       ├── answers_for_{variant}_50_records.json
│   ├── results/
│   │   └── {format}_{variant}_{recordCount}_validation.json
│   └── metrics_{model}_{thinking}.json
├── dist/
│   ├── orchestrator.js
│   ├── analytics.js
│   ├── validate.js
│   └── validators/
├── generators/
├── converters/
├── validators/
├── orchestrator.ts
├── analytics.ts
├── validate.ts
└── package.json
```

## Format Extensions

- csv → .csv
- json_compact → .json
- json_pretty → .json
- jsonl → .jsonl
- toon → .toon
- markdown → .md
- yaml → .yaml
- apache → .log

## Important Notes

1. **Sequential Execution**: Tests must run one after another so token usage is visible
2. **User Documents Metrics Separately**: User documents read/full token counts and durations in parallel - no need to wait
3. **Validation Deferred**: All validation runs after test execution completes
4. **Analytics Last**: Analytics runs only after user provides metrics file
5. **Default All Formats**: If --formats not specified, test all 6 formats
6. **Default Haiku**: If --model not specified, use haiku
7. **Default With Thinking**: If --thinking not specified, use on
