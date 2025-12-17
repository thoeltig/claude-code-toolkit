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
    """Convert results to JSON format with aggregated metrics per test case.

    Groups 3 test runs by format+variant+recordCount and averages their metrics.
    Only includes metrics up to the first Write tool call (when agent finishes answering).
    """
    if not results:
        return {"files": [], "summary": {}}

    # Group by format+variant+recordCount
    grouped = {}
    for r in results:
        key = (r['format'], r['variant'], r['record_count'])
        if key not in grouped:
            grouped[key] = []
        grouped[key].append(r)

    json_results = []
    for (format_name, variant, record_count), group in grouped.items():
        # Average metrics across the 3 test runs
        avg_duration = sum(r['duration_ms'] for r in group if r['duration_ms'] is not None) / len(group) if group else 0
        avg_input_tokens = sum(r['input_tokens'] for r in group) / len(group) if group else 0
        avg_output_tokens = sum(r['output_tokens'] for r in group) / len(group) if group else 0

        # Collect individual run data
        runs = []
        for r in group:
            runs.append({
                'durationMs': round(r['duration_ms'], 3) if r['duration_ms'] is not None else None,
                'reasoningTokens': round(r['input_tokens'], 3),
                'outputTokens': round(r['output_tokens'], 3)
            })

        json_results.append({
            'format': format_name,
            'variant': variant,
            'recordCount': record_count,
            'testRuns': len(group),
            'durationMs': round(avg_duration, 3),
            'reasoningTokens': round(avg_input_tokens, 3),
            'outputTokens': round(avg_output_tokens, 3),
            'runs': runs
        })

    # Calculate summary statistics
    total_duration = sum(r['durationMs'] for r in json_results)
    total_reasoning = sum(r['reasoningTokens'] for r in json_results)
    total_output = sum(r['outputTokens'] for r in json_results)

    summary = {
        'totalTestCases': len(json_results),
        'totalDurationMs': round(total_duration, 3),
        'totalReasoningTokens': round(total_reasoning, 3),
        'totalOutputTokens': round(total_output, 3),
        'averageDurationMs': round(total_duration / len(json_results), 3) if json_results else 0,
        'averageReasoningTokens': round(total_reasoning / len(json_results), 3) if json_results else 0,
        'averageOutputTokens': round(total_output / len(json_results), 3) if json_results else 0
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
            # Group and aggregate for table display
            grouped = {}
            for r in all_results:
                key = (r['format'], r['variant'], r['record_count'])
                if key not in grouped:
                    grouped[key] = []
                grouped[key].append(r)

            print(f"Full test metrics aggregated across {len(files_to_process)} agents (up to Write tool call):")
            print("-" * 100)
            print(f"{'Format':<12} {'Variant':<12} {'Records':>8} {'Test Runs':>10} {'Avg Duration':>14} {'Avg Reasoning':>14} {'Avg Output':>12}")
            print("-" * 100)
            for (format_name, variant, record_count), group in sorted(grouped.items()):
                avg_duration = sum(r['duration_ms'] for r in group if r['duration_ms'] is not None) / len(group) if group else 0
                avg_input = sum(r['input_tokens'] for r in group) / len(group) if group else 0
                avg_output = sum(r['output_tokens'] for r in group) / len(group) if group else 0
                duration_str = f"{avg_duration:.0f}ms"
                print(f"{format_name:<12} {variant:<12} {record_count:>8} {len(group):>10} {duration_str:>14} {avg_input:>14.0f} {avg_output:>12.0f}")
            print("-" * 100)
        else:
            print("No metrics found in transcripts.")
