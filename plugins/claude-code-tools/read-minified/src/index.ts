import { ReadMinifiedOptions, ProcessedFile } from './types';
import { minifyWhitespace } from './minifier';
import { readFile } from './utils/fileHandler';
import { writeCache } from './cache';
import { detectFormat } from './utils/formatDetector';
import { formatOutput } from './utils/outputFormatter';
import { formatCsv } from './formats/csv';
import { formatYaml } from './formats/yaml';
import { formatIni } from './formats/ini';
import { formatNdjson } from './formats/ndjson';
import { formatMarkdown } from './formats/markdown';
import { formatXml } from './formats/xml';
import { formatHtml } from './formats/html';

export function parseArguments(args: string[]): {
    paths: string[];
    options: ReadMinifiedOptions
} {
    const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
    const paths: string[] = [];
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const flag = arg.slice(2);

            if (flag === 'no-minify') options.minify = false;
            else if (flag === 'no-to-json') options.toJson = false;
            else if (flag === 'cache') options.cache = true;
            else if (flag === 'overwrite') options.overwrite = true;
            else if (flag === 'no-output') options.noOutput = true;
        } else {
            paths.push(arg);
        }
    } 
    
    return { paths, options };
}

export async function processFile(filePath: string, options: ReadMinifiedOptions): Promise<ProcessedFile> {
    try {
        let content = await readFile(filePath);
        const minifiedContent = options.minify ? minifyWhitespace(content) : content;
        const format = detectFormat(filePath);
        let processedContent: any;
        let cacheContent: string;
        try {
            if (format === 'json') {
                processedContent = JSON.parse(minifiedContent);
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
            } else if (format === 'ndjson' && options.toJson) {
                const ndjsonJson = formatNdjson(minifiedContent, { minify: true });
                processedContent = JSON.parse(ndjsonJson);
                cacheContent = ndjsonJson;
            } else if (format === 'markdown' && options.toJson) {
                const markdownJson = formatMarkdown(minifiedContent, { minify: true });
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
            } else {
                processedContent = minifiedContent;
                cacheContent = minifiedContent;
            }
        } catch (parseErr) {
            processedContent = minifiedContent;
            cacheContent = minifiedContent;
        } 
        
        const result: ProcessedFile = { file: filePath, content: processedContent, cached: false };
        if (options.cache) {
            const cacheResult = await writeCache(filePath, cacheContent, options.overwrite);
            if (cacheResult.success) {
                result.cached = true;
                result.cachedPath = cacheResult.path;
            }
        } 

        return result;
    } catch (err) {
        return { file: filePath, error: `${err}`, cached: false };
    }
}

export async function processFiles(filePaths: string[], options: ReadMinifiedOptions): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];
    for (const filePath of filePaths) {
        const result = await processFile(filePath, options);
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
    const output = formatOutput(results, options);
    console.log(output);
} 

if (require.main === module) {
    main(process.argv.slice(2)).catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}