---
description: Build persistent knowledge of your project by analyzing all files or a specific area. Generates intelligent summaries of files, directories, purpose and structure for fast cross-session queries without expensive re-exploration.
argument-hint: <location> [--knowledgeDir=<knowledgeDir>]
allowed-tools: Read, Bash(node:*)
---

# Scan Project and Analyze Files

Orchestrate a complete project scan followed by parallel Haiku file analysis to generate searchable summaries.

**Parameters:**
- `--location`: Folder to analyze (default: current working directory)
- `--knowledgeDir`: Where to store summaries.json (default: .knowledge/ in current working directory)
  **Note:** This is NOT relative to --location. Specify full path to use a shared knowledge directory.

**Usage Examples:**
- `/scan` - Full scan of current project
- `/scan --location=../my-project` - Full scan of specific project
- `/scan --location=/absolute/path/to/project` - Use absolute path
- `/scan --knowledgeDir=../.knowledge` - Full scan with custom knowledge directory
- `/scan --location=./plugins --knowledgeDir=./.knowledge` - Scan plugins folder, store knowledge at repo root (recommended for monorepos)

**Process:**
1. Scan provided folder path (metadata only) by script
2. Read outputed `$KNOWLEDGE_DIR/scan.json` and batch files for parallel analysis
3. Invoke Haiku agents in parallel (each batch of files analyzed concurrently)
4. Merge results into `$KNOWLEDGE_DIR/summaries.json`
5. Report completion

**Output:**
- Creates `$KNOWLEDGE_DIR/scan.json` with file list and project stats
- Creates `$KNOWLEDGE_DIR/summaries.json` with file summaries
- Reports: files count, batches processed, storage location

**Next Step:**
After scanning completes, use `/query "keyword"` to search file summaries.

---

## Implementation

### Step 1: Execute scan command
Execute the scanner to analyze project structure and save to scan.json.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js scan --location="$LOCATION" --knowledgeDir="$KNOWLEDGE_DIR"
```

Parse the JSON response to extract `path` and `size` properties.

### Step 2: Create batches from filtered files
Batch the file list (from Step 2) into groups of ~8 files per batch for parallel analysis.

### Step 3: Warn if many batches
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
2. Invoke project-intel:haiku-file-analysis agent for each batch using Task tool with `subagent_type='haiku'`
3. Each agent receives batch with file paths and contents
4. Each agent writes results to `$KNOWLEDGE_DIR/haiku-batch-<N>.json`
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
```bash
for batch in fileBatches; do
Task(
  description: "Batch ${N}: Analyze files and generate structured JSON summaries.",
  subagent_type: "project-intel:haiku-file-analysis",
  model: "haiku",
  tools: "Read, Write"
  prompt: "Read these files completely and summarize them. Write the output to `$KNOWLEDGE_DIR/haiku-batch-<N>.json` in a minified and valid JSON format.
  
  List of files:
  ${batch}

  If you are done with the summarization and verified that the JSON is valid without parsing errors just return a short completion message."
)
done
```

### Step 5: Execute merge command
Combine all batch results into project knowledge:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js merge --location="$LOCATION" --knowledgeDir="$KNOWLEDGE_DIR"
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
- Agent: project-intel:haiku-file-analysis
- Model: Haiku (default)
- Output: $KNOWLEDGE_DIR/haiku-batch-*.json files

**Scan.json Structure:**
```json
{
  "files": [
    {
        "path": "plugins\\project-intel\\README.md",
        "size": 12403
    }
  ],
  "projectStats": {
    "totalFiles": 1,
    "fileTypes": [".md"]
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