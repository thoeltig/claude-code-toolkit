export function isValidMarkdown(content: string): boolean {
    return content.trim().length > 0;
}

export function parseMarkdown(content: string): any[] {
    const lines = content.split('\n');
    const blocks: any[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        if (isFrontMatter(trimmed, i, lines)) {
            const result = parseFrontMatter(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        } else if (isHeading(trimmed)) {
            const result = parseHeading(trimmed);
            blocks.push(result);
            i++;
        } else if (isCodeBlockStart(trimmed)) {
            const result = parseCodeBlock(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        } else if (isHorizontalRule(trimmed)) {
            blocks.push({ type: 'hr' });
            i++;
        } else if (isListStart(trimmed)) {
            const result = parseList(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        } else if (isBlockquoteStart(trimmed)) {
            const result = parseBlockquote(lines, i);
            blocks.push(result.block);
            i = result.nextIndex;
        } else if (isTableRow(trimmed)) {
            const result = parseTable(lines, i);
            if (result.block) {
                blocks.push(result.block);
                i = result.nextIndex;
            } else {
                const paragraphResult = parseParagraph(lines, i);
                blocks.push(paragraphResult.block);
                i = paragraphResult.nextIndex;
            }
        } else {
            const paragraphResult = parseParagraph(lines, i);
            blocks.push(paragraphResult.block);
            i = paragraphResult.nextIndex;
        }
    }

    return blocks;
}

function isFrontMatter(line: string, index: number, lines: string[]): boolean {
    if (index !== 0 || line !== '---') return false;
    for (let i = index + 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') return true;
    }
    return false;
}

function parseFrontMatter(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    let i = startIndex + 1;
    let content = '';
    while (i < lines.length && lines[i].trim() !== '---') {
        content += lines[i] + '\n';
        i++;
    }
    return { block: { type: 'frontmatter', content: content.trim() }, nextIndex: i + 1 };
}

function isHeading(line: string): boolean {
    return /^#{1,6}\s+/.test(line);
}

function parseHeading(line: string): any {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (!match) return { type: 'heading', level: 1, content: line };
    return {
        type: 'heading',
        level: match[1].length,
        content: stripFormatting(match[2])
    };
}

function isCodeBlockStart(line: string): boolean {
    return line.startsWith('```');
}

function parseCodeBlock(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    const firstLine = lines[startIndex].trim();
    const language = firstLine.substring(3).trim();
    let i = startIndex + 1;
    let content = '';

    while (i < lines.length && !lines[i].trim().startsWith('```')) {
        content += lines[i] + '\n';
        i++;
    }

    return {
        block: { type: 'code', language: language, content: content.trimEnd() },
        nextIndex: i + 1
    };
}

function isHorizontalRule(line: string): boolean {
    return /^(\-{3,}|\*{3,}|_{3,})$/.test(line);
}

function isListStart(line: string): boolean {
    return /^[\s]*([-*+]\s+|\d+\.\s+)/.test(line);
}

function parseList(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    const firstLine = lines[startIndex];
    const isOrdered = /^\d+\./.test(firstLine.trim());
    const items: any[] = [];
    let i = startIndex;
    const baseIndent = getListIndentation(firstLine);

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) {
            i++;
            continue;
        }

        if (!isListStart(line)) break;

        const indent = getListIndentation(line);

        if (indent > baseIndent) {
            i++;
            continue;
        }

        if (indent < baseIndent) break;

        const itemResult = parseListItem(trimmed);
        items.push(itemResult);
        i++;
    }

    return {
        block: { type: 'list', ordered: isOrdered, items },
        nextIndex: i
    };
}

function parseListItem(line: string): any {
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

function getListIndentation(line: string): number {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') count++;
        else if (line[i] === '\t') count += 2;
        else break;
    }
    return count;
}

function isBlockquoteStart(line: string): boolean {
    return line.trim().startsWith('>');
}

function parseBlockquote(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    let i = startIndex;
    let content = '';

    while (i < lines.length && lines[i].trim().startsWith('>')) {
        const line = lines[i].trim();
        content += line.substring(1).trim() + '\n';
        i++;
    }

    return {
        block: { type: 'blockquote', content: content.trim() },
        nextIndex: i
    };
}

function isTableRow(line: string): boolean {
    return line.trim().includes('|');
}

function parseTable(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    if (startIndex + 1 >= lines.length) {
        return { block: null, nextIndex: startIndex + 1 };
    }

    const headerLine = lines[startIndex].trim();
    const separatorLine = lines[startIndex + 1].trim();

    if (!isTableSeparator(separatorLine)) {
        return { block: null, nextIndex: startIndex + 1 };
    }

    const headers = parseTableRow(headerLine);
    const rows: any[] = [];
    let i = startIndex + 2;

    while (i < lines.length && isTableRow(lines[i])) {
        const rowData = parseTableRow(lines[i]);
        const row: any = {};

        for (let j = 0; j < headers.length; j++) {
            const value = j < rowData.length ? rowData[j] : '';
            row[headers[j]] = stripFormatting(value);
        }

        rows.push(row);
        i++;
    }

    return {
        block: { type: 'table', headers, rows },
        nextIndex: i
    };
}

function isTableSeparator(line: string): boolean {
    const cells = line.split('|').map(c => c.trim()).filter(c => c);
    return cells.length > 0 && cells.every(cell => /^:?-+:?$/.test(cell));
}

function parseTableRow(line: string): string[] {
    return line.split('|').map(cell => cell.trim()).filter(cell => cell);
}

function parseParagraph(lines: string[], startIndex: number): { block: any; nextIndex: number } {
    let i = startIndex;
    let content = '';

    while (i < lines.length) {
        const line = lines[i].trim();

        if (!line) break;

        if (isHeading(line) || isCodeBlockStart(line) || isListStart(line) ||
            isBlockquoteStart(line) || isTableRow(line) || isHorizontalRule(line)) {
            break;
        }

        content += (content ? ' ' : '') + line;
        i++;
    }

    return {
        block: { type: 'paragraph', content: stripFormatting(content) },
        nextIndex: i
    };
}

function stripFormatting(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/~~(.+?)~~/g, '$1');
}

export function formatMarkdown(rawContent: string, options: { minify: boolean }): string {
    try {
        const data = parseMarkdown(rawContent);

        if (options.minify) {
            return JSON.stringify(data);
        } else {
            return JSON.stringify(data, null, 2);
        }
    } catch (err) {
        return JSON.stringify({ error: `Failed to format Markdown: ${err}`, content: rawContent });
    }
}
