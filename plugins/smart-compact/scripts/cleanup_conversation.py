#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transcript deduplication script - Forward-chaining diff algorithm.

Removes duplicate file reads by comparing each read to the previous state
and keeping only the changed content + context. Last read in each file
keeps full content (represents current state).

Usage:
    python cleanup_conversation_v2.py <transcript.json> [--dry-run] [--debug]

Environment variables:
    SMART_COMPACT_DEDUP_MIN_BYTES: Minimum bytes to replace with marker
        (omitted content must be > this threshold). Default: 1
        Example: Set to 100 to only replace if content is larger than 100 bytes
    SMART_COMPACT_MULTILINE_CONTEXT_LINES: Context lines around changes (default: 1)
        Example: Set to 3 for ±3 line context, or 0 for no context
    SMART_COMPACT_SINGLELINE_CONTEXT_CHARS: Context characters around changes (default: 10)
        Example: Set to 20 for ±20 char context, or 0 for no context
"""

import json
import hashlib
import sys
import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass
from enum import Enum


class ContentType(Enum):
    """Content type for smart parsing."""
    MULTILINE = "multiline"  # Markdown, code, etc - process line by line
    SINGLELINE = "singleline"  # Compact JSON, single long string


@dataclass
class FileOperation:
    """Represents a Write or Read operation."""
    op_type: str  # "write" or "read"
    tool_use_id: str  # For reads; for writes this is the uuid
    filepath: str
    content: str  # Actual content from item['content'] in transcript
    message_position: int
    content_type: ContentType  # Detected content type
    raw_content: Optional[str] = None  # For reads: content from toolUseResult.file.content (raw file content)


@dataclass
class DedupAction:
    """Action to take for a read operation."""
    tool_use_id: str
    action: str  # "full_dedup", "partial_dedup", or "keep"
    replacement: Optional[str] = None  # For partial dedup
    bytes_removed: int = 0


def get_min_dedup_bytes() -> int:
    """Get minimum bytes threshold for replacements from environment variable.

    SMART_COMPACT_DEDUP_MIN_BYTES: Minimum bytes (default 1)
    Omitted content must be > this many bytes to be replaced with marker.
    """
    default_bytes = 1
    try:
        min_bytes_str = os.getenv('SMART_COMPACT_DEDUP_MIN_BYTES', '1')
        min_bytes = int(min_bytes_str)
        if min_bytes < 0:
            return default_bytes
        return min_bytes
    except (ValueError, TypeError):
        return default_bytes


def get_multiline_context_lines() -> int:
    """Get context lines for multiline content from environment variable.

    SMART_COMPACT_MULTILINE_CONTEXT_LINES: Context lines (default 1)
    Applied as ±N lines around changed lines (0 = no context).
    """
    default_lines = 1
    try:
        lines_str = os.getenv('SMART_COMPACT_MULTILINE_CONTEXT_LINES', '1')
        lines = int(lines_str)
        if lines < 0:
            return default_lines
        return lines
    except (ValueError, TypeError):
        return default_lines


def get_singleline_context_chars() -> int:
    """Get context characters for single-line content from environment variable.

    SMART_COMPACT_SINGLELINE_CONTEXT_CHARS: Context characters (default 10)
    Applied as ±N characters around changed region (0 = no context).
    """
    default_chars = 10
    try:
        chars_str = os.getenv('SMART_COMPACT_SINGLELINE_CONTEXT_CHARS', '10')
        chars = int(chars_str)
        if chars < 0:
            return default_chars
        return chars
    except (ValueError, TypeError):
        return default_chars


class Logger:
    """Simple debug logger."""

    def __init__(self, debug: bool = False):
        self.debug = debug

    def log(self, msg: str):
        """Print debug message if debug mode enabled."""
        if self.debug:
            print(f"[DEBUG] {msg}", file=sys.stderr)


def detect_content_type(content: str) -> ContentType:
    """Detect if content should be processed line-by-line or character-by-character.

    Simple heuristic: if content contains no newlines, use character-based.
    Otherwise use line-based (works for both readable and compact multi-line formats).
    """
    # True single-line: no newline characters
    if '\n' not in content:
        return ContentType.SINGLELINE

    # Everything with newlines uses line-based comparison
    return ContentType.MULTILINE


def find_line_differences(content1: str, content2: str) -> list[tuple[int, int]]:
    """Find line ranges where content1 and content2 differ.

    Returns list of (start_line, end_line) tuples (0-indexed, exclusive end).
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

    if in_diff_block:
        differences.append((diff_start, max_lines))

    return differences


def apply_context_margin(
    diff_ranges: list[tuple[int, int]], total_lines: int, margin: int
) -> list[tuple[int, int]]:
    """Apply context margin around differences and return ranges to keep."""
    if not diff_ranges:
        return []

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
            merged[-1] = (last_start, max(last_end, current_end))
        else:
            merged.append((current_start, current_end))

    return merged


def create_partial_dedup_multiline(
    content: str, kept_ranges: list[tuple[int, int]], min_dedup_bytes: int = 1
) -> tuple[str, int]:
    """Replace lines outside kept_ranges with placeholder for multiline content.

    Only creates placeholder if omitted content is larger than min_dedup_bytes threshold.
    Returns (modified_content, bytes_removed).
    """
    MARKER = "[...Partial duplicate omitted - latest version contains complete content...]"
    MIN_BYTES = min_dedup_bytes

    lines = content.split('\n')
    result_lines = []
    total_bytes_removed = 0
    current_pos = 0

    for keep_start, keep_end in kept_ranges:
        # Check omitted lines before this range
        if keep_start > current_pos:
            omitted_lines = lines[current_pos:keep_start]
            block_bytes = sum(len(line.encode('utf-8')) + 1 for line in omitted_lines)  # +1 for newline

            if block_bytes > MIN_BYTES:
                # Worth replacing with marker
                result_lines.append(MARKER)
                total_bytes_removed += block_bytes
            else:
                # Too small, keep as-is
                result_lines.extend(omitted_lines)

        # Add kept lines
        result_lines.extend(lines[keep_start:keep_end])
        current_pos = keep_end

    # Handle remaining lines
    if current_pos < len(lines):
        remaining = lines[current_pos:]
        block_bytes = sum(len(line.encode('utf-8')) + 1 for line in remaining)

        if block_bytes > MIN_BYTES:
            result_lines.append(MARKER)
            total_bytes_removed += block_bytes
        else:
            result_lines.extend(remaining)

    modified_content = '\n'.join(result_lines)
    return modified_content, total_bytes_removed


def create_partial_dedup_singleline(
    content: str, diff_start_char: int, diff_end_char: int, min_dedup_bytes: int, context_chars: int
) -> tuple[str, int]:
    """Replace characters outside diff range with placeholder for single-line content.

    For compact JSON and similar single-line formats.
    Only replaces if larger than min_dedup_bytes threshold.
    Returns (modified_content, bytes_removed).
    """
    MARKER = "[...Partial duplicate omitted - latest version contains complete content...]"
    MIN_BYTES = min_dedup_bytes
    context = context_chars
    keep_start = max(0, diff_start_char - context)
    keep_end = min(len(content), diff_end_char + context)

    before = content[:keep_start]
    kept = content[keep_start:keep_end]
    after = content[keep_end:]

    bytes_before = len(before.encode('utf-8'))
    bytes_after = len(after.encode('utf-8'))
    total_bytes_removed = 0

    result = ""

    # Only add marker if section is larger than threshold
    if bytes_before > MIN_BYTES:
        result += MARKER + " "
        total_bytes_removed += bytes_before
    else:
        result += before

    result += kept

    if bytes_after > MIN_BYTES:
        result += " " + MARKER
        total_bytes_removed += bytes_after
    else:
        result += after

    return result, total_bytes_removed


def find_character_diff(content1: str, content2: str) -> Optional[tuple[int, int]]:
    """Find character range where content differs.

    Returns (diff_start_char, diff_end_char) or None if identical.
    """
    if content1 == content2:
        return None

    # Find first difference
    for i in range(min(len(content1), len(content2))):
        if content1[i] != content2[i]:
            diff_start = i
            break
    else:
        # One is longer than the other
        diff_start = min(len(content1), len(content2))

    # Find last difference (search backward)
    for i in range(max(len(content1), len(content2)) - 1, -1, -1):
        c1 = content1[i] if i < len(content1) else None
        c2 = content2[i] if i < len(content2) else None
        if c1 != c2:
            diff_end = i + 1
            break
    else:
        diff_end = diff_start

    return (diff_start, diff_end)


def load_transcript(filepath: str) -> list[dict]:
    """Load transcript (handles minified JSONL and pretty-printed JSON)."""
    messages = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try as JSON array first
    if content.strip().startswith('['):
        try:
            messages = json.loads(content)
            return messages
        except json.JSONDecodeError:
            pass

    # Parse as newline-delimited JSON
    lines = content.split('\n')
    current_obj = []
    brace_count = 0

    for line in lines:
        current_obj.append(line)
        brace_count += line.count('{') - line.count('}')

        if brace_count == 0 and current_obj and any('{' in l for l in current_obj):
            obj_str = '\n'.join(current_obj).strip()
            if obj_str:
                try:
                    messages.append(json.loads(obj_str))
                    current_obj = []
                except json.JSONDecodeError:
                    pass

    return messages


def extract_operations(messages: list[dict], logger: Logger) -> dict[str, list[FileOperation]]:
    """Extract Write and Read operations indexed by filepath."""
    ops_by_path = {}

    # Extract Writes
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
                    op = FileOperation(
                        op_type='write',
                        tool_use_id=item.get('id'),
                        filepath=filepath,
                        content=file_content,
                        message_position=position,
                        content_type=detect_content_type(file_content)
                    )
                    ops_by_path.setdefault(filepath, []).append(op)
                    logger.log(f"Write: {filepath} ({len(file_content)} bytes)")

    # Extract Reads - first pass: map Read tool_use to filepaths
    read_map = {}
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
                    read_map[tool_use_id] = filepath

    # Extract Reads - second pass: get content from tool_result and toolUseResult
    for position, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        # Get raw content from toolUseResult if available
        tool_use_result = msg.get('toolUseResult', {})
        result_raw_content = None
        if isinstance(tool_use_result, dict):
            result_raw_content = tool_use_result.get('file', {}).get('content')

        for item in content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')
                if tool_use_id in read_map:
                    filepath = read_map[tool_use_id]
                    result_content = item.get('content', '')

                    if result_content:
                        op = FileOperation(
                            op_type='read',
                            tool_use_id=tool_use_id,
                            filepath=filepath,
                            content=result_content,
                            message_position=position,
                            content_type=detect_content_type(result_content),
                            raw_content=result_raw_content
                        )
                        ops_by_path.setdefault(filepath, []).append(op)
                        logger.log(f"Read {tool_use_id[:8]}: {filepath} ({len(result_content)} bytes, {op.content_type.value})")

    return ops_by_path


def find_dedup_actions(
    ops_by_path: dict[str, list[FileOperation]], logger: Logger, min_dedup_bytes: int,
    multiline_context: int, singleline_context: int
) -> list[DedupAction]:
    """Find which reads should be deduplicated using forward-chaining algorithm.

    Writes are kept (never deduplicated). Reads are chained against each other,
    with each read comparing to the previous read's actual content.

    Edge case: If a Read immediately follows a Write, check if the Read's
    raw_content (from toolUseResult) matches the Write's content. If so,
    mark the Read for dedup.
    """
    actions = []

    for filepath, ops in ops_by_path.items():
        logger.log(f"\nProcessing {filepath}:")

        # Sort all ops by position to detect Write → Read
        all_ops = sorted(ops, key=lambda x: x.message_position)

        # Find the last Write (if any)
        last_write = None
        for op in all_ops:
            if op.op_type == 'write':
                last_write = op

        # Extract only reads in order
        reads = [op for op in ops if op.op_type == 'read']
        reads.sort(key=lambda x: x.message_position)

        if not reads:
            logger.log("  No reads found")
            continue

        last_read_index = len(reads) - 1
        previous_state = None
        first_read_after_write = True if last_write else False

        for read_idx, read_op in enumerate(reads):
            is_last_read = (read_idx == last_read_index)

            logger.log(f"  Read {read_op.tool_use_id[:8]} at pos {read_op.message_position}: {len(read_op.content)} bytes, is_last={is_last_read}")

            # Check Write → Read edge case (only for first read after write)
            if first_read_after_write and last_write and read_op.raw_content:
                if read_op.raw_content == last_write.content:
                    logger.log(f"    -> Raw content matches Write, FULL DEDUP (Write → Read edge case)")
                    bytes_removed = len(read_op.content.encode('utf-8'))
                    action = DedupAction(
                        tool_use_id=read_op.tool_use_id,
                        action='full_dedup',
                        bytes_removed=bytes_removed
                    )
                    actions.append(action)
                    first_read_after_write = False
                    previous_state = read_op.content
                    continue
                else:
                    logger.log(f"    -> Raw content differs from Write, proceed with normal chain")
                    first_read_after_write = False

            if previous_state is None:
                # First read - keep full content and set as baseline
                logger.log(f"    -> First read, keep full content")
                previous_state = read_op.content
                continue

            # Compare to previous read state
            if read_op.content == previous_state:
                # Identical to previous read
                logger.log(f"    -> Identical to previous read, FULL DEDUP")
                bytes_removed = len(read_op.content.encode('utf-8'))
                action = DedupAction(
                    tool_use_id=read_op.tool_use_id,
                    action='full_dedup',
                    bytes_removed=bytes_removed
                )
                actions.append(action)
                # previous_state unchanged
            else:
                # Different from previous read
                if is_last_read:
                    logger.log(f"    -> Different from previous but LAST READ, keep full content")
                    previous_state = read_op.content
                    continue

                # Do partial dedup based on content type
                logger.log(f"    -> Different from previous, PARTIAL DEDUP")

                if read_op.content_type == ContentType.MULTILINE:
                    diff_ranges = find_line_differences(previous_state, read_op.content)
                    logger.log(f"       Line diffs at: {diff_ranges}")

                    if diff_ranges:
                        total_lines = len(read_op.content.split('\n'))
                        kept_ranges = apply_context_margin(diff_ranges, total_lines, margin=multiline_context)
                        logger.log(f"       Kept ranges (with context): {kept_ranges}")

                        modified_content, bytes_removed = create_partial_dedup_multiline(
                            read_op.content, kept_ranges, min_dedup_bytes
                        )
                        logger.log(f"       Removed: {bytes_removed} bytes")

                        action = DedupAction(
                            tool_use_id=read_op.tool_use_id,
                            action='partial_dedup',
                            replacement=modified_content,
                            bytes_removed=bytes_removed
                        )
                        actions.append(action)
                else:
                    # Single-line content
                    diff_range = find_character_diff(previous_state, read_op.content)
                    if diff_range:
                        diff_start, diff_end = diff_range
                        logger.log(f"       Char diff at {diff_start}-{diff_end}")

                        modified_content, bytes_removed = create_partial_dedup_singleline(
                            read_op.content, diff_start, diff_end, min_dedup_bytes, singleline_context
                        )
                        logger.log(f"       Removed: {bytes_removed} bytes")

                        action = DedupAction(
                            tool_use_id=read_op.tool_use_id,
                            action='partial_dedup',
                            replacement=modified_content,
                            bytes_removed=bytes_removed
                        )
                        actions.append(action)

            # Update previous state to current read's actual content
            previous_state = read_op.content

    return actions


def apply_dedup(messages: list[dict], actions: list[DedupAction]) -> None:
    """Apply deduplication to messages in-place."""
    # Build lookup
    action_lookup = {a.tool_use_id: a for a in actions}

    for msg in messages:
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')
                if tool_use_id in action_lookup:
                    action = action_lookup[tool_use_id]

                    if action.action == 'full_dedup':
                        item['content'] = "[...Duplicate read omitted - latest version contains complete content...]"
                    elif action.action == 'partial_dedup' and action.replacement:
                        item['content'] = action.replacement


def save_transcript(messages: list[dict], filepath: str) -> None:
    """Save transcript as minified JSONL."""
    with open(filepath, 'w', encoding='utf-8') as f:
        for msg in messages:
            f.write(json.dumps(msg, separators=(',', ':'), ensure_ascii=False) + '\n')


def main():
    dry_run = '--dry-run' in sys.argv
    dry_run_short = '--dry-run-short' in sys.argv
    debug = '--debug' in sys.argv

    logger = Logger(debug=debug)

    if len(sys.argv) < 2:
        print("Usage: python cleanup_conversation.py <transcript.json> [--dry-run] [--dry-run-short] [--debug]")
        sys.exit(1)

    transcript_file = sys.argv[1]

    if not Path(transcript_file).exists():
        print(f"Error: File not found: {transcript_file}")
        sys.exit(1)

    logger.log(f"Loading transcript: {transcript_file}")
    messages = load_transcript(transcript_file)
    logger.log(f"Loaded {len(messages)} messages\n")

    min_dedup_bytes = get_min_dedup_bytes()
    multiline_context = get_multiline_context_lines()
    singleline_context = get_singleline_context_chars()

    logger.log(f"Min dedup bytes threshold: {min_dedup_bytes}")
    logger.log(f"Multiline context: ±{multiline_context} lines")
    logger.log(f"Single-line context: ±{singleline_context} chars")

    logger.log("Extracting operations...")
    ops_by_path = extract_operations(messages, logger)

    logger.log("\nFinding deduplication actions...")
    actions = find_dedup_actions(ops_by_path, logger, min_dedup_bytes, multiline_context, singleline_context)

    # Calculate summary
    total_bytes = sum(a.bytes_removed for a in actions)
    estimated_tokens = total_bytes // 4

    # Output based on mode
    if dry_run_short:
        # Short format for external parsing (used by notify_about_compaction.py and block_idle_session.py)
        if total_bytes > 0:
            print(f"Savings: {total_bytes} bytes (~{estimated_tokens} tokens)")
        else:
            print("No duplicates found")
    else:
        # Normal format
        if actions:
            print(f"Found {len(actions)} duplicate reads, {total_bytes} bytes ({estimated_tokens} tokens)")
        else:
            print("No duplicates found")

    if not dry_run and not dry_run_short and actions:
        logger.log("\nApplying deduplication...")
        apply_dedup(messages, actions)
        save_transcript(messages, transcript_file)
        logger.log("Transcript saved")


if __name__ == '__main__':
    main()
