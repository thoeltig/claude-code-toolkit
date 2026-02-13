export interface ReadMinifiedOptions {
    minify: boolean;
    toJson: boolean;
    cache: boolean;
    overwrite: boolean;
    noOutput: boolean;
    maxOutput?: number;
    noAnchorLines?: boolean;
}

export interface FileInfo {
    original_path: string;
    format: string;
    original_size: number;
    minified_size: number;
}

export interface ProcessedFile {
    file: string;
    originalSize: number;
    newSize: number;
    content?: any;
    error?: string;
    cached: boolean;
    cachedPath?: string;
    minificationNote?: string;
}

export interface MinifyOptions {
    trimLines: boolean;
    collapseEmpty: boolean;
}

export interface CacheResult {
    success: boolean;
    path?: string;
    message?: string;
}

export interface ErrorContext {
    operation: string;
    file: string;
    message: string;
    original?: Error;
}