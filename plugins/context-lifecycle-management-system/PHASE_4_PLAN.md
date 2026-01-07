# Phase 4: Slash Command Handler Implementation

**Last Updated:** 2026-01-07
**Status:** Ready to begin Phase 4

---

## Overview

Implement two user-facing slash commands:
- `/scan --root=<path>` - Orchestrate project analysis with parallel Haiku agents
- `/query "keywords" --scope=<path> --max=N` - Search summaries with confidence scoring

## Prerequisites Complete ✅

- CLI commands implemented and tested (scan, merge, query)
- Minified JSON output throughout
- Glob pattern support in merge command
- Confidence scoring in query command
- Command specification documents (.md files)

---

## Phase 4 Task List

### Task 1: Validate Against Plugin Structure
- **Goal:** Ensure slash commands work with actual Claude Code plugin structure
- **Action:** Review `claude-code-capabilities` plugin
- **Deliverable:** List of any needed adjustments to scan.md and query.md

### Task 2: Update Command Specifications
- **Goal:** Refine spec documents based on plugin validation
- **Action:** Update scan.md and query.md with validated workflows
- **Deliverable:** Final, tested command specifications

### Task 3: Create Haiku Agent Prompt
- **Goal:** Build reusable agent prompt template for Haiku analysis
- **Input:** HAIKU_ANALYSIS_PROMPT.md template
- **Output:** Structured prompt that can be passed to Task tool with subagent_type='haiku'
- **Key Points:**
  - Include scan batch data in prompt context
  - Request JSON output format: `{"directories":{...},"files":{...}}`
  - Instruct agent to write to `/tmp/haiku-batch-N.json`
  - Make prompt reusable for each batch

### Task 4: Test Haiku Prompt with Task Tool
- **Goal:** Verify prompt works when invoked via Task tool
- **Action:**
  - Invoke Task tool with subagent_type='haiku'
  - Pass agent prompt and scan batch data
  - Verify file is written to `/tmp/`
  - Parse output JSON
- **Deliverable:** Working example of Haiku subagent invocation

### Task 5: Implement /scan Slash Command Handler
- **Goal:** Orchestrate full scan → batch → analyze → merge workflow
- **Workflow:**
  1. Execute `ctx scan --root=<path>`
  2. Load scan.json, batch directories (3-5 per batch)
  3. Create Haiku agent prompt for each batch
  4. Invoke Haiku agents in PARALLEL using Task tool
  5. Wait for all batches to complete
  6. Execute `ctx merge --summaries=/tmp/haiku-batch-*.json`
  7. Report completion with stats
- **Key Implementation Detail:**
  - Use Task tool with subagent_type='haiku'
  - Run all batches concurrently (not sequentially)
  - No inline data processing (all file-based)
  - Parse JSON outputs only for confirmation

### Task 6: Implement /query Slash Command Handler
- **Goal:** Parse search results and format for user display
- **Workflow:**
  1. Validate context exists (check .context/.summaries.json)
  2. Execute `ctx query <keywords> --scope=<path> --max=<N>`
  3. Parse JSON results
  4. Format and display to user:
     - Group by type (directory/file)
     - Show confidence scores
     - Show summary, purpose, tech/role/exports/imports
  5. Suggest next actions (refine search or run scan)
- **Display Format:**
  ```
  Found N matches for "keywords" (scope: all|<path>)
  Searching: [keyword1, keyword2, ...]

  DIRECTORIES:
  1. [DIRECTORY] path
     Score: N
     Summary: ...
     Purpose: ...
     Tech: [...]

  FILES:
  2. [FILE] path
     Score: N
     Summary: ...
     Role: ...
     Exports: [...]
  ```

### Task 7: End-to-End Testing
- **Goal:** Verify both commands work together in realistic scenario
- **Test Steps:**
  1. Run `/scan --root=../claude-code-capabilities`
  2. Verify scan.json created and batches prepared
  3. Verify Haiku agents invoked and files written
  4. Verify merge creates .summaries.json
  5. Run `/query "documentation"`
  6. Verify results formatted correctly
  7. Test `/query "auth" --scope=src --max=5`
  8. Test error cases (missing context, invalid scope, etc.)
- **Deliverable:** Confirmed working end-to-end workflow

---

## Architecture Reminder

### CLI Commands (Fully Implemented)
```bash
ctx scan --root=<path>
# Output: {"status":"success","action":"scan","output":"...","stats":{...}}

ctx merge --summaries=/tmp/haiku-batch-*.json --root=<path>
# Handles glob patterns, reads all matching files, combines them
# Output: {"status":"success","action":"merge","summaries":{...}}

ctx query "keywords" --scope=<path> --max=N --root=<path>
# Output: {"source":"summaries","query":"...","keywords":[...],"results":[{...}]}
```

### Slash Command Flow
```
User: /scan --root=../my-project
  ↓
Handler: 1. ctx scan
         2. Batch directories
         3. Invoke Haiku agents in PARALLEL (Task tool)
            - Each agent writes /tmp/haiku-batch-N.json
         4. Wait for all to complete
         5. ctx merge --summaries=/tmp/haiku-batch-*.json
         6. Report success

User: /query "keywords" --scope=src/auth --max=10
  ↓
Handler: 1. Validate context exists
         2. ctx query "keywords" --scope=src/auth --max=10
         3. Parse JSON results
         4. Format and display
         5. Suggest next steps
```

---

## Files to Reference

- `scripts/ctx.ts` - CLI implementation (production-ready)
- `commands/scan.md` - Scan command specification
- `commands/query.md` - Query command specification
- `HAIKU_ANALYSIS_PROMPT.md` - Template for Haiku agent prompts

---

## Key Design Principles

✅ **Minimal tokens:** Minified JSON, no inline processing
✅ **No mental work:** All operations deterministic (Haiku writes files, merge combines them)
✅ **Parallel processing:** Haiku agents run concurrently
✅ **File-based:** Agents write to files, handler reads/combines
✅ **Scored results:** Confidence-based ordering, filtering, limiting

---

## Success Criteria

- ✅ /scan executes scan → batches → invokes Haiku → merges results
- ✅ /query searches and formats results with confidence scores
- ✅ Both commands handle errors gracefully
- ✅ End-to-end workflow tested on real project
- ✅ Glob pattern merging works correctly
- ✅ Haiku agents write to files successfully
