---
name: faf-expert
description: Expert in the .faf format (Persistent Project Context for AI) and the faf-cli toolkit. Use when working with .faf files, scoring AI-readiness, syncing project context to CLAUDE.md, or discussing the Foundational Context Layer (FCL) doctrine. IANA-registered (application/vnd.faf+yaml). Anthropic-listed as "Persistent Project Context Server" (PR #2759, merged Oct 17 2025). Current CLI: v6.6.0 — The Trophy Edition.
---

# FAF Expert — Persistent Project Context Specialist

## What is `.faf`?

The `.faf` file is **Persistent Project Context for AI** — a single source of truth that survives across sessions, tools, and AI assistants.

- **IANA-registered media type:** `application/vnd.faf+yaml` (registered Oct 30, 2025)
- **Anthropic-listed:** [modelcontextprotocol/servers PR #2759](https://github.com/modelcontextprotocol/servers/pull/2759) — claude-faf-mcp shipped as *"Persistent Project Context Server"* (merged Oct 17, 2025)
- **Git-native:** `project.faf` versions with your code; every clone gets full AI context
- **The CLI behind the FCL** — the Foundational Context Layer for AI

The credo: **FAF defines. MD instructs. AI codes.**

## When to activate this skill

- Creating, editing, or scoring `.faf` files
- Syncing `.faf` ↔ `CLAUDE.md` (or `AGENTS.md`, `.cursorrules`, `GEMINI.md`)
- Diagnosing sub-Trophy scores and reaching 🏆 100%
- Explaining the FCL, tier system, or app-type ladder
- Connecting `.faf` work to the broader receipts: IANA, Anthropic PR #2759, MCP Registry

## Install the CLI

```bash
bunx faf                       # Bun — zero install, fastest
npx faf                        # npm — works everywhere
npm install -g faf-cli         # global install
brew install faf-cli           # Homebrew
```

`faf` is the verb across every surface: `bunx faf`, `npx faf`, `/faf` (Claude Code plugin), `faf` (global). Bare `faf` is shorthand for `faf auto` — same behavior, fewer keystrokes.

## The workflow

```
faf init → faf auto → faf go → 🏆 Trophy 100%
```

| Command | What it does |
|---------|--------------|
| `faf init` | Create a `project.faf` scaffold for your project |
| `faf auto` | Auto-detect stack, fill what's detectable, score |
| `faf go` | Guided interview to fill the remaining slots → Trophy |
| `faf score` | Check current AI-readiness (0–100%) |
| `faf sync` | Push `.faf` → `CLAUDE.md` (and friends) |
| `faf compile` | `.faf` → `.fafb` binary (sealed, portable, deterministic) |
| `faf check` | Validate `.faf` structure |
| `faf info` | Version + system info |

Run `faf --help` for the full 26-command set.

## Scoring — Trophy 100% all-or-nothing

From v6.6.0 onward, faf-cli recommends **only 🏆 Trophy**.

| Tier | Score | Status |
|------|-------|--------|
| 🏆 **Trophy** | 100% | AI never has to guess |
| ★ **Gold** | 99%+ | 1 slot from Trophy |
| ◆ **Silver** | 95%+ | Close — keep going |
| ◇ **Bronze** | 85%+ | Interim — keep going |
| ● **Green** | 70%+ | Interim — keep going |
| ● **Yellow** | 55%+ | AI flipping coins |
| ○ **Red** | <55% | AI working blind |
| ♡ **White** | 0% | No context at all |

**Why all-or-nothing?** Architectural, not aspirational:

```
Layer 4   AI tooling          ← AI optimised by complete FCL
Layer 3   Agents              ← can act because FCL is complete
Layer 2   MD instructions     ← can be regenerated correctly
Layer 1   .faf (FCL)          ← 🏆 Trophy = complete = foundation
```

100% on Layer 1 makes Layers 2–4 work. Sub-100% degrades every layer above — instructions miss context, agents guess, AI optimisation can't happen.

🏆 is the only emoji. Sub-Trophy tiers use geometric Unicode (★ ◆ ◇ ● ○ ♡). The retired medal ladder (🥇🥈🥉🟢🟡🔴🤍) is history.

## The 21 app-types

v6.6.0 ships a 21-type canonical ladder — 19 detectable + 1 owner-attested + 1 curated-knowledge:

**Detectable:** documentation · cli · library · sdk · wasm · html · frontend · website · mobile · mcp · backend · data-science · fullstack · svelte · framework · monorepo-root · mcpaas · saas · enterprise

**Owner-attested (non-app):** `about` — represents another codebase (public About Repo for a private source). Inherits the source's Trophy via owner attestation.

**Curated knowledge:** `encyclopedia` — structured, git-versioned knowledge surface (FAFipedia and similar). Project + human slots, 9 active. Content is `.fafi` files (inclusion markers, same parser as `.faf`).

The CLI auto-detects via `# found:` rationale next to `type:`:

```yaml
project:
  type: cli  # found: package.json bin
```

Read the rationale; refute by inspection. **Glass Hood doctrine** — the CLI shows its work.

## .faf file structure (current schema)

```yaml
faf_version: 3.0
app_type: cli

project:
  name: my-project
  goal: One-line elevator pitch
  main_language: TypeScript

stack:
  framework: React
  backend: Node.js
  db: PostgreSQL
  api: REST
  css: Tailwind
  state: Zustand
  pkg_manager: bun
  hosting: Vercel
  build: vite
  cicd: GitHub Actions
  runtime: Node 20+
  connection: prisma

human_context:
  who: target users
  what: one-line description
  why: the problem this solves
  where: where it ships
  when: production since YYYY-MM
  how: install/usage command
```

v6.6.0 uses **Mk4 canonical slot names** in user-facing docs: `db` (was `database`), `framework` (was `frontend`), `css` (was `css_framework`), `state` (was `state_management`), `api` (was `api_type`), `pkg_manager` (was `package_manager`). 36k+ existing `.faf` files continue scoring correctly via read-time aliasing.

## The bi-sync flow

`.faf` is the **canonical Foundational Context Layer (FCL)**. CLAUDE.md / AGENTS.md / .cursorrules / GEMINI.md are downstream prose renders that READ `.faf` to save AI time. They never write back automatically.

```
.faf  ←── 8ms ──→  CLAUDE.md     (push: always one-way)
                   AGENTS.md
                   .cursorrules
                   GEMINI.md
```

`faf sync --pull` (MD → .faf backfill) is **Trophy-gated** — blocked below 100% to prevent overwriting canonical slots with prose drift.

## Receipts ladder

- **IANA-registered:** `application/vnd.faf+yaml` at [iana.org/assignments/media-types/application/vnd.faf+yaml](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml) — registered 2025-10-30
- **Anthropic-listed:** [PR #2759 merged Oct 17, 2025](https://github.com/modelcontextprotocol/servers/pull/2759) — claude-faf-mcp added as *"Persistent Project Context Server"*
- **MCP Registry:** FAF Ecosystem #2759 (Five Fingers: claude / faf / grok / gemini / WJTTC)
- **One dev, <12 months** — IANA-registered, Anthropic-listed, xAI ZEPH commission, 100+ FAF-disciplined repos, the format used to build itself

## Where to go next

| You want to... | Go here |
|----------------|---------|
| Install + start using the CLI | [github.com/Wolfe-Jam/faf-cli](https://github.com/Wolfe-Jam/faf-cli) |
| Read the v6.6 release | [CHANGELOG](https://github.com/Wolfe-Jam/faf-cli/blob/main/CHANGELOG.md) — The Trophy Edition |
| Understand the FCL / Trophy doctrine | [docs/SCORING.md](https://github.com/Wolfe-Jam/faf-cli/blob/main/docs/SCORING.md) |
| Set up bi-sync | [docs/SYNC.md](https://github.com/Wolfe-Jam/faf-cli/blob/main/docs/SYNC.md) |
| Visit the format home | [faf.one](https://faf.one) |
| Pin context to AI tools | Run `faf export` — generates AGENTS.md, .cursorrules, GEMINI.md from your `.faf` |

---

**FAF defines. MD instructs. AI codes.**
*v6.6.0 — The Trophy Edition. How no-score became a score.*
