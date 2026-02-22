# Smart Compact Plugin

Remove duplicate file reads from Claude Code transcripts to reduce token waste and lower hallucination risk when resuming sessions.

## What It Does

During development, you naturally read the same file multiple times:
- Read file to understand it
- Edit it
- Read again to verify (duplicate - replace)
- User and Model exchange messages
- Read again as new starting point (duplicate - keep)
- Edit again
- Read again to confirm

Each read gets stored in the session transcript. When you use `/resume`, Claude Code reconstructs the entire conversation from the transcript. Duplicate reads waste tokens that don't add new information—they just repeat what Claude already saw.

This plugin removes those duplicates by keeping only the latest read (or the Write if one exists with the same content). The result is a smaller transcript that costs less to reconstruct on resume, preserving the most recent and highest-priority context.

## When to Use This

**This helps if you:**
- Work with long sessions that have heavy file reading and editing
- Want to reduce token costs and reduce hallucination risk from context bloat
- Use `/resume` frequently - cleaned transcript cuts reconstruction costs per resume
- Go idle >5 minutes during work - cache validator hook blocks input and shows token savings, encouraging optimal resume workflow

**Even helps if you:**
- Don't manually use `/resume` - deduplication benefits eventual resumes (immediate or weeks later) with lower reconstruction costs
- Prefer starting fresh sessions - any future resume of that session will have a smaller, cleaner transcript

**Won't help much if you:**
- Have very short, one-off sessions - minimal duplicate reads occur

## Installation

**Requirements:** Python 3.X (developed with 3.1.3)

The plugin automatically registers and runs on session end and pre-prompt. No configuration needed.

## Configuration

### Deduplication Thresholds & Context Margins

Three environment variables control compression aggressiveness:

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "SMART_COMPACT_DEDUP_MIN_BYTES": "100",
    "SMART_COMPACT_MULTILINE_CONTEXT_LINES": "1",
    "SMART_COMPACT_SINGLELINE_CONTEXT_CHARS": "10"
  }
}
```

**Dedup Size Threshold** (`SMART_COMPACT_DEDUP_MIN_BYTES`):
- Only replaces omitted content if larger than this threshold
- Default: 1 byte (replace almost everything)
- Examples:
  - `1`: Maximum compression (replace all)
  - `100`: Only replace if > 100 bytes
  - `1000`: Only replace large blocks

**Multiline Context** (`SMART_COMPACT_MULTILINE_CONTEXT_LINES`):
- Lines to keep around changed lines in markdown/code files
- Default: 1 line (±1 around changes)
- Examples:
  - `0`: No context, only keep changed lines (aggressive)
  - `1`: ±1 line context (default, balanced)
  - `3`: ±3 line context (more context preserved)

**Single-Line Context** (`SMART_COMPACT_SINGLELINE_CONTEXT_CHARS`):
- Characters to keep around changed region in JSON/compact formats
- Default: 10 characters (±10 around changes)
- Examples:
  - `0`: No context, only keep changed chars (aggressive)
  - `10`: ±10 char context (default, balanced)
  - `20`: ±20 char context (more context preserved)

**Compression Trade-offs:**
- Margins=0 → Maximum bytes saved (aggressive)
- Margins=1/10 → Balanced (default, good readability)
- Margins=3/20 → Minimal markers, more context kept

**Edge Case - JSONL Format:**
JSONL files (JSON Lines: one JSON object per line) are detected as multiline and use line-based comparison. This is appropriate because:
- Each line is independent JSON
- Line-based dedup prevents breaking the format
- Character-based dedup could split lines incorrectly

If you have very compact JSONL with long lines, consider increasing `SMART_COMPACT_MULTILINE_CONTEXT_LINES` to preserve context around changes.

### Cache Duration Threshold

The cache validator uses **5 minutes** as the default staleness threshold, matching Claude's default prompt cache window. If you have Claude configured with the optional 1-hour cache window, you can override this:

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "SMART_COMPACT_CACHE_DURATION_MINUTES": "60"
  }
}
```

This example sets the threshold to 60 minutes for the extended cache window. The value must be a positive integer. If not set or invalid, it defaults to 5 minutes.

### Cache Validator Block Threshold

By default, the cache validator blocks your input whenever the transcript is stale and duplicates exist. If you only want to block when duplicates are significant, set a minimum percentage:

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "SMART_COMPACT_CACHE_VALIDATOR_THRESHOLD_PERCENT": "5"
  }
}
```

This example only blocks if duplicates exceed 5% of your context window. Valid values: 0-100 percent (default 0%, which blocks for any duplicates). Set to 100 to disable blocking entirely.

### Context Window Size (Duplicate Notification)

The duplicate tokens notification uses your context window size (in tokens) to calculate what percentage of your context contains duplicates. By default it uses **200k tokens** (Claude's standard context). If you have the extended **1 million tokens context**, configure it:

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "SMART_COMPACT_CONTEXT_WINDOW_TOKENS": "1000000"
  }
}
```

Valid values: 200000 (default, 200k tokens) or 1000000 (1M tokens). Any other value falls back to default.

### Notification Threshold

By default, you only receive duplicate notifications when duplicates exceed **15% of your context window**. You can customize this threshold:

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT": "10"
  }
}
```

This example notifies at 10% instead of 15%. Valid values: 0-100 percent. If tokens cannot be calculated, notifications are always sent regardless of threshold.

## Usage

### Automatic (Hook Mode)

The plugin runs automatically when you end a session:

```bash
[End session with /exit, Ctrl+C, or naturally]
# Plugin cleans transcript as session closes
```

Output when duplicates are found:
```
Deduplicated 12 file reads with same content from conversation which cleared up 45230 wasted characters.
```

The cleaned transcript benefits all future resumes of that session.

### Cache Validator (Pre-Prompt Hook)

The plugin also validates transcript freshness before you submit each prompt:

```
[You type a prompt after 6+ minutes of idle time]
# Plugin detects stale cache and blocks submission:
Cache invalidated and conversation contains duplicate file reads.
Exit and resume session to clear 15422 bytes (~14457 tokens) from context.
```

**What triggers validation:**
- Transcript is stale (> 5 minutes since last Claude message)
- Deduplication would save bytes
- Both conditions met → prompt blocked with savings estimate

**Token estimates shown:**
- Calculated per-file using cache write token ratios
- Format: `XXX bytes (~YYY tokens)`
- Helps you understand the benefit of resuming

This prevents wasted conversation on stale transcripts and encourages resume-based workflows for cost efficiency.

### Duplicate Tokens Notification

The plugin sends a notification when you're idle and awaiting input (Stop hook), if duplicates exceed your threshold:

```
Duplication in conversation: 150.1K characters (37.5K tokens, 18.76% of context window)
```

**What the notification shows (when tokens are available):**
- Characters of duplicate content (formatted as K/M)
- Estimated tokens using standard conversion (~4 bytes ≈ 1 token)
- Percentage of your total context window

**Simplified message (when tokens cannot be calculated):**
```
Duplication in conversation: 150.1K characters
```

**Threshold behavior:**
- Only notifies if duplicates exceed threshold (default 15%)
- If tokens cannot be calculated, always notifies (no threshold check)
- Customize threshold via `SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT` in settings

**Token estimation:**
- Uses standard conversion: ~4 bytes ≈ 1 token (for English text)
- This is an estimate; actual token count varies by content

This helps you quickly decide if it's worth resuming the session to clean up duplicates before they waste more context.

### Manual (CLI Mode)

Preview what would be removed (detailed report):
```bash
python cleanup_conversation.py <transcript_file> --dry-run
```

Output includes per-file deduplication details with byte and token savings.

Quick savings summary only:
```bash
python cleanup_conversation.py <transcript_file> --dry-run-short
```

Output: `Savings: 15422 bytes (~14457 tokens)`

Apply deduplication:
```bash
python cleanup_conversation.py <transcript_file>
```

## How It Works

The plugin uses **forward-chaining deduplication** to intelligently remove redundant file operations (reads, bash, grep). This is a complete rewrite from v1.x for cleaner logic and better convergence.

**Unified Forward-Chaining Algorithm (v2.1.0.0+):**
Processing all operations in order (oldest to newest) per file, the plugin:
1. Tracks `previous_state` = content from the previous read
2. For each read:
   - If identical to `previous_state` → mark for full dedup
   - If different and NOT the last read → apply partial dedup (line/char comparison)
   - If it's the last read → always keep full content (represents current state)
   - Update `previous_state` to current read's content
3. This chains changes naturally: Read1→(edit)→Read2→(edit)→Read3
4. Each dedup pass further compresses already-compressed files

**Key Advantage:** Last read in each file always keeps full content, so the "current state" is always preserved. On resumed sessions, the second dedup run further compresses.

**Dual-Mode Content Parsing:**
The plugin automatically detects content type based on newlines:

*Single-Line Content* (no newlines):
- True single-line format: `{"key":"value"}`
- Compares character-by-character
- Finds start/end of changed region
- Applies ±10 character context margins (configurable)
- Only replaces if omitted region > threshold

*Multiline Content* (contains newlines):
- Normal readable files: markdown, code, text
- Compact multi-line: JSON with newlines, JSONL format
- Compares line-by-line
- Finds changed line ranges
- Applies ±1 line context margins (configurable)
- Only replaces if omitted block > threshold

Examples:

**Single-line JSON:**
```
Original: {"debug":false,...settings...}
Changed:  {"debug":true,...settings...}
          → Char-based: keep changed region + ±10 chars
```

**Multi-line JSON (with newlines):**
```
Original:
{
  "debug": false,
  "logLevel": "info"
}

Changed:
{
  "debug": true,
  "logLevel": "debug"
}
          → Line-based: keep changed lines + ±1 line context
```

**Context-Aware Deduplication:**
The plugin applies context margins around changes to preserve editing context:

*Multiline:* ±3 line margin (matches Claude Code's edit tool)
```
Changed lines:     51-60
Context margin:    ±3 lines
Kept range:        48-63 (includes context)
Replaced:          1-47, 64-100
```

*Single-line:* ±20 character margin
```
Changed chars:     120-135
Context margin:    ±20 chars
Kept range:        100-155 (includes context)
Replaced:          0-99, 156+
```

**Bash Command Deduplication (v2.1.1.0+):**
The plugin detects and deduplicates bash commands that read files (cat, head, tail, wc):

*Bash-to-Bash Chaining:*
```
Bash 1: bash -c "cat config.json"  → {"debug":false}
Bash 2: bash -c "cat config.json"  → {"debug":false}  (identical)
        → Bash 2 marked for FULL DEDUP

Bash 3: bash -c "cat config.json"  → {"debug":true}   (different)
        → Bash 3 marked for PARTIAL DEDUP (char-level diff)
        → Result: [prefix...changed..."debug":true...[...unchanged...]]
```

*Bash-Read Integration:*
```
Read:  reads config.json      → {"debug":false}
Bash:  bash -c "cat ..."      → {"debug":false}  (identical)
       → Bash marked for FULL DEDUP (same as read)

Read2: reads config.json      → {"debug":false}  (identical to bash)
       → Read2 marked for FULL DEDUP (same as bash)
```

**Grep Deduplication (v2.1.1.0+):**
The plugin detects grep operations and deduplicates with smart line-overlap checking:

*Grep-to-Read Pattern:*
```
Grep:  grep "pattern" config.json  → [matched lines from line X]
Read:  reads config.json            → [full file content]

If Read comes after Grep and no edits touched grep lines:
       → Grep marked for FULL DEDUP (safe!)
```

*Smart Edit Overlap Detection:*
```
Grep:  grep "timeout" file.json   (found on line 2)
Edit1: changes line 1              (doesn't overlap with line 2)
Read:  reads file.json

Edit doesn't touch grep lines:
       → Grep marked for FULL DEDUP (safe - line 2 unchanged)

---

Grep:  grep "timeout" file.json   (found on line 2)
Edit2: changes line 2              (overlaps with grep!)
Read:  reads file.json

Edit touches grep lines:
       → Grep NOT deduplicated (line 2 may have changed)
       → Smart overlap prevents data loss
```

**Write → Read Edge Case:**
When a file is created (Write) and immediately read (Read), the plugin compares the write's raw content against the read's raw content from toolUseResult. If they match, the redundant read is deduplicated:
```
Write: Creates file with content X
Read:  Immediately reads file → gets X (formatted in transcript)
Result: Read is marked for dedup (same content as Write)
```

**Marker Replacement:**
Lines outside the context range are replaced with clear, self-documenting markers:

For partial deduplication (read before and after edit):
```
lines 1-47:      [...Partial duplicate read omitted - latest version contains complete content...]
lines 48-63:     (original unchanged content kept for context)
lines 64-100:    [...Partial duplicate read omitted - latest version contains complete content...]
```

For full deduplication, markers indicate which version is preserved:
- Multiple reads: `[...Duplicate read omitted - latest version contains complete content...]`
- Read after write: `[...Duplicate read omitted - earlier version contains complete content...]`

This preserves the file structure (one placeholder per omitted block) while removing token-wasting redundant content.

**Why These Markers Work for AI Reasoning:**
The markers use self-documenting language that helps LLMs (like Claude) understand deduplication without requiring domain knowledge:
- **"contains complete content"** signals that the indicated version has everything needed - nothing is lost, just consolidated
- **"latest version"** vs **"earlier version"** uses temporal language that's unambiguous regardless of message processing direction
- **Consistent pattern** trains intuitive understanding: each marker type clearly states which version is authoritative
- This works because deduplication aligns with trained behavior: LLMs naturally prioritize newer content in context, so markers encouraging reference to "latest/earlier" versions fits natural reasoning patterns
- The markers convey intent (deduplication for tokens/hallucination reduction) without metadata overhead

**Smart Thresholds:**
- Skips files with fewer than 3 total lines (defer to character-level dedup later)
- Only creates placeholders for omitted blocks ≥ 3 lines
- Small unchanged sections between edits are kept as-is to maintain readability

All intervening messages are preserved—only truly redundant file content is removed.

## Token Estimation

The plugin estimates token savings for each deduplicated file using per-file cache write information:

**How it works:**
- Extracts character from each file read in the transcript
- Estimated tokens using standard conversion (~4 bytes ≈ 1 token)

**Example calculation:**
```
README.md: 9,266 chars with ratio 4 char/token
  → 2 reads × 9,266 chars / 4 ≈ 4,633 tokens saved
```

Token estimates appear in:
- Cache validator message: `clear 15422 bytes (~3,855 tokens)`
- CLI reports: `Total bytes omitted: 15422 (~3,855 tokens)`
- Dry-run output: Full details per file

## Example Workflow

```
Session 1: Multiple edits with repeated file reads
           [Plugin cleans duplicates on exit]
                ↓
Session 2: /resume → Load cleaned transcript
           → Smaller file = fewer tokens to reconstruct
           → Lower cost, lower hallucination risk
```

---

## Bash/Grep Deduplication Details (v2.1.1.0+)

### Supported Bash Commands (Extended)

The plugin detects file-reading bash commands via pattern matching:

**cat - read entire file:**
```bash
cat /path/to/file
cat file.json
bash -c "cat config.json"
```

**head - read first N lines:**
```bash
head file.txt                  # First 10 lines (default)
head -n 20 file.txt            # First 20 lines
head -20 file.txt              # Also supports -20 syntax
bash -c "head -n 5 data.csv"   # In bash -c
```

**tail - read last N lines:**
```bash
tail file.txt                  # Last 10 lines (default)
tail -n 20 file.txt            # Last 20 lines
tail -f log.txt                # Follow mode (still detects read)
bash -c "tail -f debug.log"    # In bash -c
```

**wc - word/line count (also reads file):**
```bash
wc file.txt                    # Count lines, words, bytes
wc -l file.txt                 # Count lines only
wc -w file.txt                 # Count words only
bash -c "wc -c data.txt"       # Byte count in bash
```

**All patterns support:**
- Pipes: `cat file.txt | grep pattern` (detects file.txt read)
- Redirects: `cat file.txt > output.txt` (detects file.txt read)
- Quoted paths: `bash -c "cat 'file with spaces.txt'"`

Each command is parsed to extract the filepath, then the output is compared against subsequent reads like any other read operation.

### Grep Pattern Matching

The plugin extracts grep operations with pattern and filepath:

```bash
grep "pattern" config.json         # Exact file (MVP)
grep "ERROR" logs.txt              # Any text file
```

**Current limitation**: Glob patterns like `grep pattern *.py` are skipped (requires multi-file line matching, deferred to v2.2.0).

### Edit Safety

To prevent incorrect deduplication, the plugin checks for edits between grep and read:

```
SAFE:   Grep → (no edit) → Read    ✓ Can deduplicate
UNSAFE: Grep → (has edit) → Read   ✗ Skip (file changed)
```

This conservative approach ensures no data loss. Future versions will parse grep line numbers and edit ranges for smarter overlap detection.

### Partial Dedup for Bash/Grep

When bash or grep output differs from the previous operation, the plugin applies line/char-level comparison:

*Multiline output (has newlines):*
- Line-by-line diff detection
- Replaced with markers + context (default ±1 line)
- Configurable via `SMART_COMPACT_MULTILINE_CONTEXT_LINES`

*Single-line output (no newlines):*
- Character-level diff detection
- Replaced with markers + context (default ±10 chars)
- Configurable via `SMART_COMPACT_SINGLELINE_CONTEXT_CHARS`

---

## Known Limitations

### Bash/Grep (v2.1.1.0 Current)

**Bash Command Detection**:
- ✓ Supports: `cat`, `head`, `tail`, `wc` with flags
- ✓ Works with pipes: `cat file | grep pattern`
- ✓ Works with redirects: `cat file > output`
- ✗ Command substitution: `$(cat file)` (deferred to v2.3.0)
- ✗ Complex shell syntax (deferred to v2.3.0)

**Grep Operations**:
- ✓ Single file: `grep pattern file.txt` with line number extraction
- ✓ Smart overlap: Only skip dedup if edits touch grep-found lines
- ✗ Glob patterns: `grep pattern *.py` (deferred to v2.2.0)
- ✗ Requires multi-file line matching (deferred feature)

**Future Enhancements** (v2.3.0+):
- Bash script output dedup: `bash -c "python script.py"` with identical output
- Piped command chains: Detect intermediate outputs
- Complex command patterns: More shell syntax support

### Top-Level Context Percentage Lags (But Token Savings Are Visible)

When called directly after resume token savings **are immediately visible**, but appear in different places within `/context`:

**✅ Already Updated (Real Savings Shown):**
- Messages section: Drops from higher to lower count (e.g., 47.9k → 17.3k)
- Free space: Increases (e.g., 128k → 158k)

**⚠️ Lags Behind:**
- Top-level percentage: Still shows pre-deduplication value (e.g., stays at 35%) until cache invalidates
- Percentage will update after first user message when the cache is created again

**Why this split happens:**

The top-level percentage is calculated from `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` which contains the cached token values from the current prompt cache. Since deduplication modified the persisted transcript and not the prompt cache these cached values don't update immediately. The messages and free space sections recalculate differently and reflect the actual smaller transcript right away.

---

## Technical Explanation

**Why duplicate reads matter:**

Claude prioritizes newer tokens over older ones during reasoning. This means older context gets deprioritized. During a session, you naturally re-read files to keep them "fresh" at the top of context:
- Read file to understand logic
- Exchange messages, discuss changes
- Read file again (pushes it to newer tokens, higher priority)
- Exchange more messages
- Read file again (refreshes context, pushes it further up)

This is intentional and helps during active work. But when you `/resume`, Claude reconstructs the entire conversation from the transcript, which costs tokens (~600k+ per large session) to rebuild all that history. The duplicate reads—same file, same content hash—don't add information value to the reconstruction. They just repeat what's already there.

The plugin removes those redundant reads while keeping intervening messages intact. This shrinks the transcript that needs reconstruction on resume, lowering the overhead cost.

**How it differs from `/compact`:**

`/compact` uses an LLM to summarize early conversation and remove detail. It's non-deterministic and can lose information. This plugin uses deterministic hash-based deduplication—it only removes exact duplicates of file content, never loses information, and never makes LLM-based decisions.

**When deduplication activates:**

The plugin runs on session end (SessionEnd hook), not on resume. This is because:
- **SessionStart (resume)** runs after the transcript is already loaded - deduplication would only help future resumes
- **SessionEnd** runs as the session closes, modifying the persisted transcript before it's finalized
- The next time you resume that session, it loads the cleaned transcript directly
- Benefit accumulates: Each resume pays less reconstruction cost due to smaller base file

**Example cost benefit:**

If a session's transcript is 5MB with 200KB of duplicates:
- Current `/resume`: Reconstructs full 5MB
- After dedup: Reconstructs 4.8MB (~4% savings per resume)
- Over 5 resumes: Saves ~250K reconstruction tokens total

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