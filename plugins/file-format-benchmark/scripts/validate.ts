#!/usr/bin/env node
/**
 * Validate all answers against ground truth questionnaires
 * Automatically finds all test output files recursively and aggregates 3 test runs per format/variant/recordCount
 * Usage: node validate.js --subagent-outputs <dir> --validation-dir <dir> --results-dir <dir>
 */

import * as fs from "fs";
import * as path from "path";
import { AnswerValidator } from "./validators/index";
import { AnswerAndQuestion, Format, QuestionnaireWithAnswers, AnswerTemplate } from "./types";

// Parse command line arguments
let subagentOutputsDir: string | undefined;
let validationDir: string | undefined;
let resultsDir: string | undefined;

for (let i = 2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case "--subagent-outputs":
      subagentOutputsDir = process.argv[++i];
      break;
    case "--validation-dir":
      validationDir = process.argv[++i];
      break;
    case "--results-dir":
      resultsDir = process.argv[++i];
      break;
  }
}

if (!subagentOutputsDir || !validationDir || !resultsDir) {
  console.error(
    "Usage: node validate.js --subagent-outputs <dir> --validation-dir <dir> --results-dir <dir>"
  );
  process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Find all test 1 files recursively (these define the test cases)
interface TestCase {
  format: string;
  variant: string;
  recordCount: number;
  answerFiles: string[];
}

const testCases: TestCase[] = [];

function findTestCases(dir: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findTestCases(fullPath);
    } else if (entry.isFile() && entry.name.match(/^answers_for_.*_records_1\.json$/)) {
      // Extract format from parent directory
      const format = path.basename(path.dirname(fullPath));

      // Extract variant and recordCount from filename
      // Format: answers_for_{variant}_{recordCount}_records_1.json
      const match = entry.name.match(/^answers_for_(.+?)_(\d+)_records_1\.json$/);
      if (match) {
        const variant = match[1];
        const recordCount = parseInt(match[2]);

        const baseDir = path.dirname(fullPath);
        const answerFiles = [
          path.join(baseDir, `answers_for_${variant}_${recordCount}_records_1.json`),
          path.join(baseDir, `answers_for_${variant}_${recordCount}_records_2.json`),
          path.join(baseDir, `answers_for_${variant}_${recordCount}_records_3.json`),
        ];

        // Verify all 3 files exist
        if (answerFiles.every((f) => fs.existsSync(f))) {
          testCases.push({ format, variant, recordCount, answerFiles });
        }
      }
    }
  }
}

findTestCases(subagentOutputsDir);

if (testCases.length === 0) {
  console.error("Error: No test cases found in", subagentOutputsDir);
  process.exit(1);
}

console.log(`\nFound ${testCases.length} test cases to validate\n`);

// Validate all test cases
const validator = new AnswerValidator();
let allAccurate = true;

for (const testCase of testCases) {
  const validationKeyFile = path.join(
    validationDir,
    `questions_and_answers_with_${testCase.variant}_${testCase.recordCount}_records.json`
  );

  if (!fs.existsSync(validationKeyFile)) {
    console.warn(`⚠ Skipping ${testCase.format}_${testCase.variant}_${testCase.recordCount}: validation data not found`);
    continue;
  }

  const validationData = JSON.parse(fs.readFileSync(validationKeyFile, "utf-8")) as QuestionnaireWithAnswers;
  const groundTruthQuestions: AnswerAndQuestion[] = validationData.answersAndQuestions;

  const reports = [];

  for (let i = 0; i < 3; i++) {
    const answersFile = testCase.answerFiles[i];
    const answersData = JSON.parse(fs.readFileSync(answersFile, "utf-8")) as AnswerTemplate;

    const answerTemplate: any = {
      metadata: {
        format: testCase.format as Format,
        questionsFilePath: validationKeyFile,
        dataFilePath: answersData.metadata?.dataFilePath || "unknown",
      },
      answers: answersData.answers,
    };

    const report = validator.validateAnswers(testCase.format as Format, answerTemplate, groundTruthQuestions);
    reports.push(report);
  }

  // Aggregate results from all 3 runs
  const avgCorrect = reports.reduce((sum, r) => sum + r.accuracy.correct, 0) / reports.length;
  const avgIncorrect = reports.reduce((sum, r) => sum + r.accuracy.incorrect, 0) / reports.length;
  const avgRequiresReview = reports.reduce((sum, r) => sum + r.accuracy.requiresReview, 0) / reports.length;
  const avgAccuracy = reports.reduce((sum, r) => sum + r.accuracy.accuracyPercent, 0) / reports.length;

  const accuracyStr = avgAccuracy.toFixed(3);
  const statusIcon = avgAccuracy === 100 ? "✓" : avgAccuracy >= 90 ? "◐" : "✗";
  console.log(
    `${statusIcon} ${testCase.format.padEnd(15)} ${testCase.variant.padEnd(10)} ${String(testCase.recordCount).padEnd(4)} → ${accuracyStr}%`
  );

  // Save aggregated results
  const outputFile = path.join(resultsDir, `${testCase.format}_${testCase.variant}_${testCase.recordCount}_validation.json`);
  const aggregatedResult = {
    format: testCase.format,
    variant: testCase.variant,
    recordCount: testCase.recordCount,
    testRuns: 3,
    totalQuestions: reports[0].totalQuestions,
    accuracy: {
      correct: Math.round(avgCorrect * 1000) / 1000,
      incorrect: Math.round(avgIncorrect * 1000) / 1000,
      requiresReview: Math.round(avgRequiresReview * 1000) / 1000,
      accuracyPercent: Math.round(avgAccuracy * 1000) / 1000,
    },
    perRunAccuracy: reports.map((r, idx) => ({
      run: idx + 1,
      correct: r.accuracy.correct,
      incorrect: r.accuracy.incorrect,
      requiresReview: r.accuracy.requiresReview,
      accuracyPercent: r.accuracy.accuracyPercent,
    })),
  };

  fs.writeFileSync(outputFile, JSON.stringify(aggregatedResult));

  if (avgAccuracy < 100) {
    allAccurate = false;
  }
}

console.log(`\n✓ Validation complete. Results saved to: ${resultsDir}\n`);

process.exit(allAccurate ? 0 : 1);
