"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMarkdown = isValidMarkdown;
exports.parseMarkdown = parseMarkdown;
exports.formatMarkdown = formatMarkdown;
const markdown_it_1 = __importDefault(require("markdown-it"));
function isValidMarkdown(content) {
    return content.trim().length > 0;
}
const md = new markdown_it_1.default({ html: false, linkify: false });
/**
 * Get attribute value from token
 */
function getTokenAttr(token, attrName) {
    if (!token.attrs)
        return null;
    for (const [key, value] of token.attrs) {
        if (key === attrName)
            return value;
    }
    return null;
}
/**
 * Extract full inline content including markdown links and code (preserving structure)
 */
function extractInlineContentWithMarkdown(tokens) {
    if (!tokens)
        return '';
    let result = '';
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token.type === 'text') {
            result += token.content;
        }
        else if (token.type === 'code_inline') {
            result += `\`${token.content}\``;
        }
        else if (token.type === 'link_open') {
            const href = getTokenAttr(token, 'href');
            result += '[';
            // Collect content until link_close
            i++;
            while (i < tokens.length && tokens[i].type !== 'link_close') {
                if (tokens[i].type === 'text') {
                    result += tokens[i].content;
                }
                else if (tokens[i].children) {
                    result += extractInlineContentWithMarkdown(tokens[i].children);
                }
                i++;
            }
            result += `](${href || ''})`;
        }
        else if (token.type === 'image') {
            const alt = getTokenAttr(token, 'alt') || '';
            const src = getTokenAttr(token, 'src') || '';
            result += `![${alt}](${src})`;
        }
        else if (token.type === 'softbreak') {
            result += ' ';
        }
        else if (token.type === 'hardbreak') {
            result += ' ';
        }
        else if (token.type === 'em_open' || token.type === 'em_close' ||
            token.type === 'strong_open' || token.type === 'strong_close' ||
            token.type === 's_open' || token.type === 's_close' ||
            token.type === 'strikethrough_open' || token.type === 'strikethrough_close') {
            // Skip formatting tags, just process content
        }
        else if (token.children) {
            result += extractInlineContentWithMarkdown(token.children);
        }
        i++;
    }
    return result;
}
function parseMarkdown(content) {
    const blocks = [];
    let processedContent = content;
    let frontmatterEndIndex = 0;
    // Extract front matter (YAML ---...--- at start)
    if (content.startsWith('---')) {
        const secondDashIndex = content.indexOf('---', 3);
        if (secondDashIndex !== -1) {
            const frontmatterContent = content.substring(3, secondDashIndex).trim();
            blocks.push({
                type: 'frontmatter',
                content: frontmatterContent,
                anchor_line: 1
            });
            let contentStartIndex = secondDashIndex + 3;
            // Skip the newline immediately after the closing ---
            if (contentStartIndex < content.length && content[contentStartIndex] === '\n') {
                contentStartIndex++;
            }
            processedContent = content.substring(contentStartIndex);
            frontmatterEndIndex = content.substring(0, secondDashIndex + 3).split('\n').length;
        }
    }
    // Parse markdown content
    const tokens = md.parse(processedContent, {});
    // Convert token stream to blocks
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token.type === 'heading_open') {
            // heading_open followed by inline, then heading_close
            const level = parseInt(token.tag.substring(1));
            const inlineToken = tokens[i + 1];
            const content = inlineToken?.children ? extractInlineContentWithMarkdown(inlineToken.children) : '';
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            blocks.push({
                type: 'heading',
                level,
                content,
                anchor_line: anchorLine
            });
            i += 3; // skip heading_close
        }
        else if (token.type === 'fence') {
            // Code block
            const language = token.info || '';
            const codeContent = token.content;
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            blocks.push({
                type: 'code',
                language,
                content: codeContent.trimEnd(),
                anchor_line: anchorLine
            });
            i++;
        }
        else if (token.type === 'code_block') {
            // Indented code block
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            blocks.push({
                type: 'code',
                language: '',
                content: token.content.trimEnd(),
                anchor_line: anchorLine
            });
            i++;
        }
        else if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
            // List
            const isOrdered = token.type === 'ordered_list_open';
            const items = [];
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            i++;
            while (i < tokens.length && tokens[i].type !== 'bullet_list_close' && tokens[i].type !== 'ordered_list_close') {
                if (tokens[i].type === 'list_item_open') {
                    i++;
                    // Collect paragraph content until list_item_close
                    let itemContent = '';
                    let itemChecked = undefined;
                    while (i < tokens.length && tokens[i].type !== 'list_item_close') {
                        if (tokens[i].type === 'paragraph_open') {
                            i++;
                            while (i < tokens.length && tokens[i].type !== 'paragraph_close') {
                                if (tokens[i].type === 'inline') {
                                    // Check if this is a task list item
                                    const inlineContent = tokens[i].content;
                                    const taskMatch = inlineContent.match(/^\[([ xX])\]\s+(.*)/);
                                    if (taskMatch) {
                                        itemChecked = taskMatch[1].toLowerCase() === 'x';
                                        // For task lists, use the remainder after the checkbox marker
                                        itemContent = taskMatch[2];
                                        // If we have child tokens, extract from them (they should already have checkbox removed)
                                        const childTokens = tokens[i].children || [];
                                        if (childTokens.length > 0) {
                                            const fullContent = extractInlineContentWithMarkdown(childTokens);
                                            // Extract only the content after the checkbox marker
                                            const contentMatch = fullContent.match(/^\[([ xX])\]\s+(.*)/);
                                            itemContent = contentMatch ? contentMatch[2] : fullContent;
                                        }
                                    }
                                    else {
                                        itemContent = tokens[i].children ? extractInlineContentWithMarkdown(tokens[i].children) : inlineContent;
                                    }
                                }
                                i++;
                            }
                            i++; // skip paragraph_close
                        }
                        else if (tokens[i].type === 'bullet_list_open' || tokens[i].type === 'ordered_list_open') {
                            // Skip nested lists (only parse top-level items)
                            const nestedListType = tokens[i].type;
                            i++;
                            let depth = 1;
                            while (depth > 0 && i < tokens.length) {
                                if (tokens[i].type === nestedListType)
                                    depth++;
                                if (tokens[i].type === (nestedListType === 'bullet_list_open' ? 'bullet_list_close' : 'ordered_list_close'))
                                    depth--;
                                i++;
                            }
                        }
                        else {
                            i++;
                        }
                    }
                    if (itemChecked !== undefined) {
                        items.push({ checked: itemChecked, content: itemContent });
                    }
                    else if (itemContent) {
                        items.push(itemContent);
                    }
                    i++; // skip list_item_close
                }
                else {
                    i++;
                }
            }
            i++; // skip list_close
            blocks.push({
                type: 'list',
                ordered: isOrdered,
                items,
                anchor_line: anchorLine
            });
        }
        else if (token.type === 'blockquote_open') {
            // Blockquote
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            i++;
            let quoteContent = '';
            while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
                if (tokens[i].type === 'paragraph_open') {
                    i++;
                    while (i < tokens.length && tokens[i].type !== 'paragraph_close') {
                        if (tokens[i].type === 'inline') {
                            quoteContent = tokens[i].children ? extractInlineContentWithMarkdown(tokens[i].children) : tokens[i].content;
                        }
                        i++;
                    }
                    i++; // skip paragraph_close
                }
                else {
                    i++;
                }
            }
            i++; // skip blockquote_close
            blocks.push({
                type: 'blockquote',
                content: quoteContent,
                anchor_line: anchorLine
            });
        }
        else if (token.type === 'hr') {
            // Horizontal rule
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            blocks.push({
                type: 'hr',
                anchor_line: anchorLine
            });
            i++;
        }
        else if (token.type === 'table_open') {
            // Table
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            const headers = [];
            const rows = [];
            i++; // skip table_open
            while (i < tokens.length && tokens[i].type !== 'table_close') {
                if (tokens[i].type === 'thead_open') {
                    i++;
                    while (i < tokens.length && tokens[i].type !== 'thead_close') {
                        if (tokens[i].type === 'tr_open') {
                            i++;
                            while (i < tokens.length && tokens[i].type !== 'tr_close') {
                                if (tokens[i].type === 'th_open') {
                                    i++;
                                    let cellContent = '';
                                    while (i < tokens.length && tokens[i].type !== 'th_close') {
                                        if (tokens[i].type === 'inline') {
                                            cellContent = tokens[i].children ? extractInlineContentWithMarkdown(tokens[i].children) : tokens[i].content;
                                        }
                                        i++;
                                    }
                                    headers.push(cellContent);
                                    i++; // skip th_close
                                }
                                else {
                                    i++;
                                }
                            }
                            i++; // skip tr_close
                        }
                        else {
                            i++;
                        }
                    }
                    i++; // skip thead_close
                }
                else if (tokens[i].type === 'tbody_open') {
                    i++;
                    while (i < tokens.length && tokens[i].type !== 'tbody_close') {
                        if (tokens[i].type === 'tr_open') {
                            const rowArray = [];
                            i++;
                            while (i < tokens.length && tokens[i].type !== 'tr_close') {
                                if (tokens[i].type === 'td_open') {
                                    i++;
                                    let cellContent = '';
                                    while (i < tokens.length && tokens[i].type !== 'td_close') {
                                        if (tokens[i].type === 'inline') {
                                            cellContent = tokens[i].children ? extractInlineContentWithMarkdown(tokens[i].children) : tokens[i].content;
                                        }
                                        i++;
                                    }
                                    rowArray.push(cellContent);
                                    i++; // skip td_close
                                }
                                else {
                                    i++;
                                }
                            }
                            if (rowArray.length > 0) {
                                // Convert row array to object with column headers as keys
                                const rowObj = {};
                                for (let j = 0; j < headers.length && j < rowArray.length; j++) {
                                    rowObj[headers[j]] = rowArray[j];
                                }
                                rows.push(rowObj);
                            }
                            i++; // skip tr_close
                        }
                        else {
                            i++;
                        }
                    }
                    i++; // skip tbody_close
                }
                else {
                    i++;
                }
            }
            i++; // skip table_close
            blocks.push({
                type: 'table',
                headers,
                rows,
                anchor_line: anchorLine
            });
        }
        else if (token.type === 'paragraph_open') {
            // Paragraph
            const anchorLine = (token.map ? token.map[0] + 1 : 1) + frontmatterEndIndex;
            i++;
            let paragraphContent = '';
            while (i < tokens.length && tokens[i].type !== 'paragraph_close') {
                if (tokens[i].type === 'inline') {
                    paragraphContent = tokens[i].children ? extractInlineContentWithMarkdown(tokens[i].children) : tokens[i].content;
                }
                i++;
            }
            i++; // skip paragraph_close
            blocks.push({
                type: 'paragraph',
                content: paragraphContent,
                anchor_line: anchorLine
            });
        }
        else {
            i++;
        }
    }
    return blocks;
}
function formatMarkdown(rawContent, options) {
    try {
        const data = parseMarkdown(rawContent);
        if (options.minify) {
            return JSON.stringify(data);
        }
        else {
            return JSON.stringify(data, null, 2);
        }
    }
    catch (err) {
        return JSON.stringify({ error: `Failed to format Markdown: ${err}`, content: rawContent });
    }
}
