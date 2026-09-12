# `slotignored` Slots — Quick Reference

**Updated 2026-09-12** · full rules: [SLOT-IGNORE.md](./SLOT-IGNORE.md) · [SCORING.md](./SCORING.md) · source of truth: [`src/core/slots.ts`](../src/core/slots.ts)

- **Your app-type decides which slots count.** Set `project.type`; `faf init`, `faf auto` and `faf git` mark every other slot `slotignored`: not required, not scored.
- **Typing `None` or `N/A` doesn't skip a slot.** It counts as empty. From faf-cli 7.13, `faf auto` fills it when the repo has the fact, and writes `slotignored` over it in a slot your app-type leaves out; the 6 Ws stay yours ([details](./SLOT-IGNORE.md#typed-words)).
- **Score = filled ÷ active.**

| Value | State | Effect on the score |
|---|---|---|
| missing, `None`, `N/A`, `null`, `unknown` | Empty (the default) | counts, as empty (scores 0) |
| `slotignored` (from your app-type) | slotignored | not required, not scored |
| `PostgreSQL` | Populated | counts, as filled |

A slot that shouldn't count is being counted? Fix `project.type`, then run `faf auto`.

The February 2026 version of this page (`Score = (Filled + Ignored) / 21`, "set slots to `None`") is superseded; it's in git history.
