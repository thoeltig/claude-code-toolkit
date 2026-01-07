---
name: scan
description: Scan project and orchestrate Haiku parallel analysis
---

Scan project and generate summaries via Haiku analysis.

**Parameters:**
- `--root`: Project root directory (default: current directory)

**Implementation:**

1. **Execute scan command**
   - Run: `ctx scan --root={{args.root}}`
   - Parse JSON output to get stats and scan.json path
   - Report progress: "Scanned X files in Y directories"

2. **Load and batch scan results**
   - Read scan.json from output path
   - Extract directories for analysis
   - Split into batches (3-5 dirs per batch)
   - Display: "Preparing analysis for X batches"

3. **Invoke Haiku agents in parallel**
   - For each batch, create Task with subagent_type='haiku':
     - Use HAIKU_ANALYSIS_PROMPT.md as template
     - Pass scan batch data to Haiku
     - Instruct: Write output to `/tmp/haiku-batch-N.json`
     - Format: `{"directories":{...},"files":{...}}`
   - Run all batches concurrently using Task tool
   - Wait for all batches to finish

4. **Execute merge command**
   - Run: `ctx merge --summaries=/tmp/haiku-batch-*.json --root={{args.root}}`
   - Merge script handles reading and combining all batch files
   - Parse JSON output to confirm merge success
   - Extract directoriesCount and filesCount

6. **Report completion**
   - Display summary:
     ```
     ✓ Analysis complete
       Directories: N
       Files: N
       Summaries stored in: .context/.summaries.json
     ```
   - Guide next step: "Use `/query "topic"` to search"

**Error Handling:**
- If scan fails: Report error and stop
- If Haiku batch fails: Continue with other batches (partial results)
- If merge fails: Report error with suggestions
- All errors returned as JSON for consistency
