#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { mergeSummaries, getSummaries } from './lib/writers/summary-merger';
import type { PartialSummaries } from './lib/writers/summary-merger';
import { scanProject } from './lib/project-scanner';

function parseArgs(argv: string[]): { command: string; args: Record<string, string>; positional: string[] } {
  const args: Record<string, string> = {};
  const positional: string[] = [];
  let command = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      args[key] = value || '';
    } else if (!command) {
      command = arg;
    } else {
      positional.push(arg);
    }
  }

  return { command, args, positional };
}

const { command, args, positional } = parseArgs(process.argv.slice(2));

async function main() {
  try {
    switch (command) {
      case 'scan':
        await handleScan();
        break;
      case 'merge':
        await handleMerge();
        break;
      case 'query':
        await handleQuery();
        break;
      default:
        printHelp();
        process.exit(command ? 1 : 0);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

async function handleScan() {
  const knowledgeDir = args.knowledgeDir || path.join(process.cwd(), '.knowledge');
  const output = path.join(knowledgeDir, 'scan.json');
  const scanDir = args.scanDir || process.cwd();

  if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
  }

  const scanData = await scanProject(scanDir);
  fs.writeFileSync(output, JSON.stringify(scanData));

  const result = {
    status: 'success',
    action: 'scan',
    output: output,
    stats: scanData.projectStats
  };
  console.log(JSON.stringify(result));

  process.exit(0);
}

async function handleMerge() {
  const summariesPath = args.summaries;
  if (!summariesPath) {
    console.log(JSON.stringify({ error: '--summaries=<path> required' }));
    process.exit(1);
  }

  const knowledgeDir = args.knowledgeDir || path.join(process.cwd(), '.knowledge');

  try {
    // Support glob patterns and single files
    const filesToMerge = expandGlob(summariesPath);

    if (filesToMerge.length === 0) {
      console.log(JSON.stringify({ error: `No files found matching: ${summariesPath}` }));
      process.exit(1);
    }

    // Merge all files in order
    const merged: any = { directories: {}, files: {} };

    filesToMerge.forEach(filePath => {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (content.directories && typeof content.directories === 'object') {
        Object.assign(merged.directories, content.directories);
      }
      if (content.files && typeof content.files === 'object') {
        Object.assign(merged.files, content.files);
      }
    });

    if (!fs.existsSync(knowledgeDir)) {
      fs.mkdirSync(knowledgeDir, { recursive: true });
    }

    mergeSummaries(knowledgeDir, merged as PartialSummaries);

    const current = getSummaries(knowledgeDir);
    const result = {
      status: 'success',
      action: 'merge',
      summaries: {
        directoriesCount: Object.keys(current.directories).length,
        filesCount: Object.keys(current.files).length,
        location: path.join(knowledgeDir, 'summaries.json'),
        filesProcessed: filesToMerge.length
      }
    };
    console.log(JSON.stringify(result));

    process.exit(0);
  } catch (e: any) {
    console.log(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}

function expandGlob(pattern: string): string[] {
  // Handle glob patterns like /tmp/haiku-batch-*.json
  if (pattern.includes('*')) {
    const dir = path.dirname(pattern);
    const globPattern = path.basename(pattern);

    // Convert glob pattern to regex: batch-*.json -> batch-.*\.json
    const regexPattern = '^' + globPattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*') + '$';
    const regex = new RegExp(regexPattern);

    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir)
      .filter(f => regex.test(f))
      .map(f => path.join(dir, f))
      .sort();

    return files;
  }

  // Single file
  return fs.existsSync(pattern) ? [pattern] : [];
}

async function handleQuery() {
  const topic = positional[0] || '';
  const knowledgeDir = args.knowledgeDir || path.join(process.cwd(), '.knowledge');
  const scope = args.scope || '';
  const maxResults = parseInt(args.max || '25', 10);
  const format = args.format || 'json'; // 'json' for flat, 'hierarchy' for tree

  if (!fs.existsSync(knowledgeDir)) {
    console.log(JSON.stringify({ error: 'No .knowledge found. Run: ctx scan first.' }));
    process.exit(1);
  }

  try {
    const keywords = topic.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    // Load summaries directly
    const summaries = getSummaries(knowledgeDir);
    const scoredResults: any[] = [];

    // Score directories
    Object.entries(summaries.directories).forEach(([dirPath, summary]: any) => {
      if (scope && !dirPath.startsWith(scope)) return;
      const score = calculateConfidence(keywords, dirPath, summary);
      if (score > 0) {
        scoredResults.push({
          type: 'directory',
          path: dirPath,
          score,
          ...summary
        });
      }
    });

    // Score files
    Object.entries(summaries.files).forEach(([filePath, summary]: any) => {
      if (scope && !filePath.startsWith(scope)) return;
      const score = calculateConfidence(keywords, filePath, summary);
      if (score > 0) {
        scoredResults.push({
          type: 'file',
          path: filePath,
          score,
          ...summary
        });
      }
    });

    // Sort by confidence descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Limit results
    const limited = scoredResults.slice(0, maxResults);

    let output: any;

    if (format === 'hierarchy') {
      // Hierarchical grouping by folder
      const grouped: any = {};
      limited.forEach(item => {
        const parts = item.path.split('/');
        const fileName = parts.pop();
        const folderPath = parts.join('/') || '.';

        if (!grouped[folderPath]) {
          grouped[folderPath] = [];
        }
        grouped[folderPath].push({ ...item, fileName });
      });

      output = {
        source: 'summaries',
        query: topic,
        keywords: keywords,
        scope: scope || 'all',
        total: limited.length,
        grouped: grouped
      };
    } else {
      // Standard flat JSON output
      output = {
        source: 'summaries',
        query: topic,
        keywords: keywords,
        scope: scope || 'all',
        total: limited.length,
        results: limited
      };
    }

    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (e: any) {
    console.log(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}

function calculateConfidence(keywords: string[], itemPath: string, summary: any): number {
  let score = 0;
  const pathLower = itemPath.toLowerCase();
  const summaryLower = (summary.summary || '').toLowerCase();
  const purposeLower = (summary.purpose || '').toLowerCase();

  keywords.forEach(keyword => {
    // Purpose matches (highest priority: semantic intent)
    if (purposeLower.includes(keyword)) score += 6;

    // Summary matches (topic relevance)
    if (summaryLower.includes(keyword)) score += 6;

    // Exports/imports matches (concrete functionality/dependencies)
    if (summary.exports?.some((e: string) => e.toLowerCase().includes(keyword))) score += 4;
    if (summary.imports?.some((i: string) => i.toLowerCase().includes(keyword))) score += 4;
    
    // Path matches
    if (pathLower.includes(keyword)) score += 4;

    // Technology matches (context clues for directories)
    if (summary.technologies?.some((t: string) => t.toLowerCase().includes(keyword))) score += 2;

    // Role matches (for files: context)
    if (summary.role?.toLowerCase().includes(keyword)) score += 2;
  });

  return score;
}

function printHelp() {
  console.log(`
Project Knowledge

Usage: ctx <command> [options]

Commands:
  scan               Scan project directory and save structure
  merge              Merge Haiku-generated summaries into .knowledge/summaries.json
  query <topic>      Search project summaries by keywords (scored results)

Options:
  --paths=<path>                Comma-separated paths to scan (files or directories, default: cwd)
  --summaries=<path>            Path to summaries JSON file (for merge)
  --scope=<path>                Limit search to specific directory/file (for query)
  --max=<number>                Maximum results to return (for query, default: 100)
  --format=<type>               Output format: json (flat), hierarchy (grouped) 
                                (for query, default: json)
  --knowledgeDir=<knowledgeDir> Project knowledge directory (default: .knowledge in current directory)

Examples:
  ctx scan
  ctx scan --paths=../my-project
  ctx scan --paths=src,lib,config
  ctx scan --paths=/path/to/file.ts
  ctx merge --summaries=/tmp/summaries.json
  ctx query "authentication"
  ctx query "auth user setup" --scope=src/auth --max=10
  ctx query "hook" --format=hierarchy --max=20
`);
}

main();