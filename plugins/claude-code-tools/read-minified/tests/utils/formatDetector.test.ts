import { detectFormat } from '../../src/utils/formatDetector';
describe('Format Detector', () => {
    describe('detectFormat', () => {
        test('should detect JSON files', () => {
            expect(detectFormat('/path/to/file.json')).toBe('json');
            expect(detectFormat('data.json')).toBe('json');
        });
        test('should detect CSV files', () => {
            expect(detectFormat('/path/to/file.csv')).toBe('csv');
            expect(detectFormat('data.csv')).toBe('csv');
        });
        test('should detect YAML files', () => {
            expect(detectFormat('/path/to/file.yaml')).toBe('yaml');
            expect(detectFormat('config.yml')).toBe('yaml');
        });
        test('should detect Markdown files', () => {
            expect(detectFormat('/path/to/file.md')).toBe('markdown');
            expect(detectFormat('readme.markdown')).toBe('markdown');
        });
        test('should detect plain text files', () => {
            expect(detectFormat('/path/to/file.txt')).toBe('plaintext');
            expect(detectFormat('notes.text')).toBe('plaintext');
        });
        test('should default to plaintext for unknown extensions', () => {
            expect(detectFormat('/path/to/file.unknown')).toBe('plaintext');
            expect(detectFormat('file.xyz')).toBe('plaintext');
            expect(detectFormat('file.log')).toBe('plaintext');
        });
        test('should be case insensitive', () => {
            expect(detectFormat('file.JSON')).toBe('json');
            expect(detectFormat('file.TXT')).toBe('plaintext');
            expect(detectFormat('file.CSV')).toBe('csv');
        });
        test('should handle files without extension', () => {
            expect(detectFormat('Makefile')).toBe('plaintext');
            expect(detectFormat('/path/to/README')).toBe('plaintext');
        });
    });
});