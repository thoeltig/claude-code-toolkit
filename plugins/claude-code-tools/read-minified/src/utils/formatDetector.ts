import { extname } from 'path';

export type FileFormat = 'json' | 'csv' | 'yaml' | 'markdown' | 'plaintext';

export function detectFormat(filePath: string): FileFormat {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
        case '.json': return 'json';
        case '.csv': return 'csv';
        case '.yaml': case '.yml': return 'yaml';
        case '.md': case '.markdown': return 'markdown';
        case '.txt': case '.text': return 'plaintext';
        default: return 'plaintext';
    }
}