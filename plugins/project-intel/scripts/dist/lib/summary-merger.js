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
exports.getOrCreateSummaries = getOrCreateSummaries;
exports.writeSummaries = writeSummaries;
exports.mergeSummaries = mergeSummaries;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function getOrCreateSummaries(knowledgeDir) {
    const summariesPath = path.join(knowledgeDir, 'summaries.json');
    if (fs.existsSync(summariesPath)) {
        try {
            return JSON.parse(fs.readFileSync(summariesPath, 'utf8'));
        }
        catch (e) {
            console.error('Error reading summaries.json, creating new:', e);
        }
    }
    return {
        generated: new Date().toISOString(),
        directories: {},
        files: {}
    };
}
function writeSummaries(knowledgeDir, data) {
    const summariesPath = path.join(knowledgeDir, 'summaries.json');
    const tempPath = summariesPath + '.tmp';
    // Update generated timestamp
    data.generated = new Date().toISOString();
    // Write to temp file, then rename (atomic operation)
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
    fs.renameSync(tempPath, summariesPath);
}
function mergeSummaries(location, knowledgeDir, partialSummaries) {
    const summaries = getOrCreateSummaries(knowledgeDir);
    const normalizedLocation = path.normalize(location);
    const normalizedKnowledgeDir = path.normalize(knowledgeDir);
    const baseDir = normalizedKnowledgeDir.slice(0, normalizedKnowledgeDir.indexOf('.knowledge'));
    // Merge directories
    if (partialSummaries.directories) {
        for (const dirSummary of partialSummaries.directories) {
            if (dirSummary.technologies && dirSummary.technologies.length == 0)
                dirSummary.technologies = undefined;
            summaries.directories[dirSummary.path] = {
                ...dirSummary,
                lastUpdated: new Date().toISOString()
            };
        }
        const scannedDirectoryPaths = new Set(partialSummaries.directories.map(x => path.join(baseDir, x.path)));
        for (const dirPath of Object.keys(summaries.directories)) {
            const absPath = path.join(baseDir, dirPath);
            if (absPath.startsWith(normalizedLocation) && !scannedDirectoryPaths.has(absPath)) {
                delete summaries.directories[dirPath];
            }
        }
    }
    // Merge files
    if (partialSummaries.files) {
        for (const fileSummary of partialSummaries.files) {
            if (fileSummary.exports && fileSummary.exports.length == 0)
                fileSummary.exports = undefined;
            if (fileSummary.imports && fileSummary.imports.length == 0)
                fileSummary.imports = undefined;
            summaries.files[fileSummary.path] = {
                ...fileSummary,
                lastUpdated: new Date().toISOString()
            };
        }
        const scannedFilePaths = new Set(partialSummaries.files.map(x => path.join(baseDir, x.path)));
        for (const filePath of Object.keys(summaries.files)) {
            const absPath = path.join(baseDir, filePath);
            if (absPath.startsWith(normalizedLocation) && !scannedFilePaths.has(absPath)) {
                delete summaries.files[filePath];
            }
        }
    }
    writeSummaries(knowledgeDir, summaries);
    return summaries;
}
//# sourceMappingURL=summary-merger.js.map