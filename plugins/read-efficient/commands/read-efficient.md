---
description: Machine-efficient read tool ideal for batch reading multiple files for analysis. 30-70% token usage and understanding overhead reduction by converting files to minified JSON without formatting noise while preserving all information. Use native read tool for line-number-based editing and if format preservation is necessary.
argument-hint: <file_path> [additional_paths...] [--no-minify] [--no-to-json] [--cache] [--no-minify] [--no-output]
allowed-tools: Bash(node:*)
---

Execute the Node script below to receive a more efficent version of the specified file(s). Display the script's output directly to the user.
- Slash commands have a hardcoded output limit at ~30000 characters and if exceeded the output is truncated.
- If truncation is detected run Node script by itself without the slash command. 
- The bash output limit is 100000 characters by default and can be configured with environment variable `BASH_MAX_OUTPUT_LENGTH`.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/index.js $ARGUMENTS --overwrite --max-output=29900
```
