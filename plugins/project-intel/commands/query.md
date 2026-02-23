---
description: Search project knowledge by keywords. Run proactively when user asks about project structure, context, purpose, technologies, directories, files or similar information topics. Fast and cheap way to find ranked relevant information for files/directories without reading them or expensive exploration. Use this first to get a quick overview before exploring specific code. Skip if user provides explicit file paths or exact names to find.
argument-hint: <keywords> [--max=N] [--scope=<path>][--knowledgeDir=<knowledgeDir>] [--format=grouped|flat] 
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js *)
---

# Query Project Summaries

Search project summaries by keywords with confidence-based scoring and result ranking.

**Parameters:**
- `<keywords>`: Search terms (e.g., "authentication", "user setup", "auth user")
- `--max`: Maximum results to return (default: 25)
- `--scope`: Limit search to specific directory/file path (optional)
- `--knowledgeDir`: Project knowledge directory (default: .knowledge in current directory)
- `--format`: Result organization (default: grouped)
  - `grouped`: Results organized by directory with folder context and technologies. Best for understanding subsystems.
  - `flat`: Single list sorted by relevance. Best for broad searches across unrelated areas.

**Usage Examples:**
- `/query authentication` - Search all summaries
- `/query user setup` - Multiple keywords
- `/query auth --scope=src/auth` - Search specific directory
- `/query database --max=5` - Limit to 5 results
- `/query typescript --max=10 --scope=src` - Combine options
- `/query --knowledgeDir=../project/.knowledge` - Search all summaries in a specific knowledge directory

---

## Implementation

### Step 1: Execute query command
Run the knowledge query CLI with user parameters:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js query "$KEYWORDS" --scope="$SCOPE" --max="$MAX" --knowledgeDir="$KNOWLEDGE_DIR" --format="$FORMAT"
```

### Step 2: Suggest next actions
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
- Read file details: Use read tool to examine specific files
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
- Purpose match: +6 (intent/functionality description)
- Summary match: +6 (overall topic relevance)
- Exports/Imports match: +4 (concrete APIs/dependencies)
- Technologies/Role match: +4 (context/context clues)
- Path/Technology/Role match: +2
- Per keyword: Individual keyword scores summed
- Results sorted by total score descending
- Limited to --max parameter (default 25)

**Scope Filtering:**
- Empty scope: Search all items
- Specified scope: Only items starting with scope path
- Example: `--scope=src` matches `src/auth`, `src/utils`, but not `test/src`