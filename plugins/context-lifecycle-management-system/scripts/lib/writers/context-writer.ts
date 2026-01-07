import * as fs from 'fs';
import * as path from 'path';
import type { ContextIndex, ContextConfig, ProjectAnalysis } from '../../types';

export function createContextStructure(rootDir: string, analysis: ProjectAnalysis): void {
  const contextDir = path.join(rootDir, '.context');

  if (fs.existsSync(contextDir)) {
    throw new Error('.context/ directory already exists. Remove it first or use --force');
  }

  const layers = ['domain', 'foundation', 'active'];
  for (const layer of layers) {
    const layerDir = path.join(contextDir, layer);
    fs.mkdirSync(layerDir, { recursive: true });
  }

  const index: ContextIndex = {
    version: '1.0',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    project: {
      type: analysis.type,
      domain: analysis.domain,
      tech_stack: analysis.tech_stack
    },
    stats: {
      total_files: 0,
      total_tokens: 0,
      by_layer: {
        domain: 0,
        foundation: 0,
        active: 0
      }
    },
    files: {}
  };

  fs.writeFileSync(path.join(contextDir, '.index.json'), JSON.stringify(index, null, 2));

  const config: ContextConfig = {
    version: '1.0',
    project: {
      root: rootDir,
      type: analysis.type,
      domain: analysis.domain
    },
    lifecycle: {
      domain_review_interval: '12_months',
      foundation_review_interval: '6_months',
      active_expiry: '4_weeks'
    },
    team: {
      sync_enabled: false,
      strategy: 'git'
    },
    privacy: {
      sanitize: true,
      patterns: ['api[_-]?key', 'password', 'secret', 'token', 'bearer']
    }
  };

  fs.writeFileSync(path.join(contextDir, '.contextrc'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(contextDir, '.gitignore'), '*.tmp\n*.temp\n.DS_Store\n');
}