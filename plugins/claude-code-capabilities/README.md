# Claude Code Capabilities Plugin

Comprehensive management of Claude Code features including skills, slash commands, hooks, MCPs (Model Context Protocol servers), subagents, and prompts. This plugin provides tools for creating, analyzing, and improving Claude Code capabilities with guidance from official documentation.

## Current Status

**Version:** 1.3.0
**Released:** 2025-11-29
**Release:** [ClaudeCodeCapabilities_v1.3.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.3.0.0)

## What's Included (v1.3.0)

### ✅ managing-agent-skills

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

**Usage Examples:**
```
User: "Create a skill for managing git workflows"
User: "Analyze this skill and suggest improvements"
User: "Should I convert this repeated logic into a skill?"
User: "Update this skill with the latest best practices"
```

---

### ✅ managing-hooks

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

**Usage Examples:**
```
User: "Create a hook to format Python files after editing"
User: "How do I use prompt-based hooks for intelligent decisions?"
User: "Can I combine multiple plugin hooks?"
User: "Analyze my existing hooks for security issues"
```

---

### ✅ managing-plugins

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

**Usage Examples:**
```
User: "Bundle all my git-related skills into a plugin"
User: "How do I create a marketplace config for my team?"
User: "Validate my plugin structure before distribution"
User: "What fields are required in plugin.json?"
```

---

### ✅ managing-prompts

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

**Usage Examples:**
```
User: "Analyze this prompt and suggest improvements"
User: "Create a prompt for customer feedback analysis"
User: "How do I reduce hallucinations in my prompts?"
User: "Should I use Structured Outputs or prefilling?"
User: "Optimize this prompt for token efficiency"
User: "Migrate my Claude 3 prompts to Claude 4.5"
```

---

## Planned Features

The following capabilities are planned for future releases:

---

### 🔲 managing-slash-commands
**Target:** v1.4.0
**Purpose:** Create and validate slash commands (markdown files with YAML frontmatter)

**Planned Capabilities:**
- Slash command creation workflow
- Validation against specification
- Conversion of skills to commands
- Best practices and examples

**Documentation:** 8 files ready in `documentation/managing-slash-commands/`

---

### 🔲 managing-subagents
**Target:** v1.5.0
**Purpose:** Multi-agent patterns and decision frameworks

**Planned Capabilities:**
- Subagent pattern library
- Decision frameworks for agent composition
- Parallel vs sequential execution
- Agent communication patterns

**Documentation:** 1 file ready in `documentation/managing-subagents/`

---

### 🔲 managing-mcps
**Target:** v1.6.0
**Purpose:** MCP (Model Context Protocol) server creation and configuration

**Planned Capabilities:**
- MCP server setup
- Tool and resource definition
- Server configuration
- Integration with Claude Code

**Documentation:** 9 files ready in `documentation/managing-mcps/`

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

## Documentation Sources

This plugin is built from official Claude Code documentation:
- code.claude.com
- docs.claude.com (Agent SDK)
- platform.anthropic.com (Anthropic API)
- GitHub cookbook examples

Over 74 documentation files were analyzed and synthesized into the current implementation.

## Development

### Plugin Structure

```
claude-code-capabilities/
├── .claude-plugin/
│   └── plugin.json                     # Plugin metadata (v1.3.0)
├── skills/
│   ├── managing-agent-skills/          # v1.0.0
│   │   ├── SKILL.md                    # Main skill file with workflows
│   │   ├── analysis-framework.md
│   │   ├── best-practices.md
│   │   ├── creation-checklist.md
│   │   ├── examples/                   # Example skills
│   │   └── templates/                  # Skill templates
│   ├── managing-hooks/                 # v1.1.0
│   │   ├── SKILL.md                    # Main skill file with workflows
│   │   ├── prompt-hooks-guide.md       # LLM-powered hook decisions
│   │   ├── plugin-hooks-guide.md       # Distributed hook composition
│   │   ├── hook-schemas-reference.md   # Complete input/output schemas
│   │   ├── hook-types-reference.md
│   │   ├── configuration-guide.md
│   │   ├── script-examples.md
│   │   ├── security-checklist.md
│   │   ├── debugging-guide.md
│   │   ├── real-world-examples/
│   │   └── templates/
│   ├── managing-plugins/               # v1.2.0
│   │   ├── SKILL.md                    # Main skill file with operations
│   │   ├── plugin-spec.md              # plugin.json schema
│   │   ├── marketplace-spec.md         # Marketplace configuration
│   │   ├── distribution-guide.md       # Packaging and sharing
│   │   ├── validation-rules.md         # Plugin validation
│   │   └── team-workflow.md            # Team configuration
│   └── managing-prompts/               # v1.3.0
│       ├── SKILL.md                    # Main skill file with workflows
│       ├── analysis-patterns.md        # Common issues, quality assessment
│       ├── architecture-patterns.md    # 5 pattern types
│       ├── claude-4-5-optimization.md  # Claude 4.5-specific patterns
│       ├── consistency-techniques.md   # Structured Outputs, prefilling
│       ├── context-optimization.md     # Caching, token efficiency
│       ├── extended-thinking-implementation.md  # Budget, caching
│       ├── extraction-decision-guide.md         # Prompt vs script
│       ├── guardrails-implementation.md         # Hallucination, security
│       ├── migration-guide.md          # Claude 3→4.5 migration
│       ├── optimization-strategies.md  # 11 before/after examples
│       ├── output-formats.md           # Report templates
│       ├── prompt-chaining-architecture.md      # Sequential/parallel
│       ├── quick-reference.md          # Fast validation checklists
│       └── technique-reference.md      # Indexed lookup by use case
├── CHANGELOG.md
└── README.md
```

### Contributing

Contributions welcome! See the main repository [CONTRIBUTING.md](https://github.com/thoeltig/claude-code-toolkit/blob/develop/CONTRIBUTING.md) for guidelines.

## Roadmap

| Version | Feature | Status | Target |
|---------|---------|--------|--------|
| 1.0.0 | managing-agent-skills | ✅ Released | 2025-11-28 |
| 1.1.0 | managing-hooks | ✅ Released | 2025-11-29 |
| 1.2.0 | managing-plugins | ✅ Released | 2025-11-29 |
| 1.3.0 | managing-prompts | ✅ Released | 2025-11-29 |
| 1.4.0 | managing-slash-commands | 🔲 Planned | TBD |
| 1.5.0 | managing-subagents | 🔲 Planned | TBD |
| 1.6.0 | managing-mcps | 🔲 Planned | TBD |

## License

MIT License - see [LICENSE](https://github.com/thoeltig/claude-code-toolkit/blob/develop/LICENSE)

## Support

- **Issues:** [GitHub Issues](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Discussions:** [GitHub Discussions](https://github.com/thoeltig/claude-code-toolkit/discussions)
- **Repository:** [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
