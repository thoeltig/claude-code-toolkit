const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
  'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
]);

export function extractKeywords(text: string, maxKeywords: number = 15): string[] {
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const filtered = words.filter(w => !STOPWORDS.has(w));

  const frequency: Record<string, number> = {};
  for (const word of filtered) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, maxKeywords);
}