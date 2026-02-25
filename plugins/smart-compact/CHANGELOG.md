# Changelog

All notable changes to the smart-compact plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [2.2.2.0] - 2026-02-25

### Changed

- **Refactor:** Moved configuration and duplicate logic into `const_models_and_config.py`
  - `block_idle_session.py` and `notify_about_compaction.py` contained the same logic to get the duplicate bytes and estimated tokens
  - Both files also contained multiple methods to get environment variables

## [2.2.1.0] - 2026-02-23

### Changed

- **Refactor:** Reorganize monolithic `cleanup_conversation.py` into modular Python package
  - `const_models_and_config.py` - Data models, enums, configuration functions, and markers
  - `content.py` - Content type detection and line/character-level diffing
  - `detection.py` - Pattern detection for grep, bash, and edit operations
  - `extract.py` - Transcript I/O and operation extraction functions
  - `__init__.py` - Clean public API with `__all__` exports
- Main script reduced from 1299 to 368 lines (-72% complexity)
- Improved maintainability: single responsibility per module
- Enhanced code organization: easier to test, extend, and understand
- Maintains full backward compatibility with existing functionality
- All tests pass: edge cases, smart overlap detection, pattern matching

## [2.2.0.0] - 2026-02-22

### Added

- Detect and deduplicate identical bash script execution outputs (python, npm, node, dotnet, ruby, java, go)
- Script outputs treated like file reads: mark earlier identical runs, keep latest
- Script invocation pattern detection: auto-identify `python script.py`, `npm test`, `dotnet build`, etc.
- Support for bash-wrapped scripts: `bash -c "python script.py"`

### Changed

- **Breaking:** Deduplication now keeps **last (latest) occurrence** instead of first occurrence
  - Aligns with LLM token reading preference (latest tokens prioritized)
  - More intuitive for forward reading (latest output at bottom)
- Updated dedup markers to reflect "latest version below" structure
- Add operation type tracking (`op_type` field) for context-aware marker messages
- Separate marker text for bash script output vs file reads for clarity

## [2.1.1.0] - 2026-02-22

### Added

- Smart edit overlap detection for grep operations: only skip dedup if edits touch grep-matched lines (not conservative "any edit = skip")
- Extended bash pattern detection: support `head [-n N]`, `tail [-n N] / -f`, `wc [-lcw]` commands
- Extract line numbers from grep output to enable safe overlap checking

### Changed

- Grep deduplication logic: from conservative "any edit = skip" to smart line-level overlap detection
- Bash pattern detection: from simple cat/head/tail to comprehensive file-reading command coverage
- Improved filepath extraction with robust flag parsing

## [2.1.0.0] - 2026-02-22

### Added

- Extend forward-chaining algorithm to deduplicate bash commands that read files (cat, head, tail)
- Deduplicate grep search operations when later reads exist for same file with no intervening edits
- Extract bash file paths and outputs for comparison using pattern matching
- Extract grep patterns and matched line ranges for safe dedup checking
- Track Edit operations for dedup safety validation between grep and reads
- Unified operation stream: process all operations (Read, Write, Bash, Grep, Edit) chronologically per file

### Changed

- Bash operations treated like file reads: identical outputs → full dedup, different → partial dedup
- Grep operations use conservative "later read without edits" check for safety
- Both bash and grep inherit existing configurable thresholds (min bytes, context margins)
- Algorithm maintains O(n) complexity with single pass per filepath
- Full backward compatibility with existing Read/Write/Edit dedup behavior

## [2.0.0.0] - 2026-02-21

_Complete rewrite with forward-chaining algorithm, dual-mode parsing, and configurable thresholds._

### Changed

- **Breaking:** Replace backward-iterating algorithm with forward-chaining for cleaner, more intuitive logic
- **Breaking:** Last read in file always keeps full content (not first); better represents current state
- Implement content type auto-detection (newline-based): single-line uses char-level diff, multiline uses line-level diff
- Add configurable dedup thresholds and context margins via environment variables:
  - `SMART_COMPACT_DEDUP_MIN_BYTES` (default: 1)
  - `SMART_COMPACT_MULTILINE_CONTEXT_LINES` (default: 1)
  - `SMART_COMPACT_SINGLELINE_CONTEXT_CHARS` (default: 10)
- Add raw_content extraction for Write → Read edge cases (immediate reads after writes)
- Update output formats: short (`Savings: XXX bytes (~YYY tokens)`) and normal (`Found N reads, XXX bytes`)
- Improve logging with `--debug` flag for troubleshooting
- Track dedup state via markers (no external cache file needed); enables multi-pass convergence

## [1.4.1.0] - 2026-02-17

### Fixed

- Fix inflated token estimates (use standard ~4 bytes ≈ 1 token conversion)
- Fix duplicate byte count accuracy (count actual message content, not original)
- Fix cross-platform notification path resolution for cached plugin directories
- Rename config variable `SMART_COMPACT_CONTEXT_WINDOW_BYTES` → `SMART_COMPACT_CONTEXT_WINDOW_TOKENS`

## [1.4.0.0] - 2026-02-17

### Added

- Add `Stop` hook for duplicate token notifications when idle and awaiting input
- Add self-documenting deduplication markers with temporal language ("latest", "earlier")
- Add configurable environment variables:
  - `SMART_COMPACT_CACHE_DURATION_MINUTES`
  - `SMART_COMPACT_CONTEXT_WINDOW_BYTES` (now `CONTEXT_WINDOW_TOKENS`)
  - `SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT`
  - `SMART_COMPACT_CACHE_VALIDATOR_THRESHOLD_PERCENT`
- Add cross-platform system notifications via `notify_about_compaction.py`

### Changed

- Format duplicate bytes as human-readable (KB, MB) for sizes ≥ 1000 bytes
- Format tokens with K suffix for sizes ≥ 1000 tokens
- Update marker format from `DEDUPLICATION_*_MARKER|OMITTED_CHARS_COUNT:` to natural language
- Update hook registration from `Notification` event to `Stop` hook

## [1.3.0.0] - 2026-02-14

_Backward-iterating chain-following algorithm for improved duplicate detection._

### Changed

- Replace two-phase approach with backward-iterating chain-following
- Iterate from newest to oldest read for context-aware duplicate detection
- Prioritize previous read over write for comparison (read-to-read before read-to-write)
- Enable transitive deduplication in single pass (Read A = B = C all caught efficiently)
- Apply partial dedup with line-level comparison when content differs

## [1.2.0.0] - 2026-02-14

_Line-level partial deduplication for smarter duplicate detection._

### Added

- Phase 1 (primary): Line-by-line comparison for all reads (detects fully-identical and partially-identical)
- Phase 2 (secondary): Hash-based read-after-write detection (only for remaining reads)
- Partial dedup markers with per-block placeholders to maintain file structure
- Smart filtering: skip files < 3 lines, skip partial omits < 3 lines
- Improved token calculation based on file percentage omitted
- Support for broader token ratio validation range (0.25-5 tokens/character)

### Changed

- Strategy: Two-phase approach (line-level primary, hash-based secondary)
- Context margin: ±3 lines around changes (matches Claude Code edit tool)
- Only create placeholders for omitted blocks ≥ 3 lines
- Apply file-percentage token estimation for partial dedup

## [1.1.0.0] - 2026-02-14

_Cache validation and token estimation features._

### Added

- Pre-prompt cache validator hook: detect stale transcripts (> 5 minutes idle) and block if dedup would save bytes
- Token estimation from cache write ratios per file (0.5 < ratio < 5 tokens/character)
- Add `--dry-run-short` flag for compact output format
- Show token estimates in all modes: dry-run, CLI output, and hook messages
- Format: `Savings: XXX bytes (~YYY tokens)`

## [1.0.0.0] - 2026-02-08

_First release of transcript deduplication plugin._

### Added

- Hash-based duplicate detection (SHA256) for file content comparison
- Two-level deduplication: priority to Writes, then keep latest Reads
- Deterministic dedup markers: `DEDUPLICATION_READ_AFTER_WRITE_MARKER` and `DEDUPLICATION_READ_MARKER`
- Integration modes: hook (automatic SessionEnd), CLI (manual with `--dry-run`)
- Transcript format support: minified JSONL, pretty-printed JSON, unicode paths
- Detailed dry-run reports and minimal hook mode output
- O(n) single-pass analysis with no false positives

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v2.2.2.0...HEAD
[2.2.2.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v2.2.1.0...SmartCompact_v2.2.2.0
[2.2.1.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v2.2.0.0...SmartCompact_v2.2.1.0
[2.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v2.1.1.0...SmartCompact_v2.2.0.0
[2.1.1.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v2.1.0.0...SmartCompact_v2.1.1.0
[2.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v2.0.0.0...SmartCompact_v2.1.0.0
[2.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.4.1.0...SmartCompact_v2.0.0.0
[1.4.1.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.4.0.0...SmartCompact_v1.4.1.0
[1.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.3.0.0...SmartCompact_v1.4.0.0
[1.3.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.2.0.0...SmartCompact_v1.3.0.0
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.1.0.0...SmartCompact_v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.0.0.0...SmartCompact_v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v1.0.0.0