# `slotignored` slots

> **Source of truth:** [`src/core/slots.ts`](../src/core/slots.ts). How the score works: [SCORING.md](./SCORING.md).
>
> **Updated 2026-09-12.** This replaces the February 2026 spec (v4.2.1), which said typing `None` ignores a slot. It doesn't — see below.

## What `slotignored` means

Some slots don't apply to some projects: a CLI has no CSS framework, a static site has no database. Those slots are `slotignored`: not required, and not scored. faf writes `slotignored` into them from your app-type.

## Who decides

**Your app-type — nothing else.** `project.type` selects which slot categories count (the table is in [SCORING.md](./SCORING.md)). `faf init`, `faf auto` and `faf git` mark every slot outside those categories as `slotignored`.

You don't write `slotignored` to skip a slot you haven't filled. If a slot that doesn't fit your project is being counted, the app-type is wrong: fix `project.type` (for example `faf edit project.type cli`), then run `faf auto`.

## The three states

| State | In the file | Effect on the score |
|---|---|---|
| **Empty** (the default) | missing, `''`, or a typed `None` / `N/A` / `null` / `unknown` / `not applicable` | counts, as empty (scores 0) |
| **slotignored** | `slotignored`, written by faf from your app-type | not required, not scored |
| **Populated** | a real value, e.g. `PostgreSQL` | counts, as filled |

Typing `None` or `N/A` reads as "doesn't apply" to a person, but faf treats it as empty: in a slot that needs a fact, it scores 0. Whether a slot applies is the app-type's call, never the typed word's. This keeps the score honest: nobody can type their way to ✪.

## Typed words

What `faf auto` does with a typed `None`, `N/A`, `not applicable`, `unknown` or `"null"` (faf-cli 7.13+):

- **A tech slot your app-type uses** (every slot except the 6 Ws): if it's a fact, fill the slot. When the repo has the fact, `faf auto` fills it in place of your words. With no fact, your words stay exactly as typed, comment included, and the slot counts as empty.
- **A tech slot your app-type leaves out:** the app-type's decision is the fact. `faf auto` writes `slotignored` in place of your words (the comment stays). A real value there is kept.
- **The 6 Ws** (`human_context.*`) are yours: `faf auto` never replaces typed words there; `faf go` asks for the empty ones.
- The `library` type faf falls back to when a repo has no classifying signal (`type: library # found: no classifying signals — fallback`) decides no slot while its line carries that note. Set the type yourself, and it decides.

`faf score` prints one line per slot that holds typed words:

```
stack.database says 'None' — this app-type needs it, so it counts as empty until filled.
stack.database says 'None' — this app-type doesn't use it; faf auto marks it slotignored.
```

## Example: a CLI tool

```yaml
project:
  name: my-cli
  goal: Format logs for humans
  main_language: TypeScript
  type: cli                     # app-type: project, human and universal count (12 slots)
human_context:
  who: Backend developers       # …and the rest of the 6 Ws
stack:
  hosting: npm
  build: tsc
  cicd: GitHub Actions
  database: slotignored         # written by faf; not a cli slot
  css_framework: slotignored    # written by faf
```

With all 12 active slots filled, the score is 100% ✪. If `cicd` were `None` instead, it would be 11 of 12: 92% ◇.

## What changed

- **February 2026 (v4.2.1):** a typed `None` ignored a slot; `Score = (Filled + Ignored) / 21`; per-type lists of slots to set to `None`; a planned `.slotignore` file.
- **Now:** the app-type alone decides `slotignored`; a typed `None` / `N/A` is empty; `Score = filled ÷ active`, across 33 slots.

The February text is in git history.
