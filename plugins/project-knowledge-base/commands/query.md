---
description: Search project knowledge base by keywords. Fast way to find relevant information, context, directories and files without reading them or expensive per-session re-exploration. Use this first to get a quick overview before exploring specific code. Find files, understand structure, locate features.
argument-hint: "<keywords>" [--root=<path>] [--scope=<path>] [--max=N]
---

# Query Project Summaries

Search project summaries by keywords with confidence-based scoring and result ranking.

**Parameters:**
- `<keywords>`: Search terms (e.g., "authentication", "user setup", "auth user")
- `--root`: Project root directory (default: current directory)
- `--scope`: Limit search to specific directory/file path (optional)
- `--max`: Maximum results to return (default: 100)

**Confidence Scoring (Semantic-First):**
- Purpose match: +8 per keyword (highest - semantic intent)
- Exports/Imports match: +7 per keyword (concrete functionality)
- Summary match: +5 per keyword (topic relevance)
- Technologies/Role match: +3 per keyword (context)
- Path match: +1 per keyword (lowest - directory structure is secondary)

*Note: Scoring prioritizes semantic relevance and actual functionality over directory structure.*

**Usage Examples:**
- `/query "authentication"` - Search all summaries
- `/query "user setup"` - Multiple keywords
- `/query "auth" --scope=src/auth` - Search specific directory
- `/query "database" --max=5` - Limit to 5 results
- `/query "typescript" --scope=src --max=10` - Combine options

**Prerequisites:**
- Run `/scan` first to generate summaries

---

## Implementation

I will execute the following workflow:

### Step 1: Validate knowledge exists
Check if `.knowledge/summaries.json` exists in the project root.

If missing, display error:
```
Error: No knowledge found. Run: /scan first
```

### Step 2: Execute query command
Run the knowledge query CLI with user parameters:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js query "$KEYWORDS" --root="$ROOT_DIR" --scope="$SCOPE" --max="$MAX"
```

Parse JSON response structure:
```json
{
  "source": "summaries",
  "query": "...",
  "keywords": [...],
  "scope": "all|<path>",
  "total": N,
  "results": [
    {
      "type": "directory|file",
      "path": "...",
      "score": N,
      "summary": "...",
      "purpose": "...",
      "technologies": [...],  // for directories
      "role": "...",          // for files
      "exports": [...],       // for files
      "imports": [...]        // for files
    }
  ]
}
```

**Default Output Option:** To get JSON output sorted by score:
```bash
/query "authentication"
```

**Grouped Output Option:** Add `--format=hierarchy` to get JSON output grouped by folder and sorted by score:
```bash
/query "authentication" --format=hierarchy
```

### Step 3: Format and display results

Group results by parent directory to visualize project structure:

```
Found N matches for "keywords" (scope: all|<path>)

plugins/fetch-full-content/
├─ commands/
│  └─ [FILE] fetch-full-content.md (Score: 48)
│     Summary: Slash command for downloading full URL content
│     Purpose: Command syntax, arguments, examples
│     Role: documentation
│     Exports: [Format, Execution, Output, Examples]
│
├─ scripts/
│  └─ [FILE] fetch_full_content.py (Score: 20)
│     Summary: Downloads HTML, converts to Markdown
│     Purpose: Core implementation with Playwright support
│     Role: script
│     Exports: [HTMLDownloader, URLProcessor, main]

plugins/project-knowledge-base/
├─ [DIR] scripts/ (Score: 18)
│  Tech: [TypeScript, Node.js]
│
├─ commands/
│  └─ [FILE] query.md (Score: 26)
│     Purpose: Knowledge base search interface
```

### Step 4: Suggest next actions
Based on results:

**If no results:**
```
No matches found for "keywords".
Try broader keywords or different scope.
```

**If results found:**
```
Next steps:
- Refine search: /query "more-specific-keywords" --scope=<path>
- Read file details: Use /load to examine specific files
- Adjust scope: /query "keywords" --scope=<path>
```

---

## Error Handling

- **Knowledge missing**: Show friendly error with `/scan` suggestion
- **Query fails**: Display error message from CLI
- **Parse error**: Report JSON parsing issue
- **No results**: Show "no matches" guidance
- **Invalid scope**: CLI handles scope validation

---

## Technical Details

**CLI Command Location:**
`${CLAUDE_PLUGIN_ROOT}\scripts\dist\ctx.js`

**Output Format:**
JSON structure with scored results, pre-sorted by confidence descending.

**Scoring Algorithm (Semantic-First):**
- Purpose match: +8 (intent/functionality description)
- Exports/Imports match: +7 (concrete APIs/dependencies)
- Summary match: +5 (overall topic relevance)
- Technologies/Role match: +3 (context/context clues)
- Path match: +1 (directory structure - lowest weight)
- Per keyword: Individual keyword scores summed
- Results sorted by total score descending
- Limited to --max parameter (default 100)

**Why semantic-first?**
- Finding authentication by searching purpose/exports is better than finding it by path alone
- A file with "authentication" in purpose/exports is more relevant than one with "auth" in directory name
- Developers need semantic relevance, not directory structure matching

**Scope Filtering:**
- Empty scope: Search all items
- Specified scope: Only items starting with scope path
- Example: `--scope=src` matches `src/auth`, `src/utils`, but not `test/src`
