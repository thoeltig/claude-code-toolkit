/**
 * Answer validator
 * Validates answers deterministically with support for fuzzy matching on deductions
 */

import {
  Question,
  AnswerTemplate,
  ValidationResult,
  ValidationReport,
  ProvidedAnswer,
  AnswerAndQuestion,
  Format,
} from "../types";

export class AnswerValidator {
  /**
   * Validate all answers against questionnaire
   */
  public validateAnswers(
    format: Format,
    answerTemplate: AnswerTemplate,
    answersAndQuestions: AnswerAndQuestion[]
  ): ValidationReport {
    const results: ValidationResult[] = [];
    const manualReviewRequired: ValidationResult[] = [];

    for (const answerAndQuestion of answersAndQuestions) {
      const providedAnswer = answerTemplate.answers.find((a) => a.questionId === answerAndQuestion.id);

      if (!providedAnswer) {
        results.push({
          questionId: answerAndQuestion.id,
          question: answerAndQuestion.question,
          givenAnswer: "NOT_ANSWERED",
          expectedAnswer: answerAndQuestion.expectedAnswer.value,
          correct: false,
          category: answerAndQuestion.category,
          method: answerAndQuestion.expectedAnswer.validationMethod,
          confidence: 0,
          requiresManualReview: answerAndQuestion.requiresManualReview || false,
        });
        continue;
      }

      const result = this.validateSingleAnswer(answerAndQuestion, providedAnswer);
      results.push(result);

      if (result.requiresManualReview) {
        manualReviewRequired.push(result);
      }
    }

    // Calculate accuracy
    const correctCount = results.filter((r) => r.correct && !r.requiresManualReview).length;
    const totalValidatable = results.filter((r) => !r.requiresManualReview).length;

    return {
      format: format,
      totalQuestions: results.length,
      results,
      accuracy: {
        correct: correctCount,
        incorrect: totalValidatable - correctCount,
        requiresReview: manualReviewRequired.length,
        accuracyPercent: totalValidatable > 0 ? (correctCount / totalValidatable) * 100 : 0,
      },
      manualReviewRequired,
    };
  }

  private validateSingleAnswer(question: AnswerAndQuestion, providedAnswer: ProvidedAnswer): ValidationResult {
    const expected = question.expectedAnswer;
    let correct = false;
    let confidence = 0;

    switch (expected.validationMethod) {
      case "exact":
        correct = this.validateExact(String(providedAnswer.answer), String(expected.value));
        confidence = correct ? 1 : 0;
        break;

      case "numeric":
        const result = this.validateNumeric(providedAnswer.answer, expected.value, expected.tolerance || 0);
        correct = result.correct;
        confidence = result.confidence;
        break;

      case "array_set":
        const arrayResult = this.validateArraySet(providedAnswer.answer, expected.value as string[]);
        correct = arrayResult.correct;
        confidence = arrayResult.confidence;
        break;

      case "fuzzy_deduction":
        const fuzzyResult = this.validateFuzzyDeduction(providedAnswer.answer, expected.keywords || []);
        correct = fuzzyResult.correct;
        confidence = fuzzyResult.confidence;
        break;

      case "manual":
        // Manual validation - always mark as requiring review
        correct = false;
        confidence = 0;
        break;
    }

    return {
      questionId: question.id,
      question: question.question,
      givenAnswer: providedAnswer.answer,
      expectedAnswer: expected.value,
      correct,
      category: question.category,
      method: expected.validationMethod,
      confidence,
      requiresManualReview: expected.validationMethod === "fuzzy_deduction" || expected.validationMethod === "manual",
    };
  }

  /**
   * Exact string match (case-insensitive)
   */
  private validateExact(given: string, expected: string): boolean {
    return given.toLowerCase().trim() === expected.toLowerCase().trim();
  }

  /**
   * Numeric validation with tolerance
   */
  private validateNumeric(given: unknown, expected: unknown, tolerance: number): {correct: boolean; confidence: number} {
    const givenNum = this.parseNumber(given);
    const expectedNum = this.parseNumber(expected);

    if (givenNum === null || expectedNum === null) {
      return { correct: false, confidence: 0 };
    }

    const diff = Math.abs(givenNum - expectedNum);
    const correct = diff <= tolerance;
    const confidence = correct ? 1 : Math.max(0, 1 - diff / (expectedNum + 1));

    return { correct, confidence };
  }

  /**
   * Array/set validation - check if given answer contains all expected items
   */
  private validateArraySet(given: unknown, expected: string[]): {correct: boolean; confidence: number} {
    let givenItems: string[] = [];

    if (Array.isArray(given)) {
      givenItems = given.map((item) => String(item).toLowerCase().trim());
    } else if (typeof given === "string") {
      // Try to parse comma-separated list
      givenItems = given.split(",").map((item) => item.toLowerCase().trim());
    } else {
      return { correct: false, confidence: 0 };
    }

    const expectedSet = new Set(expected.map((item) => item.toLowerCase().trim()));
    const givenSet = new Set(givenItems);

    // Check if all expected items are in given items
    let matchCount = 0;
    for (const item of expectedSet) {
      if (givenSet.has(item)) {
        matchCount++;
      }
    }

    const correct = matchCount === expectedSet.size;
    const confidence = matchCount / expectedSet.size;

    return { correct, confidence };
  }

  /**
   * Fuzzy deduction validation - check if answer contains key terms
   */
  private validateFuzzyDeduction(given: unknown, keywords: string[]): {correct: boolean; confidence: number} {
    const givenStr = String(given).toLowerCase();

    let matchCount = 0;
    for (const keyword of keywords) {
      if (givenStr.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    const correct = matchCount >= Math.ceil(keywords.length * 0.7); // 70% of keywords
    const confidence = matchCount / keywords.length;

    return { correct, confidence };
  }

  /**
   * Parse number from string or number type
   */
  private parseNumber(value: unknown): number | null {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
}

export function validateAnswers(
  format: Format,
  answerTemplate: AnswerTemplate,
  questions: AnswerAndQuestion[]
): ValidationReport {
  const validator = new AnswerValidator();
  return validator.validateAnswers(format, answerTemplate, questions);
}
