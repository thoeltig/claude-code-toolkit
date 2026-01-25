---
description: Orchestrate comprehensive benchmarking tests for file format token efficiency (CSV, JSON (compact/pretty), TOON, XML, YAML). Generates test data variants (flat and nested), executes sequential tests with configurable model (haiku/sonnet) and thinking mode, validates results, and calculates efficiency metrics. Triggers: benchmark, format efficiency, token measurement, performance testing
argument-hint: [--formats csv,json_compact,json_pretty,toon,xml,yaml] [--variant optional,mandatory] [--model haiku|sonnet] [--thinking on|off] [--output PATH]
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
- `--formats`: Comma-separated list of formats to test (default: all - csv,json_compact,json_pretty,toon,xml,yaml)
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
├── agent_ids.json
├── metrics.json
└── analytics_results.json
```

### Argument Examples

- `--formats csv,xml` → Test only CSV and XML
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

  if [ "$FORMATS" = "csv,json_compact,json_pretty,toon,xml,yaml" ]; then
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
- Specific formats: `benchmark_csv_xml_optional_haiku_on`
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
   - Data files (CSV, JSON compact/pretty, TOON, XML, YAML)
   - 2 data structure variants: flat and nested (flat for CSV, both for others)
   - 2 data content variants: optional, mandatory
   - Record count: 80
   - Questionnaires with 120 questions per dataset
   - Answer templates
   - metadata.json with all dataset information
   - Directory structure for test execution

## Step 3: Load Test Configuration

Read `${BENCHMARK_OUTPUT_DIR}/metadata.json` to get all test cases.

For each format in the selected formats list:
  For each data structure variant (flat, nested - nested unavailable for CSV):
    For each content variant in the selected variant list:
      Create three test cases: `{format}_{structure}_{variant}_{model}_{thinking}_{one/two/three}`

Example test cases:
- csv_flat_optional_haiku_on_1, csv_flat_optional_haiku_on_2, csv_flat_optional_haiku_on_3
- json_compact_nested_mandatory_sonnet_off_1, json_compact_nested_mandatory_sonnet_off_2, json_compact_nested_mandatory_sonnet_off_3

**Total test cases**: selected_formats × data_structure_variants × selected_content_variants × 3 test runs

If all 6 formats selected: 1 csv × 1 flat × 2 content × 3 + 5 formats × 2 structure × 2 content × 3 = 6 + 60 = 66 test cases

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

**Total Tests per Format:**
- CSV: 1 structure × 2 content variants × (1 read + 3 full) = 8 tests
- Others: 2 structure × 2 content variants × (1 read + 3 full) = 16 tests
**Peak Parallel Tasks:** 4 (read + up to 3 fulls per combination)

### Algorithm

```
For each FORMAT in selected_formats (one format at a time):
  Read agent_ids_for_format = []
  Full agent_ids_for_format = []
  launched_combinations = Set()  // Track to prevent re-launches

  For each STRUCTURE in data_structure_variants:
    // Skip nested for CSV format
    IF format == "csv" AND structure == "nested":
      CONTINUE
    ENDIF

    For each VARIANT in selected_variants:
      combination_name = {format}_{structure}_{variant}

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

      // IMPORTANT: Record both readonly and full test agent IDs
      // Store in agent_ids.json for later extraction
      WriteToAgentIdsFile({
        format, structure, variant,
        readonly_agent_id,
        full_test_ids: [id1, id2, id3]
      })

  Save all agent_ids_for_format (read + full) to ${BENCHMARK_OUTPUT_DIR}/agent_ids.json
  Move to next format

Total execution: ~6 formats × ~12 tests per = 72+ tasks total (depends on structure variants)
GUARANTEE: Each combination tested exactly once, each agent task launched exactly once
AGENT_IDS_FILE: All IDs saved to ${BENCHMARK_OUTPUT_DIR}/agent_ids.json for extraction
```

### 4a. Launch Read-Only Test (Sequential - Wait for Completion)

For each format + structure + variant combination:

```bash
Task(
  description: "Readonly test: {format}_{structure}_{variant} data file read",
  subagent_type: "benchmark-read-only",
  model: "haiku",
  prompt: "Read this file completely: ${BENCHMARK_OUTPUT_DIR}/data/{format}/{format}_with_{variant}_{recordCount}_{structure}_records.{ext} . Do not process or analyze."
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
- Collect returned agent ID for Step 5 (analytics)
- **This test MUST run exactly once per data file - second launch = benchmarking corruption**

### 4b. Launch 3 Full Tests in Parallel (After Read Complete)

After read-only test finishes for a combination, launch all 3 full tests in parallel:

```bash
# Launch 3 full tests in parallel (only for this combination)
# GUARD: Track output files to prevent duplicate writes
for test_number in {1..3}; do
  output_file = "${BENCHMARK_OUTPUT_DIR}/subagent_outputs/{format}/answers_for_{structure}_{variant}_{recordCount}_records_{test_number}.json"
  IF file_exists(output_file):
    ERROR: "Output file already exists: " + output_file
    ERROR: "This indicates a duplicate test run - benchmarking is corrupted"
    ABORT
  ENDIF

  Task(
    description: "Full test {format}_{structure}_{variant} run-{test_number}/3",
    subagent_type: "benchmark-full-test",
    model: "{model}",
    thinking_mode: "{thinking}",
    prompt: "
Format: {format}
Structure: {structure}
Variant: {variant}
Test Run: {test_number}/3

Files to read ONCE each:
- Data file: ${BENCHMARK_OUTPUT_DIR}/data/{format}/{format}_with_{variant}_{recordCount}_{structure}_records.{ext}
- Questionnaire: ${BENCHMARK_OUTPUT_DIR}/questions/questions_for_{variant}_{recordCount}_records.json
- Answer template: ${BENCHMARK_OUTPUT_DIR}/answers_template/answers_for_{variant}_{recordCount}_records_template.json

Output path (write ONCE):
- ${BENCHMARK_OUTPUT_DIR}/subagent_outputs/{format}/answers_for_{structure}_{variant}_{recordCount}_records_{test_number}.json

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
- **NEVER** launch duplicate full tests for same {format}_{structure}_{variant}_{test_number}
- **DO NOT** retry or re-launch individual test runs
- WAIT for all 3 to complete before moving to next combination
- Verify output files are created exactly once (check before/after)
- **Each output file MUST be written exactly once - second write = benchmarking corruption**
- Collect all 3 returned agent IDs for Step 5 (analytics)
- Then proceed to next combination within the same format

## Step 5: Run Analytics (Automatic Validation, Metrics Extraction + Analysis)

After all tests complete, run analytics which automatically:
1. Validates all test cases (using metadata and subagent outputs)
2. Extracts metrics from agent transcripts (using agent_ids.json)
3. Generates combined metrics.json file
4. Runs comprehensive analysis

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

node dist/analytics.js \
  --agent-ids ${BENCHMARK_OUTPUT_DIR}/agent_ids.json \
  --output ${BENCHMARK_OUTPUT_DIR}
```

**Automatic Processing During Analytics:**
- Loads metadata.json to get dataset information
- Finds and validates all test case outputs in subagent_outputs/
- Generates validation results to results/ directory
- Reads `agent_ids.json` to get all readonly and full test agent IDs
- Searches for transcript files in `~/.claude/projects`
- Extracts read metrics from readonly agent transcripts
- Extracts reasoning metrics from full test agent transcripts
- Combines metrics into single `metrics.json` file
- Runs comprehensive efficiency analysis
- Outputs final analytics_results.json with rankings and insights

**Combined Metrics Output** (auto-generated at ${BENCHMARK_OUTPUT_DIR}/metrics.json):
```json
{
  "read": {
    "files": [
      {
        "file": "csv_with_optional_80_flat_records.csv",
        "path": "/path/to/data/...",
        "agentId": "agent-abc123",
        "format": "csv",
        "structure": "flat",
        "variant": "optional",
        "recordCount": 80,
        "readTokens": 15234,
        "readDurationMs": 1523.0
      }
    ],
    "summary": {
      "totalFiles": 18,
      "totalReadTokens": 274176,
      "totalReadDurationMs": 27417.6,
      "averageReadTokens": 15232,
      "averageDurationMs": 1523.2
    }
  },
  "reasoning": {
    "files": [
      {
        "format": "csv",
        "structure": "flat",
        "variant": "optional",
        "recordCount": 80,
        "testRuns": 3,
        "durationMs": 49984.33,
        "reasoningTokens": 5941.67,
        "outputTokens": 881.33
      }
    ],
    "summary": {
      "totalTestCases": 18,
      "totalDurationMs": 899915.94,
      "totalReasoningTokens": 106950.06,
      "totalOutputTokens": 15859.94,
      "averageDurationMs": 49995.33,
      "averageReasoningTokens": 5941.67,
      "averageOutputTokens": 881.33
    }
  }
}
```

## Step 6: Display Results Summary

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
│       ├── {format}_with_{variant}_80_{flat|nested}_records.{ext}
│       ├── ...
├── questions/
│   ├── questions_with_{variant}_80_records.json
│   └── ...
├── answers_template/
│   ├── answers_with_{variant}_80_records_template.json
│   └── ...
├── answers_validation/
│   └── questions_and_answers_with_{variant}_80_records.json
├── subagent_outputs/
│   └── {format}/
│       ├── answers_for_{flat|nested}_{variant}_80_records_1.json
│       ├── answers_for_{flat|nested}_{variant}_80_records_2.json
│       ├── answers_for_{flat|nested}_{variant}_80_records_3.json
│       └── ...
├── results/
│   └── {format}_{flat|nested}_{variant}_80_validation.json
├── metadata.json
├── agent_ids.json (generated during Step 4)
├── metrics.json (auto-generated by analytics.js during Step 6 from agent transcripts)
└── analytics_results.json (final results from Step 6)
```

**Key Files:**
- `agent_ids.json`: Created during test execution (Steps 4a-4b), contains all readonly and full test agent IDs
- `metrics.json`: Auto-generated by analytics.js before analysis, combines read and reasoning metrics extracted from agent transcripts
- `analytics_results.json`: Final analysis output with rankings and insights

**Example:**
- Generated folder: `benchmark_csv_optional_haiku_on/`
- Custom path: `/path/to/my/benchmark/`

This modularity allows running benchmarks for different format subsets at different times without conflicts.

## Format Extensions

- csv → .csv
- json_compact → .json
- json_pretty → .json
- toon → .toon
- xml → .xml
- yaml → .yaml

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
   - Step 4a: Launch 1 read test (singleton)
   - Wait for completion (cache is now warm)
   - Step 4b: Launch 3 full tests (these benefit from cache)
   - Wait for completion
   - Move to next combination

### Agent ID Collection and Tracking

5. **Capture ALL Agent IDs in Order to agent_ids.json**:
   - Format 1, Combo 1: [1 readonly ID, 3 full IDs]
   - Format 1, Combo 2: [1 readonly ID, 3 full IDs]
   - ... (all combos for Format 1)
   - Format 2: (repeat)
   - etc.
   - **Total**: ~32 readonly IDs + 96 full IDs = 128 IDs (if all 8 formats)
   - **File**: Stored in `${BENCHMARK_OUTPUT_DIR}/agent_ids.json`

6. **Automatic Metric Extraction** (Step 5 - Integrated into Analytics):
   - Analytics reads `agent_ids.json` to get all agent IDs
   - Extracts readonly and full test agent metrics
   - Combines into single `metrics.json` file
   - No manual ID passing required

### General Execution Notes

7. **Validation & Analytics Integrated**: Step 5 (analytics) automatically:
   - Validates all test cases using metadata and subagent outputs
   - Reads agent IDs from `agent_ids.json`
   - Extracts metrics from agent transcripts
   - Generates combined `metrics.json` file
   - Runs comprehensive analysis

9. **Default All Formats**: If --formats not specified, test all 6 formats (csv, json_compact, json_pretty, toon, xml, yaml)

10. **Default Haiku**: If --model not specified, use haiku

11. **Default With Thinking**: If --thinking not specified, use on

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
   - Each agent ID from `agent_ids.json`: extracted ONCE during Step 5
   - Readonly and full test agent transcripts: extracted once → combined into `metrics.json`
   - Output file checked before extraction (prevent re-extraction)

4. **No Duplicate Launches**:
   - Track all launched combinations
   - Abort if attempting to re-launch same test
   - Each {format}_{variant}_{recordCount} tests ONCE

5. **Enforcement Points**:
   - Algorithm tracks launched combinations
   - Output file pre-checks guard against duplicate writes
   - Extraction output file checks prevent re-extraction
   - All verifications MUST pass before continuing
