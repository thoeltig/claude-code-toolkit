# Changelog

All notable changes to the Project Knowledge Base plugin are documented here.

Format: [Common Changelog](https://common-changelog.org)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [1.0.0.0] - 2026-01-08

_First release. Create persistent knowledge layer of your project - scan once, query forever across sessions._

### Added

- **New command `/scan`**: Generate persistent knowledge base of your project. Scans directory structure, batches directories, invokes Haiku agents in parallel waves (10-15 concurrent max), merges results into `.knowledge/summaries.json`. Handles large projects with progress warnings and wave-based processing.
- **New command `/query`**: Search project knowledge base by keywords. Returns relevant directories and files with confidence scores without reading full content. Query-first workflow enables fast exploration across sessions.
- **Haiku batch analysis agent**: Specialized agent for analyzing directories and files in parallel. Generates intelligent summaries with purpose, technologies, exports/imports, confidence for searching.
- **Project scanner CLI**: Walk filesystem, extract directory structure and file metadata, save to `scan.json` with project statistics (file count, directory count, max depth).
- **Summary merger CLI**: Combine batch analysis results from parallel Haiku agents, merge with existing `.knowledge/summaries.json`, support incremental updates.
- **Query engine**: Search stored summaries by keywords with confidence scoring algorithm. Score directories and files by path match (+10), summary match (+5), purpose match (+3), technologies/role (+2-3), exports/imports (+2).
- **Wave-based parallel processing**: Process batches in controlled waves of 10-15 concurrent agents. Prevents system overwhelm for large projects. Shows progress as waves complete. Displays warning for projects requiring 20+ batches with estimated time and user confirmation.
- **Persistent knowledge storage**: Summaries stored in `.knowledge/summaries.json` with metadata (summary, purpose, technologies/role, file/dir counts, lastUpdated timestamp). Git-trackable, team-shareable, regenerable as codebase evolves.
- **Incremental update support**: Re-scanning project updates existing summaries. Changed files re-analyzed, unchanged files preserved. Knowledge accumulates over time without redundant analysis.
- **Confidence scoring**: Search results ranked by relevance. Combined scoring across path, summary, purpose, technologies, role, exports, imports fields. Sorted descending by confidence.
- **Scoped searching**: Query supports `--scope` parameter to limit search to specific directory/file paths. Reduce results to relevant portions of project.
- **Result limiting**: Query supports `--max` parameter to limit returned results (default: 100). Configure based on available token budget.
- **TypeScript CLI implementation**: Zero external dependencies. Vanilla TypeScript compiled to JavaScript. Single `dist/` folder for easy deployment.

### Known Limitations

- Initial scan requires Haiku agent invocations for each batch - one-time cost in tokens (1200 per batch).
- Wave-based processing limits concurrency to 10-15 agents. Sequential waves slower than unlimited parallel, but prevents system overwhelm.
- Query results depend on summary quality - Haiku analysis limited by token window and prompt clarity.

---

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/ProjectKnowledgeBase_v1.0.1.0...HEAD
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectKnowledgeBase_v1.0.1.0