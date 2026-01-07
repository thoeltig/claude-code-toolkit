---
name: scan
description: Scan project and orchestrate Haiku parallel analysis
---

Scan project and generate summaries via Haiku analysis.

**Parameters:**
- `--root`: Project root directory (default: current directory)

**Workflow:**

1. Execute scan:
   ```bash
   ctx scan --root={{args.root}}
   ```
   Output (minified JSON):
   ```json
   {"status":"success","action":"scan","output":"path/to/.context/scan.json","stats":{"totalFiles":N,"totalDirs":N,"maxDepth":N,"fileTypes":[...]}}
   ```

2. Invoke Haiku agents in parallel (using Task tool):
   - Split scan.json into batches (3-5 directories per batch)
   - Run multiple Haiku tasks concurrently with HAIKU_ANALYSIS_PROMPT.md
   - Each Haiku returns summaries JSON: `{"directories":{...},"files":{...}}`
   - Merge all batch results together

3. Merge summaries into context:
   ```bash
   ctx merge --summaries=<merged-json-path> --root={{args.root}}
   ```
   Output (minified JSON):
   ```json
   {"status":"success","action":"merge","summaries":{"directoriesCount":N,"filesCount":N,"location":"path/to/.context/.summaries.json"}}
   ```

4. Confirm completion and guide next steps

**Next:** User can run `/query "topic"` to search summaries
