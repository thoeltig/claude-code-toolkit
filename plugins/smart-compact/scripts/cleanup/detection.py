import re
from typing import Optional

from cleanup.const_models_and_config import EditOperation


def extract_line_numbers_from_grep(grep_output: str) -> set:
    """Extract line numbers from grep output.

    Handles patterns like:
    - file.py:42:matched content
    - 42:matched content
    - filename:42:content
    - Just content (no line numbers)

    Returns set of affected line numbers, or empty set if not found.
    """
    lines = set()
    # Try to match line:content or filename:line:content patterns
    for line in grep_output.split('\n'):
        if not line.strip():
            continue

        # Pattern: digits followed by colon (could be line number)
        # Match file.txt:123:content or just 123:content
        match = re.match(r'(?:[^:]+:)?(\d+):', line)
        if match:
            try:
                line_num = int(match.group(1))
                lines.add(line_num)
            except (ValueError, IndexError):
                pass

    return lines


def edit_overlaps_with_lines(edit_op: 'EditOperation', grep_lines: set) -> bool:
    """Check if edit operation overlaps with grep-affected lines.

    Edit spans lines [old_start_line, old_start_line + old_line_count).
    Returns True if any grep line falls in this range.
    """
    if not grep_lines or edit_op.old_line_count == 0:
        return False

    edit_range = set(range(edit_op.old_start_line,
                          edit_op.old_start_line + edit_op.old_line_count))

    return bool(grep_lines & edit_range)  # Check intersection


def extract_filepath_from_bash_command(command: str) -> Optional[str]:
    """Extract filepath from bash file-reading commands.

    Supports patterns for:
    - cat file / cat /path/to/file
    - head [-n N] file / tail [-n N] file / tail -f file
    - wc [-lcw] file (word count - also reads file)
    - Works with pipes and redirects: cat file | grep pattern
    - Works in bash -c: bash -c "cat file"

    Returns filepath or None if pattern not detected.
    """
    # Patterns ordered by specificity (more specific first)
    patterns = [
        # bash -c "COMMAND [flags] file" (quoted versions)
        r'bash\s+-c\s+["\'](?:cat|head|tail|wc)\s+(?:-[nf]+\s+\d+\s+)?([^"\'\s|>]+)',
        r'bash\s+-c\s+["\'](?:head|tail)\s+-\d+\s+([^"\'\s|>]+)',

        # Direct commands with flags (head -n 10 file)
        r'(?:cat)\s+([^\s|>;]+)',
        r'(?:head|tail)\s+(?:-n\s+\d+\s+|-\d+\s+|-f\s+)?([^\s|>;]+)',
        r'(?:wc)\s+(?:-[lcw]+\s+)?([^\s|>;]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, command)
        if match:
            filepath = match.group(1).strip('\'"')
            # Only accept if it looks like a path (not a flag starting with -)
            if filepath and not filepath.startswith('-'):
                return filepath

    return None


def is_script_invocation(command: str) -> bool:
    """Detect if bash command is a script execution (not file-read).

    Recognizes: python, npm, node, dotnet, ruby, java, go run, etc.
    Returns True if command appears to run a script (has output to capture).
    """
    # Script runner patterns - order by priority
    script_patterns = [
        # Direct script runners
        r'\b(?:python|python3|node|ruby|java|go|dotnet)\b',
        # npm/npx commands
        r'\b(?:npm|npx)\s+',
        # bash -c "script command"
        r'bash\s+-c\s+["\'](?:python|npm|node|dotnet|ruby|java|go)',
    ]

    for pattern in script_patterns:
        if re.search(pattern, command, re.IGNORECASE):
            return True

    return False