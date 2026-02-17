#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Notification hook to inform user about duplicate tokens in conversation.

Queries transcript for duplicate tokens and shows:
- Bytes wasted
- Estimated tokens
- Percentage of context window

Configurable context window size via environment variable.
"""

import json
import sys
import subprocess
import os
from pathlib import Path
from datetime import datetime, timezone


def get_context_window_tokens() -> int:
    """Get context window size in tokens from environment variable or use default.

    Reads SMART_COMPACT_CONTEXT_WINDOW_TOKENS environment variable.
    Falls back to 200k (200,000 tokens) if not set or invalid.
    Valid range: 50k to 2M tokens.

    Returns context window size in tokens as integer.
    """
    default_size = 200_000
    min_size = 50_000
    max_size = 2_000_000
    env_value = os.getenv('SMART_COMPACT_CONTEXT_WINDOW_TOKENS')

    if env_value is None:
        return default_size

    try:
        size = int(env_value)
        if min_size <= size <= max_size:
            return size
    except (ValueError, TypeError):
        pass

    return default_size


def get_notification_threshold() -> float:
    """Get notification threshold as percentage of context window.

    Reads SMART_COMPACT_NOTIFICATION_THRESHOLD_PERCENT environment variable.
    Falls back to 15% if not set or invalid.

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


def format_bytes(bytes_val: int) -> str:
    """Format bytes as human-readable string (KB, MB, K).

    Args:
        bytes_val: Number of bytes

    Returns:
        Formatted string like "15.4 KB" or "1.2 MB"
    """
    if bytes_val >= 1_000_000:
        return f"{bytes_val / 1_000_000:.1f}M"
    elif bytes_val >= 1_000:
        return f"{bytes_val / 1_000:.1f}K"
    else:
        return str(bytes_val)


def format_tokens(tokens: int) -> str:
    """Format tokens as human-readable string (K for thousands).

    Args:
        tokens: Number of tokens

    Returns:
        Formatted string like "14.5K" or "523"
    """
    if tokens >= 1_000:
        return f"{tokens / 1_000:.1f}K"
    else:
        return str(tokens)


def parse_hook_message(hook_json: str) -> dict:
    """Parse hook JSON from stdin."""
    hook_data = json.loads(hook_json)
    required = ['session_id', 'transcript_path']
    missing = [f for f in required if f not in hook_data]
    if missing:
        raise KeyError(f"Missing required fields: {missing}")
    return hook_data


def get_duplicate_info(transcript_path: str) -> tuple[int, int | None]:
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
            timeout=10
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

        # Calculate tokens using standard conversion (~4 bytes ≈ 1 token)
        # Ignore the cleanup script's estimate as it's inflated by caching overhead
        # This is an estimate; actual token count varies by content type
        estimated_tokens = bytes_saved // 4

        return bytes_saved, estimated_tokens

    except (subprocess.TimeoutExpired, Exception):
        return 0, None


def send_notification(message: str) -> bool:
    """Send notification via cross-platform-notification plugin.

    Args:
        message: Notification message to send

    Returns:
        True if notification sent successfully, False otherwise
    """
    # Find notifier script using glob to handle version directories
    cache_dir = Path(__file__).parent.parent.parent.parent
    notifier_patterns = list(cache_dir.glob('cross-platform-notification/*/scripts/claude_code_notifier.py'))

    if not notifier_patterns:
        return False

    notifier_script = notifier_patterns[0]

    try:
        notification_data = json.dumps({'message': message})
        result = subprocess.run(
            [sys.executable, str(notifier_script)],
            input=notification_data,
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, Exception):
        return False


def main():
    """Main hook logic."""
    try:
        # Read hook JSON from stdin
        if sys.stdin.isatty():
            sys.exit(0)

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

        # Get duplicate info
        bytes_saved, estimated_tokens = get_duplicate_info(transcript_path)

        if bytes_saved == 0:
            sys.exit(0)

        # Calculate percentage and threshold check only if tokens are available
        threshold = get_notification_threshold()
        should_notify = False
        percentage = None

        if estimated_tokens is not None:
            # Tokens available: calculate percentage from tokens
            context_window_tokens = get_context_window_tokens()
            percentage = (estimated_tokens / context_window_tokens) * 100
            should_notify = percentage >= threshold
        else:
            # No tokens: always notify (user's call to look at it)
            should_notify = True

        if not should_notify:
            sys.exit(0)

        # Format message
        formatted_bytes = format_bytes(bytes_saved)

        if estimated_tokens is not None and percentage is not None:
            # Show detailed format with tokens and percentage
            formatted_tokens = format_tokens(estimated_tokens)
            message = f"Duplication in conversation: {formatted_bytes} characters ({formatted_tokens} tokens, {percentage:.1f}% of context window)"
        else:
            # Show simple format with just characters
            message = f"Duplication in conversation: {formatted_bytes} characters"

        # Send notification
        send_notification(message)
        sys.exit(0)

    except Exception as e:
        # Silently fail for notification issues
        sys.exit(0)


if __name__ == '__main__':
    main()
