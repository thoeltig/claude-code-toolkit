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

    const targetQuestions = 120;
    const distribution = {
      field_retrieval: Math.ceil(targetQuestions * 0.35), 
      aggregation: Math.ceil(targetQuestions * 0.275), 
      filtering: Math.ceil(targetQuestions * 0.2),
      structure_awareness: Math.ceil(targetQuestions * 0.125), 
      multiple_steps: Math.ceil(targetQuestions * 0.05), 
    };
    
    const answersAndQuestions: AnswerAndQuestion[] = [];
    let id = 1;

    // Generate questions per category
    let entries = this.generateFieldRetrievalQuestions(ctx, distribution.field_retrieval, id, productIdField);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Retrival questions: "+ entries.length);

    entries = this.generateAggregationQuestions(ctx, distribution.aggregation, id, productIdField);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Aggregation questions: "+ entries.length);

    entries = this.generateFilteringQuestions(ctx, distribution.filtering, id, productIdField);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Filtering questions: "+ entries.length);

    entries = this.generateStructureAwarenessQuestions(ctx, distribution.structure_awareness, id);
    answersAndQuestions.push(...entries);
    id += entries.length;
    console.log("Structure questions: "+ entries.length);

    entries = this.generateMultipleStepsQuestions(ctx, distribution.multiple_steps, id);
    answersAndQuestions.push(...entries);
    console.log("Multiple steps questions: "+ entries.length);

    console.log("Total questions: "+ answersAndQuestions.length);
    return answersAndQuestions;
  }

  private generateFieldRetrievalQuestions(ctx: QuestionGeneratorContext, count: number, startId: number, idField: string): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];

    if(count < 0){
      return questions;
    }

    const splitCount = Math.ceil(count / 3);
    const remainingCount = count - splitCount * 2;

    const map = this.rand.getUniqueFieldsAndValues(ctx.records, splitCount, idField);
    map.forEach((record, field) => {
      const value = record[field];

      startId++;
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
    });
    
    let records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const radomFields = this.rand.getRandomFields(record, idField);
      const values = this.getValues(record, radomFields);

      startId++;
      questions.push({
        id: startId,
        category: "field_retrieval",
        difficulty: "medium",
        question: `What are the ${radomFields.join(", ")} of product ${record[idField]}?`,
        expectedAnswer: {
          value: values,
          validationMethod: "array_set",
        },
        dataReferences: [...radomFields, idField],
      });
    }

    let doubleAmount =  remainingCount*2;
    if(doubleAmount > ctx.records.length){
      doubleAmount = ctx.records.length;
    }
    
    if(doubleAmount % 2 !== 0){
      doubleAmount--;
    }

    records = this.rand.getRandomItems(ctx.records, doubleAmount);
    for (let i = 0; i < records.length; i+=2) {
      const record = records[i];
      const radomFields = this.rand.getRandomFields(record, idField);
      const values = this.getValues(record, radomFields);
      
      const record2 = records[(i+1)];
      const radomFields2 = this.rand.getRandomFields(record2, idField);
      const values2 = this.getValues(record2, radomFields2);

      startId++;
      questions.push({
        id: startId,
        category: "field_retrieval",
        difficulty: "hard",
        question: `What are the ${radomFields.join(", ")} of product ${record[idField]} and the ${radomFields2.join(", ")} of product ${record2[idField]}?`,
        expectedAnswer: {
          value: [...values, ...values2],
          validationMethod: "array_set",
        },
        dataReferences: [...new Set([...radomFields, ...radomFields2]), idField],
      });
    }

    return questions;
  }

  private generateAggregationQuestions(ctx: QuestionGeneratorContext, count: number, startId: number, idField: string): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];
    
    if(count < 0){
      return questions;
    }

    const splitCount = Math.ceil(count / 3); // sum, min/max, avg
    const remainingCount = count - splitCount * 2;
    
    let records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const numericField = this.rand.getRandomNumbericField(record, idField);

      const expectedSum = ctx.records.reduce((sum, r) => sum + Number(r[numericField] || 0), 0);
      
      startId++;
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "easy",
        question: `How much is the sum of all values in ${numericField} across all products?`,
        expectedAnswer: {
          value: expectedSum,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [numericField],
      });
    }
    
    records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const isMin = i % 2;
      const record = records[i];
      const numericField = this.rand.getRandomNumbericField(record, idField);

      var numbers = ctx.records.map((r) => Number(r[numericField] || 0));
      const expected = isMin ? Math.min(...numbers) : Math.max(...numbers);
      
      startId++;
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "medium",
        question: `What is the ${isMin ? 'lowest' : 'highest'} value in ${numericField} across all products?`,
        expectedAnswer: {
          value: expected,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [numericField],
      });
    }
                
    records = this.rand.getRandomItems(ctx.records, remainingCount);
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const numericField = this.rand.getRandomNumbericField(record, idField);

      const expectedAvg = ctx.records.reduce((sum, r) => sum + Number(r[numericField] || 0), 0) / ctx.records.length;
      
      startId++;
      questions.push({
        id: startId,
        category: "aggregation",
        difficulty: "hard",
        question: `What is the average value in ${numericField} across all products?`,
        expectedAnswer: {
          value: Math.round(expectedAvg * 100) / 100,
          validationMethod: "numeric",
          tolerance: 0.01,
        },
        dataReferences: [numericField],
      });
    }

    return questions;
  }

  private generateFilteringQuestions(ctx: QuestionGeneratorContext, count: number, startId: number, idField: string): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];
    
    if(count < 0){
      return questions;
    }

    const splitCount = Math.ceil(count / 3); // equal, above/belowe avg, equal + above/belowe avg
    const remainingCount = count - splitCount * 2;
        
    const map = this.rand.getUniqueFieldsAndValues(ctx.records, splitCount);
    map.forEach((record, field) => {
      const value = record[field];
      const expectedCount = ctx.records.filter(x => x[field] === value).length;

      startId++;
      questions.push({
        id: startId,
        category: "filtering",
        difficulty: "easy",
        question: `How many products have '${value}' in ${field}?`,
        expectedAnswer: {
          value: expectedCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [field],
      });
    });
    
    let records = this.rand.getRandomItems(ctx.records, splitCount);
    for (let i = 0; i < records.length; i++) {
      const filterForAbove = i % 2 === 0;
      const record = records[i];
      const numericField = this.rand.getRandomNumbericField(record, idField);

      const avg = ctx.records.reduce((sum, r) => sum + Number(r[numericField] || 0), 0) / ctx.records.length;
      const expectedCount = ctx.records.filter((r) => {
        const num = Number(r[numericField] || 0);
        return filterForAbove ? num > avg : num < avg;
      }).length;
      
      startId++;
      questions.push({
        id: startId,
        category: "filtering",
        difficulty: "medium",
        question: `How many products have a value ${filterForAbove ? 'above' : 'belowe'} the average of ${avg} in ${numericField}?`,
        expectedAnswer: {
          value: expectedCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [numericField],
      });
    }
    
    records = this.rand.getRandomItems(ctx.records, remainingCount);
    for (let i = 0; i < records.length; i++) {
      const filterForAbove = i % 2 === 0;
      const record = records[i];
      const field = this.rand.getRandomField(record, idField);
      const value = record[field];
      const numericField = this.rand.getRandomNumbericField(record, field);

      const filtered = ctx.records.filter(x => x[field] === value);
      const avg = ctx.records.reduce((sum, r) => sum + Number(r[numericField] || 0), 0) / filtered.length;
      const expectedCount = filtered.filter((r) => {
        const num = Number(r[numericField] || 0);
        return filterForAbove ? num > avg : num < avg;
      }).length;

      startId++;
      questions.push({
        id: startId,
        category: "filtering",
        difficulty: "hard",
        question: `How many products have '${value}' in ${field} and a value ${filterForAbove ? 'above' : 'belowe'} the average of ${avg} in ${numericField}?`,
        expectedAnswer: {
          value: expectedCount,
          validationMethod: "numeric",
          tolerance: 0,
        },
        dataReferences: [field, numericField],
      });
    }

    return questions;
  }

  private generateStructureAwarenessQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];

    if(count < 0){
      return questions;
    }
    
    let remainingCount = count;
    
    const totalRows = ctx.records.length;
    let countOfSetValues = 0;
    const fieldHistogram = new Map<string, number>();
    ctx.records.forEach(r => {
      this.rand.getFields(r).forEach(f => {
        fieldHistogram.set(f, (fieldHistogram.get(f) || 0)+1);
        countOfSetValues++;
      });
    });
    
    let mandatoryFieldCount = 0;
    const fieldsPerOccurence = new Map<number, string[]>();
    fieldHistogram.forEach((value, key) => {
      var arr = (fieldsPerOccurence.get(value) || []);
      arr.push(key);      

      fieldsPerOccurence.set(value, arr);

      if(value > mandatoryFieldCount){
        mandatoryFieldCount = value;
      }
    });
    let totalUniqueFieldCount = fieldHistogram.size;

    const optionalFields= new Set<string>();
    const mandatoryFields= new Set<string>();
    fieldsPerOccurence.forEach((value, key) => {
      if(key < mandatoryFieldCount){
        value.forEach(v => optionalFields.add(v));
      }else{        
        value.forEach(v => mandatoryFields.add(v));
      }
    });
    
    if(remainingCount > 0){
      startId++;  
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `How many entries are in the data in total?`,
        expectedAnswer: {
          value: totalRows,
          validationMethod: "numeric",
        }
      });
    }
    
    if(remainingCount > 0){
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `How many values are in the data in total?`,
        expectedAnswer: {
          value: totalRows * totalUniqueFieldCount,
          validationMethod: "numeric",
        }
      });
    }
    
    if(remainingCount > 0){
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `How many values are set in the data in total?`,
        expectedAnswer: {
          value: countOfSetValues,
          validationMethod: "numeric",
        }
      });
    }

    if(remainingCount > 0){
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `How many values are not set in the data in total?`,
        expectedAnswer: {
          value: (totalRows * totalUniqueFieldCount) - countOfSetValues,
          validationMethod: "numeric",
        }
      });
    }
         
    if(remainingCount > 0){   
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `How many unique fields names are in the data in total?`,
        expectedAnswer: {
          value: totalUniqueFieldCount,
          validationMethod: "numeric",
        }
      });
    }

    if(remainingCount > 0){
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `What are all the unique field names across all products?`,
        expectedAnswer: {
          value: [...fieldHistogram.keys()],
          validationMethod: "array_set",
        }
      });
    }
    
    if(remainingCount > 0){
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `What are all the optional field names across all products?`,
        expectedAnswer: {
          value: [...optionalFields],
          validationMethod: "array_set",
        }
      });
    }
    
    if(remainingCount > 0){
      startId++;
      remainingCount--;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "medium",
        question: `What are all the mandatory field names across all products?`,
        expectedAnswer: {
          value: [...mandatoryFields],
          validationMethod: "array_set",
        }
      });
    }

    const map = this.rand.getUniqueFieldsAndValues(ctx.records, remainingCount);
    map.forEach((_, field) => {
      const expectedArray = Array.from(new Set(ctx.records.map((r) => String(r[field] || "")).filter(f => f !== "")));

      startId++;
      questions.push({
        id: startId,
        category: "structure_awareness",
        difficulty: "hard",
        question: `What are all the unique values in ${field} across all products?`,
        expectedAnswer: {
          value: expectedArray,
          validationMethod: "array_set",
        },
        dataReferences: [field]
      });
    });

    return questions;
  }

  private generateMultipleStepsQuestions(ctx: QuestionGeneratorContext, count: number, startId: number): AnswerAndQuestion[] {
    const questions: AnswerAndQuestion[] = [];

    const fields = this.rand.getRandomItems(["productName", "category", "supplierName", "supplierLocation", "description", "hazardous", "fragile"], count);
    fields.forEach((field, i) => {
      const filterForMost = i % 2 === 0;

      const valueHistogram = new Map<string, number>();
      ctx.records.forEach(r => {
        const value = String(r[field] || '');
        valueHistogram.set(value, (valueHistogram.get(value) || 0) + 1);
      });
      const firstValue = Array.from(valueHistogram.entries()).filter(x => x[0] !== '').reduce((a, b) =>{
          return filterForMost ? (b[1] > a[1] ? b : a) : (b[1] < a[1] ? a : b);
      })[0];

      const expected: string[] = [];
      expected.push(firstValue);
      expected.push(String(valueHistogram.get(firstValue) || ''));

      startId++;
      questions.push({
        id: startId,
        category: "multiple_steps",
        difficulty: "hard",
        question: `Which ${field} occures the ${filterForMost ? 'most' : 'least'} across all products and in how many products in total?`,
        expectedAnswer: {
          value: expected,
          validationMethod: "array_set"
        },
        dataReferences: [field]
      });
    });

    return questions;
  }
  
  private getValues<T>(record: T, fields: string[]): string[]{
    const values:string[] = [];
    fields.forEach(field => {
      const value = record[field];
      return values.push(value.toString());
    });
    return values;
  }
}

export function generateQuestionnaire(data: BaseDataSet): AnswerAndQuestion[] {
  const generator = new QuestionnaireGenerator();
  return generator.generate(data);
}
