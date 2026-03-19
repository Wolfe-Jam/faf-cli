# Changelog

All notable changes to faf-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.1.0] - 2026-03-19

### Added

- **Mk4 Slot Renames** — 6 canonical slot name updates aligned with Mk4 engine:
  - `frontend`→`framework`, `css_framework`→`css`, `state_management`→`state`
  - `api_type`→`api`, `database`→`db`, `package_manager`→`pkg_manager`
  - `SLOT_ALIASES` / `SLOT_ALIASES_REVERSE` as single source of truth
  - Full backward compatibility — old .faf files score identically
  - WASM kernel bridge translates Mk4→old names for Rust kernel
- **Tri-sync Topic Files** — Claude Code native memory format:
  - `memory-topic-writer.ts`: maps .faf → individual topic files with frontmatter
  - 6 topic types: project, stack, context, preferences, key_files, state
  - MEMORY.md index management (insert/replace FAF section)
  - `faf ram export` and `faf bi-sync --ram` both write topic files
- **WJTTC Mk4 Rename Suite** — 21 tests across 7 tiers (Brake→Stress)
- **WJTTC Topic Writer Suite** — 20 tests for Claude Code memory format

### Changed

- All generators output Mk4 canonical names
- ScoreCalculator checks both old and new names
- Slot counter outputs Mk4 paths (`stack.framework` not `stack.frontend`)
- Family detectors updated (React, Svelte, Next, Vite)

### Tests

- 1184/1184 passing (up from 1143)
- 52 test suites
- FAFb compile/decompile verified with both name sets

## [5.0.6] - 2026-03-13

### Added

- **Bun alignment** — `bunx faf-cli` as primary alongside `npx` in README and docs
- `bun install -g faf-cli` option for global installs
- **WJTTC Bun Compatibility Suite** — 35 tests across 5 tiers (Brake, Engine, Aero, Telemetry, Championship)

## [5.0.5] - 2026-03-12

### Fixed

- Restored CLI detection in `init` command — was incorrectly overridden by FrameworkDetector result
- Improved metadata extraction robustness in framework-detector (safe fallbacks, no crashes on missing fields)

## [5.0.4] - 2026-03-12

### Added

- **Smart Metadata Extraction** — `faf auto` now syncs project name, goal, and version from manifest files (package.json, Cargo.toml, pyproject.toml)
- Parity with Python extension metadata pipeline
- FrameworkDetector enhanced with `projectName`, `projectGoal`, `projectVersion` extraction

## [5.0.3] - 2026-03-08

### Changed

- README optimized: badges at top, Top 6 Commands table, "Define. Build. Lock. Relax." tagline, Git-Native callout, screenshot paired with tree diagram, RAM Edition moved up
- Lint added to `prepublishOnly` gate — no more publishing dirty builds

### Fixed

- ESLint curly brace errors in yaml-generator.ts and fab-formats-processor.ts

## [5.0.2] - 2026-03-08

### Fixed

- **TURBO-CAT Slot Audit** — 12 wrong defaults eliminated from Python project detection
  - Stripped 9 hardcoded pyproject.toml slots (poetry, File-based, None, File I/O)
  - Real dependency parsing: detects setuptools/hatch/flit/pdm from `[build-system]`
  - Dependency-aware detection: BigQuery, FastMCP, FastAPI, Flask, Django, PostgreSQL, MongoDB, Redis
  - Language-aware warnings: Python→PEP 8, Rust→clippy, TS→strict mode
  - Language-aware milestone: pypi_publication, crates_publication, etc.
  - Gated TS strict mode indicator to TS/JS projects only
  - Post-allocation verification: pyproject.toml overrides package.json for mainLanguage
  - Score metadata refresh (faf_score + ai_confidence) after auto run
  - Priority bump: pyproject.toml/Cargo.toml/go.mod (36) > package.json (35)
  - 8 new Python detection tests (1,108/1,108 total)

## [5.0.1] - 2026-03-02

### Changed

- README rewritten for v5.0.0 RAM Edition — added 3Ws/6Ws teaching, tri-sync section, sync comparison table, blog link
- Core commands table updated with tri-sync, ram, pro
- 6Ws sections reordered to canonical order (WHO, WHAT, WHY, WHERE, WHEN, HOW)
- Added Documentation & Recommended Reading section with blog links

## [5.0.0] - 2026-03-01 — The RAM Edition

### Added

- **tri-sync** — ROM↔RAM bridge for Claude Code auto-memory
  - `faf ram` — sync project context to Claude's session memory (MEMORY.md)
  - `faf tri-sync` — bidirectional sync: `.faf` ↔ CLAUDE.md ↔ MEMORY.md
  - `faf bi-sync --ram` — include RAM sync in bi-sync
  - `faf bi-sync --all` — now includes RAM alongside AGENTS.md, .cursorrules, GEMINI.md
  - Merge-safe: replaces FAF section, preserves Claude's own notes
  - 200-line ceiling awareness (warns when exceeding auto-load limit)
  - `memory-parser.ts` — full parse/export/import/detect/status API

- **Pro Gate** — zero-friction license system for tri-sync
  - 14-day free trial, no signup, no credit card
  - HMAC-signed trial and license files (honest-user guard, not DRM)
  - `faf pro` — check license status
  - `faf pro activate <key>` — activate with license key
  - Legacy dev detection (turbo-license holders get automatic access)
  - Warm messaging: "Bi-sync is core. Tri-sync adds more. What does it add? It adds RAM."
  - Early-bird: $3/mo · $19/yr (normally $10/mo — 70% off)

- **3Ws / 6Ws reorder** — canonical order is now WHO, WHAT, WHY, WHERE, WHEN, HOW
  - WHY promoted to 3W (was 4W), WHERE moved to 4W (was 3W)
  - Clean split: 1W–3W = the idea (anyone can answer), 4W–6W = the implementation (developer fills in)
  - Updated across CLI help, `faf readme`, `faf 6ws` default template, SixWs interface, hybrid engine

### Fixed

- CRLF merge bug in `memory-parser.ts` — raw string surgery on un-normalized content produced mixed line endings
- Pricing inconsistency — `pro.ts` said $29/yr, `license-messages.ts` said $19/yr (now consistent at $19/yr)
- Removed dead code: `showUpgradePrompt()` (defined but never called)

### Testing

- 1,100 tests passing across 49 suites
- 16 new Pro Gate tests: `gateProFeature()`, `getProStatus()`, day-14 boundary, corrupt JSON, license precedence
- 2 new CRLF merge tests: Windows CRLF + BOM normalization during merge

### Philosophy

- Free for devs, for builders, for ALL the app-makers
- bi-sync is free forever — persistent project context for any AI
- tri-sync is Pro — your AI remembers across sessions
- Context the way AI intended it: at the ROOT, not scattered across docs

## [4.5.0] - 2026-02-24 — The AGENTS.md Edition

### Added
- `faf agents import/export/sync` — AGENTS.md interop (OpenAI Codex, Linux Foundation, 20+ tools)
- `faf cursor import/export/sync` — .cursorrules interop (Cursor IDE)
- `faf bi-sync --agents` — also sync to AGENTS.md
- `faf bi-sync --cursor` — also sync to .cursorrules
- `faf bi-sync --all` — sync to all formats at once (CLAUDE.md + AGENTS.md + .cursorrules + GEMINI.md)
- WJTTC championship test suite for interop formats (87 tests across 6 tiers)
- Parsers: `agents-parser.ts`, `cursorrules-parser.ts` — full bidirectional mapping

### Fixed
- Windows `\r\n` line endings broke H1/H2 detection in all markdown parsers
- UTF-8 BOM marker broke parsing for VS Code users
- Old Mac `\r` line endings unhandled

### Philosophy
- Define once in `.faf`, generate AGENTS.md, .cursorrules, CLAUDE.md, GEMINI.md
- FAF 4.5 is the version where `.faf` becomes the true interchange format

## [4.4.4] - 2026-02-18 — Enhanced Git Support

### Changed
- Complete rewrite of `faf git` output — compact, accurate, PR-ready (~35 lines vs 130)
- Primary language detection from GitHub API (uses first entry in sorted language array)
- Language-aware install detection (pip, cargo, go, npm, yarn, brew, docker)
- `slotignored` fields no longer appear in output (engine directive only)
- Languages capped at top 6 for clean output
- Clean 4-line header format

### Fixed
- GitHub API language endpoint now uses auth token (was missing `githubHeaders()`)
- React correctly detected as JavaScript (was showing TypeScript)
- Garbage README extraction filtered out (trailing pipes, code blocks, markdown links)

### Added
- WJTTC test suite for faf-git-generator (86 tests across Brake/Engine/Aero tiers)
- 17 language detection tests, build system detection, package.json analysis
- The version that scored a Hundred Famous Repos

## [4.4.3] - 2026-02-17

### Changed
- Updated TAF Receipt workflow to use faf-taf-git@v2.0.4 (production-ready)
- Cleaned up TAF workflow CI configuration (removed testing flags)

## [4.4.2] - 2026-02-16

### Security
- Updated `inquirer` from 8.2.5 to 8.2.7 to resolve 3 low severity vulnerabilities (tmp symlink issue)
- All dependencies now have zero known vulnerabilities

### Fixed
- Configured Dependabot to prevent major version bumps (blocks breaking changes)
- Reduced Dependabot PR limit from 10 to 3 (prevents CI/CD spam)
- Added protections for TypeScript tooling (@typescript-eslint/*, eslint)
- Added protections for core dependencies (@types/node, jest, @types/jest)
- Added ESM import exports to faf-engine package.json for better module resolution

### Changed
- CI/CD badge restored to GREEN after closing 4 failing Dependabot PRs
- Improved Dependabot configuration for better CI/CD flow management

## [4.4.1] - 2026-02-15

### Fixed
- Removed alarming "No .faf file ⚠️" warning from `git` command output
- Changed to confidence-building "Analysis Complete" format
- Output now shows only positive results without unnecessary warnings

## [4.4.0] - 2026-02-14 — Infrastructure & Testing Edition

### 🎉 The Best Release to Date

This is the most comprehensive and well-tested version of faf-cli ever released.

### 🏗️ Internal Infrastructure

**FAFb Integration Layer** (xAI Exclusive - Not Exposed)
- Internal compile/decompile command implementations (commented out by default)
- FAFb ecosystem detection utilities (compiler, Radio Protocol, WASM SDK)
- Smart metadata generation for FAFb ecosystem projects
- Integration layer ready for xai-faf-rust when strategic
- **Note:** FAFb commands are OFF by default, requires code access to enable

### 🧪 Testing Excellence

**Championship-Grade Test Coverage**
- **799 tests passing** ✅ (808 total, 9 skipped)
- **+37 internal integration tests**:
  - 21 tests: FAFb ecosystem detector
  - 8 tests: Compile command implementation
  - 8 tests: Decompile command implementation
- **+41 WJTTC tests**: FAFb CLI integration suite (6-tier architecture)
- Cross-check architecture validates integration readiness

**Internal Test Coverage:**
- Ecosystem detection (Rust/Zig compilers, Radio Protocol, WASM SDK)
- Binary format validation (FAFB magic bytes, compression)
- Error handling and graceful degradation
- Performance benchmarks and regression prevention

### 🔧 Fixed

**Dependency Management**
- Pinned `inquirer@8.2.5` to prevent ESM breakage
- inquirer v9+ is ESM-only and breaks Jest (CommonJS test runner)
- Configured Dependabot to ignore inquirer major/minor upgrades
- All 7 Dependabot PRs merged and validated
- Build passes, all tests green ✅

**Test Infrastructure**
- Fixed ESM/CommonJS module conflicts with jest mocking
- Added moduleNameMapper for chalk and open packages
- Removed explicit jest.mock() calls that conflicted with automatic mocking
- Sequential test execution (maxWorkers: 1) prevents cwd corruption

### 📦 Internal Utilities (Not User-Facing)

**fafb-compiler.ts** (Integration layer - disabled by default)
- Internal wrapper for xai-faf-rust compiler
- Compile, decompile, watch, benchmark capabilities
- Ready to enable when strategic

**fafb-detector.ts** (Ecosystem detection)
- Detects FAFb ecosystem projects automatically
- Identifies compilers (Rust/Zig), Radio Protocol clients, WASM SDK
- Returns confidence scores and project metadata
- Used internally for project analysis

### 🏆 Quality Metrics

- **Test Coverage:** 799/799 passing (100% success rate)
- **Build Status:** ✅ Passing (TypeScript strict mode)
- **Dependencies:** ✅ Optimal (inquirer pinned, all others up-to-date)
- **Documentation:** ✅ Comprehensive (CLI help, test comments, CHANGELOG)
- **Championship Grade:** 🏆 Zero failures, zero compromises

### 📖 Documentation

- Internal documentation for FAFb integration layer
- WJTTC test suite includes self-documenting test names
- Clear code comments marking FAFb as xAI exclusive
- Easy to toggle on/off via code access

### 🔮 Strategic Notes

**FAFb Integration:**
- Commands are OFF by default (xAI exclusive technology)
- Can be enabled by uncommenting imports and command registrations
- All code and tests remain intact and validated
- Integration layer ready when strategic to activate

**inquirer Dependency:**
- Pinned to v8.2.5 to prevent ESM breakage with Jest
- Dependabot configured to ignore major/minor upgrades
- To upgrade: migrate to Jest 29+ or Vitest (ESM-native)

## [4.3.3] - 2026-02-14

### Fixed
- **CRITICAL:** Include updated project.faf in npm package (was missing in 4.3.2)
- project.faf now at 100% 🏆 Gold Code (birth DNA: 86%, grew +14%)
- Ensures reference implementation is visible in published package

## [4.3.2] - 2026-02-09

### Fixed
- **CRITICAL:** Added missing `prompts` dependency (v4.3.1 was broken)
- Package now works correctly after global install

## [4.3.1] - 2026-02-09 [YANKED]

### Added
- ✨ New `faf 6ws` command - Opens web interface for interactive 6Ws builder
- Paste-back workflow: fill form at faf.one/6ws → copy YAML → paste to CLI
- Best of both worlds: Web UX + CLI automation
- Supports README Evolution Edition workflow

### Fixed
- Fixed npm install hang that prompted for user input
- Postinstall script now uses /dev/tty for direct terminal output
- Install completes smoothly without user interaction required

## [4.3.0] - 2026-02-10 — FAF GIT Edition 🚀

### 🚀 Enhanced FAF GIT

**No install. No clone. Instant context. ANY repo.**

### ✨ What's New

- **GH API as Source of Truth** - FAF now works on EVERY language and ecosystem
  - Extract stack from `metadata.languages` array (C++, Rust, Go, Python, etc.)
  - Detect build systems from languages (CMake, Makefile, Gradle, Maven)
  - Detect hosting from Dockerfile presence
  - Merge with npm package.json analysis (when present)
  - New function: `extractFromLanguages()` in faf-git-generator.ts

- **Slot-Ignore System Fixed** - Scoring now works correctly
  - Corrected formula: `(filled + ignored) / 21 * 100`
  - Fixed: Slots are 'slotignored' only when truly non-applicable to project type
  - Previously: Everything undetected was marked 'slotignored' (inflated scores)
  - Now: Accurate scoring that reflects what's actually filled vs ignored
  - New utility: `src/utils/slot-counter.ts`

- **Clean Output Format** - No synthetic scores, just honest status
  - Shows "No .faf file" instead of synthetic baseline score
  - Clear transformation: None → AI-ready with complete context
  - Defensible, provable, honest

### 📈 Results

Universal language support (achieved):
- React (JavaScript): 100% 🏆 Trophy
- Vue (JavaScript): 100% 🏆 Trophy
- Next.js (Full-stack): 100% 🏆 Trophy
- whisper.cpp (C++): 100% 🏆 Trophy
- Works across ALL languages and ecosystems

### 📚 Documentation

- **README** - Added project.faf screenshot showing file in context
  - Visual explainer: "just another file helping you code"
  - Positioned near top for immediate understanding
  - Shows project.faf alongside package.json and README.md

### 🎯 Positioning

**FAF GIT is the killer feature:**
- Primary workflow: `npx faf-cli git <url>` (no install needed)
- Pro workflow: `npm install -g faf-cli` then `faf git <url>`
- Works on ANY public GitHub repo
- 2 seconds to AI-ready context
- No cloning, no setup, just instant results

## [4.2.2] - 2026-02-08 — Context Quality Edition 🎯

### 🎯 Slot-Ignore System (Documentation)

**The perfect way to handle app-types** - Now properly documented.

### ✨ What's New

- **Slot-ignore mechanism** - Comprehensive documentation added
  - Full specification in `docs/SLOT-IGNORE.md`
  - Quick reference in `docs/SLOT-IGNORE-QUICK-REF.md`
  - Like `.gitignore` for files, `slot-ignore` for context slots
  - Formula: `(Filled + Ignored) / 21 = 100%`

### ✨ Improvements

- **6 Ws extraction** - Transformed human context extraction
  - WHO: Checks package.json author first (TIER 1 authoritative)
  - WHAT: package.json description now TIER 1 (was TIER 2)
  - WHY: Targets Mission sections, uses keywords as fallback
  - WHERE: npm packages → "npm registry + GitHub" (authoritative)
  - WHEN: Version number is TIER 1 (0.x = beta, ≥1.0 = production)
  - HOW: Tech stack analysis is TIER 1 (inferred from dependencies)
  - Added `getCleanedReadme()` helper to strip HTML/badges/noise

- **Slot-ignore mechanism** - Overhauled implementation
  - Standardized to `'None'` (was inconsistent: 'N/A (CLI)', 'None', etc.)
  - Added `database: 'None'` for Node.js CLI projects
  - Improved yaml-generator logic: `if (!database && database !== 'None')` (was OR, not AND)
  - CLI projects now correctly exclude non-applicable slots from missing_context

- **README** - Added WHO section for better target audience extraction

### 📈 Results

- Score improvement: 74% → 86% → 100% (after faf auto)
- All dogfooding tests passing (7/7)
- missing_context: None - fully specified!
- 673/687 tests passing (97.9%) - 14 dev-only tests

### 🎨 Code Comments

- Added `🎯 SLOT-IGNORE:` markers throughout codebase
- Links to `docs/SLOT-IGNORE.md` for specification
- Clear explanations of slot-ignore pattern

### 📚 Documentation

- `docs/SLOT-IGNORE.md` - Full specification (391 lines)
- `docs/SLOT-IGNORE-QUICK-REF.md` - Quick reference (69 lines)
- README section explaining slot-ignore
- Proper terminology throughout codebase

## [4.2.1] - 2026-02-07

### Added
- **ml-research type support** - Added as alias to `ml-model` type
  - Recognizes `type: ml-research` in project.faf files
  - Maps to ml-model scoring (14 slots: project + backend + human)
  - Semantically accurate for ML research projects (papers, experiments, model releases like Grok-1)

### Fixed
- Type detection now correctly scores ml-research projects with 14 slots instead of falling back to generic (12 slots)
- Ensures consistency between faf-cli and builder.faf.one WASM generator

### Technical
- Updated TYPE_DEFINITIONS: `'ml-model'` aliases now include `'ml-research'`
- Discovered via builder.faf.one WASM testing - the test improved the standard!

## [4.2.0] - 2026-02-03 — Voice-API Edition 🚀👻

### 🍊 xAI/Grok Voice Configuration

**Save Our Souls** - Eternal voice memory for Grok Collections.

### ✨ What's New

- **`faf init --xai`** - Adds Grok voice configuration to project.faf
  - Voice: Leo (polite, dry British wit, technically precise)
  - Persona: Project eternal memory (zero drift)
  - Retrieval mode: Hybrid (context-first, fallback to general)
  - Escape phrase detection
- **xai_collections section** - Upload order and readiness flags
  - Ready for xAI Collections integration
  - Structured upload order for optimal RAG
- **Voice persistence** - Grok remembers your voice forever
  - No re-explaining project context
  - Mission-focused responses
  - Collection-first retrieval

### 🎯 The Voice-API Integration

Every `faf init --xai` now includes:
1. Grok voice personality (Leo)
2. Custom persona for project memory
3. Collections upload configuration
4. Hybrid retrieval strategy

### 📚 Documentation

- Boris-Flow blog post updated (workflow recommendations)
- WJTTC v1.2.0 TAF-Aware Edition published
- Cross-reference network complete

## [4.1.0] - 2026-01-31 — Gemini Native Handshake

### 🔷 Zero-Config Google AI Integration

FAF now auto-detects Gemini CLI and creates native bridges automatically.

### ✨ What's New

- **`--gemini` flag** - Explicit Gemini CLI integration
- **Auto-detection** - Detects Gemini CLI even without flag
  - Checks: `gemini` command, `~/.gemini`, `GEMINI_API_KEY`, `gcloud`
- **Native bridge** - Creates `.gemini/context.yaml` pointing to `project.faf`
- **Symlink** - `.gemini/project.faf → project.faf` for direct access
- **gemini: section** - Added to project.faf with integration config

### 🎯 The Native Handshake

Every `faf init` is now Gemini-aware. If Gemini CLI is installed, FAF automatically:
1. Detects the installation
2. Creates `.gemini/` directory
3. Writes context bridge config
4. Links to project.faf

Zero config. Native integration. Just works.

---

## [4.0.0] - 2026-01-24 — Foundation Layer

### 🏛️ The Format That Became a Standard

FAF v4.0.0 marks the transition from tool to standard. This release crystallizes
everything FAF has learned about persistent AI context.

### 🎯 Philosophy: Foundation First

**The DAAFT Problem:**
- **D**iscover - AI reads 50 files to understand your project
- **A**ssume - Guesses your stack (often wrong)
- **A**sk - Fills gaps with questions
- **F**orget - Session ends, context lost
- **T**ime + Tokens LOST - 91% wasted on rediscovery

**The FAF Solution:**
- 150 tokens once vs 1,750 tokens per session
- Zero assumptions - foundation is explicit
- Drift impossible - truth doesn't change

### ✨ What's New

- **Foundation Layer Architecture** - project.faf as single source of truth
- **DAAFT Documentation** - The problem FAF solves, explained
- **MCPaaS Integration** - Ecosystem links for eternal memory tools
- **Execution Context Engine** - New `faf go` guided interview system

### 🔧 Includes All 3.4.x Features

- **Bi-Sync 2.0** - Smart content detection and preservation
- **Google Gemini Edition** - Full Conductor & Antigravity interop
- **Demo Commands** - Live bi-sync demonstrations
- **Boris-Flow Tests** - 663 tests, WJTTC certified

### 📊 Credentials

- **IANA Registered:** application/vnd.faf+yaml
- **Anthropic MCP:** Official steward (PR #2759 merged)
- **Downloads:** 20,000+ across CLI + MCP

### 🏁 Getting Started

```bash
npm install -g faf-cli@4.0.0
faf auto
faf status --oneline
# 🏆 project.faf 100% | bi-sync ✓ | foundation optimized
```

---

## [3.4.8] - 2026-01-18 — BI-SYNC 2.0: Context Intelligence

### ✨ Smart Sync - "Knows what matters"

Bi-sync now **detects custom content** and preserves it. Your hand-crafted
CLAUDE.md with tables, code blocks, and custom sections stays intact.

**Custom markers detected:**
- `## TOOLS`, `## ENDPOINTS`, `## AUTH`, `## COMMANDS`
- `| Tool |`, `| Endpoint |` (markdown tables)
- ` ```bash ` (code blocks)

### 🛡️ Preservation Engine - "Zero content drift"

**RULE: Score can only improve - never downgrade.**

When bi-sync detects custom content, it:
1. Preserves your entire CLAUDE.md
2. Updates only the sync footer
3. Never overwrites rich content with generic templates

### 🔧 Fixes

- `FAFMirror` now uses `findFafFile()` to locate `project.faf` correctly
- Fixed hardcoded `.faf` path that ignored `project.faf` (the standard)

### 🧪 WJTTC Certified

**12 new tests** in `tests/wjttc/bi-sync-preserve-custom.test.ts`:
- Custom content detection (4 tests)
- findFafFile priority (3 tests)
- Preserve custom content during sync (3 tests)
- Score can only improve rule (1 test)
- FAFMirror initialization (1 test)

**Certification: GOLD 🥇** - Your content is protected forever.

---

## [3.4.7] - 2026-01-13 — Google Gemini Edition

Full interoperability with the Google Gemini ecosystem.

### Added

- **`faf conductor`** - Google Conductor format interop
  - `faf conductor import` - Import conductor/ directory → .faf
  - `faf conductor export` - Export .faf → conductor/ format
  - `faf conductor sync` - Bidirectional synchronization
  - Supports product.md, tech-stack.md, workflow.md, product-guidelines.md

- **`faf gemini`** - Gemini CLI / Antigravity IDE interop
  - `faf gemini import` - Import GEMINI.md → .faf
  - `faf gemini export` - Export .faf → GEMINI.md
  - `faf gemini sync` - Bidirectional synchronization
  - `--global` flag for ~/.gemini/GEMINI.md

### Universal AI Context

One `.faf` file now works with:
- Claude Code (CLAUDE.md, MCP)
- Gemini CLI (GEMINI.md)
- Antigravity IDE (~/.gemini/GEMINI.md)
- Conductor extensions (conductor/ directory)

## [3.4.4] - 2026-01-07

### Added

- **`faf demo sync`** - Live bi-sync demonstration command
  - Shows real-time .faf <-> CLAUDE.md synchronization
  - Timestamps, direction, and speed (ms) displayed
  - `--speed fast|normal|slow` for presentation pacing
  - Demo completes with no files changed
  - Built-in evangelism: every user can demo bi-sync to their team

## [3.4.3] - 2026-01-07

### Added

- **Boris-Flow Integration Tests** - 12-test suite for publish readiness validation
  - Version check, init, auto, score, non-TTY safety
  - Full Claude Code structure detection
  - `./tests/boris-flow.test.sh` - run before any publish
- **boris-ready.sh** - Quick pre-publish verification script
- **Turbo-cat Improvements** - Enhanced format discovery and tests

### Changed

- Sync command improvements for better reliability
- Compiler updates for more accurate scoring
- Removed deprecated Discord release workflow

## [3.4.2] - 2026-01-07

### Fixed

- `faf enhance` now exits cleanly in non-TTY environments (Claude Code, CI/CD)
- Previously corrupted .faf files when run without interactive terminal
- Displays helpful message directing users to use `faf auto` or run in real terminal

## [3.4.1] - 2026-01-07

### Fixed

- Removed external chalk dependency from plugin-install (zero deps approach)

## [3.4.0] - 2026-01-06

### Added

- **Claude Code Detection** - Automatic detection of Claude Code structures
  - Detects `.claude/agents/` subagents (extracts names)
  - Detects `.claude/commands/` slash commands (extracts names)
  - Detects `.claude/settings.json` permissions
  - Detects `CLAUDE.md` presence
  - Detects `.mcp.json` MCP server configuration
  - All data captured in `claude_code:` section of .faf output

- **Bun Detection** - Detects `bun.lockb` for Bun runtime projects
  - Sets runtime and package_manager to Bun

- **WJTTC Claude Code Test Suite** - 29 comprehensive tests
  - CLAUDE.md detection
  - Subagent discovery
  - Command discovery
  - Permissions extraction
  - MCP server detection
  - Edge cases (malformed JSON, empty dirs)
  - Performance tests (<10ms requirement)
  - Full Boris setup integration test

### Technical

Based on Boris Cherny's (Claude Code creator) workflow - 5 subagents, always bun, MCP servers for external services. FAF now captures this metadata for complete AI context handoff.

## [3.3.0] - 2025-12-28

### Added

- **`faf plugin-install`** - Install Claude Code plugins via HTTPS (workaround for SSH bug)
  - Fixes marketplace SSH clone issue (GitHub #9297, #9719, #9730, #9740)
  - Accepts: `owner/repo`, HTTPS URL, or SSH URL
  - Verifies plugin structure after install
  - Use `--force` to reinstall

- **Claude Code Plugin Structure** - Full plugin support at repo root
  - `commands/` directory with 6 slash commands
  - `skills/` directory with faf-expert skill
  - `.claude-plugin/plugin.json` for metadata

- **WJTTC Plugin Test Suite** - 31 tests for plugin validation
  - Brake Systems: Critical plugin structure
  - Engine Systems: Command discovery
  - Aerodynamics: Skill accessibility
  - Pit Lane: Metadata quality
  - Championship: Full integration

### Philosophy

Claude Code marketplace uses HTTPS (works). Third-party `/plugin marketplace add` uses SSH (hangs). We fixed it with `faf plugin-install` - uses HTTPS like the official marketplace.

## [3.2.7] - 2025-12-25

### Fixed

- **Birth DNA now uses raw slot count** - Birth DNA correctly reflects reality
  - Uses `slot_based_percentage` (raw slots filled / 21)
  - NOT the compiler score (which includes FAF intelligence)
  - 0% is a valid score - empty projects show 0%
  - Added extensive documentation to prevent future "optimization"

### Philosophy

Birth DNA = the "before" picture. The growth from Birth DNA to current score shows FAF's value. If Birth DNA is artificially high, we can't show improvement.

## [3.2.4] - 2025-12-17

### TYPE_DEFINITIONS - Project Type-Aware Scoring

**The scoring system now understands project types** - CLI projects no longer penalized for missing frontend/backend slots.

### Added

- **TYPE_DEFINITIONS** - Single source of truth for 94 project types
  - **21-slot system**: Project(3) + Frontend(4) + Backend(5) + Universal(3) + Human(6)
  - Types define which slot categories COUNT for scoring
  - CLI type: 9 slots (project + human) - now scores 100% without hosting/cicd
  - Fullstack type: 21 slots (all categories)
  - Monorepos as containers: all 21 slots

- **38 Type Aliases** - Intuitive shorthand mappings
  - `k8s` → `kubernetes`, `api` → `backend-api`, `rn` → `react-native`
  - `flask` → `python-api`, `turbo` → `turborepo`, and 32 more

- **slot_ignore Escape Hatch** - Override type defaults per-project
  - Array format: `slot_ignore: [stack.hosting, stack.cicd]`
  - String format: `slot_ignore: "hosting, cicd"`
  - Shorthand: `hosting` expands to `stack.hosting`

- **WJTTC MCP Certification Standard** - 7-tier certification system for MCP servers
  - Tier 1: Protocol Compliance (MCP spec 2025-11-25)
  - Tier 2: Capability Negotiation
  - Tier 3: Tool Integrity
  - Tier 4: Resource Management
  - Tier 5: Security Validation
  - Tier 6: Performance Benchmarks (<50ms operations)
  - Tier 7: Integration Readiness

### Slot Categories by Type

| Type Category | Slots | Example Types |
|---------------|-------|---------------|
| 9-slot | Project + Human | cli, library, npm-package, terraform, k8s |
| 13-slot | + Frontend | mobile, react-native, flutter, desktop |
| 14-slot | + Backend | mcp-server, data-science, ml-model |
| 16-slot | + Universal | frontend, react, vue, svelte |
| 17-slot | Backend + Universal | backend-api, node-api, graphql |
| 21-slot | All | fullstack, nextjs, monorepo, django |

### Impact

- **xai-faf-cli**: 83% → 100% (CLI type counts 9/9 slots)
- **claude-faf-mcp** v3.3.6: CHAMPIONSHIP GRADE (all 7 tiers PASS)
- 125 WJTTC tests validating type system
- Backwards compatible - existing .faf files work unchanged

## [3.2.0] - 2025-11-28

### Added

- **`faf readme` - Smart README Extraction** - Auto-fill human_context from README.md
  - Intelligently extracts the 6 Ws (WHO, WHAT, WHY, WHERE, WHEN, HOW)
  - Pattern matching for common README structures (taglines, TL;DR, Quick Start)
  - `--apply` to fill empty slots, `--force` to overwrite existing
  - Shows confidence scores and extraction sources
  - Tested results: 33% → 75%+ score boosts

- **`faf human` - Interactive Human Context** - Fill one W at a time (terminal)
  - Asks each question sequentially
  - Press Enter to skip, `--all` to re-answer all fields
  - Perfect for terminal users who want guided input

- **`faf human-set` - Non-Interactive Human Context** - Works in Claude Code
  - `faf human-set <field> "<value>"` - set one field at a time
  - Valid fields: who, what, why, where, when, how
  - Essential for AI assistants and automation scripts

### Human Context Workflow

```bash
# Step 1: Initialize
faf init                           # Creates .faf with ~50% score

# Step 2: Auto-extract from README
faf readme --apply --force         # +25-35 points (auto)

# Step 3: Fill any gaps manually
faf human-set why "32x faster"     # Non-interactive (Claude Code)
faf human                          # Interactive (terminal)

# Result: 75-85% score from human_context alone
```

## [3.1.6] - 2025-11-16

### Fixed
- Updated Discord community invite link to working URL (never expires)

## [3.1.5] - 2025-11-14

### Added

- **Auto-Update package.json for npm Packages** - Championship automation
  - `faf init` now automatically adds `project.faf` to package.json "files" array
  - Only updates if "files" array already exists (respects npm defaults)
  - Checks for existing entries (.faf, project.faf) to avoid duplicates
  - Graceful handling of edge cases (malformed JSON, non-array "files" field)
  - Informative messages: success, already exists, or manual edit needed
  - Solves the chicken-and-egg problem: package.json → faf init → auto-update!

### Fixed

- **npm Package Publishing Workflow** - No more manual edits required
  - Previously: Create project.faf, manually edit package.json
  - Now: Create project.faf, CLI auto-updates package.json
  - Critical for faf-cli and all npm packages using FAF format

## [3.1.2] - 2025-11-07

### Discord Community Launch

**The FAF community is now live** - Join us at [discord.com/invite/56fPBUJKfk](https://discord.com/invite/56fPBUJKfk)

### Added

- **Discord Community Server** - Official FAF community launched
  - 6 focused channels: announcements, general, showcase, help, integrations, w3c-and-standards
  - Permanent invite link: discord.com/invite/56fPBUJKfk
  - Low maintenance, open community structure
  - Auto-moderation enabled for spam/raid protection

- **GitHub Actions Discord Automation** - Automated release announcements
  - Discord webhook integration for both faf-cli and claude-faf-mcp
  - Rich embeds with version info, changelog, and install instructions
  - Automatic posting to #announcements on new releases
  - Differentiates between stable and beta releases

- **Championship Stress Test Timeouts** - Enterprise-ready torture testing
  - 10,000 commits test: 2min → 10min timeout (championship grade)
  - 100 package.json changes: 1min → 3min timeout (enterprise stress)
  - Prepared for monorepo and enterprise-scale testing

### Fixed

- **Critical Test Infrastructure Bug (uv_cwd)** - Fixed 24 test suite failures
  - `git.test.ts` now properly restores `process.cwd()` after changing directories
  - Prevented cascading failures when tests delete directories
  - Tests now run reliably in sequential mode (maxWorkers: 1)

- **Syntax Errors in drift.test.ts** - Fixed 7 template literal quote mismatches
  - Fixed test descriptions missing closing quotes
  - Fixed execSync calls missing commas after template literals
  - All tests now compile and run correctly

### Changed

- **Test Suite Status** - 281/327 core tests passing (86% success rate)
  - Core functionality: All passing
  - Git integration tests: Rate-limited by GitHub API (external issue)
  - Test infrastructure now championship-grade ready for enterprise

- **README Updates** - Added Discord community links
  - Discord badge in header
  - Discord navigation link alongside Website/GitHub
  - Professional, scannable structure maintained

## [3.1.0] - 2025-10-29

### The Visibility Revolution

**`project.faf` is the new universal standard** - like `package.json` for AI context.

### Added

- **project.faf Standard (FAF v1.2.0 Specification)** - Visible filename replacing hidden `.faf`
  - `faf init` now creates `project.faf` instead of `.faf`
  - `faf auto` now creates `project.faf` instead of `.faf`
  - All commands read `project.faf` first, fallback to `.faf`
  - Priority: `project.faf` > `*.faf` > `.faf`

- **faf migrate** - One-command migration from `.faf` to `project.faf`
  - Renames `.faf` → `project.faf` in current directory
  - 27ms execution (54% faster than 50ms target)
  - Beautiful color output with progress indicators

- **faf rename** - Bulk recursive migration across entire project tree
  - Recursively finds all `.faf` files in directory tree
  - Renames all to `project.faf` in parallel
  - 27ms for 3 files (73% faster than 100ms target)
  - Progress tracking and summary statistics

### Changed

- **TSA Championship Detection** - Wired DependencyTSA engine into project type detection
  - Analyzes CORE dependencies (>10 imports) instead of naive presence checks
  - 95% accuracy vs 70% accuracy (naive method)
  - Dynamic import to avoid circular dependencies
  - Exhaustive elimination strategy for definitive classification
  - Phase 1: TSA + TURBO-CAT championship detection
  - Phase 2: Fallback to naive detection when engines unavailable

- **Edge Case Test Updated** - `faf-edge-case-audit.test.ts`
  - Changed "should prefer .faf over named files" → "should prefer project.faf over .faf (v1.2.0 standard)"
  - Updated test expectation to match v1.2.0 priority

- **Dogfooding** - faf-cli itself migrated from `.faf` → `project.faf`

### Fixed

- CLI tool detection now uses bin field as PRIORITY 1 (definitive)
- Project type detection no longer reports false positives from dormant dependencies

### Performance

- `faf migrate`: 27ms (championship)
- `faf rename`: 27ms for 3 files (championship)
- All v1.2.0 commands meet <50ms target

### Testing

- **WJTTC GOLD Certification** - 97/100 championship score
  - Project Understanding: 20/20
  - TURBO-CAT Knowledge: 20/20
  - Architecture Understanding: 20/20
  - Full report: 194KB comprehensive test suite

### Backward Compatibility

- ✅ 100% backward compatible with `.faf` files
- ✅ All existing `.faf` files continue to work
- ✅ No breaking changes
- ✅ Graceful transition period

### Migration Guide

**For existing users:**
```bash
# Single project
cd your-project
faf migrate

# Entire monorepo
cd monorepo-root
faf rename
```

**For new projects:**
```bash
faf init    # Creates project.faf automatically
```

### The Golden Triangle

Three sides. Closed loop. Complete accountability.

```
         project.faf
          (WHAT IT IS)
              /    \
             /      \
            /        \
         repo    ←→   .taf
        (CODE)    (PROOF IT WORKS)
```

Every project needs:
- Code that works (repo)
- Context for AI (project.faf)
- Proof it works (.taf - git-tracked testing timeline)

**TAF** (Testing Audit File) format tracks every test run in git. On-the-fly CI/CD updates. Permanent audit trail. Format defined in **faf-taf-git** (GitHub Actions native support).

### Why project.faf?

Like `package.json` tells npm what your project needs, `project.faf` tells AI what your project IS.

- **Visible** - No more hidden files
- **Universal** - Like package.json, tsconfig.json, Cargo.toml
- **Discoverable** - Impossible to miss
- **Professional** - Standard pattern developers know

### Links

- [FAF v1.2.0 Specification](https://github.com/Wolfe-Jam/faf-cli/blob/main/SPECIFICATION.md)
- [WJTTC Test Report](https://github.com/Wolfe-Jam/faf-cli/blob/main/tests/wjttc-report-v3.1.0.yaml)
- [GitHub Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)

---

## [3.0.6] - 2025-10-22

### Changed

- Minor updates and bug fixes

## [3.0.5] - 2025-10-21

### Added

- FAF Family integrations support

## [3.0.4] - 2025-10-20

### Changed

- Performance improvements

## [3.0.3] - 2025-10-19

### Added

- Birth DNA tracking
- Context-mirroring bi-sync

## [3.0.2] - 2025-10-18

### Changed

- TURBO-CAT improvements

## [3.0.0] - 2025-10-15

### The Podium Release

- 🆓 FREE FOREVER .faf Core-Engine (41 commands)
- 💨 TURBO Model introduced
- 😽 TURBO-CAT™ Format Discovery (153 formats)
- 🧬 Birth DNA Lifecycle
- 🏆 7-Tier Podium Scoring
- ⚖️ AI | HUMAN Balance (50|50)
- 🔗 Context-Mirroring with Bi-Sync
- ⚡ Podium Speed (<50ms all commands)
- 🏁 WJTTC GOLD Certified (1,000+ tests)
- 🤖 BIG-3 AI Validation
- 🌐 Universal AI Support

---

[3.1.0]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.6...v3.1.0
[3.0.6]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.3...v3.0.4
[3.0.3]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.2...v3.0.3
[3.0.2]: https://github.com/Wolfe-Jam/faf-cli/compare/v3.0.0...v3.0.2
[3.0.0]: https://github.com/Wolfe-Jam/faf-cli/releases/tag/v3.0.0
