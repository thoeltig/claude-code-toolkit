"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArguments = parseArguments;
exports.processFile = processFile;
exports.processFiles = processFiles;
exports.main = main;
const minifier_1 = require("./minifier");
const fileHandler_1 = require("./utils/fileHandler");
const cache_1 = require("./cache");
const formatDetector_1 = require("./utils/formatDetector");
const outputFormatter_1 = require("./utils/outputFormatter");
const csv_1 = require("./formats/csv");
const yaml_1 = require("./formats/yaml");
const ini_1 = require("./formats/ini");
const markdown_1 = require("./formats/markdown");
const xml_1 = require("./formats/xml");
const html_1 = require("./formats/html");
const logs_1 = require("./formats/logs");
const sql_1 = require("./formats/sql");
function parseArguments(args) {
    const options = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: false };
    const paths = [];
    for (const arg of args) {
        if (arg.startsWith('--')) {
            const flag = arg.slice(2);
            if (flag === 'no-minify')
                options.minify = false;
            else if (flag === 'no-to-json')
                options.toJson = false;
            else if (flag === 'cache')
                options.cache = true;
            else if (flag === 'overwrite')
                options.overwrite = true;
            else if (flag === 'no-output')
                options.noOutput = true;
            else if (flag === 'no-anchor-lines')
                options.noAnchorLines = true;
            else if (flag.startsWith('max-output=')) {
                const value = parseInt(flag.split('=')[1], 10);
                if (!isNaN(value))
                    options.maxOutput = value;
            }
        }
        else {
            paths.push(arg);
        }
    }
    return { paths, options };
}
async function processFile(filePath, options, currentOutputSize) {
    try {
        let content = await (0, fileHandler_1.readFile)(filePath);
        const format = (0, formatDetector_1.detectFormat)(filePath);
        // Format-safe minification: warn if minifying format-dependent formats without JSON conversion
        const structureDependentFormats = ['yaml', 'ini'];
        let minificationNote;
        if (options.minify && !options.toJson && structureDependentFormats.includes(format)) {
            minificationNote = `${format.toUpperCase()} minified without --to-json (structure-aware conversion skipped)`;
        }
        const minifiedContent = options.minify ? (0, minifier_1.minifyWhitespace)(content) : content;
        let processedContent;
        let cacheContent;
        try {
            if (format === 'json') {
                processedContent = JSON.parse(minifiedContent);
                cacheContent = minifiedContent;
            }
            else if (format === 'ndjson') {
                // NDJSON is already JSON - only minify, don't use format handler
                processedContent = minifiedContent;
                cacheContent = minifiedContent;
            }
            else if (format === 'csv' && options.toJson) {
                const csvJson = (0, csv_1.formatCsv)(minifiedContent, { minify: true });
                processedContent = JSON.parse(csvJson);
                cacheContent = csvJson;
            }
            else if (format === 'yaml' && options.toJson) {
                const yamlJson = (0, yaml_1.formatYaml)(minifiedContent, { minify: true });
                processedContent = JSON.parse(yamlJson);
                cacheContent = yamlJson;
            }
            else if (format === 'ini' && options.toJson) {
                const iniJson = (0, ini_1.formatIni)(minifiedContent, { minify: true });
                processedContent = JSON.parse(iniJson);
                cacheContent = iniJson;
            }
            else if (format === 'markdown' && options.toJson) {
                let markdownJson = (0, markdown_1.formatMarkdown)(minifiedContent, { minify: true });
                // Remove anchor_line if requested
                if (options.noAnchorLines) {
                    const parsed = JSON.parse(markdownJson);
                    removeAnchorLines(parsed);
                    markdownJson = JSON.stringify(parsed);
                }
                processedContent = JSON.parse(markdownJson);
                cacheContent = markdownJson;
            }
            else if (format === 'xml' && options.toJson) {
                const xmlJson = (0, xml_1.formatXml)(minifiedContent, { minify: true });
                processedContent = JSON.parse(xmlJson);
                cacheContent = xmlJson;
            }
            else if (format === 'html' && options.toJson) {
                const htmlJson = (0, html_1.formatHtml)(minifiedContent, { minify: true });
                processedContent = JSON.parse(htmlJson);
                cacheContent = htmlJson;
            }
            else if (format === 'log' && options.toJson) {
                const logJson = (0, logs_1.formatLogs)(minifiedContent, { minify: true });
                processedContent = JSON.parse(logJson);
                cacheContent = logJson;
            }
            else if (format === 'sql' && options.toJson) {
                const sqlJson = (0, sql_1.formatSql)(minifiedContent, { minify: true });
                processedContent = JSON.parse(sqlJson);
                cacheContent = sqlJson;
            }
            else {
                processedContent = minifiedContent;
                cacheContent = minifiedContent;
            }
        }
        catch (parseErr) {
            processedContent = minifiedContent;
            cacheContent = minifiedContent;
        }
        // Add file info node when --to-json is used for converted formats (not JSON/plaintext)
        let finalContent = processedContent;
        const convertedFormats = ['csv', 'yaml', 'ini', 'markdown', 'xml', 'html', 'log', 'sql'];
        if (options.toJson && convertedFormats.includes(format) && typeof processedContent === 'object' && processedContent !== null) {
            finalContent = {
                file_info: {
                    original_path: filePath,
                    format: format,
                    original_size: content.length,
                    minified_size: cacheContent.length
                },
                content: processedContent
            };
            cacheContent = JSON.stringify(finalContent);
        }
        const result = {
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
        if (options.maxOutput && (currentOutputSize + result.newSize >= options.maxOutput)) {
            options.cache = true;
            options.noOutput = true;
        }
        if (options.cache) {
            const cacheResult = await (0, cache_1.writeCache)(filePath, cacheContent, options.overwrite);
            if (cacheResult.success) {
                result.cached = true;
                result.cachedPath = cacheResult.path;
            }
        }
        return result;
    }
    catch (err) {
        return { file: filePath, error: `${err}`, cached: false, originalSize: 0, newSize: 0 };
    }
}
// Helper function to remove anchor_line from all objects recursively
function removeAnchorLines(obj) {
    if (Array.isArray(obj)) {
        obj.forEach(item => removeAnchorLines(item));
    }
    else if (typeof obj === 'object' && obj !== null) {
        delete obj.anchor_line;
        Object.values(obj).forEach(val => removeAnchorLines(val));
    }
}
async function processFiles(filePaths, options) {
    let currentOutputSize = 0;
    const results = [];
    for (const filePath of filePaths) {
        const result = await processFile(filePath, options, currentOutputSize);
        results.push(result);
    }
    return results;
}
async function main(args) {
    const { paths, options } = parseArguments(args);
    if (paths.length === 0) {
        console.error('Error: No file paths provided');
        process.exit(1);
    }
    const results = await processFiles(paths, options);
    // Mixed result is only possible if output limit was exceeded and automatical caching was necessary
    if (options.cache) {
        var uncachedResults = results.filter(x => x.cached === false);
        uncachedResults.forEach(async (x) => {
            const cacheResult = await (0, cache_1.writeCache)(x.file, x.content, options.overwrite);
            if (cacheResult.success) {
                x.cached = true;
                x.cachedPath = cacheResult.path;
            }
        });
    }
    const output = (0, outputFormatter_1.formatOutput)(results, options);
    console.log(output);
}
if (require.main === module) {
    main(process.argv.slice(2)).catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
}
