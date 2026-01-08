---
description: Build persistent knowledge base of your project. Run once to generate intelligent summaries of all directories and files, stored in .context/. Enable fast cross-session queries without expensive re-exploration. Use for first-time project understanding, mapping project structure, setting up team knowledge base. Update knowledge base by running it again.
argument-hint: [--root=<path>]
---

# Scan Project and Generate Context Summaries

Orchestrate a complete project scan followed by parallel Haiku analysis to generate searchable summaries.

**Process:**
1. Scan project directory structure
2. Batch directories for parallel analysis
3. Invoke Haiku agents in parallel (each batch analyzed concurrently)
4. Merge results into .context/.summaries.json
5. Report completion

**Parameters:**
- `--root`: Project root directory (default: current directory)

**Output:**
- Creates `.context/scan.json` with directory structure
- Creates `.context/.summaries.json` with analyzed summaries
- Reports: directories count, files count, storage location

**Usage Examples:**
- `/scan` - Scan current project
- `/scan --root=../my-project` - Scan specific project
- `/scan --root=/absolute/path/to/project` - Use absolute path

**Next Step:**
After scanning completes, use `/query "keyword"` to search summaries.

---

## Implementation

I will execute the following workflow:

### Step 1: Execute scan command
Execute the scanner to analyze project structure and save to scan.json.

```bash
cd "C:\Users\ThoreHöltig\Documents\ClaudeCodeToolkit\plugins\context-lifecycle-management-system\scripts"
node dist/ctx.js scan --root="$ROOT_DIR" --output="$ROOT_DIR/.context/scan.json"
```

Parse the JSON output to extract:
- Project statistics (files, directories, depth)
- Path to scan.json output file

### Step 2: Load and batch scan results
Read the scan.json file and organize directories into batches (3-5 per batch) for parallel analysis.

For each batch:
- Extract directory paths and file structure
- Create batch object with:
  - `batchNumber`: Sequential batch ID
  - `type`: "directories"
  - `items`: Array of directory paths
  - `structure`: File structure context from scan.json

Calculate total number of batches needed.

### Step 2b: Check batch count and warn if large
If total batches ≥ 20, display warning:
```
⚠️  This project will require N batches for analysis
    (Estimated: ~N minutes with 10 parallel agents)

Continue? This may take a while for large projects.
[yes/no]
```

If user declines, stop and exit.

### Step 3: Invoke Haiku agents with concurrency limit
Process batches in waves of 10-15 concurrent agents (max 10-15 parallel):

**Wave-based invocation:**
1. Launch agents for first 10-15 batches (or all if fewer)
2. Wait for all agents in wave to complete
3. Log batch results as they finish
4. Launch next wave of agents
5. Repeat until all batches processed

Display progress:
```
Processing batches: 1-15 of 45
  ✓ Batch 1 complete (25 dirs)
  ✓ Batch 2 complete (30 dirs)
  ✓ Batch 3 complete (28 dirs)
  ...

Processing batches: 16-30 of 45
  ...
```

**Per-batch invocation** (for each batch in current wave):
- Invoke haiku-batch-analysis agent using Task tool with `subagent_type='haiku'`
- Agent receives batch data and analysis instructions
- Agent writes results to `/tmp/haiku-batch-<N>.json`
- Format: Minified JSON `{"directories":{...}}` or `{"files":{...}}`

Wait for current wave to complete before launching next wave.

### Step 4: Execute merge command
Combine all batch results into project context:

```bash
cd "C:\Users\ThoreHöltig\Documents\ClaudeCodeToolkit\plugins\context-lifecycle-management-system\scripts"
node dist/ctx.js merge --summaries="/tmp/haiku-batch-*.json" --root="$ROOT_DIR"
```

Parse the JSON response to extract:
- Number of directories analyzed
- Number of files analyzed
- Location of .summaries.json

### Step 5: Report completion
Display summary to user:
```
✓ Analysis complete
  Directories: N
  Files: N
  Summaries stored in: .context/.summaries.json

Next step: Use /query "keyword" to search summaries
```

---

## Error Handling

- **Scan fails**: Report error message and stop
- **Haiku batch fails**: Log failure but continue with other batches (partial results acceptable)
- **Merge fails**: Report error with suggestion to re-run scan
- **All errors**: Return as JSON for consistency

---

## Technical Details

**CLI Command Location:**
`C:\Users\ThoreHöltig\Documents\ClaudeCodeToolkit\plugins\context-lifecycle-management-system\scripts\dist\ctx.js`

**Agent Used:**
- Agent: haiku-batch-analysis
- Model: Haiku (default)
- Output: /tmp/haiku-batch-*.json files

**Output Structure:**
```json
{
  "directories": {
    "src": {
      "summary": "...",
      "purpose": "...",
      "technologies": [...],
      "fileCount": N,
      "subdirCount": N
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
    "location": ".context/.summaries.json",
    "filesProcessed": N
  }
}
```
