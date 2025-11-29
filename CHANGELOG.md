# Changelog

All notable changes to the Claude Code Toolkit marketplace documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

### Changed

- **changelog plugin** ([v1.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog_v1.1.0.0)):
  - Removed HISTORY.md migration workflow (WF4) - simplified skill to focus on core changelog operations (create, add release, update unreleased, validate, promote prerelease)

---

## [1.4.0.0] - 2025-11-29

_Marketplace release with managing-plugins skill implementation._

### Added

- **claude-code-capabilities plugin** ([v1.3.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.3.0.0)): Added **managing-prompts skill** prompt engineering mastery
  - Complete skill for analyzing, creating, optimizing, and improving prompts using Claude 4.5 best practices
  - 15 supporting files (14 + SKILL.md) covering all prompt engineering aspects
  - 100% coverage of all 20 Anthropic prompt engineering documentation files
  - Major improvements:
    - Comprehensive 1-hour cache TTL documentation with pricing comparison, mixing rules, and decision flows
    - Thinking blocks + prompt caching interaction fully documented (automatic caching, token counting, invalidation patterns)
    - Expanded Structured Outputs API implementation with JSON schema requirements, comparison tables, and error handling
    - Added crop tool reference for vision optimization
    - Standardized terminology capitalization throughout
  - 5 core workflows Analyzing prompts, creating prompts, optimizing prompts, updating outdated prompts, deciding logic extraction
  - Advanced techniques: Extended thinking with budget management, prompt chaining architecture, consistency enforcement (Structured Outputs vs prefilling), guardrails implementation, context optimization with caching strategies


- **claude-code-capabilities plugin** ([v1.2.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.2.0.0)): Added **managing-plugins skill** for creating, packing, bundling, and managing Claude Code plugins
  - 5 core operations: Create plugin structure, bundle components by prefix, create marketplace config, validate plugins, pack for distribution
  - Complete marketplace schema documentation including optional fields (strict, category, tags) and source object formats (GitHub, Git repositories)
  - Team configuration workflow with `.claude/settings.json` guidance for automatic plugin installation
  - Team testing workflow with 5-step validation process before rollout
  - MCP server configuration fields documented (command, args, env, cwd)
  - All 10 hook events documented with PermissionRequest added
  - CLI commands reference: plugin validation, management, and marketplace operations
  - Subagent terminology standardized and aligned with managing-agents skill
  - Progressive disclosure: 5 supporting files with detailed specifications and real-world patterns
  - 223-line SKILL.md with structured operations and actionable workflows

## [1.3.0.0] - 2025-11-29

_Marketplace release with comprehensive Claude Code hook management._

### Added

- **claude-code-capabilities plugin** ([v1.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.1.0.0)): Added **managing-hooks skill** with 5 core workflows for hook creation, analysis, updating, plugin composition, and evaluation
  - Comprehensive documentation of all 10 hook event types including prompt-based and plugin hooks
  - 3 real-world examples: intelligent Stop hook, Python formatter plugin, MCP tool security patterns
  - Complete coverage: All 10 hook events (PreToolUse, PermissionRequest, PostToolUse, SessionStart, SessionEnd, Stop, SubagentStop, UserPromptSubmit, Notification, PreCompact), command and prompt-based hooks, plugin merging behavior, environment variables (${CLAUDE_PLUGIN_ROOT}, ${CLAUDE_ENV_FILE}), MCP tool integration consolidated in configuration guide
  - Progressive disclosure: 9 supporting files, 3 working examples, 3 production-ready templates
  - 702-line SKILL.md (~4,914-7,020 tokens) with MCP patterns consolidated into configuration-guide.md

## [1.2.0.0] - 2025-11-28

_Marketplace release with comprehensive Claude Code capabilities management._

### Added

- **claude-code-capabilities plugin** ([v1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.0.0.0)): Created for managing Claude Code skills, commands, hooks, MCPs, prompts, and subagents
  - Added **managing-agent-skills skill** with 4 core workflows for creating, analyzing, and improving agent skills
  - Complete alignment with official Claude Code documentation
  - 17 major capability areas: Technical Architecture, Security Considerations, API Integration, Package Dependencies, MCP Tool References, Skill Composition, Evaluation-Driven Development, Iterative Development, and more
  - 10 supporting files with progressive disclosure architecture
  - Token-based metrics and model-specific tuning recommendations

## [1.1.0.0] - 2025-11-27

_Marketplace release with session continuity management._

### Added

- **session-protocol plugin** ([v1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SessionProtocol_v1.0.0.0)): Added **managing-session-continuity skill** for seamless context preservation across Claude Code sessions
  - Session state management with structured JSON format
  - Save/load slash commands for preserving tasks, git state, and context blocks
  - SessionStart, PreCompact hooks for automated session handling
  - Task consolidation for efficient context storage

## [1.0.0.0] - 2025-11-26

_First marketplace release with changelog plugin._

### Added

- Marketplace infrastructure (marketplace.json, README, CONTRIBUTING, CODE_OF_CONDUCT)
- GitHub issue templates (bug report, feature request, question)
- .gitignore for Claude Code toolkit development
- Added **changelog plugin** ([v1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog_v1.0.0.0)) with **managing-changelog skill** for creating and maintaining CHANGELOG.md files
  - Documentation aligned with Common Changelog, Keep a Changelog, and SemVer standards


[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.4.0.0...HEAD
[1.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.4.0.0
[1.3.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.3.0.0
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.0.0.0
