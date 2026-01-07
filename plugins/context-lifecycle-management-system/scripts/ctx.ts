#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { scanProject, formatForHaikuAnalysis } from './lib/collectors/project-scanner';
import { createContextStructure } from './lib/writers/context-writer';
import { queryIndex } from './lib/query/searcher';
import { loadFullFile, loadNode } from './lib/query/loader';
import { captureDecision } from './lib/writers/capture-writer';
import { mergeSummaries, querySummaries, getSummaries } from './lib/writers/summary-merger';
import type { ProjectAnalysis } from './types';
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
      case 'init':
        await handleInit();
        break;
      case 'query':
        await handleQuery();
        break;
      case 'query-context':
        await handleQueryContext();
        break;
      case 'load':
        await handleLoad();
        break;
      case 'capture':
        await handleCapture();
        break;
      case 'scan-and-analyze':
        await handleScanAndAnalyze();
        break;
      case 'merge-summaries':
        await handleMergeSummaries();
        break;
      case 'sync':
        await handleSync();
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
  const output = args.output || '/tmp/project-scan.json';

  console.error('Scanning project...');
  const data = await scanProject(root);

  fs.writeFileSync(output, JSON.stringify(data, null, 2));

  console.log(`✓ Project scan complete: ${output}`);
  console.log(`  Total files: ${data.projectStats.totalFiles}`);
  console.log(`  Total directories: ${data.projectStats.totalDirs}`);
  console.log(`  Max depth: ${data.projectStats.maxDepth}`);
  console.log(`  File types: ${data.projectStats.fileTypes.join(', ') || 'none'}`);
  process.exit(0);
}

async function handleInit() {
  const analysis = args.analysis;
  if (!analysis) {
    console.error('Error: --analysis=<path> required');
    console.error('Run "ctx scan" first, then use Haiku to analyze, then "ctx init --analysis=<path>"');
    process.exit(1);
  }

  const analysisData: ProjectAnalysis = JSON.parse(fs.readFileSync(analysis, 'utf8'));
  const rootDir = args.root || process.cwd();

  createContextStructure(rootDir, analysisData);

  console.log('✓ Context structure created at ./.context/');
  console.log(`  Type: ${analysisData.type}`);
  console.log(`  Domain: ${analysisData.domain}`);
  const allTechs = Object.values(analysisData.tech_stack).flat().join(', ');
  console.log(`  Tech: ${allTechs || 'none detected'}`);
  console.log('\nStructure:');
  console.log('  .context/');
  console.log('  ├── domain/          (business knowledge)');
  console.log('  ├── foundation/      (architecture)');
  console.log('  ├── active/          (current work)');
  console.log('  ├── .index.json      (master index)');
  console.log('  └── .contextrc       (configuration)');
  console.log('\nNext steps:');
  console.log('1. /extract-knowledge <docs-url> to populate domain layer');
  console.log('2. /capture-decision to document existing architecture');
  process.exit(0);
}

async function handleQuery() {
  const topic = positional[0];
  if (!topic) {
    console.error('Usage: ctx query <topic> [--layer=domain|foundation|active|all] [--format=summary|json]');
    process.exit(1);
  }

  const layer = (args.layer || 'all') as any;
  const format = args.format || 'summary';
  const rootDir = args.root || process.cwd();

  const results = queryIndex(rootDir, topic, layer);

  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printQueryResults(results);
  }
  process.exit(0);
}

async function handleLoad() {
  const filepath = positional[0];
  if (!filepath) {
    console.error('Usage: ctx load <file> [--node=<node-name>]');
    process.exit(1);
  }

  const node = args.node;
  const rootDir = args.root || process.cwd();

  try {
    if (node) {
      const content = loadNode(rootDir, filepath, node);
      console.log(JSON.stringify(content, null, 2));
    } else {
      const content = loadFullFile(rootDir, filepath);
      console.log(JSON.stringify(content, null, 2));
    }
    process.exit(0);
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

async function handleCapture() {
  const title = args.title;
  const context = args.context;
  if (!title || !context) {
    console.error('Usage: ctx capture --title="..." --context="..." [--category=foundation] [--git-commit=<hash>]');
    process.exit(1);
  }

  const category = (args.category || 'foundation') as any;
  const gitCommit = args['git-commit'];
  const rootDir = args.root || process.cwd();

  const result = captureDecision(rootDir, {
    title,
    context,
    category,
    gitCommit
  });

  console.log(`✓ Captured: ${result.filename}`);
  console.log(`  Tokens: ${result.tokens}`);
  console.log(`  Layer: ${result.category}`);
  process.exit(0);
}

async function handleScanAndAnalyze() {
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

async function handleMergeSummaries() {
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

async function handleQueryContext() {
  const topic = positional[0] || '';
  const rootDir = args.root || process.cwd();
  const contextDir = path.join(rootDir, '.context');
  const summariesPath = path.join(contextDir, '.summaries.json');

  if (!fs.existsSync(contextDir)) {
    console.log(JSON.stringify({ error: 'No context found. Run: ctx scan-and-analyze first.' }));
    process.exit(1);
  }

  try {
    if (fs.existsSync(summariesPath)) {
      const results = querySummaries(contextDir, topic);
      const output = {
        source: 'summaries',
        query: topic,
        total: results.directories.length + results.files.length,
        directories: results.directories.map(([path, summary]) => ({ path, ...summary })),
        files: results.files.map(([path, summary]) => ({ path, ...summary }))
      };
      console.log(JSON.stringify(output));
    } else {
      const layer = (args.layer || 'all') as any;
      const indexResults = queryIndex(rootDir, topic, layer);
      const output = {
        source: 'index',
        query: topic,
        total: indexResults.length,
        results: indexResults
      };
      console.log(JSON.stringify(output));
    }
    process.exit(0);
  } catch (e: any) {
    console.error(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}

async function handleSync() {
  console.error('Sync not yet implemented in Phase 2');
  process.exit(1);
}

function printQueryResults(results: any[]) {
  if (results.length === 0) {
    console.log('No matches found.');
    return;
  }

  console.log(`Found ${results.length} matches:\n`);

  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.layer.toUpperCase()}] ${r.title}`);
    console.log(`   Summary: ${r.summary}`);
    console.log(`   Tokens: ${r.tokens}`);
    console.log(`   Load: ctx load ${r.file}`);

    if (r.nodes && r.nodes.length > 0) {
      console.log(`   Nodes: ${r.nodes.join(', ')}`);
    }
    console.log('');
  });
}

function printHelp() {
  console.log(`
Context Lifecycle Manager v1.0

Usage: ctx <command> [options]

Commands:
  scan              Scan project and output raw data for analysis
  init              Initialize context structure from analysis
  query <topic>     Search context index by keyword
  load <file>       Load context file or specific node
  capture           Capture architectural decision
  scan-and-analyze  Scan project and guide Haiku analysis (Phase 3)
  query-context     Search summaries or index (Phase 3)
  merge-summaries   Merge Haiku summaries into .summaries.json (Phase 3)
  sync              Sync with team (not yet implemented)

Options:
  --root=<path>       Project root directory (default: cwd)
  --output=<path>     Output file path (for scan/scan-and-analyze)
  --analysis=<path>   Analysis input file (for init)
  --summaries=<path>  Summaries JSON file (for merge-summaries)
  --format=<type>     Output format: summary|json (for query)
  --layer=<layer>     Filter by layer: domain|foundation|active|all (for query)
  --node=<name>       Load specific node from file (for load)
  --title=<text>      Decision title (for capture)
  --context=<text>    Decision context/rationale (for capture)
  --category=<layer>  Target layer (for capture, default: foundation)
  --git-commit=<hash> Git commit hash (for capture)

Examples:
  ctx scan --output=/tmp/scan.json
  ctx init --analysis=/tmp/analysis.json
  ctx query "validation" --layer=domain
  ctx load domain/fda-standards.json --node=process_validation
  ctx capture --title="Auth design" --context="Using JWT because..."
  ctx scan-and-analyze --root=../my-project
  ctx query-context "authentication" --root=../my-project
  ctx merge-summaries --summaries=/tmp/summaries.json --root=../my-project
`);
}

main();