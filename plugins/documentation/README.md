# Documentation Plugin

Professional documentation management for your projects following industry best practices for clarity, accessibility, and inclusivity.

## Overview

The documentation plugin provides a comprehensive skill for creating, updating, and maintaining high-quality project documentation. It combines established best practices from agile, Google, and Write the Docs methodologies with emphasis on clear communication for global audiences, inclusive language, and lean/agile principles.

## Installation

```bash
/plugin install documentation@claude-code-toolkit
```

## Components

### Skills

**managing-documentation**
- Creates and maintains high-quality project documentation
- Validates documentation quality against industry standards
- Ensures inclusive language and accessibility
- Supports guides, API documentation, README files, and internal documentation
- 4 comprehensive workflows covering all documentation operations

### Workflows

| ID | Workflow | Purpose |
|----|----------|---------|
| WF1 | Creating New Documentation | Define purpose, plan structure, write for global audience, ensure inclusivity, and validate quality |
| WF2 | Updating Existing Documentation | Assess current state, prioritize improvements, update content, and verify changes |
| WF3 | Validating Documentation Quality | Apply content quality, clarity, inclusivity, and completeness checks |
| WF4 | Applying Agile/Lean Principles | Document late, update constantly, with purpose, and choose best communication medium |

## Usage Examples

### Create New Documentation

```
User: "Create a getting started guide for this project"
Claude: [Uses WF1] Creates guide with:
- Clear purpose and audience definition
- Skimmable structure with prerequisites
- Step-by-step instructions with examples
- Global audience considerations
- Inclusive language throughout
```

### Update Existing Documentation

```
User: "Update the API documentation to be clearer"
Claude: [Uses WF2] Assesses current state, identifies issues, and updates:
- Unclear jargon and explanations
- Outdated information
- Consistency problems
- Language clarity improvements
```

### Validate Quality

```
User: "Check if our documentation meets accessibility standards"
Claude: [Uses WF3] Validates against:
- Content quality (ARID principles)
- Clarity and accessibility
- Inclusive language
- Global audience compatibility
- Completeness checks
```

### Apply Agile Principles

```
User: "Help us document lean - only what we need"
Claude: [Uses WF4] Applies principles:
- Document late, update constantly
- Document with clear purpose only
- Prefer executable specifications
- Minimize duplication
```

## Key Features

### Content Quality Standards
- **ARID Principles**: Accept repetition, Skimmable, Exemplary, Consistent, Current
- **Clear structure** with descriptive headings
- **Concrete examples** for all key concepts
- **No jargon** without explanation
- **Consistent terminology** throughout

### Global Audience Support
- Simple, concise language without idioms or colloquialisms
- Active voice and present tense
- Shorter sentences for clarity and translation
- Defined abbreviations
- Concrete examples over abstract descriptions

### Inclusive Language Standards
- No ableist terms: "sanity check" → "final check", "blind to" → "overlook"
- No gendered language: "man-hours" → "person-hours", use "they"
- No violent language or metaphors
- Diverse names in examples
- Respectful terminology for disabilities and minorities

### Documentation Types Supported
- **Guides & Tutorials**: Step-by-step with cumulative examples
- **API Documentation**: Clear purposes, parameters, examples, error cases
- **README Files**: Brief intro, installation, usage, contributing, license
- **Architecture Documentation**: High-level overview with design decisions

### Best Practices Enforcement
- ✅ Simple language for global audiences
- ✅ Examples for key concepts
- ✅ Clear purpose and audience definition
- ✅ Inclusive and accessible language
- ✅ No future features or unverifiable claims
- ✅ Agile/lean approach (just barely good enough)
- ✅ Consistent terminology and formatting

### Anti-patterns to Avoid
- ❌ Documenting future/unreleased features
- ❌ Excessive claims: "best", "fastest", "always", "never"
- ❌ Time-based language: "new", "currently", "soon", "latest"
- ❌ Overusing politeness: "please" in instructions
- ❌ Problematic language: ableist, gendered, violent, cultural slurs
- ❌ Over-documentation (prefer just-barely-good-enough)
- ❌ Duplicate information across documents

## Quality Checklists

### Content Quality (ARID)
- [ ] Accept Repetition: Business logic described multiple ways is acceptable
- [ ] Skimmable: Readers find what they need without reading everything
- [ ] Exemplary: Common use cases have examples
- [ ] Consistent: Same terms used consistently, formatting applied systematically
- [ ] Current: Reflects actual state of product, not historical or future states

### Clarity & Accessibility
- [ ] No industry jargon without explanation
- [ ] Sentences under 20 words when possible
- [ ] Active voice used primarily
- [ ] Present tense for current capabilities
- [ ] Examples provided for important concepts
- [ ] Headings clearly describe content below

### Inclusive Language
- [ ] No ableist language (sanity check, blind to, cripples, etc.)
- [ ] No gendered terms (man-hours, he/she pronouns)
- [ ] No violent language (kill, hit, slaughter metaphors)
- [ ] No unnecessary cultural specificity
- [ ] Diverse names in examples
- [ ] Neutral language about disabilities

### Global Audience
- [ ] No colloquialisms, idioms, or slang
- [ ] No humor (difficult to translate)
- [ ] No geographic specificity (seasons, holidays)
- [ ] Dates and times unambiguous
- [ ] Simple words over complex synonyms
- [ ] No assumed prior knowledge

## Common Use Cases

### For Project Leads
- Create comprehensive onboarding documentation
- Validate documentation quality before publication
- Ensure consistent terminology across all docs
- Plan documentation structure for new features

### For Developers
- Write clear API documentation
- Create getting started guides
- Document architectural decisions
- Update docs with new features

### For Technical Writers
- Review documentation for clarity and inclusivity
- Check for problematic language
- Validate against style guides
- Improve global audience accessibility

### For Teams
- Maintain consistent documentation standards
- Ensure inclusive and accessible docs
- Apply agile principles to documentation
- Delegate documentation validation

## Documentation Standards

### Supported Document Types

**Guides & Tutorials**
- Gentle introduction before technical details
- Clear prerequisites upfront
- Concrete step-by-step instructions
- Examples build on previous examples
- Short code examples (3-5 lines)
- Clear assumptions about reader knowledge

**API Documentation**
- Purpose of API group explained first
- Each method: purpose, parameters, returns
- Common use cases with examples
- Error cases documented
- Realistic but simplified examples
- Shared terminology throughout

**README Files**
- Brief description in opening
- Installation/quick start early
- Common use cases covered
- Troubleshooting or FAQ included
- Links to full documentation
- Contributing guidelines
- License clearly stated

**Architecture Documentation**
- High-level overview first
- Key concepts explained at high level
- Diagrams supplement text
- Links to code for implementation details
- Design decisions explained (the "why")
- Clear what's documented vs. what's in code

## Writing Style Principles

### Tone and Voice
- Conversational, friendly, and respectful
- Knowledgeable friend, not textbook or marketing
- Human and memorable
- Focus on information delivery

### Best Practices
- Read aloud to check naturalness
- Use transitions for flow
- Step back and clarify intent
- Get colleague feedback
- Focus on useful information

### Techniques to Use
- Descriptive headings
- Paragraph key concepts first
- Active voice
- Short sentences
- Concrete examples
- Clear transitions

## Implementation Approach

When using this skill:

1. **Understand context**: Purpose? Audience? What do they need?
2. **Assess quality**: What works? What needs improvement?
3. **Plan improvements**: Prioritize critical → major → minor
4. **Apply standards**: Use clear structure, simple language, inclusive voice
5. **Validate**: Check against skill checklists and principles
6. **Iterate**: Get feedback, refine, publish

The goal is documentation that is clear, accessible, sufficient for actual needs, and welcoming to readers from all backgrounds.

## Tool Requirements

The skill integrates with:
- **Read**: Load existing documentation files
- **Write**: Create new documentation files
- **Edit**: Update existing documentation
- **Glob**: Find documentation files by pattern
- **Grep**: Search for problematic terms or patterns
- **Task**: Large-scale validation across many files

## Documentation Standards and Resources
- [Write the Docs](https://www.writethedocs.org/guide/writing/docs-principles/)
- [Agile Documentation](https://agilemodeling.com/essays/agileDocumentationBestPractices.htm)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## License

See root [LICENSE](../../LICENSE) for details.

## Support

- **Issues**: [Report bugs or request features](https://github.com/thoeltig/claude-code-toolkit/issues)
- **Repository**: [claude-code-toolkit](https://github.com/thoeltig/claude-code-toolkit)

---

**Author**: [Thore Höltig](https://github.com/thoeltig)