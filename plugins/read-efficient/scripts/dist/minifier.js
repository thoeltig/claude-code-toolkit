"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minifyWhitespace = minifyWhitespace;
function minifyWhitespace(content, options = { trimLines: true, collapseEmpty: true }) {
    if (!content)
        return '';
    let result = content.split('\n').map(line => line.trim().replace(/\s+/g, ' ')).join('\n');
    if (options.collapseEmpty) {
        result = result.replace(/\n\n+/g, '\n');
    }
    return result.trim();
}
