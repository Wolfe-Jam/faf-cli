---
description: Bi-directional sync between .faf ↔ CLAUDE.md (8ms average)
argument-hint: None
---

# FAF Sync - Keep AI Context in Perfect Sync

You are helping a developer maintain synchronized AI context across formats.

## What This Command Does

`faf sync` implements **C-Mirror** (Context-Mirroring) - FAF's championship bi-directional sync engine that keeps `.faf` and `CLAUDE.md` perfectly synchronized.

**Performance**: 8ms average sync time (championship speed)
**Reliability**: Zero-slippage design with atomic writes
**Compatibility**: Works with Claude Code, Cursor, and any tool reading markdown context

---

## Sync Flow

```
.faf (YAML)  ←→  CLAUDE.md (Markdown)
   ↑                    ↑
   └────── C-Mirror ────┘
        8ms sync
```

**Bi-directional** means:
- Edit `.faf` → `CLAUDE.md` auto-updates
- Edit `CLAUDE.md` → `.faf` auto-updates
- Both files stay in perfect sync

---

## Command: faf sync

**Basic usage**:
```bash
faf sync
```

**What happens**:
1. Reads both `.faf` and `CLAUDE.md`
2. Detects which file changed last
3. Syncs changes bidirectionally
4. Validates both files remain consistent
5. Reports sync status (<10ms)

**When to use**:
- After editing `.faf` manually
- After editing `CLAUDE.md` manually
- After running `npm install` (new dependencies)
- After changing tech stack
- As part of git pre-commit hook

---

## Your Role

1. **Run the command**: Execute `faf sync` in project directory

2. **Verify sync**:
   ```bash
   faf sync
   # Output: ✅ Synced .faf ↔ CLAUDE.md (8ms)
   ```

3. **Check for conflicts**: If user edited both files differently:
   - FAF uses last-modified timestamp to determine source of truth
   - Warns if potential conflict detected
   - User can resolve manually or accept auto-merge

4. **Validate results**: After sync, suggest:
   ```bash
   faf score
   ```
   To ensure context quality maintained.

---

## Related Commands

**Manual update** (one-way):
```bash
faf update
# Saves current .faf state (checkpoint)
```

**Auto-sync on file changes** (via hook):
```bash
# Setup git hook for auto-sync
# .git/hooks/pre-commit
faf sync --quiet
```

---

## C-Mirror Technical Details

**Why 8ms is championship**:
- Sub-10ms keeps developer flow uninterrupted
- Fast enough for real-time auto-sync
- F1-grade performance target: <50ms for all operations

**Zero-slippage design**:
- Atomic file writes (never corrupts on interrupt)
- Checksum validation
- Rollback on error
- No race conditions

**Supported sync targets**:
- `CLAUDE.md` - Claude Code (primary)
- `.cursorrules` - Cursor (optional)
- Custom formats (extensible)

---

## Example Workflow

**User edits .faf to add new dependency**:
```yaml
# .faf
stack:
  dependencies:
    - react
    - zustand  # ← NEW
```

**Run sync**:
```bash
faf sync
# Output: ✅ Updated CLAUDE.md with new dependency (7ms)
```

**CLAUDE.md now shows**:
```markdown
## Stack
- Dependencies: react, zustand
```

**Vice versa works too** - edit `CLAUDE.md`, run `faf sync`, `.faf` updates.

---

## Pro Tips

1. **Auto-sync on save**: Use file watcher or git hooks
2. **Pre-commit sync**: Ensure context always in sync before commits
3. **CI/CD integration**: Validate sync in pipelines
4. **Team workflows**: Sync keeps context consistent across team

---

**Championship philosophy**: Context should **never** drift. Sync early, sync often, trust the 8ms engine. 🏎️⚡️
