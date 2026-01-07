#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { scanProject } from './lib/collectors/project-scanner';
import { mergeSummaries, querySummaries, getSummaries } from './lib/writers/summary-merger';
import type { PartialSummaries } from './lib/writers/summary-merger';

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
  const root = args.root || process.cwd();
  const output = args.output || path.join(root, '.context', 'scan.json');

  const contextDir = path.join(root, '.context');
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const scanData = await scanProject(root);
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

  const rootDir = args.root || process.cwd();
  const contextDir = path.join(rootDir, '.context');

  try {
    const partialData: PartialSummaries = JSON.parse(fs.readFileSync(summariesPath, 'utf8'));

    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true });
    }

    mergeSummaries(contextDir, partialData);

    const current = getSummaries(contextDir);
    const result = {
      status: 'success',
      action: 'merge',
      summaries: {
        directoriesCount: Object.keys(current.directories).length,
        filesCount: Object.keys(current.files).length,
        location: path.join(contextDir, '.summaries.json')
      }
    };
    console.log(JSON.stringify(result));

    process.exit(0);
  } catch (e: any) {
    console.log(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}

async function handleQuery() {
  const topic = positional[0] || '';
  const rootDir = args.root || process.cwd();
  const contextDir = path.join(rootDir, '.context');
  const summariesPath = path.join(contextDir, '.summaries.json');

  if (!fs.existsSync(contextDir)) {
    console.log(JSON.stringify({ error: 'No context found. Run: ctx scan first.' }));
    process.exit(1);
  }

  try {
    const results = querySummaries(contextDir, topic);
    const output = {
      source: 'summaries',
      query: topic,
      total: results.directories.length + results.files.length,
      directories: results.directories.map(([path, summary]) => ({ path, ...summary })),
      files: results.files.map(([path, summary]) => ({ path, ...summary }))
    };
    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (e: any) {
    console.log(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}


function printHelp() {
  console.log(`
Context Lifecycle Manager

Usage: ctx <command> [options]

Commands:
  scan               Scan project directory and save structure
  merge              Merge Haiku-generated summaries into .context/.summaries.json
  query <topic>      Search project summaries by topic (fuzzy search)

Options:
  --root=<path>       Project root directory (default: cwd)
  --output=<path>     Output path for scan.json (for scan)
  --summaries=<path>  Path to summaries JSON file (for merge)

Examples:
  ctx scan --root=../my-project
  ctx merge --summaries=/tmp/summaries.json --root=../my-project
  ctx query "authentication" --root=../my-project
`);
}

main();