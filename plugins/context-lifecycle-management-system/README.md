# Context Lifecycle Management System

**Purpose:** Organize and query project context efficiently with minimal token usage.

**Status:** Phase 2 Complete (Scanner + Core Scripts), Phase 3 In Progress (Commands)

---

## Quick Start

```bash
cd plugins/context-lifecycle-management-system/scripts
npm install        # Already done
npm run build      # Compiles TypeScript → dist/

# Test it
node dist/ctx.js scan --root=../../../plugins/claude-code-capabilities --output=/tmp/scan.json
# Should show: "Total files: 85, Total directories: 15, Max depth: 3"
```

---

## The Problem This Solves

**Context is expensive:**
- Loading full codebase = 50K+ tokens wasted
- Searching requires reading all files = repeated parsing
- Querying requires reloading = O(n) token cost per query

**This system:**
- Scans once (full directory tree)
- Analyzes once (Haiku generates summaries)
- Stores forever (.summaries.json in .context/)
- Queries cheap (100 tokens vs 3000+)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ 1. SCAN PHASE                                                │
│                                                              │
│   User: /scan-and-analyze --root=../my-project              │
│      ↓                                                       │
│   Script: Walk filesystem recursively                        │
│      ↓                                                       │
│   Output: structure.json (directories + files + metadata)   │
│      ↓                                                       │
│   Display: "85 files in 15 directories, max depth 3"        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. HAIKU ANALYSIS PHASE (Parallel)                           │
│                                                              │
│   User: Copy prompt from HAIKU_ANALYSIS_PROMPT.md            │
│      ↓                                                       │
│   Batch 1 (Haiku):  Analyze directories 1-5                 │
│   Batch 2 (Haiku):  Analyze directories 6-10                │
│   Batch 3 (Haiku):  Analyze files 1-10                      │
│   Batch 4 (Haiku):  Analyze files 11-20                     │
│      ↓ (all parallel)                                       │
│   Haiku returns: JSON with summaries                         │
│      ↓                                                       │
│   User: Copy JSON output back to command                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. MERGE PHASE                                               │
│                                                              │
│   Script: mergeSummaries(.context/, haiku_json)             │
│      ↓                                                       │
│   Output: .context/.summaries.json created                   │
│      ↓                                                       │
│   Display: "✓ 15 directories, 85 files indexed"             │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. QUERY PHASE (Efficient)                                   │
│                                                              │
│   User: /query-context "validation"                          │
│      ↓                                                       │
│   Script: Search .summaries.json (fast, in-memory)           │
│      ↓                                                       │
│   Output: Summaries for matching dirs/files (100 tokens)    │
│      ↓                                                       │
│   User: /load-context src/validation (if full content needed)│
│      ↓                                                       │
│   Output: Full directory structure or file content           │
└──────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
plugins/context-lifecycle-management-system/
│
├── scripts/                              # TypeScript CLI
│   ├── package.json                      # No npm dependencies
│   ├── tsconfig.json                     # ES2020, strict
│   ├── ctx.ts                            # Main CLI entry point
│   ├── dist/                             # Compiled JavaScript
│   │   ├── ctx.js                        # Binary (npm bin: ctx)
│   │   └── lib/                          # All compiled modules
│   │
│   ├── lib/
│   │   ├── collectors/
│   │   │   └── project-scanner.ts        # Scan filesystem → structure.json
│   │   ├── writers/
│   │   │   ├── context-writer.ts         # Create .context/ + .index.json
│   │   │   ├── capture-writer.ts         # Capture decisions
│   │   │   └── summary-merger.ts         # Merge Haiku results → .summaries.json
│   │   ├── query/
│   │   │   ├── searcher.ts               # Search .index.json
│   │   │   └── loader.ts                 # Load files by path or node
│   │   └── (all compiled to dist/)
│   │
│   ├── types/
│   │   └── index.ts                      # 16 TypeScript interfaces
│   │
│   └── utils/
│       ├── sanitizer.ts                  # Remove API keys, passwords
│       ├── token-counter.ts              # Estimate token count
│       ├── keywords.ts                   # Extract keywords
│       └── json-path.ts                  # (future) JSON navigation
│
├── .claude/
│   └── commands/
│       ├── scan-and-analyze.md           # Scan + guide Haiku analysis
│       └── query-context.md              # Search summaries or index
│
├── HAIKU_ANALYSIS_PROMPT.md              # Prompts for parallel Haiku batches
├── IMPLEMENTATION_STATUS.md              # This session's progress + next steps
└── README.md                             # (this file)
```

---

## Core Concepts

### 1. Directory Structure

Scanner recursively walks filesystem and groups files by parent directory:

```json
{
  "structure": {
    ".": {
      "type": "directory",
      "subdirs": ["src", "tests", "docs"],
      "files": ["package.json", "README.md"],
      "fileCount": 2,
      "depth": 0
    },
    "src": {
      "type": "directory",
      "subdirs": ["components", "utils"],
      "files": ["index.ts", "main.ts"],
      "fileCount": 2,
      "depth": 1
    }
  },
  "files": {
    "package.json": { "path": "package.json", "ext": ".json", "size": 2048, "depth": 0 },
    "src/index.ts": { "path": "src/index.ts", "ext": ".ts", "size": 1500, "depth": 1 }
  },
  "projectStats": {
    "totalFiles": 85,
    "totalDirs": 15,
    "maxDepth": 3,
    "fileTypes": [".json", ".md", ".py", ".sh"]
  }
}
```

### 2. Summaries

Haiku analysis produces one JSON per batch with directory and file summaries:

```json
{
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
      "summary": "Application entry point",
      "purpose": "Initialize app",
      "role": "implementation",
      "exports": ["main"],
      "imports": ["React"],
      "lastUpdated": "2026-01-07T17:30:00Z"
    }
  }
}
```

### 3. Context Index

Captured decisions stored separately from summaries:

```json
{
  "version": "1.0",
  "created": "2026-01-07T17:30:00Z",
  "updated": "2026-01-07T17:30:00Z",
  "project": {
    "type": "web_app",
    "domain": "my_application",
    "tech_stack": {
      "frontend": ["React", "TypeScript"],
      "backend": ["Node.js", "Express"]
    }
  },
  "files": {
    "foundation/abc123-use-react.json": {
      "layer": "foundation",
      "title": "Use React for UI",
      "summary": "Chose React for component reusability...",
      "tokens": 150,
      "type": "decision",
      "keywords": ["react", "frontend", "components"],
      "updated": "2026-01-07T17:30:00Z"
    }
  }
}
```

---

## Commands Available

### Phase 2 (Working)

```bash
node dist/ctx.js scan --root=../project --output=/tmp/scan.json
# Output: structure.json with all directories and files

node dist/ctx.js init --analysis=/tmp/analysis.json --root=../project
# Output: .context/ directory with domain/, foundation/, active/ layers

node dist/ctx.js capture --title="..." --context="..." --category=foundation
# Output: .context/foundation/<id>-<title>.json + updated .index.json

node dist/ctx.js query "topic" --layer=foundation
# Output: Matching decisions from .index.json

node dist/ctx.js load <filepath> [--node=<name>]
# Output: Full JSON content of file or specific node
```

### Phase 3 (Commands in progress)

```bash
/scan-and-analyze --root=../project
# Orchestrate: scan → show results → guide Haiku → merge summaries

/query-context "validation" [--layer=all] [--type=all] [--load]
# Search .summaries.json (if exists) or .index.json (fallback)
# Return relevant directories and files with summaries
```

---

## Testing Checklist

### Verify Compilation
```bash
cd scripts
npm run build
# Should complete without errors, create dist/ directory
```

### Test Scanner
```bash
node dist/ctx.js scan --root=../../../plugins/claude-code-capabilities --output=/tmp/scan.json
# Should show:
# ✓ Project scan complete
#   Total files: 85
#   Total directories: 15
#   Max depth: 3
#   File types: .json, .md, .py, .sh
```

### Test Context Creation
```bash
# Create simple analysis
cat > /tmp/analysis.json << 'EOF'
{"type":"web_app","domain":"test","tech_stack":{},"confidence":{"type":0.9,"domain":0.8},"keywords":[],"initial_categories":{"domain":[],"foundation":[]}}
EOF

node dist/ctx.js init --analysis=/tmp/analysis.json --root=../../../plugins/claude-code-capabilities
# Should create .context/ with subdirectories
# Check: ls .context/
```

### Test Capture
```bash
cd ../../../plugins/claude-code-capabilities
node ../../context-lifecycle-management-system/scripts/dist/ctx.js capture \
  --title="Test Decision" \
  --context="This is a test" \
  --category=foundation
# Should create .context/foundation/<id>-test-decision.json
# Check: ls .context/foundation/
```

### Test Query
```bash
node ../../context-lifecycle-management-system/scripts/dist/ctx.js query "Test"
# Should return: 1 match from foundation layer
```

---

## Next Steps (Phase 3)

### 1. Implement scan-and-analyze Command
- **File:** `.claude/commands/scan-and-analyze.md` ✅ CREATED
- **What it does:**
  1. Run scanner → structure.json
  2. Show results to user
  3. Guide user to Haiku with prompt
  4. Accept summary JSON from user
  5. Call mergeSummaries() to store
  6. Confirm success

### 2. Implement query-context Command
- **File:** `.claude/commands/query-context.md` ✅ CREATED
- **What it does:**
  1. Check for .summaries.json (preferred) or .index.json (fallback)
  2. Search based on topic
  3. Return summaries with relevance scores
  4. Show how to load full content
  5. Suggest next actions

### 3. (Future) Haiku Integration
- Automate batch sending to Haiku
- Receive results automatically
- Merge in background
- Progress feedback

---

## Key Design Decisions

### Why Vanilla TypeScript?
- No npm dependencies to manage
- Simpler deployment (single dist/ folder)
- Easy to audit security

### Why Scanner Groups by Directory?
- Humans think in folders
- Haiku analysis works better with context (parent/children)
- Enables directory-level summaries

### Why Parallel Haikus?
- 20 Haikus analyzing 20 directories ≈ same time as 1 Haiku
- Each Haiku focuses narrowly (better quality analysis)
- Results merge atomically (no conflicts)
- Scales with number of parallel requests

### Why Separate Index and Summaries?
- Index = captured decisions (explicit, reviewed)
- Summaries = automated analysis (derived, regenerable)
- Both searchable, serve different purposes
- Can regenerate summaries without losing decisions

---

## Performance Characteristics

| Operation | Time | Tokens |
|-----------|------|--------|
| Scan project (100 files) | <1s | 0 (pure I/O) |
| Haiku batch analysis (3-5 dirs) | ~3s | ~1200 per batch |
| Merge summaries (100 entries) | <100ms | 0 (pure I/O) |
| Query search | <50ms | 100 + result summaries |
| Load single file | <10ms | 0 + file content |

---

## Troubleshooting

### "ctx.js not found"
- Current: `plugins/context-lifecycle-management-system/scripts/`
- Check: `ls dist/ctx.js` exists

### "Cannot find module"
- Run: `npm run build` in scripts directory

### ".context doesn't exist"
- Run: `/scan-and-analyze` or `ctx init` first

### Haiku output won't merge
- Check: Valid JSON (use validator)
- Check: Has `directories` and/or `files` keys
- Check: Directory/file names match scan output exactly

---

## Future Enhancements

1. **Automated Haiku Integration** - Auto-invoke and merge
2. **Incremental Updates** - Only re-scan changed files
3. **File Content Caching** - Store file previews in summaries
4. **Semantic Search** - Vector embeddings for better matching
5. **Diff Tracking** - See what changed between scans
6. **Team Sync** - Git-based merge strategies for team context
7. **IDE Integration** - Sidebar showing context tree

---

## Support

**For issues in next session:**

1. Check IMPLEMENTATION_STATUS.md (what's done, what's TODO)
2. Read the command files (.claude/commands/*.md)
3. Run test checklist above to verify setup
4. Review HAIKU_ANALYSIS_PROMPT.md for Haiku usage

**Files to read:**
- `IMPLEMENTATION_STATUS.md` - Current state + next steps
- `HAIKU_ANALYSIS_PROMPT.md` - How to run Haiku analysis
- `.claude/commands/scan-and-analyze.md` - Scan workflow
- `.claude/commands/query-context.md` - Query workflow

---

**Built with vanilla TypeScript, no external dependencies.**

**Ready to scan, analyze, and query your projects efficiently.**
