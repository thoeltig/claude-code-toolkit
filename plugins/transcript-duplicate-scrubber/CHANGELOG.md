# Changelog

All notable changes to the transcript-duplicate-scrubber plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.0.0.0] - 2026-02-08

_First release of transcript deduplication plugin._

### Added

**Core Deduplication Logic**:
- Hash-based duplicate detection (SHA256) for file content comparison
- Two-level deduplication strategy:
  - Rule 1: If Write has content hash X, all Reads with hash X marked redundant (Write priority)
  - Rule 2: If no Write, keep latest Read per hash, mark earlier Reads redundant (token priority)
- Different deduplication markers for transparency:
  - `DEDUPLICATION_READ_AFTER_WRITE_MARKER`: Read removed due to Write with same content
  - `DEDUPLICATION_READ_MARKER`: Read removed due to earlier Read with same content
- Preserves all intervening messages - only removes duplicate file content

**Integration Modes**:
- Hook mode: Automatic deduplication on session end (SessionEnd hook) - modifies persisted transcript as session closes
- CLI mode: Manual deduplication with `--dry-run` preview option
- Auto-detection: Automatically distinguishes JSON hook input from file path input
- Early exit optimization: Skips processing when session is cleared (reason='clear')

**Transcript Format Support**:
- Minified JSONL (one object per line)
- Pretty-printed JSON objects (multi-line with auto-detection via brace counting)
- Unicode path support (preserves non-ASCII characters like `ö`, `ü`, etc.)

**Reporting**:
- Detailed dry-run report
- Hook mode: Minimal one-liner output (session cleanup context)
- CLI mode: Full verbose reporting with deduplication details

**Algorithm Performance**:
- O(n) time complexity for single-pass analysis
- Efficient hash-based duplicate detection
- No false positives: Only removes exact content matches
- Preserves file modification history (edits create different hashes)

### Implementation Notes

- Deterministic: Hash-based logic, no LLM-driven decisions
- Safe: Non-destructive markers preserve debugging capability
- Reversible: Markers clearly indicate omitted content and byte count
- Respects token priority: Keeps latest reads (higher priority in context)
- Write-aware: Recognizes Write operations as content sources, deduplicates redundant Reads

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/TranscriptDuplicateScrubber_v1.0.0.0...HEAD
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/TranscriptDuplicateScrubber_v1.0.0.0
