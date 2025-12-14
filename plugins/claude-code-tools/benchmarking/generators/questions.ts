/**
 * Questionnaire generator
 * Generates paired questions from dataset with deterministic answers
 */

import { BaseDataSet, DataRecord, AnswerAndQuestion } from "../types";
import { Randomizer } from "./randomizer";

interface QuestionGeneratorContext {
  data: BaseDataSet;
  records: DataRecord[];
}

export class QuestionnaireGenerator {
  private readonly rand: Randomizer;

  constructor(seed: number = 12345) {
    this.rand = new Randomizer(seed);
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
    const productIdField = "productId";
    const split = count / 3;
    const questions: AnswerAndQuestion[] = [];

    let retrivalStartIdx = startId;
    let records = this.rand.getRandomItems(ctx.records, split);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomField(record, productIdField);
      const value = record[field];

      if (value === null || value === undefined) continue;

      retrivalStartIdx += 1;
      questions.push({
        id: retrivalStartIdx,
        category: "field_retrieval",
        difficulty: "easy",
        question: `What is the ${field} of product ${record.productId}?`,
        expectedAnswer: {
          value: String(value),
          validationMethod: "exact",
        },
        dataReferences: [field, productIdField],
      });
    }
    
    records = this.rand.getRandomItems(ctx.records, split);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const radomFields = this.rand.getRandomFields(record, productIdField);
      const values = this.getValues(record, radomFields);

      retrivalStartIdx += 1;
      questions.push({
        id: retrivalStartIdx,
        category: "field_retrieval",
        difficulty: "medium",
        question: `What are the ${radomFields.join(", ")} of product ${record.productId}?`,
        expectedAnswer: {
          value: values,
          validationMethod: "exact",
        },
        dataReferences: [...radomFields, productIdField],
      });
    }

    const remainingCount = count-split*2;
    records = this.rand.getRandomItems(ctx.records, remainingCount*2);
    for (let i = 0; i < records.length; i+=2) {
      const record = records[i];
      const radomFields = this.rand.getRandomFields(record, productIdField);
      const values = this.getValues(record, radomFields);
      
      const record2 = records[(i+1)];
      const radomFields2 = this.rand.getRandomFields(record2, productIdField);
      const values2 = this.getValues(record2, radomFields2);

      retrivalStartIdx += 1;
      questions.push({
        id: retrivalStartIdx,
        category: "field_retrieval",
        difficulty: "hard",
        question: `What are the ${radomFields.join(", ")} of product ${record.productId} and the ${radomFields2.join(", ")} of product ${record2.productId}?`,
        expectedAnswer: {
          value: [...values, ...values2],
          validationMethod: "exact",
        },
        dataReferences: [...new Set([...radomFields, ...radomFields2]), productIdField],
      });
    }

    return questions;
  }

  private getValues(record: DataRecord, fields: string[]){
    const values:string[] = [];
    fields.forEach(field => {
      const value = record[field];
      return values.push(value.toString());
    });
    return values;
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
        dataReferences: ["stockQuantity"]
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
        dataReferences: ["price"]
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
        dataReferences: ["price"]
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
        dataReferences: ["category"]
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
        dataReferences: ["stockQuantity"]
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
        dataReferences: ["price"]
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
        dataReferences: ["hazardous"]
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
        dataReferences: ["category"]
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
        dataReferences: ["supplierName"]
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
        dataReferences: ["supplierName"]
      });
    }

    return questions.slice(0, count);
  }
}

export function generateQuestionnaire(data: BaseDataSet): AnswerAndQuestion[] {
  const generator = new QuestionnaireGenerator();
  return generator.generate(data);
}
