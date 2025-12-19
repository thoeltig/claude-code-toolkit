import { Directory, Format, QuestionCategory } from "./types";

export const DIRECTORY_DATA:Directory = "data";
export const DIRECTORY_ANSWERS_VALIDATION:Directory  = "answers_validation";
export const DIRECTORY_QUESTIONS:Directory = "questions";
export const DIRECTORY_ANSWERS_TEMPLATE:Directory  = "answers_template";
export const DIRECTORY_SUBAGENT_OUTPUT:Directory  = "subagent_outputs";
export const DIRECTORY_RESULTS:Directory  = "results";
export const DIRECTORIES: Directory[] = [DIRECTORY_DATA, DIRECTORY_ANSWERS_VALIDATION, DIRECTORY_QUESTIONS, DIRECTORY_ANSWERS_TEMPLATE, DIRECTORY_SUBAGENT_OUTPUT, DIRECTORY_RESULTS];

export const FORMATS: Format[] = ["csv", "json_pretty", "json_compact", "jsonl", "toon", "markdown", "yaml", "apache"];

export const FILE_METADATA:string = "metadata.json";
export const FILE_ANALYTICS_RESULT:string  = "analytics_results.json";
export const FILE_METRICS:string = "metrics.json";

export const QUESTIONS_COUNT = 120;
export const QUESTIONS_DISTRIBUTION = {
    field_retrieval: Math.ceil(QUESTIONS_COUNT * 0.35), 
    aggregation: Math.ceil(QUESTIONS_COUNT * 0.275), 
    filtering: Math.ceil(QUESTIONS_COUNT * 0.2),
    structure_awareness: Math.ceil(QUESTIONS_COUNT * 0.125), 
    multiple_steps: Math.ceil(QUESTIONS_COUNT * 0.05)
};

export const QUESTIONS_WEIGHT_DISTRIBUTION = {
    field_retrieval: 0.35, 
    aggregation: 0.2, 
    filtering: 0.2,
    structure_awareness: 0.25, 
    multiple_steps: 0
};