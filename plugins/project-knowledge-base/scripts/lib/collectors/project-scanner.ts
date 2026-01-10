import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
  path: string;
  size: number;
  modified: Date;
}

interface RawProjectData {
  files: FileInfo[];
  projectStats: {
    totalFiles: number;
    fileTypes: string[];
  };
}

interface TreeNode {
  dirs: Map<string, TreeNode>;
  files: string[];
  fullPath: string;
  depth: number;
}

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
  '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
  '.vscode', 'vendor', 'tmp', '.cache'
]);

function shouldIgnore(name: string): boolean {
  return IGNORED_DIRS.has(name) || name.startsWith('.');
}

function buildFileTree(pathsArg: string[]): { tree: TreeNode; rootDir: string } {
  const processedFiles = new Set<string>();

  // Separate folders and files
  const folders: string[] = [];
  const files: string[] = [];

  for (const p of pathsArg) {
    if (!fs.existsSync(p)) continue;
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      folders.push(path.resolve(p));
    } else if (stat.isFile()) {
      files.push(path.resolve(p));
    }
  }

  // Use first folder as rootDir, or cwd if only files provided
  let rootDir = folders.length > 0 ? folders[0] : process.cwd();

  const root: TreeNode = {
    dirs: new Map(),
    files: [],
    fullPath: rootDir,
    depth: 0
  };

  function recurse(dir: string, node: TreeNode, depth: number = 0) {
    if (depth > 20) return; // Safety limit

    try {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        if (shouldIgnore(entry)) continue;

        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          const childNode: TreeNode = {
            dirs: new Map(),
            files: [],
            fullPath,
            depth: depth + 1
          };
          node.dirs.set(entry, childNode);
          recurse(fullPath, childNode, depth + 1);
        } else if (stat.isFile()) {
          node.files.push(entry);
          processedFiles.add(fullPath);
        }
      }
    } catch (e) {}
  }

  // Process all folders
  for (const folder of folders) {
    if (folder === rootDir) {
      // Root folder - recurse directly into it
      recurse(folder, root, 0);
    } else {
      // Other folder - add as child of root
      const folderName = path.basename(folder);
      const childNode: TreeNode = {
        dirs: new Map(),
        files: [],
        fullPath: folder,
        depth: 1
      };
      root.dirs.set(folderName, childNode);
      recurse(folder, childNode, 1);
    }
  }

  // Process individual files (skip those already found in folders)
  for (const file of files) {
    if (processedFiles.has(file)) continue; // Already found in a folder
    processedFiles.add(file);

    const fileName = path.basename(file);
    root.files.push(fileName);
  }

  return { tree: root, rootDir };
}

function flattenTreeToStructure(
  node: TreeNode,
  rootDir: string,
  files: FileInfo[],
) {
  // Add file info
  for (const file of node.files) {
    const filePath = path.join(node.fullPath, file);
    const stat = fs.statSync(filePath);

    files.push({
      path: filePath,
      size: stat.size,
      modified: stat.mtime
    });
  }

  // Recurse into subdirectories
  for (const [_, childNode] of node.dirs) {
    flattenTreeToStructure(childNode, rootDir, files);
  }
}

export async function scanProject(paths: string[]): Promise<RawProjectData> {
  // Build complete file tree from paths (folders + files)
  const { tree, rootDir } = buildFileTree(paths);
  const files:FileInfo[] = [];
  flattenTreeToStructure(tree, rootDir, files);

  const types = new Set<string>();
  for (const file of files) {
    const ext = path.extname(file.path).toLowerCase() || 'none';
    types.add(ext);
  }

  const fileTypes = [...types].sort();
  return {
    files,
    projectStats: {
      totalFiles: files.length,
      fileTypes
    }
  };
}