"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFormat = detectFormat;
const path_1 = require("path");
function detectFormat(filePath) {
    const ext = (0, path_1.extname)(filePath).toLowerCase();
    const filename = (0, path_1.basename)(filePath);
    // Check for indentation-based syntax languages that break if minified
    if (ext === '.py' || ext === '.nim' || ext === '.hx' || ext === '.gd' || ext === '.fs' || ext === '.fsx') {
        return 'indent-syntax';
    }
    if (filename === 'makefile' || filename === 'gnumakefile' || ext === '.makefile') {
        return 'indent-syntax';
    }
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
