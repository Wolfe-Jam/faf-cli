<!-- faf: faf-cli v6 | TypeScript | CLI tool for creating and managing `.faf` files — persistent AI context that versions with your code. IANA-registered media type: `application/vnd.faf+yaml`. -->

# CLAUDE.md — faf-cli v6

## What This Is

CLI tool for creating and managing `.faf` files — persistent AI context that versions with your code. IANA-registered media type: `application/vnd.faf+yaml`.

## Architecture

```
src/
├── cli.ts              ← Entry point, 26 command registrations (Commander.js)
├── commands/           ← 1 file per command, exported function
├── core/               ← Types, slots (33 Mk4), tiers, scorer, schema, pro
├── detect/             ← Framework detection, stack scanner
├── interop/            ← YAML I/O, CLAUDE.md sync, AGENTS.md, GEMINI.md
├── ui/                 ← Colors (#00D4D4), display helpers
└── wasm/               ← faf-scoring-kernel wrapper (Rust → WASM, lazy-loaded)
```

Layer order: `commands → interop → core → wasm`. No upward imports.

## Toolchain

- **Runtime:** Bun (`bunx faf-cli`), Node backward-compatible (`npx faf-cli`)
- **Test:** `bun test` — 348 tests, 40 files
- **Build:** `bun build src/cli.ts --outfile dist/cli.js --target=node --minify`
- **Compile:** `bun build --compile` — standalone binary, 4 platforms
- **WASM:** `faf-scoring-kernel` 2.0.3 — Mk4 33-slot scoring engine (Rust → WASM)

## Key Patterns

- Scoring: WASM kernel does the math. `kernel.score(yaml)` returns `{score, tier, populated, empty, ignored}`.
- Slots: 33 Mk4 slots. `isPlaceholder(value)` checks for empty/placeholder. `slotsByCategory()` groups them.
- Pro gating: `isPro()` checks `FAF_PRO=1` env var. Gates tri-sync only.
- File discovery: `findFafFile(dir)` finds `project.faf` > `*.faf` > `.faf`.
- YAML I/O: `readFaf(path)` / `writeFaf(path, data)` via `yaml` package.
- Tests: All use `os.tmpdir()` — never touch real project files.

## Commands (26)

init, git, auto, go, score, sync, compile, decompile, export, check,
edit, convert, drift, context, recover, migrate, search, share, taf,
demo, ai, pro, conductor, formats, info, clear

## Version

v6.0 — ground-up Bun-native rewrite. v5.2.5 (Sunset Edition) was the final v5.
