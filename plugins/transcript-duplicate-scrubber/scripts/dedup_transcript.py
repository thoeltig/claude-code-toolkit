#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transcript deduplication script.

Removes duplicate Read tool results from Claude Code JSONL transcripts.
Detects and marks redundant Reads that:
- Match a previous Write operation (same file, same content)
- Match a previous Read operation (same file, same content)

Usage:
    python dedup_transcript.py <transcript.json> [--dry-run]
"""

import json
import hashlib
import sys
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

@dataclass
class WriteOp:
    uuid: str
    filepath: str
    content: str
    content_hash: str
    message_position: int

@dataclass
class ReadOp:
    tool_use_id: str
    filepath: str
    content: str
    content_hash: str
    message_position: int

def hash_content(content: str) -> str:
    """Generate SHA256 hash of content"""
    return hashlib.sha256(content.encode()).hexdigest()

def extract_token_ratio_for_file(messages: list[dict], filepath: str) -> float | None:
    """Extract token/character ratio for a specific file using rolling search.

    Finds cache_creation_input_tokens from the assistant message following a Read/Write
    of the given filepath. Calculates ratio until finding a valid one (0 < ratio < 5).

    Args:
        messages: List of transcript messages
        filepath: File path to find ratio for

    Returns:
        Token ratio (tokens per character) if valid, otherwise None
    """
    candidates = []

    # Find Write operations for this filepath
    for i, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Write':
                if item.get('input', {}).get('file_path') == filepath:
                    file_content = item.get('input', {}).get('content')
                    if file_content:
                        # Look for cache tokens in following assistant message
                        for j in range(i + 1, len(messages)):
                            next_msg = messages[j]
                            if next_msg.get('type') == 'assistant':
                                usage = next_msg.get('message', {}).get('usage', {})
                                cache_tokens = usage.get('cache_creation_input_tokens')
                                if cache_tokens:
                                    candidates.append((cache_tokens, len(file_content)))
                                break

    # Find Read operations for this filepath
    for i, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        message_content = msg_obj.get('content', [])

        if not isinstance(message_content, list):
            continue

        # Get toolUseResult metadata to match filepath
        tool_use_result = msg.get('toolUseResult', {})
        if isinstance(tool_use_result, dict):
            result_filepath = tool_use_result.get('file', {}).get('filePath')
            result_content = tool_use_result.get('file', {}).get('content')
        else:
            result_filepath = None
            result_content = None

        if result_filepath == filepath and result_content:
            # Look for cache tokens in following assistant message
            for j in range(i + 1, len(messages)):
                next_msg = messages[j]
                if next_msg.get('type') == 'assistant':
                    usage = next_msg.get('message', {}).get('usage', {})
                    cache_tokens = usage.get('cache_creation_input_tokens')
                    if cache_tokens:
                        candidates.append((cache_tokens, len(result_content)))
                    break

    # Rolling search through candidates
    for cache_tokens, char_count in candidates:
        if char_count > 0:
            ratio = cache_tokens / char_count
            if 0.25 < ratio < 5:
                return ratio

    return None

def load_transcript(filepath: str, dry_run: bool = False) -> list[dict]:
    """Load transcript file (handles minified JSONL and pretty-printed JSON).

    Args:
        filepath: Path to transcript file
        dry_run: If True, log JSON parsing errors to stderr

    Returns:
        List of message dictionaries
    """
    messages = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try as single JSON array first
    if content.strip().startswith('['):
        try:
            messages = json.loads(content)
            return messages
        except json.JSONDecodeError as e:
            if dry_run:
                print(f"Warning: Failed to parse transcript as JSON array: {e}", file=sys.stderr)

    # Parse as newline-delimited JSON objects (may be pretty-printed)
    lines = content.split('\n')
    current_obj = []
    brace_count = 0

    for line in lines:
        current_obj.append(line)
        brace_count += line.count('{') - line.count('}')

        # When braces are balanced and non-zero, we have a complete object
        if brace_count == 0 and current_obj and any('{' in l for l in current_obj):
            obj_str = '\n'.join(current_obj).strip()
            if obj_str:
                try:
                    messages.append(json.loads(obj_str))
                    current_obj = []
                except json.JSONDecodeError as e:
                    if dry_run:
                        print(f"Warning: Skipping malformed JSON object: {e}", file=sys.stderr)

    return messages

def extract_writes(messages: list[dict]) -> dict[str, list[WriteOp]]:
    """Extract Write operations indexed by file path"""
    writes_by_path = {}

    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Write':
                filepath = item.get('input', {}).get('file_path')
                file_content = item.get('input', {}).get('content')

                if filepath and file_content is not None:
                    content_hash = hash_content(file_content)
                    write_op = WriteOp(
                        uuid=item.get('id'),
                        filepath=filepath,
                        content=file_content,
                        content_hash=content_hash,
                        message_position=position
                    )

                    writes_by_path.setdefault(filepath, []).append(write_op)

    return writes_by_path

def extract_reads(messages: list[dict]) -> dict[str, list[ReadOp]]:
    """Extract Read operations indexed by file path"""
    reads_by_path = {}
    read_map = {}  # tool_use_id -> (filepath, position)

    # First pass: map Read tool_use to filepaths
    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Read':
                tool_use_id = item.get('id')
                filepath = item.get('input', {}).get('file_path')
                if tool_use_id and filepath:
                    read_map[tool_use_id] = (filepath, position)

    # Second pass: extract Read results from user messages
    for position, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'user':
            continue

        message_content = msg_obj.get('content', [])
        if not isinstance(message_content, list):
            continue

        # Get toolUseResult metadata
        tool_use_result = msg.get('toolUseResult', {})
        if isinstance(tool_use_result, dict):
            result_filepath = tool_use_result.get('file', {}).get('filePath')
            result_content = tool_use_result.get('file', {}).get('content')
        else:
            result_filepath = None
            result_content = None

        for item in message_content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')

                if tool_use_id in read_map:
                    filepath, tooluse_position = read_map[tool_use_id]

                    # Use toolUseResult.content if available (raw file content)
                    # Otherwise use the formatted content from message
                    if result_content and result_filepath == filepath:
                        content = result_content
                    else:
                        # Fallback: extract from formatted content (with line numbers)
                        # This is less reliable but works as fallback
                        formatted_content = item.get('content', '')
                        content = formatted_content

                    if content:
                        content_hash = hash_content(content)
                        read_op = ReadOp(
                            tool_use_id=tool_use_id,
                            filepath=filepath,
                            content=content,
                            content_hash=content_hash,
                            message_position=position
                        )

                        reads_by_path.setdefault(filepath, []).append(read_op)

    return reads_by_path

def find_line_differences(content1: str, content2: str) -> list[tuple[int, int]]:
    """Find line ranges where content1 and content2 differ.

    Args:
        content1: First content (Read1)
        content2: Second content (Read2)

    Returns:
        List of (start_line, end_line) tuples (0-indexed, exclusive end) for continuous blocks where lines differ
    """
    lines1 = content1.split('\n')
    lines2 = content2.split('\n')

    max_lines = max(len(lines1), len(lines2))
    differences = []
    in_diff_block = False
    diff_start = 0

    for i in range(max_lines):
        line1 = lines1[i] if i < len(lines1) else None
        line2 = lines2[i] if i < len(lines2) else None

        if line1 != line2:
            if not in_diff_block:
                diff_start = i
                in_diff_block = True
        else:
            if in_diff_block:
                differences.append((diff_start, i))
                in_diff_block = False

    # Close any open diff block
    if in_diff_block:
        differences.append((diff_start, max_lines))

    return differences

def apply_context_margin(diff_ranges: list[tuple[int, int]], total_lines: int, margin: int = 3) -> list[tuple[int, int]]:
    """Apply context margin around difference ranges and return ranges to keep.

    Args:
        diff_ranges: List of (start, end) tuples for lines that differ
        total_lines: Total number of lines in content
        margin: Number of lines to include as context on each side

    Returns:
        List of (start, end) tuples for ranges to KEEP (merged and bounded)
    """
    if not diff_ranges:
        return []

    # Expand each range with margin
    expanded = []
    for start, end in diff_ranges:
        expanded_start = max(0, start - margin)
        expanded_end = min(total_lines, end + margin)
        expanded.append((expanded_start, expanded_end))

    # Merge overlapping ranges
    expanded.sort()
    merged = [expanded[0]]

    for current_start, current_end in expanded[1:]:
        last_start, last_end = merged[-1]
        if current_start <= last_end:
            # Overlapping, merge
            merged[-1] = (last_start, max(last_end, current_end))
        else:
            # Non-overlapping, add new range
            merged.append((current_start, current_end))

    return merged

def create_partial_dedup_content(content: str, kept_ranges: list[tuple[int, int]]) -> tuple[str, int]:
    """Replace lines outside kept_ranges with placeholders. Only create placeholders for omitted blocks >= 3 lines.

    Args:
        content: Original content
        kept_ranges: List of (start, end) tuples (0-indexed, exclusive end) to keep

    Returns:
        Tuple of (modified_content, bytes_omitted)
    """
    lines = content.split('\n')
    result_lines = []
    total_bytes_omitted = 0
    current_pos = 0

    for keep_start, keep_end in kept_ranges:
        # Add placeholder for lines between current_pos and keep_start if >= 3 lines
        if keep_start - current_pos >= 3:
            omitted_lines = lines[current_pos:keep_start]
            block_bytes = sum(len(line.encode('utf-8')) + 1 for line in omitted_lines)  # +1 for newline
            total_bytes_omitted += block_bytes
            placeholder = f"<DEDUPLICATION_PARTIAL_READ_MARKER|OMITTED_CHARS_COUNT:{block_bytes}>"
            result_lines.append(placeholder)
        elif keep_start > current_pos:
            # Less than 3 lines, keep as-is
            result_lines.extend(lines[current_pos:keep_start])

        # Add kept lines
        result_lines.extend(lines[keep_start:keep_end])
        current_pos = keep_end

    # Handle remaining lines at the end
    if current_pos < len(lines):
        remaining = lines[current_pos:]
        if len(remaining) >= 3:
            block_bytes = sum(len(line.encode('utf-8')) + 1 for line in remaining)
            total_bytes_omitted += block_bytes
            placeholder = f"<DEDUPLICATION_PARTIAL_READ_MARKER|OMITTED_CHARS_COUNT:{block_bytes}>"
            result_lines.append(placeholder)
        else:
            result_lines.extend(remaining)

    modified_content = '\n'.join(result_lines)

    return modified_content, total_bytes_omitted

def find_duplicates(
    writes_by_path: dict[str, list[WriteOp]],
    reads_by_path: dict[str, list[ReadOp]]
) -> list[tuple[ReadOp, Optional[WriteOp], Optional[ReadOp], Optional[tuple]]]:
    """
    Find duplicate reads by backward iteration: for each read, check what comes BEFORE.

    - Previous Read with SAME content → Mark previous for full dedup
    - Previous Read with DIFFERENT content → Mark previous for partial dedup
    - Previous Write with SAME content → Mark current read for full dedup

    Returns:
        List of (read_op, write_op, prev_read_op, partial_dedup_data)
    """
    duplicates = []

    for filepath, reads in reads_by_path.items():
        # Skip files with < 3 lines
        if all(len(read.content.split('\n')) < 3 for read in reads):
            continue

        writes = writes_by_path.get(filepath, [])

        # Iterate backwards by message position (newest to oldest)
        sorted_reads = sorted(reads, key=lambda r: r.message_position, reverse=True)

        # Track which reads have been processed to avoid revisiting
        processed_reads = set()

        for read in sorted_reads:
            if read.tool_use_id in processed_reads:
                continue

            processed_reads.add(read.tool_use_id)

            # Follow the chain backward: if we find a duplicate, continue from that read
            current = read

            while True:
                # Find what comes BEFORE current read (previous operations by position)
                prev_reads = [r for r in reads if r.message_position < current.message_position]
                prev_writes = [w for w in writes if w.message_position < current.message_position]

                # Prioritize read comparison over write comparison
                if prev_reads:
                    # Get the nearest previous read
                    prev_read = max(prev_reads, key=lambda r: r.message_position)

                    if current.content_hash == prev_read.content_hash:
                        # Same content: previous read is fully redundant
                        duplicates.append((prev_read, None, None, None))
                        processed_reads.add(prev_read.tool_use_id)
                        # Continue checking from prev_read
                        current = prev_read
                    else:
                        # Different content: previous read is partially redundant
                        if len(prev_read.content.split('\n')) >= 3:
                            diff_ranges = find_line_differences(prev_read.content, current.content)

                            if diff_ranges:  # Has differences
                                total_lines = len(prev_read.content.split('\n'))
                                kept_ranges = apply_context_margin(diff_ranges, total_lines, margin=3)

                                # Check if we would omit any lines >= 3
                                would_omit = False
                                for k, (keep_start, keep_end) in enumerate(kept_ranges):
                                    if k > 0:
                                        prev_end = kept_ranges[k-1][1]
                                        if keep_start - prev_end >= 3:
                                            would_omit = True
                                            break
                                    if k == 0 and keep_start >= 3:
                                        would_omit = True
                                        break
                                if not would_omit and total_lines - kept_ranges[-1][1] >= 3:
                                    would_omit = True

                                if would_omit:
                                    modified_content, bytes_omitted = create_partial_dedup_content(prev_read.content, kept_ranges)
                                    duplicates.append((prev_read, None, None, (modified_content, bytes_omitted)))
                        # Stop on content difference
                        break

                elif prev_writes:
                    # Only check write if there's no previous read
                    prev_write = max(prev_writes, key=lambda w: w.message_position)

                    if current.content_hash == prev_write.content_hash:
                        # Current read matches previous write: current read is redundant
                        duplicates.append((current, prev_write, None, None))
                    # Stop on write comparison
                    break
                else:
                    # No previous operations
                    break

    return duplicates

def apply_deduplication(
    messages: list[dict],
    duplicates: list[tuple[ReadOp, Optional[WriteOp], Optional[ReadOp], Optional[tuple]]]
) -> tuple[list[dict], int]:
    """
    Apply deduplication by replacing Read tool_result content with modified content or markers.
    Handles partial deduplication (line-level) and full deduplication.

    Returns modified messages and total bytes omitted
    """
    total_bytes = 0
    # Build lookup map: tool_use_id -> (read_op, write_op, prev_read_op, partial_dedup_data)
    dedup_lookup = {read.tool_use_id: (read, write, prev_read, partial_data)
                   for read, write, prev_read, partial_data in duplicates}

    for msg in messages:
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        message_content = msg_obj.get('content', [])

        if not isinstance(message_content, list):
            continue

        for item in message_content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')

                if tool_use_id in dedup_lookup:
                    read_op, write_op, prev_read_op, partial_data = dedup_lookup[tool_use_id]
                    original_content = item.get('content', '')
                    bytes_count = len(original_content.encode('utf-8'))

                    # Apply partial deduplication if applicable
                    if partial_data:
                        modified_content, bytes_omitted = partial_data
                        item['content'] = modified_content
                        total_bytes += bytes_omitted
                    else:
                        # Full-content deduplication (legacy hash-based, kept for compatibility)
                        total_bytes += bytes_count
                        # Choose marker based on deduplication reason
                        if write_op:
                            marker = f"<DEDUPLICATION_READ_AFTER_WRITE_MARKER|OMITTED_CHARS_COUNT:{bytes_count}>"
                        else:
                            marker = f"<DEDUPLICATION_MULTIPLE_READS_MARKER|OMITTED_CHARS_COUNT:{bytes_count}>"
                        item['content'] = marker

    return messages, total_bytes

def generate_report(
    duplicates: list[tuple[ReadOp, Optional[WriteOp], Optional[ReadOp], Optional[tuple]]],
    total_bytes: int,
    dry_run: bool = False,
    short_output: bool = False,
    token_ratio: Optional[int] = None
) -> str:
    """Generate a report of deduplication"""
    if short_output:
        if total_bytes == 0:
            return ""

        if token_ratio and token_ratio > 0:
            return f"Savings: {total_bytes} bytes (~{token_ratio} tokens)"
        return f"Savings: {total_bytes} bytes"

    report_lines = []

    if dry_run:
        report_lines.append("=== DRY RUN REPORT ===")
    else:
        report_lines.append("=== DEDUPLICATION REPORT ===")

    report_lines.append(f"\nTotal duplicates found: {len(duplicates)}")
    if token_ratio and token_ratio > 0:
        report_lines.append(f"Total bytes omitted: {total_bytes} (~{token_ratio} tokens)")
    else:
        report_lines.append(f"Total bytes omitted: {total_bytes}")

    # Group by file
    by_file = {}
    for read_op, write_op, prev_read_op, partial_data in duplicates:
        filepath = read_op.filepath
        if filepath not in by_file:
            by_file[filepath] = []
        by_file[filepath].append((read_op, write_op, prev_read_op, partial_data))

    if duplicates:
        report_lines.append("\n--- Duplicates by file ---")
        for filepath, ops in sorted(by_file.items()):
            report_lines.append(f"\n{filepath}:")
            for i, (read_op, write_op, prev_read_op, partial_data) in enumerate(ops, 1):
                bytes_count = len(read_op.content.encode('utf-8'))
                if partial_data:
                    _, bytes_omitted = partial_data
                    report_lines.append(f"  {i}. Read (id:{read_op.tool_use_id[:8]}...) partial deduplication (line-level)")
                    report_lines.append(f"     Bytes: {bytes_count} | Omitted: {bytes_omitted}")
                elif write_op:
                    report_lines.append(f"  {i}. Read (id:{read_op.tool_use_id[:8]}...) deduplicated with Write (id:{write_op.uuid[:8]}...)")
                    report_lines.append(f"     Hash: {read_op.content_hash[:8]}... | Bytes: {bytes_count}")
                elif prev_read_op:
                    report_lines.append(f"  {i}. Read (id:{read_op.tool_use_id[:8]}...) deduplicated with previous Read (id:{prev_read_op.tool_use_id[:8]}...)")
                    report_lines.append(f"     Hash: {read_op.content_hash[:8]}... | Bytes: {bytes_count}")

    if dry_run:
        report_lines.append("\n[DRY RUN] No changes made. Run without --dry-run to apply deduplication.")
    else:
        if duplicates:
            report_lines.append("\n[APPLIED] Transcript modified in-place.")
        else:
            report_lines.append("\n[APPLIED] No duplicates found, transcript unchanged.")

    return "\n".join(report_lines)

def save_transcript(messages: list[dict], filepath: str) -> None:
    """Save transcript as minified JSONL"""
    with open(filepath, 'w', encoding='utf-8') as f:
        for msg in messages:
            f.write(json.dumps(msg, separators=(',', ':'), ensure_ascii=False) + '\n')

def parse_hook_message(hook_json: str) -> dict:
    """Parse SessionEnd hook message.

    Args:
        hook_json: JSON string containing hook event data

    Returns:
        Dictionary with parsed hook data (session_id, transcript_path, reason, etc.)

    Raises:
        json.JSONDecodeError: If hook_json is invalid JSON
        KeyError: If required fields are missing
    """
    hook_data = json.loads(hook_json)
    # Validate required fields
    required = ['session_id', 'transcript_path']
    missing = [f for f in required if f not in hook_data]
    if missing:
        raise KeyError(f"Missing required fields in hook message: {missing}")
    return hook_data

def main():
    dry_run = '--dry-run' in sys.argv
    short_output = '--dry-run-short' in sys.argv
    session_id = None
    transcript_file = None

    # Try hook mode first: read JSON from stdin with UTF-8 encoding
    if not sys.stdin.isatty():
        try:
            # Ensure UTF-8 encoding for stdin
            import io
            if hasattr(sys.stdin, 'buffer'):
                hook_json = sys.stdin.buffer.read().decode('utf-8')
            else:
                hook_json = sys.stdin.read()
            if hook_json.strip():
                hook_data = parse_hook_message(hook_json)

                # Skip deduplication if session was cleared (no transcript to clean)
                reason = hook_data.get('reason', '')
                if reason == 'clear':
                    # Session was cleared with /clear command, nothing to deduplicate
                    sys.exit(0)

                transcript_file = hook_data.get('transcript_path', '')
                dry_run = False  # Never dry-run in hook mode
                session_id = hook_data.get('session_id', 'unknown')
        except (json.JSONDecodeError, KeyError):
            # stdin exists but not valid JSON, fall through to CLI mode
            pass

    # CLI mode: use command-line argument
    if transcript_file is None:
        if len(sys.argv) < 2:
            print("Usage: python dedup_transcript.py <transcript_file> [--dry-run] [--dry-run-short]")
            sys.exit(1)
        transcript_file = sys.argv[1]
        session_id = None

    # Verify file exists
    if not Path(transcript_file).exists():
        print(f"Error: File not found: {transcript_file}")
        sys.exit(1)

    # Verbosity based on mode (suppress for short output)
    verbose = (dry_run or session_id is None) and not short_output

    if verbose:
        print(f"Loading transcript: {transcript_file}")
    messages = load_transcript(transcript_file, dry_run=dry_run)
    if verbose:
        print(f"Loaded {len(messages)} messages")

    if verbose:
        print("\nExtracting Write operations...")
    writes_by_path = extract_writes(messages)
    total_writes = sum(len(w) for w in writes_by_path.values())
    if verbose:
        print(f"Found {total_writes} Write operations")

    if verbose:
        print("Extracting Read operations...")
    reads_by_path = extract_reads(messages)
    total_reads = sum(len(r) for r in reads_by_path.values())
    if verbose:
        print(f"Found {total_reads} Read operations")

    if verbose:
        print("\nAnalyzing for duplicates...")
    duplicates = find_duplicates(writes_by_path, reads_by_path)
    if verbose:
        print(f"Found {len(duplicates)} duplicate reads")

    # Calculate total bytes and estimate tokens per file
    total_bytes = 0
    estimated_tokens = None

    if duplicates:
        # Group duplicates by file - track full content size and omitted bytes separately
        files_with_duplicates = {}  # filepath -> {full_size, omitted_bytes}
        for read_op, _, _, partial_data in duplicates:
            if read_op.filepath not in files_with_duplicates:
                files_with_duplicates[read_op.filepath] = {'full_size': 0, 'omitted_bytes': 0}

            full_size = len(read_op.content.encode('utf-8'))
            files_with_duplicates[read_op.filepath]['full_size'] += full_size

            if partial_data:
                _, bytes_omitted = partial_data
                total_bytes += bytes_omitted
                files_with_duplicates[read_op.filepath]['omitted_bytes'] += bytes_omitted
            else:
                # Full dedup: entire file omitted
                total_bytes += full_size
                files_with_duplicates[read_op.filepath]['omitted_bytes'] += full_size

        # Calculate tokens for each file based on percentage of content omitted
        total_estimated_tokens = 0
        for filepath, info in files_with_duplicates.items():
            ratio = extract_token_ratio_for_file(messages, filepath)
            if ratio and ratio > 0:
                full_size = info['full_size']
                omitted_bytes = info['omitted_bytes']

                if full_size > 0:
                    # Calculate tokens for full file, then apply percentage omitted
                    full_file_tokens = int(full_size * ratio)
                    omitted_percentage = omitted_bytes / full_size
                    omitted_tokens = int(full_file_tokens * omitted_percentage)
                    total_estimated_tokens += omitted_tokens

        estimated_tokens = total_estimated_tokens if total_estimated_tokens > 0 else None

    # Generate report
    report = generate_report(duplicates, total_bytes, dry_run=dry_run, short_output=short_output, token_ratio=estimated_tokens)
    if verbose:
        print("\n" + report)
    elif short_output:
        print(report)

    # Apply deduplication if not dry-run
    if not dry_run and duplicates:
        if verbose:
            print("\nApplying deduplication...")
        messages_dedup, _ = apply_deduplication(messages, duplicates)
        save_transcript(messages_dedup, transcript_file)
        if verbose:
            print(f"[OK] Saved deduplicated transcript")
        elif session_id:
            # Minimal output in hook mode
            print(f"Deduplicated {len(duplicates)} file reads with same content from conversation which cleared up {total_bytes} wasted characters.")

if __name__ == '__main__':
    main()
