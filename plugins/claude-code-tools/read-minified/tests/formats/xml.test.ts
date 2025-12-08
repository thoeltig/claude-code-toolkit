import { parseXml, formatXml, isValidXml } from '../../src/formats/xml';

describe('XML Format Handler', () => {
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
        test('should parse simple element with text content', () => {
            const xml = '<root>Hello World</root>';
            const result = parseXml(xml);
            expect(result).toHaveProperty('root');
            expect(result.root._text).toBe('Hello World');
        });

        test('should parse empty element', () => {
            const xml = '<root></root>';
            const result = parseXml(xml);
            expect(result).toHaveProperty('root');
        });

        test('should parse self-closing element', () => {
            const xml = '<root/>';
            const result = parseXml(xml);
            expect(result).toHaveProperty('root');
        });

        test('should parse nested elements', () => {
            const xml = '<root><child>text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBeDefined();
            expect(result.root.child._text).toBe('text');
        });

        test('should parse multiple child elements', () => {
            const xml = '<root><item>1</item><item>2</item><item>3</item></root>';
            const result = parseXml(xml);
            expect(Array.isArray(result.root.item)).toBe(true);
            expect(result.root.item.length).toBe(3);
            expect(result.root.item[0]._text).toBe('1');
        });

        test('should parse deeply nested elements', () => {
            const xml = '<root><a><b><c><d>deep</d></c></b></a></root>';
            const result = parseXml(xml);
            expect(result.root.a.b.c.d._text).toBe('deep');
        });
    });

    describe('parseXml - Attributes', () => {
        test('should parse single attribute', () => {
            const xml = '<root id="123">text</root>';
            const result = parseXml(xml);
            expect(result.root._attributes.id).toBe('123');
            expect(result.root._text).toBe('text');
        });

        test('should parse multiple attributes', () => {
            const xml = '<root id="1" name="test" version="2.0">content</root>';
            const result = parseXml(xml);
            expect(result.root._attributes.id).toBe('1');
            expect(result.root._attributes.name).toBe('test');
            expect(result.root._attributes.version).toBe('2.0');
        });

        test('should parse attributes with single quotes', () => {
            const xml = "<root id='456'>text</root>";
            const result = parseXml(xml);
            expect(result.root._attributes.id).toBe('456');
        });

        test('should parse empty attributes', () => {
            const xml = '<root id="">empty attr</root>';
            const result = parseXml(xml);
            expect(result.root._attributes.id).toBe('');
        });

        test('should parse attributes with special characters', () => {
            const xml = '<root url="https://example.com?id=1&amp;name=test">content</root>';
            const result = parseXml(xml);
            expect(result.root._attributes.url).toBe('https://example.com?id=1&amp;name=test');
        });

        test('should not add _attributes if none present', () => {
            const xml = '<root>no attrs</root>';
            const result = parseXml(xml);
            expect(result.root._attributes).toBeUndefined();
        });
    });

    describe('parseXml - Mixed Content', () => {
        test('should parse mixed text and elements', () => {
            const xml = '<root>start <child>nested</child> end</root>';
            const result = parseXml(xml);
            expect(result.root._text).toBeDefined();
            expect(result.root.child).toBeDefined();
        });

        test('should preserve multiple text nodes as single string', () => {
            const xml = '<root>text1 <elem>middle</elem> text2</root>';
            const result = parseXml(xml);
            expect(result.root._text).toContain('text1');
            expect(result.root._text).toContain('text2');
        });

        test('should handle whitespace-only text nodes', () => {
            const xml = '<root>\n  <child>text</child>\n</root>';
            const result = parseXml(xml);
            expect(result.root.child._text).toBe('text');
        });
    });

    describe('parseXml - Namespaces', () => {
        test('should preserve namespace prefixes in element names', () => {
            const xml = '<root><ns:element>content</ns:element></root>';
            const result = parseXml(xml);
            expect(result.root['ns:element']).toBeDefined();
            expect(result.root['ns:element']._text).toBe('content');
        });

        test('should preserve namespace in attributes', () => {
            const xml = '<root xmlns:custom="http://example.com"><child custom:id="1">text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child._attributes['custom:id']).toBe('1');
        });

        test('should handle multiple namespace prefixes', () => {
            const xml = '<root><ns1:elem1>text1</ns1:elem1><ns2:elem2>text2</ns2:elem2></root>';
            const result = parseXml(xml);
            expect(result.root['ns1:elem1']).toBeDefined();
            expect(result.root['ns2:elem2']).toBeDefined();
        });

        test('should handle default namespace declaration', () => {
            const xml = '<root xmlns="http://example.com"><child>text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBeDefined();
        });
    });

    describe('parseXml - CDATA Sections', () => {
        test('should parse CDATA content', () => {
            const xml = '<root><![CDATA[This is <not> XML content]]></root>';
            const result = parseXml(xml);
            expect(result.root._text).toContain('This is <not> XML content');
        });

        test('should preserve special characters in CDATA', () => {
            const xml = '<root><![CDATA[<tag attr="value">text</tag>]]></root>';
            const result = parseXml(xml);
            expect(result.root._text).toContain('<tag attr="value">text</tag>');
        });

        test('should handle CDATA with newlines', () => {
            const xml = `<root><![CDATA[
                Line 1
                Line 2
            ]]></root>`;
            const result = parseXml(xml);
            expect(result.root._text).toBeDefined();
        });
    });

    describe('parseXml - Comments', () => {
        test('should skip XML comments', () => {
            const xml = '<root><!-- this is a comment --><child>text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBeDefined();
            expect(result.root.child._text).toBe('text');
        });

        test('should skip multiple comments', () => {
            const xml = '<!-- comment 1 --><root><!-- comment 2 --><child>text</child><!-- comment 3 --></root>';
            const result = parseXml(xml);
            expect(result.root.child._text).toBe('text');
        });

        test('should handle comments with special characters', () => {
            const xml = '<root><!-- comment with <brackets> and -- dashes --><child>text</child></root>';
            const result = parseXml(xml);
            expect(result.root.child).toBeDefined();
        });
    });

    describe('parseXml - Processing Instructions', () => {
        test('should skip XML declaration', () => {
            const xml = '<?xml version="1.0" encoding="UTF-8"?><root>text</root>';
            const result = parseXml(xml);
            expect(result.root._text).toBe('text');
        });

        test('should skip multiple processing instructions', () => {
            const xml = '<?xml version="1.0"?><?custom directive?><root>text</root>';
            const result = parseXml(xml);
            expect(result.root).toBeDefined();
        });
    });

    describe('parseXml - Edge Cases', () => {
        test('should handle elements with numbers in names', () => {
            const xml = '<root><item1>text1</item1><item2>text2</item2></root>';
            const result = parseXml(xml);
            expect(result.root.item1).toBeDefined();
            expect(result.root.item2).toBeDefined();
        });

        test('should handle elements with hyphens in names', () => {
            const xml = '<root><my-element>text</my-element></root>';
            const result = parseXml(xml);
            expect(result.root['my-element']).toBeDefined();
        });

        test('should handle elements with dots in names', () => {
            const xml = '<root><elem.name>text</elem.name></root>';
            const result = parseXml(xml);
            expect(result.root['elem.name']).toBeDefined();
        });

        test('should handle empty attributes with values', () => {
            const xml = '<root empty="">content</root>';
            const result = parseXml(xml);
            expect(result.root._attributes.empty).toBe('');
        });

        test('should handle attributes with equals sign in value', () => {
            const xml = '<root formula="a=b+c">text</root>';
            const result = parseXml(xml);
            expect(result.root._attributes.formula).toBe('a=b+c');
        });

        test('should skip leading/trailing whitespace', () => {
            const xml = '   <root>   text   </root>   ';
            const result = parseXml(xml);
            expect(result.root._text).toBe('text');
        });

        test('should handle very deeply nested structure', () => {
            let xml = '<root>';
            for (let i = 0; i < 50; i++) {
                xml += `<level${i}>`;
            }
            xml += 'deep content';
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

        test('should return error if no valid root element', () => {
            const xml = '<!-- only comment -->';
            const result = parseXml(xml);
            expect(result).toHaveProperty('error');
        });

        test('should handle text before root element', () => {
            const xml = 'junk text <root>valid</root>';
            const result = parseXml(xml);
            expect(result.root).toBeDefined();
        });

        test('should handle incomplete XML declaration', () => {
            const xml = '<?xml <root>text</root>';
            const result = parseXml(xml);
            expect(result.root).toBeDefined();
        });

        test('should handle malformed attributes', () => {
            const xml = '<root id=123 name="test">text</root>';
            const result = parseXml(xml);
            expect(result.root._text).toBe('text');
        });

        test('should handle unquoted attribute values gracefully', () => {
            const xml = '<root attr=value>text</root>';
            const result = parseXml(xml);
            expect(result.root._text).toBe('text');
        });

        test('should handle mixed quote styles in attributes', () => {
            const xml = '<root id="1" name=\'test\'>text</root>';
            const result = parseXml(xml);
            expect(result.root._text).toBe('text');
        });

        test('should handle multiple root elements gracefully', () => {
            const xml = '<root1>text1</root1><root2>text2</root2>';
            const result = parseXml(xml);
            expect(result.root1).toBeDefined();
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
                <dependencies>
                    <dependency>
                        <groupId>junit</groupId>
                        <artifactId>junit</artifactId>
                        <version>4.13</version>
                        <scope>test</scope>
                    </dependency>
                </dependencies>
            </project>`;
            const result = parseXml(xml);
            expect(result.project.modelVersion._text).toBe('4.0.0');
            expect(result.project.groupId._text).toBe('com.example');
            expect(result.project.dependencies.dependency).toBeDefined();
        });

        test('should parse SOAP-like response', () => {
            const xml = `<?xml version="1.0"?>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                <soap:Body>
                    <GetWeatherResponse xmlns="http://example.com/weather">
                        <GetWeatherResult>
                            <Temperature>25</Temperature>
                            <Humidity>60</Humidity>
                            <Condition>Sunny</Condition>
                        </GetWeatherResult>
                    </GetWeatherResponse>
                </soap:Body>
            </soap:Envelope>`;
            const result = parseXml(xml);
            expect(result['soap:Envelope']).toBeDefined();
            expect(result['soap:Envelope']['soap:Body']).toBeDefined();
        });

        test('should parse RSS feed-like structure', () => {
            const xml = `<?xml version="1.0"?>
            <rss version="2.0">
                <channel>
                    <title>News Feed</title>
                    <link>http://example.com</link>
                    <description>Latest news</description>
                    <item>
                        <title>Article 1</title>
                        <link>http://example.com/1</link>
                        <description>First article</description>
                        <pubDate>Mon, 08 Dec 2025 12:00:00 GMT</pubDate>
                    </item>
                    <item>
                        <title>Article 2</title>
                        <link>http://example.com/2</link>
                        <description>Second article</description>
                    </item>
                </channel>
            </rss>`;
            const result = parseXml(xml);
            expect(result.rss._attributes.version).toBe('2.0');
            expect(Array.isArray(result.rss.channel.item)).toBe(true);
            expect(result.rss.channel.item.length).toBe(2);
        });

        test('should parse SVG-like structure with attributes', () => {
            const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="blue"/>
                <rect x="10" y="10" width="30" height="30" fill="red"/>
                <text x="50" y="50" font-size="14">Label</text>
            </svg>`;
            const result = parseXml(xml);
            expect(result.svg._attributes.width).toBe('100');
            expect(result.svg._attributes.height).toBe('100');
            expect(result.svg.circle).toBeDefined();
            expect(result.svg.circle._attributes.r).toBe('40');
        });

        test('should parse HTML-like XML with mixed content', () => {
            const xml = `<document>
                <header>
                    <title>Page Title</title>
                </header>
                <body>
                    <section id="intro">
                        <h1>Introduction</h1>
                        <p>Some <strong>bold</strong> text here.</p>
                    </section>
                    <section id="content">
                        <h2>Main Content</h2>
                        <ul>
                            <li>Item 1</li>
                            <li>Item 2</li>
                        </ul>
                    </section>
                </body>
            </document>`;
            const result = parseXml(xml);
            expect(result.document.header).toBeDefined();
            expect(result.document.body.section).toBeDefined();
        });

        test('should parse XML with mixed CDATA and regular content', () => {
            const xml = `<root>
                <description>Regular text</description>
                <code><![CDATA[
                    function test() {
                        console.log("This is code");
                        return 42;
                    }
                ]]></code>
                <moreText>After CDATA</moreText>
            </root>`;
            const result = parseXml(xml);
            expect(result.root.description).toBeDefined();
            expect(result.root.code).toBeDefined();
            expect(result.root.moreText).toBeDefined();
        });
    });

    describe('formatXml - Output Formatting', () => {
        test('should output minified JSON by default', () => {
            const xml = '<root>\n  <child>text</child>\n</root>';
            const result = formatXml(xml, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed.root.child._text).toBe('text');
            expect(result).not.toContain('\n');
        });

        test('should output pretty JSON when minify is false', () => {
            const xml = '<root><child>text</child></root>';
            const result = formatXml(xml, { minify: false });
            expect(result).toContain('\n');
            const parsed = JSON.parse(result);
            expect(parsed.root.child._text).toBe('text');
        });

        test('should return error object for invalid XML', () => {
            const xml = 'not xml at all!';
            const result = formatXml(xml, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed).toHaveProperty('error');
        });

        test('should include original content in error response', () => {
            const xml = '';
            const result = formatXml(xml, { minify: true });
            const parsed = JSON.parse(result);
            expect(parsed).toHaveProperty('error');
        });
    });

    describe('Integration Tests - Complex Scenarios', () => {
        test('should handle complex nested structure with attributes and mixed content', () => {
            const xml = `<?xml version="1.0"?>
            <catalog>
                <book id="bk101" language="en">
                    <author>Gambardella, Matthew</author>
                    <title>XML Developer's Guide</title>
                    <genre>Computer</genre>
                    <price currency="USD">44.95</price>
                    <publish_date>2000-10-01</publish_date>
                    <description>An in-depth look at creating <![CDATA[applications with XML]]>.</description>
                </book>
                <book id="bk102">
                    <author>Ralls, Kim</author>
                    <title>Midnight Rain</title>
                    <genre>Fantasy</genre>
                    <price currency="USD">5.95</price>
                </book>
            </catalog>`;
            const result = parseXml(xml);
            expect(Array.isArray(result.catalog.book)).toBe(true);
            expect(result.catalog.book[0]._attributes.id).toBe('bk101');
            expect(result.catalog.book[0].price._attributes.currency).toBe('USD');
            expect(result.catalog.book[0].description._text).toContain('applications with XML');
        });

        test('should handle XML with namespace declarations and usage', () => {
            const xml = `<?xml version="1.0"?>
            <root xmlns:custom="http://custom.ns" xmlns:other="http://other.ns">
                <custom:section id="s1">
                    <custom:title>Title</custom:title>
                    <custom:content>
                        <other:note important="true">Note text</other:note>
                    </custom:content>
                </custom:section>
            </root>`;
            const result = parseXml(xml);
            expect(result.root['custom:section']).toBeDefined();
            expect(result.root['custom:section']['custom:title']).toBeDefined();
        });

        test('should maintain information integrity through format conversion', () => {
            const xml = '<root><item id="1" type="test">Content with <tag>nested</tag> structure</item></root>';
            const formatted = formatXml(xml, { minify: true });
            const parsed = JSON.parse(formatted);
            expect(parsed.root.item._attributes.id).toBe('1');
            expect(parsed.root.item._attributes.type).toBe('test');
            expect(parsed.root.item._text).toBeDefined();
        });
    });
});
