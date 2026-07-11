<!-- faf:start -->
<!-- faf: faf-cli v6 | TypeScript | cli | CLI for the `.faf` format — persistent AI context that versions with your code, and (v6.7, The HTML Edition) renders human-visible on-demand via `faf show`. IANA-registered media type: `application/vnd.faf+yaml`. -->
<!-- faf: claim=project.faf | family=FAF -->

# AGENTS.md — faf-cli v6

CLI for the `.faf` format — persistent AI context that versions with your code, and (v6.7, The HTML Edition) renders human-visible on-demand via `faf show`. IANA-registered media type: `application/vnd.faf+yaml`. — TypeScript · type: cli

> Authored by faf — do not edit directly; refresh with `faf export --agents`.

## Setup & build

```bash
bun run build    # build
bun run dev    # dev
```

## Run the tests

```bash
bun run test
```

## Where things live

- `package.json`
- `src/index.ts`
- `src/cli.ts`
- `README.md`
- `tsconfig.json`

## Conventions

- **Architecture:** Domain-model first; single-source engines composed, never reimplemented.
- **Testing:** WJTTC — zero errors always; bun test green before any ship.
- **Runtime:** Bun-native, TypeScript strict, Rust→WASM scoring kernel.
- **Releases:** Atomic via /pubpro — bump, verify, tag, publish in one motion.
- TypeScript strict mode (tsconfig.json)
- ESM modules (`type: module`)
- Style enforced by ESLint · Prettier — obey the configs

## Guardrails

- Use bun, not npm — this repo is Bun-native (same toolchain as Claude Code).
- TypeScript strict; zero type errors, zero test failures — always.
- Scoring is a Rust→WASM kernel — compose it, never reimplement scoring in TS.
- FAF authors — never 'generates'. And 'never guessed', not 'not guessed'.
- Never write 'Guaranteed' (any form) — it's banned; it's free software.
- Publish only via /pubpro — never hand-run npm publish.
- **Ask first:** dependency installs, deletions, migrations, schema changes.
- **Never:** force-push, push to `main`, commit secrets.

## Definition of Done

Done when: `bun run lint` exits 0 · `bun run test` passes · changes committed with a conventional message.

## Human Context

- **Who:** Developers and teams using AI coding assistants
- **What:** Persistent AI Context Standard — project DNA for AI. IANA-registered. Anthropic-merged.
- **Why:** Eliminates 91% context re-discovery tax — define once, AI remembers forever
- **Where:** npm registry, Homebrew, GitHub
- **When:** Production since September 2025; v7.0 The GIT Version, June 2026
- **How:** bunx faf-cli auto, then project.faf versions with your code — faf show renders it human-visible
<!-- faf:end -->
