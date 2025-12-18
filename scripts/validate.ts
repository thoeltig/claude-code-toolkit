#!/usr/bin/env node
/**
 * Validate all answers against ground truth questionnaires
 * Automatically finds all test output files recursively and aggregates 3 test runs per format/variant/recordCount
 * Usage: node validate.js --subagent-outputs <dir> --validation-dir <dir> --results-dir <dir>
 */

import * as fs from "fs";
import * as path from "path";
import { AnswerValidator } from "./validators/index";
import { AnswerAndQuestion, Format, QuestionnaireWithAnswers, AnswerTemplate, ValidationReport, MergedValidationReport, QuestionsAndProvidedAnswers } from "./types";

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

const map: Map<string,TestCase> = new Map();
function findTestCases(dir: string): TestCase[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findTestCases(fullPath);
    } else if (entry.isFile()) {
      // Extract variant and recordCount from filename
      // Format: answers_for_{variant}_{recordCount}_records_1.json
      const match = entry.name.match(/^answers_for_(.+?)_(\d+)_records_(\d+)\.json$/);
      if (match) {
        const format = path.basename(path.dirname(fullPath));
        const variant = match[1];
        const recordCount = parseInt(match[2]);

        const key = `${format}${variant}${recordCount}`;        
        let testCase = map.get(key);
        if(!testCase){
          testCase = { 
            format: format, 
            variant: variant, 
            recordCount: recordCount,
            answerFiles: [fullPath] 
          }
        }else{
          testCase.answerFiles.push(fullPath);
        }  

        map.set(key, testCase);
      }
    }
  }
  
  return [...map.values()];
}

const testCases = findTestCases(subagentOutputsDir);

if (testCases.length === 0) {
  console.error("Error: No test cases found in", subagentOutputsDir);
  process.exit(1);
}

console.log(`\nFound ${testCases.length} test cases to validate\n`);

// Validate all test cases
const validator = new AnswerValidator();
let allAccurate = true;

for (const testCase of testCases) {
  const validationKeyFile = path.join(validationDir, `questions_and_answers_with_${testCase.variant}_${testCase.recordCount}_records.json`);

  if (!fs.existsSync(validationKeyFile)) {
    console.warn(`⚠ Skipping ${testCase.format}_${testCase.variant}_${testCase.recordCount}: validation data not found`);
    continue;
  }

  const validationData = JSON.parse(fs.readFileSync(validationKeyFile, "utf-8")) as QuestionnaireWithAnswers;
  const groundTruthQuestions: AnswerAndQuestion[] = validationData.answersAndQuestions;
  
  const report: MergedValidationReport = {
    format: testCase.format as Format,  
    variant: testCase.variant,
    recordCount: testCase.recordCount,
    testRuns: testCase.answerFiles.length,
    totalQuestions: validationData.metadata.totalQuestions,
    accuracy: {
      correct: 0,
      incorrect: 0,
      accuracyPercent: 0,
    },
    perRunAccuracy:[],
    questionsAndProvidedAnswers:groundTruthQuestions.map<QuestionsAndProvidedAnswers>(x => {
      return {
        questionId: x.id,
        category: x.category,
        question: x.question,
        expectedAnswer: x.expectedAnswer.value,
        answers:[],
      };
    })
  };

  for (let i = 0; i < testCase.answerFiles.length; i++) {
    const answersFile = testCase.answerFiles[i];
    const answersData = JSON.parse(fs.readFileSync(answersFile, "utf-8")) as AnswerTemplate;

    const format = testCase.format as Format;
    const answerTemplate: AnswerTemplate = {
      metadata: {
        format: format,
        questionsFilePath: validationKeyFile,
        dataFilePath: answersData.metadata?.dataFilePath || "unknown",
      },
      answers: answersData.answers,
    };

    const validationResult = validator.validateAnswers(format, answerTemplate, groundTruthQuestions);
    
    report.perRunAccuracy.push({
      run: i + 1,
      correct: validationResult.accuracy.correct,
      incorrect: validationResult.accuracy.incorrect,
      accuracyPercent: validationResult.accuracy.accuracyPercent,
      accuracyPerCategory: validationResult.accuracyPerCategory
    });

    validationResult.results.forEach(x => {
      const questionsAndProvidedAnswer = report.questionsAndProvidedAnswers.find(y => y.questionId == x.questionId);
      questionsAndProvidedAnswer.answers.push({
        givenAnswer: x.givenAnswer,
        correct: x.correct
      });
    });
  }

  // Aggregate results from all 3 runs
  report.accuracy.correct =  Math.round((report.perRunAccuracy.reduce((sum, r) => sum + r.correct, 0) / report.perRunAccuracy.length) * 100)/100;
  report.accuracy.incorrect =  Math.round((report.perRunAccuracy.reduce((sum, r) => sum + r.incorrect, 0) / report.perRunAccuracy.length) * 100)/100;
  report.accuracy.accuracyPercent =  Math.round((report.perRunAccuracy.reduce((sum, r) => sum + r.accuracyPercent, 0) / report.perRunAccuracy.length) * 100)/100;
  
  const statusIcon = report.accuracy.accuracyPercent === 100 ? "✓" : report.accuracy.accuracyPercent >= 90 ? "◐" : "✗";
  console.log(`${statusIcon} ${testCase.format.padEnd(15)} ${testCase.variant.padEnd(10)} ${String(testCase.recordCount).padEnd(4)} → ${report.accuracy.accuracyPercent.toFixed(3)}%`);

  // Save aggregated results
  const outputFile = path.join(resultsDir, `${testCase.format}_${testCase.variant}_${testCase.recordCount}_validation.json`);
  fs.writeFileSync(outputFile, JSON.stringify(report));

  if (report.accuracy.accuracyPercent < 100) {
    allAccurate = false;
  }
}

console.log(`\n✓ Validation complete. Results saved to: ${resultsDir}\n`);

process.exit(allAccurate ? 0 : 1);
