#!/usr/bin/env python3
"""Validate edge cases for Bash/Grep deduplication."""

import json
import subprocess
from pathlib import Path

def run_dedup_test(test_name, test_file, expected_keywords):
    """Run dedup on test file and verify expected behavior."""
    script = "plugins/smart-compact/scripts/cleanup_conversation.py"
    cmd = ["python", script, test_file, "--dry-run-short", "--debug"]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        output = result.stdout + result.stderr

        # Check for expected keywords in output
        all_found = True
        missing = []
        for keyword in expected_keywords:
            if keyword not in output:
                all_found = False
                missing.append(keyword)

        if all_found:
            # Extract savings if present
            for line in output.split('\n'):
                if 'Savings:' in line:
                    print(f"[OK] {test_name}")
                    print(f"  {line.strip()}")
                    return True
        else:
            print(f"[FAIL] {test_name}")
            print(f"  Missing keywords: {missing}")
            return False
    except subprocess.TimeoutExpired:
        print(f"[FAIL] {test_name} - TIMEOUT")
        return False
    except Exception as e:
        print(f"[FAIL] {test_name} - ERROR: {e}")
        return False


def main():
    print("=" * 60)
    print("EDGE CASE VALIDATION FOR BASH/GREP DEDUP")
    print("=" * 60)

    tests = [
        # Test 1: Original backward compatibility
        {
            "name": "Backward Compatibility (Read/Write/Edit)",
            "file": "Claude_Temp_Files/test-transcript.json",
            "keywords": ["WRITE", "READ", "EDIT", "FULL DEDUP", "PARTIAL DEDUP"]
        },
        # Test 2: Bash/Grep operations
        {
            "name": "Bash/Grep Deduplication",
            "file": "Claude_Temp_Files/test-bash-grep.json",
            "keywords": ["BASH", "GREP", "FULL DEDUP", "Savings:"]
        },
    ]

    passed = 0
    failed = 0

    for test in tests:
        if run_dedup_test(test["name"], test["file"], test["keywords"]):
            passed += 1
        else:
            failed += 1
        print()

    print("=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)

    if failed == 0:
        print("[OK] All tests passed!")
        return 0
    else:
        print(f"[FAIL] {failed} test(s) failed")
        return 1


if __name__ == '__main__':
    exit(main())
