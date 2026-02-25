import { parseArguments, processFile } from '../src/index';
import { formatOutput } from '../src/utils/outputFormatter';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
describe('CLI and Orchestration', () => {
    describe('parseArguments', () => {
        test('should parse file paths', () => {
            const args = ['file1.json', 'file2.json'];
            const { paths, options } = parseArguments(args);
            expect(paths).toEqual(['file1.json', 'file2.json']);
            expect(options.minify).toBe(true);
            expect(options.toJson).toBe(true);
        });
        test('should parse --no-minify flag', () => {
            const args = ['file.json', '--no-minify'];
            const { options } = parseArguments(args);
            expect(options.minify).toBe(false);
        });
        test('should parse --no-to-json flag', () => {
            const args = ['file.json', '--no-to-json'];
            const { options } = parseArguments(args);
            expect(options.toJson).toBe(false);
        });
        test('should parse --cache flag', () => {
            const args = ['file.json', '--cache'];
            const { options } = parseArguments(args);
            expect(options.cache).toBe(true);
        });
        test('should parse --overwrite flag', () => {
            const args = ['file.json', '--cache', '--overwrite'];
            const { options } = parseArguments(args);
            expect(options.overwrite).toBe(true);
        });
        test('should parse --no-output flag', () => {
            const args = ['file.json', '--no-output'];
            const { options } = parseArguments(args);
            expect(options.noOutput).toBe(true);
        });
        test('should handle multiple flags', () => {
            const args = ['file.json', '--cache', '--overwrite'];
            const { paths, options } = parseArguments(args);
            expect(paths).toEqual(['file.json']);
            expect(options.minify).toBe(true);
            expect(options.cache).toBe(true);
            expect(options.overwrite).toBe(true);
        });
        test('should handle mixed paths and flags', () => {
            const args = ['file1.json', '--no-minify', 'file2.json', '--cache'];
            const { paths, options } = parseArguments(args);
            expect(paths).toEqual(['file1.json', 'file2.json']);
            expect(options.minify).toBe(false);
            expect(options.cache).toBe(true);
        });
        test('should set minify to true by default', () => {
            const args = ['file.json'];
            const { options } = parseArguments(args);
            expect(options.minify).toBe(true);
        });
        test('should set other options to false by default', () => {
            const args = ['file.json'];
            const { options } = parseArguments(args);
            expect(options.toJson).toBe(true);
            expect(options.cache).toBe(false);
            expect(options.overwrite).toBe(false);
            expect(options.noOutput).toBe(false);
        });
        test('should parse --no-anchor-lines flag', () => {
            const args = ['file.md', '--no-anchor-lines'];
            const { options } = parseArguments(args);
            expect(options.noAnchorLines).toBe(true);
        });
        test('should parse --max-output flag with value', () => {
            const args = ['file.json', '--max-output=50000'];
            const { options } = parseArguments(args);
            expect(options.maxOutput).toBe(50000);
        });
        test('should ignore invalid --max-output values', () => {
            const args = ['file.json', '--max-output=invalid'];
            const { options } = parseArguments(args);
            expect(options.maxOutput).toBeUndefined();
        });
        test('should combine --no-anchor-lines with other flags', () => {
            const args = ['file.md', '--no-anchor-lines', '--cache', '--to-json'];
            const { paths, options } = parseArguments(args);
            expect(paths).toEqual(['file.md']);
            expect(options.noAnchorLines).toBe(true);
            expect(options.cache).toBe(true);
            expect(options.toJson).toBe(true);
        });
    });
    describe('formatOutput', () => {
        test('should format single file as raw content without cache', () => {
            const files = [{ file: 'file.json', content: { a: 1 }, cached: false, originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false });
            const parsed = JSON.parse(output);
            expect(parsed).toEqual({ a: 1 });
        });
        test('should format single file with cache as wrapped JSON', () => {
            const files = [{ file: 'file.json', content: { a: 1 }, cached: true, cachedPath: 'file.compact.json', originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: true, overwrite: false, noOutput: false });
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('content');
            expect(parsed).toHaveProperty('cached', true);
            expect(parsed).toHaveProperty('cachedPath');
        });
        test('should format multiple files as NDJSON', () => {
            const files = [{ file: 'file1.json', content: { a: 1 }, cached: false, originalSize: 0, newSize: 0 }, { file: 'file2.json', content: { b: 2 }, cached: false, originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false });
            const lines = output.trim().split('\n');
            expect(lines).toHaveLength(2);
            expect(JSON.parse(lines[0])).toEqual({ a: 1 });
            expect(JSON.parse(lines[1])).toEqual({ b: 2 });
        });
        test('should format --no-output as manifest', () => {
            const files = [{ file: 'file1.json', cached: true, cachedPath: '/path/file1.compact.json', originalSize: 0, newSize: 0 }, { file: 'file2.json', cached: false, originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: true, overwrite: false, noOutput: true });
            const manifest = JSON.parse(output);
            expect(manifest).toHaveProperty('cached_files');
            expect(manifest).toHaveProperty('cached_file_count');
            expect(manifest.cached_files).toHaveLength(2);
            expect(manifest.cached_file_count).toBe(2);
        });
        test('should include error field in single file output', () => {
            const files = [{ file: 'file1.json', error: 'File not found', cached: false, originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false });
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('error');
            expect(parsed).toHaveProperty('file');
        });
        test('should include cached info in output with cache enabled', () => {
            const files = [{ file: 'file1.json', content: {}, cached: true, cachedPath: '/path/file1.compact.json', originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: true, overwrite: false, noOutput: false });
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('cached', true);
            expect(parsed).toHaveProperty('cachedPath', '/path/file1.compact.json');
        });
        test('should handle three files as NDJSON', () => {
            const files = [{ file: 'file1.json', content: { a: 1 }, cached: false, originalSize: 0, newSize: 0 }, { file: 'file2.json', content: { b: 2 }, cached: false, originalSize: 0, newSize: 0 }, { file: 'file3.json', content: { c: 3 }, cached: false, originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false });
            const lines = output.trim().split('\n');
            expect(lines).toHaveLength(3);
        });
        test('should include minification_note in output for format-safe minification', () => {
            const files = [{ file: 'config.yaml', content: 'minified:', minificationNote: 'YAML minified without --to-json (structure-aware conversion skipped)', cached: false, originalSize: 0, newSize: 0 }];
            const output = formatOutput(files, { minify: true, toJson: false, cache: false, overwrite: false, noOutput: false });
            const parsed = JSON.parse(output);
            expect(parsed).toHaveProperty('minification_note');
            expect(parsed.minification_note).toContain('YAML minified');
        });
    });
    describe('Edge Cases - New Features', () => {
        const testDir = 'tests/test-edge-cases';

        beforeAll(() => {
            mkdirSync(testDir, { recursive: true });
        });

        afterAll(() => {
            rmSync(testDir, { recursive: true, force: true });
        });

        test('should add minification_note for YAML minified without --to-json', async () => {
            const filePath = join(testDir, 'test.yaml');
            writeFileSync(filePath, 'key: value\nnested:\n  inner: data');

            const result = await processFile(filePath, { minify: true, toJson: false, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            expect(result.minificationNote).toBeDefined();
            expect(result.minificationNote).toContain('YAML minified without --to-json');
        });

        test('should add minification_note for INI minified without --to-json', async () => {
            const filePath = join(testDir, 'test.ini');
            writeFileSync(filePath, '[section]\nkey=value');

            const result = await processFile(filePath, { minify: true, toJson: false, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            expect(result.minificationNote).toBeDefined();
            expect(result.minificationNote).toContain('INI minified without --to-json');
        });

        test('should NOT add minification_note for JSON minified', async () => {
            const filePath = join(testDir, 'test.json');
            writeFileSync(filePath, '{\n  "key": "value"\n}');

            const result = await processFile(filePath, { minify: true, toJson: false, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            expect(result.minificationNote).toBeUndefined();
        });

        test('should handle NDJSON as minified JSON (no format handler)', async () => {
            const filePath = join(testDir, 'test.ndjson');
            writeFileSync(filePath, '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}');

            const result = await processFile(filePath, { minify: true, toJson: false, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            // Should be minified directly, not formatted as JSON array
            const contentStr = JSON.stringify(result.content);
            expect(typeof result.content).toBe('object');
            expect(contentStr).toContain("[{\"id\":1,\"name\":\"Alice\"},{\"id\":2,\"name\":\"Bob\"}]");
        });

        test('should remove anchor_line fields when --no-anchor-lines is used', async () => {
            const filePath = join(testDir, 'test.md');
            writeFileSync(filePath, '# Title\nSome text\n## Section\nMore text');

            const result = await processFile(filePath, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: true }, 0);

            const contentStr = JSON.stringify(result.content);
            expect(contentStr).not.toContain('anchor_line');
        });

        test('should preserve anchor_line by default in Markdown', async () => {
            const filePath = join(testDir, 'test2.md');
            writeFileSync(filePath, '# Title\nSome text');

            const result = await processFile(filePath, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            const contentObj = result.content.content || result.content;
            const contentStr = JSON.stringify(contentObj);
            expect(contentStr).toContain('anchor_line');
        });

        test('should add fileInfo for converted formats (CSV)', async () => {
            const filePath = join(testDir, 'test.csv');
            writeFileSync(filePath, 'name,age\nAlice,30\nBob,25');

            const result = await processFile(filePath, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            expect(result.content).toHaveProperty('fileInfo');
            expect(result.content.fileInfo).toHaveProperty('format', 'csv');
            expect(result.content.fileInfo).toHaveProperty('originalPath');
            expect(result.content.fileInfo).toHaveProperty('originalSize');
            expect(result.content.fileInfo).toHaveProperty('minifiedSize');
        });

        test('should NOT add fileInfo for JSON format', async () => {
            const filePath = join(testDir, 'test-nofinfo.json');
            writeFileSync(filePath, '{"data":"value"}');

            const result = await processFile(filePath, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            expect(result.content).not.toHaveProperty('fileInfo');
            expect(result.content).toEqual({ data: 'value' });
        });

        test('should add fileInfo for XML with proper conversion', async () => {
            const filePath = join(testDir, 'test.xml');
            writeFileSync(filePath, '<root><item>value</item></root>');

            const result = await processFile(filePath, { minify: true, toJson: true, cache: false, overwrite: false, noOutput: false, noAnchorLines: false }, 0);

            expect(result.content).toHaveProperty('fileInfo');
            expect(result.content.fileInfo.format).toBe('xml');
            expect(result.content).toHaveProperty('content');
        });

        test('should include fileInfo in cached output for converted formats', async () => {
            const filePath = join(testDir, 'test-cached.yaml');
            writeFileSync(filePath, 'database: postgres\nport: 5432');

            const result = await processFile(filePath, { minify: true, toJson: true, cache: true, overwrite: true, noOutput: false, noAnchorLines: false }, 0);

            expect(result.cached).toBe(true);
            expect(result.content).toHaveProperty('fileInfo');
            expect(result.content.fileInfo.format).toBe('yaml');
        });

        test('should handle minification_note with caching', async () => {
            const filePath = join(testDir, 'test-minify-note.ini');
            writeFileSync(filePath, '[config]\nvalue=test');

            const result = await processFile(filePath, { minify: true, toJson: false, cache: true, overwrite: true, noOutput: false, noAnchorLines: false }, 0);

            expect(result.minificationNote).toBeDefined();
            expect(result.cached).toBe(true);
        });
    });
});
