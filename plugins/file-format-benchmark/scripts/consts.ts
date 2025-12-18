import { Directory, Format } from "./types";

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