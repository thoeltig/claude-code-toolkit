# Changelog

All notable changes to the session-protocol plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.2.0.0] - 2026-02-06

### Removed

- **Breaking:** `/save-session-protocol` and `/load-session-protocol` slash commands - managing-session-continuity skill can be invoked directly if necessary
- Command files: `save-session-protocol.md` and `load-session-protocol.md`

### Changed

- Improved assistant instruction in session start hook: If a session protocol exists provide complete workflow to use to the model when user wants to load a session protocol 

## [1.1.0.0] - 2026-01-08

### Changed

- **Breaking:** Removed notification hook and related notification infrastructure from session-protocol plugin
- Notification functionality moved to separate cross-platform-notification plugin for cleaner feature separation

### Removed

- Notification hook integration from hooks.json (moved to cross-platform-notification plugin)
- PreCompact hook integration from hooks.json
- `hook-wrapper-with-notification.py`: Unified notification wrapper script
- `precompact-session-protocol-reminder.py`: PreCompact hook script for save reminders
- `claude_code_notifier.py`: Cross-platform notification helper script

## [1.0.0.0] - 2025-11-27

_First release of session continuity plugin._

### Added

**Core Functionality**:
- managing-session-continuity skill for session state management
- /save-session-protocol command for capturing session context
- /load-session-protocol command for restoring session context
- WF1: Save Context - capture session state to sp.json with task consolidation
- WF2: Load Context - restore session state from sp.json with validation

**Task Management**:
- Task consolidation logic (3+ criteria decision matrix) for grouping related completed tasks
- Consolidated task schema with `consolidated` bool and `consolidated_count` int fields
- Session state check: skip Read if protocol loaded this session (overwrite), else merge
- Task limit: last 5 individual completed + consolidated groups (no hard limit on groups)
- Task categorization: BUGFIX, FEATURE, CONFIG, DOCS, TEST, REFACTOR
- Priority levels: P1, P2, P3
- File references in path:line format with relative or ~/ paths
- Consolidation matrix: same feature/area, >5 tasks, no critical findings, >3 days age
- Keep individual rules: critical bugs, unique pitfalls, recent (<3 days), referenced by pending

**Git Integration**:
- Smart git integration: only check if `.git` exists, minimal commands for branch/commit
- Git validation on load: simple commit comparison, branch drift warning
- Graceful degradation when not a git repository

**Data Format**:
- Privacy-safe JSON format: strip usernames from paths, no personal info
- Minified JSON format requirement for token efficiency
- ISO8601 UTC timestamps with Z suffix
- Context blocks for architectural decisions, critical pitfalls, error patterns, plan refs

**Hooks & Automation**:
- SessionStart hook with notification wrapper for automatic session detection
- PreCompact hook with notification wrapper for session protocol reminders
- Notification hook for cross-platform system notifications (Windows, macOS, Linux)
- Hook-wrapper pattern for unified notification handling
- Official Claude Code hook response schema with structured additionalContext

**Token Optimization**:
- Token-optimized: 50% skill reduction vs traditional verbose markdown (~1200tk vs ~2400tk)
- Workflow optimizations: task consolidation, conditional git, session state tracking
- Optimization techniques: R1 (Remove Claude Knowledge), R2 (Compress Structure), R3 (Decision Matrices), R7 (Workflow Structure), R8A (Field Compression), R10 (Consistent Terminology)
- SKILL.md: 271 lines vs ~500 traditional verbose (46% reduction)

**Error Handling**:
- Error handling: graceful degradation for missing .git, invalid JSON errors
- Clear error messages for debugging

### Changed

- Optimized SKILL.md to 271 lines vs ~500 traditional verbose (46% reduction)
- Token efficiency: 50% reduction vs traditional markdown documentation (~1200tk vs ~2400tk)
- Removed file validation (overhead without critical benefit)
- Removed expensive git operations (commit count history)
- Compressed structure: abbreviations (sp.json, pend, prog, w/, ts, mgmt), symbols (→, ≥, ≤)
- Imperative format: "Read + parse" not "Use Read tool to read and then parse"
- Decision matrix format for consolidation criteria
- Workflow structure with numbered steps vs prose paragraphs

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/SessionProtocol_v1.2.0.0...HEAD
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SessionProtocol_v1.1.0.0...SessionProtocol_v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SessionProtocol_v1.0.0.0...SessionProtocol_v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/SessionProtocol_v1.0.0.0
