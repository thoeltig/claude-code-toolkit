# Claude Code Toolkit

A curated marketplace of powerful Claude Code plugins that extend your development workflow with intelligent automation, best practices enforcement, and productivity tools.

## 🚀 Quick Start

Add this marketplace to your Claude Code configuration:

```bash
# Add the marketplace (replace with actual installation command)
/marketplace add https://github.com/thoeltig/claude-code-toolkit
```

Then install any plugin:

```bash
/plugin install <plugin-name>@claude-code-toolkit
```

## 📦 Available Plugins

| Plugin | Description | Version |
|--------|-------------|---------|
| **[changelog](./plugins/changelog/)** | Create, update, and maintain CHANGELOG.md files following Keep a Changelog and Common Changelog standards | 1.1.0 |
| **[session-protocol](./plugins/session-protocol/)** | Manage session continuity across Claude conversations by saving and loading structured context | 1.0.0 |
| **[claude-code-capabilities](./plugins/claude-code-capabilities/)** | Comprehensive management of Claude Code features including skills, commands, hooks, prompts, subagents, and MCPs | 1.4.0 |

## 🎯 Plugin Highlights

### Changelog
Professional changelog management with automatic formatting, version tracking, and standards compliance validation.

**Install:** `/plugin install changelog@claude-code-toolkit`

### Session Protocol
Never lose context again. Save your work state, git status, and active tasks between sessions for seamless continuity.

**Install:** `/plugin install session-protocol@claude-code-toolkit`

### Claude Code Capabilities
The most comprehensive toolkit for working with Claude Code's extensibility features. Includes 7 specialized skills and 2 powerful commands for managing every aspect of your Claude Code setup.

**Implemented:**
- **managing-agent-skills skill** (v1.0.0): Create, analyze, and improve agent skills with validation frameworks
- **managing-hooks skill** (v1.1.0): Configure event-driven automation with all 10 hook types
- **managing-plugins skill** (v1.2.0): Bundle components into distributable plugins with marketplace support
- **managing-prompts skill** (v1.3.0): Master prompt engineering with Claude 4.5 best practices, caching strategies, and advanced techniques
- **managing-slash-commands skill** (v1.4.0): Create and manage custom slash commands with extended thinking support and ecosystem integration

**Planned:**
- **managing-subagents**: Analyze and optimize subagent orchestration patterns
- **managing-mcps**: Create and configure Model Context Protocol servers

**Install:** `/plugin install claude-code-capabilities@claude-code-toolkit`

## 📚 Documentation

Each plugin has its own detailed README with:
- Installation instructions
- Component listings (skills, commands, hooks)
- Usage examples and workflows
- Changelog and version history

Click on any plugin name above to view its documentation.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Submitting improvement ideas
- Reporting bugs and requesting features
- Code standards and best practices
- Pull request process

## 📜 Code of Conduct

This project adheres to a [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 📄 License

See [LICENSE](./LICENSE) for details.

## 🔗 Links

- **Repository**: https://github.com/thoeltig/claude-code-toolkit
- **Issues**: https://github.com/thoeltig/claude-code-toolkit/issues
- **Claude Code Documentation**: https://claude.ai/code

---

**Maintained by**: [Thore Höltig](https://github.com/thoeltig)