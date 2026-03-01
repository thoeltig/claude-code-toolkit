import { extname, basename } from 'path';

export type FileFormat = 'json' | 'csv' | 'yaml' | 'ini' | 'ndjson' | 'markdown' | 'xml' | 'html' | 'log' | 'sql' | 'indent-syntax' | 'plaintext';

export function detectFormat(filePath: string): FileFormat {
    const ext = extname(filePath).toLowerCase();
    const filename = basename(filePath);

    // Check for indentation-based syntax languages that break if minified
    if (ext === '.py' || ext === '.nim' || ext === '.hx' || ext === '.gd' || ext === '.fs' || ext === '.fsx') {
        return 'indent-syntax';
    }
    if (filename === 'makefile' || filename === 'gnumakefile' || ext === '.makefile') {
        return 'indent-syntax';
    }

    switch (ext) {
        case '.json': return 'json';
        case '.csv': case '.tsv': return 'csv';
        case '.log': return 'log';
        case '.yaml': case '.yml': return 'yaml';
        case '.ini': case '.conf': case '.cfg': case '.properties': return 'ini';
        case '.ndjson': case '.jsonl': return 'ndjson';
        case '.md': case '.markdown': return 'markdown';
        case '.xml': return 'xml';
        case '.html': case '.htm': return 'html';
        case '.sql': return 'sql';
        case '.txt': case '.text': return 'plaintext';
        default: return 'plaintext';
    }
}