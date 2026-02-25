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
from pathlib import Path
from datetime import datetime, timezone

from cleanup import (
    get_duplicate_bytes_and_token_estimate, get_cache_duration_minutes, get_cache_validator_threshold, get_context_window_tokens
)

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
        bytes_saved, estimated_tokens = get_duplicate_bytes_and_token_estimate(transcript_path)

        if not bytes_saved == 0:
            sys.exit(0)

        # Check threshold: only block if savings exceed threshold
        threshold = get_cache_validator_threshold()
        context_window = get_context_window_tokens()
        percentage = (estimated_tokens / context_window) * 100

        if percentage >= threshold:
            error_msg = f"Cache invalidated and conversation contains duplicate file reads. Exit and resume session to clear {bytes_saved} bytes (~{estimated_tokens} tokens) from context."
            print(error_msg, file=sys.stderr)
            sys.exit(2)

        sys.exit(0)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
