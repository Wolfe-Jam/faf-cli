<div align="left">
  <img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/logos/orange-smiley.svg" alt="FAF" width="40" align="left" style="margin-right: 12px;" />
  <h1 style="margin-left: 52px;">faf-cli</h1>
  <p><strong>IANA-Registered Format for AI Context</strong> · <code>application/vnd.faf+yaml</code></p>
</div>
<br clear="left"/>

> Universal CLI for FAF (Foundational AI-context Format) using project.faf -
> sits with package.json and README.md in every repo to provide AI context 
## TL;DR

**Problem:** AI needs persistent project context to work at its best.

**Solution:** The .faf format provides that context. This CLI creates, scores, and improves .faf files from your codebase in the IANA-registered format.

**How it works:** Run `faf init` to create your .faf file. Get a score (0-100%) showing context quality. Higher scores = AI more in-tune with your project. Use `faf auto` and other commands to improve your score quickly. Align your .faf file with CLAUDE.md to maintain context persistently with bi-sync.

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
faf init        # Creates .faf file
faf score       # Check AI-readiness (0-100%)
```

**CLI vs MCP clarity**
- **faf-cli** (this): Runs on your machine locally in a terminal
- **claude-faf-mcp** ([npm](https://www.npmjs.com/package/claude-faf-mcp)): Runs through Claude Desktop as a tool

Same .faf, different way to use. Same Project DNA and scoring. Same capabilities (create, score, improve). Different execution layer.

Use CLI for raw speed and local development; use MCP for AI-integrated workflows. No feature gaps between them - pick based on your flow.

[Website](https://faf.one) | [GitHub](https://github.com/Wolfe-Jam/faf-cli) | [Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)

---

### 📸 See It In Action

<div align="center">
<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/screenshots/package-json-project-faf.png" alt="project.faf sits between package.json and README.md" width="500" />

**`project.faf` sits right between `package.json` and `README.md`** - exactly where it belongs.

Visible. Discoverable. Universal.
</div>

---

## 📚 Complete Documentation

**For developers who want the full story**, here's everything about FAF's architecture, testing, and championship engineering standards.

<div align="center">

<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/logos/orange-smiley.svg" alt="FAF Logo" width="64" />

**Free and Open Source** • **Project DNA for any AI** • **Zero Faff™**

[![GitHub stars](https://img.shields.io/github/stars/Wolfe-Jam/faf-cli?style=social)](https://github.com/Wolfe-Jam/faf-cli)
[![NPM Downloads](https://img.shields.io/npm/dt/faf-cli?label=total%20downloads&color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![Discord](https://img.shields.io/badge/Discord-Join%20Community-5865F2?logo=discord&logoColor=white)](https://discord.com/invite/3pjzpKsP)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![Website](https://img.shields.io/badge/Website-faf.one-orange)](https://faf.one)
[![Spec Version](https://img.shields.io/badge/Spec-v1.1.0-green)](https://github.com/Wolfe-Jam/faf/blob/main/SPECIFICATION.md)
[![IANA Registered](https://img.shields.io/badge/IANA-application%2Fvnd.faf%2Byaml-blue)](https://faf.one/blog/iana-registration)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[Website](https://faf.one)** • **[Discord](https://discord.com/invite/3pjzpKsP)** • **[GitHub](https://github.com/Wolfe-Jam/faf-cli)** • **[Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)**

</div>

---

**AI-Context Quality:** Most projects score 0-55% (insufficient context). With .faf: 85-99% (AI fully understands your project).

**Built on Championship TypeScript** - The same strict-mode code that powers [claude-faf-mcp](https://www.npmjs.com/package/claude-faf-mcp), the official MCP server in the Anthropic registry ([PR #2759](https://github.com/modelcontextprotocol/servers/pull/2759) merged).

## Installation

```bash
# Install via npm (works everywhere)
npm install -g faf-cli

# Or via Homebrew (macOS/Linux)
brew install faf-cli
```

**One command. Zero configuration. Production-ready.**

### Using Claude Desktop?

Install the MCP server too for integrated workflows:

```bash
npm install -g claude-faf-mcp
# or
brew install wolfe-jam/faf/claude-faf-mcp
```

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "claude-faf-mcp": {
      "command": "claude-faf-mcp"
    }
  }
}
```

**[claude-faf-mcp on npm →](https://www.npmjs.com/package/claude-faf-mcp)**

---

## 🎉 What's New in v3.1.2 - Discord Community Launch

**The FAF community is now live!** Join us at [discord.com/invite/3pjzpKsP](https://discord.com/invite/3pjzpKsP)

### 🎉 Community & Automation
- **Official Discord Server** - 6 focused channels (announcements, general, showcase, help, integrations, w3c-and-standards)
- **GitHub Actions Automation** - Automated release announcements to Discord
- **Low Maintenance Design** - Open community structure with auto-moderation

### 🏆 Enhanced Reliability - We are Enterprise ready
- **Enterprise-Grade Testing** - Stress tested for large repositories and monorepos
- **Improved Stability** - Enhanced test infrastructure for championship performance

**Join the community:** [discord.com/invite/3pjzpKsP](https://discord.com/invite/3pjzpKsP)

---

## 🎉 What's New in v3.1.1 - IANA Registration

**v3.1.1 updates documentation with IANA registration achievement.**

On **October 31, 2025**, the Internet Assigned Numbers Authority (IANA) officially registered `.faf` as `application/vnd.faf+yaml` - making it an Internet-standard format alongside PDF, JSON, and XML.

**What this means:**
- faf-cli now creates official Internet-standard files
- Proper HTTP Content-Type headers (`application/vnd.faf+yaml`)
- Browser and email client support for `.faf` files
- API standardization across platforms
- Infrastructure-level legitimacy

This documentation update adds IANA information throughout the README to reflect this major achievement for the format.

---

## 🎉 What's New in v3.1.0

### 🔥 THE VISIBILITY REVOLUTION 🔥

**AI context just became UNIVERSAL. project.faf is here.**

For too long, `.faf` lived in the shadows - hidden, invisible, forgotten. **NOT ANYMORE.**

### 📂 Introducing: `project.faf`

**`package.json` for AI**

**Just like `package.json` tells npm what your project needs...**
**`project.faf` tells AI what your project IS.**

| File | Purpose | Who Reads It |
|------|---------|--------------|
| `package.json` | Dependencies, scripts, metadata | npm, Node.js, developers |
| `project.faf` | **Context, architecture, purpose** | **AI, Claude, Cursor, any AI tool** |

**Same pattern. Same universality. Same necessity.**

**VISIBLE. DISCOVERABLE. UNIVERSAL.**

```bash
# The old way (hidden like .env)
ls -la
.env          # 🔒 Hidden (secrets - SHOULD be hidden)
.faf          # 👻 Hidden (AI context - SHOULD be visible!)

# The NEW WAY (visible like package.json)
ls
package.json  # ✅ Visible (dependencies - everyone needs to see)
project.faf   # ✅ Visible (AI context - AI needs to find this!)
.env          # 🔒 Still hidden (secrets stay secret)
```

**`.env` hides secrets. `project.faf` shares context.**

**`.faf` was hiding in the wrong category. `project.faf` fixes that.**

### 🚀 Why This Changes Everything

**Before:**
- Hidden `.faf` files easily forgotten
- Hard to discover in new projects
- "Wait, does this project have AI context?"
- Invisible to Git UIs, IDEs, file managers

**After:**
- `project.faf` sits next to `package.json`
- **IMPOSSIBLE TO MISS**
- Universal pattern developers already know
- Every project SHOWS its AI-readiness

### 🔺 The Golden Triangle

**Three sides. Closed loop. Complete accountability.**

```
         project.faf
          (WHAT IT IS)
              /    \
             /      \
            /        \
         repo    ←→   .taf
        (CODE)    (PROOF IT WORKS)
```

Every project needs three things:
- **Code that works** (repo)
- **Context for AI** (project.faf)
- **Proof it works** (.taf - git-tracked testing timeline)

**TAF** (Testing Audit File) format tracks every test run in git. On-the-fly CI/CD updates. Permanent audit trail. Unheard of in CI/CD.

**Traditional CI/CD:** Tests run → Results disappear → No permanent record
**TAF:** Tests run → .taf updates → Git commits → Permanent timeline

Format defined in **faf-taf-git** (GitHub Actions native support).

### ✨ The Essential Trio

```bash
your-project/
├── package.json    # What your project NEEDS (dependencies)
├── project.faf     # What your project IS (context for AI)
└── tsconfig.json   # How your project BUILDS (TypeScript config)
```

**`package.json`** → Tells npm: "Install these dependencies"
**`project.faf`** → Tells AI: "This is what I am, this is my purpose"
**`tsconfig.json`** → Tells TypeScript: "Compile with these settings"

**All visible. All universal. All essential.**

**You wouldn't skip `package.json`. Don't skip `project.faf`.**

### 🔥 New Commands

**1. `faf migrate` - Instant Upgrade**
```bash
faf migrate
# .faf → project.faf (27ms)
```

**2. `faf rename` - Bulk Power**
```bash
faf rename
# Recursively migrates ENTIRE monorepo tree
# Found 147 .faf files? ✅ Migrated in 420ms
```

**3. Auto-Magic for New Projects**
```bash
faf init    # Creates project.faf (not .faf)
faf auto    # Creates project.faf
```

### 🎯 Championship Detection Upgrade

**TSA Engine Integration** - "We're INSPECTORS, not trash collectors"

**Before (naive):**
```
Has 'commander' in package.json? → Maybe CLI
```

**After (championship):**
```
'commander' imported 10+ times? → DEFINITELY CLI
Analyzes CORE dependencies (actual usage)
95% accuracy vs 70% accuracy
```

### ⚡ Performance

- **migrate:** 27ms (54% faster than 50ms target)
- **rename:** 27ms for 3 files (73% faster than target)
- **championship grade** across all operations

### 🏆 WJTTC GOLD Certification

**97/100 Championship Score**
- Project Understanding: 20/20
- TURBO-CAT Knowledge: 20/20
- Architecture Understanding: 20/20

Full report: 194KB comprehensive test suite

### 🔙 100% Backward Compatible

**Still works with `.faf` files** - graceful transition, no breaking changes.

Your old `.faf` files keep working. Migrate when ready.

### 🌍 The Vision

**Every project with a `package.json` should have a `project.faf`**

Just like every TypeScript project has `tsconfig.json`, every Rust project has `Cargo.toml`, every Python project has `requirements.txt`...

**Every AI-augmented project has `project.faf`**

**This is the new universal standard for AI context.**

---

## 🎉 What's New in v3.0.0

### The Podium Release

**The biggest release yet:**

- 🆓 **FREE FOREVER .faf Core-Engine** - 41 championship commands, always free, open source, MIT License
- 💨 **TURBO Model Introduced** - Like VS Code + Copilot, Spotify Free + Premium, Zoom Basic + Pro
- 😽 **TURBO-CAT™ Format Discovery** - Introduced in v2.0.0, now purring at full power in v3.0.0 - 153 validated formats organized in a perfect pyramid
- 🧬 **Birth DNA Lifecycle** - Track your project's evolution from birth to championship
- 🏆 **7-Tier Podium Scoring** - 🏆 🥇 🥈 🥉 🟢 🟡 🔴 🤍 - From Lonely Heart to Podium Champion
- ⚖️ **AI | HUMAN Balance** - 50|50 system = Optimal Context for championship performance
- 🔗 **Context-Mirroring w/Bi-Sync** - Bidirectional .faf ↔ CLAUDE.md synchronization
- ⚡ **Podium Speed** - 8ms bi-sync, <50ms all commands, 18ms avg, 0ms operations achieved
- 🏁 **WJTTC GOLD Certified** - 1,000+ comprehensive tests, unique test suite
- 🤖 **BIG-3 AI Validation** - Verified by Google Gemini, Anthropic Claude, OpenAI Codex
- 🌐 **Universal AI Support** - Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, Warp, Copilot, Windsurf, ALL AI coding assistants
- 🤖 **AI-Automation Ready** - Reads n8n workflows, OpenAI Builder schemas, Google Opal, Make.com - Project DNA for automation platforms

---

## 🤖 What The AIs Said (During Verified Testing)

### The BIG-3 Validation

**Google Gemini CLI**
> "README evolution for AI era"

— *9.5/10 Rating during verified testing*

**Claude Code (Anthropic)**
> "Should become the standard"

— *9.5/10 Rating during verified testing*

**OpenAI Codex CLI**
> "Every project should have one"

— *9/10 Rating during verified testing*

---

### The Context Problem, Solved

**— .faf Inventor**
> "package.json wasn't built for this, .faf was"

**— Claude Code (Anthropic)**
> "package.json gives me a list of dependencies,
> .faf shows me how to use them"

**— Claude**
> "It's so logical if it didn't exist,
> AI would have built it itself"

---

**100% verified. Real AI responses. Not marketing copy.**

---

## 😽 TURBO-CAT™ - Full Official Launch

**The Rapid Catalytic Converter - Now Purring at Full Power**

Introduced in v2.0.0, TURBO-CAT reaches full championship form in v3.0.0. This format discovery engine knows 153 validated formats organized in a perfect pyramid structure. From `.faf` at the apex to infrastructure configs at the base, it rapidly converts raw project formats into AI-ready intelligence at championship speed.

Like a catalytic converter in an exhaust system, TURBO-CAT transforms digital waste into clean, usable output. 
Now fully unleashed and purring. 😽💨

```bash
faf formats
```

```
😽 TURBO-CAT™ v3.0.0 - Now Purring at Full Power
   (Introduced v2.0.0, Perfected v3.0.0)
═══════════════════════════════════

⚡️ Scanning project...

✅ Found 10 formats in 68ms!

📋 Discovered Formats (A-Z):
  ✅ package.json
  ✅ tsconfig.json
  ✅ Dockerfile
  ✅ .github/workflows
  ✅ jest.config.js
  ... and 5 more

💡 Stack Signature: typescript
🏆 Intelligence Score: 225

────────────────────────────────────────
😽 TURBO-CAT™: "Detection that'll make your stack PURRR!"
────────────────────────────────────────
```

**The Pyramid:** 153 formats across 17 levels. Each level unlocks new intelligence. **TURBO** reveals what TURBO-CAT really knows... 🤫

---

## 💨 FAF TURBO - World-Class Automation Intelligence

### Like **VS Code + Copilot** • Same model that works!

<div align="center">

<table>
<tr>
<td width="50%" valign="top">

### **FAF v3.0.3 (FREE FOR ALL DEVS)** 🆓

✅ **41 Podium Commands**
- Project initialization & auto-detection
- TURBO-CAT format discovery (153 formats)
- Birth DNA lifecycle tracking
- AI readiness scoring (0-100%)
- Context-mirroring (bi-sync)
- Health checks & diagnostics

✅ **Performance**
- <50ms command execution
- 8ms bi-sync (championship speed)
- F1-inspired engineering
- 0ms operations achieved

✅ **Universal Compatibility**
- Works with Claude, Codex CLI, Gemini CLI, Cursor
- Mac, Linux, Windows support
- Open source, MIT licensed
- Growing developer community

```bash
# Install via npm (works everywhere)
npm install -g faf-cli

# Or via Homebrew (macOS/Linux)
brew install faf-cli
```

</td>
<td width="50%" valign="top">

### **FAF v3.0.3 TURBO** 💨

✅ **Everything in FREE, Plus:**

🧬 **Deep Format Intelligence**
- Pyramid-level insights (17 levels deep)
- Cross-format relationship analysis
- Stack health diagnostics
- Migration path recommendations

🤖 **Universal Automation Intelligence**
- **n8n workflow parsing** - RAG, ETL, Multi-Agent patterns
- **OpenAI Assistants** - GPT Actions & function schemas
- **Google Opal** - Visual mini-app workflows
- **Make.com scenarios** - Module & integration analysis
- **FOUNDATIONAL FIRST** - ONE pattern for ALL platforms

🏆 **Premium Features**
- Priority support & service plans
- Advanced TURBO-CAT capabilities
- Enterprise integrations
- Early access to new features

```bash
Learn more: faf.one/turbo
```

</td>
</tr>
</table>

</div>

**TURBO**: Where automation platforms (n8n, Make, Opal) get championship AI context. 
**Foundational first, universal by default.**

---

## 🚀 Quick Start - Create IANA-Registered Files

### Installation

```bash
# npm (creates official .faf files)
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
- ✅ Created `.faf` file (IANA-registered format)
- ✅ Generated project DNA (architecture, dependencies, quality score)
- ✅ Ready for any AI (Claude, Cursor, Gemini, etc.)
- ✅ Official Internet standard format

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

**That's it!** Your AI now has perfect context. 🏁

---

## 🏆 The Meta-Proof: Even Claude Forgot .FAF

**The AI that built FAF scored it at 12% without `.faf`.**

We created this tool together across thousands of conversations. Yet without project DNA, even Claude couldn't recognize its own work. That's the problem FAF solves.

### Before `.faf` - Birth: 12%
<div align="center">
<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/demos/birth-dna-12-percent.png" alt="FAF CLI birth score: 12% context" width="700" />
</div>

**Context Score: 12%** — Even the AI that built it couldn't recognize it

---

### The Transformation - 344ms Later
<div align="center">
<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/demos/faf-init-demo.gif" alt="Running faf init - 344ms" width="700" />
</div>

**`faf init`** — One command. Zero configuration. Project DNA created.

---

### After `.faf` - Current: 89%
<div align="center">
<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/demos/growth-to-89-percent.png" alt="FAF CLI after .faf: 89% context score" width="700" />
</div>

**Context Score: 89%** — Instant comprehension. Persistent memory.

**+77% improvement in 344ms.** That's what project DNA does for ANY AI, ANY project.

---

## 🎯 What is FAF?

**`.faf` = Project DNA ✨ for AI**

Universal, shareable AI context that works with **Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor** - regardless of your stack, size, or setup.

## Why IANA Registration Matters

On **October 31, 2025**, the Internet Assigned Numbers Authority (IANA) officially registered `.faf` as `application/vnd.faf+yaml`.

This means `.faf` is now:

✅ **Recognized at Internet scale** - Same legitimacy as PDF, JSON, XML
✅ **Properly handled by browsers** - Correct MIME type detection
✅ **Supported in HTTP headers** - `Content-Type: application/vnd.faf+yaml`
✅ **Email client compatible** - Attachments handled correctly
✅ **API standardized** - Universal format for AI context exchange

**faf-cli creates these official IANA-registered files.**

### The Journey to IANA

- **Aug 8, 2024** - Format specification created
- **Sep 2025** - Google Chrome approvals (2x)
- **Oct 17, 2025** - Anthropic MCP Registry merger
- **Oct 31, 2025** - **IANA Registration** 🏆

From concept to Internet standard in 15 months.

### Why Context Quality Matters

**At 99% context quality**, AI knows exactly what you're building and helps at optimal levels—trusted decisions, accurate suggestions, championship performance.

**At 55% context quality**, you're flipping a coin on every decision. It's like handing a builder only half a blueprint and discussing it in a totally foreign language.

FAF's **Professional 0→99% Podium Scoring System** makes context collection measurable, fun, and championship-grade. Track your project's evolution from 🤍 Heart (0%) to 🏆 Trophy (100%).

### The REAL Problem: Project Health

**This isn't about saving 20 minutes at setup.**

Running projects on LOW AI context leads to:
- ❌ **Project death** (worst case)
- ❌ **Delays, costs, stress, heartache, disappointment**
- ❌ **Wasted time, resources, and money**
- ❌ **Poor outcomes for stakeholders and users**
- ❌ **Burnout from constant re-explaining**

**It's not a one-time config. It's a relationship.**

A healthy Human + AI collaboration requires **high-quality, persistent context**. Without it, every interaction is a gamble. Every decision is questionable. Every suggestion needs verification.

**Ignoring poor context on your project is like not brushing your child's teeth.**

You're gonna end up with a **CAVITY**.

### The Solution: Project DNA

- ✅ **Podium context** (85-99% quality scores)
- ✅ **Persistent intelligence** - AI remembers your project perfectly
- ✅ **Seamless collaboration** - Human + AI working together optimally
- ✅ **Project health monitoring** - Track context quality over time
- ✅ **Works with every AI** - Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, all of them
- ✅ **Team alignment** - Everyone (human AND AI) on the same page

---

## 🛠️ All 41 Commands

### 🏎️ Power Commands
```bash
faf auto        # ONE COMMAND TO RULE THEM ALL - Zero to Podium
faf init        # Create .faf from your project
faf enhance     # Real AI analysis & improvements
faf analyze     # Claude-first intelligence
```

### 😽 TURBO-CAT Commands
```bash
faf formats     # 153 formats across 17-level pyramid
faf stacks      # Technology stack signatures
faf vibe        # Detect development platform
```

### 🧬 DNA & Evolution
```bash
faf dna         # Show evolution journey (12% → 89% → 99%)
faf log         # Complete evolution history
faf update      # Save checkpoint
faf recover     # Disaster recovery
faf auth        # Birth certificate authentication
```

### 🏆 Scoring & Trust
```bash
faf score       # Rate completeness (0-100%)
faf trust       # Unified trust dashboard
faf credit      # Technical credit dashboard
faf check       # Comprehensive validation
faf validate    # Structure validation
faf audit       # Freshness check
```

### ⚡ Creative & Quick
```bash
faf chat        # Natural language generation (terminal only)
faf quick       # One-liner instant context
```

### 🎸 Skills & Integration
```bash
faf skills      # List Claude Code skills from .faf file
```

### 🔍 Discovery & Verification
```bash
faf verify      # Test with Claude Code, OpenAI Codex CLI, Gemini CLI
faf doctor      # Diagnose & fix issues
faf search      # Content search with highlighting
```

### 🔗 Sync & Mirror
```bash
faf bi-sync     # Bidirectional .faf ↔ CLAUDE.md (8ms!)
faf sync        # Dependency updates
faf tsa         # Inspect dependencies
```

### 📝 Editing & Management
```bash
faf edit        # Interactive editor
faf convert     # YAML to Markdown/Text
faf to-txt      # Quick text conversion
faf share       # Secure sharing with auto-sanitization
```

### 📊 Information & Help
```bash
faf show        # Display stats
faf status      # Quick health status
faf version     # Show version (with ASCII art!)
faf index       # Universal A-Z reference
faf faq         # Frequently asked questions
faf welcome     # Welcome guide
```

### 🧹 Utilities
```bash
faf clear       # Clear caches & reset state
faf todo        # Claude-inspired todo system
faf analytics   # Usage analytics & telemetry
faf notifications # Email notifications
faf lint        # Fix formatting issues
```

**Run `faf --help` for complete command reference**

---

## 🤖 Works with AI Assistants

FAF v3.0.3 fully supports **Claude Code, Warp, Cursor, Copilot, Windsurf, OpenAI Codex CLI, Gemini CLI** and ALL AI coding assistants.

**PLUS AI-Automation platforms:** n8n, OpenAI Builder, Google Opal, Make.com

### ✅ These Commands Work Everywhere
```bash
faf init        # Create .faf file
faf auto        # Auto-enhance context
faf enhance     # Improve programmatically
faf score       # Check readiness
faf bi-sync     # Sync .faf ↔ CLAUDE.md
faf formats     # Format discovery
```

### 💡 Avoid in AI Assistants
```bash
faf chat        # Requires interactive terminal
faf             # Interactive menu (use faf auto instead)
```

**Why?** Interactive commands use `inquirer` for beautiful CLI menus. These work in regular terminals but AI assistants can't forward keyboard input. **This is expected behavior.**

**Solution:** Use `faf auto` - it's designed for AI assistants! ⚡

---

## 🏆 Podium Scoring

Track your project's AI-readiness with F1-inspired tiers:

```
🏆 Trophy (100%)    - Podium - Perfect 50|50 AI|HUMAN balance
🥇 Gold (99%)       - Gold standard
🥈 Silver (95-98%)  - Excellence
🥉 Bronze (85-94%)  - Production ready
🟢 Green (70-84%)   - Good foundation
🟡 Yellow (55-69%)  - Getting there
🔴 Red (0-54%)      - Needs attention
🤍 Heart 0%         - Starting Good Luck!
```

**Live output:**

```bash
faf score
```

```
🥉 Score: 89/100
█████████████████████░░░ 89%
Status: Bronze - Production Ready

Next milestone: 95% 🥈 Silver (6 points to go!)

🏎️  FAF Podium Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initial DNA: 12% (born 2025-10-03)
Growth: +77% over 4 days
Next Milestone: 95% 🥈 Silver (6% to go!)
```

---

## ⚖️ AI | HUMAN Balance - The 50|50 Podium System

**NEW in v3.0.0:** Track the perfect balance between AI-readable and human-readable content.

### Normal Balance (Any Ratio)
<div align="center">
<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/demos/ai-human-balance-50-50.png" alt="AI|HUMAN Balance at 50/50" width="700" />
</div>

**AI 50% | HUMAN 50%** — Working toward optimal context

---

### 💚 PERFECT BALANCE ACHIEVED! (50|50)
<div align="center">
<img src="https://raw.githubusercontent.com/Wolfe-Jam/faf/main/assets/demos/prd-balance-perfect-green.png" alt="PRD Balance - Perfect 50/50 goes GREEN" width="700" />
</div>

**⚖️ PERFECT BALANCE!** — When you hit exactly 50|50, the balance bar turns **GREEN 💚** signaling championship-level context optimization. This is the sweet spot where AI and human readers both get exactly what they need.

**PRD Balance = Production-Ready Balance** 🏆

---

## 💡 Usage Examples

```bash
# Quick setup for new project
faf quick "my-app, react, typescript, vercel"

# Auto-detect existing project
faf auto

# Discover your formats
faf formats

# Check score with details
faf score --details

# Bidirectional sync with CLAUDE.md
faf bi-sync

# Track your evolution
faf dna
faf log

# Fix issues
faf doctor

# Optimize scoring
faf enhance

# Quiet mode (for AI assistants)
faf init -q
faf auto -q
```

---

## 📊 Technical Specs

```yaml
Performance:   <50ms all commands, 18ms avg, 8ms bi-sync, 0ms operations achieved
Engine:        FAF-Engine-Mk3
TURBO-CAT:     Full Power (153 validated formats)
TypeScript:    100% strict mode
Dependencies:  2 (inquirer, yaml)
Testing:       WJTTC GOLD Certified (12,500+ test iterations)
Certification: https://faf.one/wjttc
Platform:      Mac, Linux, Windows
AI Support:    Universal - Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor, Warp, Copilot, Windsurf, ALL AI coding assistants
Automation:    n8n workflows, OpenAI Builder, Google Opal, Make.com - AI-Automation platforms
```

---

## 🏎️ The .faf Pattern

### Why .faf vs RAG?

**.faf is pre-indexed intelligence.** Do the work once, use it forever.

| Aspect | RAG Approach | .faf Approach |
|--------|-------------|---------------|
| **Indexing** | Runtime embedding (slow, $) | One-time at creation (fast, free) |
| **Retrieval** | Vector search per query ($) | Instant file read (free) |
| **Quality** | Probabilistic, incomplete | Structured, validated, scored |
| **Latency** | Seconds (embedding + search) | Milliseconds (<50ms) |
| **Cost** | Per-query fees | Zero runtime cost |
| **Versioning** | Difficult | Git-friendly YAML |

**.faf is RAG's output—captured once, reused infinitely.** Podium efficiency.

### Universal Pattern

Every source follows the same pattern:

```
interrogation → extraction → filtering → generation → .faf
```

**In FREE CLI:** Code projects → .faf (all languages, frameworks, stacks)

**In TURBO:** Automation platforms → .faf (n8n, OpenAI Assistants, Opal, Make.com)

Same pattern. Same output. Universal by design.

---

## 🏆 WJTTC Podium Testing

**FAF CLI v3.0.3 is WJTTC GOLD Certified** - tested to F1-grade standards.

### What is WJTTC?
**WolfeJam Technical & Testing Center** - F1-inspired testing methodology ensuring championship-grade reliability.

### Certification: 🥇 GOLD (92/100)

**Battle-tested with 12,500+ test iterations across 5 testing tiers:**
- ✅ **BIG-3 AI Validation** (11,200 iterations - Claude, ChatGPT/Codex, Gemini)
- ✅ **287 Automated Tests** (191 Jest unit + 66 Podium Safety + 30 YOLO torture)
- ✅ **730 Empirical C.O.R.E Tests** (100% MCP protocol compliance)
- ✅ **301 Context-On-Demand Tests** (Torture testing, edge cases, stress scenarios)
- ✅ **35+ Test Documents** (Comprehensive validation reports)

**Performance Validated:**
- ⚡ **0ms operations** achieved (unmeasurable speed!)
- ⚡ **8ms bi-sync** verified (championship speed)
- ⚡ **Sub-10ms** for 68% of all operations

**Safety Tested:**
- 🛡️ **7 production-breaking bugs** fixed before release
- 🛡️ **3 security vulnerabilities** patched proactively
- 🛡️ **Zero critical failures** in production systems

**Platform Verified:**
- ✅ Mac, Linux, Windows
- ✅ Claude Code, Cursor, AI Assistants
- ✅ Big-3 AI Compatible (Claude Code, OpenAI Codex CLI, Gemini CLI)

---

## 🔬 Context-Mirroring (Bi-Sync)

Keep `.faf` (structured data) and `CLAUDE.md` (human-readable) in perfect sync automatically.

### Features
- **As fast as 8ms** (typical 10-15ms, 95% under 50ms)
- **Bidirectional:** `.faf` ↔ `CLAUDE.md`
- **Zero-slippage:** Atomic file operations design
- **Cross-platform:** Mac + Windows verified
- **Universal:** Works with any Tool.md format

### Live Output

```
🔗 C-MIRROR LIVE
━━━━━━━━━━━━━━━━━━━━━━━━━
├─ Syncing ← claude-to-faf...
├─ ██░░░░░░░░░░░░░░░░░░░░░░ 10% - Parsing CLAUDE.md...
├─ █████████░░░░░░░░░░░░░░░ 40% - Merging updates...
├─ ████████████████░░░░░░░░ 70% - Updating metadata...
├─ █████████████████████░░░ 90% - Generating YAML...
└─ 🎉 Synchronized in 8ms 🏎️⚡️

✅ Integrity: PERFECT
💎 Technical Credit +1
```

---

## 🔗 The FAF Ecosystem

- 🩵 **[faf-cli](https://github.com/Wolfe-Jam/faf-cli)** - This command-line tool (FREE FOREVER)
- 🧡 **[claude-faf-mcp](https://npmjs.com/package/claude-faf-mcp)** - MCP server for Claude Desktop
- 💚 **[faf.one](https://faf.one)** - Documentation & guides
- 🖥️ **[Chrome Extension](https://chromewebstore.google.com/detail/lnecebepmpjpilldfmndnaofbfjkjlkm)** - Browser integration
- 💨 **FAF TURBO** - Premium features - Launched 😸

---

## 🏗️ Development

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

## 📋 Requirements

- **Node.js** 18+
- **OS:** macOS, Linux, or Windows
- **AI Tools:** Works with Claude, Codex, Gemini, Cursor, Warp etc.

---

## 🤝 Contributing

We welcome contributions! Join our [community discussions](https://github.com/Wolfe-Jam/faf-cli/discussions) or submit issues/PRs.

**Join our growing community** using `.faf` to accelerate their AI workflows:
- Share your projects
- Get help from the community
- Request features
- Learn best practices

---

## 💎 Strategic Sponsorship Opportunities

**Position your brand alongside the universal AI context standard.**

FAF CLI is defining a new category: **Universal AI Context Infrastructure**. With BIG-3 AI validation (Google, Anthropic, OpenAI) and adoption by leading AI development tools, FAF is becoming foundational infrastructure for the AI development ecosystem.

### 📈 Growth Momentum

- **Rapid adoption** - See live stats on npm
- **Category leader** - First universal AI context standard
- **Enterprise traction** - Infrastructure-level adoption
- **BIG-3 validated** - Tested and endorsed by Google Gemini, Anthropic Claude, OpenAI Codex

### 🏆 Strategic Partnership Opportunities

**Infrastructure Sponsor** - Align your brand with foundational AI developer tooling
**Category Leadership** - Be recognized as supporting the universal AI context standard
**Enterprise Integration** - Deep integrations with your platform

**Target sponsors:** Companies building AI development tools, deployment platforms, terminals, IDEs, and AI infrastructure.

**Examples:** Vercel, Warp, Anthropic, Cursor, Windsurf, n8n, and other AI-first platforms.

### 🤝 Let's Talk

**[💼 Enterprise Sponsorship Inquiry](https://github.com/Wolfe-Jam/faf-cli/discussions)** - Strategic partnerships for category-defining infrastructure

FAF CLI is **FREE FOREVER** and open source (MIT). Sponsorship accelerates development, expands integrations, and positions your brand alongside the future of AI development.

---

## 👤 Author

**James Wolfe (Wolfe-Jam)**
Creator, .faf Format
ORCID: [0009-0007-0801-3841](https://orcid.org/0009-0007-0801-3841)

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

---

## 🏁 The Race Track is Open

**Category-defining. Format-first development. Foundational.**

AI's biggest issue addressed head-on. Agnostic. Universal.

AI has Claude/tool.md - they need `.faf` to be Universal.

AI needed a README, its package.json - **it got one.**

### **SPEED. SECURITY. UNIVERSAL. FREE. OPEN-SOURCE.**

Copy cats? Why bother.

**Build your best, let's RACE 🏁**

**See you at the Track! 🏎️⚡️**

---

<div align="center">

## 🏁 Powered by Anthropic-Approved MCP Claude Desktop code

Developed for you, with love, for free.

The new **project.faf** file provides persistent project context session after session. It optimizes AI, which in-turn reduces errors, and improves code, safely, securely and swiftly.

We hope you reap the benefits of using the **project.faf** format and write some beautiful apps!

Made with 🧡 by **[wolfejam](https://github.com/Wolfe-Jam)**

**100% Open Source** • **Zero Faff™** • **F1-Inspired Engineering**

[⭐ Star on GitHub](https://github.com/Wolfe-Jam/faf-cli) • [📦 View on NPM](https://www.npmjs.com/package/faf-cli) • [💬 Join Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)

---

The CLI is **FREE FOR ALL DEVS**.

Love it? **TURBO** for advanced features, ready for once you've kicked the tires! 😽💨

</div>
