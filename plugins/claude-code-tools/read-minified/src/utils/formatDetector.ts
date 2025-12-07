import { extname } from 'path';

export type FileFormat = 'json' | 'csv' | 'yaml' | 'ini' | 'ndjson' | 'plaintext';

export function detectFormat(filePath: string): FileFormat {
    const ext = extname(filePath).toLowerCase();
    switch (ext) {
        case '.json': return 'json';
        case '.csv': case '.tsv': return 'csv';
        case '.yaml': case '.yml': return 'yaml';
        case '.ini': case '.conf': case '.cfg': case '.properties': return 'ini';
        case '.ndjson': case '.jsonl': return 'ndjson';
        case '.txt': case '.text': return 'plaintext';
        default: return 'plaintext';
    }
}