<div style="display: flex; align-items: center; gap: 12px;">
  <img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/logos/orange-smiley.svg" alt="FAF" width="40" />
  <div>
    <h1 style="margin: 0; color: #000000;">faf-cli</h1>
    <p style="margin: 4px 0 0 0;"><strong>IANA-Registered Format for AI Context</strong> · <code>application/vnd.faf+yaml</code></p>
  </div>
</div>

> Universal CLI for FAF (Foundational AI-context Format) - Terminal-based tooling for creating, scoring, and improving project.faf files that provide persistent AI context

[![NPM Downloads](https://img.shields.io/npm/dt/faf-cli?label=total%20downloads&color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?logo=discord&logoColor=white)](https://discord.com/invite/56fPBUJKfk)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![Website](https://img.shields.io/badge/Website-faf.one-orange)](https://faf.one)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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

## Core Features

### 41 Championship Commands
- **faf auto** - Zero to Podium in one command
- **faf init** - Create project.faf from your project
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
