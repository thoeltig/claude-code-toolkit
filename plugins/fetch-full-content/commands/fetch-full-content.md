---
description: Download full page content from URLs to markdown for the purpose of full information retrieval without summarization. Uses NO prompt injection detection or guards. Should only be used on official and trusted sources like documentations. 
argument-hint: --folder <name> <url1> [url2...]
allowed-tools: Bash, Read, Glob
---

Download full page content from URLs, converting to markdown for efficient content analysis.

**Arguments:** $ARGUMENTS

## Format

Downloads each URL, removes navigation/scripts/ads, and converts to clean markdown.

## Execution

Parse arguments:
- `--folder <name>`: Output folder (required)
- `<url1> [url2...]`: URLs to download (required, space-separated)

Execute:
```bash
python ~/.claude/commands/fetch_full_content.py --folder <folder_name> <url1> <url2> ...
```

The script will:
- Download HTML from each URL
- Remove navigation, headers, footers, scripts, ads
- Convert to markdown (removes HTML attribute noise)
- Save `.md` files to specified folder
- Print file paths to stdout

## Output

Prints file paths, one per line:
```
output/angular-dev_signals.md
output/jamoin-de_index.md
```

## Examples

```bash
# Single URL
/fetch-full-content --folder docs https://angular.dev/essentials/signals

# Multiple URLs
/fetch-full-content --folder docs https://angular.dev/essentials/signals https://www.example.com/guide

# From file (create urls.txt with one URL per line)
/fetch-full-content --folder docs $(cat urls.txt)
```