"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidNdjson = isValidNdjson;
exports.parseNdjson = parseNdjson;
exports.formatNdjson = formatNdjson;
function isValidNdjson(content) {
    return content.trim().length > 0;
}
function parseNdjson(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const result = [];
    for (const line of lines) {
        try {
            const parsed = JSON.parse(line);
            result.push(parsed);
        }
        catch (err) {
            result.push({
                error: 'Invalid JSON in line',
                raw: line
            });
        }
    }
    return result;
}
function formatNdjson(rawContent, options) {
    try {
        const data = parseNdjson(rawContent);
        if (data.length === 0) {
            return '[]';
        }
        if (options.minify) {
            return JSON.stringify(data);
        }
        else {
            return JSON.stringify(data, null, 2);
        }
    }
    catch (err) {
        return JSON.stringify({ error: `Failed to format NDJSON: ${err}`, content: rawContent });
    }
}
