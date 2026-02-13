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
from pathlib import Path
from datetime import datetime, timezone

CACHE_DURATION_MINUTES = 5


def parse_hook_message(hook_json: str) -> dict:
    """Parse hook JSON from stdin."""
    hook_data = json.loads(hook_json)
    required = ['session_id', 'transcript_path']
    missing = [f for f in required if f not in hook_data]
    if missing:
        raise KeyError(f"Missing required fields: {missing}")
    return hook_data


def load_transcript(filepath: str) -> list[dict]:
    """Load transcript file (handles minified JSONL and pretty-printed JSON)."""
    messages = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try as single JSON array first
    if content.strip().startswith('['):
        try:
            messages = json.loads(content)
            return messages
        except json.JSONDecodeError:
            pass

    # Parse as newline-delimited JSON objects
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


def get_last_claude_message_time(messages: list[dict]) -> datetime | None:
    """Extract timestamp of last Claude assistant message.

    Returns None if no Claude message found or timestamp missing.
    """
    for msg in reversed(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        timestamp_str = msg.get('timestamp')
        if timestamp_str:
            try:
                return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                continue

    return None


def is_stale(last_message_time: datetime) -> bool:
    """Check if last message is older than cache duration."""
    now = datetime.now(timezone.utc)
    age_minutes = (now - last_message_time).total_seconds() / 60
    return age_minutes > CACHE_DURATION_MINUTES


def get_savings(transcript_path: str) -> int | None:
    """Run dedup with --dry-run-short and extract savings bytes.

    Returns bytes saved, or None if dedup script fails.
    """
    script_path = Path(__file__).parent.parent / 'scripts' / 'dedup_transcript.py'

    try:
        result = subprocess.run(
            [sys.executable, str(script_path), transcript_path, '--dry-run-short'],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            return None

        output = result.stdout.strip()
        if output.startswith('Savings: '):
            bytes_str = output.replace('Savings: ', '').replace(' bytes', '').strip()
            try:
                return int(bytes_str)
            except ValueError:
                return None

    except (subprocess.TimeoutExpired, Exception):
        return None

    return None


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

        # Load and check transcript
        messages = load_transcript(transcript_path)
        last_message_time = get_last_claude_message_time(messages)

        if not last_message_time:
            sys.exit(0)

        # Check if stale
        if not is_stale(last_message_time):
            sys.exit(0)

        # Stale - check for savings
        savings = get_savings(transcript_path)

        if savings and savings > 0:
            error_msg = f"Cache invalidated and conversation contains duplicate file reads. Exit and resume session to clear {savings} bytes from context."
            print(error_msg, file=sys.stderr)
            sys.exit(2)

        sys.exit(0)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
