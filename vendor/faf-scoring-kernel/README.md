# faf-scoring-kernel

**faf-scoring-kernel v3.0.0 — The Always33 Edition**

One engine, one number: `score_faf` is always-33, so a repo scores the same in every FAF app.

WASM from the FAF Rust workspace. Scores `.faf` against all 33 slots and compiles `.fafb`. `.faf` is IANA-registered as `application/vnd.faf+yaml`.

## What's New — v3.0.0

One engine, one number: `score_faf` is always-33, so a repo scores the same in every FAF app.

- `score_faf` → always-33 — the same score as faf-kernel, the Rust SDK and the MCP servers
- `score_faf_enterprise` → alias of `score_faf` (existing callers keep working)
- `score_fafb` → agrees with `score_faf`
- `tbd` / `todo` count as empty (placeholders)
- Engine `sdk_version()` is **3.1.0** (the `faf-wasm-sdk` crate this WASM was built from)

**Upgrading from 2.x:** a `.faf` without its 12 enterprise `slotignored` markers now scores against all 33 slots, so its number can drop (100 → 64). Mark the slots that don't apply as `slotignored` — a 21-slot project carries the 12 enterprise slots that way — and the score returns.

## Install

```bash
npm install faf-scoring-kernel
```

Node.js 16+ and Bun.

## Usage

```javascript
const kernel = require('faf-scoring-kernel');

const yaml = `faf_version: 2.5.0
project:
  name: my-app
  goal: Ship a fast CLI
  main_language: Rust
`;

const result = JSON.parse(kernel.score_faf(yaml));
console.log(result.score, result.populated, '/', result.active); // active = 33 minus slotignored

const bytes = kernel.compile_fafb(yaml);
console.log(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])); // FAFB
console.log(JSON.parse(kernel.decompile_fafb(bytes)).version);           // 2.0
```

## API

8 pure-function exports. No classes. No state.

| Function | Input | Output |
|----------|-------|--------|
| `sdk_version()` | — | engine version string (`3.1.0`) |
| `score_faf(yaml)` | YAML string | JSON — always-33 |
| `score_faf_enterprise(yaml)` | YAML string | JSON — same as `score_faf` |
| `validate_faf(yaml)` | YAML string | `boolean` |
| `compile_fafb(yaml)` | YAML string | `Uint8Array` — FAFb v2 |
| `decompile_fafb(bytes)` | `Uint8Array` | JSON string |
| `score_fafb(bytes)` | `Uint8Array` | JSON string — same score as `score_faf` |
| `fafb_info(bytes)` | `Uint8Array` | JSON — header + section table |

## Tiers

| Score | Tier |
|-------|------|
| 100% | ✪ Trophy |
| 99% | ★ Gold |
| 95% | ◆ Silver |
| 85% | ◇ Bronze |
| 70% | ● Green |
| 55% | ● Yellow |
| 1% | ○ Red |
| 0% | ♡ White |

✪ is the work glyph for 100%. Same score as 🏆 on social surfaces.

## Links

- [faf.one](https://faf.one) · [the format spec](https://faf.one/spec)
- [Source](https://github.com/Wolfe-Jam/faf-rust) — `crates/faf-wasm-sdk` (engine) · `npm/faf-scoring-kernel` (this package)
- [IANA](https://www.iana.org/assignments/media-types/application/vnd.faf+yaml) — `application/vnd.faf+yaml`
- [faf-cli](https://www.npmjs.com/package/faf-cli) vendors this WASM

## License

MIT
