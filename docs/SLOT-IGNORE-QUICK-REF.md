# N/A Slots — Quick Reference

**Updated 2026-09-12** · full rules: [SLOT-IGNORE.md](./SLOT-IGNORE.md) · [SCORING.md](./SCORING.md) · source of truth: [`src/core/slots.ts`](../src/core/slots.ts)

- **Your app-type decides which slots count.** Set `project.type`; `faf init`, `faf auto` and `faf git` mark every other slot `slotignored` (shown as N/A).
- **Typing `None` or `N/A` doesn't skip a slot.** It counts as empty.
- **Score = filled ÷ active.**

| Value | Status | Effect on the score |
|---|---|---|
| `PostgreSQL` | Filled | counts, as filled |
| `slotignored` (from your app-type) | N/A | left out |
| missing, `None`, `N/A`, `null`, `unknown` | Empty | counts, as empty |

A slot that shouldn't count is being counted? Fix `project.type`, then run `faf auto`.

The February 2026 version of this page (`Score = (Filled + Ignored) / 21`, "set slots to `None`") is superseded; it's in git history.
