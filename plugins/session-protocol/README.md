# Session Protocol Plugin

Token-optimized session continuity management for Claude Code conversations.

## Overview

The session-protocol plugin enables seamless context preservation across Claude Code sessions through structured JSON state management. It captures pending tasks, completed work, architectural decisions, and critical findings—allowing you to continue exactly where you left off without re-reading files or re-analyzing code.

## Features

- **Smart Task Management**: Automatic consolidation of related completed tasks
- **Token Efficient**: 59-62% reduction in save/load operations compared to writing/reading markdowns
- **Privacy Safe**: Strips usernames from paths, no personal info in JSON
- **Git Integration**: Conditional checks (only if `.git` exists), minimal commands
- **Session State Tracking**: Skip unnecessary reads when protocol already loaded
- **Context Blocks**: Preserve architectural decisions and critical pitfalls
- **Minified Storage**: Single-line JSON for efficient parsing

## Installation

Copy the plugin to your Claude Code plugins directory:

```bash
# Via marketplace (when available)
claude-code plugin install session-protocol

# Manual installation
cp -r session-protocol ~/.claude/plugins/
```

## Components

### Skills

- **managing-session-continuity**: Core session state management logic
  - WF1: Save Context - capture state to session-protocol.json
  - WF2: Load Context - restore state from session-protocol.json

### Commands

- `/save-session-protocol`: Save current session context
- `/load-session-protocol`: Load previous session context

### Scripts

- `sessionstart-session-protocol-check.py`: Auto-detect existing protocol on session start
- `precompact-session-protocol-reminder.py`: Remind to save before session compact
- `claude_code_notifier.py`: Notification helper to show messages to users for workflow events

## Usage

### Save Session

When ending a session with unfinished work:

```
You: "Save session"

Claude: Saved → sp.json
- 5 pend (2 P1, 3 P2)
- 8 done (3 individual, 1 consolidated from 12)
- Git: feature/auth @ abc123f
Next: TASK_001 - Fix JWT validation
```

### Load Session

When starting a new session:

```
You: "Load session"

Claude: Loaded sp.json (2d old)
- 3 pend, 1 prog, 8 done (1 consolidated from 12)
- Git: feature/auth @ abc123f (2 commits ahead)
Next: TASK_001 - Fix JWT validation
```

### Manual Invocation

```
/save-session-protocol
/load-session-protocol
```

## Workflows

### WF1: Save Context

**Steps**:
1. Check if protocol loaded this session (skip Read if yes)
2. Extract pending/in_progress tasks from TodoWrite
3. Consolidate completed tasks (last 5 individual + groups for older)
4. Capture git state if `.git` exists
5. Build minified JSON with privacy rules applied
6. Write to session-protocol.json

**Task Consolidation** (3+ criteria = consolidate):
- Same feature/area (e.g., "redesign page X")
- >5 related completed tasks
- No critical findings to preserve individually
- >3 days since last task in group

### WF2: Load Context

**Steps**:
1. Read and parse session-protocol.json
2. Validate git state (if metadata present AND `.git` exists)
3. Build summary: age, task counts, next action, warnings
4. Present concise context to user

## JSON Schema

```json
{
  "metadata": {
    "version": "2.0",
    "created": "2025-11-26T10:00:00Z",
    "updated": "2025-11-26T14:00:00Z",
    "git_branch": "feature/auth",
    "git_commit": "abc123f5d2e8a1b4c6e9f3a7"
  },
  "tasks": [
    {
      "id": "TASK_001",
      "title": "Fix auth middleware",
      "status": "pending",
      "priority": "P1",
      "category": "BUGFIX",
      "created": "2025-11-26T10:00:00Z",
      "completed": null,
      "consolidated": false,
      "consolidated_count": 0,
      "context": "JWT RS256 validation fails. See: src/auth/middleware.ts:45",
      "files": ["src/auth/middleware.ts:45"]
    },
    {
      "id": "TASK_010",
      "title": "Redesign homepage",
      "status": "completed",
      "consolidated": true,
      "consolidated_count": 12,
      "context": "Redesigned nav, hero, footer (12 tasks). Pitfall: CSS grid Safari compat. Plan: docs/homepage-plan.md",
      "files": ["docs/homepage-plan.md"],
      "completed": "2025-11-24T18:00:00Z"
    }
  ],
  "context_blocks": [
    {
      "title": "JWT Auth Setup",
      "content": "RS256 algo. Pub key: ~/config/jwt-keys/public.pem. TTL: 1h access, 7d refresh",
      "updated": "2025-11-26T14:00:00Z",
      "related_tasks": ["TASK_001"]
    }
  ]
}
```

### Task Fields

- **id**: TASK_XXX (sequential, unique)
- **title**: Task description
- **status**: pending | in_progress | completed
- **priority**: P1 | P2 | P3 (optional)
- **category**: BUGFIX | FEATURE | CONFIG | DOCS | TEST | REFACTOR (optional)
- **consolidated**: true if grouped from multiple tasks
- **consolidated_count**: number of original tasks if consolidated
- **context**: summary, pitfalls, plan refs, file refs
- **files**: array of path:line references (relative or ~/)

## Privacy & Security

**Automatic privacy enforcement**:
- Strips usernames from paths: `/Users/john/project` → `~/project`
- No email addresses, API keys, tokens, or credentials
- A bit safer for accidental git commits but to be sure include the session-protocol.json in .gitignore

**Format requirements**:
- Minified JSON (single line, no whitespace)
- Relative or tilde paths only
- UTC timestamps with Z suffix

## Token Optimization

Applied multiple token optimization techniques to the traditionally verbose markdown SKILL.md

**Techniques applied**:
- Remove Claude Knowledge (no basic tool/git/JSON explanations)
- Compress Structure (abbreviations, symbols, code-style commands)
- Decision Matrices (consolidation criteria with checkboxes)
- Workflow Structure (numbered steps vs prose paragraphs)
- Field Compression (minified JSON, compressed field names)
- Consistent Terminology (one term per concept)

**Performance vs traditional verbose documentation**:
- SKILL.md: 271 lines vs ~500 lines traditional (46% reduction)
- Skill token count: ~1200tk vs ~2400tk traditional (50% reduction)
- Workflow execution: Task consolidation reduces repeated context
- Git operations: Conditional checks save ~130tk per operation when not a repo
- Session state tracking: Eliminates unnecessary Read operations (~2000tk saved when overwriting)

## Best Practices

### When to Save

- Before pre compact context to avoid losssing information
- To restart a session with already optimized and planned context (reduce noise)
- Ending session with unfinished work
- Before switching to different project
- After significant progress on complex feature
- Before risky operations (refactoring, migrations)

### What Gets Saved

**Always included**:
- All pending/in_progress tasks
- Last 5 completed tasks (individual)
- Consolidated groups for older related work
- Architectural decisions (context blocks)
- Critical pitfalls and error patterns
- Plan file references (not inline plans)

**Never included**:
- Conversation history
- Tool outputs
- Micro-step details (unless critical)
- Standard operations
- Personal information

### Consolidation Strategy

**Consolidate** when:
- Multiple tasks for same feature (e.g., "12 tasks redesigning homepage")
- Related work completed >3 days ago
- No unique pitfalls per task
- Summary + key findings sufficient

**Keep individual** when:
- Critical bugs with specific fixes
- Unique lessons/pitfalls per task
- Recent work (<3 days)
- Referenced by pending tasks

## Hooks Integration

The plugin includes automated hooks that enhance session workflow with notifications.

### Hooks Configuration

Located in `hooks/hooks.json`, referenced by plugin.json:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python \"${CLAUDE_PLUGIN_ROOT}/scripts/hook-wrapper-with-notification.py\" sessionstart-session-protocol-check.py",
            "timeout": 5000
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python \"${CLAUDE_PLUGIN_ROOT}/scripts/hook-wrapper-with-notification.py\" precompact-session-protocol-reminder.py",
            "timeout": 5000
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python \"${CLAUDE_PLUGIN_ROOT}/scripts/claude_code_notifier.py\""
          }
        ]
      }
    ]
  }
}
```

### Hook Behavior

**SessionStart Hook**:
- Auto-detects session-protocol.json on session start
- **User notification**: "A session protocol file exists. Type /load-session-protocol to restore it, or continue without loading."
- **System message**: "Found session-protocol.json from previous session"
- Claude receives structured guidance to inform user and wait for decision

**PreCompact Hook**:
- Triggers before context compaction
- **User notification**: "Context is full and will be compacted. Run /save-session-protocol if you have unfinished work to preserve."
- **System message**: "Context compaction imminent - consider saving state"
- Claude receives instructions to evaluate unfinished work and recommend saving if needed

**Notification Hook**:
- Sends system notifications for workflow events
- Cross-platform support (Windows, macOS, Linux)
- Customizable messages via CLAUDE_NOTIFIER_CUSTOM_MESSAGES environment variable

### Hook Scripts

All hooks use the official Claude Code response schema with:
- **User notifications**: Clear, actionable messages displayed to user
- **System messages**: Instructions for Claude
- **Structured guidance**: JSON in additionalContext with severity, actions, and checks

**Wrapper pattern**: `hook-wrapper-with-notification.py` provides unified notification handling for workflow hooks.

## Troubleshooting

### "Cannot load: invalid JSON"

**Cause**: session-protocol.json is corrupted
**Fix**: Read as plain text to salvage information and overwrite with current session context

### "Git state changed"

**Info**: Warning (not error) that repository has new commits since save
**Action**: Review git log to understand changes

### No git information captured

**Cause**: Not a git repository (no `.git` folder)
**Fix**: Normal behavior, git integration is optional

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