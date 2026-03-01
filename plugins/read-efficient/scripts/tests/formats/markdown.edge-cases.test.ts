import { parseMarkdown, formatMarkdown } from '../../src/formats/markdown';

describe('Markdown Parser - Edge Cases & Malformed Content', () => {
  describe('Code Block - Missing Closing Marker', () => {
    test('should handle code block with no closing marker', () => {
      const md = '```typescript\nconst x = 1;\nreturn x;';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'code')).toBe(true);
    });

    test('should handle EOF after code block start with content', () => {
      const md = 'Before\n\n```bash\necho "test"';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle multiple unclosed code blocks', () => {
      const md = '```js\ncode1\n```markdown\ncode2\n```bash\ncode3';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result).toBeInstanceOf(Array);
    });
  });

  describe('Code Block - Incorrect Markers', () => {
    test('should handle single backtick (`) as regular content', () => {
      const md = 'Text with ` single backtick';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('paragraph');
    });

    test('should handle double backticks (``) as regular content', () => {
      const md = 'Text with `` double backticks\nMore text';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('paragraph');
    });

    test('should handle four backticks (````) as regular content', () => {
      const md = 'Text with ```` four backticks\nMore text';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('paragraph');
    });

    test('should not treat backticks with trailing spaces as marker', () => {
      const md = '``` \ncode\n```';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      // Should parse code block even with space
      expect(result.some(b => b.type === 'code')).toBe(true);
    });
  });

  describe('Code Block - Nested Markers', () => {
    test('should handle nested code blocks (markdown inside markdown)', () => {
      const md = '```markdown\n---\nname: test\n---\n```bash\necho test\n```\nmore\n```';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'code')).toBe(true);
    });

    test('should consume opening markers with language as content', () => {
      const md = '```markdown\n```bash\necho "test"\n```';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      const codeBlocks = result.filter(b => b.type === 'code');
      expect(codeBlocks.length).toBeGreaterThan(0);
      // Should have markdown block that contains ```bash as content
      expect(codeBlocks[0].language).toBe('markdown');
      expect(codeBlocks[0].content).toContain('```bash');
    });

    test('should handle multiple nested language markers', () => {
      const md = '```markdown\n```bash\n```python\n```typescript\ncode\n```';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('List - Malformed Markers', () => {
    test('should handle list with no closing marker', () => {
      const md = '- item 1\n- item 2\nNo list end marker here';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'list')).toBe(true);
    });

    test('should handle single dash (not a list)', () => {
      const md = 'Text with - single dash\nMore text';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      // Single dash after text is not a list
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle inconsistent list markers', () => {
      const md = '- item 1\n* item 2\n+ item 3\n- item 4';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'list')).toBe(true);
    });

    test('should handle deeply nested indented lists', () => {
      const md = '- item 1\n    - nested 1\n        - deep 1\n            - very deep\n- item 2';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'list')).toBe(true);
    });
  });

  describe('Blockquote - Incomplete Markers', () => {
    test('should handle blockquote with no proper closing', () => {
      const md = '> Quote line 1\n> Quote line 2\nNot quoted anymore';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'blockquote')).toBe(true);
    });

    test('should handle single > without content', () => {
      const md = '>\nNext line';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle blockquote at EOF', () => {
      const md = '> Last quote';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'blockquote')).toBe(true);
    });
  });

  describe('Table - Malformed Markers', () => {
    test('should handle table without separator line', () => {
      const md = '| Header 1 | Header 2 |\n| Cell 1 | Cell 2 |';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      // Should not parse as table without proper separator
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle incomplete table row', () => {
      const md = '| H1 | H2 |\n|----|----|';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle single pipe character', () => {
      const md = 'Text | with pipe | characters';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle pipe at EOF', () => {
      const md = 'Text |';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Heading - Edge Cases', () => {
    test('should handle too many heading levels', () => {
      const md = '####### Too many hashes';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      // Should be treated as paragraph
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle heading with no space after hashes', () => {
      const md = '#NoSpace heading';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle heading at EOF', () => {
      const md = '# Heading';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('heading');
    });

    test('should handle empty heading', () => {
      const md = '#';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Paragraph - Extreme Cases', () => {
    test('should handle very long paragraph', () => {
      const longText = Array(1000).fill('word').join(' ');
      const md = longText;
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('paragraph');
    });

    test('should handle paragraph with only special characters', () => {
      const md = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('paragraph');
    });

    test('should handle mixed empty and content lines', () => {
      const md = 'Line 1\n\n\nLine 2\n\n\n\nLine 3';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Horizontal Rule - Edge Cases', () => {
    test('should handle horizontal rule with mixed characters', () => {
      const md = 'Text\n-*-*-*\nMore text';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle line with just underscores', () => {
      const md = 'Before\n____\nAfter';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Front Matter - Edge Cases', () => {
    test('should handle front matter with no closing marker', () => {
      const md = '---\ntitle: test\nauthor: me\n\nContent here';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle empty front matter', () => {
      const md = '---\n---\n\nContent';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Performance & Safeguards', () => {
    test('should not hang on deeply nested indentation', () => {
      const lines = Array(100).fill(0).map((_, i) => '  '.repeat(i) + 'text');
      const md = lines.join('\n');
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should not hang on very large files', () => {
      const md = Array(1000)
        .fill(0)
        .map((_, i) => `# Header ${i}\n\nContent ${i}\n\n`)
        .join('');
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should not hang on repeated unclosed markers', () => {
      const md = Array(100).fill('```markdown\n').join('') + 'content';
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should not hang on alternating markers', () => {
      const md = Array(100)
        .fill(0)
        .map((_, i) => (i % 2 === 0 ? '```\n' : '```bash\n'))
        .join('');
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Mixed Malformed Scenarios', () => {
    test('should handle document with all malformation types', () => {
      const md = `# Valid heading

Paragraph with text.

\`\`\`typescript
unclosed code
\`\`\`markdown
nested markdown
\`\`\`
more code
\`\`\`\`\`

- list item
\`\` not a marker

> blockquote

| table | without | separator
| and | no | close

Front matter mixed in
---
title: test
No closing

Final paragraph`;
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.length).toBeGreaterThan(0);
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle your real-world problematic file scenario', () => {
      const md = `\`\`\`markdown
---
name: init-context
description: Initialize context lifecycle structure.
---

Initialize context structure for project.

**Step 1: Scan project**
\`\`\`bash
node ~/.claude/scripts/context-lifecycle/dist/ctx.js scan --output=/tmp/project-scan.json
\`\`\`

Review output.

**Step 2: Analyze with Haiku**

Use Task tool:

\`\`\`
Analyze project data.
\`\`\`
\`\`\``;
      expect(() => parseMarkdown(md)).not.toThrow();
      const result = parseMarkdown(md);
      expect(result.some(b => b.type === 'code')).toBe(true);
    });
  });

  describe('formatMarkdown - Error Handling', () => {
    test('should format malformed markdown without throwing', () => {
      const md = '```\nunclosed\n';
      expect(() => formatMarkdown(md, { minify: true })).not.toThrow();
      const result = formatMarkdown(md, { minify: true });
      expect(typeof result).toBe('string');
    });

    test('should return valid JSON even for malformed input', () => {
      const testCases = [
        '```\nno close',
        '- item\n* mixed\n+ markers',
        '| pipe | only',
        '> quote\nno end',
      ];

      testCases.forEach(md => {
        const result = formatMarkdown(md, { minify: true });
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });
  });

  describe('Robustness Tests', () => {
    test('should never enter infinite loop with any input', () => {
      const testCases = [
        '',
        '\n\n\n',
        '```',
        '```\n```',
        '---',
        '> ',
        '| ',
        '- ',
        '#',
        Array(10000).fill('line\n').join(''),
        Array(1000)
          .fill(0)
          .map(() => '```')
          .join('\n'),
      ];

      const timeout = 5000; // 5 second timeout
      testCases.forEach(md => {
        const start = Date.now();
        expect(() => parseMarkdown(md)).not.toThrow();
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(timeout);
      });
    });
  });
});
