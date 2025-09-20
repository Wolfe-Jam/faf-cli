# ❓ FAF CLI - Frequently Asked Questions

## General Questions

### What is FAF?
FAF (Foundational AI Format) is a revolutionary CLI tool that creates perfect AI context for your projects. It generates a `.faf` file that tells AI models everything they need to know about your project in 30 seconds, replacing 20 minutes of back-and-forth questions.

### Why do I need FAF?
Without FAF, you spend 20 minutes explaining your project to AI every session. With FAF, AI instantly understands your project's context, goals, tech stack, and requirements. It transforms your development from hope-driven ("I hope AI understands") to trust-driven ("I know AI has perfect context").

### How is this different from just sharing my README?
README files are human-focused and often incomplete for AI. FAF:
- Discovers 150+ file formats automatically
- Extracts semantic meaning from your codebase
- Provides structured YAML that AI models prefer
- Includes both technical AND human context
- Maintains <50ms performance

### What makes FAF worth $100/month?
FAF is premium software positioned like an AMG Mercedes, not a Honda Civic:
- Saves 20 minutes per AI session (10+ hours/month)
- Achieves 86% context scores (vs 24% baseline)
- Includes revolutionary tools (FAB-FORMATS, DropCoach, etc.)
- Provides championship-grade performance (<50ms)
- Transforms developer psychology from hope to trust

---

## Technical Questions

### What file formats does FAF understand?
FAF's FAB-FORMATS engine handles 150+ file formats including:
- All major programming languages
- Configuration files (JSON, YAML, TOML, etc.)
- Package managers (npm, pip, cargo, go.mod, etc.)
- Docker and deployment configs
- Documentation formats
- Test files and CI/CD configs

### How does scoring work?
FAF uses a transparent 99-point system plus 1% AI blessing:
- **Technical context (50%)**: What AI can detect
- **Human context (50%)**: What you provide (WHO/WHAT/WHY)
- **Quality grading**: EXCEPTIONAL → MINIMAL
- **Balance visualization**: Perfect when both are high

### What's the performance guarantee?
Every FAF operation completes in <50ms or it's considered a failure:
- `faf init`: <50ms
- `faf score`: <50ms
- `faf trust`: <100ms
- This is non-negotiable - it's part of our F1 philosophy

### Can I use FAF with any AI model?
Yes! FAF works with all major AI models:
- **Claude**: Native CLAUDE.md support
- **ChatGPT**: Full compatibility
- **Gemini**: Verified support
- **Local models**: YAML format works everywhere

### What is Context Mirroring?
Bi-directional synchronization between `.faf` and `CLAUDE.md`:
- Changes to `.faf` automatically update `CLAUDE.md`
- Session context in `CLAUDE.md` syncs back to `.faf`
- Never lose context between AI sessions
- Automatic conflict resolution

---

## Usage Questions

### How do I get started?
Three commands to championship context:
```bash
npm install -g @faf/cli
faf init          # Generate .faf file
faf score         # Check your context quality
```

### What if my score is low?
Low scores (<70%) are common initially. Fix them with:
```bash
faf score --details  # See what's missing
faf todo --generate  # Get specific tasks
faf enhance          # AI-powered improvements
```

### How often should I update my .faf file?
- **Major changes**: Run `faf sync` immediately
- **Regular development**: Weekly sync recommended
- **Before AI sessions**: Quick `faf trust` check
- **CI/CD integration**: Auto-check on commits

### Can I customize the .faf file?
Yes! The .faf file is pure YAML - edit it directly:
- Add project-specific context
- Include custom instructions for AI
- Define your quality standards
- Specify deployment details

### What is the Trust Dashboard?
Your emotional confidence center showing:
- Overall trust level (0-100%)
- AI model compatibility
- Actionable improvements
- File recommendations (via DropCoach)

---

## Philosophy Questions

### What is F1-Inspired Software Engineering?
Our development philosophy based on Formula 1 racing:
- **Performance Mad**: <50ms or it's too slow
- **Zero Errors**: Championship quality only
- **72-Hour Rebuild**: When things break, rebuild stronger
- **Respect Competition**: Honor good work everywhere

### What does "Make Your AI Happy" mean?
Happy AI = AI with perfect context. When AI has all the information it needs:
- Fewer clarifying questions
- Better code suggestions
- Faster problem solving
- More accurate responses

### Why "Trust-Driven" development?
Traditional: "I hope AI understands my project"
FAF: "I trust AI has perfect context (86% score proves it)"

This psychological shift transforms your development confidence.

### What's the 72-Hour Rebuild Protocol?
When things break (and they will), we:
1. Acknowledge failure immediately
2. Start rebuild within 24 hours
3. Ship improvement within 72 hours
4. No excuses, no delays - F1 standard

---

## Business Questions

### Is there a free tier?
No. FAF is premium software with premium pricing. We believe in:
- Quality over quantity
- Trust over growth hacking
- Championship performance over compromises

### Why $100/month?
- You save 10+ hours monthly (worth $500+ at developer rates)
- You get championship-grade tools
- We maintain <50ms performance
- We provide continuous improvements
- It's 50% of Claude MAX with 100% AI-context focus

### Is there enterprise pricing?
Yes, for teams needing:
- Multi-repo intelligence
- Team context sharing
- Priority support
- Custom integrations
Contact us for details.

### Can I self-host?
The CLI is open-source and runs locally. Premium features requiring cloud services are subscription-based.

---

## Unique Features Questions

### What is FAB-FORMATS?
Our revolutionary file processing engine:
- 150+ specialized handlers
- Semantic understanding (not just parsing)
- Quality grading system
- Two-stage discovery pattern
Result: 3.5x better context extraction

### What is RelentlessContextExtractor?
Hunts human context with 3-tier confidence:
- **CERTAIN**: Direct evidence
- **PROBABLE**: Strong indicators
- **INFERRED**: Educated guesses
Extracts WHO/WHAT/WHY/WHERE/WHEN/HOW automatically

### What is DropCoach?
Intelligent file recommendation system:
- Language-adaptive TOP-6 files
- Progressive coaching ("Start with README...")
- Milestone celebrations
- Gamification without math

### What is AI|HUMAN Balance?
Visual representation of context completeness:
- AI percentage: Technical detection
- HUMAN percentage: Meaning/purpose
- Perfect balance: Both high and similar
- Result: +144% human context completion

---

## Troubleshooting Questions

### Why is my score stuck at 24%?
You might be using the old TURBO-CAT engine. Update to latest:
```bash
npm update -g @faf/cli
faf init --force  # Regenerate with FAB-FORMATS
```

### How do I fix "No .faf file found"?
Run `faf init` in your project directory. Use `--force` to overwrite existing files.

### What if performance is slow?
Check your `.fafignore` file - you might be scanning `node_modules` or large directories. All operations should be <50ms.

### Can I recover from bad changes?
Yes! Use the Garage:
```bash
faf trust --garage   # Creates backup
# Make changes
faf trust --panic    # Restore if needed
```

---

## Integration Questions

### How do I use FAF in CI/CD?
```yaml
# GitHub Actions example
- name: Verify Context Quality
  run: |
    npm install -g @faf/cli
    faf score --minimum 70
```

### Can I share .faf files across teams?
Yes! Check .faf files into version control. They're designed for sharing and collaboration.

### Does FAF work with monorepos?
Yes, create a .faf file in each package or a single root .faf with comprehensive context.

### How does FAF handle secrets?
FAF never includes sensitive data:
- Reads `.env.example` not `.env`
- Ignores files with secrets patterns
- Uses `.fafignore` for exclusions

---

## Support Questions

### Where do I report bugs?
GitHub Issues: [github.com/Wolfe-Jam/faf-cli/issues](https://github.com/Wolfe-Jam/faf-cli/issues)

### How do I get help?
1. Read this FAQ
2. Check [Developer Guide](./DEVELOPER-GUIDE.md)
3. GitHub Discussions for questions
4. GitHub Issues for bugs

### Is there a community?
Growing! Join us:
- GitHub Discussions
- Share your .faf files
- Contribute improvements

### How often are updates released?
Following F1 seasons:
- Major releases: Quarterly
- Performance improvements: Monthly
- Critical fixes: Within 72 hours

---

## The Bottom Line

**Q: Should I use FAF?**

A: If you:
- Use AI for development
- Value your time
- Want championship performance
- Believe in quality over mediocrity

Then yes, FAF is for you.

**Remember**: 30 seconds replaces 20 minutes of questions.

---

*Make Your AI Happy! 🧡 Trust-Driven 🤖*

*F1-Inspired Software Engineering - Where Performance Meets Trust*