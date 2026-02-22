#!/usr/bin/env python3
"""Generate a test transcript with Read, Write, Bash, Grep, and Edit operations."""

import json
import uuid
from datetime import datetime

def create_message(type_val, role=None, content=None, tool_use=None, tool_result=None, tool_use_result=None):
    """Helper to create message objects."""
    msg = {
        "type": type_val,
        "uuid": str(uuid.uuid4()),
        "timestamp": datetime.now().isoformat() + "Z",
    }

    if type_val == "assistant":
        msg["message"] = {
            "role": "assistant",
            "type": "message",
            "content": content or []
        }
        msg["requestId"] = f"req_{uuid.uuid4()}"
    elif type_val == "user":
        msg["message"] = {
            "role": "user",
            "content": content or []
        }
        if tool_use_result:
            msg["toolUseResult"] = tool_use_result

    return msg


def create_write_operation(filepath, content):
    """Create a Write tool_use operation."""
    tool_id = f"write_{uuid.uuid4().hex[:8]}"

    # Assistant message with Write tool_use
    assistant_msg = create_message("assistant", content=[
        {
            "type": "tool_use",
            "id": tool_id,
            "name": "Write",
            "input": {
                "file_path": filepath,
                "content": content
            }
        }
    ])

    # User message with tool_result
    user_msg = create_message("user", content=[
        {
            "type": "tool_result",
            "tool_use_id": tool_id,
            "content": f"File created successfully at: {filepath}"
        }
    ])

    return assistant_msg, user_msg


def create_read_operation(filepath, file_content):
    """Create a Read tool_use operation."""
    tool_id = f"read_{uuid.uuid4().hex[:8]}"

    # Format content with line numbers
    lines = file_content.split('\n')
    formatted_lines = [f"     {i+1}→{line}" for i, line in enumerate(lines)]
    formatted_content = '\n'.join(formatted_lines)

    # Assistant message with Read tool_use
    assistant_msg = create_message("assistant", content=[
        {
            "type": "tool_use",
            "id": tool_id,
            "name": "Read",
            "input": {
                "file_path": filepath
            }
        }
    ])

    # User message with tool_result
    user_msg = create_message("user", content=[
        {
            "type": "tool_result",
            "tool_use_id": tool_id,
            "content": formatted_content
        }
    ], tool_use_result={
        "type": "text",
        "file": {
            "filePath": filepath,
            "content": file_content,
            "numLines": len(lines),
            "startLine": 1,
            "totalLines": len(lines)
        }
    })

    return assistant_msg, user_msg


def create_bash_operation(command, output):
    """Create a Bash tool_use operation."""
    tool_id = f"bash_{uuid.uuid4().hex[:8]}"

    # Assistant message with Bash tool_use
    assistant_msg = create_message("assistant", content=[
        {
            "type": "tool_use",
            "id": tool_id,
            "name": "Bash",
            "input": {
                "command": command
            }
        }
    ])

    # User message with tool_result
    user_msg = create_message("user", content=[
        {
            "type": "tool_result",
            "tool_use_id": tool_id,
            "content": output
        }
    ])

    return assistant_msg, user_msg


def create_grep_operation(filepath, pattern, grep_output, with_line_numbers=True, start_line=1):
    """Create a Grep tool_use operation.

    If with_line_numbers=True, format output as filename:line:content
    to allow line number extraction for smart overlap detection.
    """
    tool_id = f"grep_{uuid.uuid4().hex[:8]}"

    # Format grep output with line numbers if requested
    if with_line_numbers and grep_output:
        lines = grep_output.split('\n')
        formatted_lines = []
        for i, line in enumerate(lines, start=start_line):
            if line.strip():
                formatted_lines.append(f"{filepath}:{i}:{line}")
        formatted_grep_output = '\n'.join(formatted_lines)
    else:
        formatted_grep_output = grep_output

    # Assistant message with Grep tool_use
    assistant_msg = create_message("assistant", content=[
        {
            "type": "tool_use",
            "id": tool_id,
            "name": "Grep",
            "input": {
                "pattern": pattern,
                "path": filepath
            }
        }
    ])

    # User message with tool_result
    user_msg = create_message("user", content=[
        {
            "type": "tool_result",
            "tool_use_id": tool_id,
            "content": formatted_grep_output
        }
    ])

    return assistant_msg, user_msg


def create_edit_operation(filepath, old_string, new_string, old_start_line=1, old_lines_affected=1):
    """Create an Edit tool_use operation with proper structuredPatch.

    Args:
        old_start_line: 1-indexed line where change starts
        old_lines_affected: number of lines affected by the change
    """
    tool_id = f"edit_{uuid.uuid4().hex[:8]}"

    # Assistant message with Edit tool_use
    assistant_msg = create_message("assistant", content=[
        {
            "type": "tool_use",
            "id": tool_id,
            "name": "Edit",
            "input": {
                "file_path": filepath,
                "old_string": old_string,
                "new_string": new_string,
                "replace_all": False
            }
        }
    ])

    # User message with tool_result including structuredPatch
    user_msg = create_message("user", content=[
        {
            "type": "tool_result",
            "tool_use_id": tool_id,
            "content": f"The file {filepath} has been updated successfully."
        }
    ], tool_use_result={
        "filePath": filepath,
        "oldString": old_string,
        "newString": new_string,
        "originalFile": "",  # Simplified for test
        "structuredPatch": [
            {
                "oldStart": old_start_line,
                "oldLines": old_lines_affected,
                "newStart": old_start_line,
                "newLines": old_lines_affected,
                "lines": []
            }
        ],
        "userModified": False,
        "replaceAll": False
    })

    return assistant_msg, user_msg


def main():
    messages = []

    # Test scenario: config.json file with read/grep/bash operations
    config_v1 = '{\n  "debug": false,\n  "port": 8080,\n  "timeout": 30\n}'
    config_v2 = '{\n  "debug": true,\n  "port": 8080,\n  "timeout": 30\n}'
    config_v3 = '{\n  "debug": true,\n  "port": 9000,\n  "timeout": 30\n}'

    filepath = "test_config.json"

    # 1. Write initial config
    print("1. Writing initial config...")
    a_msg, u_msg = create_write_operation(filepath, config_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 2. Read config (1st read)
    print("2. Reading config (1st)...")
    a_msg, u_msg = create_read_operation(filepath, config_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 3. Grep for "debug" in config (line 1)
    print("3. Grep for 'debug' pattern...")
    grep_output = '  "debug": false,'
    a_msg, u_msg = create_grep_operation(filepath, "debug", grep_output, with_line_numbers=True)
    messages.append(a_msg)
    messages.append(u_msg)

    # 4. Read config again (should be full dedup - identical)
    print("4. Reading config again (should dedup)...")
    a_msg, u_msg = create_read_operation(filepath, config_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 5. Edit config (change debug to true on line 1)
    print("5. Editing config (debug: false -> true)...")
    a_msg, u_msg = create_edit_operation(filepath, '"debug": false,', '"debug": true,', old_start_line=1, old_lines_affected=1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 6. Read config after edit
    print("6. Reading config after edit...")
    a_msg, u_msg = create_read_operation(filepath, config_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # 7. Bash cat (read with cat command)
    print("7. Bash cat (read config via cat)...")
    bash_output = config_v2  # Same as current file content
    a_msg, u_msg = create_bash_operation('bash -c "cat test_config.json"', bash_output)
    messages.append(a_msg)
    messages.append(u_msg)

    # 8. Read config again (should detect bash just read same content)
    print("8. Reading config again (should dedup after bash)...")
    a_msg, u_msg = create_read_operation(filepath, config_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # 9. Edit config again (change port on line 2)
    print("9. Editing config (port 8080 -> 9000)...")
    a_msg, u_msg = create_edit_operation(filepath, '"port": 8080,', '"port": 9000,', old_start_line=2, old_lines_affected=1)
    messages.append(a_msg)
    messages.append(u_msg)

    # 10. Grep for "port" (line 2 - should dedup, no overlapping edits)
    print("10. Grep for 'port' pattern...")
    grep_output_port = '  "port": 9000,'
    a_msg, u_msg = create_grep_operation(filepath, "port", grep_output_port, with_line_numbers=True, start_line=2)
    messages.append(a_msg)
    messages.append(u_msg)

    # 11. Read final config
    print("11. Reading config final...")
    a_msg, u_msg = create_read_operation(filepath, config_v3)
    messages.append(a_msg)
    messages.append(u_msg)

    # 12. Bash cat again (different content than before)
    print("12. Bash cat final...")
    bash_output_final = config_v3
    a_msg, u_msg = create_bash_operation('bash -c "cat test_config.json"', bash_output_final)
    messages.append(a_msg)
    messages.append(u_msg)

    # Save as minified JSONL
    output_path = "test-bash-grep.json"
    print(f"\nSaving {len(messages)} messages to {output_path}...")

    with open(output_path, 'w', encoding='utf-8') as f:
        for msg in messages:
            f.write(json.dumps(msg, separators=(',', ':'), ensure_ascii=False) + '\n')

    print(f"[OK] Test transcript created: {output_path}")
    print(f"  Total messages: {len(messages)}")
    print(f"  Expected dedup operations:")
    print(f"    - Read after identical Read (1 dedup)")
    print(f"    - Bash-cat identical to previous Read (1 dedup)")
    print(f"    - Read after Bash-cat with same content (1 dedup)")
    print(f"    - Grep with later Read (potentially safe to dedup)")


if __name__ == '__main__':
    main()
