import { parseHtml, formatHtml, isValidHtml } from '../../src/formats/html';

describe('HTML Format Handler - Phase 3.2a', () => {
    describe('isValidHtml', () => {
        test('should validate non-empty HTML content', () => {
            expect(isValidHtml('<p>text</p>')).toBe(true);
            expect(isValidHtml('  <div></div>  ')).toBe(true);
        });

        test('should reject empty content', () => {
            expect(isValidHtml('')).toBe(false);
            expect(isValidHtml('   ')).toBe(false);
        });
    });

    describe('Visual Tag Stripping - Bold, Italic, Underline', () => {
        test('should strip <b> tags and preserve content', () => {
            const html = '<p>Start <b>bold text</b> end</p>';
            const result = parseHtml(html);
            const content = result.p;
            expect(content).toContain('bold text');
            expect(JSON.stringify(result)).not.toContain('>b<');
        });

        test('should strip <i> tags and preserve content', () => {
            const html = '<p>Start <i>italic text</i> end</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('italic text');
        });

        test('should strip <u> tags and preserve content', () => {
            const html = '<p>Start <u>underlined</u> end</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('underlined');
        });

        test('should strip <strong> tags', () => {
            const html = '<p>This is <strong>important</strong> text</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('important');
        });

        test('should strip <em> tags', () => {
            const html = '<p>This is <em>emphasized</em> text</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('emphasized');
        });

        test('should handle nested visual tags', () => {
            const html = '<p>Text with <b><i>bold and italic</i></b> content</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('bold and italic');
        });
    });

    describe('Visual Tag Stripping - Deprecated Tags', () => {
        test('should strip <font> tags', () => {
            const html = '<p>Normal <font color="red">red text</font> normal</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('red text');
            expect(JSON.stringify(result)).not.toContain('font');
        });

        test('should strip <br> tags and add space', () => {
            const html = '<p>Line one<br/>Line two</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('Line one');
            expect(result.p).toContain('Line two');
        });

        test('should strip <hr> tags', () => {
            const html = '<section><p>Above</p><hr/><p>Below</p></section>';
            const result = parseHtml(html);
            expect(result.section.p).toBeDefined();
            expect(JSON.stringify(result)).not.toContain('hr');
        });
    });

    describe('Span Tag Handling', () => {
        test('should strip <span> with no attributes', () => {
            const html = '<p>Text <span>plain span</span> more</p>';
            const result = parseHtml(html);
            expect(result.p).toContain('plain span');
            expect(JSON.stringify(result)).not.toContain('>span<');
        });

        test('should preserve <span> with class attribute', () => {
            const html = '<p>Text <span class="highlight">highlighted</span> end</p>';
            const result = parseHtml(html);
            expect(JSON.stringify(result)).toContain('span');
            expect(JSON.stringify(result)).toContain('highlight');
        });

        test('should preserve <span> with id attribute', () => {
            const html = '<p>Text <span id="marker">marked</span> end</p>';
            const result = parseHtml(html);
            expect(JSON.stringify(result)).toContain('span');
            expect(JSON.stringify(result)).toContain('marker');
        });

        test('should preserve <span> with data-* attribute', () => {
            const html = '<p>Text <span data-value="123">data span</span> end</p>';
            const result = parseHtml(html);
            expect(JSON.stringify(result)).toContain('span');
            expect(JSON.stringify(result)).toContain('data-value');
        });
    });

    describe('Script and Style Tag Removal', () => {
        test('should remove <script> tags and content entirely', () => {
            const html = '<div><p>Before</p><script>alert("test");</script><p>After</p></div>';
            const result = parseHtml(html);
            expect(JSON.stringify(result)).not.toContain('script');
            expect(JSON.stringify(result)).not.toContain('alert');
            expect(result.div.p).toBeDefined();
        });

        test('should remove <style> tags and content entirely', () => {
            const html = '<div><p>Content</p><style>body { color: red; }</style><p>More</p></div>';
            const result = parseHtml(html);
            expect(JSON.stringify(result)).not.toContain('style');
            expect(JSON.stringify(result)).not.toContain('color');
        });
    });

    describe('Unclosed Tags Auto-Closing', () => {
        test('should auto-close unclosed <p> tags', () => {
            const html = '<div><p>Paragraph 1<p>Paragraph 2</div>';
            const result = parseHtml(html);
            expect(Array.isArray(result.div.p)).toBe(true);
            expect(result.div.p.length).toBe(2);
            expect(result.div.p[0]).toBe('Paragraph 1');
            expect(result.div.p[1]).toBe('Paragraph 2');
        });

        test('should auto-close unclosed <li> tags in lists', () => {
            const html = '<ul><li>Item 1<li>Item 2<li>Item 3</ul>';
            const result = parseHtml(html);
            expect(Array.isArray(result.ul.li)).toBe(true);
            expect(result.ul.li.length).toBe(3);
            expect(result.ul.li[0]).toBe('Item 1');
            expect(result.ul.li[2]).toBe('Item 3');
        });

        test('should auto-close unclosed <tr> tags in tables', () => {
            const html = '<table><tr><td>Cell 1</td><tr><td>Cell 2</td></table>';
            const result = parseHtml(html);
            expect(result.table).toBeDefined();
            expect(Array.isArray(result.table.tr)).toBe(true);
        });

        test('should auto-close unclosed <td> tags', () => {
            const html = '<table><tr><td>Data 1<td>Data 2</tr></table>';
            const result = parseHtml(html);
            expect(result.table.tr).toBeDefined();
        });
    });

    describe('Real-World HTML Patterns', () => {
        test('should parse blog post HTML correctly', () => {
            const html = `
                <article>
                    <h1>Blog Title</h1>
                    <p>Introduction with <strong>important</strong> content.</p>
                    <section>
                        <h2>First Section</h2>
                        <p>Content here.</p>
                    </section>
                </article>
            `;
            const result = parseHtml(html);
            expect(result.article.h1).toBe('Blog Title');
            expect(result.article.section.h2).toBe('First Section');
            expect(result.article.section.p).toBe('Content here.');
        });

        test('should parse documentation with code blocks', () => {
            const html = `
                <div>
                    <h1>API Documentation</h1>
                    <p>Use <code>function()</code> to call the API.</p>
                </div>
            `;
            const result = parseHtml(html);
            expect(result.div.h1).toBe('API Documentation');
            expect(result.div.p.code).toBe('function()');
        });

        test('should parse HTML with mixed visual and semantic tags', () => {
            const html = `
                <section>
                    <p>Regular text <b>bold</b> <strong>important</strong> <u>underline</u> <code>code</code> end.</p>
                </section>
            `;
            const result = parseHtml(html);
            expect(result.section.p._text).toContain('Regular text');
            expect(result.section.p.code).toBe('code');
        });

        test('should parse lists with formatting', () => {
            const html = `
                <ul>
                    <li>Item with <b>bold</b></li>
                    <li>Normal item</li>
                    <li>Item with <em>emphasis</em></li>
                </ul>
            `;
            const result = parseHtml(html);
            expect(Array.isArray(result.ul.li)).toBe(true);
            expect(result.ul.li.length).toBe(3);
        });

        test('should parse nested divs with semantic attributes', () => {
            const html = `
                <div class="container">
                    <div id="header" class="header-section">
                        <h1>Title</h1>
                    </div>
                    <div class="content">
                        <p>Content here</p>
                    </div>
                </div>
            `;
            const result = parseHtml(html);
            expect(result.div).toBeDefined();
            expect(JSON.stringify(result)).toContain('container');
            expect(JSON.stringify(result)).toContain('header-section');
        });
    });

    describe('Malformed HTML Graceful Degradation', () => {
        test('should handle missing closing tags gracefully', () => {
            const html = '<div><p>Unclosed paragraph</div>';
            const result = parseHtml(html);
            expect(result).not.toHaveProperty('error');
            expect(result.div.p).toBeDefined();
        });

        test('should handle mixed content with unclosed tags', () => {
            const html = '<div><p>Text 1<p>Text 2</p></div>';
            const result = parseHtml(html);
            expect(result.div).toBeDefined();
            expect(result.div.p).toBeDefined();
        });

        test('should strip script tags even in malformed HTML', () => {
            const html = '<div><script>console.log("test");</p></div>';
            const result = parseHtml(html);
            expect(JSON.stringify(result)).not.toContain('script');
            expect(JSON.stringify(result)).not.toContain('console');
        });

        test('should handle deeply nested structures', () => {
            let html = '<root>';
            for (let i = 0; i < 20; i++) {
                html += `<div><p>Level ${i}</p>`;
            }
            for (let i = 0; i < 20; i++) {
                html += '</div>';
            }
            html += '</root>';
            const result = parseHtml(html);
            expect(result).not.toHaveProperty('error');
            expect(result.root).toBeDefined();
        });

        test('should handle empty elements', () => {
            const html = '<div><p></p><section><p></p></section></div>';
            const result = parseHtml(html);
            expect(result.div).toBeDefined();
            expect(result.div.section).toBeDefined();
        });

        test('should strip visual tags in nested content', () => {
            const html = '<div><p>Text <b><i><u>nested</u></i></b> end</p></div>';
            const result = parseHtml(html);
            expect(result.div.p).toContain('nested');
        });
    });

    describe('formatHtml - Output Formatting', () => {
        test('should output minified JSON by default', () => {
            const html = '<div>\n  <p>text</p>\n</div>';
            const result = formatHtml(html, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed.div.p).toBe('text');
            expect(result).not.toContain('\n');
        });

        test('should output pretty JSON when minify is false', () => {
            const html = '<div><p>text</p></div>';
            const result = formatHtml(html, { minify: false });
            expect(result).toContain('\n');
            const parsed = JSON.parse(result);
            expect(parsed.div.p).toBe('text');
        });

        test('should preserve information through formatting', () => {
            const html = '<div><h1>Title</h1><p>Content</p></div>';
            const result = formatHtml(html, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed.div.h1).toBe('Title');
            expect(parsed.div.p).toBe('Content');
        });
    });

    describe('Token Efficiency - Real-World Patterns', () => {
        test('should remove visual markup from large content', () => {
            const htmlWithMarkup = `
                <article>
                    <h1>Article Title</h1>
                    <p>Paragraph with <b>bold</b>, <i>italic</i>, <u>underlined</u>, and <font>font</font> tags.</p>
                    <section>
                        <h2>Section</h2>
                        <ul>
                            <li>Item with <strong>emphasis</strong></li>
                            <li>Another <em>item</em></li>
                        </ul>
                    </section>
                </article>
            `;
            const result = formatHtml(htmlWithMarkup, { minify: true });
            const parsed = JSON.parse(result);

            // Verify structure preserved
            expect(parsed.article.h1).toBe('Article Title');
            expect(parsed.article.section.h2).toBe('Section');

            // Verify visual tags stripped
            expect(result).not.toContain('<b>');
            expect(result).not.toContain('<i>');
            expect(result).not.toContain('<font>');
        });

        test('should handle large HTML documents efficiently', () => {
            let html = '<document>';
            for (let i = 0; i < 50; i++) {
                html += `<section><h2>Section ${i}</h2><p>Content with <b>bold</b> and <i>italic</i></p></section>`;
            }
            html += '</document>';

            const result = formatHtml(html, { minify: true });
            const parsed = JSON.parse(result);

            expect(parsed.document.section).toBeDefined();
            expect(Array.isArray(parsed.document.section)).toBe(true);
        });
    });

    describe('Integration - Complex HTML Transformations', () => {
        test('should transform complete article to clean JSON', () => {
            const html = `
                <article id="main-article" class="post">
                    <header>
                        <h1>Article Title</h1>
                        <p>By <span class="author">John Doe</span> on <span class="date">2025-12-08</span></p>
                    </header>
                    <section class="content">
                        <p>Introduction with <strong>important</strong> information.</p>
                        <ul>
                            <li>First point with <em>emphasis</em></li>
                            <li>Second point</li>
                        </ul>
                    </section>
                </article>
            `;

            const result = parseHtml(html);

            // Verify structure
            expect(result.article).toBeDefined();
            expect(result.article.header.h1).toBe('Article Title');

            // Verify attributes preserved
            expect(JSON.stringify(result)).toContain('class');
            expect(JSON.stringify(result)).toContain('post');
        });

        test('should handle HTML with data attributes', () => {
            const html = `
                <div data-section="main">
                    <p>Content</p>
                    <span data-id="123" data-type="tag">Tagged</span>
                </div>
            `;

            const result = parseHtml(html);
            expect(JSON.stringify(result)).toContain('data-section');
            expect(JSON.stringify(result)).toContain('data-id');
        });

        test('should efficiently compress blog HTML with minimal token overhead', () => {
            const html = `
                <article>
                    <h1>Understanding Async/Await</h1>
                    <p>This guide explains <strong>async/await</strong> patterns in JavaScript.</p>
                    <section>
                        <h2>Basic Concepts</h2>
                        <p>Use <code>async function()</code> to define async functions.</p>
                        <ul>
                            <li><b>async</b> keyword makes function return Promise</li>
                            <li><b>await</b> pauses execution until Promise resolves</li>
                        </ul>
                    </section>
                </article>
            `;

            const result = formatHtml(html, { minify: true });
            const uncompressed = JSON.stringify(html);

            expect(result.length).toBeLessThan(uncompressed.length);
            expect(JSON.parse(result).article).toBeDefined();
        });
    });
});
