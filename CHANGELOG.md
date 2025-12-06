# Changelog

All notable changes to the Claude Code Toolkit marketplace documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

---

## [1.7.0.0] - 2025-12-06

_Marketplace release with skill discovery command and marketplace configuration fix._

### Added

- **claude-code-capabilities plugin** ([v1.7.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.7.0.0)): Added `/list-skills` command for comprehensive skill enumeration
  - Query and display all available skills from personal (~/.claude/skills/), project (.claude/skills/), and plugin directories
  - 5 output formats: `names` (token-efficient), `paths` (file locations), `list` (human-readable, default), `table` (TSV for parsing), `json` (structured)
  - Powered by Python script (scripts/list-skills.py) for comprehensive skill discovery
  - Usage: `/list-skills [--format names|paths|list|table|json]`

### Fixed

- Fixed duplicate marketplace.json files - consolidated to single root-level marketplace.json with correct field structure, enabling repository to function as GitHub marketplace source for Claude Code plugins

---

## [1.6.0.0] - 2025-12-05

_Marketplace release with comprehensive MCP management and Messages API integration._

### Added

- **claude-code-capabilities plugin** ([v1.6.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.6.0.0)): Added **managing-mcps skill** for comprehensive Model Context Protocol management
  - 7 core workflows: Evaluating if logic should be MCP, creating servers with HTTP priority, analyzing MCPs, updating outdated MCPs, configuring connections, integrating via Messages API, using MCPs in conversations
  - 13 supporting files with progressive disclosure:
    - Core: `architecture-overview.md`, `creation-guide.md`, `analysis-framework.md`, `configuration-guide.md`, `security-best-practices.md`
    - Advanced: `mcp-connector-api-integration.md` (complete Messages API workflow), `enterprise-mcp-configuration.md`, `environment-variable-expansion.md`, `plugin-mcp-servers.md`, `mcp-resources-and-prompts.md`, `oauth-authentication-flow.md`, `deprecation-notes.md`
    - Reference: `examples.md` (AWS Bedrock patterns, FastMCP templates)
  - **Key features:**
    - **HTTP transport priority**: Explicit guidance - HTTP recommended for remote servers (better cloud support, more reliable)
    - **Messages API integration**: Complete programmatic workflow with Python examples, MCPToolset configuration patterns (allowlist, denylist, mixed)
    - **AWS Bedrock patterns**: Production-ready modular architecture using FastMCP framework with decorator-based tool registration
    - **FastMCP quick start**: Minimal template for rapid Python MCP development
    - **Progressive disclosure**: Core workflows in SKILL.md (557 lines), advanced topics loaded on-demand for token efficiency
    - **Cross-skill references**: managing-plugins (plugin bundling), managing-prompts (prompt templates)
    - **Complete CLI coverage**: All commands documented (add, add-json, add-from-claude-desktop, serve, reset-project-choices)

---

## [1.5.0.0] - 2025-12-03

_Marketplace release with slash commands and subagent management._

### Added

- **claude-code-capabilities plugin** ([v1.5.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.5.0.0)): Added **managing-subagents skill** for comprehensive subagent management
  - 9 core workflows including resumable subagents (WF9)
  - 10 supporting files with progressive disclosure
  - Key features: 0-10 point delegation scoring, resumable agents with agentId tracking, 3 reference implementations, all 6 configuration fields with inline context, 5 permission modes, cross-skill references (managing-prompts, managing-plugins, managing-agent-skills)
  - Management patterns: /agents interface, CLI configuration via --agents flag, plugin agent integration
  - Complete alignment with official Claude Code subagent documentation (95%+ coverage)
  - Operational focus: asks user for documentation when information unclear, no self-updating references

- **claude-code-capabilities plugin** ([v1.4.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.4.0.0)): Added **managing-slash-commands skill** for custom slash command management
  - 4 core workflows: creating, analyzing, suggesting conversion, updating commands
  - 8 supporting files including SlashCommand tool reference, argument patterns, and examples
  - Extended thinking support for complex reasoning tasks
  - Plugin command and MCP command integration guidance
  - Cross-skill references to managing-plugins, managing-mcps, and managing-prompts

### Changed

- **changelog plugin** ([v1.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog_v1.1.0.0)):
  - Removed HISTORY.md migration workflow (WF4) - simplified skill to focus on core changelog operations

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


[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.7.0.0...HEAD
[1.7.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.7.0.0
[1.6.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.6.0.0
[1.5.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.5.0.0
[1.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.4.0.0
[1.3.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.3.0.0
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.0.0.0
