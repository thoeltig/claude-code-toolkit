# Changelog

All notable changes to the transcript-duplicate-scrubber plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.1.0.0] - 2026-02-14

_Cache validation and token estimation features._

### Added

**UserPromptSubmit Hook - Cache Validator**:
- Pre-prompt validation hook that detects stale transcripts (> 5 minutes idle)
- Blocks user prompt submission if transcript is stale AND deduplication would save bytes
- Displays estimated token savings alongside byte savings
- Exit code 2 prevents prompt submission with user-friendly message
- Helps users resume sessions instead of continuing stale conversations

**Token Estimation**:
- Per-file token/character ratio extraction from transcript cache writes
- Rolling search through cache_creation_input_tokens to find valid ratios
- Ratio validation: 0.5 < ratio < 5 tokens/character (rejects invalid cache data)
- Calculates total estimated token savings per deduplicated file
- Token estimates shown in all outputs: `Total bytes omitted: XXX (~YYY tokens)`

**Enhanced Reporting**:
- New `--dry-run-short` flag for compact output format
- Token estimates in all modes: --dry-run, --dry-run-short, normal run, and hook messages
- Format: `Savings: XXX bytes (~YYY tokens)` for easier parsing and display

### Implementation Details

- Cache validator checks: (1) transcript age, (2) deduplication savings, (3) per-file token ratios
- Token extraction uses cache_creation_input_tokens from assistant message following Read/Write
- Only calculates tokens for files with actual duplicates being removed
- Graceful fallback when token ratio unavailable (shows bytes only)
- Default cache duration: 5 minutes (hardcoded for now, configurable in future)

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

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/TranscriptDuplicateScrubber_v1.1.0.0...HEAD
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/TranscriptDuplicateScrubber_v1.0.0.0...TranscriptDuplicateScrubber_v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/TranscriptDuplicateScrubber_v1.0.0.0