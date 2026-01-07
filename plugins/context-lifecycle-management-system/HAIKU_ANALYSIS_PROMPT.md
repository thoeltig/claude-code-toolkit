# Haiku Parallel Analysis Workflow

## Overview

After scanner produces `structure.json`, Haiku models analyze directories and files in parallel batches:

1. **Batch 1:** Analyze directories (one Haiku per 3-5 directories)
2. **Batch 2:** Analyze files (one Haiku per 5-10 files)
3. **Merge:** Main script merges partial results into `.summaries.json`

## Example Prompt (Directory Analysis)

```
Analyze these directories and generate summaries. Output valid JSON only.

DIRECTORIES TO ANALYZE:
{
  ".": ["commands", "scripts", "skills"],
  "skills": ["managing-agent-skills", "managing-hooks", "managing-mcps"],
  "skills/managing-agent-skills": ["templates"]
}

FILE STRUCTURE (for context):
{
  ".": 3 files (CHANGELOG.md, documentation_sources.json, README.md),
  "commands": 1 file (list-skills.md),
  "scripts": 1 file (list-skills.py),
  "skills": 7 subdirs, 0 files,
  "skills/managing-agent-skills": 10 files (analysis-framework.md, best-practices.md, ...),
  "skills/managing-agent-skills/templates": 1 file (skill-template.md),
  ...
}

TASK:
For each directory, generate a summary with:
- summary: One sentence describing the directory's purpose
- purpose: What role this directory plays in the project
- technologies: Technologies/frameworks used here (e.g., ["TypeScript", "React"])
- fileCount: Number of files (MUST match structure above)
- subdirCount: Number of subdirectories

OUTPUT FORMAT (JSON only, no markdown):
{
  "directories": {
    ".": {
      "summary": "Root project directory containing Claude Code plugin documentation and utilities",
      "purpose": "Main entry point for the Claude Code Capabilities plugin",
      "technologies": ["Markdown", "Python"],
      "fileCount": 3,
      "subdirCount": 3
    },
    "skills": {
      "summary": "Collection of skill guides organized by capability area",
      "purpose": "Documentation and examples for Claude Code features",
      "technologies": ["Markdown"],
      "fileCount": 0,
      "subdirCount": 7
    },
    ...
  }
}
```

## Example Prompt (File Analysis)

```
Analyze these files and generate summaries. Output valid JSON only.

FILES TO ANALYZE:
[
  "skills/managing-agent-skills/SKILL.md",
  "skills/managing-agent-skills/best-practices.md",
  "skills/managing-hooks/SKILL.md",
  "commands/list-skills.md",
  "scripts/list-skills.py"
]

TASK:
For each file, generate a summary with:
- summary: One sentence describing what the file contains/does
- purpose: How this file serves the project
- role: What type of file this is (e.g., "documentation", "implementation", "configuration")
- exports: Key concepts/exports (for code) or sections (for docs)
- imports: Dependencies or prerequisite knowledge

OUTPUT FORMAT (JSON only, no markdown):
{
  "files": {
    "skills/managing-agent-skills/SKILL.md": {
      "summary": "Main skill file documenting how to manage and create Claude Code agent skills",
      "purpose": "User-facing documentation for skill management",
      "role": "documentation",
      "exports": ["Creating Skills", "Updating Skills", "Testing Skills", "Publishing Skills"],
      "imports": ["Agent Basics", "Claude Code Fundamentals"]
    },
    "skills/managing-hooks/SKILL.md": {
      "summary": "Complete guide to implementing and using hooks in Claude Code",
      "purpose": "Reference documentation for hook configuration and usage",
      "role": "documentation",
      "exports": ["Hook Types", "Configuration", "Response Schemas", "Examples"],
      "imports": ["Hooks Concept"]
    },
    "scripts/list-skills.py": {
      "summary": "Python utility script to list and enumerate available skills",
      "purpose": "Helper tool for discovering installed skills",
      "role": "implementation",
      "exports": ["list_all_skills()", "get_skill_metadata()"],
      "imports": ["json", "pathlib", "os"]
    },
    ...
  }
}
```

## Workflow Script (Pseudo-code)

```typescript
// 1. Scan project
const scanResult = await scanProject(rootDir);

// 2. Group directories into batches (3-5 per batch)
const dirBatches = batchDirectories(scanResult.structure, 3);

// 3. Spawn parallel Haiku tasks for each batch
const dirSummaryPromises = dirBatches.map(batch =>
  haikuAnalyze(batch, 'DIRECTORY_ANALYSIS_PROMPT')
);

// 4. Group files into batches (5-10 per batch)
const fileBatches = batchFiles(scanResult.files, 5);

// 5. Spawn parallel Haiku tasks for each batch
const fileSummaryPromises = fileBatches.map(batch =>
  haikuAnalyze(batch, 'FILE_ANALYSIS_PROMPT')
);

// 6. Wait for all summaries
const dirSummaries = await Promise.all(dirSummaryPromises);
const fileSummaries = await Promise.all(fileSummaryPromises);

// 7. Merge into .summaries.json
for (const dirBatch of dirSummaries) {
  mergeSummaries(contextDir, { directories: dirBatch });
}

for (const fileBatch of fileSummaries) {
  mergeSummaries(contextDir, { files: fileBatch });
}

console.log('✓ All summaries generated and merged');
```

## Advantages of This Approach

1. **Parallel execution**: Analyze multiple batches simultaneously (20 Haikus analyzing 20 files takes ~same time as 1 Haiku)
2. **Single pass**: Project analyzed once, summaries stored permanently
3. **Token efficient**: Query summaries instead of reloading files
4. **Modular**: Each Haiku focuses on 3-5 dirs or 5-10 files (focused analysis)
5. **Mergeable**: Partial results combine into one `.summaries.json`
6. **Updateable**: Re-run Haiku for specific directories/files, merge updated summaries

## Example `.summaries.json`

```json
{
  "version": "1.0",
  "generated": "2026-01-07T17:30:00Z",
  "directories": {
    ".": {
      "summary": "Root project directory containing Claude Code plugin",
      "purpose": "Main entry point",
      "technologies": ["Markdown", "Python"],
      "fileCount": 3,
      "subdirCount": 3,
      "lastUpdated": "2026-01-07T17:30:00Z"
    },
    "skills": {
      "summary": "Collection of skill guides",
      "purpose": "Documentation for Claude Code features",
      "technologies": ["Markdown"],
      "fileCount": 0,
      "subdirCount": 7,
      "lastUpdated": "2026-01-07T17:30:00Z"
    }
  },
  "files": {
    "skills/managing-agent-skills/SKILL.md": {
      "summary": "Main skill file documenting agent skill management",
      "purpose": "User-facing documentation",
      "role": "documentation",
      "exports": ["Creating Skills", "Testing", "Publishing"],
      "imports": ["Agent Basics"],
      "lastUpdated": "2026-01-07T17:30:00Z"
    },
    "scripts/list-skills.py": {
      "summary": "Python utility to list available skills",
      "purpose": "Helper tool for skill discovery",
      "role": "implementation",
      "exports": ["list_all_skills()"],
      "imports": ["json", "pathlib"],
      "lastUpdated": "2026-01-07T17:30:00Z"
    }
  }
}
```

## Query Examples

Once `.summaries.json` exists, queries become minimal token:

```bash
# Find all directories about "validation"
ctx query-context "validation" --layer=summaries --type=directories

# Find files related to "authentication"
ctx query-context "authentication" --layer=summaries --type=files

# Get summary for specific directory
ctx load-context "summaries/skills/managing-hooks"
```

Each returns only relevant summaries + metadata, NOT full file contents.
