/**
 * Questionnaire generator
 * Generates paired questions from dataset with deterministic answers
 */

import { BaseDataSet, DataRecord, QuestionnaireWithAnswers, AnswerAndQuestion } from "../types";

interface QuestionGeneratorContext {
  data: BaseDataSet;
  records: DataRecord[];
}

export class QuestionnaireGenerator {
  private rand: () => number;

  constructor(seed: number = 12345) {
    this.rand = this.seededRandom(seed);
  }

  private seededRandom(seed: number): () => number {
    let current = seed;
    return () => {
      current = (current * 9301 + 49297) % 233280;
      return current / 233280;
    };
  }

  private getRandomItem<T>(arr: T[]): T {
    return arr[Math.floor(this.rand() * arr.length)];
  }

  public generate(data: BaseDataSet): AnswerAndQuestion[] {
    const ctx: QuestionGeneratorContext = {
      data,
      records: data.records
    };

    const answersAndQuestions: AnswerAndQuestion[] = [];
    let id = 1;

    // Distribution: 30% field_retrieval, 30% aggregation, 20% filtering, 15% structure, 5% deduction
    const targetQuestions = 100; // 100 questions
    const distribution = {
      field_retrieval: Math.ceil(targetQuestions * 0.3), 
      aggregation: Math.ceil(targetQuestions * 0.3), 
      filtering: Math.ceil(targetQuestions * 0.2),
      structure_awareness: Math.ceil(targetQuestions * 0.15), 
      deduction: Math.ceil(targetQuestions * 0.05), 
    };

    // Generate questions per category
    answersAndQuestions.push(...this.generateFieldRetrievalQuestions(ctx, distribution.field_retrieval, id));
    id += distribution.field_retrieval;

    answersAndQuestions.push(...this.generateAggregationQuestions(ctx, distribution.aggregation, id));
    id += distribution.aggregation;

    answersAndQuestions.push(...this.generateFilteringQuestions(ctx, distribution.filtering, id));
    id += distribution.filtering;

    answersAndQuestions.push(...this.generateStructureAwarenessQuestions(ctx, distribution.structure_awareness, id));
    id += distribution.structure_awareness;

    answersAndQuestions.push(...this.generateDeductionQuestions(ctx, distribution.deduction, id));

    return answersAndQuestions;
  }

  private generateFieldRetrievalQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];

    for (let i = 0; i < count && ctx.records.length > i; i++) {
      const record = ctx.records[i];
      const fields = Object.keys(record).filter((f) => record[f] !== null && record[f] !== undefined);
      const field = this.getRandomItem(fields);
      const value = record[field];

      if (value === null || value === undefined) continue;

      questions.push({
        id: startId + i,
        category: "field_retrieval",
        difficulty: "easy",
        question: `What is the ${field} of product ${record.productId}?`,
        expectedAnswer: {
          value: String(value),
          validationMethod: "exact",
        },
        dataReferences: [field, "productId"],
        context: `Product #${i + 1} in the dataset`,
      });
    }

    return questions;
  }

  private generateAggregationQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];
    const { records } = ctx;

    if (count >= 1) {
      // Total stock
      const totalStock = records.reduce((sum, r) => sum + Number(r.stockQuantity || 0), 0);
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "medium",
        question: "What is the total stock quantity across all products?",
        expectedAnswer: {
          value: totalStock,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["stockQuantity"],
        context: "Sum of stockQuantity field across all records",
      });
    }

    if (count >= 2) {
      // Average price
      const avgPrice = records.reduce((sum, r) => sum + Number(r.price || 0), 0) / records.length;
      questions.push({
        id: startId + 1,
        category: "aggregation",
        difficulty: "medium",
        question: "What is the average product price?",
        expectedAnswer: {
          value: Math.round(avgPrice * 100) / 100,
          validationMethod: "numeric",
          tolerance: 0.01,
        },
        dataReferences: ["price"],
        context: "Average of price field across all records",
      });
    }

    if (count >= 3) {
      // Highest price
      const maxPrice = Math.max(...records.map((r) => Number(r.price || 0)));
      questions.push({
        id: startId + 2,
        category: "aggregation",
        difficulty: "medium",
        question: "What is the highest product price?",
        expectedAnswer: {
          value: maxPrice,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["price"],
        context: "Maximum price in the dataset",
      });
    }

    if (count >= 4) {
      // Count by category
      const categoryCounts = new Map<string, number>();
      records.forEach((r) => {
        const cat = String(r.category || "Unknown");
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      });

      const [topCategory, topCount] = Array.from(categoryCounts.entries()).reduce((a, b) =>
        b[1] > a[1] ? b : a
      );

      questions.push({
        id: startId + 3,
        category: "aggregation",
        difficulty: "medium",
        question: `How many products are in the ${topCategory} category?`,
        expectedAnswer: {
          value: topCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["category"],
        context: `Count of records where category = "${topCategory}"`,
      });
    }

    return questions.slice(0, count);
  }

  private generateFilteringQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];
    const { records } = ctx;

    if (count >= 1) {
      // Count out of stock
      const outOfStock = records.filter((r) => Number(r.stockQuantity || 0) === 0).length;
      questions.push({
        id: startId,
        category: "filtering",
        difficulty: "medium",
        question: "How many products are currently out of stock (stockQuantity = 0)?",
        expectedAnswer: {
          value: outOfStock,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["stockQuantity"],
        context: "Count of records where stockQuantity equals 0",
      });
    }

    if (count >= 2) {
      // Count expensive items
      const avgPrice = records.reduce((sum, r) => sum + Number(r.price || 0), 0) / records.length;
      const expensiveCount = records.filter((r) => Number(r.price || 0) > avgPrice).length;
      questions.push({
        id: startId + 1,
        category: "filtering",
        difficulty: "medium",
        question: `How many products are priced above the average price (>${Math.round(avgPrice)})?`,
        expectedAnswer: {
          value: expensiveCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["price"],
        context: "Count of records where price exceeds average",
      });
    }

    if (count >= 3) {
      // Count hazardous items
      const hazardousCount = records.filter((r) => r.hazardous === true).length;
      questions.push({
        id: startId + 2,
        category: "filtering",
        difficulty: "medium",
        question: "How many products are marked as hazardous?",
        expectedAnswer: {
          value: hazardousCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["hazardous"],
        context: "Count of records where hazardous = true",
      });
    }

    return questions.slice(0, count);
  }

  private generateStructureAwarenessQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];
    const { records } = ctx;

    if (count >= 1) {
      // List unique categories
      const categories = Array.from(new Set(records.map((r) => String(r.category || "Unknown")))).sort();
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: "List all unique product categories in the dataset",
        expectedAnswer: {
          value: categories,
          validationMethod: "array_set",
        },
        dataReferences: ["category"],
        context: "Unique values from category field",
      });
    }

    if (count >= 2) {
      // List unique suppliers
      const suppliers = Array.from(new Set(records.map((r) => String(r.supplierName || "Unknown")))).sort();
      questions.push({
        id: startId + 1,
        category: "structure_awareness",
        difficulty: "hard",
        question: "How many unique suppliers are represented in the dataset?",
        expectedAnswer: {
          value: suppliers.length,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: ["supplierName"],
        context: "Count of unique values in supplierName field",
      });
    }

    return questions.slice(0, count);
  }

  private generateDeductionQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];
    const { records } = ctx;

    if (count >= 1) {
      // Which supplier supplies the most products
      const supplierCounts = new Map<string, number>();
      records.forEach((r) => {
        const supplier = String(r.supplierName || "Unknown");
        supplierCounts.set(supplier, (supplierCounts.get(supplier) || 0) + 1);
      });

      const topSupplier = Array.from(supplierCounts.entries()).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

      questions.push({
        id: startId,
        category: "deduction",
        difficulty: "hard",
        question: "Which supplier supplies the most products, and how many products do they supply?",
        expectedAnswer: {
          value: `${topSupplier} supplies ${supplierCounts.get(topSupplier)} products`,
          validationMethod: "fuzzy_deduction",
          keywords: [topSupplier, String(supplierCounts.get(topSupplier))],
        },
        dataReferences: ["supplierName"],
        context: "Requires aggregation and ranking by supplier",
        requiresManualReview: true,
      });
    }

    return questions.slice(0, count);
  }
}

export function generateQuestionnaire(data: BaseDataSet): AnswerAndQuestion[] {
  const generator = new QuestionnaireGenerator();
  return generator.generate(data);
}
