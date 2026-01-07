import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ContextFile, ContextIndex, Layer } from '../../types';
import { extractKeywords } from '../../utils/keywords';
import { estimateTokens } from '../../utils/token-counter';
import { sanitizeContent } from '../../utils/sanitizer';

interface CaptureParams {
  title: string;
  context: string;
  category: Layer;
  gitCommit?: string;
  author?: string;
}

interface CaptureResult {
  filename: string;
  tokens: number;
  category: Layer;
}

export function captureDecision(rootDir: string, params: CaptureParams): CaptureResult {
  const contextDir = path.join(rootDir, '.context');

  if (!fs.existsSync(contextDir)) {
    throw new Error('.context/ not found. Run /init-context first');
  }

  const id = crypto.randomBytes(4).toString('hex');
  const slug = slugify(params.title);
  const filename = `${id}-${slug}.json`;
  const filepath = path.join(contextDir, params.category, filename);

  const sanitized = sanitizeContent(params.context);
  const keywords = extractKeywords(params.title + ' ' + sanitized);
  const tokens = estimateTokens(sanitized);

  const contextFile: ContextFile = {
    id,
    title: params.title,
    category: params.category,
    type: 'decision',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    git_commit: params.gitCommit,
    author: params.author,
    content: {
      decision: params.title,
      rationale: sanitized,
      status: 'proposed'
    },
    metadata: {
      tokens,
      keywords,
      related_files: [],
      confidence: 1.0
    }
  };

  fs.writeFileSync(filepath, JSON.stringify(contextFile, null, 2));

  updateIndex(contextDir, `${params.category}/${filename}`, {
    layer: params.category,
    title: params.title,
    summary: sanitized.substring(0, 150),
    tokens,
    type: 'decision',
    keywords,
    updated: new Date().toISOString(),
    git_commit: params.gitCommit,
    confidence: 1.0
  });

  return {
    filename: `${params.category}/${filename}`,
    tokens,
    category: params.category
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
}

function updateIndex(contextDir: string, filename: string, metadata: any): void {
  const indexPath = path.join(contextDir, '.index.json');
  const index: ContextIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

  index.files[filename] = metadata;

  index.stats.total_files = Object.keys(index.files).length;
  index.stats.total_tokens = 0;
  index.stats.by_layer = { domain: 0, foundation: 0, active: 0 };

  for (const meta of Object.values(index.files)) {
    index.stats.total_tokens += meta.tokens || 0;
    if (meta.layer in index.stats.by_layer) {
      index.stats.by_layer[meta.layer] += meta.tokens || 0;
    }
  }

  index.updated = new Date().toISOString();

  const tempPath = indexPath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(index, null, 2));
  fs.renameSync(tempPath, indexPath);
}