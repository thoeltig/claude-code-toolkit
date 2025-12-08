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
 * Parse HTML by preprocessing (auto-close, strip visual tags) then delegating to XML parser
 * Reuses parseXml from xml.ts without modification
 */
export function parseHtml(htmlContent: string): any {
    try {
        // Step 1: Auto-close unclosed tags FIRST (before stripping)
        let cleaned = autoCloseTags(htmlContent);

        // Step 2: Strip visual tags
        cleaned = stripVisualTags(cleaned);

        // Step 3: Use XML parser on cleaned content
        // Import and use parseXml
        const { parseXml } = require('./xml');
        return parseXml(cleaned);
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
