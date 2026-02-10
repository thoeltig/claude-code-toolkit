
import { getCachePath, checkCacheExists, resolveCachePath, writeCache, generateManifest } from '../src/cache';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
const testDir = join(__dirname, 'test-temp-cache');
beforeAll(() => {
    if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
    }
});
afterAll(() => {
    if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
    }
});
describe('Cache Management', () => {
    describe('getCachePath', () => {
        test('should generate cache path with .compact suffix', () => {
            const input = '/path/to/file.json';
            const expected = '/path/to/file.compact.json';
            expect(getCachePath(input)).toBe(expected);
        });
        test('should handle files without extension', () => {
            const input = '/path/to/file';
            const expected = '/path/to/file.compact';
            expect(getCachePath(input)).toBe(expected);
        });
        test('should handle deep nested paths', () => {
            const input = '/very/deep/nested/path/file.json';
            const expected = '/very/deep/nested/path/file.compact.json';
            expect(getCachePath(input)).toBe(expected);
        });
        test('should handle Windows paths', () => {
            const input = 'C:\\Users\\file.json';
            expect(getCachePath(input)).toContain('file.compact.json');
        });
    });
    describe('checkCacheExists', () => {
        test('should return true for existing file', async () => {
            const testFile = join(testDir, 'exists.json');
            await fs.writeFile(testFile, '{}', 'utf-8');
            expect(checkCacheExists(testFile)).toBe(true);
        });
        test('should return false for non-existent file', () => {
            const testFile = join(testDir, 'does-not-exist.json');
            expect(checkCacheExists(testFile)).toBe(false);
        });
    });
    describe('resolveCachePath', () => {
        test('should return cache path when overwrite=true', async () => {
            const testFile = join(testDir, 'test1.json');
            await fs.writeFile(testFile, '{}', 'utf-8');
            const result = resolveCachePath(testFile, true);
            expect(result).toContain('test1.compact.json');
        });
        test('should append (1) when file exists and overwrite=false', async () => {
            const testFile = join(testDir, 'test2.json');
            const cacheFile = getCachePath(testFile);
            await fs.writeFile(testFile, '{}', 'utf-8');
            await fs.writeFile(cacheFile, '{}', 'utf-8');
            const result = resolveCachePath(testFile, false);
            expect(result).toContain('test2.compact(1).json');
        });
        test('should find first available number', async () => {
            const testFile = join(testDir, 'test3.json');
            const cache1 = getCachePath(testFile);
            const cache2 = cache1.replace('.json', `(1).json`);
            const cache3 = cache1.replace('.json', `(2).json`);
            await fs.writeFile(testFile, '{}', 'utf-8');
            await fs.writeFile(cache1, '{}', 'utf-8');
            await fs.writeFile(cache2, '{}', 'utf-8');
            await fs.writeFile(cache3, '{}', 'utf-8');
            const result = resolveCachePath(testFile, false);
            expect(result).toContain('test3.compact(3).json');
        });
    });
    describe('writeCache', () => {
        test('should write file to cache path', async () => {
            const testFile = join(testDir, 'write1.json');
            await fs.writeFile(testFile, '{}', 'utf-8');
            const result = await writeCache(testFile, '{"minified":true}', false);
            expect(result.success).toBe(true);
            expect(result.path).toContain('write1.compact.json');
        });
        test('should create cache file on disk', async () => {
            const testFile = join(testDir, 'write2.json');
            await fs.writeFile(testFile, '{}', 'utf-8');
            const result = await writeCache(testFile, '{"minified":true}', false);
            const exists = existsSync(result.path!);
            expect(exists).toBe(true);
        });
        test('should overwrite when flag set', async () => {
            const testFile = join(testDir, 'write3.json');
            await fs.writeFile(testFile, '{}', 'utf-8');
            const cachePath = getCachePath(testFile);
            await fs.writeFile(cachePath, '{"old":true}', 'utf-8');
            const result = await writeCache(testFile, '{"new":true}', true);
            const content = await fs.readFile(result.path!, 'utf-8');
            expect(content).toBe('{"new":true}');
        });
        test('should increment filename when not overwriting', async () => {
            const testFile = join(testDir, 'write4.json');
            await fs.writeFile(testFile, '{}', 'utf-8');
            const cache1 = getCachePath(testFile);
            await fs.writeFile(cache1, 'old', 'utf-8');
            const result1 = await writeCache(testFile, 'first', false);
            const result2 = await writeCache(testFile, 'second', false);
            expect(result1.path).not.toBe(result2.path);
            expect(result1.path).toContain('(1)');
            expect(result2.path).toContain('(2)');
        });
    });
    describe('generateManifest', () => {
        test('should generate manifest from processed files', () => {
            const files = [{ file: 'file1.json', cached: false, content: {}, originalSize: 0, newSize: 0 }, { file: 'file2.json', cached: true, cachedPath: '/path/file2.compact.json', content: {}, originalSize: 0, newSize: 0 }];
            const manifest = generateManifest(files);
            expect(manifest.processed).toHaveLength(2);
            expect(manifest.total).toBe(2);
        });
        test('should include cached paths in manifest', () => {
            const files = [{ file: 'file1.json', cached: true, cachedPath: '/path/file1.compact.json', content: {}, originalSize: 0, newSize: 0 }];
            const manifest = generateManifest(files);
            expect(manifest.processed[0].path).toBe('/path/file1.compact.json');
        });
        test('should handle mixed cached/non-cached files', () => {
            const files = [{ file: 'file1.json', cached: false, content: {}, originalSize: 0, newSize: 0 }, { file: 'file2.json', cached: true, cachedPath: '/path/file2.compact.json', content: {}, originalSize: 0, newSize: 0 }, { file: 'file3.json', cached: false, content: {}, originalSize: 0, newSize: 0 }];
            const manifest = generateManifest(files);
            expect(manifest.processed).toHaveLength(3);
            const cached = manifest.processed.filter((f: any) => f.cached);
            expect(cached).toHaveLength(1);
        });
    });
});
