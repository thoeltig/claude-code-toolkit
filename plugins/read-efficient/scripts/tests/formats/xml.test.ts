import { parseXml, formatXml, isValidXml } from '../../src/formats/xml';

describe('XML Format Handler - Flattened', () => {
    describe('isValidXml', () => {
        test('should validate non-empty XML content', () => {
            expect(isValidXml('<root></root>')).toBe(true);
            expect(isValidXml('  <root></root>  ')).toBe(true);
        });

        test('should reject empty content', () => {
            expect(isValidXml('')).toBe(false);
            expect(isValidXml('   ')).toBe(false);
        });
    });

    describe('parseXml - Basic Elements', () => {
        test('should parse simple text element', () => {
            const xml = '<root>Hello World</root>';
            const result = parseXml(xml);
            expect(result.root).toBe('Hello World');
        });

        test('should parse empty element', () => {
            const xml = '<root></root>';
            const result = parseXml(xml);
            expect(result.root).toEqual({});
        });

        test('should parse self-closing element', () => {
            const xml = '<root/>';
            const result = parseXml(xml);
            expect(result.root).toEqual({});
        });

        test('should parse nested elements with text', () => {
            const xml = '<root><child>text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBe('text');
        });

        test('should parse multiple child elements as array', () => {
            const xml = '<root><item>1</item><item>2</item><item>3</item></root>';
            const result = parseXml(xml);
            expect(Array.isArray(result.root.item)).toBe(true);
            expect(result.root.item.length).toBe(3);
            expect(result.root.item[0]).toBe('1');
            expect(result.root.item[2]).toBe('3');
        });

        test('should parse deeply nested elements', () => {
            const xml = '<root><a><b><c><d>deep</d></c></b></a></root>';
            const result = parseXml(xml);
            expect(result.root.a.b.c.d).toBe('deep');
        });
    });

    describe('parseXml - Attributes', () => {
        test('should parse single attribute with text content', () => {
            const xml = '<root id="123">text</root>';
            const result = parseXml(xml);
            expect(result.root.attribute_id).toBe('123');
            expect(result.root._text).toBe('text');
        });

        test('should parse multiple attributes', () => {
            const xml = '<root id="1" name="test" version="2.0">content</root>';
            const result = parseXml(xml);
            expect(result.root.attribute_id).toBe('1');
            expect(result.root.attribute_name).toBe('test');
            expect(result.root.attribute_version).toBe('2.0');
            expect(result.root._text).toBe('content');
        });

        test('should parse attributes with single quotes', () => {
            const xml = "<root id='456'>text</root>";
            const result = parseXml(xml);
            expect(result.root.attribute_id).toBe('456');
        });

        test('should parse empty attribute value', () => {
            const xml = '<root id="">empty attr</root>';
            const result = parseXml(xml);
            expect(result.root.attribute_id).toBe('');
        });

        test('should not prefix attributes on text-only elements', () => {
            const xml = '<root id="1"><title>Guide</title></root>';
            const result = parseXml(xml);
            expect(result.root.attribute_id).toBe('1');
            expect(result.root.title).toBe('Guide');
        });

        test('should handle attributes without text content', () => {
            const xml = '<root id="123" name="test"></root>';
            const result = parseXml(xml);
            expect(result.root.attribute_id).toBe('123');
            expect(result.root.attribute_name).toBe('test');
            expect(result.root._text).toBeUndefined();
        });
    });

    describe('parseXml - Namespaces', () => {
        test('should preserve namespace prefixes', () => {
            const xml = '<root><ns:element>content</ns:element></root>';
            const result = parseXml(xml);
            expect(result.root['ns:element']).toBe('content');
        });

        test('should preserve namespace in attributes', () => {
            const xml = '<root xmlns:custom="http://example.com"><child custom:id="1">text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child['attribute_custom:id']).toBe('1');
            expect(result.root.child._text).toBe('text');
        });

        test('should handle multiple namespace prefixes', () => {
            const xml = '<root><ns1:elem1>text1</ns1:elem1><ns2:elem2>text2</ns2:elem2></root>';
            const result = parseXml(xml);
            expect(result.root['ns1:elem1']).toBe('text1');
            expect(result.root['ns2:elem2']).toBe('text2');
        });
    });

    describe('parseXml - CDATA Sections', () => {
        test('should parse CDATA content', () => {
            const xml = '<root><![CDATA[This is <not> XML content]]></root>';
            const result = parseXml(xml);
            expect(result.root).toContain('This is <not> XML content');
        });

        test('should preserve special characters in CDATA', () => {
            const xml = '<root><![CDATA[<tag attr="value">text</tag>]]></root>';
            const result = parseXml(xml);
            expect(result.root).toContain('<tag attr="value">text</tag>');
        });

        test('should handle CDATA with newlines', () => {
            const xml = `<root><![CDATA[
                Line 1
                Line 2
            ]]></root>`;
            const result = parseXml(xml);
            expect(result.root).toBeDefined();
            expect(typeof result.root).toBe('string');
        });
    });

    describe('parseXml - Comments', () => {
        test('should skip XML comments', () => {
            const xml = '<root><!-- comment --><child>text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBe('text');
        });

        test('should skip multiple comments', () => {
            const xml = '<!-- c1 --><root><!-- c2 --><child>text</child><!-- c3 --></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBe('text');
        });
    });

    describe('parseXml - Processing Instructions', () => {
        test('should skip XML declaration', () => {
            const xml = '<?xml version="1.0" encoding="UTF-8"?><root>text</root>';
            const result = parseXml(xml);
            expect(result.root).toBe('text');
        });

        test('should skip processing instructions', () => {
            const xml = '<?xml version="1.0"?><?custom directive?><root>text</root>';
            const result = parseXml(xml);
            expect(result.root).toBe('text');
        });
    });

    describe('parseXml - Edge Cases', () => {
        test('should handle element names with numbers', () => {
            const xml = '<root><item1>text1</item1><item2>text2</item2></root>';
            const result = parseXml(xml);
            expect(result.root.item1).toBe('text1');
            expect(result.root.item2).toBe('text2');
        });

        test('should handle element names with hyphens', () => {
            const xml = '<root><my-element>text</my-element></root>';
            const result = parseXml(xml);
            expect(result.root['my-element']).toBe('text');
        });

        test('should handle element names with dots', () => {
            const xml = '<root><elem.name>text</elem.name></root>';
            const result = parseXml(xml);
            expect(result.root['elem.name']).toBe('text');
        });

        test('should skip leading/trailing whitespace', () => {
            const xml = '   <root>   text   </root>   ';
            const result = parseXml(xml);
            expect(result.root).toBe('text');
        });

        test('should handle very deeply nested structure', () => {
            let xml = '<root>';
            for (let i = 0; i < 50; i++) {
                xml += `<level${i}>`;
            }
            xml += 'deep';
            for (let i = 49; i >= 0; i--) {
                xml += `</level${i}>`;
            }
            xml += '</root>';
            const result = parseXml(xml);
            expect(result).toHaveProperty('root');
            expect(result).not.toHaveProperty('error');
        });

        test('should handle large number of siblings', () => {
            let xml = '<root>';
            for (let i = 0; i < 100; i++) {
                xml += `<item>text${i}</item>`;
            }
            xml += '</root>';
            const result = parseXml(xml);
            expect(Array.isArray(result.root.item)).toBe(true);
            expect(result.root.item.length).toBe(100);
        });
    });

    describe('parseXml - Malformed XML Graceful Degradation', () => {
        test('should handle missing closing tags', () => {
            const xml = '<root><child>text</root>';
            const result = parseXml(xml);
            expect(result).not.toHaveProperty('error');
            expect(result.root).toBeDefined();
        });

        test('should handle unclosed root element', () => {
            const xml = '<root><child>text</child>';
            const result = parseXml(xml);
            expect(result).toBeDefined();
        });

        test('should return error for empty content', () => {
            const xml = '';
            const result = parseXml(xml);
            expect(result).toHaveProperty('error');
        });

        test('should return error if no valid root', () => {
            const xml = '<!-- only comment -->';
            const result = parseXml(xml);
            expect(result).toHaveProperty('error');
        });

        test('should handle text before root element', () => {
            const xml = 'junk <root>valid</root>';
            const result = parseXml(xml);
            expect(result.root).toBe('valid');
        });

        test('should handle incomplete XML declaration', () => {
            const xml = '<?xml <root>text</root>';
            const result = parseXml(xml);
            // htmlparser2 treats this as truly malformed XML and cannot recover
            // This is more strict than the old parser, but more correct
            expect(result).toHaveProperty('error');
        });

        test('should handle malformed attributes', () => {
            const xml = '<root id=123 name="test">text</root>';
            const result = parseXml(xml);
            expect(result.root._text).toBe('text');
        });

        test('should handle multiple root elements', () => {
            const xml = '<root1>text1</root1><root2>text2</root2>';
            const result = parseXml(xml);
            expect(result.root1).toBe('text1');
        });
    });

    describe('parseXml - Real-world Examples', () => {
        test('should parse Maven POM-like structure', () => {
            const xml = `<?xml version="1.0"?>
            <project>
                <modelVersion>4.0.0</modelVersion>
                <groupId>com.example</groupId>
                <artifactId>my-app</artifactId>
                <version>1.0</version>
            </project>`;
            const result = parseXml(xml);
            expect(result.project.modelVersion).toBe('4.0.0');
            expect(result.project.groupId).toBe('com.example');
            expect(result.project.artifactId).toBe('my-app');
            expect(result.project.version).toBe('1.0');
        });

        test('should parse catalog with attributes', () => {
            const xml = `<catalog>
                <book id="1" author="Author1">
                    <title>Book 1</title>
                    <price>10.00</price>
                </book>
                <book id="2" author="Author2">
                    <title>Book 2</title>
                    <price>15.00</price>
                </book>
            </catalog>`;
            const result = parseXml(xml);
            expect(Array.isArray(result.catalog.book)).toBe(true);
            expect(result.catalog.book[0].attribute_id).toBe('1');
            expect(result.catalog.book[0].title).toBe('Book 1');
            expect(result.catalog.book[0].price).toBe('10.00');
            expect(result.catalog.book[1].attribute_id).toBe('2');
        });

        test('should parse RSS feed structure', () => {
            const xml = `<rss version="2.0">
                <channel>
                    <title>News</title>
                    <link>http://example.com</link>
                    <item>
                        <title>Article 1</title>
                        <link>http://example.com/1</link>
                    </item>
                    <item>
                        <title>Article 2</title>
                        <link>http://example.com/2</link>
                    </item>
                </channel>
            </rss>`;
            const result = parseXml(xml);
            expect(result.rss.attribute_version).toBe('2.0');
            expect(result.rss.channel.title).toBe('News');
            expect(Array.isArray(result.rss.channel.item)).toBe(true);
            expect(result.rss.channel.item[0].title).toBe('Article 1');
        });

        test('should parse SVG structure with attributes', () => {
            const xml = `<svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="blue"/>
                <rect x="10" y="10" width="30" height="30" fill="red"/>
            </svg>`;
            const result = parseXml(xml);
            expect(result.svg.attribute_width).toBe('100');
            expect(result.svg.attribute_height).toBe('100');
            expect(result.svg.circle.attribute_r).toBe('40');
            expect(result.svg.rect.attribute_fill).toBe('red');
        });

        test('should parse nested configuration', () => {
            const xml = `<config>
                <database host="localhost" port="5432">
                    <username>admin</username>
                    <password>secret</password>
                </database>
            </config>`;
            const result = parseXml(xml);
            expect(result.config.database.attribute_host).toBe('localhost');
            expect(result.config.database.attribute_port).toBe('5432');
            expect(result.config.database.username).toBe('admin');
            expect(result.config.database.password).toBe('secret');
        });
    });

    describe('formatXml - Output Formatting', () => {
        test('should output minified JSON by default', () => {
            const xml = '<root>\n  <child>text</child>\n</root>';
            const result = formatXml(xml, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed.root.child).toBe('text');
            expect(result).not.toContain('\n');
        });

        test('should output pretty JSON when minify is false', () => {
            const xml = '<root><child>text</child></root>';
            const result = formatXml(xml, { minify: false });
            expect(result).toContain('\n');
            const parsed = JSON.parse(result);
            expect(parsed.root.child).toBe('text');
        });

        test('should return error object for invalid XML', () => {
            const xml = 'not xml';
            const result = formatXml(xml, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed).toHaveProperty('error');
        });
    });

    describe('Integration - Complex Scenarios', () => {
        test('should handle deeply nested structure with attributes', () => {
            const xml = `<root>
                <section id="intro">
                    <h1>Title</h1>
                    <p>Paragraph</p>
                </section>
            </root>`;
            const result = parseXml(xml);
            expect(result.root.section.attribute_id).toBe('intro');
            expect(result.root.section.h1).toBe('Title');
            expect(result.root.section.p).toBe('Paragraph');
        });

        test('should preserve information through format conversion', () => {
            const xml = '<root><item id="1" type="test">Content</item></root>';
            const formatted = formatXml(xml, { minify: true });
            const parsed = JSON.parse(formatted);
            expect(parsed.root.item.attribute_id).toBe('1');
            expect(parsed.root.item.attribute_type).toBe('test');
            expect(parsed.root.item._text).toBe('Content');
        });

        test('should handle multiple attributes and child elements', () => {
            const xml = `<article id="main" class="content">
                <header>News</header>
                <body>Text</body>
                <footer>Info</footer>
            </article>`;
            const result = parseXml(xml);
            expect(result.article.attribute_id).toBe('main');
            expect(result.article.attribute_class).toBe('content');
            expect(result.article.header).toBe('News');
            expect(result.article.body).toBe('Text');
            expect(result.article.footer).toBe('Info');
        });

        test('should efficiently handle data with many attributes', () => {
            const xml = `<record id="1" name="John" age="30" email="john@example.com" status="active">
                <address>123 Street</address>
                <phone>555-1234</phone>
            </record>`;
            const result = parseXml(xml);
            expect(result.record.attribute_id).toBe('1');
            expect(result.record.attribute_name).toBe('John');
            expect(result.record.attribute_age).toBe('30');
            expect(result.record.address).toBe('123 Street');
            expect(result.record.phone).toBe('555-1234');
        });

        test('should parse large XML structure efficiently', () => {
            let xml = '<root>';
            for (let i = 0; i < 20; i++) {
                xml += `<record id="${i}" name="Item${i}"><value>${i * 100}</value></record>`;
            }
            xml += '</root>';
            const result = parseXml(xml);
            expect(Array.isArray(result.root.record)).toBe(true);
            expect(result.root.record.length).toBe(20);
            expect(result.root.record[0].attribute_id).toBe('0');
            expect(result.root.record[5].attribute_id).toBe('5');
        });
    });
});
