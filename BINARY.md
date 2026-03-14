# Binary Notes — faf-cli Compiled Binaries

## 2026-03-14 | Phase 2 Complete

---

## What

faf-cli compiles to standalone binaries via `bun build --compile`. Zero runtime dependencies. One download, it works. Same distribution model as Claude Code.

## GitHub Release

https://github.com/Wolfe-Jam/faf-cli/releases/tag/v5.0.6-bun

## Binaries

| Platform | Target Flag | File | Size |
|----------|-------------|------|------|
| macOS Apple Silicon | `bun-darwin-arm64` | `faf-darwin-arm64` | 60MB |
| macOS Intel | `bun-darwin-x64` | `faf-darwin-x64` | 66MB |
| Linux x64 | `bun-linux-x64` | `faf-linux-x64` | 102MB |
| Windows x64 | `bun-windows-x64` | `faf-windows-x64.exe` | 113MB |

Sizes include the embedded Bun runtime (~50-90MB). Same tradeoff Claude Code makes.

## Build Commands

```bash
# Build first (needs dist/cli.js)
npm run build

# Build for current platform
npm run build:bun

# Cross-compile all 4 targets
npm run build:bun:all

# Or individually:
bun build --compile dist/cli.js --outfile faf-bun
bun build --compile --target=bun-darwin-arm64 dist/cli.js --outfile faf-darwin-arm64
bun build --compile --target=bun-darwin-x64 dist/cli.js --outfile faf-darwin-x64
bun build --compile --target=bun-linux-x64 dist/cli.js --outfile faf-linux-x64
bun build --compile --target=bun-windows-x64 dist/cli.js --outfile faf-windows-x64.exe
```

## Prerequisites

- `npm run build` first (needs `dist/cli.js` to exist)
- Bun installed (`bun --version` — built with v1.3.5)
- Cross-compile downloads target runtimes on first run (~20-40MB each, cached after)

## What's Inside

The compiled binary bundles:
- 800 npm modules (all TypeScript source)
- Bun runtime
- @faf/engine (Mk3.1 scorer)
- All 64 CLI commands

**NOT inside:**
- No xai-faf-rust code (Mk4 scorer is not embedded — yet, see Phase 3)
- No proprietary IP
- No Rust binaries
- No WASM (yet)

## Licensing

- faf-cli: MIT
- All 417 dependencies: permissive (MIT, ISC, Apache-2.0, BSD)
- Bun runtime: MIT
- Safe for binary redistribution

## Verification

All Top 6 commands verified against compiled binary:

| Command | Status |
|---------|--------|
| `./faf-bun init` | Pass |
| `./faf-bun git <url>` | Pass |
| `./faf-bun auto` | Pass |
| `./faf-bun go` | Pass |
| `./faf-bun bi-sync` | Pass |
| `./faf-bun score` | Pass |

Full test suite: 1,143/1,143 passing, 50/50 suites.

No incompatibilities found on first compile — __dirname, commander, readline, crypto, YAML parsing all work.

## Local Binaries

Binaries are `.gitignore`d. After building locally, delete them when done:

```bash
rm faf-bun faf-darwin-* faf-linux-* faf-windows-*
```

They live on GitHub Release. Rebuild anytime with `npm run build:bun:all`.

## Distribution Channels

| Channel | Primary? | npm count? | Notes |
|---------|----------|------------|-------|
| npm | Yes | Yes | `npm install -g faf-cli` — the metric (36k+) |
| bunx | Yes | Yes | `bunx faf-cli auto` — zero install magic |
| Compiled binaries | Secondary | No | GitHub Release — CI/CD, Docker, air-gapped |
| Homebrew | Exists | Yes | Wraps npm, so counts. Don't change to binary. |
| Install script | Future | No | `curl faf.one/install.sh` — build when demand pulls |

**Rule:** npm download count is the key metric. Never replace npm with a channel that doesn't count.

## Known Gotchas

1. **Cross-compile downloads runtimes** — first build for a new target downloads ~20-40MB. Network required. Cached after.
2. **ARM64 can't run on x64** — `bad CPU type in executable` is expected when testing arm64 binary on Intel Mac. Not a bug.
3. **Binary size is large** — 60-113MB because Bun runtime is embedded. This is the same tradeoff Claude Code makes.
4. **Homebrew formula is still npm-based** — don't update it to point at compiled binaries or you lose npm download counts.

---

*Built on Friday the 13th. Shipped on Saturday the 14th. 2026-03-14.*
