"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidHtml = isValidHtml;
exports.parseHtml = parseHtml;
exports.formatHtml = formatHtml;
const htmlparser2_1 = require("htmlparser2");
const domhandler_1 = require("domhandler");
function isValidHtml(content) {
    return content.trim().length > 0;
}
/**
 * Strips visual-only tags that add no semantic value
 * Handles: <b>, <i>, <u>, <strong>, <em>, <span> (without attributes), <br>, <hr>, <script>, <style>, <font>
 * Preserves content inside stripped tags (except script/style which are removed entirely)
 */
function stripVisualTags(html) {
    let processed = html;
    // Strip script and style tags entirely (remove tag and content)
    processed = processed.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    processed = processed.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    // Strip visual formatting tags but preserve content
    // <b>, <i>, <u>, <strong>, <em> - always strip
    processed = processed.replace(/<\/?b>/gi, '');
    processed = processed.replace(/<\/?i>/gi, '');
    processed = processed.replace(/<\/?u>/gi, '');
    processed = processed.replace(/<\/?strong>/gi, '');
    processed = processed.replace(/<\/?em>/gi, '');
    // Strip <font> and deprecated color tags
    processed = processed.replace(/<font[^>]*>/gi, '');
    processed = processed.replace(/<\/font>/gi, '');
    processed = processed.replace(/<color[^>]*>/gi, '');
    processed = processed.replace(/<\/color>/gi, '');
    // Strip <span> only if it has no class, id, or data-* attributes
    processed = processed.replace(/<span(?!\s+(?:class|id|data-))[^>]*>/gi, '');
    processed = processed.replace(/<\/span>/gi, '');
    // Strip <br> and <hr> (layout tags with no semantic value)
    processed = processed.replace(/<br\s*\/?>/gi, ' ');
    processed = processed.replace(/<hr\s*\/?>/gi, '');
    return processed;
}
/**
 * Headings are already semantically encoded in tag names (h1-h6)
 * No enhancement needed - just passthrough
 */
function enhanceHeadings(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'string')
        return obj;
    if (Array.isArray(obj))
        return obj.map(item => enhanceHeadings(item));
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            result[key] = enhanceHeadings(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Transform lists to compact semantic format
 * ul/ol with li items -> {ordered: boolean, list: [...]}
 * Reuses markdown parsing format for consistency
 */
function enhanceLists(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'string')
        return obj;
    if (Array.isArray(obj))
        return obj.map(item => enhanceLists(item));
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if ((key === 'ul' || key === 'ol') && typeof value === 'object' && value !== null) {
            const isOrdered = key === 'ol';
            const valueObj = value;
            const liItems = valueObj.li ? (Array.isArray(valueObj.li) ? valueObj.li : [valueObj.li]) : [];
            // Transform to compact format
            result[key] = {
                ordered: isOrdered,
                list: liItems.map((item) => typeof item === 'string' ? item : enhanceLists(item))
            };
        }
        else if (typeof value === 'object' && value !== null) {
            result[key] = enhanceLists(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Transform table structure to compact format
 * Converts table > tr > td/th into {headers: [...], rows: [[...]]}
 */
function enhanceTables(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'string')
        return obj;
    if (Array.isArray(obj))
        return obj.map(item => enhanceTables(item));
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key === 'table' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const transformed = transformTableStructure(value);
            result[key] = transformed;
        }
        else if (typeof value === 'object' && value !== null) {
            result[key] = enhanceTables(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Transform a single table from tr array to compact format
 * {headers: [...], rows: [[...]]}
 */
function transformTableStructure(table) {
    if (!table.tr)
        return table;
    const rows = Array.isArray(table.tr) ? table.tr : [table.tr];
    const transformed = { headers: [], rows: [] };
    // Preserve non-tr attributes
    for (const [key, value] of Object.entries(table)) {
        if (key !== 'tr') {
            transformed[key] = value;
        }
    }
    // First pass: collect headers from first row if it has th
    const firstRow = rows[0];
    let hasHeaders = false;
    if (firstRow && firstRow.th) {
        hasHeaders = true;
        const ths = Array.isArray(firstRow.th) ? firstRow.th : [firstRow.th];
        transformed.headers = ths.map((th) => typeof th === 'string' ? th : extractTextContent(th));
    }
    // Second pass: collect data rows
    const startIdx = hasHeaders ? 1 : 0;
    for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i];
        const cells = [];
        if (row.td || row.th) {
            const tds = Array.isArray(row.td) ? row.td : row.td ? [row.td] : [];
            const ths = Array.isArray(row.th) ? row.th : row.th ? [row.th] : [];
            // Add cells (keep as strings for consistency with HTML being string-based)
            for (const td of tds) {
                cells.push(typeof td === 'string' ? td : extractTextContent(td));
            }
            for (const th of ths) {
                cells.push(typeof th === 'string' ? th : extractTextContent(th));
            }
        }
        if (cells.length > 0) {
            transformed.rows.push(cells);
        }
    }
    return transformed;
}
/**
 * Extract text content from nested structures
 */
function extractTextContent(obj) {
    if (typeof obj === 'string')
        return obj;
    if (obj === null || obj === undefined)
        return '';
    const objAny = obj;
    if (objAny._text)
        return objAny._text;
    // Recursively collect text from nested structure
    const texts = [];
    for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
            texts.push(value);
        }
        else if (typeof value === 'object' && value !== null) {
            texts.push(extractTextContent(value));
        }
    }
    return texts.join(' ').trim();
}
/**
 * Apply semantic structure enhancements to parsed HTML
 */
function applySemanticsEnhancements(parsed) {
    let result = parsed;
    // Apply enhancements in order
    result = enhanceHeadings(result);
    result = enhanceLists(result);
    result = enhanceTables(result);
    return result;
}
/**
 * Helper to convert htmlparser2 nodes to the same format as our XML parser
 */
function convertNode(el) {
    const result = {};
    // Process attributes → attribute_<name>
    for (const [k, v] of Object.entries(el.attribs ?? {})) {
        result[`attribute_${k.replace(':', '_')}`] = v;
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
/**
 * Parse HTML by preprocessing (strip visual tags) then delegating to htmlparser2
 * Applies semantic structure enhancements (headings, lists, tables)
 */
function parseHtml(htmlContent) {
    try {
        // Step 1: Strip visual tags
        let cleaned = stripVisualTags(htmlContent);
        // Step 2: Parse with htmlparser2
        const dom = (0, htmlparser2_1.parseDocument)(cleaned, { xmlMode: false });
        // Find the root element (first tag)
        const root = dom.children.find(n => n.type === 'tag');
        if (!root)
            return { error: 'No valid HTML root element found' };
        // Step 3: Convert to our format
        let parsed = { [(root.name)]: convertNode(root) };
        // Step 4: Apply semantic enhancements
        parsed = applySemanticsEnhancements(parsed);
        return parsed;
    }
    catch (err) {
        return { error: `Failed to parse HTML: ${err}`, parseError: true };
    }
}
function formatHtml(rawContent, options) {
    try {
        const data = parseHtml(rawContent);
        if (options.minify) {
            return JSON.stringify(data);
        }
        else {
            return JSON.stringify(data, null, 2);
        }
    }
    catch (err) {
        return JSON.stringify({ error: `Failed to format HTML: ${err}`, content: rawContent });
    }
}
