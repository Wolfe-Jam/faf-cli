<!-- faf: faf-cli | TypeScript | cli | CLI for the .faf and .fafm IANA-registered formats — AI context + memory that versions with your code -->
<!-- faf: doc=readme | canonical=project.faf | score=100 | family=FAF -->

<div align="center">

<h1>
<img src="https://www.faf.one/orange-smiley.svg" alt="FAF" width="72" /><br>
faf-cli<br>
<sub><sub>CONTEXT, versioned.</sub></sub>
</h1>

### The context every AI coding agent reads — authored from your repo, never guessed.

**One `.faf` file → `AGENTS.md` · `CLAUDE.md` · `GEMINI.md` · `.cursorrules`,<br>
detected from your real stack, scored, and versioned with your code. No drift. No re-explaining.**

<!-- ① PRIME — the crown receipts -->
[![Anthropic MCP #2759](https://img.shields.io/badge/Anthropic_MCP-merged_%232759-blueviolet)](https://github.com/modelcontextprotocol/servers/pull/2759)
[![IANA vnd.faf+yaml](https://img.shields.io/badge/IANA-vnd.faf%2Byaml-008B8B)](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
[![IANA vnd.fafm+yaml](https://img.shields.io/badge/IANA-vnd.fafm%2Byaml-008B8B)](https://www.iana.org/assignments/media-types/application/vnd.fafm+yaml)
[![downloads](https://img.shields.io/npm/dt/faf-cli?color=008B8B&label=downloads)](https://www.npmjs.com/package/faf-cli)
[![npm](https://img.shields.io/npm/v/faf-cli?color=00CCFF)](https://www.npmjs.com/package/faf-cli)

<br>

**115,000+ downloads across the FAF ecosystem · IANA-registered · Anthropic-merged (#2759)**

⭐ **A star helps other devs find faf-cli** — despite the downloads, ~3 of 4 devs check stars.

<!-- ② papers · funnel · testing — one line -->
[![DOI: Context paper](https://img.shields.io/badge/DOI-Context%20paper-FF6B35)](https://doi.org/10.5281/zenodo.18251362)
[![DOI: Memory paper](https://img.shields.io/badge/DOI-Memory%20paper-FF6B35)](https://doi.org/10.5281/zenodo.20348942)
[![project.faf → faf](https://img.shields.io/badge/project.faf-inside-008B8B)](https://github.com/Wolfe-Jam/faf)
[![TAF](./badge.svg)](https://github.com/Wolfe-Jam/faf-taf-git)
[![CI](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfe-Jam/faf-cli/actions/workflows/ci.yml)

FAF defines. MD instructs. AI codes.

<!-- trophy — bottom of hero -->
[![FAF Trophy 100%](https://img.shields.io/badge/FAF-%F0%9F%8F%86%20100%25-000000?labelColor=FF6B35)](https://faf.one)

</div>

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

**Git-Native.** `project.faf` versions with your code — every clone, every fork, every checkout gets full AI context.<br>
No setup, no drift, no re-explaining.

---

## Install

```bash
bunx faf                      # Bun — zero install, fastest path
npx faf                       # npm — works everywhere
brew install wolfe-jam/faf/faf-cli && faf   # Homebrew (auto-taps)
```

> `faf` is shorthand for `faf-cli auto` — same behavior, fewer keystrokes.

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

## Nelly Never Forgets

Run `faf` with no arguments:

![faf](./nelly.png)

> **faf-cli dogfoods itself** — this repo's own [AGENTS.md](./AGENTS.md), [GEMINI.md](./GEMINI.md) and [CLAUDE.md](./CLAUDE.md) are authored by `faf` from [project.faf](./project.faf).

---

## Commands

| Command | What it does |
|---------|--------------|
| `faf init` | Create `project.faf` from your local project |
| `faf git <url>` | Instant `.faf` from any GitHub repo — no clone |
| `faf auto` | Detect stack, fill every slot it can, score |
| `faf go` | Guided interview to fill the human-only slots |
| `faf score` | Check AI-readiness (0–100%) |
| `faf export` | Author `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules` |
| `faf sync` | Bi-directional `.faf` ↔ `CLAUDE.md` |
| `faf diff` / `log` | Semantic context diff + score timeline across git history |
| `faf hooks --install` | Pre-commit guard against context regression |
| `faf compile` / `decompile` | `.faf` ↔ `.fafb` sealed binary |
| `faf check` | Validate a `.faf` file |
| `faf recover` | Rebuild `.faf` from an existing `CLAUDE.md` / `AGENTS.md` |
| `faf show` | Render `project.faf` to a browsable HTML page |
| `faf formats` | List supported stacks and formats |

Run `faf --help` for the full command set and options.

---

## Custom instructions

Your own rules for the AI — *"use full words in identifiers," "use bun, not npm"* — go in `project.faf` under `ai_instructions.warnings`. They land at the top of every `AGENTS.md` faf writes, verbatim and non-destructive.

**→ [How to add custom rules](https://docs.faf.one/custom-rules)** · [docs.faf.one](https://docs.faf.one)

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
bi-sync:   .faf  ←── 8ms ──→  CLAUDE.md
tri-sync:  .faf  ←── 8ms ──→  CLAUDE.md ↔ MEMORY.md
```

---

## Docs

The full manual lives at **[docs.faf.one](https://docs.faf.one)** — facts for devs, faf-cli first.

- [Getting started](https://docs.faf.one/getting-started) — install · run · use
- [Custom rules](https://docs.faf.one/custom-rules) — pin instructions your AI must follow

For a specific agent: [Grok, xAI & Cursor 👀](docs/faf-cli-for-agents.md) · [Claude Code 👀](docs/faf-cli-for-claude.md) · [Bun 👀](docs/faf-cli-for-bun.md)

---

## Recent editions

Pivotal releases — full history in [CHANGELOG.md](./CHANGELOG.md):

- **v7.1 — AGENTS.md** — `faf export --agents` authors a complete, non-destructive `AGENTS.md`.
- **v7.0 — GIT** — context goes git-native: `faf diff` / `log` / `hooks`.
- **v6.16 — Know Your Stack** — every emitted file labels your stack identically.
- **v6.15 — Copilot** — `faf export --copilot` writes the file GitHub Copilot reads.
- **v6.14 — Loop** — `faf loop` drives any repo to 🏆 100% or the honest human wall.
- **v6.7 — HTML** — `faf show` renders a `.faf` to a browsable page. *(FAF defines. MD instructs. AI codes. HTML shows.)*
- **v6.6 — Trophy** — 100% or nothing.
- **v6.0 — Bun** — ground-up rewrite; single portable binary, four platforms.

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

*format | driven 🏎️⚡️ [wolfejam.dev](https://wolfejam.dev) · [faf.one/cli](https://faf.one/cli)*

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Homebrew](https://img.shields.io/badge/Homebrew-faf--cli-orange)](https://github.com/Wolfe-Jam/homebrew-faf)

</div>
