# AGENTS.md — faf-cli

CLI for the IANA-registered `.faf` format (`application/vnd.faf+yaml`) — TypeScript · Bun-native since v6 · npm package `faf-cli` **v7.1.4**.

## Setup & build

```bash
bun install
bun run build    # clean → bun build cli+index → tsc (dist/)
bun run dev      # bun src/cli.ts
```

## Run the tests

```bash
bun run test     # bun test --timeout=120000 — must pass before a change is done
bun run lint     # eslint src/**/*.ts
```

Ship-adjacent (when touching build output or publish path):

```bash
bun run check:no-hardcode   # fail if machine paths leaked into dist/
```

## Where things live

| Path | Role |
|------|------|
| `src/cli.ts` | CLI entry (Commander) |
| `src/index.ts` | Library entry |
| `src/commands/` | One file per `faf` subcommand (`init`, `score`, `export`, `sync`, …) |
| `src/core/` | Domain engines (slots, scorer, types, schema) — compose, don’t fork |
| `src/detect/` | Stack / project detection |
| `src/interop/` | Context emitters (`agents.ts`, `claude.ts`, `gemini.ts`, …) |
| `src/wasm/` | Bridge to `faf-scoring-kernel` (Rust→WASM) — scoring lives here, not reimplemented in TS |
| `src/ui/` | Terminal UI helpers |
| `package.json` | Scripts, bin (`faf` / `faf-cli` → `dist/cli.js`) |
| `project.faf` | Project DNA (keep version/goal honest when they change) |

## Conventions

- **Bun-native** — use `bun`, not `npm`, for install/run/test in this repo.
- **TypeScript strict + ESM** (`"type": "module"`) — obey `tsconfig.json` and ESLint; don’t restyle by hand.
- **Domain-model first** — single-source engines in `src/core/`; compose them from commands; never reimplement scoring in TypeScript (use the WASM kernel).
- **Wording (product copy):** FAF **authors** (never “generates”); **never guessed** (not “not guessed”); never write **Guaranteed** (any form) — free software.
- Match the style of the surrounding file.

## Guardrails

- **Always OK:** read the tree · `bun run test` · `bun run lint` · `bun run build` · edit under `src/` with tests.
- **Ask first:** dependency adds/upgrades · deletions · publish / release / tag · changes to scoring kernel integration · dual-publish (`faf` ↔ `faf-cli`) path.
- **Never:** force-push · push straight to `main` (branch and open a PR) · commit secrets · hand-run `npm publish` (releases go through **`/pubpro` only**) · reimplement scoring outside `faf-scoring-kernel` / `src/wasm/`.

## Definition of Done

Done when:

1. `bun run lint` exits 0  
2. `bun run test` passes  
3. If you touched the build/publish surface: `bun run build` and `bun run check:no-hardcode` pass  
4. Change is on a branch with a clear conventional commit (`feat:`, `fix:`, `chore:`, …)

## When stuck

Ask a clarifying question, propose a short plan, or open a draft PR with notes — do not push large speculative changes to `main`.

## Commit & PR

- Conventional Commits preferred.
- One logical change per PR when practical.
- If you change `package.json` scripts, layout under `src/`, or publish gates — update this file in the **same PR**.
