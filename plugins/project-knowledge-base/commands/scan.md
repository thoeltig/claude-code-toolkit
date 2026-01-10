---
description: Build persistent knowledge base of your project by analyzing all files. Run once to generate intelligent summaries of files stored in .knowledge/. Enable fast cross-session queries without expensive re-exploration. Use for first-time project understanding and file-level navigation.
argument-hint: [--paths=<paths>] [--incremental=git|modified|paths] [--since=<commitOrDate>] [--knowledgeDir=<knowledgeDir>]
allowed-tools: Read, Bash(node:*)
---

# Scan Project and Analyze Files

Orchestrate a complete project scan followed by parallel Haiku file analysis to generate searchable summaries.

**Parameters:**
- `--paths`: Comma-separated file/folder paths to scan (default: current project directory)
- `--incremental`: Enable automatic change detection (optional)
  - Values: `git`, `modified`
  - See "Incremental Scanning" section below
- `--since`: Git commit/date for `--incremental=git` (optional)
- `--knowledgeDir`: Project knowledge directory (default: .knowledge in current directory)

**Usage Examples:**
- `/scan` - Full scan of current project
- `/scan --paths=../my-project` - Full scan of specific project
- `/scan --paths=/absolute/path/to/project` - Use absolute path
- `/scan --paths="src/auth,plugins/fetch"` - Scan only specific folders
- `/scan --paths=file1.ts,file2.ts` - Scan only specific files
- `/scan --incremental=modified` - Rescan only files modified since last scan (timestamp-based)
- `/scan --incremental=git` - Rescan files changed in git since last scan
- `/scan --incremental=git --since=HEAD~5` - Rescan files changed in last 5 commits
- `/scan --paths="src/auth" --incremental=modified` - Scan src/auth folder with timestamp-based change detection
- `/scan --knowledgeDir=../project/.knowledge` - Full scan and output to specific knowledge directory

**Process:**
1. Scan provided folder paths structure (metadata only)
2. Extract and batch files for parallel analysis
3. Invoke Haiku agents in parallel (each batch of files analyzed concurrently)
4. Merge results into .knowledge/summaries.json
5. Report completion

**Parameters:**

**Output:**
- Creates `.knowledge/scan.json` with file list and project stats
- Creates `.knowledge/summaries.json` with file summaries
- Reports: files count, batches processed, storage location

**Next Step:**
After scanning completes, use `/query "keyword"` to search file summaries.

---

## Incremental Scanning (Optional)

For active development, full rescans are expensive. Use `--incremental` to process only changed files:

### Approach 1: Modified Files (`--incremental=modified`)
The scanner compares file timestamps against previous scan.json. Only files modified since the last scan are included in the new scan.json for analysis.

**When to use:** Frequent development, small change sets, fast feedback loop
**Pros:** Simple, no dependencies (no git required), fast
**Cons:** Relies on file timestamps (can be unreliable after git operations)

```bash
/scan --incremental=modified
```

### Approach 2: Git History (`--incremental=git`)
The scanner checks git history since the last scan or specified `--since` parameter. Only files changed in that commit range are included in scan.json for analysis.

**When to use:** Committed work, full git history available, reliable source of truth
**Pros:** Reliable, captures only intentional changes, ignores untracked files
**Cons:** Requires git repo, slower (git log needed)

```bash
/scan --incremental=git
/scan --incremental=git --since=HEAD~10  # Last 10 commits
/scan --incremental=git --since="2024-01-01"  # Since date
```

---

## Direct Path Selection vs Incremental Detection

Use `--paths` for **direct control** over what to scan:
- Fastest for targeted analysis (specify exactly what you need)
- No change detection overhead
- Example: `/scan --paths="src/auth,plugins/fetch"`

Use `--incremental` for **automatic change detection**:
- Processes only changed/modified files automatically
- Combines with `--paths` to limit scope: `/scan --paths="src" --incremental=modified`
- Example: `/scan --incremental=git --since=HEAD~10` scans your whole project but only changed files

**Merge Behavior:** All scan approaches merge results with existing `.knowledge/summaries.json`:
- Updated files: Summaries replaced with new analysis
- Deleted files: Entries removed from summaries
- New files: Summaries added to knowledge base
- Unchanged files: Retained from previous scan

---

## Implementation

I will execute the following workflow:

### Step 1: Execute scan command
Execute the scanner to analyze project structure and save to scan.json.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js scan --paths="$PATHS" --knowledgeDir="$KNOWLEDGE_DIR"
```

Parse the JSON output to extract:
- Project statistics (files, directories, depth)
- Path to scan.json output file

### Step 2: Load scan.json and extract files
Read the scan.json file. Extract the `files` array (flat list of file objects with `path` and `size` properties).

### Step 3b: Warn if many batches
If total batches ≥ 20, display warning about processing time:
```
⚠️  This project requires N batches for analysis
    (Estimated: ~N minutes with 10 parallel agents)

Continue? This may take a while for large projects.
[yes/no]
```

### Step 4: Invoke Haiku agents in waves
Process batches in waves of max 10 concurrent agents:

**Wave-based invocation:**
1. Prepare first 10 batches (or all if fewer)
2. Invoke project-knowledge-base:haiku-batch-analysis agent for each batch using Task tool with `subagent_type='haiku'`
3. Each agent receives batch with file paths and contents
4. Each agent writes results to `$KNOWLEDGE_DIR/summaries/haiku-batch-<N>.json`
5. Wait for wave to complete
6. Launch next wave of agents
7. Repeat until all batches processed

**Progress Display:**
```
Created 15 batches for 122 files
Processing wave: batches 1-10 of 15
  ✓ Batch 1 complete (8 files)
  ✓ Batch 2 complete (8 files)
  ...
Processing wave: batches 11-15 of 15
  ✓ Batch 11 complete (8 files)
  ...
```

**Per-batch invocation:**
- Agent: haiku-batch-analysis (from plugins/project-knowledge-base/agents/haiku-batch-analysis.md)
- Input: Batch object with file paths and contents
- Output: `$KNOWLEDGE_DIR/summaries/haiku-batch-<N>.json` containing file summaries
- Format: Minified JSON `{"files":{"path":{"summary":"...","purpose":"...","role":"...","exports":[...],"imports":[...]}}}`

### Step 5: Execute merge command
Combine all batch results into project knowledge:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js merge --summaries="$KNOWLEDGE_DIR/summaries/haiku-batch-*.json" --knowledgeDir="$KNOWLEDGE_DIR"
```

Parse the JSON response to extract:
- Number of files analyzed
- Location of summaries.json

### Step 6: Report completion
Display summary to user:
```
✓ Analysis complete
  Files analyzed: N
  Batches processed: N
  Summaries stored in: .knowledge/summaries.json

Next step: Use /query "keyword" to search file summaries
```

---

## Error Handling

- **Scan fails**: Report error message and stop
- **File read fails**: Log error, continue with next file ("[Error reading file]" placeholder)
- **Haiku batch fails**: Log failure but continue with other batches (partial results acceptable)
- **Merge fails**: Report error with suggestion to re-run scan
- **All errors**: Return as JSON for consistency

---

## Technical Details

**CLI Command Location:**
`${CLAUDE_PLUGIN_ROOT}\scripts\dist\ctx.js`

**Agent Used:**
- Agent: haiku-batch-analysis
- Model: Haiku (default)
- Output: /summaries/haiku-batch-*.json files

**Scan.json Structure:**
```json
{
  "files": [
    {
      "path": "C:\\path\\to\\file.ts",
      "size": 1234,
      "modified": 1704067200000
    }
  ],
  "projectStats": {
    "totalFiles": 123,
    "fileTypes": [".json", ".md", ".py", ".ts"]
  }
}
```

**File Analysis Output Structure:**
```json
{
  "files": {
    "path/to/file.ts": {
      "summary": "One sentence describing file",
      "purpose": "1-2 sentences explaining role",
      "role": "implementation|documentation|configuration|test|build|script",
      "exports": ["export1", "export2"],
      "imports": ["dep1", "dep2"]
    }
  }
}
```

**Merge Result:**
```json
{
  "status": "success",
  "action": "merge",
  "summaries": {
    "directoriesCount": N,
    "filesCount": N,
    "location": ".knowledge/summaries.json",
    "filesProcessed": N
  }
}
```