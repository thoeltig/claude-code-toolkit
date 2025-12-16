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

If all 8 formats selected: 8 x 2 × 2 = 32 test cases

## Step 3: Execute Tests

### 3a. Launch Read-Only Tests

You can invoke up to 4 readonly tests in parallel to measure token cost of reading data files. After each group of tests wait until all test are completed and only then continue with the next group of tests.        

**Launch readonly tests Data files** - Measure read overhead for actual data

For EACH file:

```bash
# Data files readonly tests
for data_file in ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/data/*/*.{csv,json,jsonl,toon,md,yaml,log}; do
  Task(
    description: "Readonly test for data: $(basename $data_file)",
    subagent_type: "benchmark-read-only",
    tools: ["Read"],
    model: "haiku",
    prompt: "You are executing a benchmarking read-only test.

## Your Task
1. Read the data file completely and carefully
2. Return confirmation only
3. DO NOT process, analyze, or answer questions

## Critical
This test measures baseline token usage for reading the file format. Any additional processing will invalidate the measurement.

## Instructions
- The data file path will be provided in your task prompt.
- After reading the complete file, respond with: 'Read complete.'
- That's all. No analysis, no summaries, no additional output.

Begin. Read the data file completely: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/${data_file}")
done
```

This launches readonly tests. Each task will:
1. Execute in the background
2. Read the file completely
3. Generate a transcript with cache_creation_input_tokens
4. Return an agent ID (e.g., agent-ae4a357)

**Important**: Collect all agent IDs from data file readonly tests (e.g., a613419, aa7992a, a44bacd, abe6c4f)

### 3b. Launch Full Tests in PARALLEL

You can invoke up to 4 readonly tests in parallel to tests the reasoning usage. After each group of tests wait until all test are completed and only then continue with the next group of tests.       
Each test processes data, reads questionnaire, and generates answers.

For EACH test case:

```
Use the Task tool with run_in_background: true:

Task(
  description: "Full test for {format}_{variant}_{recordCount}",
  subagent_type: "benchmark-full-test",
  tools: ["Read"],
  model: "{model}",
  prompt: "
You are executing a benchmarking test. Your task is to:
1. **Read the provided data file** completely and carefully
2. **Analyze the accompanying questionnaire** to understand what you need to find
3. **Answer all questions** based only on data present in the file
4. **Return your answers** in the exact JSON format specified

## Priority
**You have no time pressure. Make sure to be right instead of fast.**
Take whatever time you need to carefully read all data and answer accurately. Speed is not the goal here.

## Critical Guard Rails
**NEVER:**
- Guess, assume, or infer values not explicitly in the data
- Hallucinate numbers, categories, or relationships
- Modify the JSON structure or add extra fields
- Skip questions or leave answers blank
- Include explanations or reasoning in the JSON output
- **Write scripts, code, pseudocode, or attempt to create programs**
  - Do NOT write Python, JavaScript, SQL, or any code
  - Do NOT use pseudocode or algorithm descriptions
  - Analyze and answer directly through reasoning only

**ALWAYS:**
- Use only values present in the provided data file
- Answer with precision and accuracy
- Maintain the exact JSON structure
- Return valid, minified JSON (no formatting, no markdown)
- Perform calculations and filtering directly without coding

## Your Task
You have been provided with:
1. A data file to analyze
2. A questionnaire with questions about that data
3. An answer template to fill
4. An output folder to save results

**Do this:**
1. Read and analyze the data file thoroughly
2. Study the questionnaire to understand what each question asks
3. For each question, find the answer in the data
4. Fill the answer template with your responses
5. Save the completed JSON to the specified output path
6. Return confirmation that the file was saved

## Output File Path
The output file path will be provided in your task prompt. Create any necessary parent directories and save the file with the exact path provided.

## Before You Return
Verify:
- [ ] You read the complete data file
- [ ] You read all questions
- [ ] You answered all questions (no blanks)
- [ ] Your answers match the data exactly
- [ ] JSON is valid (proper syntax)
- [ ] No hallucinated values
- [ ] Metadata preserved exactly
- [ ] File saved to the correct output path
- [ ] Output confirms file location
 
## Sources 
### Information
-Format: {format}
-Variant: {variant}
-Record Count: {recordCount}

### Files to process:
- Data file: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/data/{format}/{format}_with_{variant}_{recordCount}_records.{ext}
- Questionnaire: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/questions/questions_for_{variant}_{recordCount}_records.json
- Answer template: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/answers_template/answers_for_{variant}_{recordCount}_records_template.json
- Output path: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/subagent_outputs/{format}/answers_for_{variant}_{recordCount}_records.json

## Begin
Proceed with reading the files and answering all questions. Save the completed JSON to the specified output path and confirm the file was saved.
  ",
  model: "{model}",
  thinking_mode: "{thinking}",
  run_in_background: true
)
```

This launches ALL full tests immediately without waiting. Each task will:
1. Execute in the background
2. Process data file and questions
3. Generate answer JSON to output path
4. Return an agent ID (e.g., agent-ae4b456)

**Important**: Note all returned agent IDs for step 5b (full test metrics extraction).

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

Results will be written to `${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/results/` directory.

**Note:** The `validate.ts` script (compiled to `dist/validate.js`) is the primary validation entry point. It uses the AnswerValidator class to deterministically validate answers against ground truth questionnaires.

## Step 5: Extract Metrics from Test Transcripts

After ALL tests complete (readonly and full), extract metrics from all agent transcripts.

### Step 5a: Extract Read Token Usage from ALL Readonly Tests

Combine results from data readonly tests:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

# Collect ALL readonly agent IDs from step 3a:
# - Data file IDs: a613419 aa7992a a44bacd abe6c4f ...
# - Question file IDs: ae1a234 ae1a235 ...
# - Template file IDs: ae1a236 ae1a237 ...

python ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/commands/extractRead.py \
  {data_agent_1} {data_agent_2} ... \
  {question_agent_1} {question_agent_2} ... \
  {template_agent_1} {template_agent_2} ... \
  --projects-dir ~/.claude/projects \
  --json \
  --output ./benchmarking/read_token_usage.json
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

### Step 5b: Extract Full Test Metrics (Duration & Tokens)

After ALL full tests complete, extract metrics stopping at first Write tool call:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

# Collect ALL full test agent IDs from step 3b
python ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/commands/extractReasoning.py \
  {full_test_agent_id_1} {full_test_agent_id_2} ... \
  --projects-dir ~/.claude/projects \
  --json \
  --output ./benchmarking/reasoning_token_usage.json
```

**Output includes all files** with breakdown (sample):
```json
{
  "files": [
      {
          "agentId": "ae1bdca",
          "format": "toon",
          "variant": "optional",
          "recordCount": 80,
          "durationMs": 49984.0,
          "inputTokens": 5941,
          "outputTokens": 881
      }
  ],
  "summary": {
      "totalTests": 1,
      "totalDurationMs": 49984.0,
      "totalReasoningTokens": 5941,
      "totalOutputTokens": 881,
      "totalCacheCreationTokens": 47345,
      "averageDurationMs": 49984.0,
      "averageReasoningTokens": 5941.0,
      "averageOutputTokens": 881
  }
}
```

**Calculate Actual Reasoning Tokens:**
```
For each test case:
  readTokens = read_token_usage.json (matching format/variant/recordCount)
  reasoningTokens = reasoning_token_usage.json (matching format/variant/recordCount)
```

## Step 6: Run Analytics

After both readonly and full test metrics are extracted, analytics processes the complete benchmark data:

```bash
cd ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts

node dist/analytics.js \
  --metadata ./benchmarking/metadata.json \
  --validation-dir ./benchmarking/results/ \
  --read-tokens ./benchmarking/read_token_usage.json \
  --reasoning-tokens ./benchmarking/reasoning_token_usage.json \
  --output ./benchmarking/analytics_results.json
```

The analytics script will:
1. Load read token usage from `benchmarking/read_token_usage.json`
2. Load full test metrics from `benchmarking/reasoning_token_usage.json`
3. Load metadata with character counts and record info
4. Load validation results for accuracy data
5. Calculate efficiency scores:
   - Read efficiency: chars/token from readonly tests
   - Full test efficiency: tokens/question, time/token
   - Per-format comparisons
6. Compare formats and record counts
7. Generate insights and rankings
8. Write comprehensive results JSON

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

Full results saved to: ${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/benchmarking/analytics_results.json
=================================================================
```

## File Structure Reference

```
${CLAUDE_PLUGIN_ROOT}/plugins/file-format-benchmark/scripts/
├── benchmarking/
│   ├── data/
│   │   └── {format}/
│   │       ├── {format}_with_{variant}_100_records.{ext}
│   │       └── {format}_with_{variant}_50_records.{ext}
│   ├── questions/
│   │   ├── questions_for_{variant}_100_records.json
│   │   └── questions_for_{variant}_50_records.json
│   ├── answers_template/
│   │   ├── answers_for_{variant}_100_records_template.json
│   │   └── answers_for_{variant}_50_records_template.json
│   ├── answers_validation/
│   │   └── questions_and_answers_for_{variant}_{recordCount}_records.json
│   ├── subagent_outputs/
│   │   └── {format}/
│   │       ├── answers_for_{variant}_100_records.json
│   │       └── answers_for_{variant}_50_records.json
│   ├── results/
│   │   └── {format}_{variant}_{recordCount}_validation.json
│   ├── metadata.json
│   ├── read_token_usage.json
│   ├── reasoning_token_usage.json
│   └── analytics_results.json
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

1. **Full Tests**: All data files in parallel Data files (8 formats × 2 variants × 2 record counts = 32 tests)

2. **Full Tests**: All in parallel (8 formats × 2 variants × 2 record counts = 32 tests)

3. **Agent ID Collection**: Capture ALL agent IDs:
   - From readonly tests (data)
   - From full tests
   - Total: ~32 agent IDs to track

4. **Two-Stage Metric Extraction**:
   - **5a**: Extract all readonly tokens → `read_token_usage.json`
   - **5b**: Extract all reasoning tokens → `reasoning_token_usage.json`

6. **Both Scripts Use Same Pattern**: Search `~/.claude/projects` recursively for matching `agent-*.jsonl` files by ID

7. **Validation Deferred**: All validation runs after test execution completes

8. **Analytics Requires Both**: Analytics step requires both metric files to be present

9. **Default All Formats**: If --formats not specified, test all 8 formats

10. **Default Haiku**: If --model not specified, use haiku

11. **Default With Thinking**: If --thinking not specified, use on
