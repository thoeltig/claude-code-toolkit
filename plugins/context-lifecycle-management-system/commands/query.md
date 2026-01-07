---
name: query
description: Search project summaries with confidence scoring
---

Search project summaries by keywords with confidence scoring.

**Parameters:**
- `topic`: Multiple keywords separated by spaces (e.g., "authentication user setup")
- `--root`: Project root directory (default: current directory)
- `--scope`: Limit search to directory/file path (optional, e.g., "--scope=src/auth")
- `--max`: Maximum results to return (optional, default: 100)

**Implementation:**

1. **Validate context exists**
   - Check if `.context/.summaries.json` exists in root
   - If missing: Display error "No context found. Run: `/scan` first"

2. **Execute query command**
   - Build command: `ctx query "{{args.topic}}" --root={{args.root}} --scope={{args.scope}} --max={{args.max}}`
   - Run and capture JSON output
   - Parse: `{source, query, keywords, scope, total, results}`

3. **Format results for display**
   - Separate directories and files from results array
   - Group by type with index numbers
   - For each result extract: path, score, summary, purpose, type-specific fields

4. **Display to user**
   - Header: `Found N matches for "topic" (scope: all|<path>)`
   - Keywords: `Searching: [keyword1, keyword2, ...]`
   - Sections:
     - DIRECTORIES (if any)
       - Index. `[TYPE]` path
       - Score: N (show confidence)
       - Summary: ...
       - Purpose: ...
       - Tech: [...] (if present)
     - FILES (if any)
       - Index. `[TYPE]` path
       - Score: N (show confidence)
       - Summary: ...
       - Purpose: ...
       - Role: ... (if present)
       - Exports: [...] (if present)
       - Imports: [...] (if present)

5. **Suggest next actions**
   - If no results: "Try broader keywords or different scope"
   - If results found: "Refine search with: `/query \"<keywords>\" --scope=<path>`"

**Error Handling:**
- If `.context/.summaries.json` missing: Show user-friendly error
- If query command fails: Display error message from CLI
- If parsing fails: Report JSON parse error

**Examples:**
- Single keyword: `/query "authentication"`
- Multiple keywords: `/query "auth user setup"`
- With scope: `/query "auth" --scope=src/auth`
- With max results: `/query "python" --max=5`
- All options: `/query "auth user" --scope=src --max=3`

**Confidence Scoring (informational):**
- Path match: +10 per keyword (highest priority)
- Summary match: +5 per keyword
- Purpose match: +3 per keyword
- Technologies/Role match: +2-3 per keyword
- Exports/Imports match: +2 per keyword
