/**
 * Answer validator
 * Validates answers deterministically with support for fuzzy matching on deductions
 */

import {
  AnswerTemplate,
  ValidationResult,
  ValidationReport,
  ProvidedAnswer,
  AnswerAndQuestion,
  Format,
  AnswerAccuracy,
  CategoryAnswerAccuracy,
} from "../types";

export interface AnswerCounter {
  correct: number;
  incorrect: number; 
  notSet: number; 
}

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
    const map: Map<string, AnswerCounter> = new Map();

    for (const answerAndQuestion of answersAndQuestions) {
      let counter = map.get(answerAndQuestion.category);
      if(!counter){
        counter = {            
          correct: 0,
          incorrect: 0,
          notSet: 0,  
        };
      }

      const providedAnswer = answerTemplate.answers.find((a) => a.questionId === answerAndQuestion.id);

      if (!providedAnswer) {
        results.push({
          questionId: answerAndQuestion.id,
          question: answerAndQuestion.question,
          givenAnswer: "NOT_ANSWERED",
          expectedAnswer: answerAndQuestion.expectedAnswer.value,
          correct: false,
          category: answerAndQuestion.category,
          method: answerAndQuestion.expectedAnswer.validationMethod
        });

        counter.notSet++;
        map.set(answerAndQuestion.category, counter);
        continue;
      }

      const result = this.validateSingleAnswer(answerAndQuestion, providedAnswer);  
      results.push(result);

      if(result.correct){        
        counter.correct++;
      }else{   
        counter.incorrect++;
      }
      map.set(answerAndQuestion.category, counter);
    }

    // Calculate accuracy
    const correctCount = results.filter((r) => r.correct).length;
    const totalValidatable = results.length;

    return {
      format: format,
      totalQuestions: totalValidatable,
      results,
      accuracy: {
        correct: correctCount,
        incorrect: totalValidatable - correctCount,
        accuracyPercent: totalValidatable > 0 ? Math.round(((correctCount / totalValidatable) * 10000))/100 : 0,
      },
      accuracyPerCategory: [...map.entries()].map<CategoryAnswerAccuracy>(x => {
        const counter = x[1];
        return {      
          category: x[0],    
          correct: counter.correct,
          incorrect: counter.incorrect,
          unanswered: counter.notSet,
          accuracyPercent: Math.round((counter.correct / (counter.correct+counter.incorrect+counter.notSet))*10000)/100
        };
      })
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
    }

    return {
      questionId: question.id,
      question: question.question,
      givenAnswer: providedAnswer.answer,
      expectedAnswer: expected.value,
      correct,
      category: question.category,
      method: expected.validationMethod,
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
