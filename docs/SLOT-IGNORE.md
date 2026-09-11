# Slot-Ignore Specification

## Overview

**Slot-ignore** is how a slot that does not apply to a project's app-type is left out of the score. Like `.gitignore` for files and `.fafignore` for scanning, it tells the scorer: "this slot exists, but this app-type does not use it."

The value is `slotignored`, shown to people as **N/A**. It comes from the app-type (`project.type`), and only from it.

## The Problem It Solves

**Without slot-ignore:**
- CLI tool with no database → "Database missing" → Low score ❌
- Static site with no backend → "Backend missing" → Low score ❌

**With slot-ignore:**
- `project.type: cli` → the frontend and backend slots are `slotignored` → not counted ✅
- `project.type: frontend` → the backend slots are `slotignored` → not counted ✅

## Who writes `slotignored`

faf does, from the app-type. `faf init`, `faf auto` and `faf git` detect the project's app-type (`project.type`) and write `slotignored` into each slot that type leaves out. On an existing project.faf, `faf auto` writes it only into a slot that is empty: never over a value, and never over words you typed.

A `cli` leaves out the frontend and backend slots, a `frontend` leaves out the backend slots, and a `fullstack` uses all 21 base slots. The full list of app-types is `APP_TYPE_CATEGORIES` in [`src/core/slots.ts`](../src/core/slots.ts).

## A typed None / N/A is an empty slot

`None`, `N/A` and `not applicable` (any case) are not slot-ignore. People type them before they learn the word `slotignored`; they still do not take a slot out. A typed none is an **empty** slot: it scores 0 until filled.

- **Tech slots** (every slot except the 6Ws): if it's a fact, fill the slot. When the repo has the fact, `faf auto` fills the slot in place of the typed none. With no fact, your words stay exactly as you typed them, comment included, and faf never rewrites them to `slotignored`.
- **The 6Ws** (`human_context.*`) are yours: `faf auto` never replaces a typed none there. `faf go` asks, as it does for any empty slot, and shows your words so you can keep them or answer.
- `faf score` and `faf auto` print one line for each slot the app-type needs that still holds a typed none:

```
stack.database says 'None' — this app-type needs it, so it counts as empty until filled.
```

## Slot states

| State | Value | Meaning | Score |
|-------|-------|---------|-------|
| **Filled** | `PostgreSQL` | Has a real value | Counts for the score |
| **Ignored (N/A)** | `slotignored` | The app-type leaves it out | Not counted |
| **Empty** | missing, `""`, `None`, `N/A`, `not applicable` | Not filled yet | Counts against the score |

`faf score` shows filled slots out of the slots that count (`4/12 slots`); `faf score --verbose` lists each slot, with an ignored one shown as `N/A`.

**Example (`project.type: cli`):**
```yaml
project:
  type: cli
stack:
  frontend: slotignored    # N/A — a cli leaves out the frontend slots (faf wrote this)
  database: slotignored    # N/A — a cli leaves out the backend slots (faf wrote this)
  hosting: npm registry    # Filled
  cicd: None               # Empty — a cli needs CI/CD; faf auto fills it when the repo has the fact
```

## Future work

### Explicit `.slotignore` File (Optional)

```yaml
# .slotignore - Explicitly declare ignored slots
- db       # CLI tool doesn't need db
- css  # No framework styling
- framework       # No web UI

# Auto-applied based on project.type
auto_detect: true
```

### Smart Detection (Current Approach)

faf detects the project type and applies the slot-ignore rules for it:

```typescript
// Auto-detect CLI → ignore the frontend and backend slots
if (isNodeCLI) {
  applySlotIgnore(['frontend', 'backend']);
}
```

## Reference

- **Design Philosophy:** Like `.gitignore` for files, slot-ignore for context slots
- **Value:** `slotignored` (shown as N/A), written by faf from the app-type
- **A typed None / N/A / not applicable:** an empty slot, 0 until filled
- **Base Slots:** 21 (`faf score`); 33 with the enterprise slots

---

**Slot-ignore: The perfect way to handle app-types.** 🏎️

*Last Updated: 2026-09-11*
*FAF Version: 7.13.0+*
