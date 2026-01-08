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

export interface SummariesData {
  version: string;
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
    version: '1.0',
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
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, summariesPath);
}

export function mergeSummaries(knowledgeDir: string, partialSummaries: PartialSummaries): void {
  const summaries = getOrCreateSummaries(knowledgeDir);

  // Merge directories
  if (partialSummaries.directories) {
    for (const [dirPath, dirSummary] of Object.entries(partialSummaries.directories)) {
      summaries.directories[dirPath] = {
        ...dirSummary,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Merge files
  if (partialSummaries.files) {
    for (const [filePath, fileSummary] of Object.entries(partialSummaries.files)) {
      summaries.files[filePath] = {
        ...fileSummary,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  writeSummaries(knowledgeDir, summaries);
}

export function deleteDirectorySummary(knowledgeDir: string, dirPath: string): void {
  const summaries = getOrCreateSummaries(knowledgeDir);
  delete summaries.directories[dirPath];
  writeSummaries(knowledgeDir, summaries);
}

export function deleteFileSummary(knowledgeDir: string, filePath: string): void {
  const summaries = getOrCreateSummaries(knowledgeDir);
  delete summaries.files[filePath];
  writeSummaries(knowledgeDir, summaries);
}

export function getSummaries(knowledgeDir: string): SummariesData {
  return getOrCreateSummaries(knowledgeDir);
}

export function getSummariesByType(
  knowledgeDir: string,
  type: 'directories' | 'files'
): Record<string, DirectorySummary | FileSummary> {
  const summaries = getOrCreateSummaries(knowledgeDir);
  return summaries[type] || {};
}

export function querySummaries(
  knowledgeDir: string,
  query: string
): { directories: Array<[string, DirectorySummary]>; files: Array<[string, FileSummary]> } {
  const summaries = getOrCreateSummaries(knowledgeDir);
  const queryLower = query.toLowerCase();

  const dirMatches = Object.entries(summaries.directories)
    .filter(([path, summary]) =>
      path.toLowerCase().includes(queryLower) ||
      summary.summary.toLowerCase().includes(queryLower) ||
      summary.purpose?.toLowerCase().includes(queryLower) ||
      summary.technologies?.some(t => t.toLowerCase().includes(queryLower))
    );

  const fileMatches = Object.entries(summaries.files)
    .filter(([path, summary]) =>
      path.toLowerCase().includes(queryLower) ||
      summary.summary.toLowerCase().includes(queryLower) ||
      summary.purpose?.toLowerCase().includes(queryLower) ||
      summary.exports?.some(e => e.toLowerCase().includes(queryLower)) ||
      summary.imports?.some(i => i.toLowerCase().includes(queryLower))
    );

  return {
    directories: dirMatches,
    files: fileMatches
  };
}