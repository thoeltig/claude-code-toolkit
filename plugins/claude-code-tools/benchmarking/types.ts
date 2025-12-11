/**
 * Core type definitions for benchmarking framework
 * Strong types, no `any` usage
 */

// ============================================================================
// DATA TYPES
// ============================================================================

export type DataDensity = 100 | 50;
export type Format = "csv" | "json" | "markdown" | "yaml" | "apache";
export type QuestionCategory = "field_retrieval" | "aggregation" | "filtering" | "structure_awareness" | "deduction";

export interface BaseDataMetadata {
  characterCount: number;
  density: DataDensity;
  fieldCount: number;
  recordCount: number;
  generatedAt: string;
  description: string;
}

export interface DataRecord {
  [key: string]: string | number | boolean | null | undefined;
}

export interface BaseDataSet {
  metadata: BaseDataMetadata;
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

export type AnswerValidationMethod = "exact" | "numeric" | "array_set" | "fuzzy_deduction" | "manual";

export interface QuestionExpectedAnswer {
  value: string | number | string[] | boolean;
  validationMethod: AnswerValidationMethod;
  tolerance?: number; // For numeric answers
  keywords?: string[]; // For fuzzy deduction
}

export interface Question {
  id: number;
  category: QuestionCategory;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  expectedAnswer: QuestionExpectedAnswer;
  context?: string;
  dataReferences?: string[]; // Which data fields this question uses
  requiresManualReview?: boolean; // True for deduction questions
}

export interface Questionnaire {
  metadata: {
    format: Format;
    density: DataDensity;
    totalQuestions: number;
    generatedAt: string;
    dataFile: string;
  };
  questions: Question[];
}

export interface ProvidedAnswer {
  questionId: number;
  answer: string | number | string[] | boolean;
  confidence?: "high" | "medium" | "low";
}

export interface AnswerTemplate {
  metadata: {
    format: Format;
    density: DataDensity;
    dataFile: string;
    questionnaireFile: string;
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
  confidence?: number; // 0-1, for fuzzy matches
  requiresManualReview: boolean; // True for deduction questions
}

export interface ValidationReport {
  format: Format;
  density: DataDensity;
  scenario: "original" | "minified" | "minified_json";
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
  density: DataDensity;
  scenario: TestScenario;
  timestamp: string;
  tokens: TokenCount;
  validation: ValidationReport;
}

export interface TestRun {
  metadata: {
    generatedAt: string;
    formats: Format[];
    densities: DataDensity[];
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
    [key in DataDensity]: DensitySummary;
  };
}

export interface DensitySummary {
  density: DataDensity;
  scenarios: {
    [key: string]: ScenarioSummary;
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

export interface GeneratorOptions {
  targetCharCount: number; // ~60,000 chars
  densities: DataDensity[]; // [100, 50]
  formats: Format[];
  questionsPerDensity: number; // 15-20
}

export interface GenerationResult {
  format: Format;
  density: DataDensity;
  dataFile: string;
  questionnaireFile: string;
  metadata: BaseDataMetadata;
  questionCount: number;
}
