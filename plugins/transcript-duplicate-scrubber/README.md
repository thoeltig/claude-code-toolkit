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
- Frequently use `/resume` to continue previous sessions
- Work with long sessions that have heavy file reading
- Want to reduce token costs and context bloat

**This won't help if you:**
- Don't use `/resume` (run new sessions each time)
- Have short, one-off sessions

## Installation

**Requirements:** Python 3.X (developed with 3.1.3)

The plugin automatically registers and runs on session resume. No configuration needed.

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

### Manual (CLI Mode)

Preview what would be removed:
```bash
python dedup_transcript.py <transcript_file> --dry-run
```

Apply deduplication:
```bash
python dedup_transcript.py <transcript_file>
```

## How It Works

The plugin detects reads with duplicate content hashes and applies two deduplication rules:

**Rule 1: Write has priority**
If a Write operation has content hash X, all Reads with that same hash are marked redundant (the Write already has the content):
```
Write file.txt → "content X"
[Messages exchanged]
Read file.txt → "content X"  ← Marked as DEDUPLICATION_READ_AFTER_WRITE_MARKER (redundant)
```

**Rule 2: Keep latest read**
If no Write has that hash, keep only the latest Read and mark all earlier reads with the same hash as redundant:
```
Read file.txt → "content X" (first)  ← Marked as DEDUPLICATION_MULTIPLE_READS_MARKER (older)
[Messages exchanged]
Read file.txt → "content X" (latest)  ← Kept (newest tokens, higher priority)
```

**Different content is always kept:**
```
Read file.txt → "content X"
[Edit happens]
Read file.txt → "content Y"  ← Different hash, both kept
```

For each redundant read, the plugin replaces the content with a marker. Two marker types indicate the deduplication reason:
```
<DEDUPLICATION_READ_AFTER_WRITE_MARKER|OMITTED_CHARS_COUNT:2847>
<DEDUPLICATION_MULTIPLE_READS_MARKER|OMITTED_CHARS_COUNT:2847>
```

All intervening messages are preserved—only the duplicate file content is removed.

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

### Token Count Display Not Updated

After deduplication runs, the actual transcript file is smaller and uses fewer tokens for reconstruction. However, the token usage displayed in the conversation (e.g., from `/context` command) may still show the pre-deduplication count.

**Why this happens:**

The displayed token count reflects the message usage tokens reported when the conversation was happening, not a recalculation based on the deduplicated content. These are fixed values captured during the session and not updated retroactively.

**Context window calculation (unclear):**

It's currently unknown whether Claude's context window limit is enforced by:
- Actual tokenization of the current transcript content (in which case deduplication provides real benefit)
- Summing up reported message usage tokens (in which case deduplication reduces file size but doesn't change the reported usage)

**Practical impact:**

- ✅ Your resume will be faster and use fewer tokens (smaller file to reconstruct)
- ⚠️ Token counters in the UI may not reflect this improvement immediately

If you need accurate token savings, compare transcript file sizes before/after deduplication, or check the dry-run report.

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