import { minifyJsonProperties } from '../../src/utils/propertyMinifier';

describe('Property Minifier', () => {
  describe('String minification', () => {
    test('should reduce consecutive spaces to single space', () => {
      const input = { text: 'hello    world' };
      const result = minifyJsonProperties(input);
      expect(result.text).toBe('hello world');
    });

    test('should reduce consecutive tabs to single space', () => {
      const input = { text: 'hello\t\t\tworld' };
      const result = minifyJsonProperties(input);
      expect(result.text).toBe('hello world');
    });

    test('should reduce consecutive newlines to single newline', () => {
      const input = { text: 'line1\n\n\nline2' };
      const result = minifyJsonProperties(input);
      expect(result.text).toBe('line1\nline2');
    });

    test('should trim leading/trailing whitespace', () => {
      const input = { text: '  hello world  ' };
      const result = minifyJsonProperties(input);
      expect(result.text).toBe('hello world');
    });

    test('should handle mixed whitespace', () => {
      const input = { text: '  hello  \t  world  \n  next  ' };
      const result = minifyJsonProperties(input);
      expect(result.text).toBe('hello world\nnext');
    });

    test('should disable minification with minifyContent: false', () => {
      const input = { text: 'hello    world' };
      const result = minifyJsonProperties(input, { minifyContent: false });
      expect(result.text).toBe('hello    world');
    });
  });

  describe('Type conversion', () => {
    test('should convert "true" to boolean true', () => {
      const input = { flag: 'true' };
      const result = minifyJsonProperties(input);
      expect(result.flag).toBe(true);
      expect(typeof result.flag).toBe('boolean');
    });

    test('should convert "false" to boolean false', () => {
      const input = { flag: 'false' };
      const result = minifyJsonProperties(input);
      expect(result.flag).toBe(false);
      expect(typeof result.flag).toBe('boolean');
    });

    test('should convert numeric strings to numbers', () => {
      const input = { count: '123', price: '19.99', negative: '-5' };
      const result = minifyJsonProperties(input);
      expect(result.count).toBe(123);
      expect(result.price).toBe(19.99);
      expect(result.negative).toBe(-5);
    });

    test('should NOT convert strings with leading zeros', () => {
      const input = { id: '007', code: '0123' };
      const result = minifyJsonProperties(input);
      expect(result.id).toBe('007');
      expect(result.code).toBe('0123');
    });

    test('should convert "0" to number 0', () => {
      const input = { count: '0' };
      const result = minifyJsonProperties(input);
      expect(result.count).toBe(0);
    });

    test('should NOT convert version strings', () => {
      const input = { version: '1.2.3' };
      const result = minifyJsonProperties(input);
      expect(result.version).toBe('1.2.3');
      expect(typeof result.version).toBe('string');
    });

    test('should NOT convert whitespace-only strings to anything', () => {
      const input = { text: '   ' };
      const result = minifyJsonProperties(input);
      expect(result).not.toHaveProperty('text');
    });

    test('should disable type conversion with convertTypes: false', () => {
      const input = { flag: 'true', count: '123' };
      const result = minifyJsonProperties(input, { convertTypes: false });
      expect(result.flag).toBe('true');
      expect(result.count).toBe('123');
    });
  });

  describe('Omitting empty values', () => {
    test('should omit null values', () => {
      const input = { name: 'John', value: null };
      const result = minifyJsonProperties(input);
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('value');
    });

    test('should omit empty strings', () => {
      const input = { name: 'John', description: '' };
      const result = minifyJsonProperties(input);
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('description');
    });

    test('should omit whitespace-only strings', () => {
      const input = { name: 'John', notes: '   \n  \t  ' };
      const result = minifyJsonProperties(input);
      expect(result).toHaveProperty('name');
      expect(result).not.toHaveProperty('notes');
    });

    test('should keep empty arrays for structure', () => {
      const input = { items: [] };
      const result = minifyJsonProperties(input);
      expect(result).toHaveProperty('items');
      expect(result.items).toEqual([]);
    });

    test('should keep empty objects for structure', () => {
      const input = { metadata: {} };
      const result = minifyJsonProperties(input);
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toEqual({});
    });

    test('should disable omitting with omitEmpty: false', () => {
      const input = { name: 'John', value: null, notes: '' };
      const result = minifyJsonProperties(input, { omitEmpty: false });
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('notes');
      expect(result.value).toBeNull();
      expect(result.notes).toBe('');
    });
  });

  describe('Nested structures', () => {
    test('should minify nested objects', () => {
      const input = {
        user: {
          name: 'John   Doe',
          active: 'true'
        }
      };
      const result = minifyJsonProperties(input);
      expect(result.user.name).toBe('John Doe');
      expect(result.user.active).toBe(true);
    });

    test('should minify arrays of objects', () => {
      const input = {
        items: [
          { id: '1', name: 'Item   1' },
          { id: '2', name: 'Item   2' }
        ]
      };
      const result = minifyJsonProperties(input);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].name).toBe('Item 1');
    });

    test('should remove empty items from arrays', () => {
      const input = {
        items: ['valid', '', '  ', null, 'another']
      };
      const result = minifyJsonProperties(input);
      expect(result.items).toEqual(['valid', 'another']);
    });

    test('should handle deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              value: '  test  ',
              flag: 'true'
            }
          }
        }
      };
      const result = minifyJsonProperties(input);
      expect(result.level1.level2.level3.value).toBe('test');
      expect(result.level1.level2.level3.flag).toBe(true);
    });

    test('should remove empty nested objects', () => {
      const input = {
        user: {
          name: 'John',
          profile: {
            bio: '',
            website: null
          }
        }
      };
      const result = minifyJsonProperties(input);
      expect(result.user.name).toBe('John');
      expect(result.user.profile).toEqual({});
    });
  });

  describe('Complex real-world scenarios', () => {
    test('should minify CSV-like JSON data', () => {
      const input = {
        fileInfo: {
          originalPath: '/path/to/file.csv',
          format: 'csv'
        },
        content: [
          {
            name: '  John   Smith  ',
            age: '30',
            active: 'true',
            notes: ''
          },
          {
            name: '  Jane   Doe  ',
            age: '28',
            active: 'false',
            notes: null
          }
        ]
      };
      const result = minifyJsonProperties(input);
      expect(result.fileInfo.originalPath).toBe('/path/to/file.csv');
      expect(result.content[0].name).toBe('John Smith');
      expect(result.content[0].age).toBe(30);
      expect(result.content[0].active).toBe(true);
      expect(result.content[0]).not.toHaveProperty('notes');
      expect(result.content[1].active).toBe(false);
    });

    test('should minify Markdown-like data', () => {
      const input = {
        fileInfo: {
          format: 'markdown'
        },
        content: {
          headers: [
            { level: '1', text: '  Main   Title  ', anchor_line: 0 },
            { level: '2', text: '  Sub   Title  ', anchor_line: 2 }
          ],
          paragraphs: [
            { text: 'Line 1\n\n\nLine 2\n\nLine 3', anchor_line: 4 }
          ]
        }
      };
      const result = minifyJsonProperties(input);
      expect(result.content.headers[0].text).toBe('Main Title');
      expect(result.content.headers[0].level).toBe(1);
      expect(result.content.headers[0].anchor_line).toBe(0);
      expect(result.content.paragraphs[0].text).toBe('Line 1\nLine 2\nLine 3');
    });

    test('should handle mixed content with various types', () => {
      const input = {
        data: {
          string: '  hello  ',
          number: '42',
          boolean: 'true',
          nullValue: null,
          emptyString: '',
          array: ['item1', '  item2  ', '', null],
          nested: {
            value: 'test',
            empty: ''
          }
        }
      };
      const result = minifyJsonProperties(input);
      expect(result.data.string).toBe('hello');
      expect(result.data.number).toBe(42);
      expect(result.data.boolean).toBe(true);
      expect(result.data).not.toHaveProperty('nullValue');
      expect(result.data).not.toHaveProperty('emptyString');
      expect(result.data.array).toEqual(['item1', 'item2']);
      expect(result.data.nested).toEqual({ value: 'test' });
    });
  });

  describe('Edge cases', () => {
    test('should handle empty object', () => {
      const input = {};
      const result = minifyJsonProperties(input);
      expect(result).toEqual({});
    });

    test('should handle empty array', () => {
      const input = { items: [] };
      const result = minifyJsonProperties(input);
      expect(result.items).toEqual([]);
    });

    test('should handle all nulls/empty values', () => {
      const input = { a: null, b: '', c: '  ' };
      const result = minifyJsonProperties(input);
      expect(Object.keys(result).length).toBe(0);
    });

    test('should handle unicode characters', () => {
      const input = { emoji: '😀  test  😀', chinese: '你好   世界' };
      const result = minifyJsonProperties(input);
      expect(result.emoji).toContain('😀');
      expect(result.emoji).toBe('😀 test 😀');
      expect(result.chinese).toBe('你好 世界');
    });

    test('should preserve zero values', () => {
      const input = { count: 0, flag: false, text: '' };
      const result = minifyJsonProperties(input, { omitEmpty: false });
      expect(result.count).toBe(0);
      expect(result.flag).toBe(false);
      expect(result.text).toBe('');
    });
  });
});
