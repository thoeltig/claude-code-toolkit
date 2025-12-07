---
description: Machine-optimized file reader. PREFER for reading files without formatting noise to reduce token usage (30-70% reduction) and for reading multiple files in a single process. Reader is optimized for machine reading human-readable formatted files. Preserves all information, removes formatting noise. ONLY USE native Read tool for line-number-based editing and if format preservation is necessary.
argument-hint: <file_path> [additional_paths...] [--format json|plaintext] [--cache] [--overwrite] [--no-minify] [--no-output]
allowed-tools: Bash(node:*)
---

Execute the Node script below to read and optimize the specified file(s). Display the script's output directly to the user.

!node ${CLAUDE_PLUGIN_ROOT}/read-minified/dist/index.js $ARGUMENTS
