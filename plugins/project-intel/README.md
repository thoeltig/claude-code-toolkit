# Project Intelligence (project-intel)

Lightweight reconnaissance system that provides direction before exploration. Query for relevant files before reading them - avoid expensive blind exploration and context pollution.

---

## The Value Proposition

**Asymmetric Payoff:**
```
Query cost:        ~1k tokens (minimal risk)
Failed query:      Small loss, move on
Successful query:  Saves 10k-20k tokens of blind exploration
                   Eliminates context pollution
                   Provides immediate direction

Risk/Reward: Query aggressively - downside is negligible, upside is enormous
```

---

## The Problem

Every new question triggers expensive exploration:
- Spawn Explore agent or read 15-20 files blindly
- 80% of content is irrelevant (context pollution)
- 10k-20k tokens wasted per exploration
- No persistent knowledge across sessions
- Vague prompts ("improve the API") require figuring out where to look first

## The Solution

Build a semantic map once, query before exploring:

1. **Scan** full project once or incrementally scan project areas → Generate file/directory summaries (one-time cost)
2. **Query** before reading → Get relevant file list (cheap reconnaissance)
3. **Read** only relevant files → Directed exploration vs blind searching
4. **Maintain** alongside development → Re-scan changed areas as needed

**Result:** Cheap orientation that saves expensive exploration when successful.

---

## Quick Start

### 1. Requirements
Install [Node.js](https://nodejs.org/) 16.9+

### 2. Scan Your Project (full or partial)
```bash
/scan --location=../path/to/project --knowledgeDir=.knowledge
```

Generates `.knowledge/summaries.json` with semantic summaries of every directory and file.

**Wave-based processing:**
- Small projects: Completes quickly in parallel
- Large projects (20+ batches): Shows estimated time, processes in waves of max 10 concurrent agents

Output:
```
✓ Analysis complete
  Files analyzed: 230
  Batches processed: 29
  Summaries stored in: .knowledge/summaries.json
```

### 3. Query Before Exploring
```bash
/query "authentication"
/query "api endpoints rate limiting"
/query "database" --scope=src --max=10
```

Returns ranked list of relevant files/directories **without reading them** - providing direction for what to read next.

---

## When to Use

**Query first when:**
- ✅ Answering vague prompts ("improve the API" → query "api" first)
- ✅ Broad questions about structure ("how does auth work?")
- ✅ Before spawning Explore agents (cheap reconnaissance first)
- ✅ Multi-session work (persistent knowledge)
- ✅ Large codebases (500+ files where exploration is expensive)
- ✅ Team onboarding (shared semantic map)

**Skip querying when:**
- ❌ Very specific needle query ("find class UserController") → use Grep/Glob directly
- ❌ Small projects (<100 files) → setup cost > benefit
- ❌ Single-file bug fix → no direction needed
- ❌ Already know exact location → just read the file

**Default strategy:** Query first - the cost is minimal and successful queries save massive exploration effort.

---

## Commands

### `/scan --location=<path> --knowledgeDir=<path>`
Generate or update semantic summaries.

**Parameters:**
- `--location`: Directory to analyze (default: current directory)
- `--knowledgeDir`: Output location for summaries (default: .knowledge in current directory)

**What it does:**
1. Walks filesystem (metadata only, 0 tokens)
2. Batches files for analysis (~8 files per batch)
3. Launches Haiku agents in parallel waves (max 10 concurrent)
4. Each agent summarizes files: purpose, role, exports, imports
5. Merges results into `summaries.json`

**Cost:** ~1200 tokens + the files read tokens per batch (similiar to internal explore tool)

**Incremental updates:** Re-running scan merges new summaries with existing ones. Only changed files need re-analysis.

**Git optimization:** If git is available, scan automatically uses git history to identify modified files since last scan, reducing the number files to process to only what is actually needed. Fallback to filesystem walk for non-git projects.

**Example:**
```bash
# Initial scan
/scan --location=../my-project --knowledgeDir=../my-project/.knowledge

# Update after changes
/scan --location=../my-project --knowledgeDir=../my-project/.knowledge
```

### `/query "<keywords>" [--scope=<path>] [--max=N] --knowledgeDir=<path>`
Search summaries by semantic relevance.

**Parameters:**
- `<keywords>`: Search terms (e.g., "authentication", "api rate limiting")
- `--scope`: Limit to specific directory (optional)
- `--max`: Maximum results (default: 25)
- `--knowledgeDir`: Location of summaries.json (default: .knowledge in current directory)

**What it does:**
1. Semantic scoring across summary, purpose, exports, imports, technologies, role
2. Returns ranked results (higher score = more relevant)
3. Grouped by directory for structure visibility

**Cost:** ~1k tokens (orchestration + CLI execution)

**Examples:**
```bash
# Broad exploration
/query "authentication user login"

# Focused search
/query "database connection" --scope=src/backend

# Conceptual search (not just keywords)
/query "use purpose how what script when"
```

---

## How It Works

### Semantic Scoring

The query performs **semantic matching**, not just keyword pattern matching:

- **Purpose match**: +6 (intent/functionality description)
- **Summary match**: +6 (overall topic relevance)
- **Exports/Imports match**: +4 (concrete APIs/dependencies)
- **Technologies/Role match**: +4 (technical context)
- **Path match**: +2 (directory structure)

Results sorted by total score, showing most relevant files first.

**Example:** Query `"use purpose how what script when"` finds files discussing:
- Purpose statements ("this script's purpose is...")
- Usage instructions ("how to use this...")
- Trigger conditions ("when to execute...")

Even if those exact keywords don't appear, files covering these concepts score higher.

### Architecture

```
Initial Setup (One-time):
  /scan
    ↓
  Filesystem walk (0 tokens)
    ↓
  Batch creation (~8 files per batch)
    ↓
  Parallel Haiku analysis in waves
    - Wave 1: Batches 1-10 analyze concurrently
    - Wave 2: Batches 11-20 analyze concurrently
    - Each batch: subagent invocation ~1200 tokens + the files read tokens (similiar to internal explore tool)
    ↓
  Merge to summaries.json
    ✅ Stored persistently


Across Sessions:
  /query "keywords"
    ↓
  Semantic search summaries.json (~1k tokens)
    ↓
  Display ranked results
    ↓
  User reads only relevant files (directed exploration)
```

### What Gets Stored

`.knowledge/summaries.json` structure:

**Directory summary:**
```json
{
  "directories": {
    "src/auth": {
      "summary": "Authentication system implementation",
      "purpose": "User login, token management, session handling",
      "technologies": ["TypeScript", "JWT", "bcrypt"],
      "fileCount": 12,
      "subdirCount": 3
    }
  }
}
```

**File summary:**
```json
{
  "files": {
    "src/auth/index.ts": {
      "summary": "Main authentication module entry point",
      "purpose": "Export auth functions and middleware",
      "role": "implementation",
      "exports": ["authenticate", "logout", "middleware"],
      "imports": ["jwt", "bcrypt", "express"],
      "lastUpdated": "2026-01-08T00:00:00Z"
    }
  }
}
```

---

## Best Practices

### Maintenance Strategy

**Summaries are like documentation** - maintain alongside code or pay re-scan cost:

1. **Initial setup**: Scan entire project once
2. **During development**: Re-scan areas you're actively changing
3. **After major updates**: Re-scan affected directories
4. **Team sync**: Pull teammate scans from git

**Staleness signals:**
- Query returns files with old `lastUpdated` dates
- You know you've changed an area significantly
- Summaries don't match your current understanding

**Re-scan strategy:**
```bash
# Full project re-scan (if everything is stale)
/scan --location=../project --knowledgeDir=../project/.knowledge

# Targeted re-scan (subset only)
/scan --location=../project/src/auth --knowledgeDir=../project/.knowledge
```

### Query Strategies

**Start broad, then narrow:**
```bash
# 1. Broad orientation
/query "api endpoints"

# 2. Based on results, narrow scope
/query "rate limiting" --scope=src/api
```

**Use conceptual terms:**
```bash
# Good: semantic concepts
/query "authentication session management"
/query "database connection pooling"

# Also works: technical specifics
/query "jwt token validation"
/query "postgres migrations"
```

**Multiple keywords improve accuracy:**
```bash
# Single keyword: broad results
/query "user"

# Multiple keywords: more focused
/query "user authentication login"
```

---

## Comparison to Alternatives

### vs. Explore Agent
- **project-intel**: Cheap reconnaissance, provides file list for you to read
- **Explore agent**: Deep exploration, reads files and analyzes code
- **Use project-intel first**: If results are good, read files directly. If not, spawn Explore agent.

### vs. Grep/Glob
- **Grep/Glob**: Pattern matching (exact strings, file names)
- **project-intel**: Semantic matching (concepts, purpose, functionality)
- **Grep/Glob wins**: When you know exact class/function/filename
- **project-intel wins**: When you know what you're looking for conceptually but not literally

### vs. Reading Files Directly
- **Reading directly**: High token cost if you read wrong files (context pollution)
- **project-intel**: Low cost reconnaissance first, read only relevant files
- **Strategy**: Query → read top results → explore deeper if needed

---

## Performance Characteristics

### Initial Scan Cost
| Project Size | Files | Batches | Time | Token Cost |
|--------------|-------|---------|------|------------|
| Small | 50-100 | 6-12 | 1-2m | ~8k tokens + read file cost |
| Medium | 200-500 | 25-60 | 3-6m | ~35k tokens + read file cost |
| Large | 1000+ | 125+ | 10-15m | ~150k+ tokens + read file cost |

**One-time investment** - results persist forever until re-scan.

### Incremental Scan Cost (with git)
| Changes | Reduction | Time | Token Cost |
|---------|-----------|------|------------|
| 5% changed | 80-95% fewer files | <10s | ~400 tokens |
| 10% changed | 70-85% fewer files | <30s | ~800 tokens |
| 25% changed | 50-75% fewer files | <1m | ~1.5k tokens |

**Git optimization** dramatically reduces subsequent scans - only changed files are re-analyzed. Without git, user need to keep track of directories to re-scan and full filesystem walk will collect all files in that folder instead of the actaully needed files.

### Query Cost
Single query (~1k tokens, <1s): 
- Failed query (no results): Minimal overhead + exploration
- Successful query: No exploration

**Comparison:**
- Explore agent: 5k-25k tokens per exploration
- Reading 15 files blindly: 10k-20k tokens + context pollution
- Query + read 3 relevant files: 1k + 3k = 4k tokens (75% savings)

---

## Scope & Applicability

**Best fit:**
- Mid to larger projects (> 25 files)
- Stable or legacy codebases (understanding complex structure)
- Monorepos (navigating multiple systems)
- Team projects (shared knowledge)
- Multi-session work (persistent context)

**It depends for:**
- Small projects (<25 files): If most files are loaded each session the scan cost might not be worth it
- Known locations: Just read the file directly
- Change scope/frequency: Partial / full rewrites each session is to fast changing to create persistent knowledge

**Breakeven analysis:**
- Initial scan: 35k tokens (medium project)
- Each successful query saves: 10k-15k tokens
- **Breakeven**: After 3-4 successful queries
- **Long-term**: Massive savings on recurring questions

---

## Troubleshooting

### "No knowledge found"
Run `/scan` first to generate `.knowledge/summaries.json`

### "CLI not found" or "Module not found"
Build the scripts:
```bash
cd scripts
npm install
npm run build
```

### "No matches found"
- Try broader keywords
- Check if scan completed successfully
- Verify you're searching the right knowledge directory

### Query returns irrelevant results
- Add more specific keywords
- Use `--scope` to narrow to specific directory
- Re-scan if summaries are outdated

### Large project taking too long
- Scan only specific areas to incrementally build persistent knowledge

### When should I re-scan?
- After major code changes (new features, refactoring)
- When query results show old `lastUpdated` dates
- After pulling significant teammate updates
- When summaries don't match your understanding

---

## Design Decisions

**Why persistent storage?**
- Knowledge persists across sessions automatically
- No per-session re-exploration overhead
- Team shares knowledge via git

**Why wave-based parallel processing?**
- Max 10 concurrent agents balances speed and stability
- Still 10x faster than sequential
- Large projects don't overwhelm the system
- Progress tracking as waves complete

**Why semantic scoring?**
- Finding files by purpose/functionality is more valuable than path matching
- "Authentication logic" found even if directory isn't named "auth"
- Developers think conceptually, not in exact keywords

**Why query-first workflow?**
- Low-risk reconnaissance with massive upside
- Failed queries cost little, successful queries save huge exploration effort
- Guided exploration reduces context pollution
- Team reuses discoveries from previous sessions

**Why user-managed staleness?**
- Developers know when their work area changed
- Automatic staleness detection is complex and error-prone
- Treats summaries like documentation - maintain or pay re-scan cost
- Modification dates provide clear staleness signals

**Why git-based incremental scanning?**
- Git history provides accurate modification tracking without stat races
- Only needed files are processed on subsequent scans
- Transparent fallback for non-git projects (filesystem walk)
- Subdirectory scans benefit from git filtering even when focusing on specific areas

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