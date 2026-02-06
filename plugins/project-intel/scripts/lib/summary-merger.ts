import * as fs from 'fs';
import * as path from 'path';

export interface DirectorySummary {
  summary?: string;
  purpose?: string;
  technologies?: string[];
  lastUpdated?: string;
}

export interface FileSummary {
  summary?: string;
  purpose?: string;
  role?: string;
  technologies?: string[];
  exports?: string[];
  imports?: string[];
  lastUpdated?: string;
}

export interface SummariesDataStorage {
  generated: string;
  directories: {
    [dirPath: string]: DirectorySummary;
  };
  files: {
    [filePath: string]: FileSummary;
  };
}

export interface SummariesData {
  generated: string;
  directories: Map<string, DirectorySummary>;
  files: Map<string, FileSummary>;
}

export interface PartialSummaries {
  directories: PartialDirectorySummary[];
  files: PartialFileSummary[];
}

export interface PartialDirectorySummary extends DirectorySummary {
  path: string; 
}

export interface PartialFileSummary extends FileSummary {
  path: string; 
}

export function getOrCreateSummaries(knowledgeDir: string): SummariesData {
  const summariesPath = path.join(knowledgeDir, 'summaries.json');

  if (fs.existsSync(summariesPath)) {  
    try {
      const storage = JSON.parse(fs.readFileSync(summariesPath, 'utf8')) as SummariesDataStorage;
      return {
        generated: storage.generated,
        directories: new Map(Object.entries(storage.directories)),
        files: new Map(Object.entries(storage.files))
      };
    } catch (e) {
      console.error('Error reading summaries.json, creating new:', e);
    }
  }

  return {
    generated: new Date().toISOString(),
    directories: new Map<string, DirectorySummary>(),
    files: new Map<string, FileSummary>(),
  };
}

export function writeSummaries(knowledgeDir: string, data: SummariesData): void {
  const summariesPath = path.join(knowledgeDir, 'summaries.json');
  const tempPath = summariesPath + '.tmp';

  // Update generated timestamp
  const storage: SummariesDataStorage = {
    generated: new Date().toISOString(),
    directories: Object.fromEntries(data.directories),
    files: Object.fromEntries(data.files)
  }

  // Write to temp file, then rename (atomic operation)
  fs.writeFileSync(tempPath, JSON.stringify(storage, null, 2));
  fs.renameSync(tempPath, summariesPath);
}

export function mergeSummaries(knowledgeDir: string, partialSummaries: PartialSummaries): SummariesData {
  const summaries = getOrCreateSummaries(knowledgeDir);

  // Merge directories
  if (partialSummaries.directories) {
    for (const dirSummary of partialSummaries.directories) {
      if(dirSummary.technologies && dirSummary.technologies.length == 0) dirSummary.technologies = undefined;

      summaries.directories.set(dirSummary.path, {
        ...dirSummary,
        lastUpdated: new Date().toISOString()
      } as DirectorySummary);
    }
  }

  // Merge files
  if (partialSummaries.files) {
    for (const fileSummary of partialSummaries.files) {
      if(fileSummary.exports && fileSummary.exports.length == 0) fileSummary.exports = undefined;
      if(fileSummary.imports && fileSummary.imports.length == 0) fileSummary.imports = undefined;

      summaries.files.set(fileSummary.path, {
        ...fileSummary,
        lastUpdated: new Date().toISOString()
      });
    }   
  }

  writeSummaries(knowledgeDir, summaries);
  return summaries;
}