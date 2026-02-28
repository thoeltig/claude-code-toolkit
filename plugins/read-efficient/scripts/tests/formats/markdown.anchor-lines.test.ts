import { parseMarkdown } from '../../src/formats/markdown';

describe('Markdown Anchor Lines', () => {
  describe('Single Block Types - Anchor Line Tracking', () => {
    test('should track anchor line for heading at start', () => {
      const md = '# Title';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for heading after blank line', () => {
      const md = '\n# Title';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(2);
    });

    test('should track anchor line for paragraph', () => {
      const md = 'This is a paragraph.';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for code block', () => {
      const md = '```typescript\nconst x = 1;\n```';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for list', () => {
      const md = '- item 1\n- item 2';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for blockquote', () => {
      const md = '> Quote text';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for table', () => {
      const md = '| Header |\n|--------|\n| Cell   |';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for horizontal rule', () => {
      const md = '---';
      const result = parseMarkdown(md);
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for front matter', () => {
      const md = '---\ntitle: Test\n---\n\nContent';
      const result = parseMarkdown(md);
      expect(result[0].type).toBe('frontmatter');
      expect(result[0].anchor_line).toBe(1);
    });
  });

  describe('Multiple Block Types - Sequential Anchor Lines', () => {
    test('should track anchor lines for multiple blocks in sequence', () => {
      const md = '# Title\n\nParagraph text.\n\n- item 1\n- item 2';
      const result = parseMarkdown(md);

      const heading = result.find(b => b.type === 'heading');
      const paragraph = result.find(b => b.type === 'paragraph');
      const list = result.find(b => b.type === 'list');

      expect(heading.anchor_line).toBe(1);
      expect(paragraph.anchor_line).toBe(3);
      expect(list.anchor_line).toBe(5);
    });

    test('should track anchor lines correctly with multiple heading levels', () => {
      const md = '# H1\n\n## H2\n\n### H3';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
      expect(result[1].anchor_line).toBe(3);
      expect(result[2].anchor_line).toBe(5);
    });

    test('should track anchor lines for code blocks with surrounding content', () => {
      const md = 'Before\n\n```js\ncode\n```\n\nAfter';
      const result = parseMarkdown(md);

      const before = result[0];
      const code = result.find(b => b.type === 'code');
      const after = result.find(b => b.type === 'paragraph' && b.content === 'After');

      expect(before.anchor_line).toBe(1);
      expect(code.anchor_line).toBe(3);
      expect(after.anchor_line).toBe(7);
    });
  });

  describe('Complex Document - Realistic Anchor Lines', () => {
    test('should track anchor lines in README-style document', () => {
      const md = `# Project Name

## Description
This is a test project.

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
- Clone the repo
- Install dependencies
- Run build

## License
MIT`;

      const result = parseMarkdown(md);

      const h1 = result.find(b => b.type === 'heading' && b.level === 1);
      const h2_desc = result.find(b => b.type === 'heading' && b.content === 'Description');
      const h2_install = result.find(b => b.type === 'heading' && b.content === 'Installation');
      const codeblock = result.find(b => b.type === 'code');
      const h2_usage = result.find(b => b.type === 'heading' && b.content === 'Usage');
      const list = result.find(b => b.type === 'list');
      const h2_license = result.find(b => b.type === 'heading' && b.content === 'License');

      expect(h1.anchor_line).toBe(1);
      expect(h2_desc.anchor_line).toBe(3);
      expect(h2_install.anchor_line).toBe(6);
      expect(codeblock.anchor_line).toBe(7);
      expect(h2_usage.anchor_line).toBe(11);
      expect(list.anchor_line).toBe(12);
      expect(h2_license.anchor_line).toBe(16);
    });

    test('should track anchor lines with mixed content types', () => {
      const md = `# API Documentation

## GET /users/:id

> Retrieve user by ID

| Param | Type   |
|-------|--------|
| id    | string |

\`\`\`bash
curl -X GET /users/123
\`\`\``;

      const result = parseMarkdown(md);

      const title = result.find(b => b.type === 'heading' && b.level === 1);
      const endpoint = result.find(b => b.type === 'heading' && b.level === 2);
      const quote = result.find(b => b.type === 'blockquote');
      const table = result.find(b => b.type === 'table');
      const code = result.find(b => b.type === 'code');

      expect(title.anchor_line).toBe(1);
      expect(endpoint.anchor_line).toBe(3);
      expect(quote.anchor_line).toBe(5);
      expect(table.anchor_line).toBe(7);
      expect(code.anchor_line).toBe(11);
    });
  });

  describe('Edge Cases - Anchor Line Accuracy', () => {
    test('should track anchor line for code block with blank line before', () => {
      const md = 'Text\n\n```\ncode\n```';
      const result = parseMarkdown(md);

      const code = result.find(b => b.type === 'code');
      expect(code.anchor_line).toBe(3);
    });

    test('should track anchor line for block after multiple blank lines', () => {
      const md = 'Line 1\n\n\n\nLine 5';
      const result = parseMarkdown(md);

      expect(result[1].anchor_line).toBe(5);
    });

    test('should track anchor line for blockquote spanning multiple lines', () => {
      const md = '> Line 1\n> Line 2\n> Line 3';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for table with multiple rows', () => {
      const md = '| Col1 | Col2 |\n|------|------|\n| A    | B    |\n| C    | D    |';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for list with multiple items', () => {
      const md = '- item 1\n- item 2\n- item 3\n- item 4';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line correctly with nested indentation (even if not parsed as nested)', () => {
      const md = '- item 1\n  - nested 1\n  - nested 2\n- item 2';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
    });
  });

  describe('Front Matter and Content - Anchor Lines', () => {
    test('should track front matter and subsequent content with correct anchor lines', () => {
      const md = '---\ntitle: Test\nauthor: User\n---\n\n# Main Title';
      const result = parseMarkdown(md);

      const frontmatter = result.find(b => b.type === 'frontmatter');
      const heading = result.find(b => b.type === 'heading');

      expect(frontmatter.anchor_line).toBe(1);
      expect(heading.anchor_line).toBe(6);
    });

    test('should track anchor lines with content immediately after front matter', () => {
      const md = '---\nkey: value\n---\n# Heading';
      const result = parseMarkdown(md);

      const frontmatter = result.find(b => b.type === 'frontmatter');
      const heading = result.find(b => b.type === 'heading');

      expect(frontmatter.anchor_line).toBe(1);
      expect(heading.anchor_line).toBe(4);
    });
  });

  describe('Heading Levels - Anchor Lines', () => {
    test('should track anchor lines for all heading levels', () => {
      const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
      expect(result[1].anchor_line).toBe(2);
      expect(result[2].anchor_line).toBe(3);
      expect(result[3].anchor_line).toBe(4);
      expect(result[4].anchor_line).toBe(5);
      expect(result[5].anchor_line).toBe(6);
    });
  });

  describe('Paragraph Continuation - Anchor Lines', () => {
    test('should track anchor line for paragraph with wrapped lines', () => {
      const md = 'This is line 1\nThis is line 2\nThis is line 3';
      const result = parseMarkdown(md);

      expect(result[0].type).toBe('paragraph');
      expect(result[0].anchor_line).toBe(1);
    });

    test('should track anchor line for each separate paragraph', () => {
      const md = 'Paragraph 1 content\n\nParagraph 2 content\n\nParagraph 3 content';
      const result = parseMarkdown(md);

      expect(result[0].anchor_line).toBe(1);
      expect(result[1].anchor_line).toBe(3);
      expect(result[2].anchor_line).toBe(5);
    });
  });

  describe('Practical Navigation Scenarios', () => {
    test('should enable accurate line-by-line navigation for edit operations', () => {
      const md = `# Title

Content paragraph.

## Section

- Item 1
- Item 2`;

      const result = parseMarkdown(md);

      // User can now reference blocks by anchor_line
      const title = result.find(b => b.anchor_line === 1);
      const section = result.find(b => b.anchor_line === 5);
      const list = result.find(b => b.anchor_line === 7);

      expect(title.type).toBe('heading');
      expect(title.level).toBe(1);
      expect(section.type).toBe('heading');
      expect(section.level).toBe(2);
      expect(list.type).toBe('list');
      expect(list.items).toHaveLength(2);
    });

    test('should enable precise line references in feedback to user', () => {
      const md = '# Heading\n\nContent\n\n```js\ncode\n```';
      const result = parseMarkdown(md);

      // Can tell user exactly where blocks start in original file
      const blocks = result.map(b => ({
        type: b.type,
        line: b.anchor_line,
        preview: b.content || b.language || 'N/A'
      }));

      const headingBlock = blocks.find(b => b.type === 'heading');
      const codeBlock = blocks.find(b => b.type === 'code');

      expect(headingBlock).toEqual({
        type: 'heading',
        line: 1,
        preview: 'Heading'
      });

      expect(codeBlock).toEqual({
        type: 'code',
        line: 5,
        preview: 'code'
      });
    });
  });

  describe('Consistency - All Block Types Have Anchor Lines', () => {
    test('every parsed block should have an anchor_line field', () => {
      const md = `---
frontmatter: value
---

# Heading

Paragraph text.

\`\`\`code
content
\`\`\`

- list item

> blockquote

| Header |
|--------|
| Cell   |

---`;

      const result = parseMarkdown(md);

      // Every block should have anchor_line
      result.forEach(block => {
        expect(block).toHaveProperty('anchor_line');
        expect(typeof block.anchor_line).toBe('number');
        expect(block.anchor_line).toBeGreaterThan(0);
      });
    });

    test('anchor_line values should be 1-indexed (user-friendly)', () => {
      const md = '# Line 1\n\nContent on line 3';
      const result = parseMarkdown(md);

      result.forEach(block => {
        // Should be 1-indexed, not 0-indexed
        expect(block.anchor_line).toBeGreaterThanOrEqual(1);
      });
    });

    test('anchor_line values should match actual line positions in original markdown', () => {
      const lines = [
        '# Title',           // line 1
        '',                  // line 2
        'Content',           // line 3
        '',                  // line 4
        '```js',             // line 5
        'code',              // line 6
        '```'                // line 7
      ];

      const md = lines.join('\n');
      const result = parseMarkdown(md);

      const heading = result.find(b => b.type === 'heading');
      const paragraph = result.find(b => b.type === 'paragraph');
      const code = result.find(b => b.type === 'code');

      expect(heading.anchor_line).toBe(1);
      expect(paragraph.anchor_line).toBe(3);
      expect(code.anchor_line).toBe(5);
    });
  });
});
