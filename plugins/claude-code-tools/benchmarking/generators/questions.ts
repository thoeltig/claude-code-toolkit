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
    const productIdField = "productId";
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
    let entries = this.generateFieldRetrievalQuestions(ctx, distribution.field_retrieval, id, productIdField);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Retrival questions: "+ entries.length);

    entries = this.generateAggregationQuestions(ctx, distribution.aggregation, id, productIdField);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Aggregation questions: "+ entries.length);

    entries = this.generateFilteringQuestions(ctx, distribution.filtering, id);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("filtering questions: "+ entries.length);

    entries = this.generateStructureAwarenessQuestions(ctx, distribution.structure_awareness, id);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Structure questions: "+ entries.length);

    entries = this.generateDeductionQuestions(ctx, distribution.deduction, id);
    answersAndQuestions.push(...entries);
    console.log("Deduction questions: "+ entries.length);

    console.log("Total questions: "+ answersAndQuestions.length);
    return answersAndQuestions;
  }

  private generateFieldRetrievalQuestions(ctx: QuestionGeneratorContext, count: number, startId: number, idField: string): AnswerAndQuestion[] {
    const splitCount = count / 3;
    const remainingCount = count - splitCount * 2;
    const questions: AnswerAndQuestion[] = [];

    let records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomField(record, idField);
      const value = record[field];

      startId += 1;
      questions.push({
        id: startId,
        category: "field_retrieval",
        difficulty: "easy",
        question: `What is the ${field} of product ${record[idField]}?`,
        expectedAnswer: {
          value: String(value),
          validationMethod: "exact",
        },
        dataReferences: [field, idField],
      });
    }
    
    records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const radomFields = this.rand.getRandomFields(record, idField);
      const values = this.getValues(record, radomFields);

      startId += 1;
      questions.push({
        id: startId,
        category: "field_retrieval",
        difficulty: "medium",
        question: `What are the ${radomFields.join(", ")} of product ${record[idField]}?`,
        expectedAnswer: {
          value: values,
          validationMethod: "exact",
        },
        dataReferences: [...radomFields, idField],
      });
    }

    records = this.rand.getRandomItems(ctx.records, remainingCount*2);
    for (let i = 0; i < records.length; i+=2) {
      const record = records[i];
      const radomFields = this.rand.getRandomFields(record, idField);
      const values = this.getValues(record, radomFields);
      
      const record2 = records[(i+1)];
      const radomFields2 = this.rand.getRandomFields(record2, idField);
      const values2 = this.getValues(record2, radomFields2);

      startId += 1;
      questions.push({
        id: startId,
        category: "field_retrieval",
        difficulty: "hard",
        question: `What are the ${radomFields.join(", ")} of product ${record[idField]} and the ${radomFields2.join(", ")} of product ${record2[idField]}?`,
        expectedAnswer: {
          value: [...values, ...values2],
          validationMethod: "exact",
        },
        dataReferences: [...new Set([...radomFields, ...radomFields2]), idField],
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

  private generateAggregationQuestions(ctx: QuestionGeneratorContext, count: number, startId: number, idField: string): AnswerAndQuestion[] {
    const splitCount = count / 5; // count, sum, min, max
    const remainingCount = count - splitCount * 4; // avg
    const questions: AnswerAndQuestion[] = [];

    let records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomField(record, idField);
      const value = record[field];

      startId += 1;
      const expectedCount = records.filter(x => x[field] === value).length;
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "easy",
        question: `How many products have the value '${value}' in ${field}?`,
        expectedAnswer: {
          value: expectedCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [field],
      });
    }
    
    records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomNumbericField(record, idField);

      startId += 1;
      const expectedSum = records.reduce((sum, r) => sum + Number(r[field] || 0), 0);
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "easy",
        question: `How much is the sum of all values in ${field} across all products?`,
        expectedAnswer: {
          value: expectedSum,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [field],
      });
    }
    
    records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomNumbericField(record, idField);

      startId += 1;
      const expectedMin = Math.min(...records.map((r) => Number(r[field] || 0)));
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "medium",
        question: `What is the lowest value in ${field} across all products?`,
        expectedAnswer: {
          value: expectedMin,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [field],
      });
    }
        
    records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomNumbericField(record, idField);

      startId += 1;
      const expectedMax = Math.max(...records.map((r) => Number(r[field] || 0)));
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "medium",
        question: `What is the highest value in ${field} across all products?`,
        expectedAnswer: {
          value: expectedMax,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [field],
      });
    }
        
    records = this.rand.getRandomItems(ctx.records, remainingCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const field = this.rand.getRandomNumbericField(record, idField);

      startId += 1;
      const expectedAvg = records.reduce((sum, r) => sum + Number(r[field] || 0), 0) / records.length;
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "hard",
        question: `What is the average value in ${field} across all products?`,
        expectedAnswer: {
          value: Math.round(expectedAvg * 100) / 100,
          validationMethod: "numeric",
          tolerance: 0.01,
        },
        dataReferences: [field],
      });
    }

    return questions;
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
