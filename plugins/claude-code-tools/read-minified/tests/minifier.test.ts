import { minifyWhitespace } from '../src/minifier';
describe('minifyWhitespace', () => {
    test('should remove multiple spaces to single space', () => {
        const input = 'hello    world';
        const expected = 'hello world';
        expect(minifyWhitespace(input)).toBe(expected);
    });
    test('should collapse multiple empty lines to single newline', () => {
        const input = 'line1\n\n\n\nline2';
        const expected = 'line1\nline2';
        expect(minifyWhitespace(input)).toBe(expected);
    });
    test('should trim leading/trailing whitespace', () => {
        const input = '   hello world   ';
        const expected = 'hello world';
        expect(minifyWhitespace(input)).toBe(expected);
    });
    test('should preserve single spaces in content', () => {
        const input = 'word1 word2 word3';
        const expected = 'word1 word2 word3';
        expect(minifyWhitespace(input)).toBe(expected);
    });
    test('should handle mixed tabs and spaces', () => {
        const input = 'line1\t\t  \nline2';
        const result = minifyWhitespace(input);
        expect(result).toContain('line1');
        expect(result).toContain('line2');
    });
    test('should handle Windows line endings (CRLF)', () => {
        const input = 'line1\r\n\r\nline2';
        const result = minifyWhitespace(input);
        expect(result).not.toContain('\r');
        expect(result).toContain('line1');
        expect(result).toContain('line2');
    });
    test('should handle empty string', () => {
        expect(minifyWhitespace('')).toBe('');
    });
    test('should handle single word', () => {
        expect(minifyWhitespace('hello')).toBe('hello');
    });
    test('should handle only whitespace', () => {
        expect(minifyWhitespace('   \n\n\n   ')).toBe('');
    });
    test('should collapse empty lines at different positions', () => {
        const input = 'start\n\n\nmiddle\n\n\nend';
        const expected = 'start\nmiddle\nend';
        expect(minifyWhitespace(input)).toBe(expected);
    });
});
