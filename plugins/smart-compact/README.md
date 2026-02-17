# Transcript Duplicate Scrubber Plugin

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

The plugin uses backward-iterating chain-following deduplication to intelligently remove redundant file reads:

**Backward Iteration with Chain Following:**
Starting from the newest read and working backward, the plugin:
1. Compares each read to the previous operation (earlier read or write)
2. If the previous read has **same content** → marks it for dedup and continues checking from that read
3. If the previous read has **different content** → applies partial dedup with line-level comparison
4. If no previous read but **previous write matches** → marks current read for dedup

This chain-following approach efficiently catches transitive duplicates (Read A = Read B = Read C) in a single pass.

**Line-by-Line Comparison:**
When two reads of the same file differ, the plugin compares them line-by-line to find what changed:
```
Read 1: lines 1-50 identical
        lines 51-60 changed (edited)
        lines 61-100 identical

Read 2: lines 1-50 identical
        lines 51-60 different
        lines 61-100 identical
```

**Context-Aware Deduplication:**
The plugin applies a ±3 line context margin around changes to preserve editing context (matches Claude Code's edit tool):
```
Changed lines:     51-60
Context margin:    ±3 lines
Kept range:        48-63 (includes context)
Replaced:          1-47, 64-100
```

**Marker Replacement:**
Lines outside the context range are replaced with placeholders:
```
lines 1-47:      <DEDUPLICATION_PARTIAL_READ_MARKER|OMITTED_CHARS_COUNT:2847>
lines 48-63:     (original unchanged content kept for context)
lines 64-100:    <DEDUPLICATION_PARTIAL_READ_MARKER|OMITTED_CHARS_COUNT:1529>
```

This preserves the file structure (one placeholder per omitted block) while removing token-wasting redundant content.

**Smart Thresholds:**
- Skips files with fewer than 3 total lines (defer to character-level dedup later)
- Only creates placeholders for omitted blocks ≥ 3 lines
- Small unchanged sections between edits are kept as-is to maintain readability

All intervening messages are preserved—only truly redundant file content is removed.

## Token Estimation

The plugin estimates token savings for each deduplicated file using per-file cache write information:

**How it works:**
- Extracts token/character ratio from each file's first cache write in the transcript
- Uses `cache_creation_input_tokens` from the assistant message following a Read/Write operation
- Applies ratio only to files that actually have duplicates being removed
- Valid ratio range: 0.25 - 5 tokens/character (rejects invalid cache data)

**Example calculation:**
```
README.md: 9,266 chars with ratio 1.56 tokens/char
  → 2 reads × 9,266 chars × 1.56 tokens/char ≈ 28,900 tokens saved
```

Token estimates appear in:
- Cache validator message: `clear 15422 bytes (~14457 tokens)`
- CLI reports: `Total bytes omitted: 15422 (~14457 tokens)`
- Dry-run output: Full details per file

If token ratio cannot be reliably extracted, the plugin shows bytes only.

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

## Known Limitations

### Top-Level Context Percentage Lags (But Token Savings Are Visible)

Token savings **are immediately visible**, but appear in different places within `/context`:

**✅ Already Updated (Real Savings Shown):**
- Messages section: Drops from higher to lower count (e.g., 47.9k → 17.3k)
- Free space: Increases (e.g., 128k → 158k)

**⚠️ Lags Behind:**
- Top-level percentage: Still shows pre-deduplication value (e.g., stays at 35%) until cache invalidates

**Why this split happens:**

The top-level percentage is calculated from `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` which contains the cached token values from the current prompt cache. Since deduplication modified the persisted transcript and not the prompt cache these cached values don't update immediately. The messages and free space sections recalculate differently and reflect the actual smaller transcript right away.

When the prompt cache invalidates (by default after 5 minutes), it tokenizes the deduplicated transcript and the top-level percentage updates to match.

**Practical benefit when approaching context limits:**

The real token savings are **already usable** via the messages and free space readings. If you're near capacity:
- Messages section shows actual savings (real context available)
- Free space shows accurate headroom
- You can confidently stay under limits based on these numbers

If you want the top-level percentage updated immediately, exit and wait for cache invalidation, then resume—the deduplicated transcript reloads fresh.

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