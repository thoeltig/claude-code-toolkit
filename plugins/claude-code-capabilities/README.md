# Claude Code Capabilities Plugin

Comprehensive management of Claude Code features including skills, slash commands, hooks, MCPs (Model Context Protocol servers), subagents, and prompts. This plugin provides tools for creating, analyzing, and improving Claude Code capabilities with guidance from official documentation.

## Current Status

**Version:** 1.1.0
**Released:** 2025-11-29
**Release:** [ClaudeCodeCapabilities_v1.1.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.1.0.0)

## What's Included (v1.1.0)

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

## Planned Features

The following capabilities are planned for future releases:

### 🔲 managing-slash-commands
**Target:** v1.2.0
**Purpose:** Create and validate slash commands (markdown files with YAML frontmatter)

**Planned Capabilities:**
- Slash command creation workflow
- Validation against specification
- Conversion of skills to commands
- Best practices and examples

**Documentation:** 8 files ready in `documentation/managing-slash-commands/`

---

### 🔲 managing-plugins
**Target:** v1.4.0
**Purpose:** Bundle skills, commands, hooks, and MCPs into distributable plugins

**Planned Capabilities:**
- Plugin structure validation
- Component bundling
- plugin.json creation
- Distribution preparation

**Documentation:** 3 files ready in `documentation/managing-plugins/`

---

### 🔲 managing-prompts
**Target:** v1.5.0
**Purpose:** Optimize system prompts for token efficiency and effectiveness

**Planned Capabilities:**
- Prompt analysis and optimization
- Token usage reduction
- Effectiveness evaluation
- Structured prompt templates

**Documentation:** 28 files ready in `documentation/managing-prompts/`

---

### 🔲 managing-subagents
**Target:** v1.6.0
**Purpose:** Multi-agent patterns and decision frameworks

**Planned Capabilities:**
- Subagent pattern library
- Decision frameworks for agent composition
- Parallel vs sequential execution
- Agent communication patterns

**Documentation:** 1 file ready in `documentation/managing-subagents/`

---

### 🔲 managing-mcps
**Target:** v1.7.0
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
│   └── plugin.json              # Plugin metadata
├── skills/
│   ├── managing-agent-skills/
│   │   ├── SKILL.md            # Main skill file with workflows
│   │   ├── analysis-framework.md
│   │   ├── best-practices.md
│   │   ├── creation-checklist.md
│   │   ├── examples/           # Example skills
│   │   └── template/           # Skill templates
│   └── managing-hooks/
│       ├── SKILL.md            # Main skill file with workflows
│       ├── prompt-hooks-guide.md       # LLM-powered hook decisions
│       ├── plugin-hooks-guide.md       # Distributed hook composition
│       ├── hook-schemas-reference.md   # Complete input/output schemas
│       ├── hook-types-reference.md
│       ├── configuration-guide.md
│       ├── script-examples.md
│       ├── security-checklist.md
│       ├── debugging-guide.md
│       ├── real-world-examples/
│       └── templates/
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
| 1.2.0 | managing-slash-commands | 🔲 Planned | TBD |
| 1.4.0 | managing-plugins | 🔲 Planned | TBD |
| 1.5.0 | managing-prompts | 🔲 Planned | TBD |
| 1.6.0 | managing-subagents | 🔲 Planned | TBD |
| 1.7.0 | managing-mcps | 🔲 Planned | TBD |

## License

MIT License - see [LICENSE](https://github.com/thoeltig/claude-code-toolkit/blob/develop/LICENSE)

## Support

- **Issues:** [GitHub Issues](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Discussions:** [GitHub Discussions](https://github.com/thoeltig/claude-code-toolkit/discussions)
- **Repository:** [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.
