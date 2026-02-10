"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFormat = detectFormat;
const path_1 = require("path");
function detectFormat(filePath) {
    const ext = (0, path_1.extname)(filePath).toLowerCase();
    switch (ext) {
        case '.json': return 'json';
        case '.csv':
        case '.tsv': return 'csv';
        case '.log': return 'log';
        case '.yaml':
        case '.yml': return 'yaml';
        case '.ini':
        case '.conf':
        case '.cfg':
        case '.properties': return 'ini';
        case '.ndjson':
        case '.jsonl': return 'ndjson';
        case '.md':
        case '.markdown': return 'markdown';
        case '.xml': return 'xml';
        case '.html':
        case '.htm': return 'html';
        case '.sql': return 'sql';
        case '.txt':
        case '.text': return 'plaintext';
        default: return 'plaintext';
    }
}
