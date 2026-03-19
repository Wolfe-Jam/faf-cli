<div style="display: flex; align-items: center; gap: 12px;">
  <img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="40" />
  <div>
    <h1 style="margin: 0; color: #000000;">faf-cli</h1>
    <p style="margin: 4px 0 0 0;"><strong>The package.json for AI Context</strong></p>
  </div>
</div>

[![TAF](./badge.svg)](https://github.com/Wolfe-Jam/faf-taf-git)
[![CI](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml)
[![NPM Downloads](https://img.shields.io/npm/dt/faf-cli?label=total%20downloads&color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![npm version](https://img.shields.io/npm/v/faf-cli?color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![Website](https://img.shields.io/badge/Website-faf.one-orange)](https://faf.one)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude_Code-enabled-00D4D4)](https://github.com/anthropics/claude-code-action)
[![project.faf](https://img.shields.io/badge/project.faf-inside-00D4D4)](https://github.com/Wolfe-Jam/faf)

```
project/
├── package.json     ← npm reads this
├── project.faf      ← AI reads this
└── src/
```

> **Every building requires a foundation. `project.faf` is AI's foundation.**
>
> You have a `package.json`. Add a `project.faf`. Done.

**Git-Native.** `project.faf` versions with your code — every clone, every fork, every checkout gets full AI context. No setup, no drift, no re-explaining.

---

## Install

```bash
bunx faf-cli auto                  # Bun (recommended — same toolchain as Claude Code)
npx faf-cli auto                   # npm (no install required)
brew install faf-cli && faf auto   # Homebrew
```

---

## v5.1.0 — The FAFb Edition

`faf compile` turns your `.faf` into a `.fafb` binary — CRC32 sealed, deterministic, portable. Same compiler that runs in the browser (322KB WASM) now runs from the CLI. YAML is source code. FAFb is the compiled output.

```bash
faf compile                    # project.faf → project.fafb
```

The full story: **[faf.one/blog/compiler-is-the-spec](https://faf.one/blog/compiler-is-the-spec)**

---

## Top 7 Commands

| # | Command | One-liner |
|---|---------|-----------|
| 1 | `faf init` | Create `.faf` from your local project |
| 2 | `faf git <url>` | Instant `.faf` from any GitHub repo — no clone |
| 3 | `faf auto` | Zero to 100% in one command |
| 4 | `faf go` | Guided interview to gold code |
| 5 | `faf bi-sync` | `.faf` ↔ CLAUDE.md — free forever |
| 6 | `faf tri-sync` | ROM ↔ CLAUDE.md ↔ MEMORY.md — Pro |
| 7 | `faf compile` | `.faf` → `.fafb` binary — sealed, portable, deterministic |

Run `faf --help` for all 64+ commands.

---

## Quick Start

```bash
# ANY GitHub repo — no clone, no install, 2 seconds
bunx faf-cli git https://github.com/facebook/react

# Your own project
bunx faf-cli init              # Create .faf
bunx faf-cli auto              # Zero to 100% in one command
bunx faf-cli go                # Interactive interview to gold code
```

**91% token reclaim out the gate.** Relentless pursuit to 100%.

---

## Core Commands

| Command | Purpose |
|---------|---------|
| **`faf git <url>`** | 1-Click Context — 90%+ for ANY GitHub repo (no cloning) |
| `faf go` | Guided interview to 100% (completes the 6 Ws) |
| `faf init` | Create project.faf from your codebase |
| `faf auto` | Auto-enhance to Gold Code |
| `faf score` | Check AI-readiness (0-100%) |
| `faf compile` | Compile `.faf` → `.fafb` binary (CRC32 sealed) |
| `faf bi-sync` | Sync .faf ↔ CLAUDE.md (8ms) |
| `faf tri-sync` | .faf ↔ CLAUDE.md ↔ MEMORY.md — **Pro** |
| `faf agents` | AGENTS.md interop (import/export/sync) |
| `faf cursor` | .cursorrules interop (import/export/sync) |
| `faf gemini` | Gemini CLI / Antigravity interop |
| `faf formats` | Show 199 detected formats |

---

## Scoring

| Tier | Score | Status |
|------|-------|--------|
| 🏆 Trophy | 100% | AI Optimized — Gold Code |
| 🥇 Gold | 99%+ | Near-perfect |
| 🥈 Silver | 95%+ | Excellent |
| 🥉 Bronze | 85%+ | Production ready |
| 🟡 Yellow | 55%+ | AI flipping coins |
| 🔴 Red | <55% | AI working blind |

Details: [docs/SCORING.md](./docs/SCORING.md)

---

## Sync

```
bi-sync:   .faf  ←── 8ms ──→  CLAUDE.md                (free forever)
tri-sync:  .faf  ←── 8ms ──→  CLAUDE.md ↔ MEMORY.md    (Pro)
```

14-day free trial, no signup, no credit card. Early-bird: $3/mo · $19/yr.
**[faf.one/pro](https://faf.one/pro)** · Details: [docs/SYNC.md](./docs/SYNC.md)

---

## Documentation

| Doc | What |
|-----|------|
| [Guide (6Ws)](./docs/GUIDE.md) | WHO / WHAT / WHY / WHERE / WHEN / HOW — deep dive |
| [Scoring & Tiers](./docs/SCORING.md) | Tier system, slot-ignore patterns |
| [Sync](./docs/SYNC.md) | bi-sync, tri-sync, human context |
| [Testing](./docs/TESTING.md) | Boris-Flow integration tests |
| [Skills](./docs/SKILLS.md) | 16 Claude Code skills |
| [Ecosystem](./docs/ECOSYSTEM.md) | CLI vs MCP, FAF Family, 3Ws/6Ws |
| [Slot-Ignore](./docs/SLOT-IGNORE.md) | Full slot-ignore spec |
| [Pro](./docs/PRO.md) | tri-sync commands, activation, FAQ |
| [CHANGELOG](./CHANGELOG.md) | Version history |
| [DAAFT Analysis](https://faf.one/daaft) | The cost of not having context |

---

## Support

- **[GitHub Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)** — Questions, ideas, community
- **Email:** team@faf.one

---

## License

MIT — Free and open source

**IANA-registered:** [`application/vnd.faf+yaml`](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)

*format | driven 🏎️⚡️ [wolfejam.dev](https://wolfejam.dev)*
