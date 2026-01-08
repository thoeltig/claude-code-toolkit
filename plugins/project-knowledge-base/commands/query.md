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

**Confidence Scoring:**
- Path match: +10 per keyword (highest priority)
- Summary match: +5 per keyword
- Purpose match: +3 per keyword
- Technologies/Role match: +2-3 per keyword
- Exports/Imports match: +2 per keyword

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

### Step 3: Format and display results
Organize results by type (directories first, then files) with visual formatting.

**Header:**
```
Found N matches for "keywords" (scope: all|<path>)
Searching: [keyword1, keyword2, ...]
```

**Directory Results:**
```
DIRECTORIES:
1. [DIRECTORY] path/to/dir
   Score: N
   Summary: One sentence summary
   Purpose: What role this plays
   Tech: [technology1, technology2, ...]
```

**File Results:**
```
FILES:
2. [FILE] path/to/file.ts
   Score: N
   Summary: One sentence summary
   Purpose: What role this plays
   Role: implementation|documentation|configuration|test|build|script
   Exports: [export1, export2, ...]
   Imports: [dependency1, dependency2, ...]
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

**Scoring Algorithm:**
- Per keyword scoring across path, summary, purpose, technologies, exports, imports, role
- Results sorted by total score descending
- Limited to --max parameter (default 100)

**Scope Filtering:**
- Empty scope: Search all items
- Specified scope: Only items starting with scope path
- Example: `--scope=src` matches `src/auth`, `src/utils`, but not `test/src`
