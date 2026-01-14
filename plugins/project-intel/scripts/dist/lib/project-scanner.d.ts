interface FileInfo {
    path: string;
    size: number;
}
interface RawProjectData {
    files: FileInfo[];
    projectStats: {
        totalFiles: number;
        extensionCount: Record<string, number>;
    };
}
export declare function scanProject(location: string): Promise<RawProjectData>;
export {};
