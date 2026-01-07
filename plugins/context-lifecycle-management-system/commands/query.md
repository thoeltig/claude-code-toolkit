---
name: query
description: Search project summaries for relevant information
---

Search project summaries by topic.

**Parameters:**
- `topic`: Search term (e.g., "validation", "auth", "database")
- `--root`: Project root directory (default: current directory)

**Workflow:**

1. Execute search:
   ```bash
   ctx query "{{topic}}" --root={{args.root}}
   ```

2. Retrieve and parse JSON results:
   ```json
   {
     "source":"summaries",
     "query":"topic",
     "total":N,
     "directories":[{"path":"...", "summary":"...", "purpose":"...", "technologies":[...], "fileCount":N, "subdirCount":N, ...}],
     "files":[{"path":"...", "summary":"...", "purpose":"...", "role":"...", "exports":[...], "imports":[...], ...}]
   }
   ```

3. Parse results:
   - Extract total match count
   - Separate directories from files
   - Format for user display

4. Display to user in readable format with:
   - Directory results with summaries, purposes, technologies
   - File results with summaries, purposes, roles, exports/imports
   - Suggestion to run further queries or load full files

**Error handling:**
- If `.context/.summaries.json` missing: Error "No context found. Run: ctx scan first."
- If query fails: Return JSON error object

**Next:** User can run `/query "refined-topic"` to search again
