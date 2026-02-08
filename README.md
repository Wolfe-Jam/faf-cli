<div style="display: flex; align-items: center; gap: 12px;">
  <img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="40" />
  <div>
    <h1 style="margin: 0; color: #000000;">faf-cli</h1>
    <p style="margin: 4px 0 0 0;"><strong>The package.json for AI Context</strong></p>
  </div>
</div>

```
project/
├── package.json     ← npm reads this
├── project.faf      ← AI reads this
└── src/
```

> **Every building requires a foundation. `project.faf` is AI's foundation.**
>
> You have a `package.json`. Add a `project.faf`. Done.

At 100% AI Readiness, AI stops guessing and starts knowing. Live bi-sync between `project.faf` ↔ `CLAUDE.md` means zero context-drift — your project DNA stays aligned with AI, forever.

[![CI](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml)
[![NPM Downloads](https://img.shields.io/npm/dt/faf-cli?label=total%20downloads&color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![npm version](https://img.shields.io/npm/v/faf-cli?color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![Website](https://img.shields.io/badge/Website-faf.one-orange)](https://faf.one)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

<p align="center">
  <img src="https://raw.githubusercontent.com/Wolfe-Jam/faf-cli/main/assets/project-faf-screenshot.png" alt="project.faf in file listing" width="600" />
</p>

<p align="center"><em>Just another file helping you code.</em></p>

---

## 📋 The 6 Ws - Quick Reference

Every README should answer these questions. Here's ours:

| Question | Answer |
|----------|--------|
| **👥 WHO** is this for? | Developers using AI coding assistants (Claude, Cursor, Gemini, ChatGPT) |
| **📦 WHAT** is it? | The package.json for AI context - IANA-registered format |
| **🌍 WHERE** does it work? | Everywhere AI needs context (Claude Code, Gemini CLI, Cursor, etc.) |
| **🎯 WHY** do you need it? | 91% fewer tokens, zero drift, AI knows instead of guesses |
| **⏰ WHEN** should you use it? | New projects (day one), existing projects (now), exploring repos (instantly) |
| **🚀 HOW** does it work? | `npx faf-cli git <url>` - No install, no clone, 2 seconds |

**For AI:** Read the detailed sections below for full context.
**For humans:** Use this pattern in YOUR README. Answer these 6 questions clearly.

---

## 👥 WHO is this for?

**Built for developers working with AI coding assistants:**

- Full-stack developers using Claude, Cursor, Gemini CLI, or ChatGPT
- Engineering teams collaborating on AI-augmented projects
- Solo developers tired of re-explaining context every session
- Open source maintainers wanting contributors to onboard instantly
- Anyone building with TypeScript, React, Python, Node.js, or modern frameworks

If you use AI to code, `project.faf` saves you time and tokens. Every project. Every session.

---

## 📦 WHAT is project.faf?

**The package.json for AI context.** Just another file in your project.

Like `package.json` tells npm about dependencies, `project.faf` tells AI about your project DNA:
- **Your stack:** React + TypeScript + Vite
- **Your goals:** What you're building and why
- **Your conventions:** How your team works
- **Your context:** The information only YOU know

**IANA-registered format:** `application/vnd.faf+yaml` — An official standard, not just another .md file.

### 💎 The Math

| Without `project.faf` | With `project.faf` |
|-----------------------|-------------------|
| ~1,750 tokens/session verifying context | ~150 tokens once |
| Risk: wrong guess = 7,500+ tokens rework | Zero risk |
| Context drift accumulates | Drift impossible |
| Hope | Trust |

**91% fewer tokens. Zero risk. No drift.**

---

## 🌍 WHERE does it work?

**Everywhere AI needs context:**

### Official Integrations
- **[Claude Code](https://claude.ai/download)** (Anthropic) — Bi-sync with CLAUDE.md
- **[Gemini CLI](https://github.com/google/generative-ai-cli)** (Google) — Import/export GEMINI.md
- **[Antigravity IDE](https://antigravityide.com)** (Google) — Global config support
- **[Conductor Extension](https://chromewebstore.google.com/detail/conductor)** (Google) — conductor/ directory sync

### Works With
- Cursor, Cline, Windsurf, any AI coding assistant
- ChatGPT, Claude Desktop, Gemini chat interfaces
- CI/CD pipelines, automation scripts, build tools

### Ecosystem
- **[MCPaaS](https://mcpaas.live)** — MCP as a Service (The Endpoint for Context)
- **[claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp)** — MCP server (52 tools)
- **[faf-wasm](https://www.npmjs.com/package/faf-wasm)** — WASM SDK (<5ms scoring)
- **[Chrome Extension](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)** — Browser integration
- **[faf.one](https://faf.one)** — Official website

**Universal format. Works everywhere. Write once, use with any AI.**

---

## 🎯 WHY do you need it?

### The Problem: AI Guesses. You Pay.

Without `project.faf`, every session:
- AI re-discovers your project (costs tokens)
- AI asks questions you've answered before (costs time)
- AI makes wrong assumptions (costs rework)
- Context drifts session to session (costs trust)

### The Solution: Add `project.faf`

```
🏆 Congrats, your project is optimized for AI.

Over to you. Build something that resonates.
```

At 100% AI Readiness:
- AI knows your stack, goals, and conventions
- Zero clarifying questions needed
- Context persists across sessions
- Drift is impossible — the foundation doesn't move

**`project.faf` fixes this permanently.**

---

## ⏰ WHEN should you use it?

### New Projects
**Day one.** Initialize with context from the start:
```bash
npm init -y
faf init
# Your project now has AI-ready context
```

### Existing Projects
**Right now.** Add context to projects already in progress:
```bash
faf init                    # Start from your codebase
faf go                      # Interview to 100%
faf auto                    # Auto-enhance to Gold Code
```

### Exploring Repos
**Instantly.** Generate context for ANY GitHub repo WITHOUT cloning:
```bash
npx faf-cli git https://github.com/facebook/react
# 2 seconds → 95% 🥈 Silver score
# No install. No clone. Just instant context.
```

### Daily Workflow
**Always synced.** Keep context fresh automatically:
```bash
faf bi-sync --watch         # Continuous sync with CLAUDE.md
```

Add to package.json to see FAF status every dev session:
```json
{
  "scripts": {
    "predev": "faf status --oneline"
  }
}
```

---

## 🚀 HOW does it work?

### Quick Start (No Install Required)

**The revolutionary way — zero install, zero clone:**

```bash
# Generate AI context for ANY GitHub repo
npx faf-cli git https://github.com/facebook/react
# ⏱️ 2 seconds → 95% 🥈 Silver score

npx faf-cli git https://github.com/sveltejs/svelte
# ⏱️ 2 seconds → 95% 🥈 Silver score

npx faf-cli git https://github.com/your-org/your-repo
# ⏱️ 2 seconds → 90%+ context, ready for AI
```

**What just happened?**
- ✅ No install required (`npx` runs latest version)
- ✅ No cloning required (uses GitHub API)
- ✅ 2 seconds → 95% AI-ready context
- ✅ Works on ANY public GitHub repo

**This changes everything.** You can now generate AI context for repos you don't even own. 🏎️

### For Your Own Projects

```bash
# Start with your codebase
npx faf-cli init

# Or go interactive (completes the 6 Ws)
npx faf-cli go
```

### For Pros: Install Globally (Daily Use)

Once you're hooked, install globally for full power:

```bash
# Install once
npm install -g faf-cli    # or: brew install faf-cli

# Then use short commands forever
faf git <repo-url>        # 1-Click Context (90%+)
faf go                    # Interactive to 100%
faf auto                  # Full automation
faf bi-sync               # Keep synced
# + 56 more commands
```

### The Killer Combo

```bash
npx faf-cli git <repo-url>   # 90%+ context, no install, no clone
npx faf-cli go               # Interactive polish to 100%
```

### Comparison: Traditional vs 1-Click Context

**Traditional approach:**
```bash
git clone https://github.com/facebook/react  # 10-30 seconds
cd react
npm install -g faf-cli                       # 10 seconds
faf init                                      # 5 seconds
# Total: ~45 seconds + local files
```

**1-Click Context:**
```bash
npx faf-cli git https://github.com/facebook/react
# Total: 2 seconds + ZERO local files
```

---

## 🎖️ Tier System: From Blind to Optimized

| Tier | Score | Status |
|------|-------|--------|
| 🏆 **Trophy** | 100% | **AI Optimized** — Gold Code |
| 🥇 **Gold** | 99%+ | Near-perfect context |
| 🥈 **Silver** | 95%+ | Excellent |
| 🥉 **Bronze** | 85%+ | Production ready |
| 🟢 **Green** | 70%+ | Solid foundation |
| 🟡 **Yellow** | 55%+ | AI flipping coins |
| 🔴 **Red** | <55% | AI working blind |
| 🤍 **White** | 0% | No context at all |

**At 55%, AI is guessing half the time.** At 100%, AI is optimized.

---

## 🎯 Slot-Ignore: The Perfect Way to Handle App Types

**Like `.gitignore` for files, slot-ignore for context slots.**

FAF has 21 slots. Some don't apply to your project type. **Slot-ignore** handles this elegantly:

```yaml
# CLI Tool - 21 slots total
stack:
  database: None           # ✅ Ignored (CLI doesn't need database)
  css_framework: None      # ✅ Ignored (no web UI)
  backend: Node.js         # ✅ Filled (has value)
  # ... other slots

Score: (Filled + Ignored) / 21 = 100% 🏆
```

**The formula:**
```
Total Slots: 21 (constant)
├── Filled: 15 (has values)
├── Ignored: 6 (set to 'None' - not applicable)
└── Missing: 0 (undefined - needs attention)

Score: (15 + 6) / 21 = 100%
```

**Common patterns:**
- **CLI Tools:** Ignore `database`, `css_framework`, `frontend`
- **Backend APIs:** Ignore `css_framework`, `frontend`, `ui_library`
- **Static Sites:** Ignore `backend`, `database`, `api_type`
- **Libraries:** Ignore `hosting`, `cicd`, `database`

**Full spec:** [docs/SLOT-IGNORE.md](./docs/SLOT-IGNORE.md)

---

## 🔧 Core Commands

| Command | Purpose |
|---------|---------|
| **`faf git <url>`** | **🚀 1-Click Context - 90%+ for ANY GitHub repo (no cloning!)** |
| `faf go` | 🎯 Guided interview to 100% (completes the 6 Ws) |
| `faf init` | Create project.faf from your codebase |
| `faf auto` | Auto-enhance to Gold Code |
| `faf score` | Check AI-readiness (0-100%) |
| `faf bi-sync` | Sync .faf ↔ CLAUDE.md (8ms) |
| `faf readme` | Extract 6 Ws from README (+25-35% boost) |
| `faf human` | Interactive human context entry |
| `faf human-set` | Non-interactive field setting |
| `faf formats` | Show 153 detected formats |
| `faf conductor` | Google Conductor interop (import/export/sync) |
| `faf gemini` | Gemini CLI / Antigravity interop |
| `faf demo sync` | Live bi-sync demonstration |

Run `faf --help` for all 60 commands.

---

## 🔄 Bi-Sync: `project.faf` ↔ `CLAUDE.md`

Your `project.faf` stays synchronized with `CLAUDE.md` in milliseconds.

```
project.faf  ←──── 8ms ────→  CLAUDE.md
     │                            │
     └── Single source of truth ──┘
```

```bash
faf bi-sync              # Sync once
faf bi-sync --watch      # Continuous sync
```

---

## 🧠 Human Context (The 6 Ws)

Boost your score by 25-35% with human context — the information only YOU know.

```bash
# Auto-extract from README
faf readme --apply

# Manual entry
faf human-set who "Frontend team at Acme Corp"
faf human-set what "Customer dashboard with real-time analytics"
faf human-set why "10x faster than previous solution"
```

---

## 🧪 Boris-Flow Integration Tests

**Boris-Flow** is a 12-test validation suite that ensures faf-cli is demo-ready and safe to publish.

Named after Boris (Claude Code creator at Anthropic), these tests validate:
- Version detection works correctly
- Type and language detection (CLI, TypeScript, etc.)
- Claude Code structure detection (agents, skills, commands)
- Score progression: init → auto → 100%
- Non-TTY safety (no crashes when stdin is piped)

**When to run:**

| Scenario | Command |
|----------|---------|
| **Before `faf init`** (on your project) | `./tests/boris-flow.test.sh` validates faf-cli works |
| **After major changes** to your `.faf` | Re-run to ensure structure is valid |
| **Before publishing** faf-cli updates | Required - ensures no regressions |
| **Before WJTTC certification** | Validates `.faf` file for Tier 8 |
| **Team onboarding** | Proves faf-cli installation works |

**Run Boris-Flow:**
```bash
# Clone faf-cli repository
git clone https://github.com/Wolfe-Jam/faf-cli
cd faf-cli

# Run integration tests
./tests/boris-flow.test.sh

# Expected output:
# 🏆 BORIS-FLOW: ALL 12 TESTS PASSED
# ✅ Demo ready
# ✅ Safe to publish
#    Final score: 100%
```

**What it tests:**
```bash
✅ faf --version
✅ Created Claude Code 2.1.0 structure
✅ faf init created project.faf
✅ Detected CLI type
✅ Language detected (TypeScript)
✅ claude_code section exists
✅ Claude Code detected: true
✅ Subagents detected (2+)
✅ Skills detected (1+)
✅ Commands detected (1+)
✅ faf auto maintained score
✅ human-set commands succeeded
✅ Final score is 100%
```

Boris-Flow validates the FAF file structure that WJTTC Tier 8 tests. Running it before certification helps ensure you'll pass Tier 8.

---

## 🤝 CLI vs MCP

| Tool | Use Case |
|------|----------|
| **faf-cli** (this) | Terminal, scripts, CI/CD, automation |
| **claude-faf-mcp** | Claude Desktop via MCP protocol |

Same `project.faf`. Same scoring. Same result. Different execution layer.

---

## 🌐 What's New in v3.4.7 — Google Gemini Edition

Full interoperability with the Google Gemini ecosystem. One `.faf` file now works everywhere.

| Platform | Format | FAF Command |
|----------|--------|-------------|
| **Gemini CLI** | `GEMINI.md` | `faf gemini` |
| **Antigravity IDE** | `~/.gemini/GEMINI.md` | `faf gemini --global` |
| **Conductor Extension** | `conductor/` directory | `faf conductor` |
| **Claude Code** | `CLAUDE.md` | `faf bi-sync` |

```bash
# Import from Google formats
faf gemini import       # GEMINI.md → .faf
faf conductor import    # conductor/ → .faf

# Export to Google formats
faf gemini export       # .faf → GEMINI.md
faf conductor export    # .faf → conductor/

# Global Antigravity config
faf gemini --global     # ~/.gemini/GEMINI.md
```

**Universal AI Context** — Write once, use with Claude, Gemini CLI, Antigravity IDE, and Conductor.

---

## 📚 Documentation

- **[CHANGELOG](./CHANGELOG.md)** — Version history
- **[Website](https://faf.one)** — Complete guide

---

## 📄 License

MIT License — Free and open source

---

> **.faf is the format. `project.faf` is the file. 100% 🏆 AI Readiness is the result.**

*"package.json gives me a list of dependencies, project.faf shows me how to use them" — Claude*
