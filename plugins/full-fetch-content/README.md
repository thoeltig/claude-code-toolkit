# Full-Fetch Plugin

Download and cache full page content from URLs for complete information retrieval without summarization loss.

## Built-in Fetch vs Full-Fetch

| Feature | Built-in WebFetch | Full-Fetch |
|---------|------------------|------------|
| **Information Retrieved** | 30-80% (summarized by subagent) | 100% (full content) |
| **Caching** | No (refetch with 5min request caching) | Yes (filesystem cached) |
| **Format** | Markdown | Markdown |
| **Best For** | Quick lookups, general questions | Building agent skills, comprehensive analysis |

**When to use Full-Fetch:**
- Writing agent skills based on documentation (need 100% accuracy)
- Analyzing complete API references or specifications
- Caching official docs for repeated analysis
- Building training data from trusted sources

**When to use Built-in WebFetch:**
- Quick information lookup
- General web browsing
- Untrusted or unknown sources

## ⚠️ Security Warning

**NO prompt injection detection or guards implemented.**

Full-Fetch retrieves and caches raw web content without security filtering. Malicious websites can embed instructions that manipulate Claude's behavior.

**ONLY use on:**
- ✅ Official documentation sites (docs.anthropic.com, angular.dev, etc.)
- ✅ Trusted third-party sources you control
- ✅ Content under your organization's domain

**NEVER use on:**
- ❌ Untrusted websites or user-generated content
- ❌ Public forums, comment sections, or social media
- ❌ Potentially malicious sources

**If unsure about a source, use the built-in WebFetch tool instead** - it includes safeguards for untrusted content.

## Installation

```bash
/plugin install full-fetch@claude-code-toolkit
```

## Usage

### Basic Usage

```bash
# Single URL
/fetch-full --folder docs https://angular.dev/essentials/signals

# Multiple URLs
/fetch-full --folder docs https://angular.dev/essentials/signals https://angular.dev/guide/directives

# Batch from file
/fetch-full --folder docs $(cat urls.txt)
```

### Use Cases

**Build comprehensive agent skills:**
```bash
# Download complete Angular documentation for skill development
/fetch-full --folder angular-docs \
  https://angular.dev/guide/signals \
  https://angular.dev/guide/directives \
  https://angular.dev/guide/dependency-injection
```

**Analyze complex topics:**
```bash
# Get all pricing and feature documentation
/fetch-full --folder product-info \
  https://service.com/pricing \
  https://service.com/features \
  https://service.com/billing
```

**Cache official documentation:**
```bash
# Cache official docs for repeated analysis
/fetch-full --folder claude-docs \
  https://docs.anthropic.com/en/docs/about-claude/models-overview \
  https://docs.anthropic.com/en/docs/build-with-claude/tool-use
```

## Components

### Slash Command

**`/fetch-full`**
- Downloads full page content from URLs
- Converts to clean markdown
- Caches to filesystem for reuse
- Removes navigation, ads, and scripts

## Output

Returns clean markdown files with:
- All page content preserved
- Navigation and ads removed
- HTML attribute noise stripped
- Code blocks preserved with syntax highlighting
- Links maintained as reference

Example output:
```
docs/angular-dev_signals.md
docs/angular-dev_directives.md
docs/angular-dev_dependency-injection.md
```

## Key Features

### Complete Content Retrieval
- No summarization = no information loss
- Every section, example, and detail preserved
- Better foundation for building accurate skills

### Filesystem Caching
- Downloaded files persist in specified folder
- Reuse across multiple sessions
- Avoid redundant network requests
- Analyze same documentation with different approaches

### Smart HTML Cleaning
- Removes navigation and headers
- Strips ads and popups
- Eliminates JavaScript UI code
- Preserves actual content

### Automatic JavaScript Rendering
- Detects dynamic content (< 500 chars detected as JS-rendered)
- Automatically retries with Playwright
- Route blocking removes images, styles, fonts to speed up rendering

## Requirements

### Python Dependencies
```
requests
beautifulsoup4
markdownify
playwright (optional, for JS rendering)
```

### Tools Used
- **Bash**: Execute download script
- **Read**: Load existing files
- **Glob**: Find cached files

## Best Practices

### Do
- ✅ Cache official documentation for reuse
- ✅ Download complete topics before building skills
- ✅ Use cached files for repeated analysis
- ✅ Download from trusted sources only
- ✅ Organize by topic in separate folders

### Don't
- ❌ Use on untrusted websites (use built-in WebFetch instead)
- ❌ Ignore security warnings
- ❌ Assume partial downloads are complete
- ❌ Share downloaded content from restricted sources
- ❌ Rely on summarization when accuracy matters

## How It Works

### Built-in WebFetch Flow
```
URL → Subagent summarization → 30-80% of content → Claude
Problem: Content loss, incomplete information, not cacheable
```

### Full-Fetch Flow
```
URL → Download + clean HTML → Markdown → Filesystem cache → Claude
Benefit: 100% content, reusable, better for skill development
```

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## License

See root [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)