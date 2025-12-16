#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from datetime import datetime

def find_transcript_files(agent_ids, projects_dir):
    """Find transcript files matching agent IDs in projects directory."""
    found_files = {}
    projects_path = Path(projects_dir)

    if not projects_path.exists():
        print(f"Warning: Projects directory not found: {projects_dir}", file=sys.stderr)
        return found_files

    # Search for agent-*.jsonl files matching the provided IDs
    for agent_id in agent_ids:
        matches = list(projects_path.glob(f"**/agent-{agent_id}.jsonl"))

        if matches:
            # Use the first match if multiple exist
            found_files[agent_id] = str(matches[0])
        else:
            print(f"Warning: No transcript found for agent ID: {agent_id}", file=sys.stderr)

    return found_files

def extract_full_test_metrics(jsonl_path, agent_id=None):
    """Extract full test metrics (duration, tokens) from agent transcript.

    Stops tracking at the first Write tool call - this marks when the agent
    has finished answering questions and is writing results to file.

    Also extracts test metadata (format, variant, recordCount) from the prompt.
    """
    results = []

    try:
        with open(jsonl_path) as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: File not found: {jsonl_path}", file=sys.stderr)
        return results

    # Extract test metadata from initial prompt
    test_format = None
    test_variant = None
    test_record_count = None

    for i, line in enumerate(lines):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue

        # Look for initial user message with test parameters
        if data.get('type') == 'user':
            msg = data.get('message', {})
            if isinstance(msg, dict):
                # Try to get text from 'content' or 'text' field
                text = msg.get('content') or msg.get('text', '')

                # Parse Format: {format}
                if 'Format:' in text:
                    for test_line in text.split('\n'):
                        if test_line.startswith('Format:'):
                            test_format = test_line.split('Format:')[1].strip()
                        elif test_line.startswith('Variant:'):
                            test_variant = test_line.split('Variant:')[1].strip()
                        elif test_line.startswith('Record Count:'):
                            try:
                                test_record_count = int(test_line.split('Record Count:')[1].strip())
                            except (ValueError, IndexError):
                                pass
            break

    # First pass: find the first Write tool_use to know when to stop tracking
    first_write_timestamp = None
    for i, line in enumerate(lines):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue

        msg = data.get('message', {})
        if isinstance(msg, dict):
            content = msg.get('content', [])
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get('type') == 'tool_use' and item.get('name') == 'Write':
                        first_write_timestamp = data.get('timestamp')
                        break
        if first_write_timestamp:
            break

    # Second pass: accumulate metrics only until first Write tool call
    first_timestamp = None
    last_timestamp = None
    total_input_tokens = 0
    total_output_tokens = 0

    for i, line in enumerate(lines):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue

        timestamp = data.get('timestamp')

        # Stop processing once we hit the first Write tool call
        if first_write_timestamp and timestamp == first_write_timestamp:
            last_timestamp = timestamp
            break

        if timestamp:
            if first_timestamp is None:
                first_timestamp = timestamp
            last_timestamp = timestamp

        # Extract usage information from assistant messages (before Write)
        msg = data.get('message', {})
        if isinstance(msg, dict) and 'usage' in msg:
            usage = msg['usage']
            total_input_tokens += usage.get('input_tokens', 0)
            total_output_tokens += usage.get('output_tokens', 0)

    # Calculate total duration (from start to first Write)
    duration_ms = None
    if first_timestamp and last_timestamp:
        try:
            start_dt = datetime.fromisoformat(first_timestamp.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(last_timestamp.replace('Z', '+00:00'))
            duration_ms = (end_dt - start_dt).total_seconds() * 1000
        except (ValueError, AttributeError):
            pass

    if first_timestamp:
        results.append({
            'agent_id': agent_id,
            'format': test_format,
            'variant': test_variant,
            'record_count': test_record_count,
            'duration_ms': duration_ms,
            'input_tokens': total_input_tokens,
            'output_tokens': total_output_tokens
        })

    return results

def extract_to_json(results):
    """Convert results to JSON format with per-file breakdown and summary.

    Only includes metrics up to the first Write tool call (when agent finishes answering).
    Includes test metadata (format, variant, recordCount) for matching with readonly tests.
    """
    if not results:
        return {"files": [], "summary": {}}

    json_results = []
    for r in results:
        json_results.append({
            'agentId': r['agent_id'],
            'format': r['format'],
            'variant': r['variant'],
            'recordCount': r['record_count'],
            'durationMs': r['duration_ms'] if r['duration_ms'] is not None else 0,
            'reasoningTokens': r['input_tokens'],
            'outputTokens': r['output_tokens']
        })

    # Calculate summary statistics
    total_duration = sum(r['durationMs'] for r in json_results if r['durationMs'] is not None)
    total_input = sum(r['inputTokens'] for r in json_results)
    total_output = sum(r['outputTokens'] for r in json_results)

    summary = {
        'totalTests': len(json_results),
        'totalDurationMs': total_duration,
        'totalReasoningTokens': total_input,
        'totalOutputTokens': total_output,
        'averageDurationMs': total_duration / len(json_results) if json_results else 0,
        'averageReasoningTokens': total_input / len(json_results) if json_results else 0,
        'averageOutputTokens': total_output / len(json_results) if json_results else 0
    }

    return {
        'files': json_results,
        'summary': summary
    }

if __name__ == '__main__':
    import argparse
    import os

    parser = argparse.ArgumentParser(description='Extract full test metrics from agent transcripts')
    parser.add_argument('agent_ids', nargs='+', help='Agent IDs (e.g., ae4b456 ae4b457) or paths to transcript files')
    parser.add_argument('--projects-dir', default=os.path.expanduser('~/.claude/projects'), help='Path to projects directory (default: ~/.claude/projects)')
    parser.add_argument('--json', action='store_true', help='Output as JSON (default: table format)')
    parser.add_argument('--output', help='Output file path (if not specified, prints to stdout)')

    args = parser.parse_args()

    all_results = []

    # Determine if arguments are file paths or agent IDs
    files_to_process = {}
    for arg in args.agent_ids:
        if Path(arg).exists() and arg.endswith('.jsonl'):
            # Direct file path provided
            files_to_process[arg] = arg
        elif '/' not in arg and '\\' not in arg:
            # Treat as agent ID, search for transcript
            pass
        else:
            # Could be a path that doesn't exist
            pass

    # For agent IDs, search in projects directory
    agent_ids = [a for a in args.agent_ids if not (Path(a).exists() and a.endswith('.jsonl')) and '/' not in a and '\\' not in a]
    if agent_ids:
        found_files = find_transcript_files(agent_ids, args.projects_dir)
        files_to_process.update(found_files)

    # Add direct paths
    for arg in args.agent_ids:
        if Path(arg).exists() and arg.endswith('.jsonl'):
            files_to_process[arg] = arg

    if not files_to_process:
        print("Error: No transcript files found or provided", file=sys.stderr)
        sys.exit(1)

    # Extract metrics from each file
    for agent_id, file_path in files_to_process.items():
        results = extract_full_test_metrics(file_path, agent_id)
        all_results.extend(results)

    if args.json:
        output_data = extract_to_json(all_results)
        output_str = json.dumps(output_data, indent=2 if not args.output else None)

        if args.output:
            Path(args.output).parent.mkdir(parents=True, exist_ok=True)
            with open(args.output, 'w') as f:
                f.write(json.dumps(output_data))
            print(f"Results written to: {args.output}")
        else:
            print(output_str)
    else:
        if all_results:
            print(f"Full test metrics across {len(files_to_process)} agents (up to Write tool call):")
            print("-" * 135)
            print(f"{'Agent ID':<12} {'Format':<10} {'Variant':<12} {'Records':>8} {'Duration':>12} {'Input':>10} {'Output':>10} {'Cache Creat':>12}")
            print("-" * 135)
            for r in all_results:
                duration_str = f"{r['duration_ms']:.0f}ms" if r['duration_ms'] is not None else "N/A"
                format_str = r['format'] if r['format'] else "N/A"
                variant_str = r['variant'] if r['variant'] else "N/A"
                records_str = str(r['record_count']) if r['record_count'] else "N/A"
                print(f"{r['agent_id']:<12} {format_str:<10} {variant_str:<12} {records_str:>8} {duration_str:>12} {r['input_tokens']:>10} {r['output_tokens']:>10} {r['cache_creation_tokens']:>12}")
            print("-" * 135)
        else:
            print("No metrics found in transcripts.")
