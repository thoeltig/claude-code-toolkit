#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { findKnowledgeDir, scanProject } from './lib/project-scanner';
import { mergeSummaries, getOrCreateSummaries } from './lib/summary-merger';
import type { PartialSummaries, FileSummary } from './lib/summary-merger';

interface HierarchicalGrouping {
  folderPath: string; 
  folderScore: number;
  summary?: string;
  purpose?: string;
  technologies?: string[];
  files: GroupedScoredFileSummary[]
}

interface ScoredFileSummary extends FileSummary {
  path: string; 
  fileScore: number;
}

interface GroupedScoredFileSummary extends FileSummary {
  fileName: string; 
  path?: string; 
  fileScore: number;
}

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

function getKnowledgeDir(): string | undefined {  
  const knowledgeDir = args.knowledgeDir;

  // Auto-detect if not provided
  if (!knowledgeDir) {
    const location = args.location;
    if(location) {
      const detected = findKnowledgeDir(location);
      if (detected) {
        return detected;
      }
    }

    const processLocation = process.cwd();
    if(location != processLocation) {
      const detected = findKnowledgeDir(processLocation);
      if (detected) {
        return detected;
      }
    }
  } else {
    return path.resolve(knowledgeDir);
  }

  return undefined;
}

async function handleScan() {
  let knowledgeDir = getKnowledgeDir();

  if (!knowledgeDir) {
    if(args.calledFromHook){
      // If no .knowledge/ could be found the scan logic doesn't need to be executed. This improves startup time because there is no benefit in scanning everything in this use case.
      return;
    }

    knowledgeDir = path.join(process.cwd(), '.knowledge');
  }

  const output = path.join(knowledgeDir, 'scan.json');
  const location = args.location || process.cwd();

  if (!fs.existsSync(knowledgeDir)) {
    fs.mkdirSync(knowledgeDir, { recursive: true });
  }

  const scanData = await scanProject(location, knowledgeDir);
  const outputJson = JSON.stringify(scanData);
  fs.writeFileSync(output, outputJson);

  console.log(outputJson);
  process.exit(0);
}

async function handleMerge() { 
  const location = args.location || process.cwd(); 
  
  const knowledgeDir = getKnowledgeDir();
  if (!knowledgeDir) {
      console.log(JSON.stringify({ error: `.knowledge/ is missing! You need to run scan first before trying to merge scan results.` }));
      return;
  }

  const summariesPath = path.join(args.knowledgeDir, 'haiku-batch-*.json');

  try {
    // Support glob patterns and single files
    const filesToMerge = expandGlob(summariesPath);

    if (filesToMerge.length === 0) {
      console.log(JSON.stringify({ error: `No files found matching: ${summariesPath}` }));
      process.exit(1);
    }

    // Merge all files in order
    const merged: PartialSummaries = { directories: [], files: []};

    filesToMerge.forEach(filePath => {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PartialSummaries;
      if (content.directories) {
        merged.directories.push(...content.directories);
      }
      if (content.files) {
        merged.files.push(...content.files);
      }
    });

    if (!fs.existsSync(knowledgeDir)) {
      fs.mkdirSync(knowledgeDir, { recursive: true });
    }

    const analysedFilesCount = merged.files.length;
    const analysedDirectoriesCount = merged.directories.length;

    const current = mergeSummaries(location, knowledgeDir, merged);

    const result = {
      status: 'success',
      summary: {
        location: path.join(knowledgeDir, 'summaries.json'),
        directoryEntryCount: Object.keys(current.directories).length,
        fileEntryCount: Object.keys(current.files).length,
      },
      merge: {
        processedPartialSummaryFiles: filesToMerge.length,
        analysedDirectoriesCount,
        analysedFilesCount
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
  // Handle glob patterns like /haiku-batch-*.json
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
  const format = args.format || 'grouped'; // 'flat' for list, 'grouped' for tree

  if (!fs.existsSync(knowledgeDir)) {
    console.log(JSON.stringify({ error: 'No .knowledge found. Run: ctx scan first.' }));
    process.exit(1);
  }

  try {
    const keywords = topic.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    // Load summaries directly
    const summaries = getOrCreateSummaries(knowledgeDir);
    const scoredResults: ScoredFileSummary[] = [];

    // Score files
    Object.entries(summaries.files).forEach(([filePath, summary]: any) => {
      if (scope && !filePath.startsWith(scope)) return;
      const fileScore = calculateConfidence(keywords, filePath, summary);
      if (fileScore > 0) {
        scoredResults.push({
          ...summary,
          fileScore,
          path: filePath,
          lastUpdated: undefined
        });
      }
    });

    // Sort by confidence descending
    scoredResults.sort((a, b) => b.fileScore - a.fileScore);

    // Limit results
    const limited = scoredResults.slice(0, maxResults);

    let output: any;

    if (format === 'grouped') {
      // Hierarchical grouping by folder
      const grouped: Record<string, HierarchicalGrouping> = {};
      limited.forEach(item => {
        const folderPath = path.dirname(item.path) || '.';

        if (!grouped[folderPath]) {
          const directory = summaries.directories[folderPath];
          grouped[folderPath] = { 
            folderPath: folderPath, 
            folderScore: 0, 
            summary: directory?.summary,
            purpose: directory?.purpose,
            technologies: directory?.technologies,
            files: []
          };
        }

        const folder = grouped[folderPath];
        folder.folderScore += item.fileScore;

        const fileForGrouping: GroupedScoredFileSummary = {
          ...item,
          fileName: item.path.replace(folderPath+'/', ''),
          path: undefined,
          technologies: undefined
        }
        folder.files.push(fileForGrouping);
      });

      output = {
        query: topic,
        keywords: keywords,
        scope: scope || 'all',
        total: limited.length,
        grouped: [...Object.values(grouped)].sort((a, b) => b.folderScore - a.folderScore)
      };
    } else {
      // Standard flat JSON output
      output = {
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
Project Intel

Commands:
  scan                          Scan project directory and save structure

  --location=<path>             The directory to scan (default: cwd)
  --knowledgeDir=<path>         Project knowledge directory (default: .knowledge in current directory)

  merge                         Merge Haiku-generated summaries into .knowledge/summaries.json
  
  --location=<path>             The directory that was scanned scan (default: cwd)
  --knowledgeDir=<path>         Project knowledge directory (default: .knowledge in current directory)

  query <topic>                 Search project summaries by keywords (scored results)

  --scope=<path>                Limit search to specific directory/file (for query)
  --max=<number>                Maximum results to return (for query, default: 25)
  --format=<type>               Output format: flat, grouped (for query, default: grouped)
  --knowledgeDir=<path>         Project knowledge directory (default: .knowledge in current directory)

Examples:
  ctx scan
  ctx scan --location=../my-project
  ctx merge --summaries=/tmp/summaries.json
  ctx query "authentication"
  ctx query "auth user setup" --scope=src/auth --max=10
  ctx query "hook" --format=grouped --max=20
`);
}

main();