# Changelog

All notable changes to the claude-code-capabilities plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-11-29

_Plugin expansion: Comprehensive Claude Code plugin management._

### Added

- **managing-plugins skill**: Complete plugin management for creating, bundling, validating, and distributing Claude Code plugins
  - **5 Core Operations**: Create plugin structure, bundle components by prefix, create marketplace config, validate plugins, pack for distribution
  - **Plugin Structure Documentation**: Directory layout, component organization (commands/, skills/, hooks/, agents/, .mcp.json), naming conventions
  - **plugin.json Schema**: Complete field specifications with optional metadata (author, homepage, repository, license, keywords)
  - **Marketplace Schema**:
    - Core fields: name, source, description
    - Optional fields: strict (boolean for manifest requirement), category (for organization), tags (for discovery)
    - Source formats: Local paths, GitHub object format, Git URL object format, direct URLs, tarballs
  - **Team Configuration Workflow**:
    - `.claude/settings.json` with extraKnownMarketplaces and autoInstall configuration
    - Automatic plugin installation for team members on project open
    - Support for multiple marketplaces with GitHub and Git repository sources
  - **Team Testing Workflow**: 5-step validation process (individual plugins, marketplace config, settings.json, auto-install workflow, team experience)
  - **MCP Server Configuration**: Complete field documentation (command, args, env, cwd) with ${CLAUDE_PLUGIN_ROOT} environment variable guidance
  - **Hook Events**: All 10 events documented including PermissionRequest (previously missing)
  - **CLI Commands Reference**:
    - Plugin validation: `claude plugin validate`
    - Plugin management: install, enable, disable, update, uninstall
    - Marketplace management: list, add, update, remove
    - Component testing: commands, skills, hooks
  - **Subagent Terminology**: Standardized naming and integration with managing-agents skill
  - **Supporting Files**: 5 comprehensive guides (plugin-spec.md, marketplace-spec.md, distribution-guide.md, validation-rules.md)
  - **Progressive Disclosure**: Operation-based workflow documentation with detailed specifications separated into supporting files
  - **Changelog Consolidation**: Transitioned from individual skill HISTORY.md to centralized plugin CHANGELOG.md for better maintainability

**Plugin Contents**:
- 1 skill (managing-plugins)
- 5 supporting files with complete specifications
- Ready for production use with team distribution patterns

## [1.1.0] - 2025-11-29

_Plugin expansion: Comprehensive Claude Code hook management with prompt-based and plugin hook support._

### Added

- **managing-hooks skill**: Complete hook management for Claude Code including command-based and prompt-based hooks
  - **5 Core Workflows**: Hook creation, analysis, updating, working with plugin hooks, and suggesting hook creation
  - **Command Hooks** (type: "command"): Complete coverage of bash/python-based hook scripts with security validation
  - **Prompt-based Hooks** (type: "prompt"): Comprehensive guide for LLM-powered hook decisions
    - LLM response schemas with decision/reason/continue fields
    - 4 core decision patterns: task completion analysis, semantic validation, context-aware permissions, subagent verification
    - Performance tuning and cost considerations
  - **Plugin Hooks**: Distributed hook composition covering ${CLAUDE_PLUGIN_ROOT} and ${CLAUDE_ENV_FILE} variables
    - Plugin hook merging behavior and execution ordering
    - Multi-plugin scenarios (complementary, competing, dependent)
    - Plugin composition patterns with real-world examples
  - **All 10 Hook Events**: Complete documentation
    - Tool-based: PreToolUse, PermissionRequest, PostToolUse
    - Lifecycle: SessionStart, SessionEnd
    - Agent: Stop, SubagentStop
    - Context: UserPromptSubmit, Notification, PreCompact
  - **MCP Tool Integration**: Matching patterns for Model Context Protocol tools (mcp__server__tool naming), consolidated in configuration-guide.md
  - **Input/Output Schemas**: Complete reference for all 10 hook events with tool examples
  - **Real-world Examples**: 3 production-ready examples
    - Intelligent Stop hook using prompt-based decisions
    - Python formatter plugin with full structure and scripts
    - MCP tool security and auditing patterns
  - **Supporting Files**: 9 comprehensive guides
    - prompt-hooks-guide.md: LLM-powered hooks with response schemas and patterns
    - plugin-hooks-guide.md: Distributed hook composition and multi-plugin scenarios
    - hook-schemas-reference.md: Complete input/output schemas for all 10 events
    - hook-types-reference.md: Detailed specifications for all hook event types
    - configuration-guide.md: JSON structure, matcher patterns, and MCP tool integration
    - official-response-schema.md: Official Claude Code hook response schema
    - script-examples.md: Bash and Python examples from Claude cookbooks
    - security-checklist.md: Comprehensive security validation
    - debugging-guide.md: Troubleshooting and activation issues
  - **Progressive Disclosure**: 9 supporting files + 3 examples + 3 templates organized by complexity level
  - **Token Optimization**: SKILL.md 702 lines (~4,914-7,020 tokens) with progressive disclosure architecture

**Plugin Contents**:
- 1 skill (managing-hooks)
- 15 supporting files with progressive disclosure architecture

---

## [1.0.0] - 2025-11-28

_Initial release with managing-agent-skills skill._

### Added

- **managing-agent-skills skill**: Comprehensive skill for creating, analyzing, updating, and improving Claude Code agent skills
  - 5 core workflows: Creating, Analyzing, Suggesting Conversion, Updating
  - Complete alignment with official Claude Code documentation
  - Technical Architecture section explaining runtime environment and progressive disclosure levels
  - Security Considerations covering risks for users and creators, audit guidelines, and best practices
  - API Integration with complete Python code examples, required beta headers, and versioning details
  - Package Dependencies documenting environment-specific constraints (claude.ai, Anthropic API, Claude Code)
  - MCP Tool References with naming conventions (ServerName:tool_name) and setup instructions
  - Skill Composition patterns (sequential, parallel, hierarchical) with examples
  - Evaluation-Driven Development guidance covering test-first approach and rubrics
  - Iterative Development with Claude pattern (Two-Claude Method)
  - Model-specific tuning recommendations (Haiku needs detail, Sonnet balanced, Opus avoid over-explaining)
  - Cross-platform path conventions (forward slashes, even on Windows)
  - 10 supporting files: analysis-framework.md, best-practices.md, creation-checklist.md, examples, quick-reference.md, template
  - Token-based metrics (5,000 tokens recommended, approximately 500-700 lines)

**Plugin Contents**:
- 1 skill (managing-agent-skills)
- 10 supporting files with progressive disclosure architecture
- Self-validated and production-ready

**Sources**: Official Claude Code documentation from code.claude.com, docs.claude.com, platform.anthropic.com, and GitHub cookbook examples

**Future Releases**: Additional capability management skills will be added in subsequent releases (managing-slash-commands, managing-hooks, managing-plugins, managing-prompts, managing-subagents, managing-mcps)

[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/thoeltig/claude-code-toolkit/compare/ClaudeCodeCapabilities_v1.0.0.0...v1.1.0
[1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.0.0.0
