"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCsv = isValidCsv;
exports.parseCsv = parseCsv;
exports.formatCsv = formatCsv;
function isValidCsv(content) {
    return content.trim().length > 0;
}
function parseCsv(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0)
        return [];
    const delimiter = detectDelimiter(content);
    let headers = [];
    let dataStartIndex = 0;
    const firstLineFields = parseRow(lines[0], delimiter);
    if (looksLikeHeaders(firstLineFields)) {
        headers = firstLineFields;
        dataStartIndex = 1;
    }
    else {
        headers = firstLineFields.map((_, i) => `u${i + 1}`);
    }
    const rows = [];
    for (let i = dataStartIndex; i < lines.length; i++) {
        const fields = parseRow(lines[i], delimiter);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            if (j < fields.length && fields[j] !== undefined && fields[j] !== '') {
                row[headers[j]] = fields[j];
            }
        }
        for (let j = headers.length; j < fields.length; j++) {
            const unknownKey = `u${j + 1}`;
            if (fields[j] !== undefined && fields[j] !== '') {
                row[unknownKey] = fields[j];
            }
        }
        rows.push(row);
    }
    return rows;
}
function detectDelimiter(content) {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0)
        return ',';
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/[^"]*"[^"]*"/g) || []).length > 0 ? countDelimiterOutsideQuotes(firstLine, ',') : firstLine.split(',').length - 1;
    const semicolonCount = (firstLine.match(/[^"]*"[^"]*"/g) || []).length > 0 ? countDelimiterOutsideQuotes(firstLine, ';') : firstLine.split(';').length - 1;
    const tabCount = (firstLine.match(/[^"]*"[^"]*"/g) || []).length > 0 ? countDelimiterOutsideQuotes(firstLine, '\t') : firstLine.split('\t').length - 1;
    if (tabCount > commaCount && tabCount > semicolonCount && tabCount >= 2)
        return '\t';
    if (semicolonCount > commaCount && semicolonCount >= 2)
        return ';';
    return ',';
}
function countDelimiterOutsideQuotes(line, delimiter) {
    let count = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (line[i] === delimiter && !inQuotes) {
            count++;
        }
    }
    return count;
}
function parseRow(line, delimiter) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '\"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === delimiter && !inQuotes) {
            fields.push(current.trim());
            current = '';
        }
        else {
            current += char;
        }
    }
    fields.push(current.trim());
    return fields;
}
function looksLikeHeaders(fields) {
    if (fields.length === 0)
        return false;
    const headerPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    const isHeader = fields.filter(field => {
        const trimmed = field.trim();
        return headerPattern.test(trimmed) && /[a-zA-Z]/.test(trimmed);
    });
    return isHeader.length === fields.length;
}
function formatCsv(rawContent, options) {
    try {
        const data = parseCsv(rawContent);
        if (data.length === 0)
            return minifyJson([]);
        return options.minify ? minifyJson(data) : JSON.stringify(data, null, 2);
    }
    catch (err) {
        return minifyJson({ error: `Failed to parse CSV: ${err}`, content: rawContent });
    }
}
function minifyJson(obj) {
    return JSON.stringify(obj);
}
