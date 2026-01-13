import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  size: number;
}

interface RawProjectData {
  files: FileInfo[];
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

function getFiles(dir: string, rootDir: string, files: FileInfo[]): void {
  try {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (shouldIgnore(entry)) {
        continue;
      }

      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        getFiles(fullPath, rootDir, files);
      } else if (stat.isFile()) {
        files.push({
          path: fullPath,
          size: stat.size
        });
      }
    }
  } catch (e) {}
}

export async function scanProject(location: string): Promise<RawProjectData> {
  const files: FileInfo[] = [];
  getFiles(location, location, files);
  
  const extensionCount = files.reduce(
    (acc, file) => {
      const ext = path.extname(file.path).toLowerCase() || 'none';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    files,
    projectStats: {
      totalFiles: files.length,
      extensionCount
    }
  };
}