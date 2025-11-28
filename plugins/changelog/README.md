# Changelog Plugin

Professional changelog management for your projects following industry-standard formats.

## Overview

The changelog plugin provides a comprehensive skill for creating, updating, and maintaining CHANGELOG.md files that follow both [Common Changelog](https://common-changelog.org) and [Keep a Changelog](https://keepachangelog.com) standards. It handles everything from initial creation to complex operations like prerelease promotion and legacy format migration.

## Installation

```bash
/plugin install changelog@claude-code-toolkit
```

## Components

### Skills

**managing-changelog**
- Creates, updates, and maintains CHANGELOG.md files
- Supports both Common Changelog and Keep a Changelog formats
- 6 comprehensive workflows covering all changelog operations

### Workflows

| ID | Workflow | Purpose |
|----|----------|---------|
| WF1 | Create CHANGELOG.md | Initialize new changelog with format selection |
| WF2 | Add Release Entry | Add new version with categorized changes |
| WF3 | Update Unreleased | Track pre-release changes |
| WF4 | Migrate HISTORY.md | Convert legacy format to CHANGELOG.md |
| WF5 | Validate Format | Check compliance with standards |
| WF6 | Promote Prerelease | Convert alpha/beta/rc to stable release |

## Usage Examples

### Create a New Changelog

```
User: "Create a CHANGELOG.md for this project"
Claude: [Uses WF1] Creates initial CHANGELOG.md with selected format
```

### Add a Release

```
User: "Add version 2.1.0 to the changelog with today's date"
Claude: [Uses WF2] Adds properly formatted release entry with:
- Semver-valid version (2.1.0)
- ISO 8601 date (YYYY-MM-DD)
- Categorized changes (Changed, Added, Removed, Fixed)
- References to commits/PRs/issues
- Author attribution
```

### Track Ongoing Work

```
User: "Add this feature to the Unreleased section"
Claude: [Uses WF3] Appends to Unreleased section for pre-release tracking
```

### Migrate Legacy Format

```
User: "Convert our HISTORY.md to CHANGELOG.md"
Claude: [Uses WF4] Migrates legacy format preserving all content
```

### Validate Before Release

```
User: "Check if our changelog follows the standards"
Claude: [Uses WF5] Validates format, categories, dates, and content
```

### Promote Prerelease to Stable

```
User: "Promote 3.0.0-rc.2 to stable 3.0.0"
Claude: [Uses WF6] Handles prerelease promotion with 3 approaches
```

## Key Features

### Format Support
- **Common Changelog**: Strict format with references, authors, prefixes
- **Keep a Changelog**: Simpler format with 6 categories
- Automatic validation against standards
- Semantic Versioning compliance

### Writing Quality
- Remove noise (dotfiles, dev deps, style tweaks)
- Rephrase for consistency
- Merge related changes
- Skip no-op changes
- Keep entries brief and scannable

### Integration
- GitHub Actions example for automated releases
- Git history analysis
- Reference linking (commits, PRs, issues, external tickets)
- Author attribution with security constraints

### Security
- No email addresses in changelogs
- No API keys, tokens, or credentials
- No personal file paths
- Generic repository URLs

## Format Standards

### Common Changelog
```markdown
## [1.0.0] - 2025-11-26

### Changed
- **Breaking:** refactor API to use async/await ([#45](url)) (Author)

### Added
- Add support for JSON export ([#42](url))

### Fixed
- Fix memory leak in cache ([#44](url))

[1.0.0]: https://github.com/owner/repo/releases/tag/v1.0.0
```

### Keep a Changelog
```markdown
## [1.0.0] - 2025-11-26

### Added
- JSON export support

### Changed
- API now uses async/await (breaking change)

### Fixed
- Memory leak in cache

[1.0.0]: https://github.com/owner/repo/releases/tag/v1.0.0
```

## Documentation

### Standards
- [Common Changelog](https://common-changelog.org)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
- [Semantic Versioning](https://semver.org)

### Version History
See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## Tool Requirements

The skill uses the following Claude Code tools:
- **Read**: Load existing CHANGELOG.md or HISTORY.md files
- **Write**: Create new CHANGELOG.md files
- **Edit**: Update existing changelogs

## Best Practices

### Do
- ✅ Write changes in imperative mood (Add, Fix, Update)
- ✅ Include references (commits, PRs, issues)
- ✅ Categorize changes properly
- ✅ Use ISO 8601 dates (YYYY-MM-DD)
- ✅ Highlight breaking changes with **Breaking:** prefix
- ✅ Keep entries brief (one line per change)
- ✅ Sort by importance within categories

### Don't
- ❌ Dump raw git log
- ❌ Use vague descriptions
- ❌ Mix up categories
- ❌ Forget dates or use wrong format
- ❌ Include email addresses or sensitive data
- ❌ Copy commit messages verbatim
- ❌ Use past tense (Added, Fixed)

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

## License

See [LICENSE](../../LICENSE) for details.

---

**Version**: 1.0.0
**Author**: [Thore Höltig](https://github.com/thoeltig)