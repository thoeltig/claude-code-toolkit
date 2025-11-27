#!/usr/bin/env python3
"""Claude Code notification system for hook events.

This module reads JSON input from stdin containing Claude Code hook events
and displays platform-specific system notifications. Supports Windows, macOS,
and Linux with appropriate fallback mechanisms.

Environment Variables:
    CLAUDE_NOTIFIER_CUSTOM_MESSAGES: Path to JSON file with custom message overrides
        Example format: {"SessionStart": "Let's go!", "SessionEnd": "Done!"}
"""
import json
import os
import platform
import subprocess
import sys
from pathlib import Path
from typing import Any, Optional


# Default event messages (with emojis)
DEFAULT_EVENT_MESSAGES = {
    'SessionStart': 'Session started 🚀',
    'SessionEnd': 'Session completed ✅',
    'Stop': 'Response finished 🏁',
    'Notification': 'Claude Code notification 🔔'
}

NOTIFICATION_TITLE = 'Claude Code'


def load_custom_messages() -> dict[str, str]:
    """Load custom message overrides from environment variable or config file.

    Returns:
        Dictionary mapping event names to custom messages, empty if none configured

    Note:
        Silently returns empty dict if file doesn't exist or has invalid JSON
    """
    custom_messages_path = os.environ.get('CLAUDE_NOTIFIER_CUSTOM_MESSAGES', '')

    if not custom_messages_path:
        return {}

    try:
        path = Path(custom_messages_path).expanduser()
        if not path.exists():
            return {}

        with open(path, 'r', encoding='utf-8') as f:
            custom = json.load(f)

        # Validate that loaded data is a dictionary
        if not isinstance(custom, dict):
            print(
                f"Warning: Custom messages file contains invalid format (expected dict)",
                file=sys.stderr
            )
            return {}

        return custom
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse custom messages JSON: {e}", file=sys.stderr)
        return {}
    except Exception as e:
        print(f"Warning: Failed to load custom messages: {e}", file=sys.stderr)
        return {}


def read_hook_input() -> dict[str, Any]:
    """Read and parse JSON input from stdin.

    Returns:
        Dictionary containing hook event data with keys like 'message' and 'hook_event_name'

    Raises:
        json.JSONDecodeError: If stdin contains invalid JSON
        ValueError: If stdin is empty
    """
    stdin_data = sys.stdin.read().strip()

    if not stdin_data:
        raise ValueError("No input received from stdin")

    try:
        return json.loads(stdin_data)
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(
            f"Invalid JSON input: {e.msg}",
            e.doc,
            e.pos
        )


def get_notification_message(
    event_data: dict[str, Any],
    custom_messages: dict[str, str]
) -> str:
    """Generate notification message based on event type.

    Args:
        event_data: Dictionary containing 'hook_event_name' and optional 'message'
        custom_messages: Dictionary of custom message overrides by event name

    Returns:
        Formatted notification message (defaults included emojis unless overridden)
    """
    event_name = event_data.get('hook_event_name', 'Notification')
    original_message = event_data.get('message', '')

    # Priority: custom override > original message from hook > default for event type
    if event_name in custom_messages:
        return custom_messages[event_name]
    elif original_message:
        return original_message
    else:
        return DEFAULT_EVENT_MESSAGES.get(
            event_name,
            DEFAULT_EVENT_MESSAGES['Notification']
        )


def notify_macos(message: str) -> bool:
    """Display notification on macOS using terminal-notifier.

    Args:
        message: Notification message to display

    Returns:
        True if notification was sent successfully, False otherwise
    """
    try:
        subprocess.run(
            [
                'terminal-notifier',
                '-title', NOTIFICATION_TITLE,
                '-message', message,
                '-sound', 'default'
            ],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"macOS notification failed: {e}", file=sys.stderr)
        return False


def notify_linux(message: str) -> bool:
    """Display notification on Linux using notify-send.

    Args:
        message: Notification message to display

    Returns:
        True if notification was sent successfully, False otherwise
    """
    try:
        subprocess.run(
            [
                'notify-send',
                NOTIFICATION_TITLE,
                message
            ],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Linux notification failed: {e}", file=sys.stderr)
        return False


def notify_windows(message: str) -> bool:
    """Display notification on Windows using PowerShell toast notifications.

    Args:
        message: Notification message to display

    Returns:
        True if notification was sent successfully, False otherwise
    """
    # Escape single quotes in message for PowerShell
    escaped_message = message.replace("'", "''")
    escaped_title = NOTIFICATION_TITLE.replace("'", "''")

    powershell_script = f"""
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$template = @"
<toast>
    <visual>
        <binding template="ToastText01">
            <text id="1">{escaped_message}</text>
        </binding>
    </visual>
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = New-Object Windows.UI.Notifications.ToastNotification $xml
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('{escaped_title}').Show($toast)
"""

    try:
        subprocess.run(
            ['powershell', '-Command', powershell_script],
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"Windows notification failed: {e}", file=sys.stderr)
        return False


def send_notification(message: str) -> None:
    """Send system notification based on current platform.

    Args:
        message: Notification message to display
    """
    system = platform.system()

    success = False

    if system == 'Darwin':
        success = notify_macos(message)
    elif system == 'Linux':
        success = notify_linux(message)
    elif system == 'Windows':
        success = notify_windows(message)
    else:
        print(f"Unsupported platform: {system}", file=sys.stderr)

    # Fallback to console output if notification failed
    if not success:
        print(f"[{NOTIFICATION_TITLE}] {message}")


def main() -> int:
    """Main entry point for the notifier script.

    Returns:
        Exit code: 0 for success, 1 for error
    """
    try:
        # Load custom message overrides if configured
        custom_messages = load_custom_messages()

        # Read and process hook input
        event_data = read_hook_input()
        message = get_notification_message(event_data, custom_messages)

        # Send notification
        send_notification(message)
        return 0
    except ValueError as e:
        print(f"Input error: {e}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
