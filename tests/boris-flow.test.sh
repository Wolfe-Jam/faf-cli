#!/bin/bash
# 🏎️ BORIS-FLOW TEST SCRIPT
# Complete integration test for demo readiness
# Named after Boris (Claude Code creator at Anthropic)

set -e

echo "🏎️ BORIS-FLOW INTEGRATION TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Determine CLI to use
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$CLI_DIR/dist/cli.js" ]; then
  FAF_CLI="node $CLI_DIR/dist/cli.js"
  echo "📦 Using local build: $CLI_DIR/dist/cli.js"
elif command -v faf &> /dev/null; then
  FAF_CLI="faf"
  echo "📦 Using installed faf"
else
  echo "❌ No faf CLI found"
  exit 1
fi

PASS=0
FAIL=0
TEST_DIR="/tmp/boris-flow-test-$$"

cleanup() {
  if [ $FAIL -eq 0 ]; then
    rm -rf "$TEST_DIR"
  else
    echo ""
    echo "⚠️  Test dir preserved: $TEST_DIR"
  fi
}
trap cleanup EXIT

check() {
  if [ $? -eq 0 ]; then
    echo "✅ $1"
    PASS=$((PASS + 1))
    return 0
  else
    echo "❌ $1"
    FAIL=$((FAIL + 1))
    return 1
  fi
}

run_faf() {
  (cd "$TEST_DIR" && $FAF_CLI "$@")
}

# Test 1: Version check
echo "1️⃣  Testing --version..."
VERSION=$($FAF_CLI --version 2>&1)
echo "$VERSION" | grep -qE "^[0-9]+\.[0-9]+\.[0-9]+"
check "faf --version (got: $VERSION)"

# Test 2: Create project structure (Claude Code 2.1.0+)
echo ""
echo "2️⃣  Creating Claude Code 2.1.0 project..."
mkdir -p "$TEST_DIR/.claude/agents" "$TEST_DIR/.claude/skills" "$TEST_DIR/.claude/commands" "$TEST_DIR/src"

cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "boris-flow-test",
  "version": "1.0.0",
  "description": "CLI for AI context",
  "bin": { "myapp": "./dist/cli.js" },
  "dependencies": { "commander": "^12.0.0" },
  "devDependencies": { "typescript": "^5.0.0" }
}
EOF

echo 'const app: string = "hello";' > "$TEST_DIR/src/index.ts"
echo '{}' > "$TEST_DIR/tsconfig.json"
echo "# Project" > "$TEST_DIR/CLAUDE.md"
echo "# Reviewer" > "$TEST_DIR/.claude/agents/reviewer.md"
echo "# Runner" > "$TEST_DIR/.claude/agents/test-runner.md"

# Claude Code 2.1.0: Skills with YAML-style allowed-tools
cat > "$TEST_DIR/.claude/skills/deploy.md" << 'EOF'
---
description: Deploy to production
allowed-tools:
  - Bash(npm *)
  - Bash(git *)
  - Read
---
# Deploy Skill
Handles deployment workflows.
EOF

# Claude Code 2.1.0: Commands
cat > "$TEST_DIR/.claude/commands/publish.md" << 'EOF'
---
description: Publish to npm
---
# Publish Command
Run tests then publish.
EOF

check "Created Claude Code 2.1.0 structure"

# Test 3: faf init
echo ""
echo "3️⃣  Testing faf init..."
run_faf init > /dev/null 2>&1
test -f "$TEST_DIR/project.faf"
check "faf init created project.faf"

# Test 4: Type detection
echo ""
echo "4️⃣  Checking type detection..."
TYPE=$(grep "type:" "$TEST_DIR/project.faf" | head -1 | awk '{print $2}')
echo "$TYPE" | grep -q "cli"
check "Detected CLI type (got: $TYPE)"

# Test 5: Language detection
echo ""
echo "5️⃣  Checking language detection..."
LANG=$(grep "main_language:" "$TEST_DIR/project.faf" | head -1 | awk '{print $2}')
test "$LANG" = "TypeScript" -o "$LANG" = "JavaScript"
check "Language detected (got: $LANG)"

# Test 6: Claude Code 2.1.0 detection
echo ""
echo "6️⃣  Checking Claude Code 2.1.0 detection..."
grep -q "claude_code:" "$TEST_DIR/project.faf"
check "claude_code section exists"

grep -q "detected: true" "$TEST_DIR/project.faf"
check "Claude Code detected: true"

SUBAGENTS=$(grep -A 10 "subagents:" "$TEST_DIR/project.faf" | grep "    -" | wc -l | tr -d ' ')
test "$SUBAGENTS" -ge 2
check "Subagents detected (got: $SUBAGENTS)"

# Claude Code 2.1.0: Skills detection
SKILLS=$(grep -A 10 "skills:" "$TEST_DIR/project.faf" | grep "    -" | wc -l | tr -d ' ')
test "$SKILLS" -ge 1
check "Skills detected (got: $SKILLS)"

# Claude Code 2.1.0: Commands detection
COMMANDS=$(grep -A 10 "commands:" "$TEST_DIR/project.faf" | grep "    -" | wc -l | tr -d ' ')
test "$COMMANDS" -ge 1
check "Commands detected (got: $COMMANDS)"

# Test 7: faf auto
echo ""
echo "7️⃣  Testing faf auto..."
# Strip ANSI codes before extracting score
SCORE_BEFORE=$(run_faf score 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "Score:" | grep -oE '[0-9]+/[0-9]+' | head -1 | cut -d'/' -f1)
run_faf auto > /dev/null 2>&1
SCORE_AFTER=$(run_faf score 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "Score:" | grep -oE '[0-9]+/[0-9]+' | head -1 | cut -d'/' -f1)
test "$SCORE_AFTER" -ge "$SCORE_BEFORE"
check "faf auto maintained score ($SCORE_BEFORE → $SCORE_AFTER)"

# Test 8: Fill human context
echo ""
echo "8️⃣  Filling human context..."
run_faf human-set who "CLI developers" . > /dev/null 2>&1
run_faf human-set what "CLI tool" . > /dev/null 2>&1
run_faf human-set why "AI context" . > /dev/null 2>&1
run_faf human-set where "Terminal" . > /dev/null 2>&1
run_faf human-set when "Production" . > /dev/null 2>&1
run_faf human-set how "TypeScript" . > /dev/null 2>&1
check "human-set commands succeeded"

# Test 9: Final score = 100%
echo ""
echo "9️⃣  Testing final score..."
run_faf auto > /dev/null 2>&1
FINAL_SCORE=$(run_faf score 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "Score:" | grep -oE '[0-9]+/[0-9]+' | head -1 | cut -d'/' -f1)
test "$FINAL_SCORE" -eq 100
check "Final score is 100% (got: $FINAL_SCORE%)"

# Test 10: Non-TTY safety
echo ""
echo "🔟 Testing non-TTY safety..."
SCORE_BEFORE=$(run_faf score 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "Score:" | grep -oE '[0-9]+/[0-9]+' | head -1 | cut -d'/' -f1)
echo "" | run_faf enhance > /dev/null 2>&1 || true
SCORE_AFTER=$(run_faf score 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | grep "Score:" | grep -oE '[0-9]+/[0-9]+' | head -1 | cut -d'/' -f1)
test "$SCORE_AFTER" -eq "$SCORE_BEFORE"
check "faf enhance safe in non-TTY ($SCORE_BEFORE → $SCORE_AFTER)"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -eq 0 ]; then
  echo "🏆 BORIS-FLOW: ALL $PASS TESTS PASSED"
  echo ""
  echo "✅ Demo ready"
  echo "✅ Safe to publish"
  echo "   Final score: $FINAL_SCORE%"
  exit 0
else
  echo "❌ FAILED: $FAIL tests"
  exit 1
fi
