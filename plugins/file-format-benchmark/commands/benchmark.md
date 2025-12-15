---
description: Orchestrate comprehensive benchmarking tests for file format token efficiency (CSV, JSON (compact/pretty), JSONL, TOON, Markdown, YAML, Apache). Generates test data, executes sequential tests with configurable model (haiku/sonnet) and thinking mode, validates results, and calculates efficiency metrics. Triggers: benchmark, format efficiency, token measurement, performance testing
argument-hint: [--formats csv,json_compact,json_pretty,jsonl,toon,markdown,yaml,apache] [--model haiku|sonnet] [--thinking on|off]
allowed-tools: Bash
---

# Benchmarking Test Orchestration

You are orchestrating a comprehensive benchmarking test suite for measuring file format token efficiency.

## Parse Arguments

Extract from $ARGUMENTS:
- `--formats`: Comma-separated list of formats to test (default: all - csv,json_compact,json_pretty,markdown,yaml,apache)
- `--model`: haiku or sonnet (default: haiku)
- `--thinking`: on or off (default: on)

Example:
- `--formats csv,markdown` → Test only CSV and Markdown
- `--model sonnet --thinking off` → Use Sonnet without extended thinking
- No args → Test all formats with Haiku and thinking enabled

## Step 1: Generate Test Data

Build the TypeScript project and run test data generation:

```bash
cd benchmarking
npm install
npm run build
npm run generate
```

This:
1. Installs dependencies (TypeScript)
2. Compiles TypeScript to JavaScript (orchestrator.ts, analytics.ts, etc.)
3. Generates test data:
   - Data files (CSV, JSON compact/pretty, Markdown, YAML, Apache logs)
   - 4 densities per format: 100, 75, 50, 25 record rows
   - Questionnaires with 100+ questions per dataset
   - Answer templates
   - metadata.json with all dataset information
   - Directory structure for test execution

## Step 2: Load Test Configuration

Read `benchmarking/benchmarking/data/metadata.json` to get all test cases.

For each format in the selected formats list:
  For each data size (100, 75, 50, 25):
    Create a test case: `{format}_{size}_{model}_{thinking}`

Example test cases:
- csv_100_haiku_on
- csv_75_haiku_on
- json_compact_50_sonnet_off
- markdown_25_haiku_on

**Total test cases**: selected_formats × 4 densities = N × 4

If all 6 formats selected: 6 × 4 = 24 test cases

## Step 3: Execute Tests SEQUENTIALLY

**CRITICAL**: Tests must run sequentially (NOT parallel). User needs to see token usage after each test.

For EACH test case in order:

### 3a. Invoke Read-Only Test

```
Use the Task tool:

Task(
  description: "Read-only test for {format}_{size}",
  subagent_type: "benchmark-read-only",
  model: "{model}",
  prompt: "Read the data file at: benchmarking/benchmarking/data/{format}/{format}_with_{recordCount}_records.{ext}",
  thinking_mode: "{thinking}"
)
```

Replace:
- `{format}`: Format name (csv, json_compact, json_pretty, jsonl, toon, markdown, yaml, apache)
- `{recordCount}`: Row count (100, 75, 50, or 25)
- `{ext}`: File extension (.csv, .json, .jsonl, .toon, .md, .yaml, .log)
- `{model}`: haiku or sonnet
- `{thinking}`: on or off

Wait for completion. Display the token usage from the system message (note it).

### 3b. Invoke Full Test

```
Use the Task tool:

Task(
  description: "Full test for {format}_{size}",
  subagent_type: "benchmark-full-test",
  model: "{model}",
  prompt: "
Format: {format}
size: {size}
Record Count: {recordCount}

Files to process:
- Data file: benchmarking/benchmarking/data/{format}/{format}_with_{recordCount}_records.{ext}
- Questionnaire: benchmarking/benchmarking/questions/questions_for_{recordCount}_records.json
- Answer template: benchmarking/benchmarking/answers_template/answers_for_{recordCount}_records_template.json
- Output path: benchmarking/benchmarking/subagent_outputs/{format}/answers_for_{recordCount}_records.json

Read the data file, questionnaire, and answer template. Answer all questions based ONLY on data in the file. Save results to the output path.
  ",
  thinking_mode: "{thinking}"
)
```

Wait for completion. Display the token usage from the system message (note it).

### 3c. Move to Next Test Case

Repeat 3a and 3b for the next test case.

**Example sequence** (if --formats csv,json_compact):
1. Read: csv_100_haiku_on
2. Full: csv_100_haiku_on
3. Read: csv_75_haiku_on
4. Full: csv_75_haiku_on
5. Read: csv_50_haiku_on
6. Full: csv_50_haiku_on
7. Read: csv_25_haiku_on
8. Full: csv_25_haiku_on
9. Read: json_compact_100_haiku_on
10. Full: json_compact_100_haiku_on
... (and so on)

## Step 4: Run Validation

After ALL tests complete, validate all answers:

```bash
cd benchmarking

# For each format × size combination, validate the answers
npm run validate -- \
  benchmarking/subagent_outputs/{format}/answers_for_{recordCount}_records.json \
  benchmarking/answers_validation/questions_and_answers_for_{recordCount}_records.json

# Repeat for each test case
```

This will output validation results showing:
- Questions answered correctly
- Questions answered incorrectly
- Overall accuracy percentage per test case

Results will be written to `benchmarking/results/` directory.

## Step 5: Collect User Metrics

Pause and request metrics from the user:

"✓ All tests complete. Validation results written to benchmarking/results/

Now I need the token and time metrics for each test. Please provide the metrics JSON file.

Expected location: benchmarking/metrics_{model}_{thinking}.json

The file should contain an array of test results with this structure:

```json
[
  {
    "testCase": "csv_100_haiku_on",
    "readDuration": 12,
    "readTokens": 2450,
    "fullDuration": 45,
    "fullTokens": 18500
  },
  {
    "testCase": "csv_75_haiku_on",
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
cd benchmarking
node dist/analytics.js \
  --metrics {user_provided_path} \
  --metadata benchmarking/data/metadata.json \
  --validation-dir benchmarking/results/ \
  --output benchmarking/analytics_results_{model}_{thinking}.json
```

The analytics script will:
1. Load all metrics from user-provided JSON
2. Load metadata with character counts and record info
3. Load validation results for accuracy data
4. Calculate efficiency scores (chars/token, tokens/question, etc.)
5. Compare formats and densities
6. Generate insights and rankings
7. Write comprehensive results JSON

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

Full results saved to: benchmarking/analytics_results_{model}_{thinking}.json
=================================================================
```

## File Structure Reference

```
benchmarking/
├── benchmarking/
│   ├── data/
│   │   ├── {format}/
│   │   │   ├── {format}_with_100_records.{ext}
│   │   │   ├── {format}_with_75_records.{ext}
│   │   │   ├── {format}_with_50_records.{ext}
│   │   │   └── {format}_with_25_records.{ext}
│   │   └── metadata.json
│   ├── questions/
│   │   ├── questions_for_100_records.json
│   │   ├── questions_for_75_records.json
│   │   ├── questions_for_50_records.json
│   │   └── questions_for_25_records.json
│   ├── answers_template/
│   │   ├── answers_for_100_records_template.json
│   │   ├── answers_for_75_records_template.json
│   │   ├── answers_for_50_records_template.json
│   │   └── answers_for_25_records_template.json
│   ├── answers_validation/
│   │   └── questions_and_answers_for_{recordCount}_records.json
│   ├── subagent_outputs/
│   │   └── {format}/
│   │       ├── answers_for_100_records.json
│   │       ├── answers_for_75_records.json
│   │       ├── answers_for_50_records.json
│   │       └── answers_for_25_records.json
│   └── results/
│       └── {format}_{recordCount}_validation.json
├── generate.js
├── analytics.ts
└── validate.js
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
