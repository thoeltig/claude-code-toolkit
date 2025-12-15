#!/usr/bin/env node
/**
 * Validate answers against ground truth questionnaire
 * Usage: npm run validate -- <answers_file> <validation_key_file> [output_file]
 */

import * as fs from "fs";
import { AnswerValidator } from "./validators/index";
import { AnswerAndQuestion, Format, QuestionnaireWithAnswers, AnswerTemplate } from "./types";

const answersFile = process.argv[2];
const validationKeyFile = process.argv[3];
const outputFile = process.argv[4];

if (!answersFile || !validationKeyFile) {
  console.error(
    "Usage: node validate.js <answers.json> <validation_key.json> [output.json]"
  );
  process.exit(1);
}

// Read files
const answersData = JSON.parse(fs.readFileSync(answersFile, "utf-8")) as AnswerTemplate;
const validationData = JSON.parse(fs.readFileSync(validationKeyFile, "utf-8")) as QuestionnaireWithAnswers;

// Extract ground truth questions
const groundTruthQuestions: AnswerAndQuestion[] =
  validationData.answersAndQuestions;

// Determine format from answers metadata or default
const format = (answersData.metadata?.format || "csv") as Format;

// Create AnswerTemplate object
const answerTemplate: any = {
  metadata: {
    format: format,
    questionsFilePath: validationKeyFile,
    dataFilePath: answersData.metadata?.dataFilePath || "unknown",
  },
  answers: answersData.answers,
};

// Run validation
const validator = new AnswerValidator();
const report = validator.validateAnswers(format, answerTemplate, groundTruthQuestions);

// Output results to console
console.log("\n" + "=".repeat(70));
console.log("VALIDATION RESULTS");
console.log("=".repeat(70) + "\n");

console.log(`Format: ${report.format}`);
console.log(`Total Questions: ${report.totalQuestions}`);
const totalValidatable = report.totalQuestions - report.accuracy.requiresReview;
console.log(
  `Accuracy: ${report.accuracy.correct}/${totalValidatable} (${report.accuracy.accuracyPercent.toFixed(2)}%)`
);
console.log(
  `Manual Review Required: ${report.accuracy.requiresReview} questions\n`
);

// Show failed answers
const failed = report.results.filter((r) => !r.correct);
if (failed.length > 0) {
  console.log("Failed Questions:");
  for (const result of failed.slice(0, 10)) {
    console.log(
      `  Q${result.questionId} (${result.category}): ${result.question.substring(0, 60)}...`
    );
    console.log(`    Expected: ${String(result.expectedAnswer).substring(0, 50)}`);
    console.log(`    Got: ${String(result.givenAnswer).substring(0, 50)}`);
  }
  if (failed.length > 10) {
    console.log(`  ... and ${failed.length - 10} more`);
  }
}

console.log("\n" + "=".repeat(70) + "\n");

// Save results if output file specified
if (outputFile) {
  const result = {
    format: report.format,
    accuracy: report.accuracy,
    results: report.results.map((r) => ({
      questionId: r.questionId,
      question: r.question,
      category: r.category,
      correct: r.correct,
      givenAnswer: r.givenAnswer,
      expectedAnswer: r.expectedAnswer,
      method: r.method,
    })),
  };

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`Results saved to: ${outputFile}\n`);
}

process.exit(report.accuracy.accuracyPercent === 100 ? 0 : 1);
