export interface ReadMinifiedOptions {
    minify: boolean;
    toJson: boolean;
    cache: boolean;
    overwrite: boolean;
    noOutput: boolean;
}

export interface ProcessedFile {
    file: string;
    content?: any;
    error?: string;
    cached: boolean;
    cachedPath?: string;
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