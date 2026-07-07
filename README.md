<!-- faf: faf-cli | TypeScript | cli | CLI for the .faf and .fafm IANA-registered formats — AI context + memory that versions with your code -->
<!-- faf: doc=readme | canonical=project.faf | score=100 | family=FAF -->

<div style="display: flex; align-items: center; gap: 12px;">
  <img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="40" />
  <div>
    <h1 style="margin: 0; color: #000000;">faf-cli — The AGENTS.md Edition</h1>
    <p style="margin: 4px 0 0 0; font-size: 1.05em;"><strong>AGENTS.md, crafted, generated, optimized for you.</strong></p>
    <p style="margin: 6px 0 0 0;"><strong>FAF is to Context what Git is to Versions.</strong></p>
    <p style="margin: 0;"><strong>Define once. Run anywhere.</strong></p>
  </div>
</div>

[![npm version](https://img.shields.io/npm/v/faf-cli)](https://www.npmjs.com/package/faf-cli)[![npm downloads](https://img.shields.io/npm/dt/faf-cli?color=008B8B&label=downloads)](https://www.npmjs.com/package/faf-cli)
[![FAF Trophy 100%](https://img.shields.io/badge/FAF-%F0%9F%8F%86%20100%25-000000?labelColor=FF6B35)](https://faf.one)
[![IANA: vnd.faf+yaml](https://img.shields.io/badge/IANA-vnd.faf%2Byaml-008B8B)](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)[![IANA: vnd.fafm+yaml](https://img.shields.io/badge/IANA-vnd.fafm%2Byaml-008B8B)](https://www.iana.org/assignments/media-types/application/vnd.fafm+yaml)
[![DOI: Context paper](https://img.shields.io/badge/DOI-Context%20paper-FF6B35)](https://doi.org/10.5281/zenodo.18251362)[![DOI: Memory paper](https://img.shields.io/badge/DOI-Memory%20paper-FF6B35)](https://doi.org/10.5281/zenodo.20348942)

**Home:** [faf.one/cli](https://faf.one/cli)

**FAF defines. MD instructs. AI codes.**

[![FAF](https://mcpaas.live/badge/Wolfe-Jam/faf-cli.svg)](https://builder.faf.one)
[![TAF](./badge.svg)](https://github.com/Wolfe-Jam/faf-taf-git)
[![CI](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![project.faf](https://img.shields.io/badge/project.faf-inside-008B8B)](https://github.com/Wolfe-Jam/faf)

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

## v7.1 — The AGENTS.md Edition

**`faf export --agents` now generates a complete, best-in-class AGENTS.md for any repo — detected from your code, non-destructive, never stale.**

Point it at any repo and it detects your build/test commands, key files, conventions (ESLint/Prettier/strict/ruff/mypy…), and guardrails — then writes the definitive AGENTS.md: orientation, setup, tests, where-things-live, conventions, three-tier guardrails, a Definition of Done composed from your real commands, and secrets handling. Facts, not bloat. Your hand-written content is preserved.

```bash
npx faf-cli export --agents
```

---

## v7.0 — The GIT Version

**FAF is to Context what Git is to Versions.**

Git gave your *code* diff, log, blame, hooks, CI. v7.0 gives your *context* the same — `project.faf` is now a git-native artifact:

- **`faf diff`** — semantic context diff + score delta between any two refs (`85% ● → 100% 🏆`)
- **`git diff` speaks .faf** — `faf diff --install-driver` makes native `git diff` / `log -p` / `show` render the delta
- **`faf log`** — the score timeline across history (Proof-Over-Time)
- **`faf hooks --install`** — pre-commit guard: warn, or `--strict` block, on a context regression
- **`faf git owner/repo --ref <tag>`** — instant, *versioned*, scored context from any repo

Purely additive — a safe upgrade. (One change: `faf git` now refuses to overwrite an existing `project.faf` — pass `--force`.)

## v6.16 — Know Your Stack

**FAF knows your stack — and now labels it identically in every file it writes: CLAUDE.md, AGENTS.md, copilot-instructions.md, GEMINI.md, .cursorrules.**

```bash
faf export --all     # CLAUDE.md · AGENTS.md · copilot-instructions.md · GEMINI.md · .cursorrules
```

FAF *knows your stack* — all 33 canonical slots now carry their display label in the registry, so `api_type` → **API**, `cicd` → **CI/CD**, `frontend` → **Framework**, the same way in **every** emitted file. GEMINI.md and `.cursorrules` were raw-key dumps; now they read like the rest. And `.github/copilot-instructions.md` gets a ground-up **Copilot-grade** rewrite — a prose overview, a `## Build & run` command section, GitHub-spec framing. Copilot enhancements, and more.

---

## v6.15 — The Copilot Edition

**FAF now writes the file GitHub Copilot reads.**

```bash
faf export --copilot     # → .github/copilot-instructions.md (every Copilot surface reads it)
faf git owner/repo       # instant scored .faf from any GitHub repo (now injection-hardened)
```

`faf export --copilot` emits GitHub Copilot's repository-wide instruction file — the **widest-surface** one, read by default across web chat, code review, VS Code, JetBrains, the CLI, and the coding agent. `faf git` is now hardened against URL command injection (no-shell `execFileSync` + a strict allowlist). Shipped with an exemplary WJTTC Git suite that adopts the full five tiers — **BRAKE · ENGINE · AERO · TYRE · PIT**.

---

## v6.14 — The Loop Edition

**`faf loop` drives any repo to 🏆 100% or the honest human wall** — sourcing every slot it can with provenance, asking only what only you know, never inventing.

```bash
faf loop    # init → auto → score, then ask only the human-only gaps
```

The loop sources what detection can, then stops at one of three honest terminals: `done` (🏆 100%), `needs-human` (it asks only the slots only you can answer), or `stuck` (it sourced everything sourceable and nothing's left for a human to add). It never fabricates a slot to reach 100% — sourced 6Ws now carry provenance (`{value, source, confidence}`), so every seeded value is a confirm-or-edit suggestion, never an auto-confirmed guess.

---

## v6.13 — The Dart Edition

**faf now understands Dart and Flutter projects.** Content-aware `pubspec.yaml` classification — Flutter app vs reusable package · Dart server (Serverpod / Dart Frog / Shelf) / CLI / MCP — pure Dart stays Dart. The single-source engine faf-python-sdk and the MCPs compose, parity-tested across languages.

```bash
faf auto    # reads pubspec.yaml → Dart/Flutter into project.faf
```

A pubspec alone no longer means "Flutter": `faf` reads the dependencies and classifies — a Flutter app, a reusable package, a Dart server, a CLI, or a Dart MCP server. The detection knowledge lives in one spec (`dart-detection.json`) that faf-cli, faf-python-sdk, and the MCPs all share.

---

## v6.12 — The Single-Source Edition

**faf-cli is now the single source for the registry `_meta`** — it emits the `one.faf/context` block every FAF MCP server composes: `registryMeta`/`registryName`/`fafContextBlock`, one deterministic projection, byte-identical, end-to-end across every surface, verifiable by sha, re-derivable instantly on-demand.

```ts
import { registryMeta, registryName } from 'faf-cli';

serverJson.name  = registryName(faf);   // → one.faf/<name>, derived from project.homepage
serverJson._meta = registryMeta(faf);   // nests one.faf/context under publisher-provided (4 KB cap)
```

Honest-first: the block carries `{ faf, mediaType, iana, deterministic, generated }` — **no baked score**. One emitter, every door, byte-identical.

---

## v6.11 — The Ledger Edition

**`faf bench --submit` posts your cold-vs-grounded receipt to the public ledger — the context bench goes public, one command.** Run the grounding benchmark, then submit the full pair receipt:

```bash
faf bench --submit
```

The benchmark stops being a private number and becomes a shared, verifiable receipt on the public ledger. Also new: `relentlessContext` / `assembleFreshFaf` and the `buildTableOf8` interview keystone join the public API.

## v6.10 — The Composed Edition

**Every FAF MCP composes single-source engines, never reimplements them.** Turbo-Cat (the ~200-format knowledge base) and the bench engine join the public API, alongside scoring and the 6Ws Interview:

```ts
import { turboCatScan, deriveQuestionSet, publicQuestions, gradeAnswers, buildReceipt } from 'faf-cli';
```

- **Turbo-Cat composed** — `turboCatScan` / `turboCatSlots`: per-format breakdown + stack signature, sourced-only, deterministic, pure read. The MCPs retire their hardcoded format maps.
- **Bench composed** — derive questions from any `.faf` (the answer key stays server-side via `publicQuestions`), grade mechanically, emit the `✪` receipt. One grading engine, byte-identical everywhere.
- **`✪` = one convention** — parity · trust · bench all emit sha256-over-canonical-projection receipts any third party can re-derive.

---

## v6.9 — The Grounded Edition

**Grounding becomes a first-class primitive: `faf bench` proves it, the 6Ws Interview single-sources it, `faf refresh` keeps it.**

- **`faf bench`** — the AI-grounding benchmark. Cold vs with-faf, two numbers (answers right, tokens burned), and **the `.faf` is the answer key** — grading is mechanical, the receipt is a verifiable `✪` sha256. A low cold score is an alarm bell: you are hemorrhaging tokens and the AI is guessing at what you're building. `faf bench` → protocol, `faf bench questions` → hand them to any AI, `faf bench grade answers.json --cold|--faf` → the pair.
- **The 6Ws Interview, exported** — the 8-question core (name + goal + the six Ws) plus the stack interview now ship as the public API (`SIX_WS_INTERVIEW`, `questionForSlot`, `interviewForMissing`). One registry; every consumer (CLI, MCPs, UIs) asks the same questions. Question drift is dead.
- **`faf refresh`** — the re-ground: re-score the live `.faf`, measure drift vs the DNA baseline (`drift: 43% ↑ 55% (+12)`), keep an existing `.fafb` fast tier compiled current, record the journey. `drift → refresh → re-grounded`.

---

## v6.7 — The HTML Edition

**We rendered a `.faf`. 🔥 The day we *saw* FAF.**

A major development — not a new flag, a new way to *see* what your AI
works from. A `.faf` was always machine-readable. Now it is
human-visible.

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

It is a **cross-check**: see what your AI sees, then improve what it is
working with **at the root** — the `project.faf` itself, not the
symptoms.

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

880 tests in ~18s. 296KB bundle in 2.4s. Single portable binary, 4 platforms. npx backward-compatible.

32 commands. 880 tests. WJTTC-tested. 93% smaller than v5.

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
| 🏆 / ✪ **Trophy** | 100% | AI never has to guess |
| ★ **Gold** | 99%+ | 1 slot from Trophy |
| ◆ **Silver** | 95%+ | Close — keep going |
| ◇ **Bronze** | 85%+ | Interim — keep going |
| ● **Green** | 70%+ | Interim — keep going |
| ● **Yellow** | 55%+ | AI flipping coins |
| ○ **Red** | <55% | AI working blind |
| ♡ **White** | 0% | No context at all |

**🏆 and ✪ both mean 100%** — the same top score, shown by surface: **✪** (the Proof Seal) on code surfaces — CLI, skills, docs, the hub — and **🏆** on social: posts, blogs, cards. You'll see both around for a while as the ✪ convention settles in.

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
bun test                       # 880 tests, 75 files, ~18s
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


## Citation

If you use `faf-cli` or the `.faf` / `.fafm` formats in research or production, please cite the format papers:

> Wolfe, J. (2025). *Format-Driven AI Context Architecture: The .faf Standard for Persistent Project Understanding*. Zenodo. https://doi.org/10.5281/zenodo.18251362

> Wolfe, J. (2026). *Permanent Memory and Instant Recall: The .fafm Standard for Multi-Profile AI Agent Memory*. Zenodo. https://doi.org/10.5281/zenodo.20348942

### BibTeX

```bibtex
@article{wolfe2025faf,
  title     = {Format-Driven AI Context Architecture: The .faf Standard for Persistent Project Understanding},
  author    = {Wolfe, James},
  year      = {2025},
  month     = {nov},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.18251362},
  url       = {https://doi.org/10.5281/zenodo.18251362}
}

@article{wolfe2026fafm,
  title     = {Permanent Memory and Instant Recall: The .fafm Standard for Multi-Profile AI Agent Memory},
  author    = {Wolfe, James},
  year      = {2026},
  month     = {may},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.20348942},
  url       = {https://doi.org/10.5281/zenodo.20348942}
}
```

## License

MIT — Free and open source

**IANA-registered:** [`application/vnd.faf+yaml`](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml) (Context Layer) · [`application/vnd.fafm+yaml`](https://www.iana.org/assignments/media-types/application/vnd.fafm+yaml) (Memory Layer)

*format | driven 🏎️⚡️ [wolfejam.dev](https://wolfejam.dev)*
