# N/A slots (`slotignored`)

> **Source of truth:** [`src/core/slots.ts`](../src/core/slots.ts). How the score works: [SCORING.md](./SCORING.md).
>
> **Updated 2026-09-12.** This replaces the February 2026 spec (v4.2.1), which said typing `None` ignores a slot. It doesn't — see below.

## What N/A means

Some slots don't apply to some projects: a CLI has no CSS framework, a static site has no database. Those slots are **N/A** and are left out of the score. In the file, faf writes them as `slotignored`.

## Who decides

**Your app-type — nothing else.** `project.type` selects which slot categories count (the table is in [SCORING.md](./SCORING.md)). `faf init`, `faf auto` and `faf git` mark every slot outside those categories as `slotignored`.

You don't write `slotignored` to skip a slot you haven't filled. If a slot that doesn't fit your project is being counted, the app-type is wrong: fix `project.type` (for example `faf edit project.type cli`), then run `faf auto`.

## The three states

| State | In the file | Effect on the score |
|---|---|---|
| **Filled** | a real value, e.g. `PostgreSQL` | counts, as filled |
| **N/A** | `slotignored`, written by faf from your app-type | left out |
| **Empty** | missing, `''`, or a typed `None` / `N/A` / `null` / `unknown` / `not applicable` | counts, as empty |

Typing `None` or `N/A` reads as "doesn't apply" to a person, but faf treats it as empty. Whether a slot applies is the app-type's call, never the typed word's. This keeps the score honest: nobody can type their way to ✪.

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
  database: slotignored         # N/A — written by faf; not a cli slot
  css_framework: slotignored    # N/A — written by faf
```

With all 12 active slots filled, the score is 100% ✪. If `cicd` were `None` instead, it would be 11 of 12: 92% ◇.

## What changed

- **February 2026 (v4.2.1):** a typed `None` ignored a slot; `Score = (Filled + Ignored) / 21`; per-type lists of slots to set to `None`; a planned `.slotignore` file.
- **Now:** the app-type alone decides N/A; a typed `None` / `N/A` is empty; `Score = filled ÷ active`, across 33 slots.

The February text is in git history.
