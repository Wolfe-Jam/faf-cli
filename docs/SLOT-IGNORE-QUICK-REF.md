# Slot-Ignore Quick Reference

## TL;DR

**Slot-ignore** = Like `.gitignore` for context slots

faf writes `slotignored` (shown as N/A) into the slots your app-type leaves out. You don't type it: the app-type decides which slots count.

A typed `None`, `N/A` or `not applicable` is **not** slot-ignore. It is an empty slot, and it scores 0 until filled.

## Common Patterns

| App-type | Left out (`slotignored`) |
|----------|--------------------------|
| `cli`, `library` | the frontend and backend slots |
| `frontend`, `website` | the backend slots |
| `backend`, `mcp` | the frontend slots |
| `fullstack` | nothing — all 21 base slots count |

## Quick Check

| Value | Status | Score Impact |
|-------|--------|--------------|
| `PostgreSQL` | ✅ Filled | Counts for the score |
| `slotignored` | — Ignored (N/A) | Not counted |
| `None`, `N/A`, `not applicable` | ❌ Empty | Counts against the score until filled |
| `(undefined)`, `""` | ❌ Empty | Counts against the score until filled |

## A typed None

- **Tech slots:** if it's a fact, fill the slot. `faf auto` fills it when the repo has the fact; with no fact your words stay as typed, and faf never rewrites them to `slotignored`.
- **The 6Ws:** yours. `faf auto` never replaces a typed none there; `faf go` asks.
- `faf score` and `faf auto` print one line for each slot the app-type needs that still holds a typed none: `stack.database says 'None' — this app-type needs it, so it counts as empty until filled.`

## Full Documentation

See [SLOT-IGNORE.md](./SLOT-IGNORE.md) for complete specification.

---

**Remember:** Ignored ≠ Empty. Ignored = "this app-type doesn't use the slot." 🏎️
