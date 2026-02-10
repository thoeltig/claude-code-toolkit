"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMarkdown = isValidMarkdown;
exports.parseMarkdown = parseMarkdown;
exports.formatMarkdown = formatMarkdown;
function isValidMarkdown(content) {
    return content.trim().length > 0;
}
function parseMarkdown(content) {
    const lines = content.split('\n');
    const blocks = [];
    for (let i = 0; i < lines.length;) {
        const line = lines[i];
        const trimmed = line.trim();
        const prevI = i;
        if (!trimmed) {
            i++;
            continue;
        }
        if (isFrontMatter(trimmed, i, lines)) {
            const result = parseFrontMatter(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        }
        else if (isHeading(trimmed)) {
            const result = parseHeading(trimmed, i);
            blocks.push(result);
            i++;
        }
        else if (isCodeBlockStart(trimmed)) {
            const result = parseCodeBlock(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        }
        else if (isHorizontalRule(trimmed)) {
            blocks.push({ type: 'hr', anchor_line: i + 1 });
            i++;
        }
        else if (isListStart(trimmed)) {
            const result = parseList(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        }
        else if (isBlockquoteStart(trimmed)) {
            const result = parseBlockquote(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        }
        else if (isTableRow(trimmed)) {
            const result = parseTable(lines, i);
            if (result.block) {
                blocks.push(result.block);
                i = result.nextIndex;
            }
            else {
                const paragraphResult = parseParagraph(lines, i);
                blocks.push(paragraphResult.block);
                i = paragraphResult.nextIndex;
            }
        }
        else {
            const paragraphResult = parseParagraph(lines, i);
            blocks.push(paragraphResult.block);
            i = paragraphResult.nextIndex;
        }
        if (i === prevI) {
            i++;
        }
    }
    return blocks;
}
function isFrontMatter(line, index, lines) {
    if (index !== 0 || line !== '---')
        return false;
    for (let i = index + 1; i < lines.length; i++) {
        if (lines[i].trim() === '---')
            return true;
    }
    return false;
}
function parseFrontMatter(lines, startIndex) {
    let i = startIndex + 1;
    let content = '';
    let iterationCount = 0;
    const maxIterations = lines.length - startIndex + 10;
    while (i < lines.length && lines[i].trim() !== '---') {
        iterationCount++;
        if (iterationCount > maxIterations) {
            break;
        }
        content += lines[i] + '\n';
        i++;
    }
    return { block: { type: 'frontmatter', content: content.trim(), anchor_line: startIndex + 1 }, nextIndex: i + 1 };
}
function isHeading(line) {
    return /^#{1,6}\s+/.test(line);
}
function parseHeading(line, startIndex) {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (!match)
        return { type: 'heading', level: 1, content: line, anchor_line: startIndex + 1 };
    return {
        type: 'heading',
        level: match[1].length,
        content: stripFormatting(match[2]),
        anchor_line: startIndex + 1
    };
}
function isCodeBlockStart(line) {
    return line.startsWith('```');
}
function parseCodeBlock(lines, startIndex) {
    const firstLine = lines[startIndex].trim();
    const language = firstLine.substring(3).trim();
    let i = startIndex + 1;
    let content = '';
    let iterationCount = 0;
    const maxIterations = lines.length - startIndex + 50;
    while (i < lines.length) {
        iterationCount++;
        if (iterationCount > maxIterations) {
            break;
        }
        const line = lines[i];
        const trimmed = line.trim();
        // Only a BARE ``` (exactly, no language specifier) closes the code block
        // Lines like ```bash are content (examples within markdown blocks)
        if (trimmed === '```') {
            i++;
            break;
        }
        // Everything else is content (including ```<language>, which might be nested examples)
        content += lines[i] + '\n';
        i++;
    }
    return {
        block: { type: 'code', language: language, content: content.trimEnd(), anchor_line: startIndex + 1 },
        nextIndex: i
    };
}
function isHorizontalRule(line) {
    return /^(\-{3,}|\*{3,}|_{3,})$/.test(line);
}
function isListStart(line) {
    return /^[\s]*([-*+]\s+|\d+\.\s+)/.test(line);
}
function parseList(lines, startIndex) {
    const firstLine = lines[startIndex];
    const isOrdered = /^\d+\./.test(firstLine.trim());
    const items = [];
    let i = startIndex;
    const baseIndent = getListIndentation(firstLine);
    let iterationCount = 0;
    const maxIterations = lines.length - startIndex + 10;
    while (i < lines.length) {
        iterationCount++;
        if (iterationCount > maxIterations) {
            break;
        }
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
            i++;
            continue;
        }
        if (!isListStart(line))
            break;
        const indent = getListIndentation(line);
        if (indent > baseIndent) {
            i++;
            continue;
        }
        if (indent < baseIndent)
            break;
        const itemResult = parseListItem(trimmed);
        items.push(itemResult);
        i++;
    }
    return {
        block: { type: 'list', ordered: isOrdered, items, anchor_line: startIndex + 1 },
        nextIndex: i
    };
}
function parseListItem(line) {
    const taskMatch = line.match(/^[\s]*([-*+]|\d+\.)\s+\[([ xX])\]\s+(.*)/);
    if (taskMatch) {
        return {
            checked: taskMatch[2].toLowerCase() === 'x',
            content: stripFormatting(taskMatch[3])
        };
    }
    const regularMatch = line.match(/^[\s]*([-*+]|\d+\.)\s+(.*)/);
    if (regularMatch) {
        return stripFormatting(regularMatch[2]);
    }
    return stripFormatting(line);
}
function getListIndentation(line) {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ')
            count++;
        else if (line[i] === '\t')
            count += 2;
        else
            break;
    }
    return count;
}
function isBlockquoteStart(line) {
    return line.trim().startsWith('>');
}
function parseBlockquote(lines, startIndex) {
    let i = startIndex;
    let content = '';
    let iterationCount = 0;
    const maxIterations = lines.length - startIndex + 10;
    while (i < lines.length && lines[i].trim().startsWith('>')) {
        iterationCount++;
        if (iterationCount > maxIterations) {
            break;
        }
        const line = lines[i].trim();
        content += line.substring(1).trim() + '\n';
        i++;
    }
    return {
        block: { type: 'blockquote', content: content.trim(), anchor_line: startIndex + 1 },
        nextIndex: i
    };
}
function isTableRow(line) {
    return line.trim().includes('|');
}
function parseTable(lines, startIndex) {
    if (startIndex + 1 >= lines.length) {
        return { block: null, nextIndex: startIndex + 1 };
    }
    const headerLine = lines[startIndex].trim();
    const separatorLine = lines[startIndex + 1].trim();
    if (!isTableSeparator(separatorLine)) {
        return { block: null, nextIndex: startIndex + 1 };
    }
    const headers = parseTableRow(headerLine);
    const rows = [];
    let i = startIndex + 2;
    let iterationCount = 0;
    const maxIterations = lines.length - startIndex + 10;
    while (i < lines.length && isTableRow(lines[i])) {
        iterationCount++;
        if (iterationCount > maxIterations) {
            break;
        }
        const rowData = parseTableRow(lines[i]);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
            const value = j < rowData.length ? rowData[j] : '';
            row[headers[j]] = stripFormatting(value);
        }
        rows.push(row);
        i++;
    }
    return {
        block: { type: 'table', headers, rows, anchor_line: startIndex + 1 },
        nextIndex: i
    };
}
function isTableSeparator(line) {
    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    return cells.length > 0 && cells.every(cell => /^:?-+:?$/.test(cell));
}
function parseTableRow(line) {
    return line.split('|').map(cell => cell.trim()).filter(cell => cell);
}
function parseParagraph(lines, startIndex) {
    let i = startIndex;
    let content = '';
    let iterationCount = 0;
    const maxIterations = lines.length - startIndex + 10;
    while (i < lines.length) {
        iterationCount++;
        if (iterationCount > maxIterations) {
            break;
        }
        const line = lines[i].trim();
        if (!line)
            break;
        if (isHeading(line) || isCodeBlockStart(line) || isListStart(line) ||
            isBlockquoteStart(line) || isTableRow(line) || isHorizontalRule(line)) {
            break;
        }
        content += (content ? ' ' : '') + line;
        i++;
    }
    return {
        block: { type: 'paragraph', content: stripFormatting(content), anchor_line: startIndex + 1 },
        nextIndex: i
    };
}
function stripFormatting(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/~~(.+?)~~/g, '$1');
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
