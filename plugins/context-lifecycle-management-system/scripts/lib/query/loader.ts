import * as fs from 'fs';
import * as path from 'path';
import type { ContextFile, NodeContent } from '../../types';

export function loadFullFile(rootDir: string, filepath: string): ContextFile {
  const fullPath = path.join(rootDir, '.context', filepath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

export function loadNode(rootDir: string, filepath: string, nodeName: string): NodeContent {
  const file = loadFullFile(rootDir, filepath);

  if (!file.content.nodes || typeof file.content.nodes !== 'object') {
    throw new Error(`File ${filepath} does not have indexed nodes`);
  }

  const node = file.content.nodes[nodeName];
  if (!node) {
    const available = Object.keys(file.content.nodes).join(', ');
    throw new Error(`Node '${nodeName}' not found. Available: ${available}`);
  }

  return node;
}

export function listNodes(rootDir: string, filepath: string): string[] {
  const file = loadFullFile(rootDir, filepath);

  if (!file.content.nodes) {
    return [];
  }

  return Object.keys(file.content.nodes);
}