# Smart Compact Plugin

Automatically remove duplicate file reads, script outputs, and grep results from Claude Code session transcripts. Uses **deterministic deduplication** (not LLM-based) to reduce token waste and lower hallucination risk when resuming sessions.

## Overview

During typical Claude Code sessions, you naturally read the same files multiple times:
- Read file to understand context
- Make edits
- Read again to verify changes (duplicate)
- Exchange messages with Claude
- Read again to refresh context (duplicate)

Each read creates a session transcript entry. When you `/resume`, Claude reconstructs the **entire conversation** from the transcript—expensive reconstruction that includes all those duplicate reads. The plugin removes exact duplicates while keeping intervening messages intact, resulting in a smaller transcript that costs fewer tokens to reconstruct on resume.

**Example:**
```
Session 1: Read config.json (57 bytes)
           [Edit config.json]
           Read config.json again (57 bytes, same content)
           [Chat with Claude]
           Read config.json once more (57 bytes, same content)

Plugin removes: 2 duplicate reads = 114 bytes (~28 tokens)
Result: Next /resume pays ~28 fewer tokens to reconstruct
```

The plugin uses **deterministic content matching** (comparing file hashes), never making LLM-based decisions. It's safe, reversible, and preserves all context except exact content duplicates.

## What It Deduplicates

The plugin intelligently removes three types of duplicate operations:

### 1. File Reads
Identical file content across multiple Read operations is deduplicated. The latest read is always kept (represents current state).

```
Read 1: config.json → {"debug": false}
[... edits and messages ...]
Read 2: config.json → {"debug": false}  (DUPLICATE - marked)
[... more work ...]
Read 3: config.json → {"debug": true}   (DIFFERENT - kept)
```

### 2. Bash Script Output
Identical bash script execution outputs are deduplicated (python, npm, node, dotnet, ruby, java, go, and bash-wrapped variants).

```
Run 1: npm test → "PASS: 42 tests"
Run 2: npm test → "PASS: 42 tests"      (DUPLICATE - marked)
Run 3: npm test → "FAIL: 1 test"        (DIFFERENT - kept)
```

### 3. Grep Search Results
When grep output appears before a later file read with no edits touching the grep-matched lines, the grep is safely deduplicated.

### Smart Overlap Detection
When you edit a file and then grep it, the plugin checks if the edit actually touched the grep-matched lines. Only exact line overlaps prevent dedup—edits to different lines don't block deduplication.

## When to Use This

**Most beneficial for:**
- Long sessions with heavy file reading and editing
- Frequent `/resume` workflows - each resume costs fewer tokens
- Sessions that go idle >5 minutes - cache validator shows savings and suggests resume
- Development workflows with repeated test/build runs

**Still helps with:**
- Short sessions - any future resume of the session will load a cleaner transcript
- Fresh session workflows - reduced transcript size benefits any eventual resumption

## Installation

**Requirements:** Python 3.X (developed with 3.13)

The plugin automatically registers and runs on session end (cleans transcript) and pre-prompt (validates staleness). No configuration required—works with defaults.

## Configuration

The plugin is configurable via environment variables in `~/.claude/settings.json`. All settings are optional; defaults are balanced for typical workflows.

### Compression Control (Three Variables)

Add to your `~/.claude/settings.json` to customize deduplication aggressiveness:

```json
{
  "env": {
    "SMART_COMPACT_DEDUP_MIN_BYTES": "1",
    "SMART_COMPACT_MULTILINE_CONTEXT_LINES": "1",
    "SMART_COMPACT_SINGLELINE_CONTEXT_CHARS": "10"
  }
}
```

**`SMART_COMPACT_DEDUP_MIN_BYTES`** - Minimum bytes to replace with marker (default: `1`)
- Only creates omission marker if removed content exceeds this threshold
- `1`: Replace all duplicates (maximum compression)
- `100`: Only replace if > 100 bytes
- `1000`: Only replace large blocks
- Use higher values to preserve more inline context, lower for aggressive compression

**`SMART_COMPACT_MULTILINE_CONTEXT_LINES`** - Context lines around changes in multiline files (default: `1`)
- Applied as ±N lines around changed content
- `0`: Only keep changed lines (most aggressive)
- `1`: ±1 line context (balanced, default)
- `3`: ±3 line context (preserves more surrounding code)

**`SMART_COMPACT_SINGLELINE_CONTEXT_CHARS`** - Context characters around changes in single-line files (default: `10`)
- Applied as ±N characters around changed region
- `0`: Only keep changed chars (most aggressive)
- `10`: ±10 char context (balanced, default)
- `20`: ±20 char context (preserves more structure)

**Trade-off Summary:**
- Lower context margins (0) → More bytes saved, less readable context
- Default margins (1/10) → Balanced compression and readability
- Higher margins (3/20) → Minimal markers, more surrounding content visible

**Note on JSONL format:** Files with one JSON object per line are detected as multiline and use line-based comparison, preventing format corruption. If you have compact JSONL with very long lines, increase `SMART_COMPACT_MULTILINE_CONTEXT_LINES` to preserve structure.

### Optional: Cache and Notification Settings

These settings are rarely needed; defaults work for most users:

**`SMART_COMPACT_CACHE_DURATION_MINUTES`** - Cache staleness threshold (default: `5`)
- When transcript exceeds this idle time, pre-prompt hook validates and suggests resume
- Default 5 minutes matches Claude's prompt cache window
- Set to 60 for extended 1-hour cache window

**`SMART_COMPACT_CACHE_VALIDATOR_THRESHOLD_PERCENT`** - Minimum duplicate percentage to block input (default: `0`)
- Only blocks prompt submission if duplicates exceed this percentage of context
- `0`: Block for any duplicates (default)
- `5`: Only block if >5% context is duplicates
- `100`: Disable blocking entirely

**`SMART_COMPACT_CONTEXT_WINDOW_TOKENS`** - Your context window size (default: `200000`)
- Used to calculate duplicate percentage in notifications
- `200000`: Standard context (200k tokens)
- `1000000`: Extended context (1M tokens)

**`SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT`** - Minimum duplicate percentage to show notification (default: `15`)
- Only shows duplicate notification when percentage exceeds this value
- `0`: Always show (helpful during heavy editing)
- `15`: Default (less frequent notifications)
- `50`: Only show if duplicates exceed half your context

## Usage

The plugin works in three modes:

### 1. Automatic (Session End - Hook Mode)

Runs automatically when you exit a session:

```bash
[End session with /exit, Ctrl+C, or exit naturally]
# Plugin cleans transcript before closing
```

Output when duplicates found:
```
Found 5 duplicate reads, 8,432 bytes (2,108 tokens)
```

### 2. Smart Validation (Pre-Prompt - Hook Mode)

Validates transcript freshness before each prompt:

```
[You type after 6+ minutes idle]
# Plugin detects stale cache + duplicates:
Cache stale. Duplicates: 15,422 bytes (~3,855 tokens).
/exit and /resume to clean context and save tokens.
```

Triggers when:
- Transcript is idle >5 minutes (default)
- Deduplication would save significant bytes
- Both conditions met → shows savings estimate

### 3. Duplicate Notification (While Idle - Hook Mode)

Shows notification while awaiting input if duplicates exceed threshold:

```
Duplication in conversation: 150.1K characters (37.5K tokens, 18.76% of context)
```

Helps you decide whether resuming now would be worthwhile.

### Manual (CLI Mode)

For testing or direct transcript analysis:

```bash
# See what would be removed (detailed):
python cleanup_conversation.py <transcript.json> --dry-run

# See summary only:
python cleanup_conversation.py <transcript.json> --dry-run-short
# Output: Savings: 15422 bytes (~3855 tokens)

# Apply deduplication:
python cleanup_conversation.py <transcript.json>

# Debug mode (shows per-operation details):
python cleanup_conversation.py <transcript.json> --debug
```

## How It Works

The plugin uses **forward-chaining deduplication**, processing operations in chronological order and comparing each against the previous state. It keeps the latest version of each unique content and replaces earlier duplicates with clear markers.

**Basic algorithm:**
```
For each file in the transcript:
  1. Track previous_state = content from previous read
  2. For each new read:
     - If content matches previous_state → mark as duplicate
     - If content differs → apply partial dedup (keep changes + context)
     - Always keep the very last read (represents current state)
```

**Content types:**
- **Single-line** (no newlines): Character-based comparison with ±10 char context
- **Multiline** (contains newlines): Line-based comparison with ±1 line context
- Thresholds and margins are configurable via environment variables

**Supported operations:**
- **File Reads**: Via `Read` tool
- **Bash**: `cat`, `head`, `tail`, `wc` commands that read files
- **Grep**: Search operations with smart line-overlap detection for safety

## Known Limitations

**Bash detection** (`cat`, `head`, `tail`, `wc`):
- ✓ Direct commands: `cat file.txt`, `head -n 20 file`
- ✓ Bash wrapper: `bash -c "cat config.json"`
- ✗ Command substitution: `$(cat file)` (future)
- ✗ Complex pipes: Already detected but not fully optimized (partial support)

**Grep operations**:
- ✓ Single file: `grep pattern file.txt`
- ✓ Smart overlap: Safely deduplicates when edits don't touch matched lines
- ✗ Glob patterns: `grep pattern *.py` (requires multi-file support)

**Other edge cases**:
- Context percentage in `/context` may lag briefly after dedup (cache updates on next message)
- Symbolic links and file aliases treated as separate files (future unification)

---

## Technical Deep-Dive

This section explains the plugin internals for those interested in how deduplication works.

### Forward-Chaining Algorithm

The core algorithm processes operations chronologically per file:

```python
for each file:
  previous_state = None
  last_read_index = find_last_read(file)

  for each operation (oldest to newest):
    if is_read(operation):
      if operation_index == last_read_index:
        keep full content (represents current state)
      elif content == previous_state:
        mark for full dedup
      else:
        mark for partial dedup (diff-based)
      previous_state = content
```

**Key property:** The last read is always preserved. This ensures the "current state" of each file is always available, which is critical for resume accuracy.

### Content Type Detection

The plugin automatically detects whether content should be compared line-by-line or character-by-character:

- **Single-line content** (no newlines): `{"debug": true}`
  - Character-by-character diff
  - Context: ±10 characters (default)
  - Efficient for compact formats

- **Multiline content** (contains newlines): Markdown, code, JSONL
  - Line-by-line diff
  - Context: ±1 line (default)
  - Preserves file structure

### Deduplication Markers

When content is omitted, it's replaced with a self-documenting marker:

```
[...Duplicate read omitted - latest version contains complete content...]
```

The marker language helps LLMs understand:
- **"Duplicate read"**: Type of operation removed
- **"omitted"**: Content is gone but intentionally
- **"latest version"**: Which version to reference (unambiguous temporal reference)
- **"contains complete content"**: Nothing is lost, just consolidated

### Smart Edit Overlap Detection

For grep operations, the plugin checks if edits between the grep and a later read touch the lines grep matched:

```
Grep matches line 5
Edit 1 changes line 1   → Safe (doesn't overlap)
Edit 2 changes line 5   → Unsafe (overlaps)

Only skip dedup if edits actually touch grep-matched lines
```

This allows safe deduplication in more cases than the conservative "any edit = skip" approach.

### Context Window Impact

When deduplication happens:
- **On session end**: Transcript is smaller before being persisted
- **On resume**: The `/resume` reconstruction costs fewer tokens (smaller input file)
- **Each resume**: Gets cumulative benefit if more duplicates appear

Example: Session with 250KB duplicates across 5 resumes = ~50KB saved per resume = ~12.5K tokens saved total.

### Differences from `/compact`

| Aspect | `/compact` | Smart Compact |
|--------|-----------|---------------|
| Method | LLM summarization | Deterministic deduplication |
| Safety | Non-deterministic, can lose info | Deterministic, never loses info |
| Speed | Slow (calls Claude) | Fast (local hashing) |
| Use case | Shorten early conversation | Remove exact duplicates |

---

## Why This Matters

**Token efficiency:** When you `/resume`, Claude reconstructs the entire transcript, including all duplicate reads. The reconstruction cost scales with transcript size. Removing exact content duplicates shrinks that cost without losing context.

**Hallucination risk:** Smaller, focused context reduces hallucination risk by removing noise (duplicate content that doesn't add information).

**Cost-effectiveness:** Especially valuable for:
- Long-running sessions with heavy file editing
- Workflows that frequently use `/resume`
- Teams using Claude Code for extended development sessions

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