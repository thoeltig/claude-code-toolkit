import * as fs from 'fs';
import * as path from 'path';

export interface DirectorySummary {
  summary: string;
  purpose?: string;
  technologies?: string[];
  fileCount: number;
  subdirCount: number;
  lastUpdated: string;
}

export interface FileSummary {
  summary: string;
  purpose?: string;
  role?: string;
  exports?: string[];
  imports?: string[];
  lastUpdated: string;
}

interface SummariesData {
  generated: string;
  directories: {
    [dirPath: string]: DirectorySummary;
  };
  files: {
    [filePath: string]: FileSummary;
  };
}

export interface PartialSummaries {
  directories?: {
    [dirPath: string]: DirectorySummary;
  };
  files?: {
    [filePath: string]: FileSummary;
  };
}

function getOrCreateSummaries(knowledgeDir: string): SummariesData {
  const summariesPath = path.join(knowledgeDir, 'summaries.json');

  if (fs.existsSync(summariesPath)) {
    try {
      return JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
    } catch (e) {
      console.error('Error reading summaries.json, creating new:', e);
    }
  }

  return {
    generated: new Date().toISOString(),
    directories: {},
    files: {}
  };
}

function writeSummaries(knowledgeDir: string, data: SummariesData): void {
  const summariesPath = path.join(knowledgeDir, 'summaries.json');
  const tempPath = summariesPath + '.tmp';

  // Update generated timestamp
  data.generated = new Date().toISOString();

  // Write to temp file, then rename (atomic operation)
  fs.writeFileSync(tempPath, JSON.stringify(data));
  fs.renameSync(tempPath, summariesPath);
}

export function mergeSummaries(scanDir: string, knowledgeDir: string, partialSummaries: PartialSummaries): SummariesData {
  const summaries = getOrCreateSummaries(knowledgeDir);
  const normalizedScanDir = path.normalize(scanDir);
  const knowledgeDirScanDir = path.normalize(knowledgeDir);
  const baseDir = knowledgeDirScanDir.slice(0, knowledgeDirScanDir.indexOf('.knowledge'));

  // Merge directories
  if (partialSummaries.directories) {
    for (const [dirPath, dirSummary] of Object.entries(partialSummaries.directories)) {
      if(dirSummary.technologies && dirSummary.technologies.length == 0) dirSummary.technologies = undefined;

      summaries.directories[dirPath] = {
        ...dirSummary,
        lastUpdated: new Date().toISOString()
      };
    }
      
    const scannedDirectoryPaths: Set<string> = new Set(Object.keys(partialSummaries.directories).map(x => path.join(baseDir, x)));
    for (const dirPath of Object.keys(summaries.directories)) {
      const absPath = path.join(baseDir, dirPath);
      if (absPath.startsWith(normalizedScanDir) && !scannedDirectoryPaths.has(absPath)) {
        delete summaries.directories[dirPath];
      }
    }
  }

  // Merge files
  if (partialSummaries.files) {
    for (const [filePath, fileSummary] of Object.entries(partialSummaries.files)) {
      if(fileSummary.exports && fileSummary.exports.length == 0) fileSummary.exports = undefined;
      if(fileSummary.imports && fileSummary.imports.length == 0) fileSummary.imports = undefined;

      summaries.files[filePath] = {
        ...fileSummary,
        lastUpdated: new Date().toISOString()
      };
    }

    const scannedFilePaths: Set<string> = new Set(Object.keys(partialSummaries.files).map(x => path.join(baseDir, x)));
    for (const filePath of Object.keys(summaries.files)) {
      const absPath = path.join(baseDir, filePath);
      if (absPath.startsWith(normalizedScanDir) && !scannedFilePaths.has(absPath)) {
        delete summaries.files[filePath];
      }
    }    
  }

  writeSummaries(knowledgeDir, summaries);
  return summaries;
}

export function getSummaries(knowledgeDir: string): SummariesData {
  return getOrCreateSummaries(knowledgeDir);
}