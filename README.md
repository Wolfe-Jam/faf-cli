<div style="display: flex; align-items: center; gap: 12px;">
  <img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/logos/orange-smiley.svg" alt="FAF" width="40" />
  <div>
    <h1 style="margin: 0; color: #000000;">faf-cli</h1>
    <p style="margin: 4px 0 0 0;"><strong>IANA-Registered Format for AI Context</strong> · <code>application/vnd.faf+yaml</code></p>
  </div>
</div>

> Universal CLI for FAF (Foundational AI-context Format) - Terminal-based tooling for creating, scoring, and improving project.faf files that provide persistent AI context

[![NPM Downloads](https://img.shields.io/npm/dt/faf-cli?label=total%20downloads&color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![Website](https://img.shields.io/badge/Website-faf.one-orange)](https://faf.one)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What's New in v3.4.4

**Boris-Flow** - 12/12 integration tests for publish readiness. Championship-grade validation.

```bash
./tests/boris-flow.test.sh
# Validates: version, init, auto, score, Claude Code detection, non-TTY safety
```

**`faf demo sync`** - Live bi-sync demonstration. Show your team how .faf <-> CLAUDE.md sync works.

```bash
faf demo sync           # Run the demo
faf demo sync --fast    # Speed run
```

---

## TL;DR

**Problem:** AI needs persistent project context to work at its best.

**Solution:** The .faf format provides that context. This CLI creates, scores, and improves .faf files from your codebase in the IANA-registered format.

**How it works:** Run `faf init` to create your .faf file. Get a score (0-100%) showing context quality. Higher scores = AI more in-tune with your project. Use `faf auto` and other commands to improve your score quickly.

**Install:**
```bash
# npm (works everywhere)
npm install -g faf-cli

# Homebrew (macOS/Linux)
brew install faf-cli
```

**Quick start:**
```bash
cd your-project
faf init        # Creates project.faf file
faf score       # Check AI-readiness (0-100%)
```

**CLI vs MCP clarity:**
- **faf-cli** (this): Terminal-based tool for scripts, automation, and local development
- **claude-faf-mcp** ([npm](https://www.npmjs.com/package/claude-faf-mcp)): MCP server for Claude Desktop via protocol integration

Same .faf format, different execution layers. Same Project DNA and scoring. Same capabilities (create, score, improve). Choose based on your workflow.

[Website](https://faf.one) | [GitHub](https://github.com/Wolfe-Jam/faf-cli) | [Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)

---

## Project DNA Positioning

<div align="center">
  <img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/Project-faf-pckg-json-README.png" alt="project.faf file positioning" width="600" />
  <p><em>project.faf lives at the project root, between package.json and README.md</em></p>
</div>

At 55% you are building your project with half a blueprint and basically flipping a coin with AI. .FAF defines, and AI becomes optimized for Context with the project.faf file.

---

## Quick Start

### Installation

```bash
# npm (works everywhere)
npm install -g faf-cli

# Homebrew (macOS/Linux)
brew install faf-cli
```

### Generate Your First .faf File

```bash
# Initialize with IANA-registered format
faf init

# Output: project.faf with official media type
# Content-Type: application/vnd.faf+yaml
```

**What just happened:**
- Created project.faf file (IANA-registered format)
- Generated project DNA (architecture, dependencies, quality score)
- Ready for any AI (Claude Code, Gemini, Cursor, Codex, Warp, etc.)
- Official Internet standard format

### More Commands

```bash
# Auto-detect and enhance
faf auto

# Check your AI readiness
faf score

# Discover your stack's formats
faf formats

# Sync with CLAUDE.md
faf bi-sync
```

**That's it!** Your AI now has perfect context.

---

## Human Context (The 6 Ws)

Boost your score by 25-35% with human context - the information only YOU know about your project.

### Auto-Extract from README

```bash
# Preview what can be extracted
faf readme

# Apply extracted content to empty slots
faf readme --apply

# Overwrite all slots (even filled ones)
faf readme --apply --force
```

### Manual Entry

```bash
# Non-interactive (works in Claude Code)
faf human-set who "Frontend team at Acme Corp"
faf human-set what "Customer dashboard with real-time analytics"
faf human-set why "10x faster than previous solution"

# Interactive mode (terminal only)
faf human
```

### Quality Check & Protection

```bash
# Inspect quality of human_context fields
faf check

# Output shows quality levels:
#   empty     - Not filled
#   generic   - Placeholder or too short
#   good      - Quality content
#   excellent - High-value content

# Lock good content from being overwritten
faf check --protect

# Remove all protections
faf check --unlock
```

Protected fields are skipped by `faf readme` and `faf auto`, preventing accidental overwrites of quality content.

---

## Core Features

### 44 Championship Commands
- **faf auto** - Zero to Podium in one command
- **faf init** - Create project.faf from your project
- **faf readme** - Smart 6 Ws extraction from README.md
- **faf human** - Interactive human context entry
- **faf human-set** - Non-interactive field setting (Claude Code compatible)
- **faf check** - Quality inspection + field protection
- **faf enhance** - Real AI analysis and improvements
- **faf score** - AI-readiness scoring (0-100%)
- **faf formats** - 153 formats across 17-level pyramid
- **faf bi-sync** - Bidirectional .faf ↔ CLAUDE.md (8ms!)
- **faf dna** - Evolution journey tracking

Run `faf --help` for complete command reference

### IANA-Registered Standard
- Official MIME type: `application/vnd.faf+yaml`
- Recognized at Internet scale (same as PDF, JSON, XML)
- Proper HTTP Content-Type headers
- Browser and email client support
- Universal format for AI context

### Championship Performance
- **<50ms** all commands target
- **18ms** average execution
- **8ms** bi-sync achieved
- **0ms** operations possible (unmeasurable speed!)
- F1-grade engineering

### Universal AI Support
Works with Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, Warp, Copilot, Windsurf, and all AI coding assistants.

**PLUS:** AI-Automation platforms (n8n, OpenAI Builder, Google Opal, Make.com)

---

## Project Types (94 Supported)

FAF now understands your project type and scores accordingly. CLI projects don't need frontend slots. Fullstack projects need everything.

### How It Works

Set your project type in `.faf`:
```yaml
project:
  type: cli          # 9 slots (project + human)
  type: frontend     # 16 slots (+ frontend + universal)
  type: backend-api  # 17 slots (+ backend + universal)
  type: fullstack    # 21 slots (all categories)
```

### Supported Types

**9-Slot Types** (Project + Human):
`cli` `library` `npm-package` `pip-package` `crate` `gem` `chrome-extension` `firefox-extension` `safari-extension` `terraform` `kubernetes` `docker` `ansible` `github-action` `embedded` `arduino` `wasm` `jupyter` `smart-contract` `e2e-tests`

**13-Slot Types** (+ Frontend):
`mobile` `react-native` `flutter` `ios` `android` `desktop` `electron` `tauri` `game` `unity` `dapp`

**14-Slot Types** (+ Backend):
`mcp-server` `data-science` `ml-model` `data-pipeline` `n8n-workflow` `python-app`

**16-Slot Types** (+ Frontend + Universal):
`frontend` `svelte` `react` `vue` `angular` `astro`

**17-Slot Types** (+ Backend + Universal):
`backend-api` `node-api` `python-api` `go-api` `rust-api` `graphql` `microservice` `strapi`

**21-Slot Types** (All Categories):
`fullstack` `nextjs` `remix` `t3` `mern` `mean` `django` `rails` `laravel` `wordpress` `monorepo` `turborepo` `nx` `lerna` `pnpm-workspace` `yarn-workspace`

### Type Aliases (38 shortcuts)

Use intuitive names - FAF maps them automatically:

| Alias | Maps To | Alias | Maps To |
|-------|---------|-------|---------|
| `api` | backend-api | `k8s` | kubernetes |
| `cli-tool` | cli | `rn` | react-native |
| `flask` | python-api | `expo` | react-native |
| `fastapi` | python-api | `turbo` | turborepo |
| `express` | node-api | `next` | nextjs |
| `tf` | terraform | `gha` | github-action |

### slot_ignore Escape Hatch

Override type defaults for your specific project:

```yaml
project:
  type: cli
slot_ignore: [stack.hosting, stack.cicd]  # These won't count
```

Formats: array `[a, b]`, string `"a, b"`, or shorthand `hosting` → `stack.hosting`

---

## Documentation

- **[CHANGELOG](./CHANGELOG.md)** - Version history and release notes
- **[FAQ](./docs/FAQ.md)** - Common questions
- **[Commands Reference](https://faf.one/docs/commands)** - All 41 commands
- **[Website](https://faf.one)** - Complete guide and documentation
- **[Discord Community](https://discord.com/invite/56fPBUJKfk)** - Join the discussion

---

## Why FAF CLI?

> "README for the AI era" — Gemini CLI

**Persistent Context** - Your project's DNA lives in `project.faf`, readable by any AI or human

**Universal Format** - IANA-registered standard works across Claude, Gemini, Codex, any LLM

**Terminal-Native** - Built for scripts, automation, and developer workflows

**Championship Engineering** - F1-inspired performance with strict TypeScript, zero runtime errors

---

## Ecosystem

- **[FAF Format Spec](https://github.com/Wolfe-Jam/faf)** - Official IANA specification
- **[claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp)** - MCP server for Claude Desktop
- **[Chrome Extension](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)** - Browser integration
- **[faf.one](https://faf.one)** - Official website and documentation

---

## Development

```bash
# Clone
git clone https://github.com/Wolfe-Jam/faf-cli.git
cd faf-cli

# Install & Build
npm install
npm run build

# Test
npm test

# Link locally
npm link
```

---

## License

MIT License - Free and open source

---

**Built with F1-inspired engineering principles**

*"It's so logical if it didn't exist, AI would have built it itself" — Claude*
