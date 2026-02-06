#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { findKnowledgeDir, scanProject } from './lib/project-scanner';
import { mergeSummaries, getOrCreateSummaries } from './lib/summary-merger';
import { FORMAT_FLAT, FORMAT_GROUPED, GroupedScoredFileSummary, HierarchicalGrouping, KNOWLEDGE_DIRECTORY, PartialSummaries, QUERY_RESULT_MAX, SCAN_FILE, ScoredFileSummary, SUMMARIES_FILE } from './types';

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
  const processLocation = path.normalize(process.cwd());
  const location = path.normalize(args.location || processLocation);

  if (!knowledgeDir) {
    if(args.calledFromHook){
      // If no .knowledge/ could be found the scan logic doesn't need to be executed. This improves startup time because there is no benefit in scanning everything in this use case.
      return;
    }

    knowledgeDir = path.join(processLocation, KNOWLEDGE_DIRECTORY);
  }else if(!location.includes(knowledgeDir.replace('\\'+KNOWLEDGE_DIRECTORY,''))){
    // if the location is higher up in the directory structure than the .knowledgeDir then this is either called by the hook in a random directory or the location argument is wrong
    if(args.calledFromHook){
      return;
    }

    console.log(JSON.stringify({ error: `The location to scan '${location}' is higher in the directory structure than the found .knowledgeDir '${knowledgeDir}'. If proceeded this will lead to path missmatches in the ${SUMMARIES_FILE}. Provide correct values for the arguments '--location' and/or '--knowledgeDir'.` }));
    return;
  }

  const output = path.join(knowledgeDir, SCAN_FILE);

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
  const knowledgeDir = getKnowledgeDir();
  if (!knowledgeDir) {
      console.log(JSON.stringify({ error: `${KNOWLEDGE_DIRECTORY} is missing! You need to run scan first before trying to merge scan results.` }));
      return;
  }

  const summariesPath = path.join(knowledgeDir, 'haiku-batch-*.json');

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

    const current = mergeSummaries(knowledgeDir, merged);

    const result = {
      status: 'success',
      summary: {
        location: path.join(knowledgeDir, SUMMARIES_FILE),
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
  const knowledgeDir = args.knowledgeDir || path.join(process.cwd(), KNOWLEDGE_DIRECTORY);
  const scope = args.scope || '';
  const maxResults = parseInt(args.max || `${QUERY_RESULT_MAX}`, 10);
  const format = args.format || FORMAT_GROUPED; // 'flat' for list, 'grouped' for tree

  if (!fs.existsSync(knowledgeDir)) {
    console.log(JSON.stringify({ error: `No ${KNOWLEDGE_DIRECTORY} found. Run: ctx scan first.` }));
    process.exit(1);
  }

  try {
    const keywords = topic.toLowerCase().split(/\s+/).filter(k => k.length > 0);

    // Load summaries directly
    const summaries = getOrCreateSummaries(knowledgeDir);
    const scoredResults: ScoredFileSummary[] = [];

    // Score files
    summaries.files.forEach((summary, filePath) => {
      if (scope && !filePath.startsWith(scope)) return;
      const fileScore = calculateConfidence(keywords, filePath, summary);
      if (fileScore > 0) {
        scoredResults.push({
          fileScore,
          path: filePath,
          ...summary,
          lastUpdated: undefined
        });
      }
    });

    // Sort by confidence descending
    scoredResults.sort((a, b) => b.fileScore - a.fileScore);

    // Limit results
    const limited = scoredResults.slice(0, maxResults);

    let output: any;

    if (format === FORMAT_GROUPED) {
      // Hierarchical grouping by folder
      const grouped: Record<string, HierarchicalGrouping> = {};
      limited.forEach(item => {
        const folderPath = path.dirname(item.path) || '.';

        if (!grouped[folderPath]) {
          const directory = summaries.directories.get(folderPath);
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
          fileName: item.path.replace(folderPath+'/', ''),
          ...item,
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
  --knowledgeDir=<path>         Project knowledge directory (default: ${KNOWLEDGE_DIRECTORY} in current directory)

  merge                         Merge Haiku-generated summaries into ${KNOWLEDGE_DIRECTORY}/${SUMMARIES_FILE}
  
  --location=<path>             The directory that was scanned scan (default: cwd)
  --knowledgeDir=<path>         Project knowledge directory (default: ${KNOWLEDGE_DIRECTORY} in current directory)

  query <topic>                 Search project summaries by keywords (scored results)

  --scope=<path>                Limit search to specific directory/file (for query)
  --max=<number>                Maximum results to return (for query, default: ${QUERY_RESULT_MAX})
  --format=<type>               Output format: ${FORMAT_FLAT}, ${FORMAT_GROUPED} (for query, default: ${FORMAT_GROUPED})
  --knowledgeDir=<path>         Project knowledge directory (default: ${KNOWLEDGE_DIRECTORY} in current directory)

Examples:
  ctx scan
  ctx scan --location=../my-project
  ctx merge --summaries=/tmp/${SUMMARIES_FILE}
  ctx query "authentication"
  ctx query "auth user setup" --scope=src/auth --max=10
  ctx query "hook" --format=grouped --max=20
`);
}

main();