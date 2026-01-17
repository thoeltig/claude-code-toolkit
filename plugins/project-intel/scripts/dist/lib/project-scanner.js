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
exports.scanProject = scanProject;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const summary_merger_1 = require("./summary-merger");
const IGNORED_DIRS = new Set([
    'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
    '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
    '.vscode', 'vendor', 'tmp', '.cache', '.knowledge', '.claude',
]);
function shouldIgnore(name) {
    return IGNORED_DIRS.has(name) || name.startsWith('.');
}
function isGitInstalled() {
    try {
        (0, child_process_1.execSync)('git --version', { stdio: 'ignore' });
        return true;
    }
    catch {
        return false;
    }
}
function getFilesFromGit(location, knowledgeDir) {
    try {
        // Get git tracked files in this location
        const trackedFiles = (0, child_process_1.execSync)(`git ls-files --full-name -- "${location}"`, { encoding: 'utf-8' })
            .trim()
            .split('\n');
        // Filter out the build, obj, cache, etc directorie and .claude/.knowledge directory
        const filteredTrackedFiles = trackedFiles.filter(f => {
            const segments = f.split('/');
            return !segments.some(x => IGNORED_DIRS.has(x));
        });
        // Check for a summary if one exist filepaths can be further reduced to only the actually modified files since last scan
        const summary = (0, summary_merger_1.getOrCreateSummaries)(knowledgeDir);
        const summaryFileEntries = Object.entries(summary.files);
        if (summaryFileEntries.length == 0) {
            // No Summary = initial scan so return all tracked files
            return filteredTrackedFiles;
        }
        // Find oldest scan date and create look for filepath and date
        let since = new Date();
        const mapOfSummaryFileEntries = new Map();
        const trackedFilesSet = new Set(filteredTrackedFiles);
        summaryFileEntries
            .filter(x => trackedFilesSet.has(x[0]))
            .forEach(x => {
            const lastUpdate = new Date(x[1].lastUpdated);
            mapOfSummaryFileEntries.set(x[0], lastUpdate);
            if (lastUpdate < since)
                since = lastUpdate;
        });
        // Get git log since the last update to check if the git modified date is newer then the correlating file last scan date
        const output = (0, child_process_1.execSync)(`git log --format=%ai --name-only --since="${since.toISOString()}" -- "${location}"`, { encoding: 'utf-8' });
        const lines = output.trim().split('\n');
        const fileMap = new Map();
        let currentDate = null;
        for (const line of lines) {
            if (!line)
                continue;
            // Check if this is a date line (ISO format)
            if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
                currentDate = new Date(line);
            }
            else if (currentDate && line && !line.split('/').some(x => IGNORED_DIRS.has(x))) {
                // Only add if we haven't seen it yet (first = most recent)
                const lastUpdated = mapOfSummaryFileEntries.get(line);
                if ((!lastUpdated || lastUpdated < currentDate) && !fileMap.has(line)) {
                    fileMap.set(line, currentDate);
                }
            }
        }
        return [...fileMap.keys()];
    }
    catch (e) {
        return [];
    }
}
function getFiles(dir, rootDir, filePaths) {
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
            }
            else if (stat.isFile()) {
                filePaths.push(fullPath);
            }
        }
    }
    catch (e) { }
}
function getExtensionCounts(filePaths) {
    return filePaths.reduce((acc, file) => {
        const ext = path.extname(file).toLowerCase() || 'none';
        acc[ext] = (acc[ext] || 0) + 1;
        return acc;
    }, {});
}
function createOutput(filePaths) {
    return {
        filePaths,
        projectStats: {
            totalFiles: filePaths.length,
            extensionCount: getExtensionCounts(filePaths)
        }
    };
}
async function scanProject(location, knowledgeDir) {
    if (!fs.existsSync(location)) {
        return createOutput([]);
    }
    if (isGitInstalled()) {
        const files = getFilesFromGit(location, knowledgeDir);
        if (files.length !== 0) {
            return createOutput(files);
        }
    }
    const filePaths = [];
    getFiles(location, location, filePaths);
    return createOutput(filePaths);
}
//# sourceMappingURL=project-scanner.js.map