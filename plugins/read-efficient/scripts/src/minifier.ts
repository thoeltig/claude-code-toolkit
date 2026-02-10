import { MinifyOptions } from './types';

export function minifyWhitespace(content: string, options: MinifyOptions = { trimLines: true, collapseEmpty: true }): string {
    if (!content) 
        return '';

    let result = content.split('\n').map(line => line.trim().replace(/\s+/g, ' ')).join('\n');
    if (options.collapseEmpty) {
        result = result.replace(/\n\n+/g, '\n');
    } 
    
    return result.trim();
}