import { Directory, Format } from "./types";

export const DIRECTORY_DATA:Directory = "data";
export const DIRECTORY_ANSWERS_VALIDATION:Directory  = "answers_validation";
export const DIRECTORY_QUESTIONS:Directory = "questions";
export const DIRECTORY_ANSWERS_TEMPLATE:Directory  = "answers_template";
export const DIRECTORY_SUBAGENT_OUTPUT:Directory  = "subagent_outputs";
export const DIRECTORY_RESULTS:Directory  = "results";
export const DIRECTORIES: Directory[] = [DIRECTORY_DATA, DIRECTORY_ANSWERS_VALIDATION, DIRECTORY_QUESTIONS, DIRECTORY_ANSWERS_TEMPLATE, DIRECTORY_SUBAGENT_OUTPUT, DIRECTORY_RESULTS];

export const FORMATS: Format[] = ["csv", "json_pretty", "json_compact", "toon", "xml", "yaml"];

export const FILE_METADATA:string = "metadata.json";
export const FILE_ANALYTICS_RESULT:string  = "analytics_results.json";
export const FILE_METRICS:string = "metrics.json";

export const QUESTIONS_COUNT = 120;
export const QUESTIONS_DISTRIBUTION = {
    field_retrieval: Math.ceil(QUESTIONS_COUNT * 0.41), 
    aggregation: Math.ceil(QUESTIONS_COUNT * 0.15), 
    filtering: Math.ceil(QUESTIONS_COUNT * 0.19),
    structure_awareness: Math.ceil(QUESTIONS_COUNT * 0.25)
};

export const QUESTIONS_WEIGHT_DISTRIBUTION = {
    field_retrieval: 0.35, 
    aggregation: 0.15, 
    filtering: 0.2,
    structure_awareness: 0.3
};