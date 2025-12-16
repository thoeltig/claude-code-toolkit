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

def extract_file_tokens(jsonl_path, agent_id=None):
    """Extract file sizes in tokens and read time from agent transcript."""
    results = []

    try:
        with open(jsonl_path) as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: File not found: {jsonl_path}", file=sys.stderr)
        return results

    # First pass: find all tool_use Read operations with their timestamps
    tool_uses = {}
    for i, line in enumerate(lines):
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue

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
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            continue

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
                                    try:
                                        next_data = json.loads(lines[i + 1])
                                    except json.JSONDecodeError:
                                        continue
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
                                            'time_ms': time_ms,
                                            'agent_id': agent_id
                                        })

    return results

def extract_to_json(results):
    """Convert results to JSON format with per-file breakdown."""
    if not results:
        return {"files": [], "summary": {}}

    json_results = []
    for r in results:
        # Extract format and metadata from filename
        file_name = Path(r['path']).stem
        file_path = r['path'].lower()

        # Determine file type based on path
        if 'answers_template' in file_path or file_name.startswith('answers_'):
            file_type = 'template'
        elif 'questions' in file_path or file_name.startswith('questions_'):
            file_type = 'questions'
        elif 'data' in file_path:
            file_type = 'data'
        else:
            file_type = None

        # Parse filename for variant and recordCount
        format_name = None
        variant = None
        record_count = None

        if file_type == 'data':
            # Data filename: format_with_[variant]_[recordCount]_records
            # e.g., toon_with_mandatory_40_records
            parts = file_name.split('_with_')
            if len(parts) == 2:
                format_name = parts[0]
                rest = parts[1].rsplit('_', 2)
                if len(rest) >= 2:
                    variant = rest[0]
                    try:
                        record_count = int(rest[1])
                    except (ValueError, IndexError):
                        record_count = None

        elif file_type in ('questions', 'template'):
            # Questions/template filename: {type}_with_[variant]_[recordCount]_records
            # e.g., questions_with_optional_80_records, answers_with_mandatory_40_records_template
            parts = file_name.split('_with_')
            if len(parts) == 2:
                rest = parts[1]
                # Remove '_records' or '_template' suffix
                rest = rest.replace('_template', '').replace('_records', '')
                pieces = rest.rsplit('_', 1)
                if len(pieces) == 2:
                    variant = pieces[0]
                    try:
                        record_count = int(pieces[1])
                    except (ValueError, IndexError):
                        record_count = None

        json_results.append({
            'file': r['file'],
            'path': r['path'],
            'agentId': r.get('agent_id'),
            'fileType': file_type,
            'format': format_name,
            'variant': variant,
            'recordCount': record_count,
            'readTokens': r['tokens'],
            'readDurationMs': r['time_ms'] if r['time_ms'] is not None else 0
        })

    # Calculate summary statistics
    total_tokens = sum(r['readTokens'] for r in json_results)
    total_duration = sum(r['readDurationMs'] for r in json_results if r['readDurationMs'] is not None)

    summary = {
        'totalFiles': len(json_results),
        'totalReadTokens': total_tokens,
        'totalReadDurationMs': total_duration,
        'averageReadTokens': total_tokens / len(json_results) if json_results else 0,
        'averageDurationMs': total_duration / len(json_results) if json_results else 0
    }

    return {
        'files': json_results,
        'summary': summary
    }

if __name__ == '__main__':
    import argparse
    import os

    parser = argparse.ArgumentParser(description='Extract file tokens from agent transcripts')
    parser.add_argument('agent_ids', nargs='+', help='Agent IDs (e.g., ae4a357 ae4a358) or paths to transcript files')
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

    # Extract tokens from each file
    for agent_id, file_path in files_to_process.items():
        results = extract_file_tokens(file_path, agent_id)
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
            # Parse metadata from filenames for display
            parsed_results = []
            for r in all_results:
                file_name = Path(r['path']).stem
                parts = file_name.split('_with_')
                if len(parts) == 2:
                    format_name = parts[0]
                    rest = parts[1].rsplit('_', 2)
                    if len(rest) >= 2:
                        variant = rest[0]
                        try:
                            record_count = int(rest[1])
                        except (ValueError, IndexError):
                            record_count = None
                    else:
                        variant = None
                        record_count = None
                else:
                    format_name = None
                    variant = None
                    record_count = None

                parsed_results.append({
                    **r,
                    'format': format_name,
                    'variant': variant,
                    'record_count': record_count
                })

            print(f"Files read across {len(files_to_process)} transcripts:")
            print("-" * 100)
            print(f"{'File':<40} {'Format':<12} {'Variant':<12} {'Records':>8} {'Tokens':>10} {'Time':>15}")
            print("-" * 100)
            total_tokens = 0
            total_time_ms = 0
            for r in parsed_results:
                time_str = f"{r['time_ms']:.0f}ms" if r['time_ms'] is not None else "N/A"
                variant = r.get('variant', 'N/A')
                record_count = r.get('record_count', 'N/A')
                print(f"{r['file']:<40} {r.get('format', 'N/A'):<12} {str(variant):<12} {str(record_count):>8} {r['tokens']:>10} {time_str:>15}")
                total_tokens += r['tokens']
                if r['time_ms'] is not None:
                    total_time_ms += r['time_ms']
            print("-" * 100)
            total_time_str = f"{total_time_ms:.0f}ms" if total_time_ms > 0 else "N/A"
            print(f"{'TOTAL':<40} {'':<12} {'':<12} {len(parsed_results):>8} {total_tokens:>10} {total_time_str:>15}")
        else:
            print("No file reads found in transcripts.")
