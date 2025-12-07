# Changelog

All notable changes to the read-token-optimized plugin are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [0.1.0.0] - 2025-12-07

### Added

- Initial release: token-efficient file reading tool
- Smart format detection by file extension (JSON, plaintext, code)
- Minification engine removing redundant whitespace while preserving information density
- JSON parsing and minification with graceful fallback to plaintext on parse errors
- Plain text minification for code and text files
- Batch processing support for multiple files
- Optional disk caching with conflict resolution
- Zero external dependencies - pure TypeScript/Node.js
- 90%+ test coverage (96 test cases across 8 test suites)
- Slash command `/read-optimized` for Claude Code integration
- 20-70% file size reduction through minification on typical files

[Unreleased]: https://github.com/anthropics/claude-code/compare/v0.1.0.0...HEAD
[0.1.0.0]: https://github.com/anthropics/claude-code/releases/tag/v0.1.0.0
