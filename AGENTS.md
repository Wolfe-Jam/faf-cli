<!-- faf:start -->
<!-- faf: faf-cli | TypeScript | cli | CLI for IANA-registered .faf + .fafm — context DNA and portable agent memory, scored by the always-33 engine -->
<!-- faf: claim=project.faf | family=FAF -->

# AGENTS.md — faf-cli

CLI for IANA-registered .faf + .fafm — context DNA and portable agent memory, scored by the always-33 engine — TypeScript · type: cli · v8.12.0

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

## Before a release

`npm publish` runs `prepublishOnly` first:

```bash
bun run check:engines && bun run build && bun run check:no-hardcode
```

## CI

The repo's own commands each check runs on a change; everything else is in the workflow files.

`.github/workflows/ci.yml` (on push, pull_request)

```bash
# job test · ubuntu-latest, macos-latest
npm run lint
npm run build
bun test --timeout=120000 2>&1 | tee test-output.txt
# 3 other steps in the file
# job node-compat · ubuntu-latest · node 22.x, 24.x
npm run build
# 3 other steps in the file
# job windows · windows-latest · node 22.x, 24.x
npm run build
# 6 other steps in the file
# job package-managers · ubuntu-latest · manager npm, pnpm, bun
# step "Build and pack"
  set -euo pipefail
  npm run build
  PACK_DIR=$(mktemp -d)
  npm pack --pack-destination "$PACK_DIR" >/dev/null
  echo "TARBALL=$(ls "$PACK_DIR"/faf-cli-*.tgz | head -1)" >> "$GITHUB_ENV"
  echo "EXPECTED=$(node -p "require('./package.json').version")" >> "$GITHUB_ENV"
# 3 other steps in the file
# job taf-recipes · ubuntu-latest · lang rust, maven, gradle, dotnet
npm run build
# 4 other steps in the file
# job taf-workflows · ubuntu-latest
npm run build
# 3 other steps in the file
# job quality · ubuntu-latest
npm run check:engines
npm run lint
npm run format -- --check
# 1 other step in the file
```

Also: `.github/workflows/claude-code-review.yml` (on pull_request) · `.github/workflows/claude.yml` (on issue_comment, pull_request_review_comment, issues, pull_request_review) · `.github/workflows/context7-refresh.yml` (on push, workflow_dispatch) · `.github/workflows/homebrew.yml` (on push) · `.github/workflows/publish-npm.yml` (on release, workflow_dispatch) · `.github/workflows/release.yml` (on push, workflow_dispatch) · and 1 more in `.github/workflows/`.

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
- TypeScript strict mode (tsconfig.json)
- ESM modules (`type: module`)
- Style enforced by ESLint · Prettier — obey the configs

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

## Project facts

The six W's (who, what, why, where, when, how) and the project's other facts are in `project.faf`.
<!-- faf:end -->

## Ship-adjacent

When a change touches build output or the publish path, `bun run check:no-hardcode`
is the one that matters — a build-machine path in `dist/` ships to every user.

`.faf` and `.fafm` are IANA-registered: `application/vnd.faf+yaml` and
`application/vnd.fafm+yaml`.
