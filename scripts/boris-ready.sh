#!/usr/bin/env bash
# 🏎️ BORIS-READY / BORIS-FLOW — local smoke gate for /pubpro
#
# Fast, hermetic, no global install, no Homebrew.
# Uses the built dist/cli.js (or $FAF_CLI override).
#
# Replaces the historical boris-ready that:
#   - npm install -g + brew upgrade (slow, mutates machine, hung on pubpro)
#   - grep version "3\." (wrong major since v4+)
#   - human-set / enhance (removed commands)
#
# Exit 0 only when ALL checks pass. Message: BORIS-FLOW: ALL N TESTS PASSED
#
# Usage (from repo root):
#   npm run build && ./scripts/boris-ready.sh
#   FAF_CLI=./dist/cli.js ./scripts/boris-ready.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${FAF_CLI:-$ROOT/dist/cli.js}"
PASS=0
FAIL=0
DEMO_DIR=""

cleanup() {
  if [[ -n "${DEMO_DIR:-}" && -d "$DEMO_DIR" ]]; then
    if [[ $FAIL -eq 0 ]]; then
      rm -rf "$DEMO_DIR"
    else
      echo "⚠️  Debug: preserved $DEMO_DIR"
    fi
  fi
}
trap cleanup EXIT

ok() {
  echo "✅ $1"
  PASS=$((PASS + 1))
}

die() {
  echo "❌ $1"
  FAIL=$((FAIL + 1))
  exit 1
}

run() {
  # shellcheck disable=SC2086
  node "$CLI" "$@"
}

echo "🏎️ BORIS-FLOW (local smoke)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CLI: $CLI"
echo ""

# ── 0. Preconditions ─────────────────────────────────────────────
[[ -f "$CLI" ]] || die "dist/cli.js missing — run: npm run build (or set FAF_CLI)"
PKG_VER="$(node -p "require('$ROOT/package.json').version")"
ok "package.json version $PKG_VER"

# ── 1. Version ───────────────────────────────────────────────────
echo "1️⃣  version"
OUT="$(run --version 2>&1 || true)"
echo "   → $OUT"
echo "$OUT" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+' || die "version not semver (got: $OUT)"
echo "$OUT" | grep -qF "$PKG_VER" || die "version $OUT != package.json $PKG_VER"
ok "faf --version == $PKG_VER"

# ── 2. Score self (repo) ─────────────────────────────────────────
echo "2️⃣  score (this repo)"
SCORE_JSON="$(cd "$ROOT" && run score --json 2>&1)"
echo "$SCORE_JSON" | node -e '
const d=JSON.parse(require("fs").readFileSync(0,"utf8"));
if(typeof d.score!=="number") process.exit(1);
if(!d.tier||!d.tier.name) process.exit(2);
console.log("score="+d.score+" tier="+d.tier.name);
' || die "score --json unparsable"
# Trophy on the cli itself is the pubpro floor
SELF_SCORE="$(echo "$SCORE_JSON" | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).score")"
[[ "$SELF_SCORE" -ge 99 ]] || die "repo score $SELF_SCORE < 99 (pubpro floor)"
ok "repo score $SELF_SCORE ≥ 99"

# ── 3. Fresh TS project: init + auto ─────────────────────────────
echo "3️⃣  init + auto (fresh TS project)"
DEMO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/boris-flow.XXXXXX")"
mkdir -p "$DEMO_DIR/src"
cat > "$DEMO_DIR/package.json" <<'EOF'
{
  "name": "boris-flow-demo",
  "version": "1.0.0",
  "type": "module",
  "bin": { "myapp": "./dist/cli.js" },
  "dependencies": { "commander": "^12.0.0" },
  "devDependencies": { "typescript": "^5.0.0" }
}
EOF
echo 'export const app = "hello";' > "$DEMO_DIR/src/index.ts"
echo '{"compilerOptions":{"strict":true}}' > "$DEMO_DIR/tsconfig.json"
echo "# Demo" > "$DEMO_DIR/CLAUDE.md"

(
  cd "$DEMO_DIR"
  run init >/dev/null
  [[ -f project.faf ]] || exit 1
  run auto >/dev/null
  run score --json
) > "$DEMO_DIR/score.json" 2>"$DEMO_DIR/err.log" || {
  cat "$DEMO_DIR/err.log" >&2
  die "init/auto failed in demo dir"
}
[[ -f "$DEMO_DIR/project.faf" ]] || die "project.faf missing after init"
ok "init + auto wrote project.faf"

# ── 4. Go detection (7.3.0 claim) ────────────────────────────────
echo "4️⃣  Go detection (go.mod + gin → backend)"
GO_DIR="$(mktemp -d "${TMPDIR:-/tmp}/boris-go.XXXXXX")"
cat > "$GO_DIR/go.mod" <<'EOF'
module example.com/boris-api

go 1.22

require github.com/gin-gonic/gin v1.10.0
EOF
(
  cd "$GO_DIR"
  run init >/dev/null
  grep -q 'main_language: Go' project.faf || exit 1
  grep -q 'type: backend' project.faf || exit 1
  grep -qi 'Gin\|gin' project.faf || exit 1
) || {
  rm -rf "$GO_DIR"
  die "Go Gin project not classified as backend"
}
rm -rf "$GO_DIR"
ok "Go Gin → backend (content-aware)"

# ── 5. Pure Go library (never blindly backend) ───────────────────
echo "5️⃣  Go library brake"
GO_LIB="$(mktemp -d "${TMPDIR:-/tmp}/boris-golib.XXXXXX")"
cat > "$GO_LIB/go.mod" <<'EOF'
module example.com/boris-lib

go 1.22
EOF
(
  cd "$GO_LIB"
  run init >/dev/null
  grep -q 'main_language: Go' project.faf || exit 1
  # pure module must NOT be forced backend
  if grep -q 'type: backend' project.faf; then exit 2; fi
  grep -qE 'type: (library|cli)' project.faf || exit 3
) || {
  CODE=$?
  rm -rf "$GO_LIB"
  die "Go library misclassified (exit $CODE)"
}
rm -rf "$GO_LIB"
ok "pure go.mod → not backend"

# ── 6. Dart pure package brake (regression) ──────────────────────
echo "6️⃣  Dart pure package brake"
DART_DIR="$(mktemp -d "${TMPDIR:-/tmp}/boris-dart.XXXXXX")"
cat > "$DART_DIR/pubspec.yaml" <<'EOF'
name: pure_pkg
dependencies:
  collection: ^1.18.0
EOF
(
  cd "$DART_DIR"
  run init >/dev/null
  grep -q 'main_language: Dart' project.faf || exit 1
  if grep -qi 'Flutter' project.faf; then
    # allow Flutter only if falsely in found — hard fail if type mobile
    grep -q 'type: mobile' project.faf && exit 2
  fi
  grep -q 'type: library' project.faf || exit 3
) || {
  CODE=$?
  rm -rf "$DART_DIR"
  die "pure Dart misclassified (exit $CODE)"
}
rm -rf "$DART_DIR"
ok "pure pubspec → Dart library (not Flutter mobile)"

# ── 7. formats / info ────────────────────────────────────────────
echo "7️⃣  formats + info"
run formats >/dev/null || die "faf formats failed"
run info >/dev/null || die "faf info failed"
ok "formats + info"

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BORIS-FLOW: ALL $PASS TESTS PASSED"
echo "Safe for /pubpro (local smoke). Full suite remains: npm test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0
