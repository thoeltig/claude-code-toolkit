# Changelog

All notable changes to the fetch-full-content plugin documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

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

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/fetch-full-content-v1.0.0.0...HEAD
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/fetch-full-content-v1.0.0.0
