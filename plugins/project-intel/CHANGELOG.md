# Changelog

All notable changes to the project-intel plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

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

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/ProjectIntel_v1.0.0.0...HEAD
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.0.0.0
