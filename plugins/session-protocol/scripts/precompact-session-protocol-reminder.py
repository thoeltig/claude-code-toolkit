#!/usr/bin/env python3
"""PreCompact Hook: Remind user to save context before compaction.

Warns user when context is about to be compacted and suggests saving state.
Uses official Claude Code hook response schema with structured JSON in additionalContext.
"""
import json
import sys


def create_hook_response() -> dict:
    """Create official hook response schema with structured additionalContext.

    Returns:
        Dictionary containing the complete hook response
    """
    # Structured data for Claude to parse
    additional_context_data = {
        "severity": "critical",
        "assistant_action": "evaluate_and_recommend",
        "assistant_instruction": "Check if there are unfinished todos, active errors, or mid-implementation work. If YES: STRONGLY recommend /save-session-protocol before continuing. If NO: Inform user about compaction and let them decide.",
        "user_message": "Context is full and will be compacted. Run /save-session-protocol if you have unfinished work to preserve.",
        "checks_required": [
            "unfinished_todos",
            "active_errors",
            "mid_implementation"
        ]
    }

    # Official Claude Code hook response schema
    response = {
        "continue": True,
        "suppressOutput": False,
        "systemMessage": "Context compaction imminent - consider saving state",
        "hookSpecificOutput": {
            "hookEventName": "PreCompact",
            "additionalContext": json.dumps(additional_context_data)
        }
    }

    return response


def main() -> int:
    """Main entry point for the PreCompact hook.

    Returns:
        Exit code: 0 for success
    """
    # Ensure UTF-8 encoding for emoji support on Windows
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    response = create_hook_response()
    print(json.dumps(response, ensure_ascii=False))

    return 0


if __name__ == '__main__':
    sys.exit(main())
