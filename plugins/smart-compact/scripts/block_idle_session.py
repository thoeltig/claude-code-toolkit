#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UserPromptSubmit hook to validate transcript cache staleness and detect savings.

Checks if:
1. Transcript is stale (last Claude message > 5 minutes old)
2. If stale, checks if deduplication would save bytes

If both conditions met, blocks user prompt with savings info.
"""

import json
import sys
import subprocess
import os
from pathlib import Path
from datetime import datetime, timezone


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


CACHE_DURATION_MINUTES = get_cache_duration_minutes()


def parse_hook_message(hook_json: str) -> dict:
    """Parse hook JSON from stdin."""
    hook_data = json.loads(hook_json)
    required = ['session_id', 'transcript_path']
    missing = [f for f in required if f not in hook_data]
    if missing:
        raise KeyError(f"Missing required fields: {missing}")
    return hook_data


def get_last_claude_message_time(transcript_path: str) -> datetime | None:
    """Extract timestamp of last Claude assistant message by reading from file end.

    Reads from end of file backwards until finding an assistant message.
    Minimal memory usage - stops as soon as message found.

    Returns None if no Claude message found or timestamp missing.
    """
    try:
        with open(transcript_path, 'r', encoding='utf-8') as f:
            f.seek(0, 2)
            file_size = f.tell()
            position = file_size
            chunk_size = 4096
            buffer = ''

            # Read backwards in chunks until finding assistant message
            while position > 0:
                read_size = min(chunk_size, position)
                position -= read_size
                f.seek(position)
                chunk = f.read(read_size)
                buffer = chunk + buffer

                # Try to find assistant message in buffer
                lines = buffer.split('\n')
                for line in reversed(lines[:-1]):  # Skip incomplete last line
                    if not line.strip():
                        continue

                    try:
                        msg = json.loads(line)
                        if msg.get('type') == 'assistant':
                            msg_obj = msg.get('message', {})
                            if msg_obj.get('role') == 'assistant':
                                timestamp_str = msg.get('timestamp')
                                if timestamp_str:
                                    return datetime.fromisoformat(
                                        timestamp_str.replace('Z', '+00:00')
                                    )
                    except (json.JSONDecodeError, ValueError, AttributeError):
                        continue

                # Keep incomplete last line for next iteration
                buffer = lines[-1]

    except (IOError, OSError):
        pass

    return None


def is_stale(last_message_time: datetime) -> bool:
    """Check if last message is older than cache duration."""
    now = datetime.now(timezone.utc)
    age_minutes = (now - last_message_time).total_seconds() / 60
    return age_minutes > CACHE_DURATION_MINUTES


def get_savings(transcript_path: str) -> tuple[str | None, int]:
    """Run dedup with --dry-run-short and extract savings message and bytes.

    Returns tuple of (savings_message, bytes_saved)
    savings_message: e.g., "15422 bytes (~12 tokens)" or None if fails
    bytes_saved: number of bytes or 0 if fails
    """
    script_path = Path(__file__).parent.parent / 'scripts' / 'cleanup_conversation.py'

    try:
        result = subprocess.run(
            [sys.executable, str(script_path), transcript_path, '--dry-run-short'],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            return None, 0

        output = result.stdout.strip()
        if output.startswith('Savings: '):
            savings_part = output.replace('Savings: ', '').strip()
            # Extract bytes: "15422 bytes (~12 tokens)" or "15422 bytes"
            try:
                bytes_str = savings_part.split(' ')[0]
                bytes_saved = int(bytes_str)
                return savings_part, bytes_saved
            except (ValueError, IndexError):
                return savings_part, 0

    except (subprocess.TimeoutExpired, Exception):
        return None, 0

    return None, 0


def main():
    """Main hook logic."""
    try:
        # Read hook JSON from stdin
        if sys.stdin.isatty():
            print("Error: Expected hook JSON from stdin", file=sys.stderr)
            sys.exit(1)

        if hasattr(sys.stdin, 'buffer'):
            hook_json = sys.stdin.buffer.read().decode('utf-8')
        else:
            hook_json = sys.stdin.read()

        if not hook_json.strip():
            sys.exit(0)

        hook_data = parse_hook_message(hook_json)
        transcript_path = hook_data.get('transcript_path', '')

        if not Path(transcript_path).exists():
            sys.exit(0)

        # Get last Claude message timestamp (reads file backwards efficiently)
        last_message_time = get_last_claude_message_time(transcript_path)

        if not last_message_time:
            sys.exit(0)

        # Check if stale
        if not is_stale(last_message_time):
            sys.exit(0)

        # Stale - check for savings
        savings_msg, bytes_saved = get_savings(transcript_path)

        if not savings_msg or bytes_saved == 0:
            sys.exit(0)

        # Check threshold: only block if savings exceed threshold
        threshold = get_cache_validator_threshold()
        context_window = get_context_window_tokens()
        percentage = (bytes_saved / context_window) * 100

        if percentage >= threshold:
            error_msg = f"Cache invalidated and conversation contains duplicate file reads. Exit and resume session to clear {savings_msg} from context."
            print(error_msg, file=sys.stderr)
            sys.exit(2)

        sys.exit(0)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
