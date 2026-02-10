"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLogs = formatLogs;
function formatLogs(rawContent, options) {
    try {
        const lines = rawContent.split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 0)
            return minifyJson([]);
        const logType = detectLogType(lines[0]);
        const data = [];
        if (logType === 'rfc5424') {
            for (const line of lines) {
                data.push(parseRfc5424Line(line));
            }
        }
        else if (logType === 'rfc3164') {
            for (const line of lines) {
                data.push(parseRfc3164Line(line));
            }
        }
        else {
            for (const line of lines) {
                data.push(parseApacheNginxLine(line));
            }
        }
        return options.minify ? minifyJson(data) : JSON.stringify(data, null, 2);
    }
    catch (err) {
        return minifyJson({ error: `Failed to parse logs: ${err}`, content: rawContent });
    }
}
function detectLogType(firstLine) {
    if (!firstLine.startsWith('<'))
        return 'apache';
    const priorityEnd = firstLine.indexOf('>');
    if (priorityEnd === -1)
        return 'apache';
    const afterPri = firstLine.substring(priorityEnd + 1);
    if (afterPri.startsWith('1 '))
        return 'rfc5424';
    return 'rfc3164';
}
function parseApacheNginxLine(line) {
    const fields = parseLogFields(line);
    const row = {};
    const headers = ['ip', 'logname', 'user', 'timestamp', 'request', 'status', 'bytes', 'referer', 'useragent'];
    for (let i = 0; i < Math.min(headers.length, fields.length); i++) {
        if (fields[i] !== undefined && fields[i] !== '') {
            row[headers[i]] = fields[i];
        }
    }
    for (let i = headers.length; i < fields.length; i++) {
        const unknownKey = `u${i + 1}`;
        if (fields[i] !== undefined && fields[i] !== '') {
            row[unknownKey] = fields[i];
        }
    }
    return row;
}
function parseRfc3164Line(line) {
    const row = {};
    const priorityMatch = line.match(/^<(\d+)>/);
    if (priorityMatch) {
        row.priority = parseInt(priorityMatch[1], 10);
        line = line.substring(priorityMatch[0].length);
    }
    const parts = line.split(' ');
    let index = 0;
    if (index < parts.length && /^[A-Z][a-z]{2}$/.test(parts[index])) {
        const month = parts[index++];
        const day = parts[index++] || '';
        const time = parts[index++] || '';
        row.timestamp = `${month} ${day} ${time}`;
    }
    if (index < parts.length) {
        row.hostname = parts[index++];
    }
    if (index < parts.length) {
        const tagPart = parts[index++];
        const colonIndex = tagPart.indexOf(':');
        if (colonIndex !== -1) {
            row.tag = tagPart.substring(0, colonIndex);
            const msg = tagPart.substring(colonIndex + 1);
            if (msg) {
                const rest = parts.slice(index).join(' ');
                row.message = (msg + (rest ? ' ' + rest : '')).trim();
            }
            else {
                row.message = parts.slice(index).join(' ');
            }
        }
        else {
            row.tag = tagPart;
            row.message = parts.slice(index).join(' ');
        }
    }
    return row;
}
function parseRfc5424Line(line) {
    const row = {};
    const priorityMatch = line.match(/^<(\d+)>/);
    if (priorityMatch) {
        row.priority = parseInt(priorityMatch[1], 10);
        line = line.substring(priorityMatch[0].length);
    }
    const parts = line.split(' ');
    let index = 0;
    if (index < parts.length) {
        const version = parts[index++];
        if (version === '1') {
            row.version = 1;
        }
    }
    if (index < parts.length) {
        row.timestamp = parts[index++];
    }
    if (index < parts.length) {
        row.hostname = parts[index++];
    }
    if (index < parts.length) {
        row.appName = parts[index++];
    }
    if (index < parts.length) {
        row.procId = parts[index++];
    }
    if (index < parts.length) {
        row.msgId = parts[index++];
    }
    let structuredData = '';
    if (index < parts.length && parts[index] !== '-' && parts[index].startsWith('[')) {
        let sdPart = parts[index++];
        while (!sdPart.endsWith(']') && index < parts.length) {
            sdPart += ' ' + parts[index++];
        }
        structuredData = sdPart;
    }
    if (structuredData) {
        row.structuredData = parseStructuredData(structuredData);
    }
    if (index < parts.length) {
        const message = parts.slice(index).join(' ');
        if (message && message !== '-') {
            row.message = message;
        }
    }
    return row;
}
function parseStructuredData(sdString) {
    const result = {};
    const sdMatch = sdString.match(/\[(.*?)\]/g);
    if (!sdMatch)
        return result;
    for (const block of sdMatch) {
        const inner = block.slice(1, -1);
        const parts = inner.split(' ');
        const sdId = parts[0];
        const sdParams = {};
        for (let i = 1; i < parts.length; i++) {
            const param = parts[i];
            const eqIndex = param.indexOf('=');
            if (eqIndex !== -1) {
                const key = param.substring(0, eqIndex);
                const value = param.substring(eqIndex + 1).replace(/^"|"$/g, '');
                sdParams[key] = value;
            }
        }
        result[sdId] = sdParams;
    }
    return result;
}
function parseLogFields(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    let inBrackets = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '[') {
            inBrackets = true;
            current += char;
        }
        else if (char === ']') {
            inBrackets = false;
            current += char;
        }
        else if (char === '"') {
            inQuotes = !inQuotes;
            current += char;
        }
        else if (char === ' ' && !inQuotes && !inBrackets) {
            if (current.trim().length > 0) {
                fields.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            }
        }
        else {
            current += char;
        }
    }
    if (current.trim().length > 0) {
        fields.push(current.trim().replace(/^"|"$/g, ''));
    }
    return fields;
}
function minifyJson(obj) {
    return JSON.stringify(obj);
}
