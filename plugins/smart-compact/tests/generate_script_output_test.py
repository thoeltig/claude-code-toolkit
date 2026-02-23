#!/usr/bin/env python3
"""Generate a test transcript for bash script output deduplication.

Tests scenarios where identical script outputs should be deduplicated:
- Same script run multiple times (e.g., npm test → same results)
- Script output vs read with identical content
- Different script outputs (edge case: should preserve or partial dedup)
"""

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


def create_bash_script_operation(command, output):
    """Create a Bash script tool_use operation.

    Args:
        command: The bash command (e.g., 'bash -c "python test.py"')
        output: The script output (stdout)
    """
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


def main():
    messages = []

    print("=" * 70)
    print("GENERATING SCRIPT OUTPUT DEDUP TEST TRANSCRIPT")
    print("=" * 70)

    # === SCENARIO 1: Python test script - identical outputs ===
    print("\n[1] Python test script - run 1")
    python_output_v1 = """test_suite.py ................
Ran 16 tests in 0.245s

OK"""
    a_msg, u_msg = create_bash_script_operation('bash -c "python test_suite.py"', python_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[2] Read test results file")
    test_results_content = """test_suite.py ................
Ran 16 tests in 0.245s

OK"""
    a_msg, u_msg = create_read_operation("test_results.txt", test_results_content)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[3] Python test script - run 2 (identical output)")
    python_output_v2 = """test_suite.py ................
Ran 16 tests in 0.245s

OK"""
    a_msg, u_msg = create_bash_script_operation('bash -c "python test_suite.py"', python_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 2: NPM test runner - identical outputs ===
    print("[4] NPM test - run 1")
    npm_output_v1 = """PASS  src/__tests__/index.test.js
  ✓ should export functions (2ms)
  ✓ should handle edge cases (5ms)

Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.234s"""
    a_msg, u_msg = create_bash_script_operation('bash -c "npm test"', npm_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[5] NPM test - run 2 (identical output)")
    npm_output_v2 = """PASS  src/__tests__/index.test.js
  ✓ should export functions (2ms)
  ✓ should handle edge cases (5ms)

Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.234s"""
    a_msg, u_msg = create_bash_script_operation('bash -c "npm test"', npm_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 3: dotnet build - identical outputs ===
    print("[6] Dotnet build - run 1")
    dotnet_output_v1 = """Microsoft (R) Build Engine version 17.0.0
Build started 2/22/2026 10:30:00 AM.

Project "app.csproj" (default targets) is building against the framework ".NETCoreApp,Version=v6.0".
Build succeeded. (duration: 2.456s)"""
    a_msg, u_msg = create_bash_script_operation('bash -c "dotnet build"', dotnet_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[7] Dotnet build - run 2 (identical output)")
    dotnet_output_v2 = """Microsoft (R) Build Engine version 17.0.0
Build started 2/22/2026 10:30:00 AM.

Project "app.csproj" (default targets) is building against the framework ".NETCoreApp,Version=v6.0".
Build succeeded. (duration: 2.456s)"""
    a_msg, u_msg = create_bash_script_operation('bash -c "dotnet build"', dotnet_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 4: Node script - identical outputs ===
    print("[8] Node script - run 1")
    node_output_v1 = """Server started on port 3000
Connected to database
Listening for requests..."""
    a_msg, u_msg = create_bash_script_operation('bash -c "node app.js"', node_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[9] Node script - run 2 (identical output)")
    node_output_v2 = """Server started on port 3000
Connected to database
Listening for requests..."""
    a_msg, u_msg = create_bash_script_operation('bash -c "node app.js"', node_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 5: Ruby script - identical outputs ===
    print("[10] Ruby script - run 1")
    ruby_output_v1 = """Bundled gems into ./vendor/bundle
Bundle complete! 42 Gemfile dependencies, 145 gems now installed."""
    a_msg, u_msg = create_bash_script_operation('bash -c "ruby deploy.rb"', ruby_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[11] Ruby script - run 2 (identical output)")
    ruby_output_v2 = """Bundled gems into ./vendor/bundle
Bundle complete! 42 Gemfile dependencies, 145 gems now installed."""
    a_msg, u_msg = create_bash_script_operation('bash -c "ruby deploy.rb"', ruby_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 6: Java application - identical outputs ===
    print("[12] Java app - run 1")
    java_output_v1 = """2026-02-22 10:30:05.123 INFO - Application started
2026-02-22 10:30:05.234 INFO - Loading configuration...
2026-02-22 10:30:05.456 INFO - Ready to accept connections on port 8080"""
    a_msg, u_msg = create_bash_script_operation('bash -c "java -jar app.jar"', java_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[13] Java app - run 2 (identical output)")
    java_output_v2 = """2026-02-22 10:30:05.123 INFO - Application started
2026-02-22 10:30:05.234 INFO - Loading configuration...
2026-02-22 10:30:05.456 INFO - Ready to accept connections on port 8080"""
    a_msg, u_msg = create_bash_script_operation('bash -c "java -jar app.jar"', java_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 7: Go program - identical outputs ===
    print("[14] Go program - run 1")
    go_output_v1 = """Building...
Binary built successfully: ./bin/app
Execution: 234.5ms"""
    a_msg, u_msg = create_bash_script_operation('bash -c "go run main.go"', go_output_v1)
    messages.append(a_msg)
    messages.append(u_msg)

    print("[15] Go program - run 2 (identical output)")
    go_output_v2 = """Building...
Binary built successfully: ./bin/app
Execution: 234.5ms"""
    a_msg, u_msg = create_bash_script_operation('bash -c "go run main.go"', go_output_v2)
    messages.append(a_msg)
    messages.append(u_msg)

    # === SCENARIO 8: Edge case - different outputs (should preserve or partial dedup) ===
    print("[16] Python test with failure")
    python_fail_output = """test_suite.py .........F.....
FAILED test_suite.py::test_edge_case

Ran 16 tests in 0.312s

FAILED"""
    a_msg, u_msg = create_bash_script_operation('bash -c "python test_suite.py"', python_fail_output)
    messages.append(a_msg)
    messages.append(u_msg)

    # Calculate accurate savings
    marker = "[...Duplicate read omitted - latest version contains complete content...]"
    marker_bytes = len(marker)

    # Extract bash outputs to calculate real savings
    bash_outputs = []
    bash_map = {}
    for msg in messages:
        if msg.get('type') == 'assistant':
            for item in msg.get('message', {}).get('content', []):
                if item.get('name') == 'Bash':
                    bash_map[item.get('id')] = item.get('input', {}).get('command')
        if msg.get('type') == 'user':
            for item in msg.get('message', {}).get('content', []):
                if item.get('type') == 'tool_result':
                    tid = item.get('tool_use_id')
                    if tid in bash_map:
                        content = item.get('content', '')
                        bash_outputs.append((bash_map[tid], content))

    # Count identical pairs and calculate net savings
    seen_outputs = {}
    identical_pairs = 0
    gross_bytes = 0
    net_bytes = 0

    for cmd, output in bash_outputs:
        if output in seen_outputs:
            # This is a duplicate - would be deduplicated
            identical_pairs += 1
            output_bytes = len(output)
            gross_bytes += output_bytes
            # Net savings: output size minus marker size
            net_savings = max(0, output_bytes - marker_bytes)
            net_bytes += net_savings
        else:
            seen_outputs[output] = cmd

    # Save to file
    output_file = "test-script-output.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        # Write as newline-delimited JSON (minified)
        for msg in messages:
            json.dump(msg, f, separators=(',', ':'))
            f.write('\n')

    print(f"\n[OK] Generated {output_file} with {len(messages)} messages")
    print(f"  Test scenarios: 8 (7 identical + 1 different)")
    print(f"  Bash operations: {len(bash_outputs)}")
    print(f"  Unique outputs: {len(seen_outputs)}")
    print(f"  Identical pairs: {identical_pairs}")
    print(f"  Marker size: {marker_bytes} bytes")
    print(f"  Gross removal: {gross_bytes} bytes")
    print(f"  Net savings (after marker): {net_bytes} bytes (~{net_bytes/1024:.2f}KB)")
    print(f"  Tokens saved: ~{net_bytes//4}")
    print("=" * 70)


if __name__ == '__main__':
    main()
