# 🚀 FAF CLI Developer Guide
*Anthropic-style comprehensive guide for developers*

## Table of Contents
1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Command Reference](#command-reference)
4. [Unique Tools](#unique-tools)
5. [Best Practices](#best-practices)
6. [Advanced Usage](#advanced-usage)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation
```bash
npm install -g @faf/cli
```

### Your First 30 Seconds
```bash
# Initialize FAF in your project
faf init

# Check your AI-context score
faf score

# See trust dashboard
faf trust

# You're done! Your AI now has championship context
```

**Result**: 30 seconds replaces 20 minutes of AI questions

---

## Core Concepts

### 1. The .faf File
Your project's AI context in pure YAML format. Think of it as `package.json` for AI.

```yaml
project:
  name: "my-app"
  goal: "Revolutionary payment processing"
  main_language: TypeScript

human_context:
  who: "Small businesses"
  what: "Payment complexity"
  why: "Current solutions too expensive"
```

### 2. Championship Scoring System
- **0-49%**: 🔴 Needs attention
- **50-69%**: 🟡 Good start
- **70-84%**: 🟢 Championship qualifying
- **85-100%**: 🏆 Championship grade

### 3. Trust-Driven Development
Transform from hope-driven ("I hope AI understands") to trust-driven ("I know AI has perfect context").

---

## Command Reference

### Essential Commands

#### `faf init`
Initialize or regenerate .faf file with automatic discovery.

```bash
faf init                    # Auto-detect project type
faf init --force           # Overwrite existing .faf
faf init --template react  # Use specific template
```

**What it does**:
- Discovers 150+ file formats
- Extracts project intelligence
- Generates championship .faf

#### `faf score`
Calculate your AI-context quality score.

```bash
faf score                  # Quick score
faf score --details       # Full breakdown
faf score --minimum 70    # Fail if below 70%
```

**Scoring includes**:
- Technical detection (50%)
- Human context (50%)
- Balance visualization

#### `faf trust`
Display the AI Trust Dashboard - your emotional confidence center.

```bash
faf trust                  # Trust dashboard
faf trust --detailed      # With metrics
faf trust --confidence    # AI confidence analysis
faf trust --garage        # Safe experimentation mode
```

### Advanced Commands

#### `faf sync`
Bi-directional synchronization between .faf and CLAUDE.md.

```bash
faf sync                   # Auto-sync both ways
faf bi-sync               # Force bi-directional sync
```

#### `faf enhance`
AI-powered context enhancement using LLMs.

```bash
faf enhance               # Use default AI
faf enhance --model claude # Specific model
```

#### `faf todo`
Generate and track context improvement tasks.

```bash
faf todo                  # Show current TODOs
faf todo --generate       # Create new TODOs
```

---

## Unique Tools

### 1. FAB-FORMATS Engine
**The Power Unit** - 150+ file format handlers providing deep intelligence extraction.

**Features**:
- Automatic language detection
- Dependency extraction
- Quality grading (EXCEPTIONAL → MINIMAL)
- Two-stage discovery pattern

**Example Impact**:
```bash
# Before FAB-FORMATS: 24% score
# After FAB-FORMATS: 86% score
# Improvement: 3.5x
```

### 2. RelentlessContextExtractor
**The Aero Package** - Hunts human context with 3-tier confidence.

**Confidence Levels**:
- **CERTAIN**: Direct evidence (README, comments)
- **PROBABLE**: Strong indicators (file patterns)
- **INFERRED**: Educated guesses (conventions)

**Extracts**:
- WHO: Target users
- WHAT: Core problem
- WHY: Motivation
- WHERE: Deployment context
- WHEN: Timeline
- HOW: Solution approach

### 3. DropCoach
**The Race Strategy** - Intelligent file guidance system.

**TOP-6 Recommendations by Language**:
- **JavaScript**: README, package.json, tsconfig, docker-compose, vercel.json, .env.example
- **Python**: README, requirements.txt, pyproject.toml, docker-compose, Dockerfile, .env.example
- **Go**: README, go.mod, go.sum, docker-compose, Dockerfile, .env.example

**Adaptive Coaching**:
```bash
"🎯 Start with README.md - project story"
"📁 Next: package.json - dependencies"
"🏆 TOP-6 Complete! Championship context achieved!"
```

### 4. AI|HUMAN Balance Visualizer
**Visual Gamification** - No math, pure motivation.

```
AI|HUMAN CONTEXT BALANCE
████████████████████████  (Cyan: AI)
████████████████████████  (Orange: HUMAN)

⚖️ PERFECT BALANCE!
✅ Your context is perfectly balanced!
🏆 AI understands your tech, you provide the meaning
```

**Result**: +144% human context completion rate

### 5. Context Mirroring
**Bi-directional Sync** - .faf ↔ CLAUDE.md

**Benefits**:
- Never lose context between sessions
- Seamless AI handoff
- Automatic synchronization
- Session persistence

---

## Best Practices

### 1. Start with Quality
```bash
# Always check your baseline
faf score --details

# Set minimum standards
faf score --minimum 70
```

### 2. Fill Human Context First
The WHO/WHAT/WHY matters more than technical details. AI can detect your stack, but only you know your mission.

### 3. Use the Garage for Experiments
```bash
faf trust --garage  # Creates backup
# Make experimental changes
faf trust --panic   # Restore if needed
```

### 4. Regular Synchronization
```bash
faf sync  # Keep .faf and CLAUDE.md in sync
```

### 5. Trust the Process
- 30 seconds of setup = 20 minutes saved per AI session
- 70% score = Good enough to start
- 85% score = Championship performance

---

## Advanced Usage

### Custom Templates
Create project-specific .faf templates:

```bash
faf init --template custom --template-path ./my-template.faf
```

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Check FAF Score
  run: |
    npm install -g @faf/cli
    faf score --minimum 70
```

### Multi-Model Verification
```bash
faf verify              # Test all models
faf verify --model claude
faf verify --model chatgpt
faf verify --model gemini
```

### Performance Monitoring
```bash
faf status              # Overall health
faf check --performance # Timing analysis
```

---

## Troubleshooting

### Common Issues

**Low Scores (< 50%)**
```bash
# Regenerate with fresh discovery
faf init --force

# Check what's missing
faf score --details

# Get specific recommendations
faf todo --generate
```

**Stale Context**
```bash
# Refresh timestamps
faf sync

# Update with latest files
faf check --fix
```

**Performance Issues**
```bash
# Check timing
faf status

# All operations should be <50ms
# If slower, check .fafignore
```

### Error Messages

| Error | Solution |
|-------|----------|
| "No .faf file found" | Run `faf init` |
| "Score below minimum" | Run `faf score --details` to see what's missing |
| "Context out of sync" | Run `faf sync` |
| "AI compatibility low" | Run `faf enhance` |

---

## Philosophy & Culture

### F1-Inspired Excellence
- **Performance Mad**: <50ms or it's too slow
- **Zero Errors**: Championship quality only
- **Rebuild Protocol**: When things break, we rebuild stronger

### Trust Over Hope
- Don't hope AI understands - KNOW it does
- Don't guess at context - MEASURE it
- Don't accept mediocrity - DEMAND championship

### The FAF Promise
**"30 seconds replaces 20 minutes of questions"**

Every command, every feature, every optimization serves this promise.

---

## Getting Help

### Resources
- **Documentation**: This guide and [docs index](./INDEX.md)
- **GitHub**: [github.com/Wolfe-Jam/faf-cli](https://github.com/Wolfe-Jam/faf-cli)
- **Website**: [fafdev.tools](https://fafdev.tools)

### Support Channels
- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Updates**: Follow releases on GitHub

### Contributing
We welcome contributions that maintain championship standards:
- Performance must stay <50ms
- Tests must pass
- Documentation must be updated
- F1 philosophy must be respected

---

*Make Your AI Happy! 🧡 Trust-Driven 🤖*

*F1-Inspired Software Engineering - Where Performance Meets Trust*