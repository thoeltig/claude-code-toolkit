import * as fs from 'fs';
import * as path from 'path';
import type { ContextIndex, QueryResult, Layer } from '../../types';

export function queryIndex(rootDir: string, topic: string, layer: Layer | 'all' = 'all'): QueryResult[] {
  const indexPath = path.join(rootDir, '.context', '.index.json');

  if (!fs.existsSync(indexPath)) {
    throw new Error('.context/.index.json not found. Run /init-context first');
  }

  const index: ContextIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const results: QueryResult[] = [];

  const topicLower = topic.toLowerCase();
  const topicWords = topicLower.split(/\s+/).filter(w => w.length >= 3);

  for (const [file, meta] of Object.entries(index.files)) {
    if (layer !== 'all' && meta.layer !== layer) {
      continue;
    }

    const searchText = [
      meta.title,
      meta.summary,
      ...(meta.keywords || []),
      ...(meta.tags || [])
    ].join(' ').toLowerCase();

    let score = 0;

    if (searchText.includes(topicLower)) {
      score += 10;
    }

    for (const word of topicWords) {
      if (meta.title.toLowerCase().includes(word)) {
        score += 5;
      }
      if (meta.keywords.some(k => k.toLowerCase().includes(word))) {
        score += 3;
      }
      if (meta.summary.toLowerCase().includes(word)) {
        score += 1;
      }
    }

    if (score > 0) {
      results.push({
        file,
        layer: meta.layer,
        title: meta.title,
        summary: meta.summary,
        tokens: meta.tokens,
        nodes: meta.nodes || [],
        relevance: score
      });
    }
  }

  results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  return results;
}