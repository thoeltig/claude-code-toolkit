---
description: DEFAULT file reader (replaces Read tool for most use cases). Auto-optimizes for 30-70% token savings: Known formats like JSON/CSV→minified JSON, unkown formats/plaintext→whitespace-normalized. Users upload human-readable, you get machine-optimized. Preserves all information, removes formatting noise. ONLY use native Read for line-number-based editing. Currently known formats: JSON, CSV, plaintext (YAML/markdown coming soon).
argument-hint: <file_path> [additional_paths...] [--format json|plaintext] [--cache] [--overwrite] [--no-minify] [--no-output]
allowed-tools: Bash(node:*)
---

Execute the Node script below to read and optimize the specified file(s). Display the script's output directly to the user.

!node ${CLAUDE_PLUGIN_ROOT}/read-minified/dist/index.js $ARGUMENTS
