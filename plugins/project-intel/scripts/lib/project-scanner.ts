import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

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

function getFiles(dir: string, rootDir: string, filePaths: string[]): void {
  if (!fs.existsSync(dir)) {
    return;
  }

  try {
    const files = execSync(`git ls-files --full-name -- "${path.normalize(dir)}"`, { encoding: 'utf-8' })
      .trim()
      .split('\n');
    const filtered = files.filter(file => {
      const segments = file.split('/');
      return !segments.some(x => IGNORED_DIRS.has(x));
    });
    filePaths.push(...filtered);
    return;
  } catch (e) {}
    
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

export async function scanProject(location: string): Promise<RawProjectData> {
  const filePaths: string[] = [];
  getFiles(location, location, filePaths);
  
  const extensionCount = filePaths.reduce(
    (acc, file) => {
      const ext = path.extname(file).toLowerCase() || 'none';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    filePaths,
    projectStats: {
      totalFiles: filePaths.length,
      extensionCount
    }
  };
}