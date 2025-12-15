/**
 * Test runner that coordinates subagent execution
 * Launches subagents, collects results, validates answers
 */

import * as fs from "fs";
import * as path from "path";
import { Format, DataDensity, AnswerTemplate } from "./types";

export interface TestConfig {
  format: Format;
  density: DataDensity;
  scenario: "original" | "minified" | "minified_json";
  testId: string;
  outputDir: string;
}

export class TestRunner {
  private baseDir: string;

  constructor(baseDir: string = "benchmarking") {
    this.baseDir = baseDir;
  }

  /**
   * Generate subagent prompt for a specific test
   */
  public generateSubagentPrompt(config: TestConfig): string {
    const { format, density, scenario, testId } = config;

    // Resolve file paths
    const dataDir = path.join(this.baseDir, "benchmarking", "data");
    const questionnairesDir = path.join(this.baseDir, "benchmarking", "questionnaires");
    const answersDir = path.join(this.baseDir, "benchmarking", "answers");

    const fileExt = this.getFileExtension(format);
    const dataFileName = `${format}_${density}.${fileExt}`;
    const questionnaireFileName = `${format}_${density}.json`;
    const answerFileName = `${format}_${density}_${scenario}_template.json`;

    const dataFilePath = path.join(dataDir, dataFileName);
    const questionnaireFilePath = path.join(questionnairesDir, questionnaireFileName);
    const answerTemplatePath = path.join(answersDir, answerFileName);

    // Read template to get structure
    const templateContent = fs.readFileSync(answerTemplatePath, "utf-8");
    const template = JSON.parse(templateContent) as AnswerTemplate;

    // Read the actual template (empty)
    const emptyTemplate = JSON.stringify(template, null, 2);

    const timestamp = new Date().toISOString();
    const scenarioDescriptions = {
      original: "original native format (no processing)",
      minified: "minified format (whitespace removed)",
      minified_json: "minified and converted to JSON structure",
    };

    return `# Benchmarking Test: ${format.toUpperCase()} @ ${density}% Density - ${scenario}

**Test ID:** ${testId}
**Format:** ${format.toUpperCase()}
**Data Density:** ${density}%
**Scenario:** ${scenarioDescriptions[scenario]}
**Started:** ${timestamp}

## Your Task

You are executing a benchmarking test for the \`/read-efficient\` file optimization tool. Your task is to:

1. **Read the data file** completely (${dataFileName})
2. **Read the questionnaire** with 10 questions (${questionnaireFileName})
3. **Answer each question** based on the data you read
4. **Return filled answer template** in exact JSON format

## Critical Guard Rails

**DO NOT:**
- Guess or infer answers if unclear
- Hallucinate values not in the data
- Modify the template JSON structure
- Add extra fields or comments

**DO:**
- Read files completely before answering
- Use precise values from the data
- Answer exactly as questions ask
- Return valid minified JSON

## Files to Read (Read in this order)

### 1. Data File
**Location:** \`${dataFilePath}\`
**Format:** ${format.toUpperCase()}
**Records:** ~${this.getRecordCount(format, density)}
**Size:** ~${this.getFileSize(format, density)}

Read this file completely. Understand:
- All fields and their values
- Record structure
- Data patterns and ranges
- Null/empty fields (especially for 50% density)

### 2. Questionnaire
**Location:** \`${questionnaireFilePath}\`
**Questions:** 10 (5 easy, 5 medium/hard)

Read each question to understand:
- What it asks
- Which data fields apply
- What format answer should be (text, number, list)
- The validation method

### 3. Answer Template
**Location:** \`${answerTemplatePath}\`
**Structure:**
\`\`\`json
${emptyTemplate}
\`\`\`

## Answering Guidelines

### Field Retrieval (Questions asking for specific values)
- Find the exact value in the data
- Return as string
- Example: "What is the price of product X?" → "1234.56"

### Aggregation (Sum, average, count calculations)
- Calculate across all records
- Return as number
- Example: "Total stock?" → "15420"

### Filtering (Count matching criteria)
- Count records meeting condition
- Return as number
- Example: "How many out of stock?" → "42"

### Structure Awareness (Lists, categories)
- List unique values separated by commas
- Sorted order
- Example: "List categories" → "Electronics,Materials,Office Supplies,Tools"

### Deduction (Reasoning, inference)
- Answer based on data patterns
- Brief reasoning if complex
- Example: "Which supplier most products?" → "Acme Corp (28 products)"

## Output Format (IMPORTANT)

Return ONLY the filled JSON template with:
- Exact metadata preserved
- All 10 answers filled in
- Valid JSON syntax
- No extra text, no markdown, no comments

**Example Output:**
\`\`\`json
{
  "metadata": {
    "format": "${format}",
    "density": ${density},
    "dataFile": "${dataFileName}",
    "questionnaireFile": "${questionnaireFileName}"
  },
  "answers": [
    {"questionId": 1, "answer": "answer_to_q1"},
    {"questionId": 2, "answer": "answer_to_q2"},
    ...
    {"questionId": 10, "answer": "answer_to_q10"}
  ]
}
\`\`\`

## Token Tracking

At the end of your response, I will note:
- Tokens before reading (initial)
- Tokens after reading files (from system message)
- Tokens after answering (from system message)

This measures: reading cost vs answering cost vs scenario (original vs minified vs JSON).

## Checklist Before Returning

Verify:
- ☐ Read the complete data file
- ☐ Read the complete questionnaire
- ☐ Answered all 10 questions (no blanks)
- ☐ Answers match question requirements
- ☐ JSON is valid (no syntax errors)
- ☐ No hallucinated values
- ☐ Metadata unchanged
- ☐ Ready for automated validation

## Begin

Please proceed with:
1. Reading \`${dataFileName}\` from \`${dataFilePath}\`
2. Reading \`${questionnaireFileName}\` from \`${questionnaireFilePath}\`
3. Answering all questions
4. Returning filled JSON only`;
  }

  private getFileExtension(format: Format): string {
    const extensions: Record<Format, string> = {
      csv: "csv",
      json: "json",
      markdown: "md",
      yaml: "yaml",
      apache: "log",
    };
    return extensions[format];
  }

  private getRecordCount(format: Format, density: DataDensity): number {
    // Approximate record counts
    const counts: Record<string, Record<DataDensity, number>> = {
      csv: { 100: 110, 50: 95 },
      json: { 100: 110, 50: 95 },
      markdown: { 100: 110, 50: 95 },
      yaml: { 100: 110, 50: 95 },
      apache: { 100: 110, 50: 95 },
    };
    return counts[format][density];
  }

  private getFileSize(format: Format, density: DataDensity): string {
    // Approximate file sizes
    const sizes: Record<string, Record<DataDensity, string>> = {
      csv: { 100: "28KB", 50: "22KB" },
      json: { 100: "60KB", 50: "48KB" },
      markdown: { 100: "16KB", 50: "16KB" },
      yaml: { 100: "70KB", 50: "57KB" },
      apache: { 100: "20KB", 50: "20KB" },
    };
    return sizes[format][density];
  }

  /**
   * Create a test configuration
   */
  public createTestConfig(format: Format, density: DataDensity, scenario: "original" | "minified" | "minified_json"): TestConfig {
    return {
      format,
      density,
      scenario,
      testId: `${format}_${density}_${scenario}_${Date.now()}`,
      outputDir: this.baseDir,
    };
  }

  /**
   * Log test execution details for reference
   */
  public logTestConfig(config: TestConfig): void {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`TEST CONFIGURATION`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Test ID:        ${config.testId}`);
    console.log(`Format:         ${config.format.toUpperCase()}`);
    console.log(`Density:        ${config.density}%`);
    console.log(`Scenario:       ${config.scenario}`);
    console.log(`Output Dir:     ${config.outputDir}`);
    console.log(`${"=".repeat(60)}\n`);
  }
}

// CLI usage
if (require.main === module) {
  const format = (process.argv[2] as Format) || "csv";
  const density = parseInt(process.argv[3] || "100") as DataDensity;
  const scenario = (process.argv[4] || "original") as "original" | "minified" | "minified_json";
  const outputDir = process.argv[5] || "benchmarking";

  const runner = new TestRunner(outputDir);
  const config = runner.createTestConfig(format, density, scenario);

  runner.logTestConfig(config);

  const prompt = runner.generateSubagentPrompt(config);
  console.log(prompt);
}

export default TestRunner;
