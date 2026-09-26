<!-- faf:start -->
<!-- faf: faf-cli | TypeScript | cli | CLI for IANA-registered `.faf` + `.fafm` — context DNA and portable agent memory. TypeScript, Bun-native since v6. package faf-cli v7.16.2 The Discoverable Edition. -->
<!-- faf: claim=project.faf | family=FAF -->

# AGENTS.md — faf-cli

CLI for IANA-registered `.faf` + `.fafm` — context DNA and portable agent memory. TypeScript, Bun-native since v6. package faf-cli v7.16.2 The Discoverable Edition. — TypeScript · type: cli · v7.16.2

> Authored by faf — do not edit the managed block; refresh with `faf export --agents`. Hand-written content outside the managed block is preserved.

## Setup & build

```bash
bun install    # install
bun run build    # clean, bundle src/cli.ts to dist, then tsc
bun run dev    # run the CLI from source, no build
```

## Run the tests

```bash
bun run test    # must pass before a change is done
bun run lint    # eslint over src
bun run check:no-hardcode    # fail if a build-machine path leaked into dist
```

## Where things live

| Path | Role |
|------|------|
| `src/cli.ts` | CLI entry (Commander); builds to the `faf` / `faf-cli` bin |
| `src/index.ts` | library entry; builds to `main`, plus the `./pack` export |
| `src/commands/` | one file per faf subcommand (39) |
| `src/commands/memory.ts` | `faf memory`, the `.fafm` surface |
| `src/core/` | domain engines (drift, faf-dna, faf-source, cwd-guard) |
| `src/detect/` | stack and project detection, per language |
| `src/fafm/` | the `.fafm` library (soul, from-claude-dir, types) |
| `src/interop/` | the context authors (agents, claude, gemini, cards, copilot) |
| `src/interrogate/` | extractors that read a repo's own files for facts (readme, cargo, compose, env) |
| `src/ui/` | terminal output (colors, display, progress, star-nudge) |
| `src/wasm/` | bridge to faf-scoring-kernel; scoring lives there, not in TS |
| `package.json` | scripts, and the bin that maps `faf` to dist/cli.js |
| `project.faf` | this file; the DNA every author reads from |

## Conventions

- **Architecture:** Domain-model first; single-source engines composed, never reimplemented.
- **Testing:** WJTTC — zero errors always; bun test green before any ship.
- **Runtime:** Bun-native since v6, TypeScript strict, Rust→WASM scoring kernel.
- **Releases:** Atomic via /pubpro — bump, verify, tag, publish in one motion.

## Guardrails

- Use bun, not npm — this repo is Bun-native since v6.
- TypeScript strict; zero type errors, zero test failures — always.
- Scoring is a Rust→WASM kernel — compose it, never reimplement scoring in TS.
- FAF authors — never 'generates'. And 'never guessed', not 'not guessed'.
- Never write 'Guaranteed' (any form) — it's banned; it's free software.
- Publish only via /pubpro — never hand-run npm publish.
- **Always OK:** read the tree · run the tests (`bun run test`) · build the project · `bun run lint`.
- **Ask first:** dependency installs, deletions, migrations, schema changes, publish/release.
- **Never:** force-push · push straight to `main` (branch and open a PR) · commit secrets.

## Definition of Done

Done when: `bun run lint` exits 0 · `bun run check:no-hardcode` exits 0 · `bun run test` passes · changes committed with a conventional message.

## When stuck

Ask a clarifying question, propose a short plan, or open a draft PR with notes — do not push large speculative changes to `main`.

## Commit & PR

- Conventional Commits preferred (`feat:`, `fix:`, `chore:`, …).
- Branch off `main` and open a PR — never commit to `main` directly.
- If build/test scripts or layout change, refresh this file in the **same PR** (`faf export --agents`).
<!-- faf:end -->

## Ship-adjacent

When a change touches build output or the publish path, `bun run check:no-hardcode`
is the one that matters — a build-machine path in `dist/` ships to every user.

`.faf` and `.fafm` are IANA-registered: `application/vnd.faf+yaml` and
`application/vnd.fafm+yaml`.
