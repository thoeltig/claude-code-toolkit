interface RawProjectData {
    filePaths: string[];
    projectStats: {
        totalFiles: number;
        extensionCount: Record<string, number>;
    };
}
export declare function scanProject(location: string, knowledgeDir: string): Promise<RawProjectData>;
export {};
