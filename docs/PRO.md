# tri-sync — free forever

**Define once. Remember forever.**

## What is tri-sync?

FAF has two layers of memory:

```
bi-sync:   project.faf  <-->  CLAUDE.md                    (free forever)
tri-sync:  project.faf  <-->  CLAUDE.md  <-->  MEMORY.md   (free forever)
```

- **ROM** (`.faf`) — Your project DNA. Stack, conventions, architecture. Defined once, portable everywhere.
- **RAM** (`MEMORY.md`) — Session memory. Your AI remembers project context, decisions, and conventions across every session. No more re-explaining.

bi-sync keeps your `.faf` and `CLAUDE.md` in sync. tri-sync adds RAM — persistent session memory that survives across every AI session. Both are free, no trial, no license, no catch — `.faf` relies on tri-sync now, so it has to be.

## Commands

```bash
faf tri-sync    # ROM <-> CLAUDE.md <-> MEMORY.md
faf ram export  # ROM -> RAM (seed Claude's memory)
faf ram import  # RAM -> ROM (harvest Claude's notes)
faf ram sync    # Bidirectional sync
faf ram status  # Show sync status
```

## How It Works

tri-sync is merge-safe. It preserves Claude's existing notes and only touches the FAF section of MEMORY.md. Your AI's own observations stay intact.

```bash
# Seed Claude's memory with your project context
faf ram export

# After working with Claude, harvest what it learned
faf ram import

# Or just sync both ways
faf ram sync
```

The 200-line MEMORY.md ceiling is respected — tri-sync warns you if you're approaching the limit.

## FAQ

**What's the difference between bi-sync and tri-sync?**
bi-sync: `.faf` <-> `CLAUDE.md` (project structure). Free.
tri-sync: adds `MEMORY.md` (session memory). Also free.

**Is there a paid tier for faf-cli?**
No. Every command in faf-cli is free, unlimited, forever. Pro features (the Rust `.fafb` compiler suite — `faf compile`, `faf bench`, Glass Hood diagnostics) live in the separate `rust-faf-cli` package. See [faf.one/pro](https://faf.one/pro).

## Support

- [Documentation](https://github.com/Wolfe-Jam/faf-cli#readme)
- [Community Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)
- Email: team@faf.one
