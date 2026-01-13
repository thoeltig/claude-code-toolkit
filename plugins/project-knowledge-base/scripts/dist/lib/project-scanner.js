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
const IGNORED_DIRS = new Set([
    'node_modules', 'dist', 'build', '.next', '__pycache__', 'target', 'bin', 'obj',
    '.git', '.svn', 'coverage', '.pytest_cache', '.venv', 'venv', '.env', '.idea',
    '.vscode', 'vendor', 'tmp', '.cache'
]);
function shouldIgnore(name) {
    return IGNORED_DIRS.has(name) || name.startsWith('.');
}
function getFiles(dir, rootDir, files) {
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
            }
            else if (stat.isFile()) {
                files.push({
                    path: fullPath,
                    size: stat.size
                });
            }
        }
    }
    catch (e) { }
}
async function scanProject(scanDir) {
    const files = [];
    getFiles(scanDir, scanDir, files);
    const extensionCount = files.reduce((acc, file) => {
        const ext = path.extname(file.path).toLowerCase() || 'none';
        acc[ext] = (acc[ext] || 0) + 1;
        return acc;
    }, {});
    return {
        files,
        projectStats: {
            totalFiles: files.length,
            extensionCount
        }
    };
}
//# sourceMappingURL=project-scanner.js.map