---
name: query-context
description: Search project context. If .summaries.json exists, searches summaries (fast). Otherwise searches .index.json (fallback). Returns relevant directories, files, and optionally loads content.
---

Query project context: {{args}}

Parse arguments:
- topic: Required, search term (e.g., "validation", "auth", "database")
- --layer: Optional, filter by layer (domain|foundation|active|all, default: all)
- --type: Optional, filter results (directories|files|all, default: all)
- --load: Optional, automatically load first match

**Detection: Which source to search?**

Check what exists in project:
```bash
ls -la .context/
```

Decision logic:
```
IF .context/.summaries.json exists
  → Search summaries (fast, minimal tokens) ✨
  → Results: summary text + metadata (no full file content)
  → Then user can /load-context <file> to get full content

ELSE IF .context/.index.json exists
  → Search index (fallback, for captured decisions only)
  → Results: captured decisions with rationale
  → Useful before summaries are generated

ELSE
  → No context found
  → Suggest: /scan-and-analyze first
```

**Step 1: Execute Search**

```bash
node {{SCRIPT_PATH}}/dist/ctx.js query "{{topic}}" \
  --layer={{layer|all}} \
  --format=summary
```

**Step 2: Format Results**

Display matches in order of relevance:

**Option A: With Summaries (recommended)**
```
Found 3 matches in .summaries.json:

[1] DIRECTORY: src/validation
    Summary: Form validation logic and rule definitions
    Purpose: Validates user input and form submissions
    Technologies: TypeScript, Zod
    Files: 5 subdirectories, 12 files
    Load: /load-context src/validation (shows file list + structure)

[2] FILE: src/validation/rules.ts
    Summary: Defines reusable validation rules for common fields
    Purpose: Core validation logic shared across forms
    Role: implementation
    Exports: ["validateEmail", "validatePassword", "validatePhone"]
    Dependencies: ["zod", "./types"]
    Load: /load-context src/validation/rules.ts (shows full file)

[3] FILE: docs/validation-guide.md
    Summary: Documentation on implementing validation patterns
    Purpose: Training and reference for developers
    Role: documentation
    Load: /load-context docs/validation-guide.md
```

**Option B: With Index Only (no summaries yet)**
```
Found 2 decisions related to "validation":

[1] FOUNDATION: "Implement client-side validation with Zod"
    Summary: Use Zod for schema validation across all forms
    Rationale: Type-safe, reusable, works with TypeScript
    Load: /load-context foundation/abc123-zod-validation.json

[2] FOUNDATION: "Validate before API submission"
    Summary: Always validate client-side before posting to API
    Rationale: Better UX, reduces server load, catches errors early
    Load: /load-context foundation/def456-validate-before-submit.json
```

**Step 3: Suggest Next Actions**

```
To explore further:
  - /load-context src/validation (see directory structure)
  - /load-context src/validation/rules.ts (see implementation)
  - /query-context "form handling" (find related topics)

To update context:
  - /capture-decision --title="..." (save architectural decisions)
  - /scan-and-analyze (regenerate summaries)
```

---

## Example Sessions

### Session 1: With Summaries

```
User: /query-context "authentication"

Claude: Searching .context/.summaries.json...

Found 4 matches:

[1] DIRECTORY: src/auth
    Summary: Authentication and authorization logic
    Files: 8

    Load with: /load-context src/auth

[2] FILE: src/auth/jwt-handler.ts
    Summary: JWT token creation, validation, and refresh
    Role: implementation
    Exports: ["issueToken", "validateToken", "refreshToken"]

    Load with: /load-context src/auth/jwt-handler.ts

[3] FILE: src/middleware/authMiddleware.ts
    Summary: Express middleware for protecting authenticated routes
    Role: implementation
    Imports: ["./jwt-handler", "express"]

    Load with: /load-context src/middleware/authMiddleware.ts

[4] FILE: docs/auth-setup.md
    Summary: Step-by-step guide for configuring authentication
    Role: documentation

    Load with: /load-context docs/auth-setup.md

Want to load any of these? Try: /load-context src/auth/jwt-handler.ts
```

### Session 2: Without Summaries (Fallback)

```
User: /query-context "jwt"

Claude: .context/.summaries.json not found.
Searching .context/.index.json (captured decisions)...

Found 1 decision:

[FOUNDATION] "Use JWT with refresh token rotation"
  Summary: Implement JWT-based stateless authentication
  Rationale: Scalable for distributed systems, mobile-friendly, industry standard
  Category: foundation

  Load with: /load-context foundation/5c7a2e9b-use-jwt-with-refresh.json

Hint: No summaries yet. Run /scan-and-analyze to generate them!
```

### Session 3: Auto-Load First Match

```
User: /query-context "database" --load

Claude: Searching .context/.summaries.json...

Found 5 matches. Loading first result...

═══════════════════════════════════════════════════════════
DIRECTORY: src/database

Summary: Database connection, models, and migrations
Purpose: Data persistence layer
Technologies: PostgreSQL, Prisma ORM
Files: 3 subdirectories, 18 files
Last Updated: 2026-01-07T17:30:00Z

Structure:
  src/database/
  ├── models/
  │   ├── User.ts
  │   ├── Post.ts
  │   └── Comment.ts
  ├── migrations/
  │   ├── 001_create_users.sql
  │   └── 002_add_posts.sql
  └── connection.ts

Load subdirectory: /load-context src/database/models (show model files)
Load specific file: /load-context src/database/models/User.ts
═══════════════════════════════════════════════════════════

Other matches:
  [2] FILE: src/database/connection.ts
  [3] FILE: docs/database-schema.md
  [4] DIRECTORY: scripts/database
  [5] FILE: migrations/001_create_users.sql

Try: /query-context "user model" to refine search
```

---

## Implementation Details

### Search Algorithm

1. **Tokenize query:** Split on whitespace, filter 3+ char words
2. **Score calculation:**
   - Exact phrase match: +10 points
   - Title match: +5 points
   - Keyword match: +3 points
   - Summary match: +1 point
3. **Sort:** By relevance score (highest first)
4. **Return:** Top 10 results (configurable)

### Data Sources

**Summaries (preferred):**
- `.context/.summaries.json`
- Searchable fields:
  - Directory name, summary, purpose, technologies
  - File name, summary, purpose, role, exports, imports

**Index (fallback):**
- `.context/.index.json`
- Searchable fields:
  - File title, summary, keywords, tags
  - Organized by layer (domain/foundation/active)

### Performance

- **Search time:** <50ms typical
- **Results limit:** Top 10 by default
- **Token cost:** ~100 tokens per query + result summaries

---

## Advanced Usage

### Filter by Layer (with Index)

```bash
/query-context "database" --layer=foundation
# Only returns decisions in foundation layer
```

### Filter by Type (with Summaries)

```bash
/query-context "validation" --type=files
# Only returns file summaries, not directories
```

### Filter by Type and Layer

```bash
/query-context "api" --type=directories --layer=all
# Only directory summaries matching "api"
```

### Load and Expand

```bash
/query-context "auth"
# Finds src/auth directory

/load-context src/auth
# Shows directory summary + file list

/load-context src/auth --node=middleware
# (future: load specific subsection)
```

---

## When to Use Each Command

| Scenario | Command | Result |
|----------|---------|--------|
| "Find all code about payments" | `/query-context "payment"` | Summary results + load options |
| "What's in the auth folder?" | `/query-context "auth"` then `/load-context src/auth` | Summary + file list |
| "Show me the JWT implementation" | `/query-context "jwt"` then `/load-context src/auth/jwt.ts` | Full file content |
| "What architectural decisions exist?" | `/query-context ""` --layer=foundation | All captured decisions |
| "Find all docs" | `/query-context ""` --type=directories | All documentation directories |

---

## Troubleshooting

**Issue: "No matches found"**
- Try broader search term: "auth" instead of "jwt-handler"
- Check if context exists: `ls .context/`
- If missing: Run `/scan-and-analyze` first

**Issue: Only getting index results (fallback)"**
- Summaries not generated yet
- Run `/scan-and-analyze` to create .summaries.json
- Then re-query for better results

**Issue: Getting too many results**
- Use more specific terms: "form validation" instead of "validation"
- Filter by layer: `--layer=foundation`
- Filter by type: `--type=files`

**Issue: Results not relevant**
- Summaries may need updating
- Run `/scan-and-analyze` to regenerate
- Haiku may have missed details - load full file to read actual code

---

## Summary

- **Query context** = search project knowledge base
- **Smart fallback** = summaries if available, index otherwise
- **Then load** = use `/load-context` to read full content
- **Regenerate** = run `/scan-and-analyze` to update summaries

Start with: `/query-context "your topic here"`
