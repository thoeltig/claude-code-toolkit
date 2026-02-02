# Changelog

All notable changes to the project-intel plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.2.0.0] - 2026-02-02

_Automatic session notifications and intelligent knowledge maintenance with deletion cleanup and dynamic directory discovery._

### Added

- **SessionStart hook**: Automatic notification on session start showing:
  - Total files available for querying in current project knowledge
  - Number of files needing update (new + modified since last scan)
  - Suggestion to run `/scan` if no knowledge exists for the project
  - Suggestion to run `/scan` to update when changes are detected
- **Automatic file deletion cleanup**: Files removed from scan location are now automatically deleted from summaries
- **Automatic directory cleanup**: Empty directories are automatically removed from summaries when all their files are deleted
- **Filesystem modification date detection**: Filesystem scanning now checks file modification times to detect new, modified, and deleted files (parity with git-based detection)
- **Dynamic knowledgeDir discovery**: Intelligent fallback chain for finding `.knowledge` directory:
  1. Use explicitly provided `--knowledgeDir` argument (if specified)
  2. Search from provided scan/query location (if location differs from cwd)
  3. Search from current working directory (process location)
  - Eliminates need to always specify `--knowledgeDir` for same-directory scans

### Improved

- **Knowledge maintenance**: Summaries stay accurate automatically - deleted and empty entries cleaned up
- **Cross-platform consistency**: Filesystem-based scanning now detects changes identically to git-based scanning (new/modified/deleted)
- **Ease of use**: No need to remember or repeatedly specify `--knowledgeDir` when scanning from project root
- **Session workflow**: Users immediately see project knowledge status without manual checks

## [1.1.0.0] - 2026-01-16

_Performance enhancement: Git-based incremental scanning reduces file processing by 80-95% on subsequent scans._

### Added

- Git integration for incremental scanning: Only re-analyze files modified since last scan
- Automatic git tracking detection: Uses `git ls-files` when available, falls back to filesystem walk
- Modification timestamp tracking from git history for accurate staleness detection

### Improved

- Scan performance and token usage by only scanning the files modified since last scan
- Slash command context: Removed unnecessary information from `/scan` and `/query` command to reduce model context bloat and use less tokens

## [1.0.0.0] - 2026-01-14

_First release: Lightweight reconnaissance system for directed code exploration._

### Added

- `/scan` command: Generate semantic summaries of project files and directories (one-time setup)
- `/query` command: Search summaries by semantic relevance before reading files
- Semantic scoring system matching on purpose, summary, exports/imports, technologies, and path
- Wave-based parallel processing: Max 10 concurrent agents for large projects
- Persistent storage: `.knowledge/summaries.json` survives across sessions
- Directory and file summary generation with purpose, role, exports, imports, and technologies tracking
- File modification timestamp tracking for staleness detection
- Scope filtering: Limit queries to specific directories with `--scope` parameter
- Result limiting: Control query results with `--max` parameter
- Incremental updates: Re-scan merges new summaries with existing knowledge
- Best practices guide for maintenance strategy and query approaches
- Performance characteristics: Cost estimates for projects of different sizes
- Troubleshooting guide with common issues and solutions
- Comparison to alternatives: vs. Explore agent, Grep/Glob, direct file reading
- Design decision documentation: Why persistent storage, wave-based processing, semantic scoring, query-first workflow, and user-managed staleness
- Support for semantic matching on conceptual terms, not just keywords
- Project structure guidance: When to use project-intel, when to skip it, breakeven analysis
- Applicability scope: Best fit for mid to larger projects (25+ files), team projects, multi-session work

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/ProjectIntel_v1.1.0.0...HEAD
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.0.0.0