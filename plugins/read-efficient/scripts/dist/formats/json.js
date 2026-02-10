"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidJson = isValidJson;
exports.parseJson = parseJson;
exports.minifyJson = minifyJson;
exports.formatJson = formatJson;
function isValidJson(content) {
    try {
        JSON.parse(content);
        return true;
    }
    catch {
        return false;
    }
}
function parseJson(content) {
    return JSON.parse(content);
}
function minifyJson(input) {
    const obj = typeof input === 'string' ? JSON.parse(input) : input;
    return JSON.stringify(obj);
}
function formatJson(rawContent, options) {
    if (!isValidJson(rawContent)) {
        throw new Error('Invalid JSON: unable to parse content');
    }
    try {
        const parsed = parseJson(rawContent);
        if (options.minify) {
            return minifyJson(parsed);
        }
        return JSON.stringify(parsed);
    }
    catch (err) {
        throw new Error(`Failed to format JSON: ${err}`);
    }
}
;
