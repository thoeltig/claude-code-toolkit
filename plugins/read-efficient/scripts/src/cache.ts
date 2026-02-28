import { extname, dirname, basename } from 'path';
import { fileExists, writeFile } from './utils/fileHandler';
import { ProcessedFile, CacheResult } from './types';

export function getCachePath(originalPath: string): string {
    const ext = extname(originalPath);
    const name = basename(originalPath, ext);
    const dir = dirname(originalPath);
    return ext ? `${dir}/${name}.compact${ext}` : `${dir}/${name}.compact`;
}

export function checkCacheExists(cachedPath: string): boolean {
    return fileExists(cachedPath);
}

export function resolveCachePath(originalPath: string, overwrite: boolean): string {
    const cachePath = getCachePath(originalPath);
    if (overwrite || !checkCacheExists(cachePath)) {
        return cachePath;
    }
    
    const ext = extname(cachePath);
    const nameWithoutExt = cachePath.slice(0, -ext.length);
    let counter = 1;
    while (checkCacheExists(`${nameWithoutExt}(${counter})${ext}`)) {
        counter++;
    } 

    return `${nameWithoutExt}(${counter})${ext}`;
}

export async function writeCache(originalPath: string, content: string, overwrite: boolean): Promise<CacheResult> {
    try {
        const cachePath = resolveCachePath(originalPath, overwrite);
        await writeFile(cachePath, content);
        return { success: true, path: cachePath };
    } catch (err) {
        return { success: false, message: `Failed to write cache: ${err}` };
    }
}

export function generateManifest(files: ProcessedFile[]): any {
    return { processed: files.map(f => ({ file: f.file, cached: f.cached, path: f.cachedPath })), total: files.length };
}