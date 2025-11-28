# Claude Code Capabilities Plugin

Comprehensive management of Claude Code features including skills, slash commands, hooks, MCPs (Model Context Protocol servers), subagents, and prompts. This plugin provides tools for creating, analyzing, and improving Claude Code capabilities with guidance from official documentation.

## Current Status

**Version:** 1.0.0
**Released:** 2025-11-28
**Release:** [ClaudeCodeCapabilities_v1.0.0.0](https://github.com/thoeltig/claude-code-toolkit/releases/tag/ClaudeCodeCapabilities_v1.0.0.0)

## What's Included (v1.0.0)

### ✅ managing-agent-skills

**Status:** Production-ready (Quality: 9.86/10)

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

## Planned Features

The following capabilities are planned for future releases:

### 🔲 managing-slash-commands
**Target:** v1.1.0
**Purpose:** Create and validate slash commands (markdown files with YAML frontmatter)

**Planned Capabilities:**
- Slash command creation workflow
- Validation against specification
- Conversion of skills to commands
- Best practices and examples

**Documentation:** 8 files ready in `documentation/managing-slash-commands/`

---

### 🔲 managing-hooks
**Target:** v1.2.0
**Purpose:** Configure and manage event-driven automation hooks

**Planned Capabilities:**
- Hook configuration (SessionStart, PreCompact, etc.)
- Event-driven workflow setup
- Hook testing and validation
- Integration patterns

**Documentation:** 9 files ready in `documentation/managing-hooks/`

---

### 🔲 managing-plugins
**Target:** v1.3.0
**Purpose:** Bundle skills, commands, hooks, and MCPs into distributable plugins

**Planned Capabilities:**
- Plugin structure validation
- Component bundling
- plugin.json creation
- Distribution preparation

**Documentation:** 3 files ready in `documentation/managing-plugins/`

---

### 🔲 managing-prompts
**Target:** v1.4.0
**Purpose:** Optimize system prompts for token efficiency and effectiveness

**Planned Capabilities:**
- Prompt analysis and optimization
- Token usage reduction
- Effectiveness evaluation
- Structured prompt templates

**Documentation:** 28 files ready in `documentation/managing-prompts/`

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
│   └── managing-agent-skills/   # v1.0.0 - Production ready
│       ├── SKILL.md            # Main skill file with workflows
│       ├── CHANGELOG.md        # Version history
│       ├── analysis-framework.md
│       ├── best-practices.md
│       ├── creation-checklist.md
│       ├── quick-reference.md
│       ├── examples/           # Example skills
│       └── template/           # Skill templates
├── documentation/              # Source docs for future skills
│   ├── managing-slash-commands/  (8 files)
│   ├── managing-hooks/           (9 files)
│   ├── managing-plugins/         (3 files)
│   ├── managing-prompts/         (28 files)
│   ├── managing-subagents/       (1 file)
│   └── managing-mcps/            (9 files)
├── CHANGELOG.md
└── README.md
```

### Contributing

Contributions welcome! See the main repository [CONTRIBUTING.md](https://github.com/thoeltig/claude-code-toolkit/blob/develop/CONTRIBUTING.md) for guidelines.

**Priority areas for v1.1.0+:**
- Implementing planned skills (managing-slash-commands next)
- Testing and validation
- Documentation improvements
- Community examples and templates

## Roadmap

| Version | Feature | Status | Target |
|---------|---------|--------|--------|
| 1.0.0 | managing-agent-skills | ✅ Released | 2025-11-28 |
| 1.1.0 | managing-slash-commands | 🔲 Planned | TBD |
| 1.2.0 | managing-hooks | 🔲 Planned | TBD |
| 1.3.0 | managing-plugins | 🔲 Planned | TBD |
| 1.4.0 | managing-prompts | 🔲 Planned | TBD |
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
