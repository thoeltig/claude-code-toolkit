# Changelog

All notable changes to the Claude Code Toolkit marketplace documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.1.0.0] - 2025-11-27

_Marketplace release with session continuity management._

### Added

- session-protocol plugin v1.0.0 for seamless context preservation across Claude Code sessions ([SessionProtocol-v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SessionProtocol-v1.0.0.0))
  - Session state management with structured JSON format
  - Save/load commands for preserving tasks, git state, and context blocks
  - SessionStart, PreCompact hooks for automated session handling
  - Task consolidation for efficient context storage

## [1.0.0.0] - 2025-11-26

_First marketplace release with changelog plugin._

### Added

- Marketplace infrastructure (marketplace.json, README, CONTRIBUTING, CODE_OF_CONDUCT)
- GitHub issue templates (bug report, feature request, question)
- .gitignore for Claude Code toolkit development
- Added ([Changelog-v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog-v1.0.0.0)) plugin with managing-changelog skill for creating and maintaining CHANGELOG.md files
  - Documentation aligned with Common Changelog, Keep a Changelog, and SemVer standards


[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.1.0.0...HEAD
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.0.0.0
