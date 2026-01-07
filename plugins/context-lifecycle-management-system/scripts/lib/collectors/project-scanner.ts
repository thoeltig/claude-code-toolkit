import * as fs from 'fs';
import * as path from 'path';
import type { RawProjectData } from '../../types';

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj', '.git', '.svn']);

function walkDir(dir: string, maxDepth: number = 2, currentDepth: number = 0): string[] {
  if (currentDepth >= maxDepth) return [];
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry)) continue;
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        files.push(entry);
      } else if (stat.isDirectory()) {
        const subFiles = walkDir(fullPath, maxDepth, currentDepth + 1);
        files.push(...subFiles.map(f => path.join(entry, f)));
      }
    }
  } catch (e) {}
  return files;
}

function findFilesByPattern(rootDir: string, patterns: string[], maxDepth: number = 2): string[] {
  const results: string[] = [];
  const allFiles = walkDir(rootDir, maxDepth);
  for (const file of allFiles) {
    for (const pattern of patterns) {
      const regex = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
      if (new RegExp(`^${regex}$`, 'i').test(path.basename(file)) || new RegExp(`^${regex}$`, 'i').test(file.replace(/\\/g, '/'))) {
        results.push(file);
        break;
      }
    }
  }
  return Array.from(new Set(results));
}

function findFilesRecursive(rootDir: string, extensions: string[]): string[] {
  const results: string[] = [];
  function recurse(dir: string) {
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry)) continue;
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          if (extensions.includes(ext)) {
            const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
            results.push(relPath);
          }
        } else if (stat.isDirectory()) {
          recurse(fullPath);
        }
      }
    } catch (e) {}
  }
  recurse(rootDir);
  return results;
}

export async function scanProject(rootDir: string): Promise<RawProjectData> {
  const data: RawProjectData = {
    files: {
      packageManagers: [],
      configs: [],
      docs: [],
      source: []
    },
    structure: {
      directories: [],
      depth: 0
    },
    dependencies: {},
    readme: null
  };

  const packagePatterns = ['package.json', 'requirements.txt', 'Pipfile', 'go.mod', 'Cargo.toml', 'composer.json', 'Gemfile', 'pom.xml', 'build.gradle'];
  const pkgFiles = findFilesByPattern(rootDir, packagePatterns, 2);

  for (const file of pkgFiles) {
    data.files.packageManagers.push(file);
    try {
      const filepath = path.join(rootDir, file);
      if (file === 'package.json') {
        const pkg = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        data.dependencies['npm'] = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };
      } else if (file === 'requirements.txt') {
        const content = fs.readFileSync(filepath, 'utf8');
        const deps: Record<string, string> = {};
        content.split('\n').forEach(line => {
          const match = line.trim().match(/^([a-zA-Z0-9\-_]+)([>=<]+.*)?$/);
          if (match) {
            deps[match[1]] = match[2]?.trim() || '*';
          }
        });
        data.dependencies['pip'] = deps;
      } else if (file === 'go.mod') {
        const content = fs.readFileSync(filepath, 'utf8');
        const deps: Record<string, string> = {};
        const requireMatch = content.match(/require\s*\(([\\s\\S]*?)\)/);
        if (requireMatch) {
          requireMatch[1].split('\n').forEach(line => {
            const match = line.trim().match(/^([^\s]+)\s+(.+)$/);
            if (match) {
              deps[match[1]] = match[2];
            }
          });
        }
        data.dependencies['go'] = deps;
      } else if (file === 'Cargo.toml') {
        const content = fs.readFileSync(filepath, 'utf8');
        const deps: Record<string, string> = {};
        const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
        if (depsMatch) {
          depsMatch[1].split('\n').forEach(line => {
            const match = line.trim().match(/^([a-zA-Z0-9\-_]+)\s*=\s*"([^"]+)"/);
            if (match) {
              deps[match[1]] = match[2];
            }
          });
        }
        data.dependencies['cargo'] = deps;
      } else if (file.endsWith('.csproj')) {
        const content = fs.readFileSync(filepath, 'utf8');
        const deps: Record<string, string> = {};
        const matches = content.matchAll(/<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g);
        for (const match of matches) {
          deps[match[1]] = match[2];
        }
        data.dependencies['nuget'] = deps;
      }
    } catch (e) {
      console.error(`Warning: Could not parse ${file}`);
    }
  }

  const configPatterns = ['tsconfig.json', 'angular.json', 'next.config.js', 'next.config.ts', 'vite.config.ts', 'vite.config.js', 'appsettings.json', 'appsettings.Development.json', 'Web.config', '.env.example', 'docker-compose.yml', 'Dockerfile'];
  data.files.configs = findFilesByPattern(rootDir, configPatterns, 2);

  data.files.docs = findFilesRecursive(rootDir, ['.md']);

  const srcExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.cs', '.fs'];
  let allSource = findFilesRecursive(rootDir, srcExtensions);
  const step = Math.max(1, Math.floor(allSource.length / 20));
  data.files.source = allSource.filter((_, idx) => idx % step === 0).slice(0, 20);

  const dirs = fs.readdirSync(rootDir).filter(f => {
    if (IGNORED_DIRS.has(f)) return false;
    try {
      return fs.statSync(path.join(rootDir, f)).isDirectory();
    } catch (e) {
      return false;
    }
  });
  data.structure.directories = dirs;

  function getDepth(dir: string, d: number = 0): number {
    if (d > 10) return d;
    try {
      const entries = fs.readdirSync(dir);
      let maxD = d;
      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry)) continue;
        try {
          const stat = fs.statSync(path.join(dir, entry));
          if (stat.isDirectory()) {
            maxD = Math.max(maxD, getDepth(path.join(dir, entry), d + 1));
          }
        } catch (e) {}
      }
      return maxD;
    } catch (e) {
      return d;
    }
  }
  data.structure.depth = getDepth(rootDir);

  const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
  for (const readmeFile of readmeFiles) {
    const readmePath = path.join(rootDir, readmeFile);
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, 'utf8');
      data.readme = {
        content: content.slice(0, 5000),
        length: content.length
      };
      break;
    }
  }

  return data;
}

export function formatForHaikuAnalysis(data: RawProjectData): string {
  return JSON.stringify({
    package_managers: data.files.packageManagers,
    key_dependencies: Object.entries(data.dependencies).flatMap(([manager, deps]) =>
      Object.keys(deps).slice(0, 15).map(name => `${manager}:${name}`)
    ),
    directories: data.structure.directories,
    config_files: data.files.configs,
    doc_count: data.files.docs.length,
    sample_docs: data.files.docs.slice(0, 5),
    readme_preview: data.readme?.content.slice(0, 1000) || 'No README found',
    source_file_sample: data.files.source.slice(0, 5)
  }, null, 2);
}