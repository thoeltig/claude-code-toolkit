# Claude Code Capabilities Plugin

Comprehensive management of Claude Code features including skills, slash commands, hooks, MCPs (Model Context Protocol servers), subagents, and prompts. This plugin provides tools for creating, analyzing, and improving Claude Code capabilities with guidance from official documentation.

## What's Included

### managing-agent-skills

A comprehensive skill for creating, analyzing, updating, and improving Claude Code agent skills.

**Core Capabilities:**
- **WF1: Create Skills** - Complete workflow from requirements to production-ready SKILL.md
- **WF2: Analyze Skills** - Quality evaluation with 14-point rubric and gap analysis
- **WF3: Suggest Conversion** - Decision framework for workflow → skill conversion
- **WF4: Update Skills** - Systematic update process for outdated skills

**Key Features:**
- Complete alignment with official Claude Code documentation (74+ sources)
- 17 major capability areas including:
  - Technical Architecture & Runtime Environment
  - Security Considerations (user safety, creator guidelines)
  - API Integration (Python SDK, beta headers, versioning)
  - Package Dependencies & Environment Constraints
  - MCP Tool References & Naming Conventions
  - Skill Composition Patterns (sequential, parallel, hierarchical)
  - Evaluation-Driven Development & Test-First Approach
  - Iterative Development with Two-Claude Method
  - Model-Specific Tuning (Haiku, Sonnet, Opus)
  - Cross-Platform Path Conventions
- 10 supporting files with progressive disclosure architecture:
  - analysis-framework.md
  - best-practices.md
  - creation-checklist.md
  - examples/ directory
  - quick-reference.md
  - template/ directory
- Token-based metrics (5,000 tokens recommended)
- YAML frontmatter with allowed-tools support

**Triggers:**
- Skill creation requests
- Skill analysis/evaluation
- Converting workflows to skills
- Updating outdated skills
- Questions about skill concepts, structure, authoring

---

### managing-hooks

Comprehensive management of Claude Code event-driven automation hooks, covering both command-based and prompt-based hooks.

**Core Capabilities:**
- **WF1: Creating Hooks** - Complete workflow from hook type selection to production deployment
  - Step 3.5: Prompt-based hooks for LLM-powered decisions
- **WF2: Analyzing Hooks** - Quality evaluation and security assessment
- **WF3: Updating Hooks** - Systematic update process for outdated hooks
- **WF4: Working with Plugin Hooks** - Distributed hook composition and multi-plugin scenarios
- **WF5: Suggesting Hook Creation** - Decision framework for automation vs inline logic

**Key Features:**
- **Complete Event Coverage** (10 events):
  - Tool-based: PreToolUse, PermissionRequest, PostToolUse
  - Lifecycle: SessionStart, SessionEnd
  - Agent: Stop, SubagentStop
  - Context: UserPromptSubmit, Notification, PreCompact
- **Command Hooks** (type: "command"): Bash/Python scripts with security validation
- **Prompt-based Hooks** (type: "prompt"): LLM-powered decisions with response schemas
  - 4 decision patterns: task completion, semantic validation, context-aware permissions, subagent verification
- **Plugin Hooks**: Distributed hook composition with ${CLAUDE_PLUGIN_ROOT} and ${CLAUDE_ENV_FILE}
  - Multi-plugin scenarios and execution ordering
- **MCP Tool Integration**: Matching patterns for Model Context Protocol tools (mcp__server__tool)
- **Complete Input/Output Schemas**: All 10 hook events with tool examples
- **8 Supporting Guides**:
  - prompt-hooks-guide.md
  - plugin-hooks-guide.md
  - hook-schemas-reference.md (complete schemas)
  - hook-types-reference.md
  - configuration-guide.md
  - script-examples.md
  - security-checklist.md
  - debugging-guide.md
- **3 Real-world Examples**:
  - Intelligent Stop hook using prompt-based decisions
  - Python formatter plugin with full structure
  - MCP tool security and auditing patterns
- **Progressive Disclosure**: 9 guides + 3 examples, organized by complexity

**Triggers:**
- Hook creation requests
- Hook analysis/improvement
- Event-driven automation questions
- Questions about hook types, configuration, security
- Plugin hook composition patterns

---

### managing-plugins

Complete plugin management for creating, bundling, validating, and distributing Claude Code plugins.

**Core Capabilities:**
- **OP1: Create Plugin Structure** - Directory setup with proper organization (commands/, skills/, hooks/, .mcp.json)
- **OP2: Bundle Components** - Pack skills/commands/hooks/MCPs by prefix or explicit list
- **OP3: Create Marketplace Config** - Generate marketplace.json with source formats (GitHub, Git, local, URLs)
- **OP4: Validate Plugin** - Check structure, manifests, naming conventions
- **OP5: Pack for Distribution** - Prepare plugin for sharing with plugin.json generation

**Key Features:**
- **Plugin Structure Documentation**: Complete directory layout, component organization, naming conventions
- **plugin.json Schema**: Required fields (name, description, version, author) and optional metadata (homepage, repository, license, keywords)
- **Marketplace Schema**:
  - Core fields: name, source, description
  - Optional fields: strict (manifest requirement), category (organization), tags (discovery)
  - Source formats: Local paths, GitHub objects, Git URL objects, direct URLs, tarballs
- **Team Configuration Workflow**: `.claude/settings.json` with extraKnownMarketplaces and autoInstall for automatic plugin installation
- **Team Testing Workflow**: 5-step validation process before team rollout
- **MCP Server Configuration**: Complete field documentation (command, args, env, cwd) with ${CLAUDE_PLUGIN_ROOT} environment variable
- **Hook Events**: All 10 events documented including PermissionRequest
- **CLI Commands Reference**: plugin validation, install, enable, disable, update, uninstall
- **5 Supporting Files**:
  - plugin-spec.md - Complete plugin.json schema and field specifications
  - marketplace-spec.md - Marketplace configuration and source object formats
  - distribution-guide.md - Packaging and sharing plugins
  - validation-rules.md - Plugin validation checklist
  - team-workflow.md - Team configuration and rollout process

**Triggers:**
- Plugin creation/bundling requests
- Plugin validation or analysis
- Marketplace configuration questions
- Team plugin distribution
- Questions about plugin structure, manifest, or distribution

---

### managing-prompts

Production-ready prompt engineering skill with 100% coverage of all 20 Anthropic documentation files. Complete mastery of prompt creation, analysis, optimization, and Claude 4.5 best practices.

**Core Capabilities:**
- **WF1: Analyzing Existing Prompts** - Quality evaluation with rubric, issue categorization (critical/major/minor), technique identification
- **WF2: Creating New Prompts** - Architecture selection (simple task/complex reasoning/agent/multi-window), technique application, guardrail implementation
- **WF3: Optimizing Existing Prompts** - Goal-based transformations (reduce tokens, improve quality, increase consistency, reduce hallucinations, enable caching)
- **WF4: Updating Outdated Prompts** - Claude 3→4.5 migration with pattern updates
- **WF5: Deciding Logic Extraction** - Decision trees for prompt vs script extraction with criteria scoring

**Key Features:**
- **Extended Thinking Implementation**: Budget management (1024-32K+ tokens), batch processing for >32K, multi-round strategies, thinking blocks + caching interaction
- **Prompt Caching Mastery**:
  - 1-hour cache TTL documentation with pricing comparison and mixing rules
  - Cache minimum thresholds by model (1024-4096 tokens)
  - Thinking blocks + caching interaction (automatic caching, token counting, invalidation patterns)
- **Structured Outputs API**: Complete implementation with JSON schema requirements, comparison with prefilling, decision flows, error handling
- **Prompt Chaining Architecture**: Sequential/parallel workflows, handoff patterns, orchestration, self-correction loops
- **Consistency Techniques**: Structured Outputs vs prefilling decision framework, format enforcement, multishot prompting
- **Claude 4.5 Optimization**: Explicit instructions, context awareness, multi-context workflows, tool usage, vision improvements with crop tool
- **Guardrails Implementation**: Hallucination prevention, consistency enforcement, security measures, jailbreak prevention, prompt leak reduction
- **Context Optimization**: Token management, prompt caching strategies, document organization, splitting decisions
- **15 Supporting Files (14 + SKILL.md)**:
  - analysis-patterns.md - Common issues and quality assessment
  - architecture-patterns.md - 5 pattern types with templates
  - claude-4-5-optimization.md - Claude 4.5-specific optimizations
  - consistency-techniques.md - Structured Outputs API, prefilling, format enforcement
  - context-optimization.md - Token efficiency, caching with 1h TTL, document organization
  - extended-thinking-implementation.md - Budget management, thinking + caching, batch processing
  - extraction-decision-guide.md - Decision trees for logic extraction
  - guardrails-implementation.md - Hallucination, security, jailbreak patterns
  - migration-guide.md - Claude 3→4.5 migration with 10 examples
  - optimization-strategies.md - 11 before/after optimization examples
  - output-formats.md - Report templates for all workflows
  - prompt-chaining-architecture.md - Sequential/parallel workflows
  - quick-reference.md - Fast validation checklists, decision trees
  - technique-reference.md - Indexed lookup by use case with quick table

**Triggers:**
- Prompt creation, analysis, or optimization requests
- Questions about prompt engineering, Claude 4.5 best practices
- Mentions of hallucinations, consistency issues, context optimization
- Prompt caching, chain-of-thought, XML tags, Structured Outputs
- Logic extraction decisions (prompt vs script)
- Extended thinking or prompt chaining questions

---

### managing-slash-commands

Complete management of custom slash commands with advanced features for programmatic invocation and ecosystem integration.

**Core Capabilities:**
- **WF1: Creating Slash Commands** - Complete workflow from requirements through production-ready command
  - Design with proper frontmatter (description, allowed-tools, argument-hint, model)
  - Support for extended thinking in complex reasoning tasks
  - Validation and testing steps
- **WF2: Analyzing Existing Commands** - Quality evaluation and best practices assessment
- **WF3: Suggesting Command vs Skill Conversion** - Decision framework for workflow architecture
- **WF4: Updating Outdated Commands** - Systematic modernization of existing commands

**Key Features:**
- **Complete Official Alignment**: Full coverage of Claude Code slash command documentation including all frontmatter fields
- **Extended Thinking Support**: Guidance for complex reasoning tasks with thinking keywords
- **SlashCommand Tool Documentation**: Programmatic invocation, permissions, character budget limits, disable-model-invocation field
- **Plugin Command Integration**: Plugin-scoped namespacing (`plugin-name:command-name` pattern), conflict resolution
- **MCP Command Discovery**: Dynamic command discovery from connected MCP servers, argument handling
- **4 Argument Patterns**: No arguments, $ARGUMENTS, positional ($1-$9), and advanced patterns with edge cases
- **Helper Scripts Guide**: When to use scripts vs interpreted logic with practical examples and best practices
- **8 Supporting Files**:
  - best-practices.md - Command naming, prompt content, YAML frontmatter, bash execution, advanced features
  - creation-guide.md - Step-by-step process with decision matrix and five phases
  - validation-checklist.md - 11-category validation with quick validation and comprehensive checks
  - examples.md - 8 annotated examples including extended thinking patterns
  - argument-patterns.md - 8 patterns with advanced patterns and testing strategies
  - slashcommand-tool-reference.md - Advanced reference for SlashCommand tool, plugin commands, MCP commands
  - templates/command-template.md - Template for new command files
- **Progressive Disclosure**: 8 supporting files organized by complexity level
- **Cross-Skill References**: Inline references to managing-plugins (plugin commands), managing-mcps (MCP commands), managing-prompts (advanced prompt engineering)

**Triggers:**
- Slash command creation requests
- Command analysis/improvement
- Command vs skill conversion questions
- Slash command validation and best practices
- Questions about SlashCommand tool, plugin commands, or MCP commands

---

### managing-subagents

Systematic approach for analyzing, evaluating, creating, and improving subagent configurations to maximize effectiveness.

**Core Capabilities:**
- **WF1: Analyzing Context for Subagent Delegation** - Score tasks (0-10 points) to decide: subagent vs direct tools
- **WF2: Explaining Subagent Concepts to Users** - Comprehensive guidance on subagent benefits, use cases, and built-in agent types
- **WF3: Evaluating Existing Subagent Configurations** - Systematic evaluation for effectiveness, identifying improvements and issues
- **WF4: Identifying Outdated Agent Configurations** - Verify current state against documentation, detect deprecated patterns
- **WF5: Recommending Subagent Improvements** - Optimization patterns for descriptions, prompts, tools, and model selection
- **WF6: Deciding When to Create New Subagents** - Decision framework with 7 criteria for custom agent creation
- **WF7: Managing Subagents via /agents Command** - Interactive interface for creating, editing, deleting, and inspecting agents
- **WF8: Understanding Configuration Fields** - Complete reference for all YAML configuration options with inline context
- **WF9: Using Resumable Subagents** - Continue previous subagent work across multiple invocations with full context preservation

**Key Features:**
- **Complete Official Alignment**: 95%+ coverage of all Claude Code subagent documentation
- **Decision Scoring Matrix**: 0-10 point scoring across 5 dimensions (context, complexity, parallelization, focus, iteration)
- **3 Reference Implementations**: Production-ready example agents (code-reviewer, debugger, data-scientist) for adaptation patterns
- **Configuration Fields**: All 6 fields documented (name, description, tools, model, permissionMode, skills)
- **Resumable Agents**: agentId tracking, resume parameter, transcript management, iterative refinement workflows
- **Permission Modes**: 5 modes explained (default, acceptEdits, bypassPermissions, plan, ignore) with decision criteria
- **Management Patterns**: /agents command interface, CLI configuration (--agents flag), plugin agent integration
- **Cross-Skill References**: managing-prompts (prompt optimization), managing-plugins (plugin agents), managing-agent-skills (skill authoring)
- **10 Supporting Files**:
  - agents-command-guide.md - /agents interface workflow and tool management
  - analysis-framework.md - Systematic evaluation criteria for existing agents
  - cli-configuration.md - Dynamic agent definition via CLI for session-specific or test agents
  - configuration-reference.md - Complete field documentation with examples and migration guide
  - decision-matrix.md - Delegation scoring rubric with practical examples
  - example-subagents.md - Reference implementations with adaptation patterns
  - improvement-patterns.md - 17 optimization patterns for descriptions, prompts, tools, models
  - multi-agent-patterns.md - Parallel and sequential orchestration strategies
  - permission-modes.md - 5 permission modes with decision criteria and use cases
  - plugin-agents.md - Plugin agent discovery, conflicts, and integration

**Triggers:**
- Deciding if a task should delegate to a subagent
- Analyzing existing agent effectiveness
- Recommending agent improvements and optimizations
- Creating specialized agents for recurring patterns
- Managing agents via /agents or CLI
- Questions about resumable agents or continuing previous work

---

### managing-mcps

Comprehensive management of Model Context Protocol servers with Messages API integration, enterprise configuration, and plugin bundling.

**Core Capabilities:**
- **WF1: Evaluating if Logic Should Be MCP** - 6-criteria decision checklist
- **WF2: Creating New MCP Server** - Complete workflow with HTTP priority guidance (7 steps)
- **WF3: Analyzing Existing MCP** - Quality evaluation and improvement discovery (5 steps)
- **WF4: Updating Outdated MCP** - Systematic modernization for new specifications (5 steps)
- **WF5: Configuring MCP Connection** - CLI methods, .mcp.json structure, OAuth, plugin MCPs
- **WF6: Using MCPs via Messages API** - Server configuration, MCPToolset patterns, beta headers, response handling
- **WF7: Using MCPs in Conversations** - Resources (@server:path), prompts (/mcp__server__prompt), output limits

**Key Features:**
- **95%+ Official Documentation Coverage**: Complete alignment with code.claude.com/docs/en/mcp and docs.claude.com/en/docs/agents-and-tools
- **Progressive Disclosure**: Core workflows in SKILL.md (557 lines), advanced topics loaded on-demand for token efficiency
- **HTTP Transport Priority**: Explicit guidance - HTTP recommended for remote servers (better cloud support, more reliable)
- **Messages API Integration**: Complete programmatic workflow with Python examples, allowlist/denylist/mixed MCPToolset patterns
- **AWS Bedrock Patterns**: Production-ready modular architecture using FastMCP framework with decorator-based tool registration
- **FastMCP Quick Start**: Minimal template for rapid Python MCP development with type hints and docstrings
- **Cross-Skill References**: managing-plugins (plugin bundling), managing-prompts (prompt templates)
- **Token-Efficient Loading**: Common workflows (create/analyze) load minimal files, API integration loads detailed reference
- **Complete CLI Coverage**: All commands documented (add, add-json, add-from-claude-desktop, serve, reset-project-choices)
- **13 Supporting Files:**
  - Core: `architecture-overview.md`, `creation-guide.md`, `analysis-framework.md`, `configuration-guide.md`, `security-best-practices.md`
  - Advanced: `mcp-connector-api-integration.md` (Messages API workflow), `enterprise-mcp-configuration.md` (org policies), `environment-variable-expansion.md` (team configs), `plugin-mcp-servers.md` (plugin bundling), `mcp-resources-and-prompts.md` (conversation usage), `oauth-authentication-flow.md` (OAuth setup), `deprecation-notes.md` (SSE → HTTP migration)
  - Reference: `examples.md` (AWS Bedrock, FastMCP templates)

**Triggers:**
- Deciding if logic should become an MCP
- Creating MCP servers (stdio, HTTP, remote)
- Analyzing/improving existing MCPs
- Connecting MCPs to Claude Code
- Integrating MCPs via Messages API
- Questions about MCP concepts, configuration, security, OAuth
- Enterprise configuration, team-shared configs, plugin MCPs

---

## Planned Features

All core capability management skills have been released in v1.6.0. Future releases will focus on maintenance, updates, and community-requested enhancements.

## Installation

### Via Claude Code Marketplace

```bash
# Install from the Claude Code Toolkit marketplace
claude-code plugin install claude-code-capabilities
```

### Manual Installation

1. Clone the repository:
```bash
git clone https://github.com/thoeltig/claude-code-toolkit.git
cd claude-code-toolkit
```

2. Copy to your Claude plugins directory:
```bash
# On macOS/Linux
cp -r plugins/claude-code-capabilities ~/.claude/plugins/

# On Windows
xcopy /E /I plugins\claude-code-capabilities %USERPROFILE%\.claude\plugins\claude-code-capabilities
```

3. Restart Claude Code or reload plugins

## Usage

### Model Selection Guide

**Haiku/Sonnet/Opus** are Claude model tiers with cost/capability trade-offs:
- **Haiku**: ~$0.25/M output tokens - efficient for synthesis (organizing/formatting known information)
- **Sonnet**: ~$3/M output tokens - balanced for evaluation (quality assessment, reasoning, security analysis)
- **Opus**: ~$15/M output tokens - reserve for complex novel reasoning

**Token**: Unit of text processing (~4 characters). More tokens = higher API costs. Efficient data formats (JSON/YAML) and model selection reduce token usage.

---

### Managing Agent Skills

The managing-agent-skills skill activates automatically when:
- You mention "skill", "agent capability", or "reusable workflow" in creation/improvement context
- You ask questions about skill concepts, structure, or authoring
- You request skill analysis or evaluation
- You want to convert repeated logic into a skill

**Example Conversations:**
```
You: "I need to create a skill for managing database migrations"
Claude: [Activates managing-agent-skills skill, walks through WF1: Creating]

You: "Can you analyze my existing skill and suggest improvements?"
Claude: [Activates managing-agent-skills skill, performs WF2: Analysis with rubric]

You: "Should this logic be a skill?"
Claude: [Activates managing-agent-skills skill, uses WF3: Conversion decision matrix]
```

#### Technical Implementation Notes

**Information Gathering**
- **WebFetch**: Returns 30-80% summarized content. Complex topics need 2-3+ fetches (overview → details → verification)
- **Data format efficiency**: JSON/YAML (30% less context) > Markdown (20% less) > Plain text (highest parsing overhead)
- **Local files preferred**: No summarization loss, complete access
- **Validation required**: WF1 (create) and WF2 (analyze) are separate passes. Skipping WF2 risks incomplete/incorrect skills

**Model Selection**
| Stage | Model | Rationale | Cost |
|-------|-------|-----------|------|
| WF1: Write | Haiku | Synthesis: organize info into structured SKILL.md | Base |
| WF2: Validate | Sonnet | Evaluation: 14-point rubric, gap analysis | ~3x Haiku |
| Edge cases | Opus | Complex structural issues only | ~15x Haiku |

**Pattern**: Haiku write → Sonnet validate. If WF2 reports minimal changes, Haiku quality was sufficient.

---

### Managing Hooks

The managing-hooks skill activates automatically when:
- You request hook creation or configuration
- You ask about hook types, event lifecycle, or event-driven automation
- You mention specific hook events (PreToolUse, SessionStart, Stop, etc.)
- You want to validate, analyze, or debug existing hooks
- You ask about prompt-based or plugin hooks
- You need MCP tool integration patterns

**Example Conversations:**
```
You: "Create a hook to format Python files after I edit them"
Claude: [Activates managing-hooks skill, walks through WF1: Creating]

You: "How do prompt-based hooks work for intelligent decisions?"
Claude: [Activates managing-hooks skill, covers prompt-based patterns with examples]

You: "Can multiple plugins' hooks work together?"
Claude: [Activates managing-hooks skill, explains WF2.5: Plugin composition patterns]

You: "I need to validate all MCP write operations"
Claude: [Activates managing-hooks skill, covers WF3: MCP tool targeting]
```

#### Technical Implementation Notes

**Security Validation**
- **Model tier**: Sonnet minimum for WF2 (analysis). Haiku cannot assess security implications adequately
- **User review required**: Sonnet validates structure/syntax, not intent or side effects. Review:
  - Command correctness and system impact
  - Event trigger timing and lifecycle edge cases
  - Permission scope and data access
- **Sandbox testing**: Test command-based hooks in isolated environment before production to verify runtime behavior

---

### Managing Plugins

The managing-plugins skill activates automatically when:
- You request plugin creation, bundling, or packaging
- You ask about plugin structure, plugin.json, or marketplace configuration
- You mention plugin validation or distribution
- You ask about team plugin workflows or autoInstall configuration
- You need to bundle skills, commands, hooks, or MCPs

**Example Conversations:**
```
You: "Bundle all my git-related skills into a plugin"
Claude: [Activates managing-plugins skill, walks through OP2: Bundle Components]

You: "Create a marketplace config for my team plugins"
Claude: [Activates managing-plugins skill, covers OP3: Create Marketplace Config]

You: "Validate my plugin structure before sharing"
Claude: [Activates managing-plugins skill, performs OP4: Validate Plugin]

You: "How do I set up autoInstall for team members?"
Claude: [Activates managing-plugins skill, explains team configuration workflow]
```

#### Technical Implementation Notes

**Structural Validation**
- **Model tier**: Haiku for creation (OP1-3), Sonnet for validation (OP4)
- **Rationale**: Validation checks schema compliance, file organization, naming conventions (deterministic, not reasoning-heavy)
- **Cost efficiency**: Haiku synthesis → Sonnet structural validation typically requires minimal corrections

---

### Managing Prompts

The managing-prompts skill activates automatically when:
- You request prompt creation, analysis, or optimization
- You ask about prompt engineering techniques or best practices
- You mention Claude 4.5 optimization, hallucinations, or consistency issues
- You ask about Structured Outputs, prompt caching, or extended thinking
- You need to migrate prompts from Claude 3 to Claude 4.5
- You want to decide if logic should be in a prompt vs script

**Example Conversations:**
```
You: "Analyze this prompt and suggest improvements"
Claude: [Activates managing-prompts skill, performs WF1: Analyzing with rubric]

You: "Create a prompt for analyzing customer feedback"
Claude: [Activates managing-prompts skill, walks through WF2: Creating with architecture selection]

You: "How do I reduce hallucinations in my prompt?"
Claude: [Activates managing-prompts skill, covers guardrails implementation patterns]

You: "Should I use Structured Outputs or prefilling?"
Claude: [Activates managing-prompts skill, provides decision flow and comparison]

You: "Optimize this prompt for token efficiency"
Claude: [Activates managing-prompts skill, performs WF3: Optimizing with caching strategies]
```

#### Technical Implementation Notes

**Reasoning-Heavy Workflows**
- **Model tier**: Sonnet minimum for all workflows (WF1-5). No Haiku synthesis pass.
- **Rationale**: Prompt engineering requires reasoning, not just formatting:
  - Quality assessment: Evaluate guardrails, hallucination risks, technique trade-offs
  - Architecture decisions: Structured Outputs vs prefilling, sequential vs parallel chaining
  - Claude 4.5 optimization: When to apply extended thinking, caching, or chain-of-thought
  - Technique selection: Context-dependent reasoning about what patterns apply
- **Cannot separate write/validate**: Analysis and creation are intertwined (unlike skill synthesis)
- **Opus**: Reserve for novel patterns or security-critical prompt applications

---

### Managing Subagents

The managing-subagents skill activates automatically when:
- You need to decide if a task should delegate to a subagent
- You want to analyze or evaluate an existing subagent
- You request improvements to a subagent's configuration
- You need to create a new specialized subagent
- You ask about subagent concepts, decision patterns, or management

**Example Conversations:**
```
You: "Should I use a subagent to search this large codebase?"
Claude: [Activates managing-subagents skill, scores task 0-10, recommends Explore agent]

You: "Analyze this existing agent and suggest improvements"
Claude: [Activates managing-subagents skill, evaluates against analysis framework]

You: "I need a security auditing agent for Python code"
Claude: [Activates managing-subagents skill, creates specialized agent using patterns]

You: "How do permission modes affect agent behavior?"
Claude: [Activates managing-subagents skill, explains 5 modes with use cases]
```

#### Technical Implementation Notes

**Decision & Optimization Focus**
- **Model tier**: Haiku for scoring/decision, Sonnet for analysis and creation
- **Rationale**: Task scoring is deterministic (0-10 points), but agent analysis and creation require reasoning
- **Pattern**: Quick decision (Haiku) → detailed evaluation (Sonnet) if improvement needed
- **Cost efficiency**: Many decisions can be made with Haiku, escalate to Sonnet only for optimization

---

### Managing Slash Commands

The managing-slash-commands skill activates automatically when:
- You request slash command creation or configuration
- You ask about command syntax, structure, or best practices
- You mention "slash command", "command file", or "/command" in creation/improvement context
- You want to analyze or improve existing commands
- You ask about SlashCommand tool, plugin commands, or MCP commands
- You need to decide between creating a command vs a skill

**Example Conversations:**
```
You: "Create a slash command to review pull requests"
Claude: [Activates managing-slash-commands skill, walks through WF1: Creating]

You: "Analyze this command and suggest improvements"
Claude: [Activates managing-slash-commands skill, performs WF2: Analyzing with evaluation]

You: "Should I convert this logic to a slash command or skill?"
Claude: [Activates managing-slash-commands skill, uses WF3: Decision framework]

You: "How do I use extended thinking in a slash command?"
Claude: [Activates managing-slash-commands skill, covers thinking mode patterns]

You: "What's the SlashCommand tool and how does it work?"
Claude: [Activates managing-slash-commands skill, explains programmatic invocation]
```

#### Technical Implementation Notes

**Command Creation and Validation**
- **Model tier**: Haiku for simple commands (WF1), Sonnet for analysis (WF2) and optimization
- **Rationale**: Command creation is synthesis (formatting prompts), but analysis requires evaluation
- **Script-based commands**: When using helper scripts, validate scripts independently first
- **Prompt content**: For complex prompt engineering within commands, consider using managing-prompts skill for advanced patterns
- **Cost efficiency**: Haiku for straightforward commands → Sonnet for quality assessment and improvements

---

### Managing MCPs

The managing-mcps skill activates automatically when:
- You need to decide if logic should become an MCP server
- You request MCP server creation (stdio, HTTP, remote)
- You want to analyze or improve existing MCPs
- You ask about MCP configuration, connection, or security
- You mention Messages API integration or MCPToolset patterns
- You ask about OAuth authentication, enterprise policies, or team configs
- You need to bundle MCPs in plugins

**Example Conversations:**
```
You: "Should I create an MCP for this database access layer?"
Claude: [Activates managing-mcps skill, evaluates using WF1: Decision checklist with 6 criteria]

You: "Create an HTTP MCP server using FastMCP for GitHub integration"
Claude: [Activates managing-mcps skill, walks through WF2: Creating with HTTP priority guidance]

You: "How do I use my MCP via the Messages API with allowlist?"
Claude: [Activates managing-mcps skill, covers WF6: Messages API with MCPToolset patterns]

You: "Analyze this existing MCP and suggest improvements"
Claude: [Activates managing-mcps skill, performs WF3: Analysis with quality evaluation]

You: "Configure OAuth authentication for my MCP server"
Claude: [Activates managing-mcps skill, references oauth-authentication-flow.md guide]
```

#### Technical Implementation Notes

**Progressive Disclosure and Token Efficiency**
- **Model tier**: Haiku for decision (WF1), Sonnet for creation (WF2) and analysis (WF3)
- **Rationale**: Token-optimized loading strategy based on usage patterns
  - Common workflows (create/analyze MCPs - 80% of usage): Load SKILL.md + creation-guide.md + examples.md (minimal)
  - Rare workflows (Messages API integration - 5% of usage): Load mcp-connector-api-integration.md (detailed, 300+ lines)
  - Result: 100-150 line token savings for common cases while preserving detailed information on-demand
- **HTTP Transport Priority**: HTTP recommended over stdio for remote servers (better cloud support, more reliable)
- **Cross-skill references**: References managing-plugins for plugin bundling, managing-prompts for prompt templates
- **Security validation**: Always validate OAuth flows and enterprise policies with Sonnet minimum
- **Cost efficiency**: Quick decision (Haiku) → detailed creation/analysis (Sonnet) for reasoning-heavy workflows

## Documentation Sources

This plugin is built from official Claude Code documentation:
- code.claude.com
- docs.claude.com (Agent SDK)
- platform.anthropic.com (Anthropic API)
- GitHub cookbook examples

Over 74 documentation files were analyzed and synthesized into the current implementation.

## Contributing

Contributions welcome! See the main repository [CONTRIBUTING.md](https://github.com/thoeltig/claude-code-toolkit/blob/develop/CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](https://github.com/thoeltig/claude-code-toolkit/blob/develop/LICENSE)

## Support

- **Issues:** [GitHub Issues](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Discussions:** [GitHub Discussions](https://github.com/thoeltig/claude-code-toolkit/discussions)
- **Repository:** [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
