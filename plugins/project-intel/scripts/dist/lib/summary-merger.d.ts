export interface DirectorySummary {
    summary?: string;
    purpose?: string;
    technologies?: string[];
    lastUpdated?: string;
}
export interface FileSummary {
    summary?: string;
    purpose?: string;
    role?: string;
    technologies?: string[];
    exports?: string[];
    imports?: string[];
    lastUpdated?: string;
}
export interface SummariesData {
    generated: string;
    directories: {
        [dirPath: string]: DirectorySummary;
    };
    files: {
        [filePath: string]: FileSummary;
    };
}
export interface PartialSummaries {
    directories: PartialDirectorySummary[];
    files: PartialFileSummary[];
}
export interface PartialDirectorySummary extends DirectorySummary {
    path: string;
}
export interface PartialFileSummary extends FileSummary {
    path: string;
}
export declare function getOrCreateSummaries(knowledgeDir: string): SummariesData;
export declare function writeSummaries(knowledgeDir: string, data: SummariesData): void;
export declare function mergeSummaries(location: string, knowledgeDir: string, partialSummaries: PartialSummaries): SummariesData;
