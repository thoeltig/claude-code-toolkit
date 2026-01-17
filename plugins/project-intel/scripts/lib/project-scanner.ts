import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { getOrCreateSummaries } from './summary-merger';

interface RawProjectData {
  filePaths: string[];
  projectStats: {
    totalFiles: number;
    extensionCount: Record<string,number>;
  };
}

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
  '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
  '.vscode', 'vendor', 'tmp', '.cache', '.knowledge', '.claude', 
]);

function shouldIgnore(name: string): boolean {
  return IGNORED_DIRS.has(name) || name.startsWith('.');
}

function isGitInstalled(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getFilesFromGit(location: string, knowledgeDir: string):string[]{
  try {
    // Get git tracked files in this location
    const trackedFiles = execSync(`git ls-files --full-name -- "${location}"`, { encoding: 'utf-8' })
      .trim()
      .split('\n');

    // Filter out the build, obj, cache, etc directorie and .claude/.knowledge directory
    const filteredTrackedFiles = trackedFiles.filter(f => {
      const segments = f.split('/');
      return !segments.some(x => IGNORED_DIRS.has(x));
    });
    
    // Check for a summary if one exist filepaths can be further reduced to only the actually modified files since last scan
    const summary = getOrCreateSummaries(knowledgeDir);
    const summaryFileEntries = Object.entries(summary.files);
    if(summaryFileEntries.length == 0){
      // No Summary = initial scan so return all tracked files
      return filteredTrackedFiles;
    }

    // Find oldest scan date and create look for filepath and date
    let since = new Date();
    const mapOfSummaryFileEntries = new Map<string, Date>();
    const trackedFilesSet = new Set<string>(filteredTrackedFiles);

    summaryFileEntries
      .filter(x => trackedFilesSet.has(x[0]))
      .forEach(x => { 
        const lastUpdate = new Date(x[1].lastUpdated);
        mapOfSummaryFileEntries.set(x[0], lastUpdate);
        if(lastUpdate < since) since = lastUpdate;
      });
    
    // Get git log since the last update to check if the git modified date is newer then the correlating file last scan date
    const output = execSync(`git log --format=%ai --name-only --since="${since.toISOString()}" -- "${location}"`, { encoding: 'utf-8' });
    const lines = output.trim().split('\n');

    const fileMap = new Map<string, Date>();
    let currentDate: Date | null = null;

    for (const line of lines) {
      if (!line) continue;

      // Check if this is a date line (ISO format)
      if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
        currentDate = new Date(line);
      } else if (currentDate && line && !line.split('/').some(x => IGNORED_DIRS.has(x))) {
        // Only add if we haven't seen it yet (first = most recent)
        const lastUpdated = mapOfSummaryFileEntries.get(line);
        if ((!lastUpdated || lastUpdated < currentDate) && !fileMap.has(line)) {
          fileMap.set(line, currentDate);
        }
      }
    }

    return [...fileMap.keys()];
  } catch (e) {
    return [];
  }
}

function getFiles(dir: string, rootDir: string, filePaths: string[]): void {   
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (shouldIgnore(entry)) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        getFiles(fullPath, rootDir, filePaths);
      } else if (stat.isFile()) {
        filePaths.push(fullPath);
      }
    }
  } catch (e) {}
}

function getExtensionCounts(filePaths: string[]): Record<string, number>{  
  return filePaths.reduce(
    (acc, file) => {
      const ext = path.extname(file).toLowerCase() || 'none';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
}

function createOutput(filePaths: string[]){  
  return {
    filePaths,
    projectStats: {
      totalFiles: filePaths.length,
      extensionCount: getExtensionCounts(filePaths)
    }
  };
}

export async function scanProject(location: string, knowledgeDir: string): Promise<RawProjectData> {
  if (!fs.existsSync(location)) {
    return createOutput([]);
  }
  
  if(isGitInstalled()){
    const files = getFilesFromGit(location, knowledgeDir);
    if(files.length !== 0){
      return createOutput(files);
    }
  }
  
  const filePaths: string[] = [];
  getFiles(location, location, filePaths);
  return createOutput(filePaths);
}