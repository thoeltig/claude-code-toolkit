# Contributing to Claude Code Toolkit

Thank you for your interest in contributing to Claude Code Toolkit! This document provides guidelines for contributing to this marketplace.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Submitting a Plugin](#submitting-a-plugin)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Development Guidelines](#development-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Submitting a Plugin

We welcome high-quality Claude Code plugins! Before submitting:

1. **Ensure your plugin follows Claude Code specifications:**
   - Valid `.claude-plugin/plugin.json` manifest
   - Proper directory structure (skills/, commands/, hooks/, etc.)
   - Well-documented SKILL.md files with YAML frontmatter
   - CHANGELOG.md following Keep a Changelog format

2. **Quality standards:**
   - Skills under 500 lines (use progressive disclosure for complex skills)
   - Clear, specific descriptions with trigger keywords
   - No hardcoded personal information or absolute paths
   - Comprehensive examples and usage documentation

3. **Documentation requirements:**
   - Plugin-level README.md with installation instructions
   - Component listings (skills, commands, hooks)
   - Usage examples and workflows
   - CHANGELOG.md with version history

4. **Submission process:**
   - Fork this repository
   - Add your plugin to `plugins/your-plugin-name/`
   - Update `marketplace.json` with your plugin entry
   - Create a pull request with description of your plugin

### Reporting Bugs

**Before submitting a bug report:**
- Check the issue tracker to avoid duplicates
- Collect relevant information (plugin version, Claude Code version, error messages)

**How to submit a bug report:**
1. Use the bug report template (in `.github/ISSUE_TEMPLATE/`)
2. Provide a clear, descriptive title
3. Include steps to reproduce the issue
4. Describe expected vs actual behavior
5. Add relevant logs, screenshots, or error messages

### Suggesting Enhancements

**Before submitting an enhancement:**
- Check if the enhancement has already been suggested
- Consider if it fits the project's scope

**How to suggest an enhancement:**
1. Use the feature request template (in `.github/ISSUE_TEMPLATE/`)
2. Provide a clear description of the enhancement
3. Explain why this enhancement would be useful
4. Include examples of how it would work

## Development Guidelines

### Plugin Structure

```
your-plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required manifest
├── skills/
│   └── skill-name/
│       ├── SKILL.md         # Main skill file with YAML frontmatter
│       ├── CHANGELOG.md     # Skill version history
│       └── supporting-file.md
├── commands/
│   └── command-name.md      # Slash command with YAML frontmatter
├── hooks/
│   └── hooks.json           # Hook configuration (optional)
├── CHANGELOG.md             # Plugin version history
└── README.md                # Plugin documentation
```

### Naming Conventions

- **Plugin names**: kebab-case (e.g., `my-plugin`)
- **Skill names**: gerund-form, lowercase-with-hyphens (e.g., `managing-files`)
- **Command files**: verb-noun.md (e.g., `list-items.md`)
- **No spaces, underscores, or capitals in names**

### Plugin Manifest (plugin.json)

Required fields:
```json
{
  "name": "plugin-name",
  "description": "Clear description with usage context",
  "version": "1.0.0",
  "author": {
    "name": "Your Name"
  }
}
```

### Skill Guidelines

**YAML Frontmatter:**
```yaml
---
name: skill-name
description: What the skill does and when to use it (include 3-5 trigger keywords)
---
```

**Content structure:**
- **When to Use**: Clear trigger contexts
- **Core Workflows**: Numbered workflows (WF1, WF2, etc.)
- **Examples**: Practical usage examples
- **Progressive Disclosure**: Link to supporting files for complex topics

**Best practices:**
- Keep SKILL.md under 500 lines
- Only include information not in Claude's training data
- Use specific, actionable descriptions
- Provide clear workflow steps
- Avoid time-sensitive conditionals

### Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/):

```markdown
# Changelog

## [Unreleased]

### Added
- New feature description

## [1.0.0] - 2024-01-01

### Added
- Initial release
```

### Code Standards

- **No personal information**: Remove absolute paths with usernames, API keys, credentials
- **Generic paths**: Use `~/` or relative paths in examples
- **SOLID principles**: Follow clean code practices in any scripts
- **Documentation**: Comment complex logic
- **Testing**: Validate all components work before submission

## Pull Request Process

1. **Before submitting:**
   - Test your plugin thoroughly
   - Update documentation
   - Validate plugin structure using `/pack` command
   - Remove personal information
   - Add CHANGELOG entry

2. **PR description should include:**
   - Summary of changes
   - Type of change (new plugin, bug fix, enhancement)
   - Testing performed
   - Screenshots (if applicable)

3. **Review process:**
   - Maintainers will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

4. **After merge:**
   - Your plugin will be included in the next marketplace release
   - You'll be added to contributors

## Questions?

- Open an issue with the "question" label
- Check existing documentation in plugin READMEs
- Review the [Claude Code documentation](https://claude.ai/code)

## Recognition

Contributors will be recognized in:
- Repository contributors list
- Plugin author attribution
- Release notes

Thank you for contributing to Claude Code Toolkit!
