# Mini Claude Code memory store (Step 4)

Synthetic fixture for `from_claude_dir`. Not a live `~/.claude` dump.

| File | Expected |
|------|----------|
| `good-project.md` | fact id `good-project`, type project, links, provenance |
| `good-feedback.md` | fact id `good-feedback`, type feedback |
| `name-only.md` | fact id `name-only-slug`, text = name |
| `bad-type.md` | skipped |
| `no-name.md` | skipped |
| `MEMORY.md` | skipped |
