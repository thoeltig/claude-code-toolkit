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
            if 0.5 < ratio < 5:
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

def find_duplicates(
    writes_by_path: dict[str, list[WriteOp]],
    reads_by_path: dict[str, list[ReadOp]]
) -> list[tuple[ReadOp, Optional[WriteOp], Optional[ReadOp]]]:
    """
    Find duplicate reads - keep latest read per content hash, mark earlier ones as duplicates.
    Exception: If a Write has a content hash, deduplicate all Reads with that hash (Write is the source).
    This preserves the most recent (highest priority) context while removing older redundant reads.

    Returns:
        List of (read_op, write_op_if_read_after_write, prev_read_op_if_duplicate_read)
        - If write_op is set: Read was deduplicated because Write has same content
        - If prev_read_op is set: Read was deduplicated because earlier Read has same content
    """
    duplicates = []

    for filepath, reads in reads_by_path.items():
        writes = writes_by_path.get(filepath, [])
        write_hashes = {w.content_hash: w for w in writes}  # Map hash to write

        # Group reads by content hash
        by_hash: dict[str, list[ReadOp]] = {}
        for read in reads:
            by_hash.setdefault(read.content_hash, []).append(read)

        # For each content hash, apply deduplication logic
        for content_hash, reads_with_hash in by_hash.items():
            if content_hash in write_hashes:
                # If a Write has this hash, deduplicate ALL reads with that hash
                write_op = write_hashes[content_hash]
                for read in reads_with_hash:
                    duplicates.append((read, write_op, None))
            elif len(reads_with_hash) > 1:
                # No matching write: keep only the latest read, mark earlier ones as duplicates
                sorted_reads = sorted(reads_with_hash, key=lambda r: r.message_position)
                # Mark all but the latest (last element) as duplicates
                for read in sorted_reads[:-1]:
                    duplicates.append((read, None, None))

    return duplicates

def apply_deduplication(
    messages: list[dict],
    duplicates: list[tuple[ReadOp, Optional[WriteOp], Optional[ReadOp]]]
) -> tuple[list[dict], int]:
    """
    Apply deduplication by replacing Read tool_result content with markers.
    Uses different markers based on deduplication reason:
    - DEDUPLICATION_READ_AFTER_WRITE_MARKER: Read deduplicated due to Write with same content
    - DEDUPLICATION_MULTIPLE_READS_MARKER: Read deduplicated due to earlier Read with same content

    Returns modified messages and total bytes omitted
    """
    total_bytes = 0
    # Build lookup map: tool_use_id -> (read_op, write_op, prev_read_op)
    dedup_lookup = {read.tool_use_id: (read, write, prev_read) for read, write, prev_read in duplicates}

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
                    read_op, write_op, prev_read_op = dedup_lookup[tool_use_id]
                    original_content = item.get('content', '')
                    bytes_count = len(original_content.encode('utf-8'))
                    total_bytes += bytes_count

                    # Choose marker based on deduplication reason
                    if write_op:
                        marker = f"<DEDUPLICATION_READ_AFTER_WRITE_MARKER|OMITTED_CHARS_COUNT:{bytes_count}>"
                    else:
                        marker = f"<DEDUPLICATION_MULTIPLE_READS_MARKER|OMITTED_CHARS_COUNT:{bytes_count}>"
                    item['content'] = marker

    return messages, total_bytes

def generate_report(
    duplicates: list[tuple[ReadOp, Optional[WriteOp], Optional[ReadOp]]],
    total_bytes: int,
    dry_run: bool = False,
    short_output: bool = False,
    token_ratio: Optional[int] = None
) -> str:
    """Generate a report of deduplication"""
    if short_output:
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
    for read_op, write_op, prev_read_op in duplicates:
        filepath = read_op.filepath
        if filepath not in by_file:
            by_file[filepath] = []
        by_file[filepath].append((read_op, write_op, prev_read_op))

    if duplicates:
        report_lines.append("\n--- Duplicates by file ---")
        for filepath, ops in sorted(by_file.items()):
            report_lines.append(f"\n{filepath}:")
            for i, (read_op, write_op, prev_read_op) in enumerate(ops, 1):
                bytes_count = len(read_op.content.encode('utf-8'))
                if write_op:
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
    total_bytes = sum(len(read_op.content.encode('utf-8')) for read_op, _, _ in duplicates)
    estimated_tokens = None

    if duplicates:
        # Group duplicates by file and calculate per-file tokens
        files_with_duplicates = {}
        for read_op, _, _ in duplicates:
            if read_op.filepath not in files_with_duplicates:
                files_with_duplicates[read_op.filepath] = 0
            files_with_duplicates[read_op.filepath] += len(read_op.content.encode('utf-8'))

        # Calculate tokens for each file
        total_estimated_tokens = 0
        for filepath, file_bytes in files_with_duplicates.items():
            ratio = extract_token_ratio_for_file(messages, filepath)
            if ratio and ratio > 0:
                total_estimated_tokens += int(file_bytes * ratio)

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
