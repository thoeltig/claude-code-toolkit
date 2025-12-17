---
description: Orchestrate comprehensive benchmarking tests for file format token efficiency (CSV, JSON (compact/pretty), JSONL, TOON, Markdown, YAML, Apache). Generates test data, executes sequential tests with configurable model (haiku/sonnet) and thinking mode, validates results, and calculates efficiency metrics. Triggers: benchmark, format efficiency, token measurement, performance testing
argument-hint: [--formats csv,json_compact,json_pretty,jsonl,toon,markdown,yaml,apache] [--variant optional,mandatory] [--model haiku|sonnet] [--thinking on|off] [--output PATH]
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
- `--output`: Output folder path for benchmark structure and test data (default: auto-generate in current directory)

### Output Folder

**If `--output` is provided:**
- Use the specified folder as benchmark working directory
- Enables running partial benchmarks across multiple sessions (e.g., format A today, format B tomorrow)
- Example: `--output /path/to/my/benchmark`

**If `--output` is NOT provided (auto-generate):**
- Generate folder name: `benchmark_{formats}_{variant}_{model}_{thinking}` in current working directory
- Example: `benchmark_csv_markdown_optional_haiku_on`
- Example: `benchmark_all_optional_mandatory_sonnet_off` (if all formats)

**Resulting folder structure (in output folder):**
```
{OUTPUT_FOLDER}/
├── data/
├── questions/
├── answers_template/
├── answers_validation/
├── subagent_outputs/
├── results/
├── metadata.json
├── read_token_usage.json
├── reasoning_token_usage.json
└── analytics_results.json
```

### Argument Examples

- `--formats csv,markdown` → Test only CSV and Markdown
- `--model sonnet --thinking off` → Use Sonnet without extended thinking
- `--output /path/to/benchmark` → Use custom folder path
- `--formats csv --output ./csv_benchmark` → CSV only in custom folder
- No args → Test all formats with Haiku and thinking, auto-generate folder in current directory

## Step 1: Prepare Output Folder

Determine the output folder and set `${BENCHMARK_OUTPUT_DIR}`:

```bash
# If --output was provided, use it
if [ -n "$OUTPUT_PATH" ]; then
  BENCHMARK_OUTPUT_DIR="$OUTPUT_PATH"
  mkdir -p "$BENCHMARK_OUTPUT_DIR"
else
  # Auto-generate folder name from parameters
  # Format: benchmark_{formats}_{variant}_{model}_{thinking}
  # Use shorthand for "all" cases to keep folder names reasonable

  if [ "$FORMATS" = "csv,json_compact,json_pretty,jsonl,toon,markdown,yaml,apache" ]; then
    FORMATS_PART="format_all"
  else
    FORMATS_PART="${FORMATS//,/_}"
  fi

  if [ "$VARIANT" = "optional,mandatory" ]; then
    VARIANT_PART="variant_all"
  else
    VARIANT_PART="${VARIANT//,/_}"
  fi

  BENCHMARK_OUTPUT_DIR="benchmark_${FORMATS_PART}_${VARIANT_PART}_${MODEL}_${THINKING}"
  mkdir -p "$BENCHMARK_OUTPUT_DIR"
  echo "Generated benchmark folder: $BENCHMARK_OUTPUT_DIR"
fi

echo "Benchmark output folder: $BENCHMARK_OUTPUT_DIR"
```

**Example generated folder names:**
- All defaults: `benchmark_format_all_variant_all_haiku_on`
- Specific formats: `benchmark_csv_markdown_optional_haiku_on`
- Specific variants: `benchmark_format_all_optional_sonnet_off`
- Custom path: Use `--output /path/to/folder`

## Step 2: Generate Test Data

Build the TypeScript project and run test data generation to the output folder:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts
npm run build
npm run generate --output "$BENCHMARK_OUTPUT_DIR"
```

This:
1. Compiles TypeScript to JavaScript (orchestrator.ts, analytics.ts, etc.)
2. Generates test data to `$BENCHMARK_OUTPUT_DIR`:
   - Data files (CSV, JSON compact/pretty, JSONL, TOON, Markdown, YAML, Apache logs)
   - 2 data variants: optional, mandatory
   - Record count format: 100, 50
   - Questionnaires with 100+ questions per dataset
   - Answer templates
   - metadata.json with all dataset information
   - Directory structure for test execution

## Step 3: Load Test Configuration

Read `${BENCHMARK_OUTPUT_DIR}/metadata.json` to get all test cases.

For each format in the selected formats list:
  For each optional data variant in the selected variant list:
    For each recordCount (100, 50):
      Create three test cases: `{format}_{variant}_{recordCount}_{model}_{thinking}_{one/two/three}`

Example test cases:
- csv_optional_100_haiku_on_1, csv_optional_100_haiku_on_2, csv_optional_100_haiku_on_3 
- json_compact_mandatory_50_sonnet_off_1, json_compact_mandatory_50_sonnet_off_2, json_compact_mandatory_50_sonnet_off_3

**Total test cases**: selected_formats × selected_variant × 2 record counts x 3 test runs

If all 8 formats selected: 8 x 2 × 2 × 3 = 96 test cases

## Step 4: Execute Tests - Format-Sequential Approach

**Key Strategy for CLI Stability & Single Read/Write Guarantee:**
1. Process ONE format at a time (sequential across formats)
2. For each format, execute all variants × record counts combinations
3. For each combination: 1 read test → wait for completion → 3 full tests in parallel → wait for all completion
4. Maintain running task queue: max 12 tasks in parallel at any time
5. Track all agent IDs for metrics extraction
6. **CRITICAL: Each test launches exactly ONCE - no re-launches or retries for same combination**
7. **CRITICAL: Wait for complete completion before moving to next combination**

**Guarantees:**
- Each data file read exactly ONCE (1 read-only test per combination)
- Each output file written exactly ONCE (1 write per full test)
- No parallel reads of same file
- No task re-launches

**Total Tests per Format:** 2 variants × 2 record counts × (1 read + 3 full) = 16 tests
**Peak Parallel Tasks:** 4-12 (read + up to 3 fulls per combination)

### Algorithm

```
For each FORMAT in selected_formats (one format at a time):
  Read agent_ids_for_format = []
  Full agent_ids_for_format = []
  launched_combinations = Set()  // Track to prevent re-launches

  For each VARIANT in selected_variants:
    For each RECORD_COUNT in [80, 40]:
      combination_name = {format}_{variant}_{recordCount}

      // GUARD: Never launch same combination twice
      IF combination_name in launched_combinations:
        ERROR: "Attempted to re-launch test for " + combination_name
        ABORT
      ENDIF
      launched_combinations.Add(combination_name)

      // Step 4a: Launch 1 Read-Only Test (ONCE per combination)
      Launch: benchmark-read-only agent for data file
      Wait for completion
      Collect and store READ agent ID

      // Step 4b: Launch 3 Full Tests (max 3 parallel, ONCE each)
      full_ids_for_combo = []
      For test_run in [1, 2, 3]:
        Launch: benchmark-full-test agent (test run {test_run}/3)
        full_ids_for_combo.Add(task_id)

      Wait for all 3 full tests to complete
      Collect and store all 3 FULL agent IDs
      Full agent_ids_for_format.AddAll(full_ids_for_combo)

  Save agent_ids_for_format (read + full) for metrics extraction
  Move to next format

Total execution: ~8 formats × ~16 tests per = 128 tasks total
GUARANTEE: Each combination tested exactly once, each agent task launched exactly once
```

### 4a. Launch Read-Only Test (Sequential - Wait for Completion)

For each format + variant + record count combination:

```bash
Task(
  description: "Readonly test: {format}_{variant}_{recordCount} data file read",
  subagent_type: "benchmark-read-only",
  model: "haiku",
  prompt: "Read this file completely: ${BENCHMARK_OUTPUT_DIR}/data/{format}/{format}_with_{variant}_{recordCount}_records.{ext} . Do not process or analyze."
)
```

This launches readonly test which will:
1. Read the file completely (ONCE ONLY)
2. Generate a transcript with cache_creation_input_tokens
3. Return an agent ID (e.g., agent-ae4a357)

**CRITICAL - Single Execution Guarantee**:
- **NEVER** launch duplicate readonly tests for the same data file
- **DO NOT** retry or re-launch this combination
- WAIT for this test to complete before launching full tests
- Cache is now warm for the data file
- Collect returned agent ID for step 5a (read-only test metrics extraction)
- **This test MUST run exactly once per data file - second launch = benchmarking corruption**

### 4b. Launch 3 Full Tests in Parallel (After Read Complete)

After read-only test finishes for a combination, launch all 3 full tests in parallel:

```bash
# Launch 3 full tests in parallel (only for this combination)
# GUARD: Track output files to prevent duplicate writes
for test_number in {1..3}; do
  output_file = "${BENCHMARK_OUTPUT_DIR}/subagent_outputs/{format}/answers_for_{variant}_{recordCount}_records_{test_number}.json"
  IF file_exists(output_file):
    ERROR: "Output file already exists: " + output_file
    ERROR: "This indicates a duplicate test run - benchmarking is corrupted"
    ABORT
  ENDIF

  Task(
    description: "Full test {format}_{variant}_{recordCount} run-{test_number}/3",
    subagent_type: "benchmark-full-test",
    model: "{model}",
    thinking_mode: "{thinking}",
    prompt: "
Format: {format}
Variant: {variant}
Record Count: {recordCount}
Test Run: {test_number}/3

Files to read ONCE each:
- Data file: ${BENCHMARK_OUTPUT_DIR}/data/{format}/{format}_with_{variant}_{recordCount}_records.{ext}
- Questionnaire: ${BENCHMARK_OUTPUT_DIR}/questions/questions_for_{variant}_{recordCount}_records.json
- Answer template: ${BENCHMARK_OUTPUT_DIR}/answers_template/answers_for_{variant}_{recordCount}_records_template.json

Output path (write ONCE):
- ${BENCHMARK_OUTPUT_DIR}/subagent_outputs/{format}/answers_for_{variant}_{recordCount}_records_{test_number}.json

Read each file exactly ONCE. Answer all questions based ONLY on data in the file. Write output file exactly ONCE."
  )
done
```

This launches 3 full tests in parallel which will:
1. Benefit from warm cache (data file already read in 4a)
2. Read data file, questionnaire, template (EACH ONCE ONLY)
3. Generate answer JSON to output path (WRITE ONCE)
4. Return agent IDs (e.g., agent-ae4b456, agent-ae4b457, agent-ae4b458)

**CRITICAL - Single Execution & Write Guarantee**:
- Launch all 3 tests together for this combination
- **NEVER** launch duplicate full tests for same {format}_{variant}_{recordCount}_{test_number}
- **DO NOT** retry or re-launch individual test runs
- WAIT for all 3 to complete before moving to next combination
- Verify output files are created exactly once (check before/after)
- **Each output file MUST be written exactly once - second write = benchmarking corruption**
- Collect all 3 returned agent IDs for step 6b (full test metrics extraction)
- Then proceed to next combination within the same format

## Step 5: Run Validation

After ALL tests complete, run a single validation command that automatically finds and validates all test cases:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

node dist/validate.js \
  --subagent-outputs ${BENCHMARK_OUTPUT_DIR}/subagent_outputs \
  --validation-dir ${BENCHMARK_OUTPUT_DIR}/answers_validation \
  --results-dir ${BENCHMARK_OUTPUT_DIR}/results
```

The script:
1. **Recursively finds** all `answers_for_*_records_1.json` files (these define test cases)
2. **Extracts metadata** (format, variant, recordCount) from directory structure and filenames
3. **Validates each test case** by:
   - Loading all 3 answer files (test runs 1, 2, 3)
   - Validating each against the ground truth
   - Averaging accuracy across the 3 runs
4. **Saves aggregated results** to `{format}_{variant}_{recordCount}_validation.json`

**Console output example:**
```
Found 32 test cases to validate

✓ csv             optional   100  → 98.33%
✓ csv             optional   50   → 97.89%
◐ json_compact    mandatory  100  → 92.15%
✗ yaml            optional   50   → 87.42%
...

✓ Validation complete. Results saved to: ${BENCHMARK_OUTPUT_DIR}/results
```

Status icons:
- `✓` = 100% accuracy
- `◐` = 90-99% accuracy
- `✗` = <90% accuracy

**Output file structure per test case:**
```json
{
  "format": "toon",
  "variant": "optional",
  "recordCount": 100,
  "testRuns": 3,
  "totalQuestions": 103,
  "accuracy": {
    "correct": 98.33,
    "incorrect": 3.33,
    "requiresReview": 1.33,
    "accuracyPercent": 95.46
  },
  "perRunAccuracy": [
    {"run": 1, "correct": 98, "incorrect": 3, "requiresReview": 2, "accuracyPercent": 95.15},
    {"run": 2, "correct": 99, "incorrect": 4, "requiresReview": 0, "accuracyPercent": 96.12},
    {"run": 3, "correct": 98, "incorrect": 3, "requiresReview": 2, "accuracyPercent": 95.15}
  ]
}
```

## Step 6: Extract Metrics from Test Transcripts

After ALL tests complete (readonly and full), extract metrics from all agent transcripts.

**CRITICAL - Extract Each Transcript ONCE ONLY:**
- Each readonly agent ID extracted exactly once
- Each full test agent ID extracted exactly once
- No duplicate extraction (second extraction = corrupted metrics)
- Output files created exactly once

### Step 6a: Extract Read Token Usage from ALL Readonly Tests (Extract ONCE)

Combine results from data readonly tests (extract each readonly agent ONCE):

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

# GUARD: Check output file doesn't exist (prevent re-extraction)
if [ -f ${BENCHMARK_OUTPUT_DIR}/read_token_usage.json ]; then
  echo "ERROR: read_token_usage.json already exists"
  echo "This indicates metrics were already extracted - aborting to prevent data corruption"
  exit 1
fi

# Collect ALL readonly agent IDs from step 4a (extract each ID ONCE):
# - Data file IDs: a613419 aa7992a a44bacd abe6c4f ...
# - Question file IDs: ae1a234 ae1a235 ...
# - Template file IDs: ae1a236 ae1a237 ...

python ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/commands/extractRead.py \
  {data_agent_1} {data_agent_2} ... \
  {question_agent_1} {question_agent_2} ... \
  {template_agent_1} {template_agent_2} ... \
  --projects-dir ~/.claude/projects \
  --json \
  --output ${BENCHMARK_OUTPUT_DIR}/read_token_usage.json

# VERIFY: Confirm file was created (only way extraction succeeded)
if [ ! -f ${BENCHMARK_OUTPUT_DIR}/read_token_usage.json ]; then
  echo "ERROR: Extraction failed - output file not created"
  exit 1
fi
```

**Output includes all files** with breakdown (sample):
```json
{
  "files": [
      {
          "file": "toon_with_optional_80_records.toon",
          "fileType": "data",
          "format": "toon",
          "variant": "optional",
          "recordCount": 80,
          "readTokens": 22166,
          "readDurationMs": 2231.0
      }
  ],
  "summary": {
      "totalFiles": 3,
      "totalReadTokens": 22166,
      "totalReadDurationMs": 2231.0,
      "averageReadTokens": 22166,
      "averageDurationMs": 2231.0
  }
}
```

### Step 6b: Extract Full Test Metrics (Duration & Tokens) (Extract ONCE)

After ALL full tests complete, extract and aggregate metrics stopping at first Write tool call. The script automatically groups the 3 test runs per format/variant/recordCount and averages their metrics:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

# GUARD: Check output file doesn't exist (prevent re-extraction)
if [ -f ${BENCHMARK_OUTPUT_DIR}/reasoning_token_usage.json ]; then
  echo "ERROR: reasoning_token_usage.json already exists"
  echo "This indicates metrics were already extracted - aborting to prevent data corruption"
  exit 1
fi

# Collect ALL full test agent IDs from step 4b (all 3 runs per test case, extract each ONCE)
python ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/commands/extractReasoning.py \
  {full_test_agent_id_1} {full_test_agent_id_2} {full_test_agent_id_3} ... \
  --projects-dir ~/.claude/projects \
  --json \
  --output ${BENCHMARK_OUTPUT_DIR}/reasoning_token_usage.json

# VERIFY: Confirm file was created (only way extraction succeeded)
if [ ! -f ${BENCHMARK_OUTPUT_DIR}/reasoning_token_usage.json ]; then
  echo "ERROR: Extraction failed - output file not created"
  exit 1
fi
```

**Output includes aggregated metrics** (averaged across 3 test runs):
```json
{
  "files": [
      {
          "format": "toon",
          "variant": "optional",
          "recordCount": 100,
          "testRuns": 3,
          "durationMs": 49984.33,
          "reasoningTokens": 5941.67,
          "outputTokens": 881.33
      }
  ],
  "summary": {
      "totalTestCases": 32,
      "totalDurationMs": 1599494.56,
      "totalReasoningTokens": 190133.44,
      "totalOutputTokens": 28202.56,
      "averageDurationMs": 49984.20,
      "averageReasoningTokens": 5941.67,
      "averageOutputTokens": 881.33
  }
}
```

**Note:** `testRuns` shows 3 for each test case, indicating the script has averaged all 3 runs

**Data Ready for Analytics:**
Both extraction scripts now output averaged metrics ready for analytics:
- `read_token_usage.json`: Read tokens per file (single readonly test)
- `reasoning_token_usage.json`: Averaged reasoning tokens across 3 full test runs

## Step 7: Run Analytics

After both readonly and full test metrics are extracted, analytics processes the complete benchmark data:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

node dist/analytics.js \
  --read-metrics ${BENCHMARK_OUTPUT_DIR}/read_token_usage.json \
  --reasoning-metrics ${BENCHMARK_OUTPUT_DIR}/reasoning_token_usage.json \
  --metadata ${BENCHMARK_OUTPUT_DIR}/metadata.json \
  --validation-dir ${BENCHMARK_OUTPUT_DIR}/results/ \
  --output ${BENCHMARK_OUTPUT_DIR}/analytics_results.json
```

The analytics script will:
1. Load read token usage from `${BENCHMARK_OUTPUT_DIR}/read_token_usage.json`
2. Load full test metrics from `${BENCHMARK_OUTPUT_DIR}/reasoning_token_usage.json`
3. Load metadata with character counts and record info
4. Load validation results for accuracy data
5. Calculate efficiency scores:
   - Read efficiency: chars/token from readonly tests
   - Full test efficiency: tokens/question, time/token
   - Per-format comparisons
6. Compare formats and record counts
7. Generate insights and rankings
8. Write comprehensive results JSON

## Step 8: Display Results Summary

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

Full results saved to: ${BENCHMARK_OUTPUT_DIR}/analytics_results.json
=================================================================
```

## Output Folder Structure

The benchmark output folder contains all generated data and test results:

```
${BENCHMARK_OUTPUT_DIR}/
├── data/
│   └── {format}/
│       ├── {format}_with_{variant}_100_records.{ext}
│       └── {format}_with_{variant}_50_records.{ext}
├── questions/
│   ├── questions_for_{variant}_100_records.json
│   └── questions_for_{variant}_50_records.json
├── answers_template/
│   ├── answers_for_{variant}_100_records_template.json
│   └── answers_for_{variant}_50_records_template.json
├── answers_validation/
│   └── questions_and_answers_for_{variant}_{recordCount}_records.json
├── subagent_outputs/
│   └── {format}/
│       ├── answers_for_{variant}_100_records_1.json
│       ├── answers_for_{variant}_100_records_2.json
│       └── answers_for_{variant}_100_records_3.json
├── results/
│   └── {format}_{variant}_{recordCount}_validation.json
├── metadata.json
├── read_token_usage.json
├── reasoning_token_usage.json
└── analytics_results.json
```

**Example:**
- Generated folder: `benchmark_csv_optional_haiku_on/`
- Custom path: `/path/to/my/benchmark/`

This modularity allows running benchmarks for different format subsets at different times without conflicts.

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

### Execution Strategy (Critical for Stability)

1. **Sequential Per Format** (Not All Parallel): Process formats one at a time to leverage cache locality and avoid CLI crashes from excessive parallel tasks
   - Format 1: complete all tests (read + full for all combinations)
   - Format 2: complete all tests
   - etc.

2. **Parallel Within Combination**: For each format/variant/recordCount combo, run 3 full tests in parallel AFTER the read test completes. This keeps cache warm and limits parallel tasks.

3. **Max Parallel Tasks**: Never exceed 12 concurrent tasks at any time
   - Typical peak: 4 tasks (1 read + 3 fulls for single combo)
   - This ensures CLI stability

4. **Read → Cache → Full Tests Pipeline**:
   - Step 3a: Launch 1 read test (singleton)
   - Wait for completion (cache is now warm)
   - Step 3b: Launch 3 full tests (these benefit from cache)
   - Wait for completion
   - Move to next combination

### Agent ID Collection and Tracking

5. **Capture ALL Agent IDs in Order**:
   - Format 1, Combo 1: [1 read ID, 3 full IDs]
   - Format 1, Combo 2: [1 read ID, 3 full IDs]
   - ... (all combos for Format 1)
   - Format 2: (repeat)
   - etc.
   - **Total**: ~32 read IDs + 96 full IDs = 128 IDs (if all 8 formats)

6. **Two-Stage Metric Extraction** (After All Tests Complete):
   - **5a**: Extract all readonly tokens → `read_token_usage.json`
   - **5b**: Extract all reasoning tokens → `reasoning_token_usage.json`

7. **Both Scripts Use Same Pattern**: Search `~/.claude/projects` recursively for matching `agent-*.jsonl` files by ID

### General Execution Notes

8. **Validation Deferred**: All validation runs after test execution completes (Step 4)

9. **Analytics Requires Both**: Analytics step (Step 6) requires both metric files to be present

10. **Default All Formats**: If --formats not specified, test all 8 formats

11. **Default Haiku**: If --model not specified, use haiku

12. **Default With Thinking**: If --thinking not specified, use on

### Guardrails Summary - Preventing Data Corruption

**These guarantees ensure benchmarking accuracy:**

1. **Single Read Guarantee**:
   - Each data file: read ONCE (benchmark-read-only agent)
   - Each questionnaire: read ONCE (benchmark-full-test agent)
   - Each answer template: read ONCE (benchmark-full-test agent)
   - No re-reads, no verifications, no retries

2. **Single Write Guarantee**:
   - Each output file: written ONCE by single agent
   - No re-writes, no overwrites, no appends
   - Output file checked before launch (guard against duplicate test runs)

3. **Single Extraction Guarantee**:
   - Each readonly agent transcript: extracted ONCE (Step 5a)
   - Each full test agent transcript: extracted ONCE (Step 5b)
   - Output files checked before extraction (prevent re-extraction)

4. **No Duplicate Launches**:
   - Track all launched combinations
   - Abort if attempting to re-launch same test
   - Each {format}_{variant}_{recordCount} tests ONCE

5. **Enforcement Points**:
   - Algorithm tracks launched combinations
   - Output file pre-checks guard against duplicate writes
   - Extraction output file checks prevent re-extraction
   - All verifications MUST pass before continuing
