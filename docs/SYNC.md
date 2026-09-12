# Sync & Tri-Sync

Your `project.faf` is the one source. `faf sync` writes it out — in one direction.

```
sync:      project.faf  →  CLAUDE.md                     (free)
tri-sync:  project.faf  →  CLAUDE.md  +  MEMORY.md       (free)
```

## sync — free forever

```bash
faf sync                 # .faf → CLAUDE.md, once
faf sync --watch         # The same, on every change
faf export --agents      # .faf → AGENTS.md (also --cursor, --gemini, --copilot, --all)
```

**One direction:** `.faf → CLAUDE.md`. The `.faf` is the canonical Foundational Context Layer (FCL); CLAUDE.md is a downstream prose render. faf writes only its own block in CLAUDE.md — your text around it stays as you wrote it — and CLAUDE.md never writes back on its own.

**The way back (`faf sync --direction pull`, CLAUDE.md → .faf) is Trophy-gated** (v6.6.0+). Backfilling from CLAUDE.md into a sub-Trophy `.faf` would overwrite canonical slots with prose that wasn't derived from `.faf` in the first place. The gate refuses the operation below 100%:

```bash
$ faf sync --direction pull
× sync --pull blocked: requires ✪ Trophy (currently 81%)
  MD → .faf backfill only runs at 100%. Reach Trophy with 'faf go', then retry.
```

Reach Trophy (`faf go`) first; then `--direction pull` backfills name, goal and language into `.faf`.

## tri-sync — free forever (ROM meets RAM)

```bash
faf pro activate         # Shows how to turn tri-sync on: export FAF_PRO=1
FAF_PRO=1 faf sync       # .faf → CLAUDE.md, and .faf → Claude Code's MEMORY.md
```

tri-sync writes faf's block into the MEMORY.md Claude Code loads for the project (`~/.claude/projects/<id>/memory/MEMORY.md`) and keeps every line Claude wrote there. One direction: `.faf → MEMORY.md`.

| Sync | Direction | Status |
|------|-----------|--------|
| sync | `.faf` → CLAUDE.md | Free forever |
| export | `.faf` → AGENTS.md, .cursorrules, GEMINI.md, Copilot | Free forever |
| **tri-sync** | `.faf` → CLAUDE.md + **MEMORY.md** | **Free forever** |

No trial, no license, no catch. `.faf` relies on tri-sync now, so it has to be free.
Pro features (the Rust `.fafb` compiler suite) live in a separate package — **[faf.one/pro](https://faf.one/pro)**

---

## Human Context (The 6 Ws)

Raise your score with human context — the information only YOU know.

```bash
# Interview: faf asks for each empty W
faf go

# Manual entry
faf edit human_context.who "Frontend team at Acme Corp"
faf edit human_context.what "Customer dashboard with real-time analytics"
faf edit human_context.why "10x faster than previous solution"
```
