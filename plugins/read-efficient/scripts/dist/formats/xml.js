"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidXml = isValidXml;
exports.parseXml = parseXml;
exports.formatXml = formatXml;
const htmlparser2_1 = require("htmlparser2");
const domhandler_1 = require("domhandler");
function isValidXml(content) {
    return content.trim().length > 0;
}
function parseXml(xmlContent) {
    try {
        const cleaned = xmlContent.trim();
        if (!cleaned)
            return { error: 'Empty XML content' };
        const dom = (0, htmlparser2_1.parseDocument)(cleaned, { xmlMode: true });
        const root = dom.children.find(n => n.type === 'tag');
        if (!root)
            return { error: 'No valid XML root element found' };
        return { [(root.name)]: convertNode(root) };
    }
    catch (err) {
        return { error: `Failed to parse XML: ${err}`, parseError: true };
    }
}
function convertNode(el) {
    const result = {};
    // Process attributes → attribute_<name>
    for (const [k, v] of Object.entries(el.attribs ?? {})) {
        result[`attribute_${k}`] = v;
    }
    // Collect text and child nodes
    const textParts = [];
    const childElements = [];
    for (const child of el.children ?? []) {
        if (child instanceof domhandler_1.Comment) {
            // Skip comments
            continue;
        }
        else if (child instanceof domhandler_1.Text) {
            const t = child.data.trim();
            if (t)
                textParts.push(t);
        }
        else if (child instanceof domhandler_1.CDATA) {
            const cdataContent = child.data || child.children?.map((c) => c.data).join('');
            if (cdataContent)
                textParts.push(cdataContent);
        }
        else if (child.type === 'tag') {
            const childEl = child;
            const childValue = convertNode(childEl);
            childElements.push({ name: childEl.name, value: childValue });
        }
    }
    // Add child elements to result
    for (const { name, value } of childElements) {
        if (result[name] === undefined) {
            result[name] = value;
        }
        else if (Array.isArray(result[name])) {
            result[name].push(value);
        }
        else {
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
        }
        else {
            result._text = text;
        }
    }
    return Object.keys(result).length === 0 ? {} : result;
}
function formatXml(rawContent, options) {
    try {
        const data = parseXml(rawContent);
        if (options.minify) {
            return JSON.stringify(data);
        }
        else {
            return JSON.stringify(data, null, 2);
        }
    }
    catch (err) {
        return JSON.stringify({ error: `Failed to format XML: ${err}`, content: rawContent });
    }
}
