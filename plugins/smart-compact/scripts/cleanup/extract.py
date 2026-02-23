import json

from cleanup.const_models_and_config import (
    FileOperation, BashOperation, GrepOperation, EditOperation, Logger
)
from cleanup.content import detect_content_type
from cleanup.detection import (
    extract_filepath_from_bash_command, is_script_invocation,
    extract_line_numbers_from_grep
)


def load_transcript(filepath: str) -> list[dict]:
    """Load transcript (handles minified JSONL and pretty-printed JSON)."""
    messages = []
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Try as JSON array first
    if content.strip().startswith('['):
        try:
            messages = json.loads(content)
            return messages
        except json.JSONDecodeError:
            pass

    # Parse as newline-delimited JSON
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


def extract_operations(messages: list[dict], logger: Logger) -> dict[str, list[FileOperation]]:
    """Extract Write and Read operations indexed by filepath."""
    ops_by_path = {}

    # Extract Writes
    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Write':
                filepath = item.get('input', {}).get('file_path')
                file_content = item.get('input', {}).get('content')

                if filepath and file_content is not None:
                    op = FileOperation(
                        op_type='write',
                        tool_use_id=item.get('id'),
                        filepath=filepath,
                        content=file_content,
                        message_position=position,
                        content_type=detect_content_type(file_content)
                    )
                    ops_by_path.setdefault(filepath, []).append(op)
                    logger.log(f"Write: {filepath} ({len(file_content)} bytes)")

    # Extract Reads - first pass: map Read tool_use to filepaths
    read_map = {}
    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Read':
                tool_use_id = item.get('id')
                filepath = item.get('input', {}).get('file_path')
                if tool_use_id and filepath:
                    read_map[tool_use_id] = filepath

    # Extract Reads - second pass: get content from tool_result and toolUseResult
    for position, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        # Get raw content from toolUseResult if available
        tool_use_result = msg.get('toolUseResult', {})
        result_raw_content = None
        if isinstance(tool_use_result, dict):
            result_raw_content = tool_use_result.get('file', {}).get('content')

        for item in content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')
                if tool_use_id in read_map:
                    filepath = read_map[tool_use_id]
                    result_content = item.get('content', '')

                    if result_content:
                        op = FileOperation(
                            op_type='read',
                            tool_use_id=tool_use_id,
                            filepath=filepath,
                            content=result_content,
                            message_position=position,
                            content_type=detect_content_type(result_content),
                            raw_content=result_raw_content
                        )
                        ops_by_path.setdefault(filepath, []).append(op)
                        logger.log(f"Read {tool_use_id[:8]}: {filepath} ({len(result_content)} bytes, {op.content_type.value})")

    return ops_by_path


def extract_bash_operations(messages: list[dict], logger: Logger) -> dict[str, list[BashOperation]]:
    """Extract Bash operations that read content (cat, head, tail).

    Returns dict indexed by filepath extracted from bash command.
    """
    ops_by_filepath = {}

    # Map bash tool_use_id to command
    bash_map = {}
    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Bash':
                tool_use_id = item.get('id')
                command = item.get('input', {}).get('command', '')
                if tool_use_id and command:
                    bash_map[tool_use_id] = (command, position)

    # Extract bash output from tool_result
    for position, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')
                if tool_use_id in bash_map:
                    command, bash_position = bash_map[tool_use_id]
                    result_content = item.get('content', '')

                    if not result_content:
                        continue

                    # Check if this is a script invocation or file-read command
                    is_script = is_script_invocation(command)
                    filepath = None

                    if is_script:
                        # Script execution - use special marker for deduplication
                        filepath = "<script>"
                        logger.log(f"Bash {tool_use_id[:8]}: [SCRIPT] {command[:50]} ({len(result_content)} bytes)")
                    else:
                        # Try to extract filepath for file-read commands
                        filepath = extract_filepath_from_bash_command(command)
                        if filepath:
                            logger.log(f"Bash {tool_use_id[:8]}: {filepath} ({len(result_content)} bytes)")

                    # Process if we identified it as script or file-read
                    if filepath:
                        bash_op = BashOperation(
                            tool_use_id=tool_use_id,
                            command=command,
                            content=result_content,
                            filepath=filepath,
                            message_position=position,
                            content_type=detect_content_type(result_content),
                            raw_content=result_content.strip(),
                        )
                        ops_by_filepath.setdefault(filepath, []).append(bash_op)
                        if is_script:
                            # Add content type for logging
                            bash_op.content_type = detect_content_type(result_content)
                            logger.log(f"  -> {bash_op.content_type.value} content")

    return ops_by_filepath


def extract_grep_operations(messages: list[dict], logger: Logger) -> dict[str, list[GrepOperation]]:
    """Extract Grep search operations.

    MVP: Only handles exact file paths (not glob patterns).
    Returns dict indexed by filepath.
    """
    ops_by_filepath = {}

    # Map grep tool_use_id to pattern and filepath
    grep_map = {}
    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Grep':
                tool_use_id = item.get('id')
                pattern = item.get('input', {}).get('pattern', '')
                filepath = item.get('input', {}).get('path')  # Single file path

                # MVP: Skip glob patterns for now
                if tool_use_id and pattern and filepath and '*' not in filepath:
                    grep_map[tool_use_id] = (pattern, filepath, position)

    # Extract grep output from tool_result
    for position, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        msg_obj = msg.get('message', {})
        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')
                if tool_use_id in grep_map:
                    pattern, filepath, grep_position = grep_map[tool_use_id]
                    result_content = item.get('content', '')

                    if result_content:
                        # Extract line numbers from grep output for smart overlap checking
                        affected_lines = extract_line_numbers_from_grep(result_content)

                        grep_op = GrepOperation(
                            tool_use_id=tool_use_id,
                            pattern=pattern,
                            filepath=filepath,
                            content=result_content,
                            message_position=position,
                            content_type=detect_content_type(result_content),
                            affected_lines=affected_lines,
                        )
                        ops_by_filepath.setdefault(filepath, []).append(grep_op)
                        logger.log(f"Grep {tool_use_id[:8]}: {filepath} pattern '{pattern}' ({len(result_content)} bytes, lines: {sorted(affected_lines) if affected_lines else 'unknown'})")

    return ops_by_filepath


def extract_edit_operations(messages: list[dict], logger: Logger) -> dict[str, list[EditOperation]]:
    """Extract Edit operations for edit-overlap detection.

    Extracts line range info from structuredPatch in tool_result for smart overlap checking.
    Returns dict indexed by filepath.
    """
    ops_by_filepath = {}

    # Map edit tool_use_id to filepath (from assistant message)
    edit_map = {}
    for position, msg in enumerate(messages):
        if msg.get('type') != 'assistant':
            continue

        msg_obj = msg.get('message', {})
        if msg_obj.get('role') != 'assistant':
            continue

        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_use' and item.get('name') == 'Edit':
                tool_use_id = item.get('id')
                filepath = item.get('input', {}).get('file_path')
                old_string = item.get('input', {}).get('old_string', '')
                new_string = item.get('input', {}).get('new_string', '')

                if filepath and tool_use_id:
                    edit_map[tool_use_id] = (filepath, old_string, new_string, position)

    # Extract line ranges from tool_result's structuredPatch
    for position, msg in enumerate(messages):
        if msg.get('type') != 'user':
            continue

        # Check toolUseResult for structured patch info
        tool_use_result = msg.get('toolUseResult', {})
        if not tool_use_result or 'structuredPatch' not in tool_use_result:
            continue

        # Find the corresponding edit in this message's tool_results
        msg_obj = msg.get('message', {})
        content = msg_obj.get('content', [])
        if not isinstance(content, list):
            continue

        for item in content:
            if item.get('type') == 'tool_result':
                tool_use_id = item.get('tool_use_id')
                if tool_use_id not in edit_map:
                    continue

                filepath, old_string, new_string, edit_position = edit_map[tool_use_id]

                # Extract line range from structuredPatch
                old_start_line = 0
                old_line_count = 0

                structured_patch = tool_use_result.get('structuredPatch', [])
                if isinstance(structured_patch, list) and structured_patch:
                    # Use first patch entry
                    patch = structured_patch[0]
                    old_start_line = patch.get('oldStart', 0)
                    old_line_count = patch.get('oldLines', 0)

                edit_op = EditOperation(
                    tool_use_id=tool_use_id,
                    filepath=filepath,
                    old_string=old_string,
                    new_string=new_string,
                    message_position=edit_position,
                    old_start_line=old_start_line,
                    old_line_count=old_line_count,
                )
                ops_by_filepath.setdefault(filepath, []).append(edit_op)
                logger.log(f"Edit {tool_use_id[:8]}: {filepath} lines [{old_start_line}-{old_start_line + old_line_count})")

    return ops_by_filepath


def save_transcript(messages: list[dict], filepath: str) -> None:
    """Save transcript as minified JSONL."""
    with open(filepath, 'w', encoding='utf-8') as f:
        for msg in messages:
            f.write(json.dumps(msg, separators=(',', ':'), ensure_ascii=False) + '\n')