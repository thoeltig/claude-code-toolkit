import { formatOutput } from '../../src/utils/outputFormatter';
import { ProcessedFile, ReadMinifiedOptions } from '../../src/types';
describe('formatOutput', () => {
    describe('Case 1: Single file, DEFAULT (minify=true, toJson=true, no cache)', () => {
        test('should return raw minified JSON content without wrapper', () => {
            const files: ProcessedFile[] = [{ file: 'test.json', content: { user: { name: 'John' }, age: 30 }, cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe(JSON.stringify({ user: { name: 'John' }, age: 30 }));
        });
        test('should handle plaintext content converted to JSON', () => {
            const files: ProcessedFile[] = [{ file: 'test.txt', content: 'This is minified text content.', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe(JSON.stringify('This is minified text content.'));
        });
        test('should handle error in single file without cache', () => {
            const files: ProcessedFile[] = [{ file: 'test.json', error: 'File not found', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('error');
            expect(parsed).toHaveProperty('file');
        });
    });
    describe('Case 2: Single file, --no-minify', () => {
        test('should return original formatted JSON content without wrapper', () => {
            const files: ProcessedFile[] = [{ file: 'test.json', content: { user: { name: 'John' }, age: 30 }, cached: false }];
            const options: ReadMinifiedOptions = { minify: false, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe(JSON.stringify({ user: { name: 'John' }, age: 30 }));
        });
    });
    describe('Case 3: Single file, --no-to-json', () => {
        test('should return minified native format without wrapper', () => {
            const files: ProcessedFile[] = [{ file: 'test.txt', content: 'Minified text content', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: false, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe(JSON.stringify('Minified text content'));
        });
    });
    describe('Case 4: Single file, --no-minify --no-to-json', () => {
        test('should return original content without wrapper', () => {
            const files: ProcessedFile[] = [{ file: 'test.txt', content: 'Original text content.', cached: false }];
            const options: ReadMinifiedOptions = { minify: false, toJson: false, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe(JSON.stringify('Original text content.'));
        });
    });
    describe('Case 5: Single file, --cache', () => {
        test('should return JSON wrapper with minified content and cache info', () => {
            const files: ProcessedFile[] = [{ file: 'test.json', content: { user: { name: 'John' } }, cached: true, cachedPath: 'test.compact.json' }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: true, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('content');
            expect(parsed).toHaveProperty('cached', true);
            expect(parsed).toHaveProperty('cachedPath', 'test.compact.json');
            expect(parsed.content).toEqual({ user: { name: 'John' } });
        });
        test('should handle cache with no cache path when caching failed', () => {
            const files: ProcessedFile[] = [{ file: 'test.json', content: { data: 'value' }, cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: true, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            expect(parsed.cached).toBe(false);
            expect(parsed.cachedPath).toBeNull();
        });
        test('should include error in cache wrapper if present', () => {
            const files: ProcessedFile[] = [{ file: 'test.json', error: 'Parse error', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: true, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('error', 'Parse error');
        });
    });
    describe('Case 6: Multiple files, DEFAULT', () => {
        test('should return NDJSON with raw minified content per line', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', content: { data: 'value1' }, cached: false }, { file: 'file2.json', content: { data: 'value2' }, cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const lines = output.split('\n');
            expect(lines).toHaveLength(2);
            expect(JSON.parse(lines[0])).toEqual({ data: 'value1' });
            expect(JSON.parse(lines[1])).toEqual({ data: 'value2' });
        });
        test('should handle mixed file types in batch', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', content: { data: 'value' }, cached: false }, { file: 'file2.txt', content: 'plaintext', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const lines = output.split('\n');
            expect(lines).toHaveLength(2);
            expect(JSON.parse(lines[0])).toEqual({ data: 'value' });
            expect(JSON.parse(lines[1])).toBe('plaintext');
        });
        test('should handle errors in batch without wrapper', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', content: { data: 'value' }, cached: false }, { file: 'file2.json', error: 'Not found', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const lines = output.split('\n');
            expect(JSON.parse(lines[0])).toEqual({ data: 'value' });
            expect(JSON.parse(lines[1])).toHaveProperty('error');
        });
    });
    describe('Case 7: Multiple files, --cache', () => {
        test('should return NDJSON with file metadata and cache info per line', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', content: { data: 'value1' }, cached: true, cachedPath: 'file1.compact.json' }, { file: 'file2.json', content: { data: 'value2' }, cached: true, cachedPath: 'file2.compact.json' }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: true, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            const lines = output.split('\n');
            expect(lines).toHaveLength(2);
            const parsed1 = JSON.parse(lines[0]);
            expect(parsed1).toHaveProperty('file', 'file1.json');
            expect(parsed1).toHaveProperty('content', { data: 'value1' });
            expect(parsed1).toHaveProperty('cached', true);
            expect(parsed1).toHaveProperty('cachedPath', 'file1.compact.json');
        });
    });
    describe('Case 8: --no-output (Manifest mode)', () => {
        test('should return manifest for single file', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', cached: true, cachedPath: 'file1.compact.json' }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: true, overwrite: false, noOutput: true };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('processed');
            expect(parsed).toHaveProperty('total', 1);
            expect(parsed.processed[0]).toHaveProperty('file', 'file1.json');
            expect(parsed.processed[0]).toHaveProperty('cached', true);
            expect(parsed.processed[0]).toHaveProperty('path', 'file1.compact.json');
        });
        test('should return manifest for multiple files', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', cached: true, cachedPath: 'file1.compact.json' }, { file: 'file2.json', cached: false }, { file: 'file3.json', cached: true, cachedPath: 'file3.compact.json' }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: true, overwrite: false, noOutput: true };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            expect(parsed.total).toBe(3);
            expect(parsed.processed).toHaveLength(3);
            expect(parsed.processed[0].cached).toBe(true);
            expect(parsed.processed[1].cached).toBe(false);
        });
        test('should exclude error field from manifest when not present', () => {
            const files: ProcessedFile[] = [{ file: 'file1.json', cached: true, cachedPath: 'file1.compact.json' }, { file: 'file2.json', error: 'Not found', cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: true };
            const output = formatOutput(files, options);
            const parsed = JSON.parse(output);
            const withoutError = parsed.processed[0];
            expect('error' in withoutError).toBeFalsy();
        });
    });
    describe('Edge cases', () => {
        test('should handle empty content object', () => {
            const files: ProcessedFile[] = [{ file: 'empty.json', content: {}, cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe('{}');
        });
        test('should handle null content', () => {
            const files: ProcessedFile[] = [{ file: 'null.json', content: null, cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe('null');
        });
        test('should handle array content', () => {
            const files: ProcessedFile[] = [{ file: 'array.json', content: [1, 2, 3], cached: false }];
            const options: ReadMinifiedOptions = { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false };
            const output = formatOutput(files, options);
            expect(output).toBe('[1,2,3]');
        });
    });
});

