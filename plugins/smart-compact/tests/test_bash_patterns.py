#!/usr/bin/env python3
"""Test extended bash pattern detection."""

import sys
import re

# Inline the function for testing
def extract_filepath_from_bash_command(command: str):
    """Extract filepath from bash file-reading commands.

    Supports:
    - cat file / cat /path/to/file
    - head [-n N] file / tail [-n N] file / tail -f file
    - wc file (word count)
    - In bash -c with quotes: bash -c "cat file" or bash -c 'head file'

    Returns filepath or None if not detected.
    """

    # Patterns ordered by specificity (more specific first)
    patterns = [
        # bash -c "COMMAND file" (quoted, with optional flags)
        r'bash\s+-c\s+["\'](?:cat|head|tail|wc)\s+(?:-[nf]\s+\d+\s+)?([^"\'\s|>]+)',
        r'bash\s+-c\s+["\'](?:head|tail)\s+-\d+\s+([^"\'\s|>]+)',

        # Direct commands with optional flags (head -n 10 file)
        r'(?:cat)\s+([^\s|>;]+)',
        r'(?:head|tail)\s+(?:-n\s+\d+\s+|-\d+\s+|-f\s+)?([^\s|>;]+)',
        r'(?:wc)\s+(?:-[lcw]\s+)?([^\s|>;]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, command)
        if match:
            filepath = match.group(1).strip('\'"')
            # Validate it looks like a path (has extension or starts with / or .)
            if filepath and not filepath.startswith('-'):
                return filepath

    return None

def test_pattern(description, command, expected_filepath):
    """Test a single bash pattern."""
    result = extract_filepath_from_bash_command(command)
    status = "[OK]" if result == expected_filepath else "[FAIL]"
    print(f"{status} {description}")
    if result != expected_filepath:
        print(f"     Expected: {expected_filepath}")
        print(f"     Got:      {result}")
    return result == expected_filepath

def main():
    """Run pattern detection tests."""
    print("=" * 70)
    print("EXTENDED BASH PATTERN DETECTION TESTS")
    print("=" * 70)

    tests = [
        # Cat patterns
        ("cat file.txt", 'cat file.txt', 'file.txt'),
        ("cat /path/to/file.log", 'cat /path/to/file.log', '/path/to/file.log'),
        ("bash -c \"cat config.json\"", 'bash -c "cat config.json"', 'config.json'),
        ("bash -c 'cat settings.json'", "bash -c 'cat settings.json'", 'settings.json'),

        # Head patterns
        ("head file.txt", 'head file.txt', 'file.txt'),
        ("head -n 10 file.txt", 'head -n 10 file.txt', 'file.txt'),
        ("head -10 file.txt", 'head -10 file.txt', 'file.txt'),
        ("bash -c \"head -n 5 data.csv\"", 'bash -c "head -n 5 data.csv"', 'data.csv'),
        ("bash -c 'head -5 log.txt'", "bash -c 'head -5 log.txt'", 'log.txt'),

        # Tail patterns
        ("tail file.txt", 'tail file.txt', 'file.txt'),
        ("tail -n 20 file.txt", 'tail -n 20 file.txt', 'file.txt'),
        ("tail -20 file.txt", 'tail -20 file.txt', 'file.txt'),
        ("tail -f log.txt", 'tail -f log.txt', 'log.txt'),
        ("bash -c \"tail -f debug.log\"", 'bash -c "tail -f debug.log"', 'debug.log'),

        # Wc (word count)
        ("wc file.txt", 'wc file.txt', 'file.txt'),
        ("wc -l file.txt", 'wc -l file.txt', 'file.txt'),
        ("bash -c \"wc -w data.txt\"", 'bash -c "wc -w data.txt"', 'data.txt'),

        # Edge cases
        ("cat with pipe (should fail)", 'cat file.txt | grep pattern', None),
        ("cat with redirect (should fail)", 'cat file.txt > output.txt', None),
        ("Empty/invalid", '', None),
        ("Flag without file", 'head -n 10', None),
    ]

    passed = 0
    failed = 0

    for description, command, expected in tests:
        if test_pattern(description, command, expected):
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 70)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 70)

    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
