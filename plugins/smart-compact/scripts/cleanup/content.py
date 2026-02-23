from typing import Optional

from cleanup.const_models_and_config import ContentType, PARTIAL_DEDUP_MARKER


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
    MARKER = PARTIAL_DEDUP_MARKER
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
    MARKER = PARTIAL_DEDUP_MARKER
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