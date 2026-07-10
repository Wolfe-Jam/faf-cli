# FAF-CLI for Bun Developers

**One command. Every agent in your session gets the same accurate, versioned context.**

FAF-CLI (v7.1, "The AGENTS.md Edition") is the canonical tool for the [`.faf` format](https://faf.one): persistent, versioned, AI-readable project context. It runs straight through Bun's package runner — `bunx faf` — detects your Bun stack, and emits the context files AI coding tools read. It's bundled with `bun build`, so it's built the way you build. Part of the FAF ecosystem — [100,000+ downloads](https://faf.one/blog/hundred-thousand).

---

## Quick start (zero-install)

```bash
bunx faf                     # auto-detect the stack, write project.faf, score it
bunx faf export --agents     # generate AGENTS.md agents actually read
bunx faf score               # AI-readiness score (target: Trophy 100%)
bunx faf git owner/repo      # instant, scored context for any remote repo — no clone
```

No `bun add -g` needed — `bunx` runs the latest faf-cli on demand. Add `bunx faf export --agents` to a `package.json` script or a pre-commit hook and context files stay fresh.

---

## Why this fits Bun projects

FAF is Bun-aware end to end — it reads your project the way Bun sees it:

1. **Runs through `bunx`** — zero-install, always the latest release, no global state to manage.
2. **Detects your Bun runtime** — faf recognizes `bunfig.toml` and `bun.lock` / `bun.lockb` and reports **Bun** as the runtime and package manager, not a generic Node guess.
3. **Emits bun-based commands** — when faf sees a Bun lockfile it prefers `bun` as the runner, so the authored `AGENTS.md` carries `bun install` / `bun test` / `bun run` — the commands your project actually uses.
4. **Same toolchain** — faf-cli is bundled with `bun build`; you're running a tool built on the runtime you ship on.

## Why context matters on a fast stack

Bun makes the *run* loop fast. FAF makes the *agent's* loop accurate — so the speed isn't spent re-discovering the same project every session:

- **CI / bootstrap gate** — `bunx faf export --agents` on every run keeps `AGENTS.md` current, so an agent never starts from stale context.
- **Scoring as a readiness signal** — `bunx faf score` answers "is this project ready for serious agent work?" before you point an agent at it. Target the Trophy (100%).
- **Non-destructive** — FAF maintains a labeled block and preserves everything you wrote by hand.
- **Git-native** — the `.faf` versions with your code, so context travels with the branch.

## For general AI coding sessions

- **Static + live** — the emitted Markdown is the baseline; wire a FAF MCP server so agents can call `score`, `validate`, and context ops, not just read files.
- **One source → many surfaces** — change `project.faf`, and every emitted file (`AGENTS.md`, `.cursorrules`, `GEMINI.md`, `CLAUDE.md` via `faf sync`) stays consistent.
- **External work** — `bunx faf git owner/repo` gives an agent instant, scored context on any repo or dependency without a full clone.

## Why it's a natural fit

You already reach for `bunx` to run a tool without installing it. `bunx faf` gives your AI agents the one thing they usually lack — accurate, versioned, stack-aware project context — in a single command, with zero install, correctly detecting the Bun runtime you actually use. Fast stack, accurate agents.

---

**Links:** [faf.one](https://faf.one) · [`.faf` format](https://github.com/Wolfe-Jam/faf) · [faf-cli on npm](https://www.npmjs.com/package/faf-cli) · [IANA `application/vnd.faf+yaml`](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
