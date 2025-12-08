export function isValidXml(content: string): boolean {
    return content.trim().length > 0;
}

interface XmlElement {
    name: string;
    attributes: Record<string, string>;
    children: (XmlElement | string)[];
    text: string;
}

export function parseXml(xmlContent: string): any {
    try {
        const cleaned = xmlContent.trim();
        if (!cleaned) return { error: 'Empty XML content' };

        const root = parseXmlElement(cleaned, 0).element;
        if (!root) return { error: 'No valid XML root element found' };

        return convertToJson(root);
    } catch (err) {
        return { error: `Failed to parse XML: ${err}`, parseError: true };
    }
}

function parseXmlElement(content: string, startPos: number): { element: XmlElement | null; nextPos: number } {
    let pos = startPos;

    while (pos < content.length) {
        if (content[pos] === '<') {
            if (content.substring(pos, pos + 4) === '<!--') {
                pos = content.indexOf('-->', pos) + 3;
                if (pos < 3) return { element: null, nextPos: content.length };
                continue;
            }
            if (content.substring(pos, pos + 2) === '<?') {
                const piEnd = content.indexOf('?>', pos);
                if (piEnd === -1) {
                    const nextTag = content.indexOf('<', pos + 2);
                    pos = nextTag === -1 ? content.length : nextTag;
                } else {
                    pos = piEnd + 2;
                }
                continue;
            }
            if (content.substring(pos, pos + 2) === '</') {
                return { element: null, nextPos: pos };
            }
            if (content.substring(pos, pos + 9) === '<![CDATA[') {
                return { element: null, nextPos: pos };
            }

            const tagEnd = content.indexOf('>', pos + 1);
            if (tagEnd === -1) return { element: null, nextPos: content.length };

            const tagContent = content.substring(pos + 1, tagEnd).trim();
            const isSelfClosing = tagContent.endsWith('/');
            const cleanTag = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent;

            const spaceIndex = cleanTag.search(/\s/);
            const tagName = spaceIndex === -1 ? cleanTag : cleanTag.substring(0, spaceIndex);

            const attributes = spaceIndex === -1 ? {} : parseAttributes(cleanTag.substring(spaceIndex));

            pos = tagEnd + 1;

            if (isSelfClosing) {
                return { element: { name: tagName, attributes, children: [], text: '' }, nextPos: pos };
            }

            const children: (XmlElement | string)[] = [];
            let textContent = '';

            while (pos < content.length) {
                if (content[pos] === '<') {
                    if (content.substring(pos, pos + 2) === '</') {
                        const closeTagEnd = content.indexOf('>', pos);
                        const closeTag = content.substring(pos + 2, closeTagEnd).trim();
                        if (closeTag === tagName) {
                            pos = closeTagEnd + 1;
                            if (textContent.trim()) children.push(textContent.trim());
                            return { element: { name: tagName, attributes, children, text: textContent }, nextPos: pos };
                        }
                        textContent += content[pos];
                        pos++;
                    } else if (content.substring(pos, pos + 4) === '<!--') {
                        pos = content.indexOf('-->', pos) + 3;
                        if (pos < 3) pos = content.length;
                    } else if (content.substring(pos, pos + 9) === '<![CDATA[') {
                        const cdataEnd = content.indexOf(']]>', pos + 9);
                        const cdataText = content.substring(pos + 9, cdataEnd);
                        if (textContent.trim()) children.push(textContent.trim());
                        children.push(cdataText);
                        textContent = '';
                        pos = cdataEnd + 3;
                    } else {
                        if (textContent.trim()) {
                            children.push(textContent.trim());
                            textContent = '';
                        }
                        const childResult = parseXmlElement(content, pos);
                        if (childResult.element) {
                            children.push(childResult.element);
                        }
                        pos = childResult.nextPos;
                    }
                } else {
                    textContent += content[pos];
                    pos++;
                }
            }

            if (textContent.trim()) children.push(textContent.trim());
            return { element: { name: tagName, attributes, children, text: textContent }, nextPos: pos };
        } else {
            pos++;
        }
    }

    return { element: null, nextPos: pos };
}

function parseAttributes(attrString: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const attrRegex = /([a-zA-Z_:][a-zA-Z0-9:_.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let match;

    while ((match = attrRegex.exec(attrString)) !== null) {
        attrs[match[1]] = match[2] !== undefined ? match[2] : match[3];
    }

    return attrs;
}

function convertToJson(element: XmlElement): any {
    const result: any = {};

    if (element.children.length === 0) {
        return { [element.name]: element.attributes ? { _attributes: element.attributes } : {} };
    }

    const textNodes = element.children.filter(c => typeof c === 'string');
    const elementNodes = element.children.filter(c => typeof c !== 'string') as XmlElement[];

    if (textNodes.length > 0 && elementNodes.length === 0) {
        const text = textNodes.map(t => t).join(' ').trim();
        result._text = text;
    } else if (textNodes.length > 0 && elementNodes.length > 0) {
        const text = textNodes.map(t => t).join(' ').trim();
        if (text) result._text = text;

        for (const child of elementNodes) {
            const childJson = convertToJson(child);
            const childName = Object.keys(childJson)[0];
            if (!result[childName]) {
                result[childName] = childJson[childName];
            } else if (Array.isArray(result[childName])) {
                result[childName].push(childJson[childName]);
            } else {
                result[childName] = [result[childName], childJson[childName]];
            }
        }
    } else {
        for (const child of elementNodes) {
            const childJson = convertToJson(child);
            const childName = Object.keys(childJson)[0];
            if (!result[childName]) {
                result[childName] = childJson[childName];
            } else if (Array.isArray(result[childName])) {
                result[childName].push(childJson[childName]);
            } else {
                result[childName] = [result[childName], childJson[childName]];
            }
        }
    }

    if (element.attributes && Object.keys(element.attributes).length > 0) {
        result._attributes = element.attributes;
    }

    return { [element.name]: Object.keys(result).length > 0 ? result : {} };
}

export function formatXml(rawContent: string, options: { minify: boolean }): string {
    try {
        const data = parseXml(rawContent);

        if (options.minify) {
            return JSON.stringify(data);
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (err) {
        return JSON.stringify({ error: `Failed to format XML: ${err}`, content: rawContent });
    }
}
