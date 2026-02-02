import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { getOrCreateSummaries, SummariesData, writeSummaries } from './summary-merger';

export interface ScanResult {
  filesToScan: string[];
  projectStats: {
    knowledgeDir: string;
    totalFilesInKnowledge: number;
    numberOfFilesToScan: number;
    extensionCountsOfFilesToScan: Record<string,number>;
  };
}

interface Files{
  new: string[];
  modified: string[];
  deleted: string[];
}

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
  '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
  '.vscode', 'vendor', 'tmp', '.cache', '.knowledge', '.claude', 
]);

function shouldIgnore(name: string): boolean {
  return IGNORED_DIRS.has(name) || name.startsWith('.');
}

function trimToProjectDirFromFilepath(filepath: string, projectRoot:string): string{
  // Normalize to forward slashes for consistency across platforms (git uses forward slashes)
  return path.relative(projectRoot, filepath).replace(/\\/g, '/');
}

function searchFileSystemRecursive(dir: string, fileName: string): string | undefined {  
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry !== '.knowledge' && shouldIgnore(entry)) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const foundPath = searchFileSystemRecursive(fullPath, fileName);
        if(foundPath){
          return foundPath;
        }
      } else if (stat.isFile() && fullPath.endsWith(fileName)) {
        return fullPath;
      }
    }
  } catch {}

  return undefined;
}

function getSummaryFiles(summaries: SummariesData): Map<string, Date>{
  const mapOfSummaryFileEntries = new Map<string, Date>();

  // Check for a summary if one exist filepaths can be further reduced to only the actually modified files since last scan
  const summaryFileEntries = Object.entries(summaries.files);
  if(summaryFileEntries.length == 0){
    // No Summary = initial scan so return all tracked files
    return mapOfSummaryFileEntries;
  }

  // Find oldest scan date and create look for filepath and date
  summaryFileEntries
    .forEach(x => { 
      const lastUpdate = new Date(x[1].lastUpdated);
      mapOfSummaryFileEntries.set(x[0], lastUpdate);
    });
    
  return mapOfSummaryFileEntries;
}

function getGitTrackedFiles(location: string): string[]{  
  // Get git tracked files in this location
  const trackedFiles = execSync(`git ls-files --full-name -- "${location}"`, { encoding: 'utf-8' })
    .trim()
    .split('\n');

  // Filter out the build, obj, cache, etc directorie and .claude/.knowledge directory
  const filteredTrackedFiles = trackedFiles
    .filter(f => {
      const segments = f.split('/');
      return !segments.some(x => IGNORED_DIRS.has(x));
    })
    .map(x => path.join(location, x));

  return filteredTrackedFiles;
}

function isGitInstalled(): boolean {
  try {
    execSync('git --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getFilesFromGit(location: string, summaries: SummariesData, projectRoot: string): Files{
  const files:Files = {
    new: [],
    modified: [],
    deleted: []
  };

  try {
    // Get git tracked files in this location
    const trackedFiles = getGitTrackedFiles(location);
    
    // Check for a summary if one exist filepaths can be further reduced to only the actually modified files since last scan    
    const mapOfSummaryFileEntries = getSummaryFiles(summaries);
    if(mapOfSummaryFileEntries.size == 0){
      // No Summary = initial scan so return all tracked files
      trackedFiles.forEach(filepath => files.new.push(trimToProjectDirFromFilepath(filepath, projectRoot)));
      return files;
    }
        
    // Find oldest scan date and create look for filepath and date
    let since = new Date();
    mapOfSummaryFileEntries.forEach(x => {
      if(x < since) since = x;
    });
    
    // Get git log since the last update to check if the git modified date is newer then the correlating file last scan date
    const output = execSync(`git log --format=%ai --name-only --since="${since.toISOString()}" -- "${location}"`, { encoding: 'utf-8' });
    const lines = output.trim().split('\n');

    const modifiedFileMap = new Map<string, Date>();
    let currentDate: Date | null = null;

    for (const line of lines) {
      if (!line) continue;

      // Check if this is a date line (ISO format)
      if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
        currentDate = new Date(line);
      } else if (currentDate && line && !line.split('/').some(x => IGNORED_DIRS.has(x))) {
        // Only add if we haven't seen it yet (first = most recent)
        const lastUpdated = mapOfSummaryFileEntries.get(line);
        const filepath = path.join(location, line);
        const relativePath = trimToProjectDirFromFilepath(filepath, projectRoot);
        if ((!lastUpdated || lastUpdated < currentDate) && !modifiedFileMap.has(relativePath) && fs.existsSync(filepath)) {
          modifiedFileMap.set(relativePath, currentDate);
        }
      }
    }
        
    trackedFiles.forEach(x => {
      const relativePath = trimToProjectDirFromFilepath(x, projectRoot);
      const founDate = mapOfSummaryFileEntries.get(relativePath);
      if(!founDate){
        files.new.push(relativePath);
      }
    });

    const set = new Set<string>(trackedFiles);
    mapOfSummaryFileEntries.forEach((_,relativePath) => {
      const filepath = path.join(projectRoot, relativePath);
      if(filepath.startsWith(location) && set.has(filepath) === false){
        files.deleted.push(relativePath);
      }
    });

    files.modified.push(...modifiedFileMap.keys());
    return files;
  } catch { 
    return files;
  }
}

function getFilesFromFileSystem(location: string, summaries: SummariesData, projectRoot: string): Files{
  const files:Files = {
    new: [],
    modified: [],
    deleted: []
  };

   try { 
    const filepathesInThisLocation = new Map<string, Date>();
    getFilesFromFileSystemRecursive(location, location, filepathesInThisLocation);
      
    const mapOfSummaryFileEntries = getSummaryFiles(summaries);
    if(mapOfSummaryFileEntries.size == 0){      
      // No Summary = initial scan so return all tracked files
      filepathesInThisLocation.forEach((_, filepath) => files.new.push(trimToProjectDirFromFilepath(filepath, projectRoot)));
      return files;
    }
        
    filepathesInThisLocation.forEach((currentDate, filepath) => {      
      const relativePath = trimToProjectDirFromFilepath(filepath, projectRoot);
      const lastDate = mapOfSummaryFileEntries.get(relativePath);
      if(!lastDate){
        files.new.push(relativePath);
      }else if(currentDate > lastDate){
        files.modified.push(relativePath);
      }
    });

    mapOfSummaryFileEntries.forEach((_, relativePath) => {
      const filepath = path.join(projectRoot, relativePath);
      if(filepath.startsWith(location) && !filepathesInThisLocation.get(filepath)){
        files.deleted.push(relativePath);
      }
    });

    return files;
  } catch {
    return files;
  }
}

function getFilesFromFileSystemRecursive(dir: string, rootDir: string, filePaths: Map<string,Date>): void {   
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (shouldIgnore(entry)) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getFilesFromFileSystemRecursive(fullPath, rootDir, filePaths);
      } else if (stat.isFile()) {
        filePaths.set(fullPath, stat.ctime);
      }
    }
  } catch (e) {}
}

function deletedOldEntriesFromKnowledge(filePaths: string[], summaries: SummariesData, knowledgeDir: string): number{
  const directoryDeleteCandidates = new Set<string>();
  filePaths.forEach(x => {
    directoryDeleteCandidates.add(path.dirname(x));
    delete summaries.files[x];
  });

  const fileKeys = Object.keys(summaries.files);
  const remainingDictionariesInFiles = new Set<string>(fileKeys.map(x => path.dirname(x)));
  directoryDeleteCandidates.forEach(x => {
    if(remainingDictionariesInFiles.has(x) === false){
      delete summaries.directories[x];
    }
  });

  writeSummaries(knowledgeDir, summaries);
  return fileKeys.length;
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

function createOutput(filePaths: string[], filesInSummary: number, knowledgeDir: string): ScanResult{  
  return {
    filesToScan: filePaths,
    projectStats: {
      knowledgeDir: knowledgeDir,
      totalFilesInKnowledge: filesInSummary,
      numberOfFilesToScan: filePaths.length,
      extensionCountsOfFilesToScan: getExtensionCounts(filePaths)
    }
  };
}

export function findKnowledgeDir(location: string): string | undefined {
  const summaryFile = '.knowledge/summaries.json';

  if (isGitInstalled()) {
    try {
      const foundKnowledgeFile = execSync(`git ls-files --full-name -- "${location}"`, { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .find(f => f.endsWith(summaryFile));

      if(foundKnowledgeFile){
        return path.dirname(path.join(location, foundKnowledgeFile));
      }
    } catch { }
  }

  const foundFile = searchFileSystemRecursive(location, summaryFile);
  return foundFile ? path.dirname(foundFile) : undefined;
}

export async function scanProject(location: string, knowledgeDir: string): Promise<ScanResult> {
  const summaries = getOrCreateSummaries(knowledgeDir);
  let filesInSummary = Object.keys(summaries.files).length;

  if (!fs.existsSync(location)) {
    return createOutput([], filesInSummary, knowledgeDir);
  }

  const projectRoot = path.dirname(knowledgeDir);

  let files: Files;
  if(isGitInstalled()){
    files = getFilesFromGit(location, summaries, projectRoot);
  }
  else{
    files = getFilesFromFileSystem(location, summaries, projectRoot);
  }

  if(files.deleted.length !== 0){
    filesInSummary = deletedOldEntriesFromKnowledge(files.deleted, summaries, knowledgeDir);
  }

  return createOutput([...files.new, ...files.modified], filesInSummary, knowledgeDir);
}