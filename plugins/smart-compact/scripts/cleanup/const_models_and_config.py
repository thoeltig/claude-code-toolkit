from pathlib import Path
import subprocess
import sys
import os
from dataclasses import dataclass
from enum import Enum
from typing import Optional


# Lines where markers appear:
# cleanup_conversation.py line 111, 161, 211
PARTIAL_DEDUP_MARKER = "[...Partial duplicate omitted - latest version contains complete content...]"
DUPLICATE_READ_MARKER = "[...Duplicate read omitted - latest version below contains complete content...]"
DUPLICATE_SCRIPT_MARKER = "[...Duplicate script output omitted - latest version below contains complete output...]"


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
class BashOperation:
    """Represents a Bash command execution that reads content."""
    op_type: str = "bash"
    tool_use_id: str = ""
    command: str = ""  # Full bash command
    content: str = ""  # Output from tool_result
    filepath: Optional[str] = None  # Extracted from cat/head/tail commands
    message_position: int = 0
    content_type: ContentType = ContentType.MULTILINE
    raw_content: str = ""  # Raw output (without formatting)


@dataclass
class GrepOperation:
    """Represents a Grep search operation."""
    op_type: str = "grep"
    tool_use_id: str = ""
    pattern: str = ""
    filepath: str = ""  # Single file for MVP (not glob patterns)
    content: str = ""  # Matched lines output
    message_position: int = 0
    content_type: ContentType = ContentType.MULTILINE
    affected_lines: set = None  # Set of line numbers from grep output


@dataclass
class EditOperation:
    """Represents an Edit operation (tracked for edit-overlap detection)."""
    op_type: str = "edit"
    tool_use_id: str = ""
    filepath: str = ""
    old_string: str = ""
    new_string: str = ""
    message_position: int = 0
    old_start_line: int = 0  # Line where change starts (1-indexed)
    old_line_count: int = 0  # Number of lines affected


@dataclass
class DedupAction:
    """Action to take for a read operation."""
    tool_use_id: str
    action: str  # "full_dedup", "partial_dedup", or "keep"
    replacement: Optional[str] = None  # For partial dedup
    bytes_removed: int = 0
    op_type: str = ""  # "read", "bash" - for correct marker text


class Logger:
    """Simple debug logger."""

    def __init__(self, debug: bool = False):
        self.debug = debug

    def log(self, msg: str):
        """Print debug message if debug mode enabled."""
        if self.debug:
            print(f"[DEBUG] {msg}", file=sys.stderr)


def get_duplicate_bytes_and_token_estimate(transcript_path: str) -> tuple[int, int | None]:
    """Run cleanup_conversation.py with --dry-run-short and extract savings.

    Returns tuple of (bytes_saved, estimated_tokens or None)
    Returns (0, None) if no savings or command fails.
    """
    script_path = Path(__file__).parent / 'cleanup_conversation.py'

    try:
        result = subprocess.run(
            [sys.executable, str(script_path), transcript_path, '--dry-run-short'],
            capture_output=True,
            text=True,
            timeout=15
        )

        if result.returncode != 0:
            return 0, None

        output = result.stdout.strip()
        if not output.startswith('Savings: '):
            return 0, None

        # Parse: "Savings: 15422 bytes (~14457 tokens)" or "Savings: 15422 bytes"
        savings_part = output.replace('Savings: ', '').strip()

        # Extract bytes
        bytes_match = savings_part.split(' ')[0]
        try:
            bytes_saved = int(bytes_match)
        except ValueError:
            return 0, None

        # Extract tokens if present
        estimated_tokens = None
        if '(~' in savings_part and ' tokens' in savings_part:
            try:
                token_start = savings_part.index('(~') + 2
                token_end = savings_part.index(' tokens', token_start)
                estimated_tokens = int(savings_part[token_start:token_end])
            except (ValueError, IndexError):
                pass
            
        if estimated_tokens is None:
            # Calculate tokens using standard conversion (~4 bytes ≈ 1 token)
            # Ignore the cleanup script's estimate as it's inflated by caching overhead
            # This is an estimate; actual token count varies by content type
            estimated_tokens = bytes_saved // 4

        return bytes_saved, estimated_tokens

    except (subprocess.TimeoutExpired, Exception):
        return 0, None


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


def get_cache_duration_minutes() -> int:
    """Get cache duration from environment variable or use default.

    Reads SMART_COMPACT_CACHE_DURATION_MINUTES environment variable.
    Falls back to 5 minutes if not set or invalid.

    Returns cache duration in minutes as integer.
    """
    default_duration = 5
    env_value = os.getenv('SMART_COMPACT_CACHE_DURATION_MINUTES')

    if env_value is None:
        return default_duration

    try:
        duration = int(env_value)
        if duration > 0:
            return duration
    except (ValueError, TypeError):
        pass

    return default_duration


def get_context_window_tokens() -> int:
    """Get context window size from environment variable or use default.

    Reads SMART_COMPACT_CONTEXT_WINDOW_TOKENS environment variable.
    Falls back to 200k (200,000 tokens) if not set or invalid.
    Valid range: 200k to 1M tokens.

    Returns context window size in tokens as integer.
    """
    default_size = 200_000
    max_size = 1_000_000
    env_value = os.getenv('SMART_COMPACT_CONTEXT_WINDOW_TOKENS')

    if env_value is None:
        return default_size

    try:
        size = int(env_value)
        if default_size <= size <= max_size:
            return size
    except (ValueError, TypeError):
        pass

    return default_size


def get_cache_validator_threshold() -> float:
    """Get cache validator blocking threshold as percentage of context window.

    Reads SMART_COMPACT_CACHE_VALIDATOR_THRESHOLD_PERCENT environment variable.
    Falls back to 0% (always block if stale) if not set or invalid.

    Returns threshold as percentage (0-100).
    """
    default_threshold = 0.0
    env_value = os.getenv('SMART_COMPACT_CACHE_VALIDATOR_THRESHOLD_PERCENT')

    if env_value is None:
        return default_threshold

    try:
        threshold = float(env_value)
        if 0 <= threshold <= 100:
            return threshold
    except (ValueError, TypeError):
        pass

    return default_threshold


def get_notification_threshold() -> float:
    """Get notification threshold as percentage of context window.

    Reads SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT environment variable.
    Falls back to 10% if not set or invalid.

    Returns threshold as percentage (0-100).
    """
    default_threshold = 15.0
    env_value = os.getenv('SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT')

    if env_value is None:
        return default_threshold

    try:
        threshold = float(env_value)
        if 0 <= threshold <= 100:
            return threshold
    except (ValueError, TypeError):
        pass

    return default_threshold