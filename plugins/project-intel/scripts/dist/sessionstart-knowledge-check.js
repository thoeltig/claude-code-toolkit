#!/usr/bin/env node
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
/**SessionStart Hook: Check for project knowledge updates.
 *
 * Notifies user if project knowledge is available and if there are files needing update.
 * If no knowledge exists but files are present, suggests running /project-intel:scan.
 * Uses official Claude Code hook response schema with structured JSON in additionalContext.
 */
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
function outputHookResponse(systemMessage, additionalContext) {
    const response = {
        continue: true,
        suppressOutput: false,
        systemMessage: systemMessage,
        hookSpecificOutput: {
            hookEventName: 'SessionStart',
            additionalContext: JSON.stringify(additionalContext)
        }
    };
    console.log(JSON.stringify(response));
}
function outputSuggestionToRunInitialScan() {
    const additionalContext = {
        severity: 'info',
        assistant_action: 'suggest_action',
        assistant_instruction: 'Inform the user that project knowledge has not been generated yet and suggest running /project-intel:scan to generate it.',
        user_message: 'No project knowledge found. Run /project-intel:scan to generate intelligent summaries of project files for fast searches.'
    };
    outputHookResponse('Project knowledge not yet generated', additionalContext);
}
function main() {
    try {
        // .knowledge exists, proceed with normal flow
        const ctxPath = path.join(__dirname, 'ctx.js');
        const scanOutput = (0, child_process_1.execSync)(`node "${ctxPath}" scan`, {
            encoding: 'utf8',
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'ignore']
        });
        const scanData = JSON.parse(scanOutput);
        // Check if error
        if (!scanData || !scanData.projectStats.knowledgeDir) {
            outputSuggestionToRunInitialScan();
            return;
        }
        const filesNeedingUpdate = scanData.projectStats.numberOfFilesToScan || 0;
        // Generate message
        let userMessage = `You can use /project-intel:query to find relevant information about ${scanData.projectStats.totalFilesInKnowledge} files in the current project. This is a semantic and token efficient query which you can do before exploring the project to get a better understanding of where to search or to provide a quick summary.`;
        let assistantAction = 'inform_only';
        let systemMessage = 'Project knowledge is up to date';
        if (filesNeedingUpdate > 0) {
            userMessage += `\n\n${filesNeedingUpdate} files need update since last knowledge scan. Run /project-intel:scan to update.`;
            assistantAction = 'suggest_action';
            systemMessage = `Project knowledge needs update: ${filesNeedingUpdate} files detected`;
        }
        const additionalContext = {
            severity: 'info',
            assistant_action: assistantAction,
            assistant_instruction: filesNeedingUpdate > 0
                ? 'Inform the user about detected changes and suggest running /project-intel:scan.'
                : 'Inform the user that project knowledge is available for queries.',
            user_message: userMessage,
            filesNeedingUpdate
        };
        outputHookResponse(systemMessage, additionalContext);
    }
    catch {
        outputSuggestionToRunInitialScan();
    }
}
main();
//# sourceMappingURL=sessionstart-knowledge-check.js.map