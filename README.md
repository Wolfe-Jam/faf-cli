# faf-cli v2.5.2

<div align="center">

<img src="https://cdn.jsdelivr.net/npm/faf-cli@latest/assets/icons/orange-smiley.svg" alt="Orange Smiley" width="48" />

**Project DNA ✨ for ANY AI** • **Context-Mirroring** • **As fast as 8ms Sync**

[![NPM Version](https://img.shields.io/npm/v/faf-cli)](https://www.npmjs.com/package/faf-cli)
[![Downloads](https://img.shields.io/npm/dt/faf-cli)](https://www.npmjs.com/package/faf-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25%20Strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)

**[Website](https://faf.one)** • **[Community](https://github.com/Wolfe-Jam/faf/discussions)** • **[Issues](https://github.com/Wolfe-Jam/faf/issues)**

</div>

---

![FAF Championship Banner](https://cdn.jsdelivr.net/npm/faf-cli@latest/faf-banner.png)

---

## 🚀 What's New in v2.5.2

### Context-Mirroring Married to Championship Scoring

We **married** them! Context-Mirroring now follows your journey from **Lonely Heart 🤍 0%** → **🏆 100% Podium Champion**.

Keep `.faf` (structured data) and `CLAUDE.md` (human-readable) in perfect sync automatically, while tracking every improvement milestone.

**Live C-MIRROR output:**

```
🔗 C-MIRROR LIVE
━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Syncing ← claude-to-faf...
├─ ██░░░░░░░░░░░░░░░░░░░░░░ 10% - Parsing CLAUDE.md content...
├─ █████████░░░░░░░░░░░░░░░ 40% - Merging human context updates...
├─ ████████████████░░░░░░░░ 70% - Updating sync metadata...
├─ █████████████████████░░░ 90% - Generating .faf YAML...
└─ 🎉 Synchronized in 8ms 🏎️⚡️💥
   Files: .faf

✅ Integrity: PERFECT
   Mirror verified - zero slippage
💎 Technical Credit 💎 +1 +4 points
└─ Bi-sync harmony maintained
```

**Key Features:**
- **As fast as 8ms** (typical 10-15ms, 95% under 50ms)
- **Bidirectional**: `.faf` ↔ `CLAUDE.md`
- **Journey tracking**: From 🤍 project birth to the 🏆 podium
- **Zero-slippage**: Atomic file operations guarantee
- **Cross-platform**: Mac + Windows tested (20/20 tests)
- **Universal**: Works with Claude, Gemini, Cursor, all AI tools

### Championship Scoring Display - MCP Visual Polish Arrives in CLI

**The Upgrade:** Experience the same polished progress bar format from `claude-faf-mcp`, now in your terminal.

```bash
faf score
```

```
🥉 Score: 89/100
█████████████████████░░░ 89%
Status: Target 1 - Bronze

Next milestone: 95% 🥈 Target 2 - Silver (6 points to go!)

🏎️  FAF Championship Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initial DNA: 12% (born 2025-10-03)
Growth: +77% over 0 days
Next Milestone: 95% 🥈 Target 2 - Silver (6% to go!)

⚖️  Balance: ████████████████░░░░ AI:75% | ░░░░████ HUMAN:25%
```

**What's New:**
- **Progress Bar Format** - MCP's championship-grade visualization ported to CLI
- **Scoreboard Title** - Initial DNA → Current score tracking above ASCII art
- **Visual Polish** - Clean white text with FAF brand colors (cyan/orange)
- **Asset Fix** - Orange smiley logo and ASCII banner load properly on npm
- **Brotherhood Sync** - CLI and MCP now share same visual DNA

---

## 🏆 Championship Scoring System

Track your project's AI-readiness with F1-inspired tiers:

```
🏆 Trophy (100%)    - Championship - Perfect 50|50 AI|HUMAN balance
🥇 Gold (99%)       - Gold standard
🥈 Silver (95-98%)  - Excellence
🥉 Bronze (85-94%)  - Production ready
🟢 Green (70-84%)   - Good foundation
🟡 Yellow (55-69%)  - Getting there
🔴 Red (0-54%)      - Needs attention
```

**Live output in your terminal:**

```
🏎️  FAF Stats
═════════════

📊 Score: 100% 🏆

🏆 Status: Championship - You're at the podium!
⚖️  Balance: ███████████░░░░░░░░░ AI:55% | ░░░░█████████ HUMAN:45%

🎯 Achievement: Perfect AI readiness - Championship balance!
```

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g faf-cli

# Initialize in any project
cd your-project
faf init

# Auto-detect and score
faf auto
faf score

# Sync with CLAUDE.md (NEW in v2.5.2!)
faf bi-sync
```

Your AI now understands your project! 🏁

---

## 🎯 What is faf-cli?

Command-line tool that creates `.faf` files for instant AI project understanding.

**.faf = Project DNA ✨ for ANY AI**
Universal, shareable context for Claude, ChatGPT, Gemini, Cursor - regardless of stack, size, or setup.

### Why Developers Love It

**The Problem:**
- ❌ 20+ minutes explaining projects to AI
- ❌ AI gives wrong answers without context
- ❌ Manual copy/paste into chat interfaces
- ❌ Context lost between sessions

**The Solution:**
- ✅ One command creates perfect context
- ✅ 30 seconds to complete understanding
- ✅ Works with every AI tool
- ✅ Share context with your team instantly
- ✅ **NEW:** Bidirectional sync keeps everything in harmony

### Key Features

- ✅ **Universal** - Works with all AI tools
- ✅ **Fast** - As fast as 8ms sync (typical 10-15ms)
- ✅ **Smart** - Auto-detects your tech stack
- ✅ **Simple** - One command setup
- ✅ **Bidirectional** - Edit .faf or CLAUDE.md, both update
- ✅ **Free** - 100% open source, forever

---

## 🛠️ Available Commands

### Core Commands
- `faf init` - Initialize project context
- `faf auto` - Auto-detect and populate
- `faf score` - Calculate AI readiness
- `faf status` - Project health check
- `faf quick "app, react, vercel"` - Quick setup

### Context-Mirroring (NEW in v2.5.2)
- `faf bi-sync` - **Bidirectional sync** (.faf ↔ CLAUDE.md)
  - As fast as 8ms (typical 10-15ms)
  - Zero data loss guarantee
  - Edit either file, both update
  - Cross-platform verified

### Enhancement Commands
- `faf enhance` - Optimize scoring
- `faf sync` - Sync with CLAUDE.md (one-way)

### Management Commands
- `faf trust` - Validate integrity
- `faf doctor` - Diagnose issues
- `faf clear` - Clear caches
- `faf index` - A-Z command reference

### Utility Commands
- `faf version` - Show version (with ASCII art!)
- `faf welcome` - First-time guide
- `faf help` - Command help

---

## 💡 Usage Examples

```bash
# Quick setup for new project
faf quick "my-app, react, typescript, vercel"

# Auto-detect existing project
faf auto

# Check your score with details
faf score --details

# See current status
faf status

# NEW: Bidirectional sync with CLAUDE.md
faf bi-sync

# Fix any issues
faf doctor

# Optimize scoring
faf enhance

# Quiet mode (for AI assistants)
faf init -q
faf auto -q
```

---

## 🎉 Version History

### v2.5.2 (October 3rd, 2024) - Championship Scoring & Asset Fix
- **Championship Scoring Display** - MCP's progress bar format ported to CLI
- **Asset Fix** - Orange smiley logo and ASCII banner now load properly on npm
- **Visual Polish** - Clean white text with FAF brand colors
- **Scoreboard Title** - Initial DNA and current score above ASCII art box

### v2.5.0 (October 3rd, 2024) - Context-Mirroring Release
- **Context-Mirroring engine** - Bidirectional .faf ↔ CLAUDE.md sync
- **C-Mirror** - Championship-grade sync in 15ms average
- **Zero-slippage guarantee** - Atomic file operations
- **Cross-platform verified** - Mac + Windows tested
- **20/20 test suite** - All edge cases conquered
- **Event-driven architecture** - Power Chords system
- **TypeScript strict mode** - 100% type safety

### v2.4.6 - Performance Championship
- **60% faster** operations across all commands
- **Native engine** - Championship-grade performance
- **Zero display bugs** - Perfect terminal rendering
- **100% backwards compatible** - Same commands, more speed

### v2.4 Highlights
- **AI|HUMAN Balance** - Track 50|50 balance for championship
- **Enhanced auto-detection** - Smarter tech stack recognition
- **Improved scoring** - More accurate AI-readiness metrics

---

## 📊 Technical Specs

```
Version:       2.5.2
Performance:   As fast as 8ms (typical 10-15ms, 95% under 50ms)
C-Mirror:      Championship-grade bidirectional sync
TypeScript:    100% strict mode
Dependencies:  2 (inquirer, yaml)
Tests:         100% passing (20/20 C-Mirror suite)
Build:         Zero errors
Platform:      Mac, Linux, Windows
```

---

## 🔬 Context-Mirroring Technical Details

### Architecture
- **Event-driven**: Power Chords broadcast at lowest level
- **Atomic operations**: Write → Validate → Commit pattern
- **Bidirectional intelligence**: Preserves technical fields during sync
- **Format-agnostic**: Works with any Tool.md format
- **Self-healing**: Automatic backup and recovery

### Performance
- **Best case**: 8ms (championship performance)
- **Typical**: 10-15ms per sync operation
- **95th percentile**: Under 50ms
- **Worst case**: <110ms (complex validation)

### Testing
- **20/20 test suite** passed (WJTC certified)
- **Edge cases conquered**: Emoji, Unicode, nested quotes, Windows paths
- **Round-trip verified**: Perfect data preservation
- **Cross-platform**: Mac + PC tested

---

## 🤖 For AI Assistants (Codex, Cursor, Copilot)

When using faf-cli programmatically:

1. Install with user approval: `npm install -g faf-cli`
2. Verify: `faf --version`
3. Use quiet mode: `faf init -q`, `faf auto -q`, `faf score -q`
4. Use `faf bi-sync` for CLAUDE.md synchronization
5. Request approval before network/write operations
6. Summarize results instead of raw output

---

## 🏗️ Development

```bash
# Clone
git clone https://github.com/Wolfe-Jam/faf.git
cd faf/cli

# Install & Build
npm install
npm run build

# Test
npm test

# Test C-Mirror specifically
npm run test -- tests/c-mirror/

# Link locally
npm link
```

---

## 📋 Requirements

- **Node.js** 18+
- **OS**: macOS, Linux, or Windows
- **AI Tools**: Works with Claude, ChatGPT, Gemini, Cursor, etc.

---

## 🔗 The FAF Ecosystem

- [🩵 **faf-cli**](https://npmjs.com/package/faf-cli) - This command-line tool
- [🧡 **claude-faf-mcp**](https://npmjs.com/package/claude-faf-mcp) - MCP server for Claude Desktop
- [💚 **faf.one**](https://faf.one) - Documentation & guides
- [🖥️ **Chrome Extension**](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm) - Browser integration

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

**Note**: C-Mirror core is open source. FAF-specific extensions available under separate license.

---

## 🤝 Contributing

We welcome contributions! Join our [community discussions](https://github.com/Wolfe-Jam/faf/discussions) or submit issues/PRs.

**Connect with 3000+ developers** using .faf to accelerate their AI workflows:
- Share your projects
- Get help from the community
- Request features
- Learn best practices

---

<div align="center">

**Made with 🧡 by wolfejam**

**100% FREE Forever** • **3000+ Weekly Downloads** • **Zero Faff™**

[⭐ Star on GitHub](https://github.com/Wolfe-Jam/faf) • [📦 View on NPM](https://www.npmjs.com/package/faf-cli)

</div>
