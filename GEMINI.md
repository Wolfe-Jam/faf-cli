<!-- faf:start -->
<!-- faf: faf-cli | TypeScript | cli | CLI for IANA-registered .faf + .fafm — context DNA and portable agent memory, scored by the always-33 engine -->
<!-- faf: claim=project.faf | family=FAF -->

# GEMINI.md — faf-cli

> Authored from project.faf — refresh with `faf export --gemini`.

Project: faf-cli
Goal: CLI for IANA-registered .faf + .fafm — context DNA and portable agent memory, scored by the always-33 engine
Language: TypeScript

## Setup & build

```bash
bun install    # install
bun run build    # clean, bundle src/cli.ts to dist, then tsc
bun run dev    # run the CLI from source, no build
```

## Test & verify

```bash
bun run test    # must pass before a change is done
bun run lint    # eslint over src
bun run check:no-hardcode    # fail if a build-machine path leaked into dist
```

## Where things live

- `src/cli.ts — CLI entry (Commander); builds to the `faf` / `faf-cli` bin`
- `src/index.ts — library entry; builds to `main`, plus the `./pack` export`
- `src/commands/ — one file per faf subcommand (39)`
- `src/commands/memory.ts — `faf memory`, the `.fafm` surface`
- `src/core/ — domain engines (drift, faf-dna, faf-source, cwd-guard)`
- `src/detect/ — stack and project detection, per language`
- `src/fafm/ — the `.fafm` library (soul, from-claude-dir, types)`
- `src/interop/ — the context authors (agents, claude, gemini, cards, copilot)`
- `src/interrogate/ — extractors that read a repo's own files for facts (readme, cargo, compose, env)`
- `src/ui/ — terminal output (colors, display, progress, star-nudge)`
- `src/wasm/ — bridge to faf-scoring-kernel; scoring lives there, not in TS`
- `package.json — scripts, and the bin that maps `faf` to dist/cli.js`
- `project.faf — this file; the DNA every author reads from`

## Stack
- Hosting: npm + Homebrew
- Build: Bun (bun build) + tsc
- CI/CD: GitHub Actions

## Before changing things

- Ask first: dependency installs, deletions, migrations, schema changes, publish/release.
- Never: force-push · push straight to `main` · commit secrets.
<!-- faf:end -->
