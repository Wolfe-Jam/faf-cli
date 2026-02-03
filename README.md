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

## The Problem: AI Guesses. You Pay.

Without `project.faf`, every session:
- AI re-discovers your project (costs tokens)
- AI asks questions you've answered before (costs time)
- AI makes wrong assumptions (costs rework)
- Context drifts session to session (costs trust)

**`project.faf` fixes this permanently.**

---

## The Solution: Add `project.faf`

```
🏆 Congrats, your project is optimized for AI.

Over to you. Build something that resonates.
```

At 100% AI Readiness:
- AI knows your stack, goals, and conventions
- Zero clarifying questions needed
- Context persists across sessions
- Drift is impossible — the foundation doesn't move

---

## 💎 The Math

| Without `project.faf` | With `project.faf` |
|-----------------------|-------------------|
| ~1,750 tokens/session verifying context | ~150 tokens once |
| Risk: wrong guess = 7,500+ tokens rework | Zero risk |
| Context drift accumulates | Drift impossible |
| Hope | Trust |

**91% fewer tokens. Zero risk. No drift.**

---

## ⚡ Quick Start

**FAF first. The earlier AI knows your project, the more tokens you save.**

```bash
# Install
npm install -g faf-cli    # or: brew install faf-cli

# Initialize (do this FIRST on any project)
cd your-project
faf auto                  # Creates project.faf at 100%

# Verify
faf status --oneline      # 🏆 project.faf 100% | bi-sync ✓ | foundation optimized

# Now plan. Now build.
```

**Add to package.json** (see FAF status every dev session):
```json
{
  "scripts": {
    "predev": "faf status --oneline"
  }
}
```

---

## What's New in v3.4.7 — Google Gemini Edition

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

## Tier System: From Blind to Optimized

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

## Core Commands

| Command | Purpose |
|---------|---------|
| `faf init` | Create project.faf from your codebase |
| `faf score` | Check AI-readiness (0-100%) |
| `faf auto` | Auto-enhance to Gold Code |
| `faf bi-sync` | Sync .faf ↔ CLAUDE.md (8ms) |
| `faf readme` | Extract 6 Ws from README (+25-35% boost) |
| `faf human` | Interactive human context entry |
| `faf human-set` | Non-interactive field setting |
| `faf formats` | Show 153 detected formats |
| `faf conductor` | Google Conductor interop (import/export/sync) |
| `faf gemini` | Gemini CLI / Antigravity interop |
| `faf demo sync` | Live bi-sync demonstration |

Run `faf --help` for all 46 commands.

---

## Boris-Flow Integration Tests

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

## Human Context (The 6 Ws)

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

## CLI vs MCP

| Tool | Use Case |
|------|----------|
| **faf-cli** (this) | Terminal, scripts, CI/CD, automation |
| **claude-faf-mcp** | Claude Desktop via MCP protocol |

Same `project.faf`. Same scoring. Same result. Different execution layer.

---

## 📦 Ecosystem

- **[MCPaaS](https://mcpaas.live)** — MCP as a Service (The Endpoint for Context)
- **[claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp)** — MCP server (52 tools)
- **[faf-wasm](https://www.npmjs.com/package/faf-wasm)** — WASM SDK (<5ms scoring)
- **[Chrome Extension](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)** — Browser integration
- **[faf.one](https://faf.one)** — Official website

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
