#!/usr/bin/env python3
"""SessionStart Hook: Check for session-protocol.json file.

Notifies user if a session protocol from a previous session exists.
Uses official Claude Code hook response schema with structured JSON in additionalContext.
"""
import json
import sys
from pathlib import Path


def check_session_protocol_exists() -> bool:
    """Check if session-protocol.json exists in current directory.

    Returns:
        True if session-protocol.json exists, False otherwise
    """
    session_protocol_path = Path('session-protocol.json')
    return session_protocol_path.exists()


def create_hook_response() -> dict:
    """Create official hook response schema with structured additionalContext.

    Returns:
        Dictionary containing the complete hook response
    """
    # Structured data for Claude to parse
    additional_context_data = {
        "severity": "info",
        "assistant_action": "inform_and_wait",
        "assistant_instruction": "Inform the user that a protocol of a previous session exists. Wait for the user to decide if they want to load it. When the user decides to load it invoke the /managing-session-continuity skill and use 'WF2: Load Context' before reading 'session-protocol.json'.",
        "user_message": "A protocol of a previous session exists. Do you want to load it into context or continue without it?"
    }

    # Official Claude Code hook response schema
    response = {
        "continue": True,
        "suppressOutput": False,
        "systemMessage": "Found a protocol of a previous session",
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": json.dumps(additional_context_data)
        }
    }

    return response


def main() -> int:
    """Main entry point for the SessionStart hook.

    Returns:
        Exit code: 0 for success
    """
    # Ensure UTF-8 encoding for emoji support on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    if check_session_protocol_exists():
        response = create_hook_response()
        print(json.dumps(response, ensure_ascii=False))

    return 0


if __name__ == '__main__':
    sys.exit(main())
