# Changelog

All notable changes to the changelog plugin documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.1.0] - 2025-11-29

### Changed

- Removed WF4 (Migrate HISTORY.md) workflow - no longer needed for changelog management
- Simplified skill focus to core changelog operations: create, add release, update unreleased, validate, promote prerelease
- Updated skill description to remove HISTORY.md migration references
- Renumbered workflows: WF5 → WF4 (Validate Format), WF6 → WF5 (Promote Prerelease)
- Updated all documentation, examples, and quick reference tables to reflect workflow changes

## [1.0.0] - 2025-11-26

_First release._

### Added

- managing-changelog skill for creating and maintaining CHANGELOG.md files
- WF1: Create new CHANGELOG.md with format selection (Common Changelog or Keep a Changelog)
- WF2: Add release entry with version, date, and categorized changes
- WF3: Update Unreleased section for ongoing work
- WF4: Migrate HISTORY.md to CHANGELOG.md format
- WF5: Validate changelog format compliance
- WF6: Promote Prerelease workflow with 3 approaches (copy, skip, refer)
- Support for both Common Changelog and Keep a Changelog formats
- Notice format specification for first releases, yanked releases, upgrade guides
- Detailed reference syntax for commits, PRs, external tickets, submodule references
- Authors format with semicolon separator for multiple authors
- Subsystem prefix support for projects with submodules
- Security constraint in Authors section: only usernames/real names allowed, no email addresses, API keys, tokens, file paths, or personal information
- Security violation item in Anti-patterns section for comprehensive security coverage
- GitHub Actions integration example for automated releases
- Workflow table overview in Core Workflows section
- Integration with Read, Write, Edit tools
- Examples for both Common Changelog and Keep a Changelog formats
- Migration examples from HISTORY.md to CHANGELOG.md
- Anti-patterns guide
- Quick reference for all workflows
- Documentation aligned with Common Changelog, Keep a Changelog, and SemVer standards
- Plugin README with comprehensive usage examples
- Plugin manifest (plugin.json) for marketplace distribution

### Changed

- Enhance WF2 with writing quality steps: remove noise, rephrase, merge related, skip no-ops, keep brief
- Update Format Reference with comprehensive notice, reference, author, and prefix specifications
- Expand Quick Reference to include all 6 workflows in table format
- Replaced HISTORY.md approach with CHANGELOG.md standard

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/Changelog-v1.1.0.0...HEAD
[1.1.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog-v1.1.0.0
[1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog_v1.0.0.0
