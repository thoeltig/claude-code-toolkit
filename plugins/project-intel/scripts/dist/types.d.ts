export declare const KNOWLEDGE_DIRECTORY: string;
export declare const SUMMARIES_FILE: string;
export declare const SCAN_FILE: string;
export declare const FORMAT_FLAT: string;
export declare const FORMAT_GROUPED: string;
export declare const QUERY_RESULT_MAX: number;
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
export interface SummariesDataStorage {
    generated: string;
    directories: {
        [dirPath: string]: DirectorySummary;
    };
    files: {
        [filePath: string]: FileSummary;
    };
}
export interface SummariesData {
    generated: string;
    directories: Map<string, DirectorySummary>;
    files: Map<string, FileSummary>;
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
export interface HierarchicalGrouping {
    folderPath: string;
    folderScore: number;
    summary?: string;
    purpose?: string;
    technologies?: string[];
    files: GroupedScoredFileSummary[];
}
export interface ScoredFileSummary extends FileSummary {
    path: string;
    fileScore: number;
}
export interface GroupedScoredFileSummary extends FileSummary {
    fileName: string;
    path?: string;
    fileScore: number;
}
export interface AdditionalContext {
    severity: string;
    assistant_action: string;
    assistant_instruction: string;
    user_message: string;
    filesNeedingUpdate?: number;
}
export interface HookResponse {
    continue: boolean;
    suppressOutput: boolean;
    systemMessage: string;
    hookSpecificOutput: {
        hookEventName: string;
        additionalContext: string;
    };
}
