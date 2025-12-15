#!/usr/bin/env python3
import json
import sys
from pathlib import Path

def extract_benchmark_files(metadata_path):
    """Extract all file paths from metadata.json (except expectedOutputPath)."""

    with open(metadata_path) as f:
        metadata = json.load(f)

    results = {
        'mandatory_80': [],
        'mandatory_40': [],
        'optional_80': [],
        'optional_40': []
    }

    # metadata.json is in benchmarking/ folder, paths are relative to benchmarking/
    base_dir = Path(metadata_path).parent

    for group in metadata['filesPerRecordCount']:
        record_count = group['recordCount']

        # Check first data item to determine if mandatory or optional
        first_data = group.get('dataAndOutput', [{}])[0]
        is_mandatory = first_data.get('allFieldsManadatory', True)

        # Determine category
        category = f"{'mandatory' if is_mandatory else 'optional'}_{record_count}"

        # Skip validation file - only used in script validation, not in benchmarks

        # Add questions file
        questions_path = group.get('questionnaireFilePath', '')
        if questions_path:
            # Remove 'benchmarking\\' prefix if present
            if questions_path.startswith('benchmarking\\'):
                questions_path = questions_path[13:]
            full_path = base_dir / questions_path
            results[category].append({
                'file': 'questions',
                'path': str(full_path),
                'type': 'questions'
            })

        # Add answers template
        answers_template_path = group.get('answerTemplateFilePath', '')
        if answers_template_path:
            # Remove 'benchmarking\\' prefix if present
            if answers_template_path.startswith('benchmarking\\'):
                answers_template_path = answers_template_path[13:]
            full_path = base_dir / answers_template_path
            results[category].append({
                'file': 'answers_template',
                'path': str(full_path),
                'type': 'answers_template'
            })

        # Add data files
        for data_item in group.get('dataAndOutput', []):
            format_name = data_item.get('format', '')
            data_path = data_item.get('dataFilePath', '')
            if data_path:
                # Remove 'benchmarking\\' prefix if present
                if data_path.startswith('benchmarking\\'):
                    data_path = data_path[13:]
                full_path = base_dir / data_path
                results[category].append({
                    'file': f"data_{format_name}",
                    'path': str(full_path),
                    'type': 'data',
                    'format': format_name
                })

    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python extract_benchmark_files.py <path_to_metadata.json>")
        sys.exit(1)

    metadata_path = sys.argv[1]

    if not Path(metadata_path).exists():
        print(f"Error: File not found: {metadata_path}")
        sys.exit(1)

    results = extract_benchmark_files(metadata_path)

    for category, files in results.items():
        print(f"\n{category.upper()}:")
        print("-" * 80)
        for f in files:
            exists = "OK" if Path(f['path']).exists() else "MISSING"
            print(f"[{exists}] {f['file']:<30} {f['path']}")
        print(f"Total: {len(files)} files")
