# Changelog

All notable changes to the fetch-full-content plugin documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.2.1.0] - 2026-03-01

### Changed

- Warning output when hidden content is filtered is still in stdout but removed from markdown file to reduce duplicate tokens

## [1.2.0.0] - 2026-02-01

### Added

- Basic prompt injection filtering for common hidden content vectors
  - Removes HTML comments
  - Filters elements with `display: none` or `visibility: hidden`
  - Removes elements with font-size < 6px (handles px, em, rem, pt units)
  - Filters elements with opacity < 10%
  - Removes elements with very low alpha channel colors (< 10%)
- Warning output when hidden content is filtered (both stdout and markdown file)
- Enhanced security notice in README clarifying filtering scope

### Security

- Added filtering to reduce prompt injection risk from common hidden content injection vectors
- Note: Filtering is a basic defense layer, not comprehensive protection
- Security warning updated to reflect filtering capabilities and limitations

## [1.1.0.0] - 2026-01-10

### Changed

- Made folder argument optional with default cache directory
- Restricted allowed-tools to Python only (removed other tool types)

## [1.0.1.0] - 2026-01-06

### Fixed

- The fetch-full-content slash command failed to find the script because of a wrong filepath.

## [1.0.0.0] - 2025-01-06

_First release._

### Added

- `/fetch-full-content` slash command for downloading and caching full page content
- 100% content retrieval vs built-in WebFetch's 30-80% summarized content
- Filesystem caching to avoid redundant fetches on repeated topic analysis
- HTML to markdown conversion (88% token reduction vs raw HTML)
- Automatic JavaScript rendering detection using Playwright
- Route blocking in Playwright (excludes images, stylesheets, media, fonts, XHR/fetch)
- Automatic removal of navigation, headers, footers, scripts, and advertisements
- Support for multiple URLs in single command
- Support for batch processing via URL files
- File path output to stdout for integration with tools and agents

### Security

⚠️ **NO prompt injection detection or guards implemented**

- Users must only use on trusted sources (official docs, controlled content)
- Security warning in command description, README, and plugin.json
- Recommendation to use built-in WebFetch for untrusted sources

### Features

- Complete information retrieval without AI summarization loss
- Removes HTML attribute noise (classes, IDs, data attributes)
- Markdown output preserves structure (headings, lists, code blocks)
- Auto-detects dynamic content requiring JavaScript rendering
- Efficient handling of both static and JS-rendered pages
- Cached files enable building agent skills from complete documentation

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/FetchFullContent_v1.2.0.0...HEAD
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/FetchFullContent_v1.1.0.0...FetchFullContent_v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/FetchFullContent_v1.0.1.0...FetchFullContent_v1.1.0.0
[1.0.1.0]: https://github.com/thoeltig/claude-code-toolkit/compare/FetchFullContent_v1.0.0.0...FetchFullContent_v1.0.1.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/FetchFullContent_v1.0.0.0