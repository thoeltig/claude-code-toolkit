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
| **[changelog](./plugins/changelog/)** | Create, update, and maintain CHANGELOG.md files following Keep a Changelog and Common Changelog standards | 1.1.0.0 |
| **[session-protocol](./plugins/session-protocol/)** | Manage session continuity across Claude conversations by saving and loading structured context | 1.0.0.0 |
| **[claude-code-capabilities](./plugins/claude-code-capabilities/)** | Comprehensive management of Claude Code features including skills, commands, hooks, prompts, subagents, and MCPs | 1.7.0.0 |
| **[fetch-full-content](./plugins/fetch-full-content/)** | Download full page content from URLs to markdown for complete information retrieval without summarization (⚠️ trusted sources only) | 1.0.1.0 |

## 🎯 Plugin Highlights

### Changelog
Professional changelog management with automatic formatting, version tracking, and standards compliance validation.

**Install:** `/plugin install changelog@claude-code-toolkit`

### Session Protocol
Never lose context again. Save your work state, git status, and active tasks between sessions for seamless continuity.

**Install:** `/plugin install session-protocol@claude-code-toolkit`

### Claude Code Capabilities
The most comprehensive toolkit for working with Claude Code's extensibility features. Includes 7 specialized skills for managing every aspect of your Claude Code setup.

- **managing-agent-skills skill** (v1.0.0): Create, analyze, and improve agent skills with validation frameworks and progressive disclosure
- **managing-hooks skill** (v1.1.0): Configure event-driven automation with all 10 hook types, prompt-based hooks, and plugin composition
- **managing-plugins skill** (v1.2.0): Bundle components into distributable plugins with marketplace support and team workflows
- **managing-prompts skill** (v1.3.0): Master prompt engineering with Claude best practices, extended thinking, caching strategies, and Structured Outputs
- **managing-slash-commands skill** (v1.4.0): Create and manage custom slash commands with extended thinking support, SlashCommand tool, and ecosystem integration
- **managing-subagents skill** (v1.5.0): Analyze, evaluate, create, and improve subagents with resumable workflows, decision scoring, and permission modes
- **managing-mcps skill** (v1.6.0): Create, analyze, and manage Model Context Protocol servers with Messages API integration, enterprise configuration

**Install:** `/plugin install claude-code-capabilities@claude-code-toolkit`

### Fetch-Full-Content
Download complete page content as markdown to filesystem for repeated analysis and 100% information retrieval. Built-in WebFetch tool uses AI summarization which will return 30-80% of the information depending on the content size.

⚠️ **Security**: No prompt injection guards - only use on trusted sources like official documentation. Use built-in WebFetch tool for untrusted sources.

**Install:** `/plugin install fetch-full-content@claude-code-toolkit`

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

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

---

**Author**: [Thore Höltig](https://github.com/thoeltig)