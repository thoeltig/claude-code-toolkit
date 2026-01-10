# Project Knowledge Base

**Purpose:** Create a persistent knowledge layer of your project. Scan once, query forever across sessions. Avoid expensive re-exploration and re-reading of files by building shared, incrementally-updated understanding of your project.

---

## The Problem

Every session, you re-explore the same project:
- **Haiku searches**: 1000+ tokens per exploration (one-time, lost after session)
- **File re-reading**: Reading files again to remember their purpose (wasted tokens)
- **Context loss**: No accumulated knowledge across sessions
- **Team silos**: Each developer explores independently

## The Solution

Build a persistent knowledge layer once, reuse forever:
1. **Scan** the project (pure I/O, 0 tokens)
2. **Analyze** with Haiku in parallel (1200 tokens per batch, one-time cost)
3. **Store** summaries in `.knowledge/summaries.json` (git-tracked, team-shared)
4. **Query** across sessions (100 tokens, no re-reading)
5. **Extend** incrementally as project evolves (selective re-scanning)

---

## Query-First Workflow

**Before**: Expensive per-session exploration
```
Session 1: User asks "Show me auth system"
  → Invoke Haiku to search project (1000+ tokens)
  → Results lost at session end

Session 2: User asks same question
  → Repeat Haiku search (1000+ tokens again)
  → Same knowledge recreated
```

**After**: Query persistent knowledge base
```
Session 1: /scan --root=../project
  → Generate summaries (1200 tokens, stored forever)

Session N: User asks "Show me auth system"
  → /query "authentication"
  → Get overview instantly (100 tokens)
  → Explore only relevant files (minimal additional cost)

Session N+1: User asks different question
  → /query "database"
  → Reuse stored knowledge (100 tokens)
  → No re-exploration needed
```

---

## Quick Start

### 1. Build the CLI
```bash
cd plugins/project-knowledge-base/scripts
npm install
npm run build
```

### 2. Scan Your Project (One-time)
```bash
/scan --root=../path/to/project
```

This generates `.knowledge/summaries.json` with intelligent summaries of every directory and file.

**Wave-based processing:**
- Small projects: All batches complete quickly
- Large projects (20+ batches): Shows estimated time, requires confirmation, processes in waves of 10-15 agents

Output:
```
✓ Analysis complete
  Directories: 45
  Files: 230
  Summaries stored in: .knowledge/summaries.json

Commit to git to share with team!
```

### 3. Query (Every Session, Fast)
```bash
/query "authentication"
/query "database" --scope=src --max=10
/query "typescript setup" --max=5
```

Get instant overview of relevant directories and files **without re-reading them**.

---

## Scope & Applicability

**Target:** Mid to seasoned projects with 100+ files (ideal for 200-5000 files)

**Best fit:**
- Legacy codebases (understanding complex structure without rereading everything)
- Large monorepos (navigating multiple integrated systems)
- Team projects (shared knowledge base across developers)
- Long-lived code (context preservation across sessions)
- Project evolution (track understanding as code changes)

**Not ideal for:**
- Small projects (<50 files): Scanning overhead not worth the savings
- Single-session work: No benefit from persistence
- Minimal exploration: One or two lookups don't justify setup time
- Rapid prototyping: Changing structure makes knowledge base stale quickly

**Cost-Benefit Analysis:**
- Initial scan: ~2-5 minutes (200-800 files), ~1200 tokens per batch
- Queries: ~5-10 seconds each, ~100 tokens per query
- **Breakeven:** After ~12-15 queries, initial cost is repaid in time/tokens saved
- **Long-term:** Massive savings on projects with frequent context lookups

---

## Architecture

```
Initial Setup (One-time):
  User: /scan --root=../project
    ↓
  Scan Phase (0 tokens):
    - Walk filesystem
    - Extract structure
    - Save to scan.json

  ↓
  Batch Phase:
    - Group directories 3-5 per batch
    - Prepare batch context

  ↓
  Haiku Analysis Phase (Wave-based Parallel, 1200 tokens per batch):
    - Wave 1: Batches 1-15 analyze in parallel
    - Wave 2: Batches 16-30 analyze in parallel
    - Results written to /tmp/haiku-batch-*.json

  ↓
  Merge Phase (0 tokens):
    - Combine all batch results
    - Save to .knowledge/summaries.json
    - ✅ STORED FOREVER


Across Sessions (100 tokens per query):
  User: /query "keywords"
    ↓
  Query Phase:
    - Search summaries.json
    - Score results by confidence
    - Display relevant dirs/files
    - User examines only what matters
```

---

## Slash Commands

### `/scan [--root=<path>]`
**Generate persistent summaries of your project.**

Parameters:
- `--root`: Project root directory (default: current directory)

Creates/updates `.knowledge/summaries.json` with analyzed summaries.

**Large Project Handling:**
- If 20+ batches needed: Shows warning with estimated time
- Requires user confirmation before analysis
- Processes in waves (10-15 concurrent agents max)
- Shows progress as waves complete

Example:
```bash
/scan --root=../claude-code-capabilities
# Generates .knowledge/summaries.json
# Ready to share with team via git
```

### `/query "<keywords>" [--root=<path>] [--scope=<path>] [--max=N]`
**Query persistent knowledge base by keywords.**

Parameters:
- `<keywords>`: Search terms (e.g., "authentication", "user setup")
- `--root`: Project root directory (default: current directory)
- `--scope`: Limit search to specific path (optional)
- `--max`: Maximum results (default: 100)

Returns overview of relevant directories and files **without reading them**.

Example:
```bash
/query "authentication"
/query "auth" --scope=src/auth --max=5
/query "database connection" --max=10
```

---

## Persistent Knowledge Layer

### What Gets Stored

`.knowledge/summaries.json` contains analyzed summaries:

**Directory Summary:**
```json
{
  "src/auth": {
    "summary": "Authentication system implementation",
    "purpose": "User login, token management, session handling",
    "technologies": ["TypeScript", "JWT", "bcrypt"],
    "fileCount": 12,
    "subdirCount": 3,
    "lastUpdated": "2026-01-08T00:00:00Z"
  }
}
```

**File Summary:**
```json
{
  "src/auth/index.ts": {
    "summary": "Main authentication module entry point",
    "purpose": "Export auth functions and middleware",
    "role": "implementation",
    "exports": ["authenticate", "logout", "middleware"],
    "imports": ["jwt", "bcrypt", "express"],
    "lastUpdated": "2026-01-08T00:00:00Z"
  }
}
```

### Incremental Updates

When code changes, selectively re-scan:
```bash
# Re-scan entire project
/scan --root=../project

# Updates existing summaries, preserves unchanged
# Merges new and modified entries
```

No need to re-analyze unchanged code - only changes get updated.

### Team Sharing

Commit to git:
```bash
git add .knowledge/summaries.json
git commit -m "docs: update project knowledge base"
git push
```

Team members clone once, query forever - no per-developer re-analysis needed.

---

## Confidence Scoring

Query results ranked by relevance:
- **Path match**: +10 per keyword (highest priority)
- **Summary match**: +5 per keyword
- **Purpose match**: +3 per keyword
- **Technologies/Role match**: +2-3 per keyword
- **Exports/Imports match**: +2 per keyword

Results sorted descending by confidence score.

---

## Token & Performance Comparison

### Before (Per-session exploration)
| Task | Tokens | Time | Notes |
|------|--------|------|-------|
| Haiku search for "auth" | 1000+ | 10s | Lost after session ends |
| Re-reading files | 500+ | varies | Redundant across sessions |
| **Per-session cost** | **1500+** | **varies** | **One-time per exploration** |

### After (Query-first workflow)
| Task | Tokens | Time | Notes |
|------|--------|------|-------|
| Initial scan | 1200/batch | 3-5m | One-time setup |
| Query "auth" | 100 | <1s | Reused across sessions |
| Read 1 specific file | 200-500 | <1s | Only when actually needed |
| **Per-session cost** | **100-600** | **<1s** | **Query + selective reading** |

**Result**: 90% fewer tokens across multiple sessions, instant queries.

---

## Workflow Example

### Session 1: Build Knowledge Base

```bash
/scan --root=../my-project
```

Output:
```
✓ Analysis complete
  Directories: 45
  Files: 230
  Summaries stored in: .knowledge/summaries.json
```

Commit to git:
```bash
git add .knowledge/summaries.json
git commit -m "docs: add project knowledge base"
```

### Session 2: Query Knowledge Base

User asks: "Show me the authentication system"

```bash
/query "authentication" --max=10
```

Output:
```
Found 8 matches for "authentication" (scope: all)
Searching: [authentication]

DIRECTORIES:
1. [DIRECTORY] src/auth
   Score: 25
   Summary: Authentication system implementation
   Purpose: User login, token management, session handling
   Tech: [TypeScript, JWT, bcrypt]

2. [DIRECTORY] src/middleware
   Score: 15
   Summary: Express middleware implementations
   Purpose: Request processing and validation
   Tech: [Express, TypeScript]

FILES:
3. [FILE] src/auth/index.ts
   Score: 20
   Summary: Main authentication module entry point
   Purpose: Export auth functions and middleware
   Role: implementation
   Exports: [authenticate, logout, middleware]
```

Based on results, user decides to read specific files instead of exploring blindly.

### Session 3: Incremental Update

Code changed, some files updated:

```bash
/scan --root=../my-project
```

Updates summaries - only re-analyzes changed code, preserves unchanged summaries.

---

## Key Benefits

✅ **Persistent**: Knowledge saved in `.knowledge/summaries.json`, available forever
✅ **Cross-session**: Query instantly in any session, no re-exploration
✅ **Team-shareable**: Commit to git, entire team reuses knowledge
✅ **Incremental**: Re-scan updates summaries, doesn't start from scratch
✅ **Token-efficient**: Query costs 100 tokens (vs 1000+ for re-exploration)
✅ **Guided exploration**: Overview first, read selectively
✅ **Wave-safe**: Large projects process in controlled waves, shows progress

---

## Troubleshooting

### "No knowledge found"
Run `/scan` first to generate `.knowledge/summaries.json`

### "CLI not found"
Build the scripts: `cd scripts && npm run build`

### "No matches found"
Try broader keywords, or check if `/scan` has completed

### Large project warnings
Projects with 20+ batches show estimated time. Confirm to proceed.
Processing happens in waves of 10-15 concurrent agents.

### How often should I re-scan?
- Initial setup: Once per project
- Maintenance: When significant code changes occur
- Team sync: When pulling major updates from teammates

---

## Design Decisions

**Why Persistent Storage?**
- Knowledge carries across sessions automatically
- No re-exploration overhead
- Team can share project understanding via git

**Why Wave-based Parallel?**
- 10-15 concurrent agents balances speed and stability
- Still 10-15x faster than sequential
- Large projects don't overwhelm the system
- Progress visible as waves complete

**Why Incremental Scanning?**
- Re-scanning entire project updates summaries efficiently
- Changed files re-analyzed, unchanged files preserved
- Knowledge accumulates over time as project evolves

**Why Query-First Workflow?**
- Overview before deep-diving (minimal tokens)
- Guided exploration using knowledge base
- Avoids expensive one-time Haiku searches
- Team reuses previous session's discoveries

---

Built with vanilla TypeScript, no external dependencies.

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## License

See root [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)