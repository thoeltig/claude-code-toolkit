#!/usr/bin/env python3
"""Generic Hook Wrapper: Execute hook script and conditionally notify.

This generic wrapper executes any hook script that uses the official Claude Code
hook response schema. If output is produced, it extracts the systemMessage field
and triggers a desktop notification. Always returns the complete JSON output from
the wrapped script so Claude can parse the additionalContext field.

Official Hook Response Schema:
    {
        "continue": true,
        "suppressOutput": false,
        "systemMessage": "Notification message",
        "hookSpecificOutput": {
            "hookEventName": "SessionStart|PreCompact|etc",
            "additionalContext": "Structured JSON string for Claude"
        }
    }

Usage:
    python hook-wrapper-with-notification.py <wrapped_script_name>

Arguments:
    wrapped_script_name: Name of the script to execute (e.g., 'sessionstart-quicksave-check.py')
"""
import json
import subprocess
import sys
from pathlib import Path


def get_hook_script_path(script_name: str) -> Path:
    """Get the full path to a hook script.

    Args:
        script_name: Name of the hook script file

    Returns:
        Path object pointing to the script in the scripts directory
    """
    # Scripts are in the same directory as this wrapper
    scripts_dir = Path(__file__).parent
    return scripts_dir / script_name


def execute_wrapped_script(script_name: str) -> tuple[str, int]:
    """Execute the wrapped hook script.

    Args:
        script_name: Name of the script to execute

    Returns:
        Tuple of (output string, exit code)
    """
    script_path = get_hook_script_path(script_name)

    try:
        # Pass stdin to the wrapped script
        stdin_data = sys.stdin.read()

        result = subprocess.run(
            ['python', str(script_path)],
            input=stdin_data,
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'  # Replace invalid UTF-8 sequences instead of crashing
        )

        return result.stdout, result.returncode
    except Exception as e:
        print(f"Error executing wrapped script '{script_name}': {e}", file=sys.stderr)
        return "", 1


def extract_notification_data(output: str) -> tuple[str, str]:
    """Extract notification data from official hook response schema.

    Args:
        output: JSON output from wrapped script

    Returns:
        Tuple of (hook_event_name, system_message), or empty strings if not found
    """
    try:
        # Parse JSON output
        response_data = json.loads(output)

        # Extract systemMessage for notification
        system_message = response_data.get('systemMessage', '')

        # Extract hookEventName from hookSpecificOutput
        hook_specific = response_data.get('hookSpecificOutput', {})
        hook_event_name = hook_specific.get('hookEventName', 'Notification')

        return hook_event_name, system_message

    except json.JSONDecodeError:
        # If JSON parsing fails, return empty values
        return '', ''
    except Exception as e:
        print(f"Warning: Failed to extract notification data: {e}", file=sys.stderr)
        return '', ''


def trigger_notification(hook_event_name: str, system_message: str) -> None:
    """Trigger desktop notification via notifier script.

    Args:
        hook_event_name: The hook event type (e.g., 'SessionStart', 'PreCompact')
        system_message: The system message to display in notification
    """
    notifier_script = get_hook_script_path('claude_code_notifier.py')

    # Create notification hook input
    notification_data = {
        'hook_event_name': hook_event_name,
        'message': system_message
    }

    try:
        subprocess.run(
            ['python', str(notifier_script)],
            input=json.dumps(notification_data),
            capture_output=True,
            text=True,
            encoding='utf-8',
            errors='replace'  # Replace invalid UTF-8 sequences instead of crashing
        )
    except Exception as e:
        print(f"Warning: Failed to send notification: {e}", file=sys.stderr)


def main() -> int:
    """Main entry point for the generic hook wrapper.

    Returns:
        Exit code from the wrapped script
    """
    # Ensure UTF-8 encoding for emoji support on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    # Check command-line arguments
    if len(sys.argv) < 2:
        print(
            "Usage: hook-wrapper-with-notification.py <wrapped_script_name>",
            file=sys.stderr
        )
        return 1

    wrapped_script_name = sys.argv[1]

    # Execute wrapped script
    output, exit_code = execute_wrapped_script(wrapped_script_name)

    # Only trigger notification if there is output
    if output.strip():
        hook_event_name, system_message = extract_notification_data(output)

        # Only trigger notification if systemMessage was found
        if system_message:
            trigger_notification(hook_event_name, system_message)

    # Always return the complete output (JSON response goes to Claude)
    if output:
        print(output, end='')

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
