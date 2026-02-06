# Claude Code Toolkit

A Claude Code marketplace that cuts token costs, preserves context across sessions, and extends Claude with intelligent project exploration, workflow automation, and development standards.

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
| **[session-protocol](./plugins/session-protocol/)** | Save your active tasks between sessions and never loss context again | 1.2.0.0 |
| **[project-intel](./plugins/project-intel/)** | Lightweight reconnaissance system that provides semantic direction before code exploration with persistent knowledge across sessions | 1.5.0.0 |
| **[fetch-full-content](./plugins/fetch-full-content/)** | Download full page content from URLs to markdown for complete information retrieval without summarization (⚠️ trusted sources only) | 1.2.0.0 |
| **[changelog](./plugins/changelog/)** | Create, update, and maintain CHANGELOG.md files following Keep a Changelog and Common Changelog standards | 1.1.0.0 |
| **[documentation](./plugins/documentation/)** | Create and maintain high-quality project documentation with quality validation, style guides, and inclusive language standards | 1.0.0.0 |
| **[claude-code-capabilities](./plugins/claude-code-capabilities/)** | Comprehensive management of Claude Code features including skills, commands, hooks, prompts, subagents, and MCPs | 1.8.0.0 |
| **[cross-platform-notification](./plugins/cross-platform-notification/)** | Send native system notifications for Claude Code hook events across Windows, macOS, and Linux | 1.0.0.0 |

## 🎯 Plugin Highlights

### Session Protocol
Never lose context again. Save your work state, git status, and active tasks between sessions for seamless continuity.

**Install:** `/plugin install session-protocol@claude-code-toolkit`

### Project Intel
Lightweight reconnaissance system that provides semantic direction before expensive code exploration. Query first to get a ranked list of relevant files - saves exploration tokens and reduces context pollution.

- **`/scan` command**: Generate semantic summaries of project structure once, reuse forever
- **`/query` command**: Search summaries by semantic relevance to find relevant files without reading them
- Wave-based parallel processing with persistent cross-session knowledge
- Semantic scoring on purpose, role, exports, imports, and technologies
- Breakeven analysis: Saves 10k-20k tokens after 3-4 successful queries
- Best for mid to large projects (25+ files), stable codebases, team projects

**Install:** `/plugin install project-intel@claude-code-toolkit`

### Fetch-Full-Content
Download complete page content as markdown to filesystem for repeated analysis and 100% information retrieval. Built-in WebFetch tool uses AI summarization which will return 30-80% of the information depending on the content size.

⚠️ **Security**: No prompt injection guards - only use on trusted sources like official documentation. Use built-in WebFetch tool for untrusted sources.

**Install:** `/plugin install fetch-full-content@claude-code-toolkit`

### Changelog
Professional changelog management with automatic formatting, version tracking, and standards compliance validation.

**Install:** `/plugin install changelog@claude-code-toolkit`

### Documentation
Create and maintain high-quality project documentation with comprehensive validation and style guidance. Ensure clarity, accessibility, and inclusive language across all documentation types.
  - Support for guides, API docs, README files, and architecture documentation
  - Global audience support with simple language and concrete examples
  - Inclusive language standards and quality validation
  - Common issues diagnosis and anti-patterns guide

**Install:** `/plugin install documentation@claude-code-toolkit`

### Claude Code Capabilities
The most comprehensive toolkit for working with Claude Code's extensibility features. Includes 7 specialized skills for managing every aspect of your Claude Code setup.

- **managing-agent-skills skill**: Create, analyze, and improve agent skills with validation frameworks and progressive disclosure
- **managing-hooks skill**: Configure event-driven automation with all 10 hook types, prompt-based hooks, and plugin composition
- **managing-plugins skill**: Bundle components into distributable plugins with marketplace support and team workflows
- **managing-prompts skill**: Master prompt engineering with Claude best practices, extended thinking, caching strategies, and Structured Outputs
- **managing-slash-commands skill**: Create and manage custom slash commands with extended thinking support, SlashCommand tool, and ecosystem integration
- **managing-subagents skill**: Analyze, evaluate, create, and improve subagents with resumable workflows, decision scoring, and permission modes
- **managing-mcps skill**: Create, analyze, and manage Model Context Protocol servers with Messages API integration, enterprise configuration

**Install:** `/plugin install claude-code-capabilities@claude-code-toolkit`

### Cross-Platform Notification
Get alerted when Claude Code tasks complete or hook events occur with native system notifications. Works seamlessly on Windows, macOS, and Linux with automatic fallback to console output.

**Install:** `/plugin install cross-platform-notification@claude-code-toolkit`

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