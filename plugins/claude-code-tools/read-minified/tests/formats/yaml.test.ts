import { parseYaml, formatYaml, isValidYaml } from '../../src/formats/yaml';
describe('YAML Format Handler', () => {
    describe('isValidYaml', () => {
        test('should validate non-empty YAML content', () => {
            expect(isValidYaml('key: value\nother: data')).toBe(true);
        });
        test('should reject empty content', () => {
            expect(isValidYaml('')).toBe(false);
        });
        test('should reject whitespace-only content', () => {
            expect(isValidYaml('   \n  \n  ')).toBe(false);
        });
    });
    describe('parseYaml - Basic Key:Value', () => {
        test('should parse simple key-value pairs', () => {
            const yaml = 'name: John\nage: 30\ncity: Boston';
            const result = parseYaml(yaml);
            expect(result).toEqual({ name: 'John', age: '30', city: 'Boston' });
        });
        test('should handle empty values', () => {
            const yaml = 'name: John\nempty:\nage: 30';
            const result = parseYaml(yaml);
            expect(result).toEqual({ name: 'John', empty: null, age: '30' });
        });
        test('should trim whitespace around colons', () => {
            const yaml = 'name : John\nage  :  30';
            const result = parseYaml(yaml);
            expect(result).toEqual({ name: 'John', age: '30' });
        });
        test('should handle values with colons inside', () => {
            const yaml = 'url: http://example.com\npath: /api/v1:endpoint';
            const result = parseYaml(yaml);
            expect(result).toEqual({ url: 'http://example.com', path: '/api/v1:endpoint' });
        });
    });
    describe('parseYaml - Nested Structures', () => {
        test('should parse nested objects with indentation', () => {
            const yaml = 'database:\n  host: localhost\n  port: 5432\n  user: admin';
            const result = parseYaml(yaml);
            expect(result.database).toBeDefined();
            expect(result.database.host).toBe('localhost');
            expect(result.database.port).toBe('5432');
        });
        test('should handle multiple nested levels', () => {
            const yaml = 'app:\n  database:\n    connection:\n      host: localhost';
            const result = parseYaml(yaml);
            expect(result.app).toBeDefined();
            expect(result.app.database).toBeDefined();
            expect(result.app.database.connection).toBeDefined();
        });
        test('should return to top level after nested section', () => {
            const yaml = 'database:\n  host: localhost\nlogging:\n  level: debug';
            const result = parseYaml(yaml);
            expect(result.database).toBeDefined();
            expect(result.logging).toBeDefined();
        });
    });
    describe('parseYaml - Lists', () => {
        test('should parse simple lists', () => {
            const yaml = 'items:\n- apple\n- banana\n- cherry';
            const result = parseYaml(yaml);
            expect(Array.isArray(result.items)).toBe(true);
            expect(result.items).toContain('apple');
            expect(result.items).toContain('banana');
        });
        test('should handle lists with multiple items', () => {
            const yaml = 'tags:\n- tag1\n- tag2\n- tag3\n- tag4';
            const result = parseYaml(yaml);
            expect(result.tags).toHaveLength(4);
        });
        test('should preserve list items as strings', () => {
            const yaml = 'numbers:\n- 1\n- 2\n- 3';
            const result = parseYaml(yaml);
            expect(result.numbers[0]).toBe('1');
            expect(result.numbers[1]).toBe('2');
        });
    });
    describe('parseYaml - Comments', () => {
        test('should ignore comments', () => {
            const yaml = '# This is a comment\nname: John\n# Another comment\nage: 30';
            const result = parseYaml(yaml);
            expect(result).toEqual({ name: 'John', age: '30' });
        });
        test('should handle comments at start of line', () => {
            const yaml = '# Config file\nserver: localhost\n# Port for server\nport: 8080';
            const result = parseYaml(yaml);
            expect(result.server).toBe('localhost');
            expect(result.port).toBe('8080');
        });
    });
    describe('parseYaml - Edge Cases', () => {
        test('should handle keys without values', () => {
            const yaml = 'key1:\nkey2: value';
            const result = parseYaml(yaml);
            expect(result.key1).toBeNull();
            expect(result.key2).toBe('value');
        });
        test('should skip malformed lines without colons', () => {
            const yaml = 'validkey: value\nmalformed line\nanotherkey: data';
            const result = parseYaml(yaml);
            expect(result.validkey).toBe('value');
            expect(result.anotherkey).toBe('data');
        });
        test('should handle empty lines', () => {
            const yaml = 'key1: value1\n\nkey2: value2\n\nkey3: value3';
            const result = parseYaml(yaml);
            expect(result.key1).toBe('value1');
            expect(result.key2).toBe('value2');
            expect(result.key3).toBe('value3');
        });
        test('should trim whitespace from values', () => {
            const yaml = 'key: value with spaces \nother:  indented text';
            const result = parseYaml(yaml);
            expect(result.key).toBe('value with spaces');
            expect(result.other).toBe('indented text');
        });
        test('should handle special characters in values', () => {
            const yaml = 'email: user@example.com\npath: /usr/local/bin\nurl: https://example.com/api?v=1';
            const result = parseYaml(yaml);
            expect(result.email).toBe('user@example.com');
            expect(result.path).toBe('/usr/local/bin');
            expect(result.url).toBe('https://example.com/api?v=1');
        });
    });
    describe('formatYaml', () => {
        test('should format YAML to minified JSON', () => {
            const yaml = 'name: John\nage: 30';
            const output = formatYaml(yaml, { minify: true });
            const parsed = JSON.parse(output);
            expect(parsed).toEqual({ name: 'John', age: '30' });
        });
        test('should format YAML to pretty JSON when not minified', () => {
            const yaml = 'name: John\nage: 30';
            const output = formatYaml(yaml, { minify: false });
            expect(output).toContain('\n');
            expect(output).toContain('  ');
        });
        test('should handle nested structures in format', () => {
            const yaml = 'database:\n  host: localhost\n  port: 5432';
            const output = formatYaml(yaml, { minify: true });
            const parsed = JSON.parse(output);
            expect(parsed.database.host).toBe('localhost');
        });
    });
    describe('Integration: Real-world YAML Examples', () => {
        test('should parse configuration file', () => {
            const yaml = 'server:\n  host: 0.0.0.0\n  port: 3000\ndatabase:\n  name: myapp\n  user: dbuser';
            const result = parseYaml(yaml);
            expect(result.server).toBeDefined();
            expect(result.server.host).toBe('0.0.0.0');
            expect(result.server.port).toBe('3000');
            expect(result.database.name).toBe('myapp');
        });
        test('should parse application settings', () => {
            const yaml = 'app:\n  name: MyApp\n  version: 1.0.0\nfeatures:\n- auth\n- logging\n- caching';
            const result = parseYaml(yaml);
            expect(result.app.name).toBe('MyApp');
            expect(result.features).toHaveLength(3);
        });
    });
});
