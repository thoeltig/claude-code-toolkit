---
description: Machine-efficient read tool ideal for batch reading multiple files for analysis. Token usage and understanding overhead is reduced by converting files to minified JSON without formatting noise (30-70% reduction) while preserving. Use native read tool for line-number-based editing and if format preservation is necessary.
argument-hint: <file_path> [additional_paths...] [--no-minify] [--no-to-json] [--cache] [--overwrite] [--no-minify] [--no-output]
allowed-tools: Bash(node:*)
---

Execute the Node script below to receive a more efficent version of the specified file(s). Display the script's output directly to the user.
- Slash commands have a hardcoded output limit at ~30000 characters and if exceeded the output is truncated.
- If truncation is detected run Node script by itself without the slash command. 
- The bash output limit is 100000 characters by default and can be configured with environment variable `BASH_MAX_OUTPUT_LENGTH`.

!node ${CLAUDE_PLUGIN_ROOT}/read-minified/dist/index.js $ARGUMENTS --max-output=29900
