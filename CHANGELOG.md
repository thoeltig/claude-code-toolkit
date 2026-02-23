# Changelog

All notable changes to the Claude Code Toolkit marketplace documented here.

Format: [Common Changelog](https://common-changelog.org) + [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [Unreleased]

## [1.17.0.0] - 2026-02-23

_Marketplace release with smart-compact major algorithm improvements and code restructuring._

### Added

- **smart-compact plugin** evolved from [v1.4.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v1.4.1.0) to [v2.2.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v2.2.1.0):
  - **v2.0.0.0**: Complete algorithm rewrite from backward-iterating to forward-chaining for improved clarity and efficiency
    - Forward-chaining dedup: Processes reads chronologically per file for intuitive duplicate detection
    - Keep-last strategy: Latest occurrence represents current state (aligns with LLM token reading preference)
    - Content type auto-detection: Line-level diffing for multiline, character-level for single-line (JSON)
    - Configurable thresholds: Min bytes, context margins via environment variables
    - Raw content extraction: Detects Write → Read edge cases
    - Improved output formats: Short format (`Savings: XXX bytes (~YYY tokens)`) and normal reporting
  - **v2.1.0.0**: Extended deduplication to bash and grep operations
    - Bash dedup: Treats file-reading commands (cat, head, tail, wc) like Read operations
    - Grep dedup: Safely deduplicates grep searches when later reads exist
    - Unified operation stream: Process all operations (Read, Write, Bash, Grep, Edit) chronologically
    - Edit tracking: Validates dedup safety between grep and reads
  - **v2.1.1.0**: Smart edit overlap detection and extended bash patterns
    - Smart overlap: Only skip dedup if edits touch exact lines matched by grep (no false negatives)
    - Extended patterns: Support head, tail, wc with flags; bash -c wrapped commands
    - Line number extraction: Parse grep output to enable safe overlap checking
  - **v2.2.0.0**: Bash script execution deduplication
    - Script output dedup: Detect identical python, npm, node, dotnet, ruby, java, go outputs
    - Keep-last for scripts: Earlier identical runs marked redundant, latest output kept
    - Pattern recognition: Auto-identify script invocations (python script.py, npm test, etc.)
    - Context-aware markers: Separate messages for file reads vs script outputs
  - **v2.2.1.0**: Code restructuring and maintainability improvements
    - Package refactoring: Split 1299-line monolithic script into focused Python package
    - Modular structure: const_models_and_config, content, detection, extract, __init__ modules
    - 72% complexity reduction in main script (1299 → 368 lines)
    - Single responsibility per module: Easier to test, extend, understand
    - Backward compatibility: All tests pass (edge cases, smart overlap, pattern matching)

### Changed

- **smart-compact internal structure**: Reorganized from monolithic script to modular package
  - `const_models_and_config.py` (141 lines): Data models, enums, configuration, markers
  - `content.py` (197 lines): Content type detection and diffing
  - `detection.py` (106 lines): Pattern detection for grep, bash, edit operations
  - `extract.py` (377 lines): Transcript I/O and operation extraction
  - `__init__.py` (71 lines): Clean public API with __all__ exports
  - Enhanced maintainability without changing external behavior or functionality

- **Reduced allowed tools scope**: Restrict tools to minimum necessary for each skill/command
  - **changelog plugin**: Removed `allowed-tools` from `managing-changelog` skill (informational only, auto-allows tools)
  - **documentation plugin**: Removed `allowed-tools` from `managing-documentation` skill (informational only, auto-allows tools)
  - **fetch-full-content plugin**: Restricted `Bash(python:*)` → `Bash(python ${CLAUDE_PLUGIN_ROOT}/scripts/fetch_full_content.py *)` (specific script only)
  - **project-intel plugin**: Restricted `Bash(node:*)` → `Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/dist/ctx.js *)` (specific script only)
  - **session-protocol plugin**: Restricted `Bash` → `Bash(git rev-parse *)` (git-only operations)
  - Improved security and predictability by preventing unintended tool usage

---

## [1.16.0.0] - 2026-02-17

_Marketplace release with smart-compact notification system, plugin infrastructure refinements, and project-intel scan fixes._

### Added

- **smart-compact plugin** (evolved from [v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v1.0.0.0) to [v1.4.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v1.4.1.0)): Major improvements to deduplication and user notifications
  - User notification system: Stop hook displays duplicate summaries (e.g., "Duplication in conversation: 15.4K characters (14.5K tokens, 7.2% of total context window)")
  - Configurable notification and cache validation thresholds via environment variables
  - Cross-platform system notifications via cross-platform-notification plugin (Windows, macOS, Linux)
  - Self-documenting deduplication markers for better LLM understanding
  - Human-readable formatting for bytes (KB, MB) and tokens (K)
  - Token estimation calculations improved (now uses standard ~4 bytes ≈ 1 token conversion)
  - Byte counting for resumed sessions now uses actual message content for accuracy

### Changed

- Plugin infrastructure and configuration
  - Updated all plugin.json files and cleaned up marketplace.json for consistency
  - Fixed tsConfig in project-intel project for proper build configuration

### Fixed

- **project-intel plugin** ([v1.5.2.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.5.2.0)): Scan command refinement
  - Fixed scan output example format in `/scan` slash command (prevented example output from overriding subagent format)

---

## [1.15.0.0] - 2026-02-08

_Marketplace release with transcript deduplication plugin._

### Added

- **smart-compact plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SmartCompact_v1.0.0.0)): New plugin for automatic transcript deduplication
  - Hash-based duplicate detection (SHA256) for file content comparison
  - Two-level deduplication strategy: Write priority (Rule 1) and token priority for Reads (Rule 2)
  - Integration modes: Automatic via SessionEnd hook or manual CLI with `--dry-run` preview
  - Support for minified JSONL and pretty-printed JSON transcript formats
  - Unicode path support for non-ASCII characters
  - Detailed reporting with transparency markers for removed duplicates
  - O(n) time complexity with no false positives, reversible changes

---

## [1.14.0.0] - 2026-02-06

_Marketplace release with project-intel stability and session-protocol command simplification._

### Changed

- **project-intel plugin** ([v1.4.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.4.0.0)): Stability improvements
  - Fixed entry ordering when loading and saving from summaries
  - Fixed merge logic to avoid obsolete entry deletion
  - Improved ignore patterns to include dotfiles with selective filtering for build/cache directories
  - Fixed summary lookup map building during merge
  - Fixed file modification date comparison for accurate staleness detection

- **project-intel plugin** ([v1.5.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.5.0.0)): Code organization and discovery logic improvements
  - Extracted constants and types into dedicated types.ts file for better maintainability
  - Fixed knowledge directory discovery with early exit when location/process directory is higher in structure
  - Fixed unused calledFromHook early exit logic
  - Fixed git detection to check for git repo in location instead of only checking if git is installed
  - Simplified file system search logic in findKnowledgeDir for better reliability

- **project-intel plugin** ([v1.5.1.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.5.1.0)): Bug fixes for partial summaries and record structure
  - Fixed error when knowledgeDir argument wasn't provided on merge
  - Fixed remaining usages of old files and directories record structure, now uses map structure consistently
  - Corrected total sizes returned on scan/merge operations
  - Fixed deletion of obsolete directory entries

- **session-protocol plugin** ([v1.2.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SessionProtocol_v1.2.0.0)): Command simplification and improved session workflow
  - **Breaking:** Removed `/save-session-protocol` and `/load-session-protocol` slash commands - managing-session-continuity skill can be invoked directly if necessary
  - Improved assistant instruction in session start hook: complete workflow provided when session protocol exists

---

## [1.13.0.0] - 2026-02-05

_Marketplace release with project-intel query optimization and session automation, plus fetch-full-content security enhancements._

### Changed

- **project-intel plugin** ([v1.2.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.2.0.0)): Session automation and intelligent knowledge maintenance
  - SessionStart hook with automatic notifications (total files, files needing update, scan suggestions)
  - Automatic deletion cleanup: Files and directories removed from scan location are cleaned from summaries
  - Filesystem modification date detection for parity with git-based change detection
  - Dynamic knowledgeDir discovery with intelligent fallback chain (explicit arg → location-based → process-based)
  - Eliminates need to repeatedly specify `--knowledgeDir` for same-directory operations

- **project-intel plugin** ([v1.3.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.3.0.0)): Query optimization with improved output structure and per-file technologies
  - Per-file technologies tracking: Each file captures its technologies (TypeScript, Python, JSON, etc.) during scan for granular matching
  - Optimized query output: Removed redundant `path` field in grouped format, now uses `fileName` + `folderPath` to eliminate duplication
  - Removed `lastUpdated` from query results (now irrelevant with SessionStart hook showing staleness)
  - Changed default query format to `grouped` (hierarchical organization by directory) for better architectural context
  - Flat format includes per-file technologies for detailed cross-file comparisons
  - Improved documentation: Clear guidance on when to use grouped vs flat output with use-case descriptions

- **fetch-full-content plugin** ([v1.2.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/FetchFullContent_v1.2.0.0)): Security enhancements with prompt injection filtering
  - Basic prompt injection filtering for common hidden content vectors (comments, visibility, font-size, opacity, color alpha)
  - Warning output when hidden content is filtered (both stdout and markdown file)
  - Enhanced security notice clarifying filtering scope and limitations

---

## [1.12.0.0] - 2026-01-18

_Marketplace release with project-intel performance enhancement._

### Changed

- **project-intel plugin** ([v1.1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.1.0.0)): Performance enhancement with Git-based incremental scanning
  - Only re-analyze files modified since last scan (80-95% reduction on subsequent scans)
  - Automatic git tracking detection with filesystem fallback
  - Modification timestamp tracking from git history for accurate staleness detection

---

## [1.11.0.0] - 2026-01-14

_Marketplace release with lightweight reconnaissance system for directed code exploration._

### Added

- **project-intel plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ProjectIntel_v1.0.0.0)): Lightweight reconnaissance system that provides direction before exploration
  - `/scan` command: Generate semantic summaries of project files and directories (one-time setup)
  - `/query` command: Search summaries by semantic relevance before reading files
  - Semantic scoring system matching on purpose, summary, exports/imports, technologies, and path
  - Wave-based parallel processing: Max 10 concurrent agents for large projects
  - Persistent storage: `.knowledge/summaries.json` survives across sessions
  - Directory and file summary generation with purpose, role, exports, imports, and technologies tracking
  - File modification timestamp tracking for staleness detection
  - Scope filtering: Limit queries to specific directories with `--scope` parameter
  - Result limiting: Control query results with `--max` parameter
  - Incremental updates: Re-scan merges new summaries with existing knowledge
  - Best practices guide for maintenance strategy and query approaches
  - Performance characteristics: Cost estimates for projects of different sizes
  - Troubleshooting guide with common issues and solutions
  - Comparison to alternatives: vs. Explore agent, Grep/Glob, direct file reading
  - Design decision documentation: Why persistent storage, wave-based processing, semantic scoring, query-first workflow, and user-managed staleness
  - Support for semantic matching on conceptual terms, not just keywords
  - Project structure guidance: When to use project-intel, when to skip it, breakeven analysis 


---

## [1.10.0.0] - 2026-01-12

_Marketplace release with documentation plugin and full-fetch-content enhancement._

### Added

- **documentation plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Documentation_v1.0.0.0)): New plugin for creating and maintaining high-quality project documentation
  - **managing-documentation skill** with 4 core workflows (WF1-WF4) for documentation lifecycle management
  - WF1: Creating New Documentation - define purpose, plan structure, write for global audience, ensure inclusivity, validate quality
  - WF2: Updating Existing Documentation - assess state, prioritize improvements, update content, verify changes
  - WF3: Validating Documentation Quality - check content quality, clarity, inclusivity, completeness
  - WF4: Applying Agile/Lean Principles - document late, update constantly, with purpose, choose best medium
  - Support for multiple documentation types: guides, API docs, README files, architecture documentation
  - ARID principles: Accept Repetition, Skimmable, Exemplary, Consistent, Current
  - Global audience support: simple language, defined abbreviations, concrete examples, no idioms
  - Inclusive language standards: no ableist, gendered, violent, or culturally specific language
  - Quality checklists by document type (Guides, API Docs, README, Architecture)
  - Validation patterns for problematic terms: ableist, gendered, violent language, time-based references, excessive claims, overused politeness
  - Writing style principles: tone, voice, techniques, things to avoid
  - Tool usage patterns: finding docs, validating content, understanding context, large-scale operations
  - Common issues and fixes table with diagnosis and solutions
  - Implementation approach with 6-step methodology
  - Anti-patterns guide including outdated information, too much detail, unclear jargon, inconsistent terminology, cultural insensitivity
  - Comprehensive documentation standards for clarity, accessibility, and inclusivity
  - Support for Read, Write, Edit, Glob, Grep and Task tools

### Changed

- **fetch-full-content plugin** ([v1.1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/FetchFullContent_v1.1.0.0)): Enhanced configuration flexibility
  - Made folder argument optional with default cache directory
  - Restricted allowed-tools to Python only (removed other tool types)

---

## [1.9.0.0] - 2026-01-08

_Marketplace release with new cross-platform notification plugin and session-protocol refactoring._

### Added

- **cross-platform-notification plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/CrossPlatformNotification_v1.0.0)): New plugin for native system notifications
  - Support for Windows, macOS, and Linux with platform-specific notification systems
  - Windows toast notifications via PowerShell
  - macOS notifications via terminal-notifier
  - Linux notifications via notify-send
  - Automatic fallback to console output when native notifications unavailable
  - Hooks into Claude Code events for automated notifications

### Changed

- **session-protocol plugin** ([v1.1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SessionProtocol_v1.1.0.0)):
  - **Breaking:** Removed notification hook and related notification infrastructure
  - Notification functionality separated into dedicated cross-platform-notification plugin for cleaner feature separation
  - Simplified to focus on session continuity management
  - Removed PreCompact hook
  - SessionStart hook remains for auto-detection of existing session protocols

- **claude-code-capabilities plugin** ([v1.8.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.8.0.0)):
  - Removed `/list-skills` slash command - Claude Code v2.1.0 added a built-in `/skills` command, making the custom command obsolete

---

## [1.8.1.0] - 2026-01-06

### Fixed

- The fetch-full-content slash command failed to find the script because of a wrong filepath.

---

## [1.8.0.0] - 2026-01-06

_Marketplace release with fetch-full-content plugin for complete web content retrieval._

### Added

- **fetch-full-content plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/FetchFullContent_v1.0.0.0)): Added `/fetch-full-content` command for complete web content retrieval
  - 100% content retrieval vs built-in WebFetch's 30-80% summarized content
  - Filesystem caching to avoid redundant fetches on repeated analysis
  - HTML to markdown conversion
  - Support for multiple URLs and batch processing via URL files
  - ⚠️ **Security**: NO prompt injection detection - only use on trusted sources (official docs, controlled content)
  - Recommendation: Use built-in WebFetch for untrusted sources

---

## [1.7.0.0] - 2025-12-06

_Marketplace release with skill discovery command and marketplace configuration fix._

### Added

- **claude-code-capabilities plugin** ([v1.7.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.7.0.0)): Added `/list-skills` command for comprehensive skill enumeration
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

- **claude-code-capabilities plugin** ([v1.6.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.6.0.0)): Added **managing-mcps skill** for comprehensive Model Context Protocol management
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

- **claude-code-capabilities plugin** ([v1.5.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.5.0.0)): Added **managing-subagents skill** for comprehensive subagent management
  - 9 core workflows including resumable subagents (WF9)
  - 10 supporting files with progressive disclosure
  - Key features: 0-10 point delegation scoring, resumable agents with agentId tracking, 3 reference implementations, all 6 configuration fields with inline context, 5 permission modes, cross-skill references (managing-prompts, managing-plugins, managing-agent-skills)
  - Management patterns: /agents interface, CLI configuration via --agents flag, plugin agent integration
  - Complete alignment with official Claude Code subagent documentation (95%+ coverage)
  - Operational focus: asks user for documentation when information unclear, no self-updating references

- **claude-code-capabilities plugin** ([v1.4.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.4.0.0)): Added **managing-slash-commands skill** for custom slash command management
  - 4 core workflows: creating, analyzing, suggesting conversion, updating commands
  - 8 supporting files including SlashCommand tool reference, argument patterns, and examples
  - Extended thinking support for complex reasoning tasks
  - Plugin command and MCP command integration guidance
  - Cross-skill references to managing-plugins, managing-mcps, and managing-prompts

### Changed

- **changelog plugin** ([v1.1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog_v1.1.0.0)):
  - Removed HISTORY.md migration workflow (WF4) - simplified skill to focus on core changelog operations

---

## [1.4.0.0] - 2025-11-29

_Marketplace release with managing-plugins skill implementation._

### Added

- **claude-code-capabilities plugin** ([v1.3.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.3.0.0)): Added **managing-prompts skill** prompt engineering mastery
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


- **claude-code-capabilities plugin** ([v1.2.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.2.0.0)): Added **managing-plugins skill** for creating, packing, bundling, and managing Claude Code plugins
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

- **claude-code-capabilities plugin** ([v1.1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.1.0.0)): Added **managing-hooks skill** with 5 core workflows for hook creation, analysis, updating, plugin composition, and evaluation
  - Comprehensive documentation of all 10 hook event types including prompt-based and plugin hooks
  - 3 real-world examples: intelligent Stop hook, Python formatter plugin, MCP tool security patterns
  - Complete coverage: All 10 hook events (PreToolUse, PermissionRequest, PostToolUse, SessionStart, SessionEnd, Stop, SubagentStop, UserPromptSubmit, Notification, PreCompact), command and prompt-based hooks, plugin merging behavior, environment variables (${CLAUDE_PLUGIN_ROOT}, ${CLAUDE_ENV_FILE}), MCP tool integration consolidated in configuration guide
  - Progressive disclosure: 9 supporting files, 3 working examples, 3 production-ready templates
  - 702-line SKILL.md (~4,914-7,020 tokens) with MCP patterns consolidated into configuration-guide.md

## [1.2.0.0] - 2025-11-28

_Marketplace release with comprehensive Claude Code capabilities management._

### Added

- **claude-code-capabilities plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.0.0.0)): Created for managing Claude Code skills, commands, hooks, MCPs, prompts, and subagents
  - Added **managing-agent-skills skill** with 4 core workflows for creating, analyzing, and improving agent skills
  - Complete alignment with official Claude Code documentation
  - 17 major capability areas: Technical Architecture, Security Considerations, API Integration, Package Dependencies, MCP Tool References, Skill Composition, Evaluation-Driven Development, Iterative Development, and more
  - 10 supporting files with progressive disclosure architecture
  - Token-based metrics and model-specific tuning recommendations

## [1.1.0.0] - 2025-11-27

_Marketplace release with session continuity management._

### Added

- **session-protocol plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/SessionProtocol_v1.0.0.0)): Added **managing-session-continuity skill** for seamless context preservation across Claude Code sessions
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
- Added **changelog plugin** ([v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/Changelog_v1.0.0.0)) with **managing-changelog skill** for creating and maintaining CHANGELOG.md files
  - Documentation aligned with Common Changelog, Keep a Changelog, and SemVer standards


[unreleased]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.17.0.0...HEAD
[1.17.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.16.0.0...v1.17.0.0
[1.16.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.15.0.0...v1.16.0.0
[1.15.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.14.0.0...v1.15.0.0
[1.14.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.13.0.0...v1.14.0.0
[1.13.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.12.0.0...v1.13.0.0
[1.12.0.0]: https://github.com/thoeltig/claude-code-toolkit/compare/v1.11.0.0...v1.12.0.0
[1.11.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.11.0.0
[1.10.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.10.0.0
[1.9.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.9.0.0
[1.8.1.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.8.1.0
[1.8.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.8.0.0
[1.7.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.7.0.0
[1.6.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.6.0.0
[1.5.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.5.0.0
[1.4.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.4.0.0
[1.3.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.3.0.0
[1.2.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.2.0.0
[1.1.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.1.0.0
[1.0.0.0]: https://github.com/thoeltig/claude-code-toolkit/releases/tag/v1.0.0.0