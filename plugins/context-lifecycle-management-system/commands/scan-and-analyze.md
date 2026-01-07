---
name: scan-and-analyze
description: Scan project and orchestrate Haiku analysis. Creates directory/file structure, generates summaries with Haiku, merges into .context/.summaries.json for efficient querying.
---

Scan project and set up context analysis: {{args}}

Parse arguments:
- --root: Project root directory (default: current directory)
- --auto-analyze: Skip manual step (default: false, requires manual Haiku for now)

**Step 1: Scan Project**

Run:
```bash
node {{SCRIPT_PATH}}/dist/ctx.js scan --root={{root|.}}
```

This will:
- Recursively scan all files and directories (excluding node_modules, dist, build, etc.)
- Return structure with complete directory tree grouped by parent
- Show file counts per directory, file types, max depth
- Save to `/tmp/project-scan.json`

**Step 2: Display Results**

Show user:
```
✓ Project scan complete
  Total files: X
  Total directories: Y
  Max depth: Z
  File types: [list]

Structure saved to: /tmp/project-scan.json

Next: Generate summaries with Haiku (see below)
```

**Step 3: Generate Summaries with Haiku**

Two approaches:

**Option A: Manual (current)**
1. Show user the content of HAIKU_ANALYSIS_PROMPT.md
2. Guide them to copy directory analysis prompt
3. Invoke Haiku with the prompt
4. Haiku returns JSON with directory summaries
5. Ask user to copy Haiku output back
6. Merge using next step

**Option B: Automatic (future - requires Haiku subagent)**
```typescript
// Not yet implemented - would invoke Haiku task automatically
const haiku = await invokeHaikuTask(scanResult, 'directory-analysis');
```

**Step 4: Merge Summaries**

When user provides Haiku JSON output, merge into context:
```bash
node {{SCRIPT_PATH}}/dist/ctx.js merge-summaries \
  --summaries='{"directories":{"src":{...}},"files":{...}}' \
  --root={{root|.}}
```

This will:
- Parse Haiku JSON output
- Merge into `.context/.summaries.json`
- Create `.context/` if it doesn't exist
- Update timestamps
- Confirm success

**Step 5: Done**

User can now:
- `/query-context "topic"` to search summaries (fast, minimal tokens)
- `/load-context <file>` to get full file content
- Re-run scan anytime to update summaries

---

## Example Session

```
User: /scan-and-analyze --root=../my-project

Claude: Scanning project...
✓ Project scan complete
  Total files: 127
  Total directories: 23
  Max depth: 4
  File types: .ts, .tsx, .js, .json, .md, .css

Now you need to generate summaries.

OPTION 1: Automatic Analysis (if we add Haiku integration)
  Use: /finalize-analysis --auto

OPTION 2: Manual Analysis (current)
  1. I'll show you Haiku prompts
  2. You run them in Haiku
  3. Copy the JSON output back
  4. Run: /finalize-analysis --summaries='<JSON>'

Which would you prefer? For now, use Option 2.

Here are the batch prompts:

===== BATCH 1: DIRECTORY ANALYSIS =====
[Shows HAIKU_ANALYSIS_PROMPT.md directory section with actual directories from scan]

[User copies this, runs in Haiku, gets back JSON]

===== BATCH 2: FILE ANALYSIS =====
[Shows HAIKU_ANALYSIS_PROMPT.md file section with sample files]

[User runs in Haiku, gets back JSON]

When ready, provide the merged JSON from both batches.

User: [Runs in Haiku, gets back...]

User: /finalize-analysis --summaries='{"directories":{...},"files":{...}}'

Claude: ✓ Summaries merged into .context/.summaries.json
  - 23 directories indexed
  - 127 files indexed

Ready to query! Try: /query-context "validation"
```

---

## Technical Implementation Notes

### Files Modified/Created
- `.context/.summaries.json` - Created, stores all summaries
- `.context/.index.json` - Existing, stores decision metadata (separate from summaries)

### Key Functions Used
From `scripts/lib/writers/summary-merger.ts`:
- `mergeSummaries(contextDir, partialSummaries)` - Merge batch results
- `getSummaries(contextDir)` - Load all summaries
- `querySummaries(contextDir, query)` - Full-text search

### Data Structure
```json
{
  "version": "1.0",
  "generated": "2026-01-07T17:30:00Z",
  "directories": {
    "src": {
      "summary": "Main application source code",
      "purpose": "Core TypeScript implementation",
      "technologies": ["TypeScript", "React"],
      "fileCount": 42,
      "subdirCount": 5,
      "lastUpdated": "2026-01-07T17:30:00Z"
    }
  },
  "files": {
    "src/index.ts": {
      "summary": "Application entry point and setup",
      "purpose": "Initialize app and mount React components",
      "role": "implementation",
      "exports": ["main", "setup"],
      "imports": ["React", "./components"],
      "lastUpdated": "2026-01-07T17:30:00Z"
    }
  }
}
```

### Performance
- Scan: <1 second for typical projects (100-500 files)
- Haiku analysis: Parallel, ~3-5 seconds per batch of 3-5 directories
- Merge: <100ms
- Query: <50ms (searches in-memory JSON)

---

## Troubleshooting

**Issue: "ctx.js not found"**
- Solution: Run from `plugins/context-lifecycle-management-system/scripts/`
- Or: Use full path `~/path/to/scripts/dist/ctx.js`

**Issue: ".context doesn't exist"**
- Solution: Run `/scan-and-analyze` first to create structure
- Or: Run `ctx init --analysis=<file>` manually

**Issue: Haiku JSON won't parse**
- Solution: Ensure it's valid JSON (use online JSON validator)
- Remove any markdown code blocks (just the JSON)
- Check for trailing commas

**Issue: Merge says "cannot read property of undefined"**
- Solution: Check JSON structure has `directories` and/or `files` keys
- Ensure directory/file names match scan output exactly
