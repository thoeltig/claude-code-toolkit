---
name: query-context
description: Search project summaries or index for relevant information
---

Search project context: {{args}}

Parse arguments:
- `topic`: Search term (e.g., "validation", "auth", "database")
- `--root`: Project root (default: current directory)

**Workflow:**

1. **Execute search**
   ```bash
   ctx query-context "{{topic}}" --root={{args.root}}
   ```

2. **Smart detection:**
   - If `.context/.summaries.json` exists → search summaries (fast, ~50ms)
   - Else if `.context/.index.json` exists → search index (fallback)
   - Else → suggest running `/scan-and-analyze` first

3. **Display results**
   ```
   Found N matches for "{{topic}}":

   DIRECTORIES:
   1. path/to/dir
      Summary: ...
      Purpose: ...
      Tech: ...
      Files: X, Subdirs: Y

   FILES:
   2. path/to/file
      Summary: ...
      Purpose: ...
      Role: ...
      Exports: [...]
      Imports: [...]

   To load full content: ctx load <file-path>
   ```

4. **User can then**
   - `/query-context "refined-topic"` to search again
   - `/load-context <file>` to read full content

---

## Implementation

When user runs: `/query-context "authentication"`

1. Execute `ctx query-context "authentication" --root={{args.root}}`
2. Check if summaries exist
3. Display formatted results with directories first, then files
4. Suggest next actions (load content, refine search, run analysis)
