import { ProcessedFile, ReadMinifiedOptions } from '../types';

export function formatOutput(files: ProcessedFile[], options: ReadMinifiedOptions): string {
    if (options.noOutput) {
        return formatManifestOutput(files);
    } if (files.length === 1) {
        return formatSingleFileOutput(files[0], options);
    } 

    return formatMultipleFilesOutput(files, options);
} 

function formatSingleFileOutput(file: ProcessedFile, options: ReadMinifiedOptions): string {
    if (options.cache) {
        return formatSingleFileWithCache(file);
    } 

    return formatRawSingleFileOutput(file);
} 

function formatRawSingleFileOutput(file: ProcessedFile): string {
    if (file.error) {
        return JSON.stringify({ error: file.error, file: file.file });
    } 

    return JSON.stringify(file.content);
} 

function formatSingleFileWithCache(file: ProcessedFile): string {
    const wrapper: any = { content: file.content, cached: file.cached, cachedPath: file.cachedPath || null };
    if (file.error) {
        wrapper.error = file.error;
    } 

    return JSON.stringify(wrapper);
} 

function formatMultipleFilesOutput(files: ProcessedFile[], options: ReadMinifiedOptions): string {
    return files.map(file => {
        if (options.cache) {
            return formatMultipleFileWithCache(file);
        } 

        return formatRawMultipleFileOutput(file);
    }).join('\n');
} 

function formatRawMultipleFileOutput(file: ProcessedFile): string {
    if (file.error) {
        return JSON.stringify({ file: file.file, error: file.error });
    } 

    return JSON.stringify(file.content);
} 

function formatMultipleFileWithCache(file: ProcessedFile): string {
    const wrapper: any = { file: file.file, content: file.content, cached: file.cached, cachedPath: file.cachedPath || null };
    if (file.error) {
        wrapper.error = file.error;
    } 

    return JSON.stringify(wrapper);
}       

function formatManifestOutput(files: ProcessedFile[]): string {
    const manifest = {
        processed: files.map(f => {
            const item: any = { file: f.file, cached: f.cached, path: f.cachedPath || null };
            if (f.error) {
                item.error = f.error;
            } 

        return item;
        }), total: files.length
    };
    
    return JSON.stringify(manifest);
}
