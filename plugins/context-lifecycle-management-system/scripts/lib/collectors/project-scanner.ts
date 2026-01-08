import * as fs from 'fs';
import * as path from 'path';

export interface DirectoryInfo {
  type: 'directory';
  fullPath: string;
  subdirs: string[];
  files: string[];
  fileCount: number;
  depth: number;
}

export interface FileInfo {
  path: string;
  ext: string;
  size: number;
  depth: number;
}

export interface RawProjectData {
  structure: {
    [dirPath: string]: DirectoryInfo;
  };
  files: {
    [filePath: string]: FileInfo;
  };
  projectStats: {
    totalFiles: number;
    totalDirs: number;
    maxDepth: number;
    fileTypes: string[];
  };
}

const IGNORED_DIRS = new Set([
  'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
  '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
  '.vscode', 'vendor', 'tmp', '.cache'
]);

function shouldIgnore(name: string): boolean {
  return IGNORED_DIRS.has(name) || name.startsWith('.');
}

interface TreeNode {
  dirs: Map<string, TreeNode>;
  files: string[];
  fullPath: string;
  depth: number;
}

function buildFileTree(rootDir: string): TreeNode {
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
        }
      }
    } catch (e) {}
  }

  recurse(rootDir, root, 0);
  return root;
}

function flattenTreeToStructure(
  node: TreeNode,
  rootDir: string,
  structure: { [key: string]: DirectoryInfo } = {},
  files: { [key: string]: FileInfo } = {},
  filesByType: { [ext: string]: string[] } = {}
): { structure: typeof structure; files: typeof files; filesByType: typeof filesByType } {
  const relPath = path.relative(rootDir, node.fullPath).replace(/\\/g, '/') || '.';

  // Add directory info
  const subdirs = Array.from(node.dirs.keys());
  structure[relPath] = {
    type: 'directory',
    fullPath: node.fullPath,
    subdirs,
    files: node.files,
    fileCount: node.files.length,
    depth: node.depth
  };

  // Add file info
  for (const file of node.files) {
    const filePath = path.join(node.fullPath, file);
    const fileRelPath = path.relative(rootDir, filePath).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase() || 'none';
    const stat = fs.statSync(filePath);

    files[fileRelPath] = {
      path: fileRelPath,
      ext,
      size: stat.size,
      depth: node.depth
    };

    if (!filesByType[ext]) {
      filesByType[ext] = [];
    }
    filesByType[ext].push(fileRelPath);
  }

  // Recurse into subdirectories
  for (const [_, childNode] of node.dirs) {
    flattenTreeToStructure(childNode, rootDir, structure, files, filesByType);
  }

  return { structure, files, filesByType };
}

function parsePackageManager(rootDir: string, filename: string): Record<string, string> {
  try {
    const filepath = path.join(rootDir, filename);

    if (filename === 'package.json') {
      const pkg = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
    } else if (filename === 'requirements.txt') {
      const content = fs.readFileSync(filepath, 'utf8');
      const deps: Record<string, string> = {};
      content.split('\n').forEach(line => {
        const match = line.trim().match(/^([a-zA-Z0-9\-_.]+)([>=<~!]+.*)?$/);
        if (match && match[1]) {
          deps[match[1]] = match[2]?.trim() || '*';
        }
      });
      return deps;
    } else if (filename === 'go.mod') {
      const content = fs.readFileSync(filepath, 'utf8');
      const deps: Record<string, string> = {};
      const requireMatch = content.match(/require\s*\(([\\s\\S]*?)\)/);
      if (requireMatch) {
        requireMatch[1].split('\n').forEach(line => {
          const match = line.trim().match(/^([^\s]+)\s+(.+)$/);
          if (match && match[1]) {
            deps[match[1]] = match[2];
          }
        });
      }
      return deps;
    } else if (filename === 'Cargo.toml') {
      const content = fs.readFileSync(filepath, 'utf8');
      const deps: Record<string, string> = {};
      const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
      if (depsMatch) {
        depsMatch[1].split('\n').forEach(line => {
          const match = line.trim().match(/^([a-zA-Z0-9\-_.]+)\s*=\s*["{]([^"}]+)/);
          if (match && match[1]) {
            deps[match[1]] = match[2];
          }
        });
      }
      return deps;
    } else if (filename === 'composer.json') {
      const pkg = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      return {
        ...pkg.require,
        ...pkg['require-dev']
      };
    } else if (filename === 'Gemfile') {
      const content = fs.readFileSync(filepath, 'utf8');
      const deps: Record<string, string> = {};
      const gemMatches = content.matchAll(/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/g);
      for (const match of gemMatches) {
        deps[match[1]] = match[2] || '*';
      }
      return deps;
    } else if (filename === 'pom.xml' || filename === 'build.gradle') {
      // XML/Gradle parsing is complex, return empty for now
      return {};
    } else if (filename.endsWith('.csproj')) {
      const content = fs.readFileSync(filepath, 'utf8');
      const deps: Record<string, string> = {};
      const matches = content.matchAll(/<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g);
      for (const match of matches) {
        deps[match[1]] = match[2];
      }
      return deps;
    }
  } catch (e) {}

  return {};
}

export async function scanProject(rootDir: string): Promise<RawProjectData> {
  // Build complete file tree
  const tree = buildFileTree(rootDir);

  // Flatten to structure + files + filesByType
  const { structure, files, filesByType } = flattenTreeToStructure(tree, rootDir);

  // Find and parse package managers
  const packageManagers: string[] = [];
  const dependencies: Record<string, Record<string, string>> = {};

  const packageFiles = [
    'package.json',
    'requirements.txt',
    'Pipfile',
    'go.mod',
    'Cargo.toml',
    'composer.json',
    'Gemfile',
    'pom.xml',
    'build.gradle'
  ];

  // Search for package files in root and subdirectories (max depth 2)
  function findPackageFiles(dir: string, depth: number = 0): string[] {
    if (depth > 2) return [];
    const found: string[] = [];

    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (packageFiles.includes(entry)) {
          found.push(path.join(dir, entry));
        } else if (!shouldIgnore(entry)) {
          const fullPath = path.join(dir, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            found.push(...findPackageFiles(fullPath, depth + 1));
          }
        }
      }
    } catch (e) {}

    return found;
  }

  const foundPkgFiles = findPackageFiles(rootDir);
  for (const pkgPath of foundPkgFiles) {
    const filename = path.basename(pkgPath);
    packageManagers.push(pkgPath);

    // Map filename to manager type
    let manager = 'npm';
    if (filename === 'requirements.txt' || filename === 'Pipfile') manager = 'pip';
    else if (filename === 'go.mod') manager = 'go';
    else if (filename === 'Cargo.toml') manager = 'cargo';
    else if (filename === 'composer.json') manager = 'composer';
    else if (filename === 'Gemfile') manager = 'bundler';
    else if (filename === 'pom.xml') manager = 'maven';
    else if (filename === 'build.gradle') manager = 'gradle';
    else if (filename.endsWith('.csproj')) manager = 'nuget';

    const deps = parsePackageManager(rootDir, filename);
    if (Object.keys(deps).length > 0) {
      dependencies[manager] = deps;
    }
  }

  // Search for .csproj files anywhere
  if (filesByType['.csproj']) {
    for (const csprojPath of filesByType['.csproj']) {
      const fullPath = path.join(rootDir, csprojPath);
      const deps = parsePackageManager(fullPath, path.basename(csprojPath));
      if (Object.keys(deps).length > 0) {
        dependencies['nuget'] = { ...dependencies['nuget'], ...deps };
      }
    }
  }

  // Find README
  let readme: { content: string; length: number } | null = null;
  const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
  for (const readmeFile of readmeFiles) {
    const readmePath = path.join(rootDir, readmeFile);
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf8');
      readme = {
        content: content.slice(0, 5000),
        length: content.length
      };
      break;
    }
  }

  // Calculate stats
  const maxDepth = Math.max(...Object.values(structure).map(d => d.depth), 0);
  const fileTypes = Object.keys(filesByType).sort();

  return {
    structure,
    files,
    projectStats: {
      totalFiles: Object.keys(files).length,
      totalDirs: Object.keys(structure).length,
      maxDepth,
      fileTypes
    }
  };
}

export function formatForHaikuAnalysis(data: RawProjectData): string {
  // Compact summary for Haiku analysis
  const topDirs = Object.entries(data.structure)
    .filter(([_, d]) => d.depth <= 2)
    .slice(0, 15)
    .map(([dirPath, dir]) => `${dirPath} (${dir.fileCount} files)`);

  return JSON.stringify({
    totalFiles: data.projectStats.totalFiles,
    totalDirs: data.projectStats.totalDirs,
    maxDepth: data.projectStats.maxDepth,
    fileTypes: data.projectStats.fileTypes,
    topDirectories: topDirs,
    instructions: 'Analyze this directory structure and generate summaries for each directory and file. Output as JSON with directories and files keys.'
  }, null, 2);
}