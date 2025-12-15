/**
 * Core type definitions for benchmarking framework
 * Strong types, no `any` usage
 */

// ============================================================================
// DATA TYPES
// ============================================================================

export type Format = "csv" | "json_pretty" | "json_compact" | "jsonl" | "toon" | "markdown" | "yaml" | "apache";
export type QuestionCategory = "field_retrieval" | "aggregation" | "filtering" | "structure_awareness" | "multiple_steps";

export interface Metadata extends ValuesMetadata {
  generatedAt: string,
  description: string,
}

export interface ValuesMetadata {
  fieldCount: number,
  recordCount: number,
  totalValues: number,
}

export interface CharacterMetadata {
  characterCount: number,
  avgCharacterCountPerValue: number,
  avgCharacterCountPerRecord: number,
}

export interface ProductRecord extends DataRecord {
  productId: string;
  productName: string;
  category: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  reorderPoint: number;
  lastRestocked: string;
  supplierName: string;
  supplierLocation: string;
  description: string;
  sku: string;
  manufacturerCode: string;
  warehouseLocation: string;
  weight: number;
  dimensions: string;
  hazardous: boolean;
  fragile: boolean;
  unitsShipped: number;
  avgRating?:number;
  shelfLife?:number;
  discontinuedDate?:string;
}

export interface DataRecord {
  [key: string]: string | number | boolean | null | undefined;
}

export interface BaseDataSet {
  metadata: Metadata;
  records: DataRecord[];
}

// CSV-specific structure
export interface CsvData extends BaseDataSet {
  headers: string[];
}

// JSON-specific structure
export interface JsonData extends BaseDataSet {
  structure: Record<string, unknown>;
}

// Markdown-specific structure
export interface MarkdownData extends BaseDataSet {
  sections: MarkdownSection[];
}

export interface MarkdownSection {
  title: string;
  content: string;
  level: number;
}

// YAML-specific structure
export interface YamlData extends BaseDataSet {
  structure: Record<string, unknown>;
}

// Apache log-specific structure
export interface ApacheLogEntry {
  ip: string;
  timestamp: string;
  method: string;
  path: string;
  protocol: string;
  status: number;
  bytes: number;
  referer: string;
  userAgent: string;
}

export interface ApacheLogData extends BaseDataSet {
  logs: ApacheLogEntry[];
}

export type ConcreteDataSet = CsvData | JsonData | MarkdownData | YamlData | ApacheLogData;

// ============================================================================
// QUESTION & ANSWER TYPES
// ============================================================================

export type AnswerValidationMethod = "exact" | "numeric" | "array_set";

export interface QuestionExpectedAnswer {
  value: string | number | string[] | boolean;
  validationMethod: AnswerValidationMethod;
  tolerance?: number; // For numeric answers
  keywords?: string[]; // For fuzzy deduction
}

export interface Question {
  id: number;
  question: string;
}

export interface AnswerAndQuestion extends Question {
  category: QuestionCategory;
  difficulty: "easy" | "medium" | "hard";
  expectedAnswer: QuestionExpectedAnswer;
  dataReferences?: string[]; // Which data fields this question uses
  requiresManualReview?: boolean; // True for deduction questions
}

export interface BaseQuestionnaire {
  metadata: {
    recordCount: number,
    fieldCount: number,
    totalValues: number,
    totalQuestions: number;
    generatedAt: string;
    questionFilePath: string;
    answerTemplateFilePath: string;
  };
}

export interface QuestionnaireWithAnswers extends BaseQuestionnaire {
  answersAndQuestions: AnswerAndQuestion[];
}

export interface Questionnaire extends BaseQuestionnaire {
  questions: Question[];
}

export interface ProvidedAnswer {
  questionId: number;
  answer: string | number | string[] | boolean;
}

export interface AnswerTemplate {
  metadata: {
    format: string,
    questionsFilePath: string;
    dataFilePath: string;
  };
  answers: ProvidedAnswer[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  questionId: number;
  question: string;
  givenAnswer: string | number | string[] | boolean;
  expectedAnswer: string | number | string[] | boolean;
  correct: boolean;
  category: QuestionCategory;
  method: AnswerValidationMethod;
}

export interface ValidationReport {
  format: Format;
  totalQuestions: number;
  results: ValidationResult[];
  accuracy: {
    correct: number;
    incorrect: number;
    requiresReview: number;
    accuracyPercent: number;
  };
  manualReviewRequired: ValidationResult[];
}

// ============================================================================
// TEST EXECUTION TYPES
// ============================================================================

export interface TokenCount {
  beforeReading: number;
  afterReading: number;
  afterAnswering: number;
  tokensUsedForReading: number;
  tokensUsedForAnswering: number;
  totalTokensUsed: number;
}

export interface TestScenario {
  scenario: "original" | "minified" | "minified_json";
  description: string;
  filePath: string;
  questionnaireFile: string;
  answerTemplateFile: string;
}

export interface TestExecution {
  format: Format;
  scenario: TestScenario;
  timestamp: string;
  tokens: TokenCount;
  validation: ValidationReport;
}

export interface TestRun {
  metadata: {
    generatedAt: string;
    formats: Format[];
    totalTests: number;
  };
  executions: TestExecution[];
  summary: TestSummary;
}

// ============================================================================
// SUMMARY & RESULTS TYPES
// ============================================================================

export interface FormatSummary {
  format: Format;
  densities: {
    [key in string]: ScenarioSummary;
  };
}

export interface ScenarioSummary {
  scenario: "original" | "minified" | "minified_json";
  accuracy: number; // 0-100
  tokenUsed: number;
  charCount: number;
  tokensPerChar: number;
  avgResponseTimeMs?: number;
}

export interface TestSummary {
  totalTests: number;
  completedTests: number;
  manualReviewsNeeded: number;
  formatPerformance: FormatSummary[];
  recommendations: string[];
}

// ============================================================================
// GENERATOR CONFIGURATION
// ============================================================================

export interface GeneratorResult {
  generatedAt: string;
  filesPerRecordCount: GeneratedFiles[];
}

export interface GeneratedFiles{
  recordCount: number;
  fieldCount: number,
  totalValues: number,
  questionCount: number;
  answersAndQuestionsForValidationFilePath: string;
  questionnaireFilePath: string;
  answerTemplateFilePath: string;
  dataAndOutput: DataAndOutput[];
}

export interface DataAndOutput{
  format: Format;
  allFieldsManadatory: boolean;
  dataFilePath: string;
  metadata: CharacterMetadata;
  expectedOutputFilePath: string;
}