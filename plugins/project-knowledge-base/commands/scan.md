---
description: Build persistent knowledge base of your project by analyzing all files. Run once to generate intelligent summaries of files stored in .knowledge/. Enable fast cross-session queries without expensive re-exploration. Use for first-time project understanding and file-level navigation.
argument-hint: [--root=<path>]
---

# Scan Project and Analyze Files

Orchestrate a complete project scan followed by parallel Haiku file analysis to generate searchable summaries.

**Process:**
1. Scan project directory structure (metadata only)
2. Extract and batch files for parallel analysis
3. Invoke Haiku agents in parallel (each batch of files analyzed concurrently)
4. Merge results into .knowledge/summaries.json
5. Report completion

**Parameters:**
- `--root`: Project root directory (default: current directory)

**Output:**
- Creates `.knowledge/scan.json` with file/directory metadata
- Creates `.knowledge/summaries.json` with file summaries
- Reports: files count, batches processed, storage location

**Parameters (Full List):**
- `--root`: Project root directory (default: current directory)
- `--incremental`: Enable incremental updates (optional)
  - Values: `git`, `modified`, `paths`
  - See "Incremental Scanning" section below
- `--since`: Git commit/date for `--incremental=git` (optional)
- `--paths`: Comma-separated file/folder paths for `--incremental=paths` (optional)

**Usage Examples:**
- `/scan` - Full scan of current project
- `/scan --root=../my-project` - Full scan of specific project
- `/scan --root=/absolute/path/to/project` - Use absolute path
- `/scan --incremental=modified` - Rescan only files modified since last scan
- `/scan --incremental=git --since=HEAD~5` - Rescan files changed in last 5 commits
- `/scan --incremental=paths --paths="src/auth,plugins/fetch"` - Rescan only specific folders
- `/scan --incremental=modified --root=../legacy-project` - Incremental scan of external project

**Next Step:**
After scanning completes, use `/query "keyword"` to search file summaries.

---

## Incremental Scanning (Optional)

For active development, full rescans are expensive. Use `--incremental` to process only changed files:

### Approach 1: Modified Files (`--incremental=modified`)
Compares current file timestamps/content against last scan metadata stored in `.knowledge/scan.json`. Only files newer than the last scan are re-analyzed.

**When to use:** Frequent development, small change sets, fast feedback loop
**Pros:** Simple, no dependencies (no git required), fast
**Cons:** Relies on file timestamps (can be unreliable after git operations)

```bash
/scan --incremental=modified
```

### Approach 2: Git History (`--incremental=git`)
Checks git history since last scan commit or specified `--since` parameter. Only files changed in that commit range are re-analyzed.

**When to use:** Committed work, full git history available, reliable source of truth
**Pros:** Reliable, captures only intentional changes, ignore untracked files
**Cons:** Requires git repo, slower (git log needed)

```bash
/scan --incremental=git
/scan --incremental=git --since=HEAD~10  # Last 10 commits
/scan --incremental=git --since="2024-01-01"  # Since date
```

### Approach 3: Path Filter (`--incremental=paths`)
Rescans only specified file paths or directories. Useful for targeted analysis of specific areas (e.g., after plugin updates, new module development).

**When to use:** Focused refactoring, plugin development, team collaboration on specific areas
**Pros:** Precise control, fast, ideal for code reviews
**Cons:** Manual path selection needed, requires knowing what changed

```bash
/scan --incremental=paths --paths="src/auth"
/scan --incremental=paths --paths="src/auth,plugins/fetch,lib/utils"
/scan --incremental=paths --paths="." --root=./new-module  # New module analysis
```

**Merge Behavior:** All incremental approaches merge results with existing `.knowledge/summaries.json`:
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
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js scan --root="$ROOT_DIR" --output="$ROOT_DIR/.knowledge/scan.json"
```

Parse the JSON output to extract:
- Project statistics (files, directories, depth)
- Path to scan.json output file

### Step 2: Load scan.json and extract files
Read the scan.json file and extract all files linearly.

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
4. Each agent writes results to `$ROOT_DIR/.knowledge/tmp/haiku-batch-<N>.json`
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
- Output: `$ROOT_DIR/.knowledge/tmp/haiku-batch-<N>.json` containing file summaries
- Format: Minified JSON `{"files":{"path":{"summary":"...","purpose":"...","role":"...","exports":[...],"imports":[...]}}}`

### Step 5: Execute merge command
Combine all batch results into project knowledge:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js merge --summaries="$ROOT_DIR/.knowledge/tmp/haiku-batch-*.json" --root="$ROOT_DIR"
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
- Output: /tmp/haiku-batch-*.json files

**File Output Structure:**
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