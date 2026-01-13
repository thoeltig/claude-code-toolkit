export interface DirectorySummary {
    summary: string;
    purpose?: string;
    technologies?: string[];
    fileCount: number;
    subdirCount: number;
    lastUpdated: string;
}
export interface FileSummary {
    summary: string;
    purpose?: string;
    role?: string;
    exports?: string[];
    imports?: string[];
    lastUpdated: string;
}
interface SummariesData {
    generated: string;
    directories: {
        [dirPath: string]: DirectorySummary;
    };
    files: {
        [filePath: string]: FileSummary;
    };
}
export interface PartialSummaries {
    directories?: {
        [dirPath: string]: DirectorySummary;
    };
    files?: {
        [filePath: string]: FileSummary;
    };
}
export declare function mergeSummaries(scanDir: string, knowledgeDir: string, partialSummaries: PartialSummaries): SummariesData;
export declare function getSummaries(knowledgeDir: string): SummariesData;
export {};
