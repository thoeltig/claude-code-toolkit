#!/usr/bin/env python3
"""Claude Code notification system for hook events.

This module reads JSON input from stdin containing Claude Code hook events
and displays platform-specific system notifications. Supports Windows, macOS,
and Linux with appropriate fallback mechanisms.
"""
import json
import platform
import subprocess
import sys
from typing import Any

NOTIFICATION_TITLE = 'Claude Code'

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
    event_data: dict[str, Any]
) -> str:
    original_message = event_data.get('message', '')

    if original_message:
        return original_message
    else:
        return 'Claude Code notification 🔔'


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
        # Read and process hook input
        event_data = read_hook_input()
        message = get_notification_message(event_data)

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
