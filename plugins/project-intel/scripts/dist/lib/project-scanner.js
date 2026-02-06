"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findKnowledgeDir = findKnowledgeDir;
exports.scanProject = scanProject;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const summary_merger_1 = require("./summary-merger");
const types_1 = require("../types");
const IGNORED_DIRS = new Set([
    'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
    '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
    '.meteor', '.angular', '.vscode', '.vs', 'vendor', 'tmp', '.cache', types_1.KNOWLEDGE_DIRECTORY, '.claude',
]);
function shouldIgnore(name) {
    return IGNORED_DIRS.has(name);
}
function trimToProjectDirFromFilepath(filepath, projectRoot) {
    // Normalize to forward slashes for consistency across platforms (git uses forward slashes)
    return path.relative(projectRoot, filepath).replace(/\\/g, '/');
}
function searchFileSystemRecursive(dir) {
    try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
            const dirPath = path.join(dir, entry);
            const stat = fs.statSync(dirPath);
            if (stat.isDirectory()) {
                if (entry === types_1.KNOWLEDGE_DIRECTORY) {
                    const fullPath = path.join(dirPath, types_1.SUMMARIES_FILE);
                    if (fs.existsSync(fullPath)) {
                        return path.normalize(fullPath);
                    }
                }
                const result = searchFileSystemRecursive(dirPath);
                if (result) {
                    return result;
                }
            }
        }
    }
    catch { }
    return undefined;
}
function getSummaryFiles(summaries) {
    const mapOfSummaryFileEntries = new Map();
    // Check for a summary if one exist filepaths can be further reduced to only the actually modified files since last scan
    if (summaries.files.size === 0) {
        // No Summary = initial scan so return all tracked files
        return mapOfSummaryFileEntries;
    }
    // Find oldest scan date and create look for filepath and date
    summaries.files
        .forEach((val, key) => {
        const dateString = val.lastUpdated;
        const lastUpdate = dateString ? new Date(dateString) : new Date();
        mapOfSummaryFileEntries.set(key, lastUpdate);
    });
    return mapOfSummaryFileEntries;
}
function getGitTrackedFiles(location) {
    // Get git tracked files in this location
    const trackedFiles = (0, child_process_1.execSync)(`git ls-files --full-name -- "${location}"`, { encoding: 'utf-8' })
        .trim()
        .split('\n');
    // Filter out the build, obj, cache, etc directorie and .claude/.knowledge directory
    const filteredTrackedFiles = trackedFiles
        .filter(f => {
        const segments = f.split('/');
        return !segments.some(x => shouldIgnore(x));
    })
        .map(x => path.join(location, x));
    return filteredTrackedFiles;
}
function isGitRepository() {
    try {
        (0, child_process_1.execSync)('git rev-parse --git-dir', { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
function getFilesFromGit(location, summaries, projectRoot) {
    const files = {
        new: [],
        modified: [],
        deleted: []
    };
    try {
        // Get git tracked files in this location
        const trackedFiles = getGitTrackedFiles(location);
        // Check for a summary if one exist filepaths can be further reduced to only the actually modified files since last scan    
        const mapOfSummaryFileEntries = getSummaryFiles(summaries);
        if (mapOfSummaryFileEntries.size === 0) {
            // No Summary = initial scan so return all tracked files
            trackedFiles.forEach(filepath => files.new.push(trimToProjectDirFromFilepath(filepath, projectRoot)));
            return files;
        }
        // Find oldest scan date and create look for filepath and date
        let since = new Date();
        mapOfSummaryFileEntries.forEach(x => {
            if (x < since)
                since = x;
        });
        // Get git log since the last update to check if the git modified date is newer then the correlating file last scan date
        const output = (0, child_process_1.execSync)(`git log --format=%ai --name-only --since="${since.toISOString()}" -- "${location}"`, { encoding: 'utf-8' });
        const lines = output.trim().split('\n');
        const modifiedFileMap = new Map();
        let currentDate = null;
        for (const line of lines) {
            if (!line)
                continue;
            // Check if this is a date line (ISO format)
            if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
                currentDate = new Date(line);
            }
            else if (currentDate && line && !line.split('/').some(x => shouldIgnore(x))) {
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
            if (!founDate) {
                files.new.push(relativePath);
            }
        });
        const set = new Set(trackedFiles);
        mapOfSummaryFileEntries.forEach((_, relativePath) => {
            const filepath = path.join(projectRoot, relativePath);
            if (filepath.startsWith(location) && set.has(filepath) === false) {
                files.deleted.push(relativePath);
            }
        });
        files.modified.push(...modifiedFileMap.keys());
        return files;
    }
    catch {
        return files;
    }
}
function getFilesFromFileSystem(location, summaries, projectRoot) {
    const files = {
        new: [],
        modified: [],
        deleted: []
    };
    try {
        const filepathesInThisLocation = new Map();
        getFilesFromFileSystemRecursive(location, location, filepathesInThisLocation);
        const mapOfSummaryFileEntries = getSummaryFiles(summaries);
        if (mapOfSummaryFileEntries.size == 0) {
            // No Summary = initial scan so return all tracked files
            filepathesInThisLocation.forEach((_, filepath) => files.new.push(trimToProjectDirFromFilepath(filepath, projectRoot)));
            return files;
        }
        filepathesInThisLocation.forEach((currentDate, filepath) => {
            const relativePath = trimToProjectDirFromFilepath(filepath, projectRoot);
            const lastDate = mapOfSummaryFileEntries.get(relativePath);
            if (!lastDate) {
                files.new.push(relativePath);
            }
            else if (currentDate > lastDate) {
                files.modified.push(relativePath);
            }
        });
        mapOfSummaryFileEntries.forEach((_, relativePath) => {
            const filepath = path.join(projectRoot, relativePath);
            if (filepath.startsWith(location) && !filepathesInThisLocation.get(filepath)) {
                files.deleted.push(relativePath);
            }
        });
        return files;
    }
    catch {
        return files;
    }
}
function getFilesFromFileSystemRecursive(dir, rootDir, filePaths) {
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
            }
            else if (stat.isFile()) {
                filePaths.set(fullPath, stat.mtime);
            }
        }
    }
    catch (e) { }
}
function deletedOldEntriesFromKnowledge(filePaths, summaries, knowledgeDir) {
    const directoryDeleteCandidates = new Set();
    filePaths.forEach(x => {
        directoryDeleteCandidates.add(path.dirname(x));
        summaries.files.delete(x);
    });
    const fileKeys = [...summaries.files.keys()];
    const remainingDictionariesInFiles = new Set(fileKeys.map(x => path.dirname(x)));
    directoryDeleteCandidates.forEach(x => {
        if (remainingDictionariesInFiles.has(x) === false) {
            summaries.directories.delete(x);
        }
    });
    (0, summary_merger_1.writeSummaries)(knowledgeDir, summaries);
    return fileKeys.length;
}
function getExtensionCounts(filePaths) {
    return filePaths.reduce((acc, file) => {
        const ext = path.extname(file).toLowerCase() || 'none';
        acc[ext] = (acc[ext] || 0) + 1;
        return acc;
    }, {});
}
function createOutput(filePaths, filesInSummary, knowledgeDir) {
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
function findKnowledgeDir(location) {
    if (isGitRepository()) {
        try {
            const fileLocation = path.join(types_1.KNOWLEDGE_DIRECTORY, types_1.SUMMARIES_FILE);
            const foundKnowledgeFile = (0, child_process_1.execSync)(`git ls-files --full-name -- "${location}"`, { encoding: 'utf-8' })
                .trim()
                .split('\n')
                .find(f => f.endsWith(fileLocation));
            if (foundKnowledgeFile) {
                return path.normalize(path.dirname(path.join(location, foundKnowledgeFile)));
            }
        }
        catch { }
    }
    const foundFile = searchFileSystemRecursive(location);
    return foundFile ? path.dirname(foundFile) : undefined;
}
async function scanProject(location, knowledgeDir) {
    const summaries = (0, summary_merger_1.getOrCreateSummaries)(knowledgeDir);
    let filesInSummary = summaries.files.size;
    if (!fs.existsSync(location)) {
        return createOutput([], filesInSummary, knowledgeDir);
    }
    const projectRoot = path.dirname(knowledgeDir);
    let files;
    if (isGitRepository()) {
        files = getFilesFromGit(location, summaries, projectRoot);
    }
    else {
        files = getFilesFromFileSystem(location, summaries, projectRoot);
    }
    if (files.deleted.length !== 0) {
        filesInSummary = deletedOldEntriesFromKnowledge(files.deleted, summaries, knowledgeDir);
    }
    return createOutput([...files.new, ...files.modified], filesInSummary, knowledgeDir);
}
//# sourceMappingURL=project-scanner.js.map