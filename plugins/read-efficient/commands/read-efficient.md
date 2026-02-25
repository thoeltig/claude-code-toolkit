---
description: Machine-efficient read tool ideal for batch reading multiple files for analysis. Especially reduces token usage by 15-30% on formats like XML, HTML, JSON pretty and YAML, also reducing understanding overhead by converting files to minified JSON without formatting noise while preserving all information. Use native read tool for line-number-based editing and if format preservation is necessary.
argument-hint: <file_path> [additional_paths...] [--no-minify] [--no-to-json] [--cache] [--no-output]
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/index.js *)
---

Execute the script to receive a more efficent version of the specified file(s). By default files are converted to compact JSON. The output contains the processed content if the size is smaller than '-max-output', otherwise returns a path to the saved processed content.
- With '--no-minify' argument the output is not minified.
- With '--no-to-json' argument the output is not converted to JSON.
- With '--cache' argument the output is writen to file.
- With '--no-output' argument no output is returned.
- With '--overwrite' argument an existing file with the same name is replaced.
- With '--max-output' argument the script detects potencial output size and decides if it should apply the cache logic or if it should output the content directly.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/index.js $ARGUMENTS --overwrite --max-output=${BASH_MAX_OUTPUT_LENGTH:29900}
```