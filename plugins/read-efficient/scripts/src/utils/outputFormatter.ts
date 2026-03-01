import { ProcessedFile, ReadMinifiedOptions } from '../types';

export function formatOutput(files: ProcessedFile[], options: ReadMinifiedOptions): string {
    if (options.noOutput) {
        return formatManifestOutput(files, options.maxOutput);
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

    if (file.minificationNote) {
        return JSON.stringify({ content: file.content, minification_note: file.minificationNote });
    }

    return JSON.stringify(file.content);
} 

function formatSingleFileWithCache(file: ProcessedFile): string {
    const wrapper: any = { content: file.content, cached: file.cached, cachedPath: file.cachedPath || null };
    if (file.error) {
        wrapper.error = file.error;
    }
    if (file.minificationNote) {
        wrapper.minification_note = file.minificationNote;
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

    // For raw output (no cache), wrap only if minificationNote is present
    if (file.minificationNote) {
        return JSON.stringify({ content: file.content, minification_note: file.minificationNote });
    }

    return JSON.stringify(file.content);
} 

function formatMultipleFileWithCache(file: ProcessedFile): string {
    const wrapper: any = { file: file.file, content: file.content, cached: file.cached, cachedPath: file.cachedPath || null };
    if (file.error) {
        wrapper.error = file.error;
    }
    if (file.minificationNote) {
        wrapper.minification_note = file.minificationNote;
    }

    return JSON.stringify(wrapper);
}       

function formatManifestOutput(files: ProcessedFile[], maxOutput: number | undefined): string {
    let newSize:number = 0;

    const manifest = {
        status: 'success_intended_caching',
        action: "Read the cached files",
        cached_files: files.map(f => {
            const item: any = { 
                original_filepath: f.file,
                cached_filepath: f.cachedPath || null
            };

            if (f.error) {
                item.error = f.error;
            } 

            newSize += f.newSize;
            return item;
        }),        
        cached_file_count: files.length,
    };

    if(maxOutput && newSize >= maxOutput) {
        manifest.status = 'warning_auto_caching_due_to_output_limit_exceeded';
        manifest.action = 'Read the cached files with native read tool. The output limit enforced by slash command or bash constraints triggered the automatic caching to avoid output truncation and information loss.';
    }
    
    return JSON.stringify(manifest);
}
