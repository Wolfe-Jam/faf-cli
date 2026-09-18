# faf-scoring-kernel 2.1.0 (vendored)

WASM built from `~/FAF/faf-rust/crates/faf-wasm-sdk` against `faf-fafb` 1.0.4.

- `compile_fafb` emits **FAFb wire v2**
- `score_faf` is 21-slot base; `score_faf_enterprise` is 33-slot Mk4

Rebuild:

```bash
# wasm-opt -all emits stringref (Node 20 rejects). Crate metadata has wasm-opt = false.
wasm-pack build --target nodejs --release --out-dir /tmp/faf-scoring-kernel-v2
# copy faf_wasm_sdk* into this directory
```
