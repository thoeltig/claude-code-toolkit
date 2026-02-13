import { ReadMinifiedOptions, ProcessedFile } from './types';
import { minifyWhitespace } from './minifier';
import { readFile } from './utils/fileHandler';
import { writeCache } from './cache';
import { detectFormat } from './utils/formatDetector';
import { formatOutput } from './utils/outputFormatter';
import { formatCsv } from './formats/csv';
import { formatYaml } from './formats/yaml';
import { formatIni } from './formats/ini';
import { formatMarkdown } from './formats/markdown';
import { formatXml } from './formats/xml';
import { formatHtml } from './formats/html';
import { formatLogs } from './formats/logs';
import { formatSql } from './formats/sql';

export function parseArguments(args: string[]): {
    paths: string[];
    options: ReadMinifiedOptions
} {
    const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: false };
    const paths: string[] = [];
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const flag = arg.slice(2);

            if (flag === 'no-minify') options.minify = false;
            else if (flag === 'no-to-json') options.toJson = false;
            else if (flag === 'cache') options.cache = true;
            else if (flag === 'overwrite') options.overwrite = true;
            else if (flag === 'no-output') options.noOutput = true;
            else if (flag === 'no-anchor-lines') options.noAnchorLines = true;
            else if (flag.startsWith('max-output=')) {
                const value = parseInt(flag.split('=')[1], 10);
                if (!isNaN(value)) options.maxOutput = value;
            }
        } else {
            paths.push(arg);
        }
    }

    return { paths, options };
}

export async function processFile(filePath: string, options: ReadMinifiedOptions, currentOutputSize: number): Promise<ProcessedFile> {
    try {
        let content = await readFile(filePath);
        const format = detectFormat(filePath);

        // Format-safe minification: warn if minifying format-dependent formats without JSON conversion
        const structureDependentFormats = ['yaml', 'ini'];
        let minificationNote: string | undefined;
        if (options.minify && !options.toJson && structureDependentFormats.includes(format)) {
            minificationNote = `${format.toUpperCase()} minified without --to-json (structure-aware conversion skipped)`;
        }

        const minifiedContent = options.minify ? minifyWhitespace(content) : content;
        let processedContent: any;
        let cacheContent: string;
        try {
            if (format === 'json') {
                processedContent = JSON.parse(minifiedContent);
                cacheContent = minifiedContent;
            } else if (format === 'ndjson') {
                // NDJSON is already JSON - only minify, don't use format handler
                processedContent = minifiedContent;
                cacheContent = minifiedContent;
            } else if (format === 'csv' && options.toJson) {
                const csvJson = formatCsv(minifiedContent, { minify: true });
                processedContent = JSON.parse(csvJson);
                cacheContent = csvJson;
            } else if (format === 'yaml' && options.toJson) {
                const yamlJson = formatYaml(minifiedContent, { minify: true });
                processedContent = JSON.parse(yamlJson);
                cacheContent = yamlJson;
            } else if (format === 'ini' && options.toJson) {
                const iniJson = formatIni(minifiedContent, { minify: true });
                processedContent = JSON.parse(iniJson);
                cacheContent = iniJson;
            } else if (format === 'markdown' && options.toJson) {
                let markdownJson = formatMarkdown(minifiedContent, { minify: true });
                // Remove anchor_line if requested
                if (options.noAnchorLines) {
                    const parsed = JSON.parse(markdownJson);
                    removeAnchorLines(parsed);
                    markdownJson = JSON.stringify(parsed);
                }
                processedContent = JSON.parse(markdownJson);
                cacheContent = markdownJson;
            } else if (format === 'xml' && options.toJson) {
                const xmlJson = formatXml(minifiedContent, { minify: true });
                processedContent = JSON.parse(xmlJson);
                cacheContent = xmlJson;
            } else if (format === 'html' && options.toJson) {
                const htmlJson = formatHtml(minifiedContent, { minify: true });
                processedContent = JSON.parse(htmlJson);
                cacheContent = htmlJson;
            } else if (format === 'log' && options.toJson) {
                const logJson = formatLogs(minifiedContent, { minify: true });
                processedContent = JSON.parse(logJson);
                cacheContent = logJson;
            } else if (format === 'sql' && options.toJson) {
                const sqlJson = formatSql(minifiedContent, { minify: true });
                processedContent = JSON.parse(sqlJson);
                cacheContent = sqlJson;
            } else {
                processedContent = minifiedContent;
                cacheContent = minifiedContent;
            }
        } catch (parseErr) {
            processedContent = minifiedContent;
            cacheContent = minifiedContent;
        }

        // Add file info node when --to-json is used for converted formats (not JSON/plaintext)
        let finalContent = processedContent;
        const convertedFormats = ['csv', 'yaml', 'ini', 'markdown', 'xml', 'html', 'log', 'sql'];
        if (options.toJson && convertedFormats.includes(format) && typeof processedContent === 'object' && processedContent !== null) {
            finalContent = {
                fileInfo: {
                    originalPath: filePath,
                    format: format,
                    originalSize: content.length,
                    minifiedSize: cacheContent.length
                },
                content: processedContent
            };
            cacheContent = JSON.stringify(finalContent);
        }

        const result: ProcessedFile = {
            file: filePath,
            originalSize: content.length,
            newSize: cacheContent.length,
            content: finalContent,
            cached: false,
        };

        if (minificationNote) {
            result.minificationNote = minificationNote;
        }

        // If output limit is provided and exceeded switch automatically to caching
        if(options.maxOutput && (currentOutputSize + result.newSize >= options.maxOutput)){
            options.cache = true;
            options.noOutput = true;
        }

        if (options.cache) {
            const cacheResult = await writeCache(filePath, cacheContent, options.overwrite);
            if (cacheResult.success) {
                result.cached = true;
                result.cachedPath = cacheResult.path;
            }
        }

        return result;
    } catch (err) {
        return { file: filePath, error: `${err}`, cached: false, originalSize: 0, newSize: 0 };
    }
}

// Helper function to remove anchor_line from all objects recursively
function removeAnchorLines(obj: any): void {
    if (Array.isArray(obj)) {
        obj.forEach(item => removeAnchorLines(item));
    } else if (typeof obj === 'object' && obj !== null) {
        delete obj.anchor_line;
        Object.values(obj).forEach(val => removeAnchorLines(val));
    }
}

export async function processFiles(filePaths: string[], options: ReadMinifiedOptions): Promise<ProcessedFile[]> {
    let currentOutputSize: number = 0;
    const results: ProcessedFile[] = [];
    for (const filePath of filePaths) {
        const result = await processFile(filePath, options, currentOutputSize);
        results.push(result);
    } 

    return results;
}

export async function main(args: string[]): Promise<void> {
    const { paths, options } = parseArguments(args);
    if (paths.length === 0) {
        console.error('Error: No file paths provided');
        process.exit(1);
    } 
    
    const results = await processFiles(paths, options);

    // Mixed result is only possible if output limit was exceeded and automatical caching was necessary
    if(options.cache){
        var uncachedResults = results.filter(x => x.cached === false);
        uncachedResults.forEach(async x =>{
            const cacheResult = await writeCache(x.file, x.content, options.overwrite);
            if (cacheResult.success) {
                x.cached = true;
                x.cachedPath = cacheResult.path;
            }
        });
    }

    const output = formatOutput(results, options);
    console.log(output);
} 

if (require.main === module) {
    main(process.argv.slice(2)).catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}