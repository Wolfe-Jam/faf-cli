# tri-sync — free forever

**Define once. Remember forever.**

## What is tri-sync?

FAF writes your project context in one direction, from one source:

```
sync:      project.faf  →  CLAUDE.md                      (free forever)
tri-sync:  project.faf  →  CLAUDE.md  +  MEMORY.md        (free forever)
```

- **ROM** (`.faf`) — Your project DNA. Stack, conventions, architecture. Defined once, portable everywhere.
- **RAM** (`MEMORY.md`) — Session memory. The MEMORY.md Claude Code loads for your project (`~/.claude/projects/<id>/memory/MEMORY.md`) carries your project context into every session. No more re-explaining.

`faf sync` writes faf's block in `CLAUDE.md` from your `.faf`. tri-sync also writes faf's block into Claude Code's `MEMORY.md`. Both are free, no trial, no license, no catch — `.faf` relies on tri-sync now, so it has to be.

Nothing flows back into `.faf` on its own. The one way back is `faf sync --direction pull`, which backfills `.faf` from `CLAUDE.md` and runs only at ✪ Trophy (100%).

## Commands

```bash
faf pro activate           # Shows how to turn tri-sync on: export FAF_PRO=1
FAF_PRO=1 faf sync         # .faf → CLAUDE.md, and .faf → MEMORY.md
FAF_PRO=1 faf sync --watch # The same, on every change to .faf
```

## How It Works

tri-sync is merge-safe. It writes only faf's own block in MEMORY.md and keeps every line Claude wrote there, byte for byte. A run that changes nothing writes nothing, and faf says what it did (created, updated, block added on top, unchanged).

```bash
# Put your project context into Claude's memory
FAF_PRO=1 faf sync
```

Claude Code loads the first 200 lines of MEMORY.md — faf tells you when the file runs past that.

## FAQ

**What's the difference between sync and tri-sync?**
sync: `.faf` → `CLAUDE.md` (project structure). Free.
tri-sync: also `.faf` → `MEMORY.md` (session memory). Also free.

**Is there a paid tier for faf-cli?**
No. Every command in faf-cli is free, unlimited, forever. Pro features (the Rust `.fafb` compiler suite — `faf compile`, `faf bench`, Glass Hood diagnostics) live in the separate `rust-faf-cli` package. See [faf.one/pro](https://faf.one/pro).

## Support

- [Documentation](https://github.com/Wolfe-Jam/faf-cli#readme)
- [Community Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)
- Email: team@faf.one
