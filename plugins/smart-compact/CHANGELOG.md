# Changelog

All notable changes to the smart-compact plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.4.1.0] - 2026-02-17

### Fixed

**Token Estimation Accuracy**:
- Fixed inflated token estimates from cleanup_conversation.py (was using cache_creation_input_tokens ratio)
- Now uses standard ~4 bytes ≈ 1 token conversion for accurate estimates
- Token percentages now correctly reflect actual context window usage

**Cross-Platform Notification Path Resolution**:
- Fixed path resolution for cross-platform-notification plugin in cached plugin directories
- Now uses glob pattern `cross-platform-notification/*/scripts/claude_code_notifier.py` to handle version directories
- Previously failed to find notifier script when plugin was installed in plugin cache

**Configuration Variable Naming**:
- Renamed `SMART_COMPACT_CONTEXT_WINDOW_BYTES` → `SMART_COMPACT_CONTEXT_WINDOW_TOKENS` for clarity
- Updated to reflect token-based calculations instead of byte-based

## [1.4.0.0] - 2026-02-17

### Added

**Duplicate Tokens Notification Hook**:
- New `Stop` hook triggers when assistant finishes response and user input is awaited
- Shows duplicate information with human-readable formatting: `Duplication in conversation: 15.4K characters (14.5K tokens, 7.2% of total context window)`
- Configurable threshold via `SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT` env var (default 15% of context window)
- Smart threshold behavior: notifies only if duplicates exceed threshold, always notifies if tokens unavailable
- Calls cross-platform-notification plugin for system notifications across Windows, macOS, Linux
- Minimal hook overhead: only runs on Stop (assistant finished), not on every prompt submission

**Self-Documenting Deduplication Markers**:
- Updated all deduplication markers to be self-explanatory without domain knowledge
- Markers use consistent pattern: `[...Description - version contains complete content...]`
- Three marker types:
  - `[...Duplicate read omitted - latest version contains complete content...]` (multiple reads)
  - `[...Duplicate read omitted - earlier version contains complete content...]` (read after write)
  - `[...Partial duplicate read omitted - latest version contains complete content...]` (partial dedup after edit)
- Markers designed to help LLM reasoning: temporal language ("latest"/"earlier"), explicit completeness ("contains complete content")

**Configurable Environment Variables**:
- `SMART_COMPACT_CACHE_DURATION_MINUTES`: Override cache staleness threshold (default 5 min, matches default prompt cache)
- `SMART_COMPACT_CONTEXT_WINDOW_BYTES`: Set context window size for percentage calculations (200000 default, 1000000 available)
- `SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT`: Set minimum duplicate percentage to trigger notification (0-100, default 15%)
- `SMART_COMPACT_CACHE_VALIDATOR_THRESHOLD_PERCENT`: Set minimum duplicate percentage to block prompt input (0-100, default 0% for always block)

### Changed

**Message Formatting**:
- Bytes formatted as human-readable (KB, MB) for sizes ≥ 1000 bytes
- Tokens formatted as K for sizes ≥ 1000 tokens
- Unified notification message format: `Duplication in conversation: X characters (Y tokens, Z% of total context window)`

### Implementation Details

- New script: `notify_about_compaction.py` - queries duplicates, calculates percentage, sends cross-platform notification
- Updated script: `block_idle_session.py` - now checks cache validator threshold before blocking
- Updated markers: Changed from `DEDUPLICATION_*_MARKER|OMITTED_CHARS_COUNT:` format to natural language markers
- Helper functions: `get_context_window_bytes()`, `get_notification_threshold()`, `get_cache_validator_threshold()`, `format_bytes()`, `format_tokens()`
- Notification threshold logic: Only notifies if (duplicates_percentage ≥ threshold) OR (tokens unavailable)
- Cache validator threshold logic: Only blocks if (duplicates_percentage ≥ threshold) - default 0% blocks for any duplicates
- Hook registration: Updated `hooks.json` with `Stop` hook instead of `Notification` event

## [1.3.0.0] - 2026-02-14

_Backward-iterating chain-following algorithm for improved duplicate detection._

### Changed

**Deduplication Algorithm Redesign**:
- Replaced two-phase approach with backward-iterating chain-following
- Iterates from newest to oldest read, checking each read against previous operations
- When duplicate found: marks previous read and continues chain from it
- Enables transitive deduplication in single pass (Read A = B = C all caught efficiently)
- When content differs: applies partial dedup with line-level comparison

**Algorithm Details**:
- Backward iteration ensures newest reads (higher priority) remain when duplicates exist
- Chain following catches cascading duplicates without separate phases
- Prioritizes previous read over write for comparison (read-to-read before read-to-write)
- Processes reads in reverse order for context-aware duplicate detection

### Implementation

- Single-pass backward iteration: O(n) complexity maintained
- Chain continuation: When same content found, previous read marked and becomes new current
- Partial dedup fallback: When content differs, applies line-level comparison with ±3 margin
- Write fallback: Only checks previous write if no previous read exists
- Transitive chain example: Read5→Read4→Read3 all marked in one iteration of Read5

## [1.2.0.0] - 2026-02-14

_Line-level partial deduplication for smarter duplicate detection._

### Added

**Unified Line-Level Deduplication (Primary) + Hash-Based Read-After-Write (Secondary)**:
- Phase 1: Line-by-line comparison for all reads
  * Detects fully-identical reads and replaces with single placeholder
  * Detects partially-identical reads with line-level differences
  * Applies ±3 line context margin around changes (matches Claude Code edit tool)
  * Handles reads separated by edits
- Phase 2: Hash-based read-after-write detection (secondary, only remaining reads)
  * Identifies reads matching Write operations
  * Applied after line-level to avoid double-processing
- Correct order ensures consecutive reads are caught by line-level dedup first

**Partial Deduplication Markers**:
- New marker type: `DEDUPLICATION_PARTIAL_READ_MARKER|OMITTED_CHARS_COUNT:bytes`
- Separate placeholders for each omitted block maintain file structure
- Only creates placeholders for omitted blocks ≥ 3 lines

**Smart Filtering**:
- Skips files with < 3 total lines (defers to character-level dedup later)
- Skips partial omits for blocks < 3 lines (keeps small unchanged sections)

**Improved Token Calculation**:
- Token estimation now based on file percentage omitted
- Calculates full-file tokens, then applies percentage of omitted content
- Lower token ratio threshold: 0.25 - 5 tokens/character (was 0.5)
- Enables token estimates for more file types

### Changed

- Deduplication strategy: Phase 1 line-level (primary), Phase 2 hash-based read-after-write (secondary)
- Threshold values: ±3 line context margin, skip files < 3 lines, placeholders ≥ 3 lines (changed from 5)
- Token ratio validation range: 0.25 < ratio < 5 (lowered from 0.5 for better cache token support)
- Documentation updated to reflect correct phase order and line-level dedup strategy

### Implementation Details

- Phase 1 (line-level): Processes all reads sequentially, catches most duplicates
- Phase 2 (hash-based): Only processes reads not caught by phase 1
- Context margin (±3 lines) prevents losing important surrounding code
- Margin size matches Claude Code's built-in edit tool context
- Bytes omitted calculated per placeholder for accuracy
- Token estimation applies file-percentage approach for partial dedup
- Read-after-write detection ensures explicit Write→Read relationships are honored

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

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.4.1.0...HEAD
[1.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.4.0.0...SmartCompact_v1.4.1.0
[1.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.3.0.0...SmartCompact_v1.4.0.0
[1.3.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.2.0.0...SmartCompact_v1.3.0.0
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.1.0.0...SmartCompact_v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/SmartCompact_v1.0.0.0...SmartCompact_v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v1.0.0.0