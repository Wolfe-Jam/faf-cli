# Bi-Sync & Tri-Sync

Your `project.faf` stays synchronized with everything in milliseconds.

```
bi-sync:   project.faf  ←── 8ms ──→  CLAUDE.md            (free)
tri-sync:  project.faf  ←── 8ms ──→  CLAUDE.md ←→ MEMORY.md  (Pro)
```

## bi-sync — free forever

```bash
faf bi-sync              # Sync once (CLAUDE.md)
faf bi-sync --agents     # Also generate AGENTS.md
faf bi-sync --cursor     # Also generate .cursorrules
faf bi-sync --all        # All formats + RAM
faf bi-sync --watch      # Continuous sync
```

**Default direction is one-way:** `.faf → CLAUDE.md`. The `.faf` is the canonical Foundational Context Layer (FCL); CLAUDE.md is a downstream prose render. MD files never write back automatically.

**Reverse direction (`faf sync --pull`, MD → .faf) is Trophy-gated** (v6.6.0+). Backfilling from CLAUDE.md into a sub-Trophy `.faf` would overwrite canonical slots with prose that wasn't derived from `.faf` in the first place. The gate refuses the operation below 100%:

```bash
$ faf sync --pull
× sync --pull blocked: requires 🏆 Trophy (currently 81%)
  MD → .faf backfill only runs at 100%. Reach Trophy with 'faf go', then retry.
```

Reach Trophy (`faf go`) first; then `--pull` unlocks for legacy bootstrap.

## tri-sync — Pro (ROM meets RAM)

```bash
faf tri-sync             # .faf ↔ CLAUDE.md ↔ MEMORY.md
faf ram                  # Sync project context to RAM
faf ram status           # Check RAM path and line count
```

| Sync | Target | Status |
|------|--------|--------|
| bi-sync | `.faf` ↔ CLAUDE.md | Free forever |
| bi-sync | `.faf` ↔ AGENTS.md, .cursorrules, GEMINI.md | Free forever |
| **tri-sync** | `.faf` ↔ CLAUDE.md ↔ **MEMORY.md** | **Pro** |

14-day free trial, no signup, no credit card. Early-bird: $3/mo · $19/yr (normally $10/mo — 70% off).
**[Purchase at faf.one/pro](https://faf.one/pro)**

---

## Human Context (The 6 Ws)

Boost your score by 25-35% with human context — the information only YOU know.

```bash
# Auto-extract from README
faf readme --apply

# Manual entry
faf human-set who "Frontend team at Acme Corp"
faf human-set what "Customer dashboard with real-time analytics"
faf human-set why "10x faster than previous solution"
```
