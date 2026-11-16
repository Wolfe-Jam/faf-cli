# FAF Guide — The 6Ws Deep Dive

## 📋 The 6 Ws - Quick Reference

Every README should answer these questions. Here's ours:

| Question | Answer |
|----------|--------|
| **👥 WHO** is this for? | Developers using AI coding assistants (Claude, Gemini, Cursor, Grok, ChatGPT) |
| **📦 WHAT** is it? | The package.json for AI context - IANA-registered format |
| **🎯 WHY** do you need it? | AI reads your project's facts from one scored file instead of rediscovering them each session |
| **🌍 WHERE** does it work? | Everywhere AI needs context (Claude Code, Gemini CLI, Cursor, etc.) |
| **⏰ WHEN** should you use it? | New projects (day one), existing projects (now), exploring repos (instantly) |
| **🚀 HOW** does it work? | `faf init` detects the stack, `faf go` asks for the goal and six W's, `faf sync` writes CLAUDE.md |

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

### What goes in a slot

There are always 33 slots. Each one holds **one succinct fact**: text, or a number.

| ☑️ One fact | Not one fact: write one fact instead |
|-----------|----------------------------------------|
| `name: faf-cli` | `name: {a: 1}` (a mapping) |
| `goal: Score project context` | `goal: [fast, small]` (a list) |
| `runtime: Bun` | `who: true` (true / false) |
| `when: 2026` | |

Words that hold no fact count as empty until you fill the slot: `runtime: TBD`, `database: None`.

**The app-type decides which slots count.** `type: cli` → 12 slots count; the other 21 are `slotignored`. `faf auto` writes `slotignored` for you, from the app-type; you don't write it yourself.

Write the app-type's own name: `type: cli`, not `cli-tool`; `type: mcp`, not `mcp-server`. A name faf doesn't know is treated as `library`. No type yet? `faf auto` detects it.

---

## 🎯 WHY do you need it?

### What FAF Actually Does

**1. Scored context** — facts, not guesswork
Every slot in your `project.faf` is validated and scored. `faf score` shows which slots are still empty.

**2. Context in the repo** — committed and versioned with the code
`project.faf` lives beside `package.json`, so every session, teammate and AI tool reads the same facts.

**3. Sync Keeps It Current** — One source of truth, one direction
When your project evolves, `faf sync` rewrites the faf block in `CLAUDE.md` from `project.faf` (`project.faf` → `CLAUDE.md`, never the other way). Your own text in `CLAUDE.md` stays as you wrote it.

---

## 🌍 WHERE does it work?

**Everywhere AI needs context:**

### Official Integrations
- **[Claude Code](https://claude.ai/download)** (Anthropic) — `faf sync` writes CLAUDE.md from project.faf; tri-sync also writes faf's block into the MEMORY.md Claude Code loads (one way: .faf → MEMORY.md)
- **[Gemini CLI](https://github.com/google/generative-ai-cli)** (Google) — `faf export --gemini` writes GEMINI.md
- **[Antigravity IDE](https://antigravityide.com)** (Google) — Global config support
- **[Conductor Extension](https://chromewebstore.google.com/detail/conductor)** (Google) — conductor/ directory sync

### Works With
- Cursor, Cline, Windsurf, any AI coding assistant
- ChatGPT, Claude Desktop, Gemini chat interfaces
- CI/CD pipelines, automation scripts, build tools

### Ecosystem
- **[MCPaaS](https://mcpaas.live)** — MCP as a Service (The Endpoint for Context)
- **[claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp)** — MCP server for Claude (Core 14 tools, 30 with `FAF_TOOLS=all`)
- **[grok-faf-mcp](https://npmjs.com/package/grok-faf-mcp)** — MCP server for Grok / xAI
- **[gemini-faf-mcp](https://pypi.org/project/gemini-faf-mcp/)** — MCP server for Gemini / Google
- **[faf-wasm-sdk](https://www.npmjs.com/package/faf-wasm-sdk)** — WASM SDK
- **[Chrome Extension](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)** — Browser integration
- **[faf.one](https://faf.one)** — Official website

**Universal format. Works everywhere. Write once, use with any AI.**

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
faf auto                    # Fill slots from repo facts
```

### Exploring Repos
Author context for any public GitHub repo from one shallow clone:
```bash
bunx faf-cli git https://github.com/facebook/react
# writes ./project.faf with the tech slots filled from the repo;
# the goal and six W's stay empty — only the people behind the repo know them
```

### Daily Workflow
**Always synced.** Keep context fresh automatically:
```bash
faf sync --watch            # Rewrites CLAUDE.md from project.faf on every change
```

Add to package.json to see FAF status every dev session:
```json
{
  "scripts": {
    "predev": "faf score --status"
  }
}
```

---

## 🚀 HOW does it work?

### Quick Start (No Install Required)

**Zero install, one shallow clone:**

```bash
# Author AI context for any public GitHub repo
bunx faf-cli git https://github.com/facebook/react
bunx faf-cli git https://github.com/sveltejs/svelte --stdout   # print instead of writing ./project.faf
```

> **Also works with npx:** Replace `bunx` with `npx` if you prefer npm.

### For Your Own Projects

```bash
bunx faf-cli init           # or: npx faf-cli init
bunx faf-cli go             # Interactive (completes the 6 Ws)
```

### Install Globally (Daily Use)

```bash
bun install -g faf-cli    # Bun (recommended)
npm install -g faf-cli    # or: brew install wolfe-jam/faf/faf-cli

faf git <repo-url>        # Context for any public repo (tech slots)
faf go                    # Interactive to 100%
faf auto                  # Full automation
faf sync                  # project.faf → CLAUDE.md
# run faf --help for every command
```

