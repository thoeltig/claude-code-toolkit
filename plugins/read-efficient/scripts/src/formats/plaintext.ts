export function formatPlaintext(content: string, options: { minify: boolean }): string {
    if (!options.minify) {
        return content;
    } 

    return content;
}

export function handlePlaintextContent(minifiedContent: string): string | any {
    return minifiedContent;
}