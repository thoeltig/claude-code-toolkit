#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from datetime import datetime

def extract_file_tokens(jsonl_path):
    """Extract file sizes in tokens and read time from agent transcript."""
    results = []

    with open(jsonl_path) as f:
        lines = f.readlines()

    # First pass: find all tool_use Read operations with their timestamps
    tool_uses = {}
    for i, line in enumerate(lines):
        data = json.loads(line)

        if data.get('type') == 'assistant':
            msg = data.get('message', {})
            content = msg.get('content', [])

            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get('name') == 'Read':
                        file_path = item.get('input', {}).get('file_path', '')
                        if file_path:
                            tool_use_id = item.get('id', '')
                            tool_uses[tool_use_id] = {
                                'file_path': file_path,
                                'tool_use_timestamp': data.get('timestamp', '')
                            }

    # Second pass: find toolUseResult entries and match with tool_uses
    for i, line in enumerate(lines):
        data = json.loads(line)

        tool_use_result = data.get('toolUseResult', {})
        if tool_use_result and 'file' in tool_use_result:
            file_info = tool_use_result['file']
            file_path = file_info.get('filePath', '')

            # Find matching tool_use_id from message
            msg = data.get('message', {})
            if isinstance(msg, dict):
                content = msg.get('content', [])
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'tool_result':
                            tool_use_id = item.get('tool_use_id', '')

                            if tool_use_id in tool_uses and file_path:
                                result_timestamp = data.get('timestamp', '')
                                tool_use_timestamp = tool_uses[tool_use_id]['tool_use_timestamp']

                                # Get next message for token counts
                                if i + 1 < len(lines):
                                    next_data = json.loads(lines[i + 1])
                                    next_msg = next_data.get('message', {})

                                    if isinstance(next_msg, dict) and 'usage' in next_msg:
                                        usage = next_msg['usage']
                                        cache_creation = usage.get('cache_creation_input_tokens', 0)

                                        # Calculate time difference (from tool_use to result)
                                        time_ms = None
                                        if tool_use_timestamp and result_timestamp:
                                            try:
                                                tool_use_dt = datetime.fromisoformat(tool_use_timestamp.replace('Z', '+00:00'))
                                                result_dt = datetime.fromisoformat(result_timestamp.replace('Z', '+00:00'))
                                                time_ms = (result_dt - tool_use_dt).total_seconds() * 1000
                                            except (ValueError, AttributeError):
                                                pass

                                        file_name = Path(file_path).name
                                        results.append({
                                            'file': file_name,
                                            'path': file_path,
                                            'tokens': cache_creation,
                                            'time_ms': time_ms
                                        })

    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python extract_file_tokens.py <path_to_agent_transcript.jsonl>")
        sys.exit(1)

    jsonl_path = sys.argv[1]

    if not Path(jsonl_path).exists():
        print(f"Error: File not found: {jsonl_path}")
        sys.exit(1)

    results = extract_file_tokens(jsonl_path)

    if results:
        print(f"Files read in {Path(jsonl_path).name}:")
        print("-" * 80)
        print(f"{'File':<50} {'Tokens':>10} {'Time':>15}")
        print("-" * 80)
        total_tokens = 0
        total_time_ms = 0
        for r in results:
            time_str = f"{r['time_ms']:.0f}ms" if r['time_ms'] is not None else "N/A"
            print(f"{r['file']:<50} {r['tokens']:>10} {time_str:>15}")
            total_tokens += r['tokens']
            if r['time_ms'] is not None:
                total_time_ms += r['time_ms']
        print("-" * 80)
        total_time_str = f"{total_time_ms:.0f}ms" if total_time_ms > 0 else "N/A"
        print(f"{'TOTAL':<50} {total_tokens:>10} {total_time_str:>15}")
    else:
        print("No file reads found in transcript.")
