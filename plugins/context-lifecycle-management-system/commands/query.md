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

**Workflow:**

1. Execute search:
   ```bash
   ctx query "{{topic}}" --root={{args.root}} --scope={{args.scope}} --max={{args.max}}
   ```

2. Retrieve and parse JSON results (sorted by confidence score):
   ```json
   {
     "source":"summaries",
     "query":"topic",
     "keywords":["keyword1","keyword2"],
     "scope":"all|<path>",
     "total":N,
     "results":[
       {
         "type":"directory|file",
         "path":"...",
         "score":N,
         "summary":"...",
         "purpose":"...",
         "technologies":[...],
         "role":"...",
         "exports":[...],
         "imports":[...]
       }
     ]
   }
   ```

3. Parse results:
   - Results already sorted by confidence score (highest first)
   - Extract matched keywords for display
   - Separate directories from files

4. Display to user in readable format with:
   - Type (directory or file)
   - Confidence score
   - Summary and purpose
   - Technologies (dirs) or role/exports/imports (files)

**Confidence Scoring:**
- Path match: +10 per keyword
- Summary match: +5 per keyword
- Purpose match: +3 per keyword
- Technologies/Role match: +2-3 per keyword
- Exports/Imports match: +2 per keyword

**Error handling:**
- If `.context/.summaries.json` missing: Error "No context found. Run: ctx scan first."
- If query fails: Return JSON error object

**Examples:**
- Single keyword: `ctx query "authentication"`
- Multiple keywords: `ctx query "auth user setup"`
- With scope: `ctx query "auth" --scope=src/auth`
- With max results: `ctx query "python" --max=5`
- All options: `ctx query "auth user" --scope=src --max=3`

**Next:** User can refine search with different keywords or scope
