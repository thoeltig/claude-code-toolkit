export function isValidHtml(content: string): boolean {
    return content.trim().length > 0;
}

/**
 * Strips visual-only tags that add no semantic value
 * Handles: <b>, <i>, <u>, <strong>, <em>, <span> (without attributes), <br>, <hr>, <script>, <style>, <font>
 * Preserves content inside stripped tags (except script/style which are removed entirely)
 */
function stripVisualTags(html: string): string {
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
 * Auto-closes unclosed HTML tags to ensure proper XML parsing
 * Handles tags that browsers auto-close: p, li, tr, td, th, dd, dt, option
 */
function autoCloseTags(html: string): string {
    const autoCloseTagSet = new Set(['p', 'li', 'tr', 'td', 'th', 'dd', 'dt', 'option', 'br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);

    let result = '';
    let pos = 0;
    const stack: string[] = [];

    while (pos < html.length) {
        const tagStart = html.indexOf('<', pos);

        if (tagStart === -1) {
            result += html.substring(pos);
            break;
        }

        // Append text before tag
        result += html.substring(pos, tagStart);

        const tagEnd = html.indexOf('>', tagStart);
        if (tagEnd === -1) {
            result += html.substring(tagStart);
            break;
        }

        const fullTag = html.substring(tagStart, tagEnd + 1);
        const tagContent = html.substring(tagStart + 1, tagEnd);

        // Skip comments, CDATA, declarations
        if (tagContent.startsWith('!--') || tagContent.startsWith('?') || tagContent.startsWith('![CDATA')) {
            result += fullTag;
            pos = tagEnd + 1;
            continue;
        }

        // Handle closing tags
        if (tagContent.startsWith('/')) {
            const closingTagName = tagContent.substring(1).trim().split(/\s/)[0].toLowerCase();

            // Pop stack, closing auto-close tags as needed
            while (stack.length > 0 && stack[stack.length - 1] !== closingTagName) {
                if (autoCloseTagSet.has(stack[stack.length - 1])) {
                    result += `</${stack.pop()}>`;
                } else {
                    break;
                }
            }

            if (stack.length > 0 && stack[stack.length - 1] === closingTagName) {
                stack.pop();
            }

            result += fullTag;
            pos = tagEnd + 1;
            continue;
        }

        // Handle self-closing tags
        if (tagContent.endsWith('/')) {
            result += fullTag;
            pos = tagEnd + 1;
            continue;
        }

        // Extract tag name
        const tagNameMatch = tagContent.match(/^([a-zA-Z][\w:.-]*)/);
        if (!tagNameMatch) {
            result += fullTag;
            pos = tagEnd + 1;
            continue;
        }

        const tagName = tagNameMatch[1].toLowerCase();

        // If this is an auto-close tag and same as top of stack, close the previous one
        if (autoCloseTagSet.has(tagName) && stack.length > 0 && stack[stack.length - 1] === tagName) {
            result += `</${tagName}>`;
            stack.pop();
        }

        result += fullTag;
        stack.push(tagName);
        pos = tagEnd + 1;
    }

    // Close any remaining open tags
    while (stack.length > 0) {
        result += `</${stack.pop()}>`;
    }

    return result;
}

/**
 * Headings are already semantically encoded in tag names (h1-h6)
 * No enhancement needed - just passthrough
 */
function enhanceHeadings(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(item => enhanceHeadings(item));

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            result[key] = enhanceHeadings(value);
        } else {
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
function enhanceLists(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(item => enhanceLists(item));

    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if ((key === 'ul' || key === 'ol') && typeof value === 'object' && value !== null) {
            const isOrdered = key === 'ol';
            const valueObj = value as any;
            const liItems = valueObj.li ? (Array.isArray(valueObj.li) ? valueObj.li : [valueObj.li]) : [];

            // Transform to compact format
            result[key] = {
                ordered: isOrdered,
                list: liItems.map((item: any) => typeof item === 'string' ? item : enhanceLists(item))
            };
        } else if (typeof value === 'object' && value !== null) {
            result[key] = enhanceLists(value);
        } else {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Transform table structure to compact format
 * Converts table > tr > td/th into {headers: [...], rows: [[...]]}
 */
function enhanceTables(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return obj;
    if (Array.isArray(obj)) return obj.map(item => enhanceTables(item));

    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (key === 'table' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
            const transformed = transformTableStructure(value);
            result[key] = transformed;
        } else if (typeof value === 'object' && value !== null) {
            result[key] = enhanceTables(value);
        } else {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Transform a single table from tr array to compact format
 * {headers: [...], rows: [[...]]}
 */
function transformTableStructure(table: any): any {
    if (!table.tr) return table;

    const rows = Array.isArray(table.tr) ? table.tr : [table.tr];
    const transformed: any = { headers: [], rows: [] };

    // Preserve non-tr attributes
    for (const [key, value] of Object.entries(table)) {
        if (key !== 'tr') {
            transformed[key] = value;
        }
    }

    // First pass: collect headers from first row if it has th
    const firstRow = rows[0] as any;
    let hasHeaders = false;
    if (firstRow && firstRow.th) {
        hasHeaders = true;
        const ths = Array.isArray(firstRow.th) ? firstRow.th : [firstRow.th];
        transformed.headers = ths.map((th: any) => typeof th === 'string' ? th : extractTextContent(th));
    }

    // Second pass: collect data rows
    const startIdx = hasHeaders ? 1 : 0;
    for (let i = startIdx; i < rows.length; i++) {
        const row = rows[i] as any;
        const cells: any[] = [];

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
function extractTextContent(obj: any): string {
    if (typeof obj === 'string') return obj;
    if (obj === null || obj === undefined) return '';

    const objAny = obj as any;
    if (objAny._text) return objAny._text;

    // Recursively collect text from nested structure
    const texts: string[] = [];
    for (const value of Object.values(obj)) {
        if (typeof value === 'string') {
            texts.push(value);
        } else if (typeof value === 'object' && value !== null) {
            texts.push(extractTextContent(value));
        }
    }
    return texts.join(' ').trim();
}

/**
 * Apply semantic structure enhancements to parsed HTML
 */
function applySemanticsEnhancements(parsed: any): any {
    let result = parsed;

    // Apply enhancements in order
    result = enhanceHeadings(result);
    result = enhanceLists(result);
    result = enhanceTables(result);

    return result;
}

/**
 * Parse HTML by preprocessing (auto-close, strip visual tags) then delegating to XML parser
 * Applies semantic structure enhancements (headings, lists, tables)
 */
export function parseHtml(htmlContent: string): any {
    try {
        // Step 1: Auto-close unclosed tags FIRST (before stripping)
        let cleaned = autoCloseTags(htmlContent);

        // Step 2: Strip visual tags
        cleaned = stripVisualTags(cleaned);

        // Step 3: Use XML parser on cleaned content
        const { parseXml } = require('./xml');
        let parsed = parseXml(cleaned);

        // Step 4: Apply semantic enhancements
        parsed = applySemanticsEnhancements(parsed);

        return parsed;
    } catch (err) {
        return { error: `Failed to parse HTML: ${err}`, parseError: true };
    }
}

export function formatHtml(rawContent: string, options: { minify: boolean }): string {
    try {
        const data = parseHtml(rawContent);

        if (options.minify) {
            return JSON.stringify(data);
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (err) {
        return JSON.stringify({ error: `Failed to format HTML: ${err}`, content: rawContent });
    }
}
