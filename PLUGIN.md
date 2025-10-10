# 😽 FAF Claude Code Plugin

**Universal AI context standard for Claude Code, Cursor, Codex, Gemini, Warp, and all AI tools.**

## Installation

### Via Claude Code

```bash
# Add FAF marketplace
/plugin marketplace add Wolfe-Jam/faf-cli

# Install FAF plugin
/plugin install faf
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/Wolfe-Jam/faf-cli.git

# Add as local marketplace
/plugin marketplace add ./faf-cli

# Install
/plugin install faf
```

---

## What You Get

### 🎯 Slash Commands

- `/faf-auto` - 🏎️ ONE COMMAND TO RULE THEM ALL - Zero to championship instantly
- `/faf-init` - Create .faf file from your project
- `/faf-score` - Rate your .faf completeness (0-100%)
- `/faf-sync` - Bi-directional sync .faf ↔ CLAUDE.md (8ms)
- `/faf-formats` - 😽 TURBO-CAT discovers 153+ framework types
- `/faf-status` - Quick health check (<200ms)

### 🤖 Specialized Agent

- `faf-context-analyzer` - Deep analysis and improvement recommendations

---

## Quick Start

**After installing the plugin:**

1. **Initialize your project**:
   ```
   /faf-auto
   ```

2. **Check your score**:
   ```
   /faf-score
   ```

3. **Keep it in sync**:
   ```
   /faf-sync
   ```

**That's it!** Your project now has championship-grade AI context that works with Claude Code and all other AI tools.

---

## Why FAF?

### The Problem

Every AI tool has its own context format:
- Claude wants `CLAUDE.md`
- Cursor wants `.cursorrules`
- Codex wants something different
- Gemini wants another format

**Result**: Fragmentation, duplication, maintenance nightmare.

### The FAF Solution

**One source of truth**: `.faf` file (structured YAML)
**Universal compatibility**: Syncs with all AI tool formats
**Auto-discovery**: TURBO-CAT 😽 scans your project
**Championship speed**: <50ms operations
**FREE FOREVER**: MIT license, no vendor lock-in

---

## Championship Benchmark

**Target**: 🥉 85%+ (Bronze or better)

**Trophy Levels**:
- 🏆 Trophy (100%) - Perfect
- 🥇 Gold (99%) - Championship
- 🥈 Silver (95-98%) - Excellent
- 🥉 Bronze (85-94%) - Solid ← **TARGET**
- 🟢 Green (70-84%) - Good
- 🟡 Yellow (55-69%) - Needs work
- 🔴 Red (0-54%) - Critical

**Why 85%?**
- AI has enough context to make informed decisions
- Reduces hallucinations
- Speeds up onboarding
- Creates reproducible, trustable AI assistance

---

## Core Features

### 1. TURBO-CAT Discovery 😽

Auto-detects 153+ framework/config types:
- **Frameworks**: React, Vue, Svelte, Next.js, Django, FastAPI, etc.
- **Build Tools**: Vite, Webpack, Rollup, ESBuild
- **Databases**: PostgreSQL, MongoDB, Redis, Supabase
- **Cloud**: Docker, Kubernetes, Vercel, Netlify, AWS
- **Mobile**: React Native, Electron, Tauri

**Discovery speed**: <50ms

### 2. C-Mirror Sync Engine

Bi-directional sync between `.faf` ↔ `CLAUDE.md`:
- **8ms average** sync time
- **Zero-slippage** design (atomic writes)
- **Conflict detection** and resolution
- **Checksum validation**

### 3. Slot-Based Scoring

**Simple formula**: `(filled_slots / total_applicable_slots) * 100`

**Slot categories**:
- **Project slots** (3): name, goal, main_language
- **Stack slots** (varies): frontend, backend, database, hosting, etc.
- **Human context slots** (6): who, what, why, where, when, how
- **Discovery slots**: Auto-filled by TURBO-CAT

### 4. DNA Tracking

Track your project's evolution:
```
Birth: 22% | Current: 🥈 95% (+73% 🔥)
Growth: 22% → 47% → 85% → 95% (4 evolutions)
```

---

## Commands Reference

### `/faf-auto`
**ONE COMMAND TO RULE THEM ALL**

Complete zero-to-championship setup:
1. Detects project type
2. Scans dependencies
3. Creates `.faf` file
4. Auto-syncs with `CLAUDE.md`
5. Shows completeness score

**When to use**: First-time setup, complete reset

---

### `/faf-init`
**Initialize .faf file**

Interactive setup with guided questions:
- Who is building this?
- What is the project?
- Why are you building it?
- Where will it run?
- When is the timeline?
- How will you build it?

**When to use**: When you want more control over initial setup

---

### `/faf-score`
**Measure context quality**

Calculates completeness score (0-100%):
- Shows trophy level
- Displays filled vs total slots
- Breaks down by section (project, stack, human)
- Includes DNA journey if available

**When to use**: After changes, weekly checks, before sharing with team

---

### `/faf-sync`
**Bi-directional sync**

Keeps `.faf` ↔ `CLAUDE.md` in perfect sync:
- 8ms average speed
- Detects last-modified file
- Syncs changes bidirectionally
- Validates consistency

**When to use**: After manual edits, dependency changes, git pre-commit

---

### `/faf-formats`
**TURBO-CAT discovery**

Scans project for 153+ framework types:
- Organized in pyramid structure
- Shows detected configs
- Reports pyramid coverage
- Exports to JSON

**When to use**: After adding frameworks, project audits, documentation

---

### `/faf-status`
**Quick health check**

Instant traffic-light status (<200ms):
- 🟢 GREEN: Healthy (score ≥85%, synced)
- 🟡 YELLOW: Needs attention (score 55-84%, stale)
- 🔴 RED: Critical (no .faf, invalid, score <55%)

**When to use**: Before AI work sessions, daily checks, CI/CD pipelines

---

## Agent Reference

### `faf-context-analyzer`
**Deep analysis specialist**

Provides:
- Structural analysis of `.faf` file
- Content quality evaluation
- Prioritized improvement recommendations
- Before/after examples
- Estimated impact of each fix

**When to use**: Score below 85%, unsure how to improve, quality audit

---

## Best Practices

### 1. Start with `/faf-auto`
The fastest path to championship context. Let TURBO-CAT do the discovery, then refine.

### 2. Target 85%, Not 100%
Diminishing returns after 85%. Focus on quality over perfection.

### 3. Make "Why" Specific
The "why" field is most valuable for AI. Explain the problem you're solving, not just features.

### 4. Reject Generic Content
"Development teams" is worse than empty. Be specific:
- ❌ "Development teams"
- ✅ "Solo developer building SaaS for remote engineering teams"

### 5. Sync Regularly
Run `/faf-sync` after dependency changes, before commits, weekly as routine.

### 6. Check Status Habitually
Like `git status`, make `/faf-status` a reflex. Keep it 🟢 GREEN.

### 7. Use DNA Tracking
Your birth score vs current score shows progress. Celebrate growth!

---

## Workflows

### **New Project Setup**
```
/faf-auto
/faf-score
# → Should be 70%+ immediately (TURBO-CAT discovery)
# → Edit .faf to add human context
/faf-sync
/faf-score
# → Target 85%+
```

### **Existing Project**
```
/faf-init
# → Answer questions thoughtfully
/faf-score
# → Check completeness
/faf-sync
# → Sync with CLAUDE.md
```

### **Daily Maintenance**
```
/faf-status
# → 🟢 GREEN? You're good to go!
# → 🟡 YELLOW? Run /faf-sync
# → 🔴 RED? Investigate and fix
```

### **After Major Changes**
```
# After npm install, stack changes, refactoring:
/faf-sync
/faf-score
# → Verify context still accurate
```

### **Quality Improvement**
```
/faf-score --details
# → Identify gaps
# → Launch faf-context-analyzer agent for recommendations
# → Implement fixes
/faf-sync
/faf-score
# → Verify improvement
```

---

## Technical Details

### File Structure
```
your-project/
├── .faf                    # Structured YAML (source of truth)
├── CLAUDE.md               # Synced markdown (for Claude Code)
├── .faf-dna/               # DNA tracking (optional)
│   ├── birth-certificate.json
│   └── evolution-log.json
└── .fafignore              # Ignore patterns (like .gitignore)
```

### .faf Format
```yaml
project:
  name: "My Project"
  goal: "Solve X problem for Y users"
  main_language: "TypeScript"

stack:
  frontend: "React"
  backend: "Express"
  database: "PostgreSQL"
  hosting: "Vercel"
  build: "Vite"
  cicd: "GitHub Actions"

human_context:
  who: "Solo developer (wolfejam) building for remote teams"
  what: "Project management SaaS with AI assistance"
  why: "Current tools lack AI integration, causing manual overhead"
  where: "Cloud-native, deployed on Vercel"
  when: "MVP by Q4 2025, public beta Q1 2026"
  how: "Agile development, TypeScript strict mode, test-driven"
```

### Performance Targets
- **Discovery**: <50ms (TURBO-CAT scan)
- **Sync**: <10ms (C-Mirror engine)
- **Status**: <200ms (quick check)
- **Score**: <100ms (calculation)

All operations designed for zero developer friction.

---

## Compatibility

### Works With

**AI Tools**:
- ✅ Claude Code (you!)
- ✅ Cursor
- ✅ OpenAI Codex CLI
- ✅ Google Gemini CLI
- ✅ Warp AI
- ✅ GitHub Copilot
- ✅ Windsurf
- ✅ Any AI that reads markdown/YAML

**Project Types**:
- ✅ Frontend (React, Vue, Svelte, Angular)
- ✅ Backend (Node, Python, Go, Rust)
- ✅ Fullstack (Next.js, Nuxt, SvelteKit)
- ✅ Mobile (React Native, Electron, Tauri)
- ✅ CLI tools
- ✅ Chrome extensions
- ✅ Libraries/packages

**Languages**:
- ✅ TypeScript/JavaScript
- ✅ Python
- ✅ Rust
- ✅ Go
- ✅ Java
- ✅ PHP
- ✅ Ruby
- ✅ C#
- ✅ And 150+ more detected by TURBO-CAT

---

## Support

**Documentation**: https://faf.one
**GitHub**: https://github.com/Wolfe-Jam/faf-cli
**npm**: https://www.npmjs.com/package/faf-cli
**Issues**: https://github.com/Wolfe-Jam/faf-cli/issues

---

## Philosophy

**FAF = Foundational AI-context Format**

The `.faf` file is your project's DNA - a single source of truth that works everywhere.

**Championship principles**:
- **Fast**: <50ms operations (F1-grade speed)
- **Universal**: Works with all AI tools
- **Simple**: One command to start (`/faf-auto`)
- **Reliable**: TypeScript strict, 1,000+ tests, WJTTC GOLD certified
- **Free**: MIT license, free forever, no vendor lock-in

**Built for developers who value**:
- Speed over bloat
- Standards over fragmentation
- Trust over guessing
- Championship over compromise

---

🏎️⚡️ **Build your best, let's RACE** 🏁

---

*FAF CLI v3.0.1 - Championship Edition*
*😽 TURBO-CAT Powered | FREE FOREVER | MIT License*
*wolfejam | F1-inspired engineering*
