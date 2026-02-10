import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import { dirname } from 'path';

export async function readFile(path: string): Promise<string> {
    try {
        return await fs.readFile(path, 'utf-8');
    } catch (utf8Err) {
        try {
            return await fs.readFile(path, 'latin1');
        } catch (latin1Err) {
            throw new Error(`Failed to read file ${path}: ${utf8Err}`);
        }
    };
}

export async function writeFile(path: string, content: string): Promise<void> {
    try {
        const dir = dirname(path);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path, content, 'utf-8');
    } catch (err) {
        throw new Error(`Failed to write file ${path}: ${err}`);
    }
}

export function fileExists(path: string): boolean {
    return existsSync(path);
}