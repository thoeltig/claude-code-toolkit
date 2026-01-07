---
name: scan-and-analyze
description: Scan project and orchestrate Haiku analysis to generate summaries
---

Scan project and set up context analysis: {{args}}

Parse arguments:
- `--root`: Project root directory (default: current directory)

**Workflow:**

1. **Execute scan**
   ```bash
   ctx scan-and-analyze --root={{args.root}}
   ```
   Returns: Scan summary with file/directory counts, saved to `.context/scan.json`

2. **Display results**
   Show user:
   - Total files and directories
   - Max depth
   - File types found

3. **Invoke Haiku agents in parallel**
   - Split scan.json into batches (3-5 directories per batch)
   - Run multiple Haiku tasks in parallel using HAIKU_ANALYSIS_PROMPT.md
   - Each Haiku generates: `{ directories: {...}, files: {...} }`
   - Collect all results

4. **Merge summaries**
   ```bash
   ctx merge-summaries --summaries=<path> --root={{args.root}}
   ```
   Creates/updates `.context/.summaries.json` with all summaries

5. **Confirm success**
   ```
   ✓ Context analysis complete
     Directories: X
     Files: Y
   Next: /query-context "topic"
   ```

---

## Implementation

When user runs: `/scan-and-analyze --root=../my-project`

1. Execute `ctx scan-and-analyze --root=../my-project`
2. Parse output to get scan results
3. Invoke Haiku agents in **parallel** batches:
   - Batch 1: Directories 1-5 → Haiku analysis → summaries
   - Batch 2: Directories 6-10 → Haiku analysis → summaries
   - Batch N: Remaining → Haiku analysis → summaries
4. Merge all Haiku results together
5. Execute `ctx merge-summaries --summaries=<merged> --root=../my-project`
6. Return success message
