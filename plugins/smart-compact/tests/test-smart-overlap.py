#!/usr/bin/env python3
"""Test smart edit overlap detection with a focused scenario."""

import json
import uuid
from datetime import datetime
from generate_bash_grep_test import (
    create_message, create_write_operation, create_read_operation,
    create_grep_operation, create_edit_operation
)

def main():
    messages = []
    filepath = "settings.json"
    config_v1 = '{\n  "theme": "light",\n  "timeout": 30,\n  "debug": false\n}'
    config_v2 = '{\n  "theme": "dark",\n  "timeout": 30,\n  "debug": false\n}'
    config_v3 = '{\n  "theme": "dark",\n  "timeout": 60,\n  "debug": false\n}'

    print("Test Scenario: Smart Edit Overlap Detection")
    print("=" * 60)

    # 1. Write and read initial config
    print("1. Write initial config...")
    a_msg, u_msg = create_write_operation(filepath, config_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("2. Read config (v1)...")
    a_msg, u_msg = create_read_operation(filepath, config_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 3. Grep for "timeout" (line 2) - will test overlap detection
    print("3. Grep for 'timeout' (line 2)...")
    grep_timeout = '  "timeout": 30,'
    a_msg, u_msg = create_grep_operation(filepath, "timeout", grep_timeout,
                                         with_line_numbers=True, start_line=2)
    messages.append(a_msg)
    messages.append(u_msg)

    # 4. Edit "theme" (line 1) - does NOT overlap with grep line 2
    print("4. Edit 'theme' (line 1 - NO OVERLAP with grep line 2)...")
    a_msg, u_msg = create_edit_operation(filepath, '"theme": "light",', '"theme": "dark",',
                                         old_start_line=1, old_lines_affected=1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 5. Read after non-overlapping edit - grep should DEDUP (safe!)
    print("5. Read config after non-overlapping edit (v2)...")
    a_msg, u_msg = create_read_operation(filepath, config_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    print("\n" + "=" * 60)
    print("SCENARIO 2: Grep with OVERLAPPING edit")
    print("=" * 60)

    # 6. Grep for "timeout" again (line 2 in v2)
    print("6. Grep for 'timeout' again (line 2)...")
    grep_timeout2 = '  "timeout": 30,'
    a_msg, u_msg = create_grep_operation(filepath, "timeout", grep_timeout2,
                                         with_line_numbers=True, start_line=2)
    messages.append(a_msg)
    messages.append(u_msg)

    # 7. Edit "timeout" (line 2) - OVERLAPS with grep line 2!
    print("7. Edit 'timeout' (line 2 - OVERLAPS with grep line 2)...")
    a_msg, u_msg = create_edit_operation(filepath, '"timeout": 30,', '"timeout": 60,',
                                         old_start_line=2, old_lines_affected=1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 8. Read after overlapping edit - grep should NOT dedup (unsafe!)
    print("8. Read config after overlapping edit (v3)...")
    a_msg, u_msg = create_read_operation(filepath, config_v3)
    messages.append(a_msg)
    messages.append(u_msg)

    # Save test file
    output_path = "test-smart-overlap.json"
    print("\n" + "=" * 60)
    print(f"Saving {len(messages)} messages to {output_path}...")

    with open(output_path, 'w', encoding='utf-8') as f:
        for msg in messages:
            f.write(json.dumps(msg, separators=(',', ':'), ensure_ascii=False) + '\n')

    print("[OK] Test created!")
    print("\nExpected Results:")
    print("- Scenario 1: Grep (line 2) → Edit (line 1) → Read")
    print("  Edit does NOT overlap grep lines [2] → GREP SHOULD DEDUP")
    print("\n- Scenario 2: Grep (line 2) → Edit (line 2) → Read")
    print("  Edit OVERLAPS grep lines [2] → GREP SHOULD NOT DEDUP")


if __name__ == '__main__':
    main()
