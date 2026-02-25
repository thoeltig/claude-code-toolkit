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
import sys
from pathlib import Path

from cleanup import (
    ContentType, FileOperation, BashOperation, GrepOperation, EditOperation, DedupAction,
    Logger, DUPLICATE_READ_MARKER, DUPLICATE_SCRIPT_MARKER,
    get_min_dedup_bytes, get_multiline_context_lines, get_singleline_context_chars,
    find_line_differences, apply_context_margin, create_partial_dedup_multiline,
    create_partial_dedup_singleline, find_character_diff,
    edit_overlaps_with_lines,
    load_transcript, save_transcript, extract_operations, extract_bash_operations,
    extract_grep_operations, extract_edit_operations
)


def find_dedup_actions(
    ops_by_path: dict[str, list[FileOperation]],
    bash_ops_by_path: dict[str, list[BashOperation]],
    grep_ops_by_path: dict[str, list[GrepOperation]],
    edit_ops_by_path: dict[str, list[EditOperation]],
    logger: Logger,
    min_dedup_bytes: int,
    multiline_context: int,
    singleline_context: int,
) -> list[DedupAction]:
    """Find which operations should be deduplicated using unified forward-chaining.

    Processes Read, BashCat, and Grep operations in chronological order per filepath.
    - Writes are never deduplicated (represent current state)
    - Read + BashCat: Forward-chaining like files (identical → full dedup)
    - Grep: Deduplicate if later Read/BashCat exists for same file (without edits between)
    - Edit: Tracked for dedup safety checks
    """
    actions = []

    # Build unified operation stream per filepath (all types)
    all_filepaths = set()
    all_filepaths.update(ops_by_path.keys())
    all_filepaths.update(bash_ops_by_path.keys())
    all_filepaths.update(grep_ops_by_path.keys())
    all_filepaths.update(edit_ops_by_path.keys())

    for filepath in all_filepaths:
        # Collect all operations for this filepath
        all_ops = []

        # Add file operations (Write, Read)
        for op in ops_by_path.get(filepath, []):
            all_ops.append(op)

        # Add bash operations
        for op in bash_ops_by_path.get(filepath, []):
            all_ops.append(op)

        # Add grep operations
        for op in grep_ops_by_path.get(filepath, []):
            all_ops.append(op)

        # Add edit operations
        for op in edit_ops_by_path.get(filepath, []):
            all_ops.append(op)

        if not all_ops:
            continue

        # Sort by message position to maintain chronological order
        all_ops.sort(key=lambda x: x.message_position)

        logger.log(f"\nProcessing {filepath} with {len(all_ops)} operations")

        # Forward-chaining dedup
        previous_state = None
        last_read_idx = None

        # Find last read-like operation index
        for idx in range(len(all_ops) - 1, -1, -1):
            if all_ops[idx].op_type in ['read', 'write', 'bash']:
                last_read_idx = idx
                break

        # Build map of (content) -> last_occurrence_index for keep-last dedup
        content_last_occurrence = {}
        for idx, op in enumerate(all_ops):
            if op.op_type in ['read', 'bash']:
                op_content = op.raw_content if hasattr(op, 'raw_content') and op.raw_content else op.content
                content_last_occurrence[op_content] = idx

        for idx, op in enumerate(all_ops):
            is_last_read = (idx == last_read_idx)

            # Read-like operations (Read, Write, BashCat)
            if op.op_type in ['read', 'write', 'bash']:
                logger.log(f"  {op.op_type.upper()} {op.tool_use_id[:8]} at pos {op.message_position}: {len(op.content)} bytes, is_last={is_last_read}")

                # Write → Read edge case (only for Read immediately after Write)
                if op.op_type == 'read' and idx > 0 and all_ops[idx - 1].op_type == 'write':
                    write_op = all_ops[idx - 1]
                    if hasattr(op, 'raw_content') and op.raw_content == write_op.content:
                        logger.log(f"    -> Raw content matches Write, FULL DEDUP (Write → Read edge case)")
                        bytes_removed = len(op.content.encode('utf-8'))
                        action = DedupAction(
                            tool_use_id=op.tool_use_id,
                            action='full_dedup',
                            bytes_removed=bytes_removed,
                            op_type=op.op_type,
                        )
                        actions.append(action)
                        continue

                # Skip writes in dedup logic
                if op.op_type == 'write':
                    if hasattr(op, 'content'):
                        previous_state = op.content
                    continue

                # For read-like ops (read, bash), use raw_content for comparison
                op_content = op.raw_content if hasattr(op, 'raw_content') and op.raw_content else op.content

                # Check if this is the last occurrence of this content
                is_last_occurrence = (content_last_occurrence.get(op_content) == idx)

                if is_last_occurrence:
                    # Keep last occurrence (don't mark for dedup)
                    logger.log(f"    -> Last occurrence, keep full content")
                    previous_state = op_content
                    continue
                else:
                    # Not last occurrence - mark as FULL DEDUP
                    logger.log(f"    -> Earlier occurrence, FULL DEDUP (latest below)")
                    bytes_removed = len(op.content.encode('utf-8'))
                    action = DedupAction(
                        tool_use_id=op.tool_use_id,
                        action='full_dedup',
                        bytes_removed=bytes_removed,
                        op_type=op.op_type,
                    )
                    actions.append(action)
                    previous_state = op_content

                    if op.content_type == ContentType.MULTILINE:
                        diff_ranges = find_line_differences(previous_state, op_content)
                        logger.log(f"       Line diffs at: {diff_ranges}")

                        if diff_ranges:
                            total_lines = len(op_content.split('\n'))
                            kept_ranges = apply_context_margin(diff_ranges, total_lines, margin=multiline_context)
                            logger.log(f"       Kept ranges (with context): {kept_ranges}")

                            modified_content, bytes_removed = create_partial_dedup_multiline(
                                op.content, kept_ranges, min_dedup_bytes
                            )
                            logger.log(f"       Removed: {bytes_removed} bytes")

                            action = DedupAction(
                                tool_use_id=op.tool_use_id,
                                action='partial_dedup',
                                replacement=modified_content,
                                bytes_removed=bytes_removed,
                                op_type=op.op_type,
                            )
                            actions.append(action)
                    else:
                        # Single-line content
                        diff_range = find_character_diff(previous_state, op_content)
                        if diff_range:
                            diff_start, diff_end = diff_range
                            logger.log(f"       Char diff at {diff_start}-{diff_end}")

                            modified_content, bytes_removed = create_partial_dedup_singleline(
                                op.content, diff_start, diff_end, min_dedup_bytes, singleline_context
                            )
                            logger.log(f"       Removed: {bytes_removed} bytes")

                            action = DedupAction(
                                tool_use_id=op.tool_use_id,
                                action='partial_dedup',
                                replacement=modified_content,
                                bytes_removed=bytes_removed,
                                op_type=op.op_type,
                            )
                            actions.append(action)

                previous_state = op_content

            # Edit operations (just track, don't update state)
            elif op.op_type == 'edit':
                logger.log(f"  EDIT at pos {op.message_position}: {filepath}")
                # Don't change previous_state - edits don't represent "what we read"

            # Grep operations (special dedup logic)
            elif op.op_type == 'grep':
                logger.log(f"  GREP {op.tool_use_id[:8]} at pos {op.message_position}: pattern '{op.pattern}' (lines: {sorted(op.affected_lines) if op.affected_lines else 'unknown'})")

                # Find later Read/BashCat for same file
                later_read_ops = [
                    o for o in all_ops[idx + 1 :]
                    if o.op_type in ['read', 'bash'] and o.filepath == filepath
                ]

                if later_read_ops:
                    first_later_read = later_read_ops[0]
                    first_later_read_idx = all_ops.index(first_later_read)

                    # Check for edits between grep and first later read with smart overlap
                    edits_between = [
                        o for o in all_ops[idx + 1 : first_later_read_idx]
                        if o.op_type == 'edit'
                    ]

                    if edits_between:
                        # Smart overlap check: only skip if edit actually touches grep lines
                        overlapping_edits = [
                            e for e in edits_between
                            if edit_overlaps_with_lines(e, op.affected_lines)
                        ]

                        if overlapping_edits:
                            logger.log(f"    -> Edit overlaps grep lines {op.affected_lines}, skip dedup")
                        else:
                            # Edit exists but doesn't touch grep lines - safe to dedup!
                            logger.log(f"    -> Edit exists but no line overlap, FULL DEDUP")
                            bytes_removed = len(op.content.encode('utf-8'))
                            action = DedupAction(
                                tool_use_id=op.tool_use_id,
                                action='full_dedup',
                                bytes_removed=bytes_removed,
                            )
                            actions.append(action)
                    else:
                        # Safe to deduplicate - no edits, later read exists
                        logger.log(f"    -> No edits between Grep and Read at {first_later_read_idx}, FULL DEDUP")
                        bytes_removed = len(op.content.encode('utf-8'))
                        action = DedupAction(
                            tool_use_id=op.tool_use_id,
                            action='full_dedup',
                            bytes_removed=bytes_removed,
                        )
                        actions.append(action)
                else:
                    logger.log(f"    -> No later Read/BashCat found, skip dedup")

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
                        # Use contextual marker based on operation type
                        if action.op_type == 'bash':
                            marker = DUPLICATE_SCRIPT_MARKER
                        else:
                            marker = DUPLICATE_READ_MARKER
                        item['content'] = marker
                    elif action.action == 'partial_dedup' and action.replacement:
                        item['content'] = action.replacement


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
    bash_ops_by_path = extract_bash_operations(messages, logger)
    grep_ops_by_path = extract_grep_operations(messages, logger)
    edit_ops_by_path = extract_edit_operations(messages, logger)

    logger.log("\nFinding deduplication actions...")
    actions = find_dedup_actions(
        ops_by_path, bash_ops_by_path, grep_ops_by_path, edit_ops_by_path,
        logger, min_dedup_bytes, multiline_context, singleline_context
    )

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
            print(f"Found {len(actions)} duplicate reads, {total_bytes} bytes (~{estimated_tokens} tokens)")
        else:
            print("No duplicates found")

    if not dry_run and not dry_run_short and actions:
        logger.log("\nApplying deduplication...")
        apply_dedup(messages, actions)
        save_transcript(messages, transcript_file)
        logger.log("Transcript saved")


if __name__ == '__main__':
    main()
