# 🏎️ FAF User Guide - Get Started in 30 Seconds

**Stop faffing about with AI context - start building!**

---

## 🚀 Quick Start

### Install FAF CLI

```bash
npm install -g faf-cli

# Verify installation
faf --version
```

### Create Your First .faf File

```bash
# Navigate to your project
cd my-project

# Create .faf file (auto-detects everything)
faf init

# Check your score
faf status
```

**That's it!** Your project now has championship-grade AI context. 🏆

---

## 🏆 Understanding Your Score

FAF uses a championship medal system to track your AI-context quality:

### Medal Progression
- **🏆 Trophy (100%)** - Championship - Perfect 50|50 AI|HUMAN balance
- **🥇 Gold (99%)** - Gold standard
- **🥈 Silver (95-98%)** - Target 2 achieved
- **🥉 Bronze (85-94%)** - Target 1 achieved
- **🟢 Green (70-84%)** - GO! Ready for Target 1
- **🟡 Yellow (55-69%)** - Caution - Getting ready
- **🔴 Red (0-54%)** - Stop - Needs work

### Check Your Status

```bash
faf status

# Output:
🏎️ FAF Status
━━━━━━━━━━━━
Score: 85% 🥉 Target 1 - Bronze
Next: 95% 🥈 Target 2 - Silver (10% to go!)
```

---

## 📋 Essential Commands

### Initialize & Setup

```bash
# Create new .faf file
faf init

# Force recreate (overwrites existing)
faf init --force

# Auto-detect and set up everything
faf auto
```

### Check Status & Score

```bash
# Quick status check
faf status

# Full scorecard
faf show

# Detailed score breakdown
faf score --details
```

### Sync & Update

```bash
# Sync with latest project changes
faf sync

# Create/update CLAUDE.md (bi-directional sync)
faf bi-sync

# Watch mode - auto-sync on changes
faf bi-sync --watch
```

### Improve Your Score

```bash
# Get trust analysis
faf trust

# Detailed trust breakdown
faf trust --detailed

# AI-powered enhancements (requires API key)
faf enhance
```

### Maintenance

```bash
# Validate .faf file
faf validate

# Check for issues
faf doctor

# Clear cache
faf clear
```

---

## 🎯 Common Workflows

### Workflow 1: New Project Setup

```bash
# Start with auto command (does everything)
faf auto

# Result: .faf file + CLAUDE.md + full score
```

### Workflow 2: Improve Existing Project

```bash
# Check current status
faf status

# Sync latest changes
faf sync

# Get improvement suggestions
faf trust --detailed

# Update bi-sync
faf bi-sync
```

### Workflow 3: Team Handoff

```bash
# Ensure everything is up to date
faf sync

# Create/update CLAUDE.md for team
faf bi-sync

# Share the .faf file
# Team members get instant context!
```

### Workflow 4: Daily Development

```bash
# Morning: Check status
faf status

# During work: Auto-sync changes
faf bi-sync --watch

# Before commit: Ensure sync
faf sync && git add .faf CLAUDE.md
```

---

## 🏅 Improving Your Medal Tier

### Getting to Yellow (55%)
1. Fill in project name and goal
2. Add main programming language
3. Let auto-detection find your stack

**Commands:**
```bash
faf init
faf sync
```

### Getting to Green (70%)
1. Add human context (who, what, why, where, when, how)
2. Add AI working style preferences
3. Document quality standards

**Edit your .faf file:**
```yaml
human_context:
  who: Development team
  what: E-commerce platform
  why: Improve customer experience
  where: Cloud deployment
  when: Production/Active development
  how: Agile methodology
```

### Getting to Bronze (85% - Target 1) 🥉
1. Fill all stack technology slots
2. Add deployment information
3. Document testing requirements
4. Add specific AI instructions

**Commands:**
```bash
faf sync        # Auto-detect technologies
faf enhance     # AI-powered improvements
faf trust       # Check what's missing
```

### Getting to Silver (95% - Target 2) 🥈
1. Add comprehensive project documentation
2. Document architectural decisions
3. Fill advanced context slots
4. Fine-tune AI instructions

### Getting to Gold (99%) 🥇
1. Achieve near-perfect context completeness
2. Zero ambiguity in all documentation
3. Team validation of context quality

### Getting to Trophy (100%) 🏆
1. Perfect 50|50 AI|HUMAN balance
2. Maximum AI-detected technical context
3. Maximum human-provided project context
4. Championship-grade context quality

---

## 💡 Pro Tips

### 1. Use `faf auto` for New Projects
The `auto` command does everything in one go:
- Creates .faf
- Syncs dependencies
- Creates CLAUDE.md
- Shows scorecard

```bash
faf auto
```

### 2. Keep CLAUDE.md in Sync
The bi-sync system maintains perfect harmony between .faf and CLAUDE.md:

```bash
# One-time sync
faf bi-sync

# Watch mode (auto-sync on changes)
faf bi-sync --watch
```

### 3. Use Watch Mode During Development
Keep your context fresh automatically:

```bash
faf bi-sync --watch
```

### 4. Check Trust Score Regularly
Trust score shows AI confidence in your context:

```bash
faf trust --detailed
```

### 5. Validate Before Committing
Ensure your .faf file is valid:

```bash
faf validate
faf sync
git add .faf CLAUDE.md
```

---

## 🔧 Troubleshooting

### "No .faf file found"
```bash
# Create one
faf init
```

### "Score is low / stuck"
```bash
# Check what's missing
faf trust --detailed

# Sync latest changes
faf sync

# Get AI suggestions
faf enhance
```

### "CLAUDE.md out of sync"
```bash
# Re-sync
faf bi-sync --force
```

### "Validation errors"
```bash
# Check for issues
faf doctor

# Validate structure
faf validate

# Force recreate if needed
faf init --force
```

### "Performance issues"
```bash
# Clear cache
faf clear

# Check status
faf status
```

---

## 🎓 Advanced Features

### AI Enhancement
Requires OpenAI or Anthropic API key:

```bash
export OPENAI_API_KEY=your-key
# or
export ANTHROPIC_API_KEY=your-key

faf enhance
```

### Custom Templates
Use specific templates for project types:

```bash
faf init --template react
faf init --template python-fastapi
faf init --template node-express
```

### Trust Analysis
Deep dive into context quality:

```bash
faf trust --detailed

# Output includes:
# - Completeness score
# - AI confidence level
# - Missing context items
# - Improvement suggestions
```

### Format Detection
See detected project formats:

```bash
faf formats

# Pyramid view (hierarchical)
faf formats --pyramid
```

---

## 📊 Understanding the .faf File

### Key Sections

#### 1. Project Metadata
```yaml
project:
  name: my-app
  goal: Build amazing software
  main_language: TypeScript
```

#### 2. Stack Information
```yaml
stack:
  frontend: React
  backend: Node.js
  database: PostgreSQL
  hosting: Vercel
```

#### 3. Human Context
```yaml
human_context:
  who: Development team
  what: E-commerce platform
  why: Customer experience
  where: Cloud
  when: Production
  how: Agile
```

#### 4. AI Instructions
```yaml
ai_instructions:
  priority_order:
    - Read .faf first
    - Check CLAUDE.md for session context
  working_style:
    code_first: true
    explanations: minimal
    quality_bar: zero_errors
```

---

## 🤝 Team Collaboration

### Sharing Context with Team

1. **Commit .faf and CLAUDE.md:**
```bash
git add .faf CLAUDE.md
git commit -m "Add FAF context"
git push
```

2. **Team members pull and use:**
```bash
git pull
# Context is immediately available!
```

### Keeping Context Updated

**Developer A:**
```bash
# Makes changes
faf sync
git commit -am "Update dependencies"
```

**Developer B:**
```bash
# Pulls changes
git pull
# .faf is already updated!
```

---

## 🏎️ Performance Tips

FAF is designed for F1-level speed:

- **Status command:** <38ms (faster than git status)
- **Sync operations:** <200ms
- **Context generation:** <2s for large projects

### Speed Optimization

```bash
# Use quiet mode for faster output
faf status -q

# Clear cache if slow
faf clear

# Skip AI enhancement if not needed
faf sync  # Fast
# vs
faf enhance  # Slower (AI-powered)
```

---

## 🔗 Integration with AI Tools

### Claude Desktop (MCP)
```bash
npm install -g claude-faf-mcp
# Add to Claude Desktop config
```

### VS Code Extension
```bash
# Install from marketplace
code --install-extension faf-vscode
```

### CLI Integration
```bash
# Use in scripts
if faf validate; then
  echo "Context is valid"
  faf score
fi
```

---

## 📚 Additional Resources

- **Full Documentation:** [docs.faf.one](https://docs.faf.one)
- **Website:** [faf.one](https://faf.one)
- **Community:** [GitHub Discussions](https://github.com/Wolfe-Jam/faf/discussions)
- **Support:** support@faf.one
- **Medal System Guide:** See `CHAMPIONSHIP-MEDAL-SYSTEM.md`

---

## 🎯 Quick Reference Card

```bash
# Setup
faf init              # Create .faf
faf auto             # Full auto-setup

# Status
faf status           # Quick check
faf show             # Full scorecard
faf score --details  # Deep dive

# Sync
faf sync             # Sync changes
faf bi-sync          # Update CLAUDE.md
faf bi-sync --watch  # Auto-sync

# Improve
faf trust --detailed # Get suggestions
faf enhance          # AI improvements

# Maintain
faf validate         # Check validity
faf doctor          # Find issues
faf clear           # Clear cache
```

---

**Made with 🧡 by the FAF Team**

*F1-Inspired Software Engineering - Stop faffing about, start building!* 🏎️⚡️
