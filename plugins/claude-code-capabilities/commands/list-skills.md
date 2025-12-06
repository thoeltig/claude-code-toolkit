---
description: List all available skills with their names and descriptions
allowed-tools: Bash(python:*)
argument-hint: [--format names|paths|list|table|json]
---

Execute the Python script below to query and display all available skills from both project and personal skill directories. Display the script's output directly to the user.

Output formats:
- names: Just skill names (most token-efficient)
- paths: Absolute file paths to SKILL.md files
- list: Names with full descriptions (default, human-readable)
- table: TSV format for parsing (name, path, description, scope)
- json: Structured JSON output

If no format is specified, defaults to 'list' format.

!python ${CLAUDE_PLUGIN_ROOT}/scripts/list-skills.py $ARGUMENTS
