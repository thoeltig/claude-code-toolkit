import { PartialSummaries, SummariesData } from '../types';
export declare function getOrCreateSummaries(knowledgeDir: string): SummariesData;
export declare function writeSummaries(knowledgeDir: string, data: SummariesData): void;
export declare function mergeSummaries(knowledgeDir: string, partialSummaries: PartialSummaries): SummariesData;
