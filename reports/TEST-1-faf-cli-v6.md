# TEST-1: faf-cli v6.0.0-alpha.0 — Full Test Report

**Date:** 2026-03-22
**Branch:** v6
**Runner:** bun test v1.3.5
**Kernel:** faf-scoring-kernel 2.0.0
**Duration:** 9.47s

## Result

```
218 pass
  0 fail
  1223 expect() calls
  37 files
```

## Test Files by Layer

### commands/ (26 files — 1 per command)

| # | File | Tests | Status |
|---|------|-------|--------|
| 1 | `tests/commands/auto.test.ts` | 3 | PASS |
| 2 | `tests/commands/check.test.ts` | 4 | PASS |
| 3 | `tests/commands/clear.test.ts` | — | PASS |
| 4 | `tests/commands/compile.test.ts` | — | PASS |
| 5 | `tests/commands/conductor.test.ts` | 4 | PASS |
| 6 | `tests/commands/context.test.ts` | — | PASS |
| 7 | `tests/commands/convert.test.ts` | — | PASS |
| 8 | `tests/commands/decompile.test.ts` | 3 | PASS |
| 9 | `tests/commands/demo.test.ts` | 2 | PASS |
| 10 | `tests/commands/drift.test.ts` | — | PASS |
| 11 | `tests/commands/edit.test.ts` | — | PASS |
| 12 | `tests/commands/export.test.ts` | 4 | PASS |
| 13 | `tests/commands/formats.test.ts` | — | PASS |
| 14 | `tests/commands/git.test.ts` | 3 | PASS |
| 15 | `tests/commands/go.test.ts` | 5 | PASS |
| 16 | `tests/commands/info.test.ts` | 3 | PASS |
| 17 | `tests/commands/init.test.ts` | — | PASS |
| 18 | `tests/commands/migrate.test.ts` | 3 | PASS |
| 19 | `tests/commands/pro.test.ts` | 6 | PASS |
| 20 | `tests/commands/recover.test.ts` | 3 | PASS |
| 21 | `tests/commands/score.test.ts` | 4 | PASS |
| 22 | `tests/commands/search.test.ts` | 5 | PASS |
| 23 | `tests/commands/share.test.ts` | 2 | PASS |
| 24 | `tests/commands/sync.test.ts` | — | PASS |
| 25 | `tests/commands/taf.test.ts` | 2 | PASS |
| 26 | `tests/commands/ai.test.ts` | 3 | PASS |

### core/ (4 files)

| File | Status |
|------|--------|
| `tests/core/schema.test.ts` | PASS |
| `tests/core/scorer.test.ts` | PASS |
| `tests/core/slots.test.ts` | PASS |
| `tests/core/tiers.test.ts` | PASS |

### detect/ (2 files)

| File | Status |
|------|--------|
| `tests/detect/frameworks.test.ts` | PASS |
| `tests/detect/scanner.test.ts` | PASS |

### interop/ (2 files)

| File | Status |
|------|--------|
| `tests/interop/claude.test.ts` | PASS |
| `tests/interop/faf.test.ts` | PASS |

### wasm/ (1 file)

| File | Status |
|------|--------|
| `tests/wasm/kernel.test.ts` | PASS |

### e2e (1 file)

| File | Tests | Status |
|------|-------|--------|
| `tests/e2e.test.ts` | 24 | PASS |

### meta (1 file)

| File | Status |
|------|--------|
| `tests/meta.test.ts` | PASS |

## 26 Commands — All Registered, All Tested

| # | Command | Description | Phase |
|---|---------|-------------|-------|
| 1 | `init` | Create .faf from your project | Core |
| 2 | `auto` | Zero to 100% in one command | Core |
| 3 | `go` | Guided interview to gold code | C |
| 4 | `score` | Score a .faf file | Core |
| 5 | `sync` | .faf ↔ CLAUDE.md bi-sync | Core |
| 6 | `compile` | Compile .faf to .fafb binary | Power |
| 7 | `decompile` | Decompile .fafb to JSON | Power |
| 8 | `git` | Instant .faf from any GitHub repo | Power |
| 9 | `export` | Generate AGENTS.md, .cursorrules, GEMINI.md | Power |
| 10 | `check` | Validate .faf file | Power |
| 11 | `info` | Show version and system info | Power |
| 12 | `formats` | Show supported formats | A |
| 13 | `clear` | Clear cached data | A |
| 14 | `convert` | Convert .faf to other formats | A |
| 15 | `context` | Generate context output | A |
| 16 | `drift` | Check context drift | A |
| 17 | `edit` | Edit .faf fields | A |
| 18 | `recover` | Recover .faf from context files | B |
| 19 | `migrate` | Migrate .faf to latest version | B |
| 20 | `pro` | Pro features & licensing | B |
| 21 | `share` | Share .faf via URL | B |
| 22 | `demo` | Demo walkthrough | B |
| 23 | `search` | Search slots and formats | B |
| 24 | `taf` | Test Archive Format receipt | B |
| 25 | `ai` | AI-powered features (enhance/analyze) | C |
| 26 | `conductor` | Conductor integration | C |

## E2E Golden Path

The `e2e.test.ts` runs the full lifecycle in one test:

```
init → auto → score → edit → sync → export → convert → compile → decompile → taf → share → search → formats → recover → migrate → demo → info → pro → clear → conductor
```

24 e2e tests covering all command interactions. All pass.

## Architecture

```
src/           3,229 lines   (26 commands + 6 layers)
tests/         2,063 lines   (37 files + e2e)
total          5,292 lines
```

Previous v5: 71,326 lines. Reduction: 93%.

## Errors Found

None.

---

*faf-cli v6.0.0-alpha.0 — 218/218 — TEST-1 COMPLETE*
