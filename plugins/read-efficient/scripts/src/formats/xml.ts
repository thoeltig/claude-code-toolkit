import { parseDocument } from 'htmlparser2';
import { Element, Text, CDATA, Comment } from 'domhandler';

export function isValidXml(content: string): boolean {
    return content.trim().length > 0;
}

export function parseXml(xmlContent: string): any {
    try {
        const cleaned = xmlContent.trim();
        if (!cleaned) return { error: 'Empty XML content' };

        const dom = parseDocument(cleaned, { xmlMode: true });
        const root = dom.children.find(n => n.type === 'tag');
        if (!root) return { error: 'No valid XML root element found' };

        return { [((root as Element).name)]: convertNode(root as Element) };
    } catch (err) {
        return { error: `Failed to parse XML: ${err}`, parseError: true };
    }
}

function convertNode(el: Element): any {
    const result: any = {};

    // Process attributes → attribute_<name>
    for (const [k, v] of Object.entries(el.attribs ?? {})) {
        result[`attribute_${k}`] = v;
    }

    // Collect text and child nodes
    const textParts: string[] = [];
    const childElements: Array<{ name: string; value: any }> = [];

    for (const child of el.children ?? []) {
        if (child instanceof Comment) {
            // Skip comments
            continue;
        } else if (child instanceof Text) {
            const t = child.data.trim();
            if (t) textParts.push(t);
        } else if (child instanceof CDATA) {
            const cdataContent = (child as any).data || (child as any).children?.map((c: any) => c.data).join('');
            if (cdataContent) textParts.push(cdataContent);
        } else if (child.type === 'tag') {
            const childEl = child as Element;
            const childValue = convertNode(childEl);
            childElements.push({ name: childEl.name, value: childValue });
        }
    }

    // Add child elements to result
    for (const { name, value } of childElements) {
        if (result[name] === undefined) {
            result[name] = value;
        } else if (Array.isArray(result[name])) {
            result[name].push(value);
        } else {
            result[name] = [result[name], value];
        }
    }

    // Add text content if present
    if (textParts.length > 0) {
        const text = textParts.join(' ');
        if (Object.keys(result).length === 0 || !childElements.length) {
            // If no attributes/elements, return just the text
            if (Object.keys(result).length === 0) {
                return text;
            }
            result._text = text;
        } else {
            result._text = text;
        }
    }

    return Object.keys(result).length === 0 ? {} : result;
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
