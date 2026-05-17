<!-- faf: faf-cli | TypeScript | cli | CLI for the .faf format — IANA-registered AI context that versions with your code -->
<!-- faf: doc=readme | canonical=project.faf | score=100 | family=FAF -->

<div style="display: flex; align-items: center; gap: 12px;">
  <img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="40" />
  <div>
    <h1 style="margin: 0; color: #000000;">faf-cli v6.7</h1>
    <p style="margin: 2px 0 0 0; font-size: 0.85em; letter-spacing: 0.12em; opacity: 0.7; text-transform: uppercase;"><strong>The HTML Edition</strong></p>
    <p style="margin: 6px 0 0 0;"><strong>Persistent Project Context for AI.</strong></p>
    <p style="margin: 0;"><strong>Define once. Run anywhere.</strong></p>
  </div>
</div>

**FAF defines. MD instructs. AI codes.**

[![FAF](https://mcpaas.live/badge/Wolfe-Jam/faf-cli.svg)](https://builder.faf.one)
[![TAF](./badge.svg)](https://github.com/Wolfe-Jam/faf-taf-git)
[![CI](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml)
[![NPM Downloads](https://img.shields.io/npm/dt/faf-cli?label=total%20downloads&color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![npm version](https://img.shields.io/npm/v/faf-cli?color=00CCFF)](https://www.npmjs.com/package/faf-cli)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![Website](https://img.shields.io/badge/Website-faf.one-orange)](https://faf.one)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Bun](https://img.shields.io/badge/Built_with-Bun-f9f1e1?logo=bun)](https://bun.sh)
[![project.faf](https://img.shields.io/badge/project.faf-inside-00D4D4)](https://github.com/Wolfe-Jam/faf)

```
project/
├── package.json     ← npm reads this
├── project.faf      ← AI reads this
├── README.md        ← humans read this
└── src/
```

> **Every building requires a foundation. FAF is AI's foundational layer.**
>
> You have a `package.json`. AI needs you to add a `project.faf`. Done.

**Git-Native.** `project.faf` versions with your code — every clone, every fork, every checkout gets full AI context. No setup, no drift, no re-explaining.

---

## Install

```bash
bunx faf                      # Bun — zero install, fastest path
npx faf                       # npm — works everywhere
brew install faf-cli && faf   # Homebrew
```

> `faf` is shorthand for `faf-cli auto` — same behavior, fewer keystrokes.

---

## Nelly Never Forgets

Run `faf` with no arguments:

![faf](./nelly.png)

---

## v6.7 — The HTML Edition

**We rendered a `.faf`. 🔥**

A `.faf` was always machine-readable. Now it is human-visible.

```
faf show
```

**What:** one verb renders your *current* `project.faf` to a
self-contained `project.html` and opens it — score, tier, the 6 W's,
the stack, in any browser.

**Why it matters:** HTML shows **on-demand** — current truth, never a
stale snapshot — **visuals for human *and team* review.** The same
context your AI reads, now reviewable by people. Trophy renders the
earned award; sub-Trophy renders the honest gaps — a map, not a
verdict. Humans like visuals. We gave them one.

This is the **4th pillar**:

> **FAF defines. MD instructs. AI codes. HTML shows.**

`faf show` · `faf export --html` · a public render API
(`generateProjectHtml`) — one single-sourced renderer, no reinvention.

Receipts → [CHANGELOG](./CHANGELOG.md)

---

## v6.6 — The Trophy Edition

Until now we have had 85% as a recommended minimum. **It's now 100%! 🏆 All or nothing.**

AI gets its best shot at assisting you. **Period.**

We are able to do this because we can now get you to 100% on virtually any app-type.

**FAF Init > Auto > Go = 100%.**

`faf sync` locks MD ↔ FAF with 100% 🏆 — anti-hallucination, pro-code.

(Adding `about` — the 20th app-type — made the ladder hit a score. *How no-score became a score.* Fitting, because v6.6 is when that score became the only one we recommend.)

Receipts → [CHANGELOG](./CHANGELOG.md)

---

## v6.0 — Built with Bun

v6 is a ground-up rewrite. All-in on Bun — same toolchain as Claude Code.

| | Claude Code | faf-cli v6 |
|-|-------------|------------|
| **Runtime** | Bun | Bun (`bunx`) |
| **Test** | Bun | `bun test` |
| **Build** | Bun | `bun build` |
| **Language** | TypeScript | TypeScript |
| **Compile** | Bun bytecode | `bun build --compile` |

408 tests in ~13s. 296KB bundle in 2.4s. Single portable binary, 4 platforms. npx backward-compatible.

26 commands. 408 tests. WJTTC-tested. 93% smaller than v5.

```
commands → interop → core → wasm
```

The WASM scoring kernel (`faf-scoring-kernel` 2.0.0) does the math. Bun does the delivery.

---

## Commands

| # | Command | One-liner |
|---|---------|-----------|
| 1 | `faf init` | Create `.faf` from your local project |
| 2 | `faf git <url>` | Instant `.faf` from any GitHub repo — no clone |
| 3 | `faf auto` | Zero to 100% in one command |
| 4 | `faf go` | Guided interview to gold code |
| 5 | `faf score` | Check AI-readiness (0-100%) |
| 6 | `faf sync` | `.faf` ↔ CLAUDE.md (bi-sync, mtime auto-direction) |
| 7 | `faf compile` | `.faf` → `.fafb` binary — sealed, portable, deterministic |
| 8 | `faf decompile` | `.fafb` → JSON |
| 9 | `faf export` | Generate AGENTS.md, .cursorrules, GEMINI.md |
| 10 | `faf check` | Validate `.faf` file |
| 11 | `faf edit` | Edit `.faf` fields inline |
| 12 | `faf convert` | Convert `.faf` to JSON |
| 13 | `faf drift` | Check context drift |
| 14 | `faf context` | Generate context output |
| 15 | `faf recover` | Recover `.faf` from CLAUDE.md / AGENTS.md |
| 16 | `faf migrate` | Migrate `.faf` to latest version |
| 17 | `faf search` | Search slots and formats |
| 18 | `faf share` | Share `.faf` via URL |
| 19 | `faf taf` | Generate TAF test receipt |
| 20 | `faf demo` | Demo walkthrough |
| 21 | `faf ai` | AI-powered enhance & analyze |
| 22 | `faf pro` | Pro features & licensing |
| 23 | `faf conductor` | Conductor integration |
| 24 | `faf formats` | Show supported formats |
| 25 | `faf info` | Version and system info |
| 26 | `faf clear` | Clear cached data |

Run `faf --help` for full options.

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

---

## Scoring

**🏆 Trophy 100% — all or nothing.** From v6.6.0 onward, faf-cli recommends only Trophy. 100% on the FCL is what makes the layers above (MD instructions, Agents, AI tooling) work — sub-Trophy leaves gaps that AI guesses on. Sub-Trophy tiers are honest interim states on the way to Trophy, not endpoints.

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

---

## Sync

```
bi-sync:   .faf  ←── 8ms ──→  CLAUDE.md                (free forever)
tri-sync:  .faf  ←── 8ms ──→  CLAUDE.md ↔ MEMORY.md    (Pro)
```

---

## Compiled Binaries

Bun's single-file compiler produces standalone binaries — no runtime needed.

```bash
bun run compile                # Current platform
bun run compile:all            # darwin-arm64, darwin-x64, linux-x64, windows-x64
```

Ship `faf` as a single binary for CI/CD, Docker, or air-gapped environments.

---

## Architecture

```
src/
├── cli.ts              ← Entry point, 26 command registrations
├── commands/           ← 26 command files (1 per command)
├── core/               ← Types, slots (33 Mk4), tiers, scorer, schema
├── detect/             ← Framework detection, stack scanner
├── interop/            ← YAML I/O, CLAUDE.md, AGENTS.md, GEMINI.md
├── ui/                 ← Colors (#00D4D4), display
└── wasm/               ← faf-scoring-kernel wrapper (Rust → WASM)
```

**Toolchain:** Bun (test, build, compile) · TypeScript (strict) · WASM (scoring kernel)

---

## Testing

> **Robust. Reliable. Next-level WJTTC tested.** — The Foundation Edition.

```bash
bun test                       # 408 tests, 42 files, ~13s
```

- **WJTTC Build Resilience** (13) — every regression class locked.
- **WJTTC Kernel Stress** (19) — WASM kernel boundary tests.
- **e2e lifecycle** — every command in sequence.

Test reports in `reports/`.

---

## Support

- **[GitHub Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)** — Questions, ideas, community
- **Email:** team@faf.one

---

If `faf-cli` has been useful, consider starring the repo — it helps others find it.

---

## License

MIT — Free and open source

**IANA-registered:** [`application/vnd.faf+yaml`](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)

*format | driven 🏎️⚡️ [wolfejam.dev](https://wolfejam.dev)*
