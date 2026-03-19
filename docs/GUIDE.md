# FAF Guide — The 6Ws Deep Dive

## 📋 The 6 Ws - Quick Reference

Every README should answer these questions. Here's ours:

| Question | Answer |
|----------|--------|
| **👥 WHO** is this for? | Developers using AI coding assistants (Claude, Gemini, Cursor, Grok, ChatGPT) |
| **📦 WHAT** is it? | The package.json for AI context - IANA-registered format |
| **🎯 WHY** do you need it? | 100% context (AI-scored), persists forever, syncs automatically - saves $1000s/developer |
| **🌍 WHERE** does it work? | Everywhere AI needs context (Claude Code, Gemini CLI, Cursor, etc.) |
| **⏰ WHEN** should you use it? | New projects (day one), existing projects (now), exploring repos (instantly) |
| **🚀 HOW** does it work? | `bunx faf-cli git <url>` or `npx faf-cli git <url>` - No install, no clone, 2 seconds |

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

## 🎯 WHY do you need it?

### What FAF Actually Does

**1. 100% Context Quality** — AI-scored with facts, not guesswork
Every field in your `project.faf` is validated and scored. No more "I think this is a React app" — AI **knows** it is.

**2. Context Persists Forever** — Never lost, never re-explained
Your project DNA is written once, read forever. No context drift across sessions, team members, or AI tools.

**3. Bi-Sync Keeps It Current** — Responds to changes automatically
When your project evolves, `project.faf` ↔ `CLAUDE.md` stays synchronized in 8ms. Always current, never stale.

---

### What That Actually Costs (Or Saves)

**The DAAFT Tax** (Discover, Assume, Ask, Forget, Time+Tokens)

Without `project.faf`, every AI session cycles through rediscovery:
- ❌ AI re-discovers your project (wastes tokens)
- ❌ AI asks questions you've answered before (wastes time)
- ❌ AI makes wrong assumptions → rework (wastes developer hours)
- ❌ Context drifts → compounding errors → project delays

**The Economics:**
- **Per developer:** $5,460/year + 84 hours lost productivity
- **50-developer team:** $273,000–$507,630 annually
- **91% of tokens** wasted on rediscovery instead of building

**The Real Cost:**
- Token waste (measurable: 91% wasted)
- Time waste (expensive: $5,460/year per developer)
- **Project failure** (catastrophic: 70% of projects fail, with 39% citing poor requirements and 57% citing communication breakdowns — both rooted in context loss)

**Full analysis:** [faf.one/daaft](https://faf.one/daaft)

---

### The Truth People Gloss Over

Bad context → wrong assumptions → rework → delays → project failure.

Good context isn't a "nice to have" — it's the foundation of AI-augmented development.

**`project.faf` fixes this permanently.**

At 100% AI Readiness:
- AI knows your stack, goals, and conventions (scored with facts)
- Zero clarifying questions needed (context persists)
- Drift is impossible (bi-sync keeps it current)
- Your project ships on time, within budget, with fewer surprises

---

## 🌍 WHERE does it work?

**Everywhere AI needs context:**

### Official Integrations
- **[Claude Code](https://claude.ai/download)** (Anthropic) — Bi-sync + tri-sync with CLAUDE.md + MEMORY.md
- **[Gemini CLI](https://github.com/google/generative-ai-cli)** (Google) — Import/export GEMINI.md
- **[Antigravity IDE](https://antigravityide.com)** (Google) — Global config support
- **[Conductor Extension](https://chromewebstore.google.com/detail/conductor)** (Google) — conductor/ directory sync

### Works With
- Cursor, Cline, Windsurf, any AI coding assistant
- ChatGPT, Claude Desktop, Gemini chat interfaces
- CI/CD pipelines, automation scripts, build tools

### Ecosystem
- **[MCPaaS](https://mcpaas.live)** — MCP as a Service (The Endpoint for Context)
- **[claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp)** — MCP server for Claude (33 tools)
- **[grok-faf-mcp](https://npmjs.com/package/grok-faf-mcp)** — MCP server for Grok / xAI
- **[gemini-faf-mcp](https://pypi.org/project/gemini-faf-mcp/)** — MCP server for Gemini / Google
- **[faf-wasm-sdk](https://www.npmjs.com/package/faf-wasm-sdk)** — WASM SDK (322KB, sub-2ms scoring)
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
faf auto                    # Auto-enhance to Gold Code
```

### Exploring Repos
**Instantly.** Generate context for ANY GitHub repo WITHOUT cloning:
```bash
bunx faf-cli git https://github.com/facebook/react
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

**Zero install, zero clone:**

```bash
# Generate AI context for ANY GitHub repo
bunx faf-cli git https://github.com/facebook/react
# ⏱️ 2 seconds → 95% 🥈 Silver score

bunx faf-cli git https://github.com/sveltejs/svelte
# ⏱️ 2 seconds → 95% 🥈 Silver score
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
npm install -g faf-cli    # or: brew install faf-cli

faf git <repo-url>        # 1-Click Context (90%+)
faf go                    # Interactive to 100%
faf auto                  # Full automation
faf bi-sync               # Keep synced
# + 57 more commands
```

### Traditional vs 1-Click Context

**Traditional:**
```bash
git clone https://github.com/facebook/react  # 10-30 seconds
cd react && npm install -g faf-cli && faf init
# Total: ~45 seconds + local files
```

**1-Click:**
```bash
bunx faf-cli git https://github.com/facebook/react
# Total: 2 seconds + ZERO local files
```
