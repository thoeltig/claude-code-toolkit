export interface ScanResult {
    filesToScan: string[];
    projectStats: {
        knowledgeDir: string;
        totalFilesInKnowledge: number;
        numberOfFilesToScan: number;
        extensionCountsOfFilesToScan: Record<string, number>;
    };
}
export declare function findKnowledgeDir(location: string): string | undefined;
export declare function scanProject(location: string, knowledgeDir: string): Promise<ScanResult>;
