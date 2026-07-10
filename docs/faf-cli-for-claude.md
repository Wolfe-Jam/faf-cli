# FAF-CLI for Claude & Claude Code Developers

**One command. Every agent in your session gets the same accurate, versioned context.**

FAF-CLI (v7.1, "The AGENTS.md Edition") is the canonical tool for the [`.faf` format](https://faf.one): persistent, versioned, AI-readable project context. For Claude it does two things a hand-written file can't: it **bi-syncs `CLAUDE.md` with a single scored source of truth** (`project.faf`), and it exposes live FAF tools to Claude over MCP. Part of the FAF ecosystem — [100,000+ downloads](https://faf.one/blog/hundred-thousand).

---

## Quick start (zero-install)

```bash
bunx faf                     # auto-detect the stack, write project.faf, score it
bunx faf sync                # bi-sync .faf ↔ CLAUDE.md (edit either; the other follows)
bunx faf export --agents     # also emit AGENTS.md — Claude Code reads it too
bunx faf score               # AI-readiness score (target: Trophy 100%)
```

`npx faf` works too. Run `faf sync` on save, in a pre-commit hook, or in CI, and `CLAUDE.md` never drifts from the project it describes.

---

## The doc hierarchy — where FAF fits

```
README.md    → prose for humans
CLAUDE.md    → prose for Claude
project.faf  → structure for any AI  ← the scored source the others project from
```

`CLAUDE.md` is Claude's instruction file. `project.faf` is the structured, scored source it's authored from — so instead of hand-maintaining prose that rots the moment the stack changes, you maintain one source and let FAF keep `CLAUDE.md` current.

## Why this fits Claude Code

Claude Code reads `CLAUDE.md` (and `AGENTS.md`) at the start of every session. FAF makes those a projection of one scored source, not hand-kept files:

1. **Bi-directional sync** — `faf sync` keeps `.faf` ↔ `CLAUDE.md` aligned with mtime auto-direction: edit `CLAUDE.md` and the `.faf` updates; edit the `.faf` and `CLAUDE.md` updates. No manual reconciliation, no drift.
2. **Non-destructive** — FAF maintains a labeled block and preserves everything you wrote by hand.
3. **Scored, not guessed** — `faf score` tells you whether Claude is starting from complete context or filling gaps by hallucination. Target the Trophy (100%) and every session starts from a full picture.
4. **Git-native** — the `.faf` versions with your code, so context travels with the branch and matches the commit Claude is working on.

## Live tools over MCP — claude-faf-mcp

Static files are the baseline; [claude-faf-mcp](https://www.npmjs.com/package/claude-faf-mcp) is the live layer. It wires FAF into **Claude Desktop and Claude Code** so Claude can call FAF tools directly — score, validate, and context operations — instead of only reading Markdown. One `.faf` source; two surfaces (the file Claude reads, the tools Claude calls) that never disagree.

## For CLAUDE.md maintainers & teams

- **Stop hand-editing** — `bunx faf` once, then `faf sync` keeps `CLAUDE.md` honest as the stack evolves.
- **Onboarding** — a new teammate or a fresh Claude session gets accurate context immediately, not a stale hand-written guess.
- **Remote work** — `faf git owner/repo` pulls structured, scored context for any repo Claude needs to reason about, no clone required.
- **One source → many surfaces** — change `project.faf`, and `CLAUDE.md`, `AGENTS.md`, and the MCP tools stay consistent.

## Why it's a natural fit

FAF-CLI isn't another AI wrapper — it's the canonical, versioned, stack-aware source that `CLAUDE.md` should be authored *from*. The bi-sync means the file Claude reads can't quietly fall out of date, and the MCP server means Claude can act on live context, not just a snapshot. One command (`bunx faf`) turns any project into one Claude can actually understand — measurable, versioned, and consistent.

---

**Links:** [faf.one](https://faf.one) · [`.faf` format](https://github.com/Wolfe-Jam/faf) · [faf-cli on npm](https://www.npmjs.com/package/faf-cli) · [claude-faf-mcp on npm](https://www.npmjs.com/package/claude-faf-mcp) · [IANA `application/vnd.faf+yaml`](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml)
