#!/bin/bash
# 🏎️ Championship Testing: project.type Implementation
# F1-Grade Quality Standards - MUST PASS ALL

set -e  # Exit on any error

CLI_PATH="/Users/wolfejam/FAF/cli/dist/cli.js"
TEST_ROOT="/tmp/faf-project-type-tests"
RESULTS_FILE="/tmp/faf-test-results.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Initialize
rm -rf "$TEST_ROOT"
mkdir -p "$TEST_ROOT"
echo "🏎️ FAF PROJECT.TYPE CHAMPIONSHIP TESTING" > "$RESULTS_FILE"
echo "=========================================" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Test helper
run_test() {
    local test_name="$1"
    local test_dir="$2"
    local expected_type="$3"
    local min_score="$4"
    local max_score="$5"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${YELLOW}[TEST $TESTS_RUN]${NC} $test_name"

    cd "$test_dir"
    rm -f .faf CLAUDE.md .faf-dna

    # Run init
    local output=$($CLI_PATH init --force 2>&1)

    # Extract detected type and score
    local detected_type=$(echo "$output" | grep "Detected project type:" | sed 's/.*Detected project type: //' | sed 's/\x1b\[[0-9;]*m//g')
    local score=$(echo "$output" | grep "Score:" | head -1 | sed 's/.*Score: //' | sed 's/\/.*//' | sed 's/\x1b\[[0-9;]*m//g')

    # Check .faf file for project.type
    local faf_type=$(grep "^  type:" .faf | sed 's/  type: //' || echo "MISSING")

    # Validation
    local test_passed=true
    local errors=""

    if [ "$detected_type" != "$expected_type" ]; then
        errors+="❌ Detection: Expected '$expected_type', got '$detected_type'\n"
        test_passed=false
    fi

    if [ "$faf_type" != "$expected_type" ] && [ "$faf_type" != "MISSING" ]; then
        errors+="❌ .faf field: Expected '$expected_type', got '$faf_type'\n"
        test_passed=false
    fi

    if [ -n "$min_score" ] && [ "$score" -lt "$min_score" ]; then
        errors+="❌ Score too low: Expected >=$min_score, got $score\n"
        test_passed=false
    fi

    if [ -n "$max_score" ] && [ "$score" -gt "$max_score" ]; then
        errors+="❌ Score too high: Expected <=$max_score, got $score\n"
        test_passed=false
    fi

    # Report
    if [ "$test_passed" = true ]; then
        echo -e "${GREEN}✅ PASS${NC} - Type: $detected_type, Score: $score"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "[PASS] $test_name - Type: $detected_type, Score: $score" >> "$RESULTS_FILE"
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo -e "$errors"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "[FAIL] $test_name" >> "$RESULTS_FILE"
        echo -e "$errors" >> "$RESULTS_FILE"
    fi

    echo "" >> "$RESULTS_FILE"
}

echo ""
echo "🏁 TIER 1: BRAKE SYSTEMS - Backward Compatibility"
echo "=================================================="

# Test 1: React TypeScript project
TEST_DIR="$TEST_ROOT/react-ts"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "test-react-ts",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF
echo 'const App = () => <div>Hello</div>;' > "$TEST_DIR/App.tsx"
run_test "React TypeScript" "$TEST_DIR" "react-ts" 40 60

# Test 2: Svelte project
TEST_DIR="$TEST_ROOT/svelte"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "test-svelte",
  "dependencies": {
    "svelte": "^4.0.0"
  }
}
EOF
echo '<script>let count = 0;</script>' > "$TEST_DIR/App.svelte"
run_test "Svelte" "$TEST_DIR" "svelte" 35 60

# Test 3: Python FastAPI
TEST_DIR="$TEST_ROOT/python-fastapi"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/requirements.txt" << 'EOF'
fastapi==0.104.0
uvicorn==0.24.0
EOF
cat > "$TEST_DIR/main.py" << 'EOF'
from fastapi import FastAPI
app = FastAPI()
EOF
run_test "Python FastAPI" "$TEST_DIR" "python-fastapi" 25 55

# Test 4: Static HTML (new)
TEST_DIR="$TEST_ROOT/static-html"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello World</h1></body>
</html>
EOF
cat > "$TEST_DIR/about.html" << 'EOF'
<!DOCTYPE html>
<html><body><p>About</p></body></html>
EOF
run_test "Static HTML (new type)" "$TEST_DIR" "static-html" 40 50

# Test 5: Static HTML with CSS
TEST_DIR="$TEST_ROOT/static-html-css"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head><link rel="stylesheet" href="style.css"></head>
<body><h1>Styled</h1></body>
</html>
EOF
cat > "$TEST_DIR/style.css" << 'EOF'
body { background: #fff; }
EOF
run_test "Static HTML with CSS" "$TEST_DIR" "static-html" 40 50

# Test 6: TypeScript-only project
TEST_DIR="$TEST_ROOT/typescript"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "test-typescript",
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF
echo 'const x: number = 42;' > "$TEST_DIR/index.ts"
run_test "TypeScript only" "$TEST_DIR" "typescript" 35 55

# Test 7: CLI tool
TEST_DIR="$TEST_ROOT/cli"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "test-cli",
  "bin": {
    "mycli": "./cli.js"
  },
  "dependencies": {
    "commander": "^11.0.0"
  }
}
EOF
echo '#!/usr/bin/env node' > "$TEST_DIR/cli.js"
run_test "CLI tool" "$TEST_DIR" "cli" 40 60

# Test 8: Fallback (latest-idea)
TEST_DIR="$TEST_ROOT/latest-idea"
mkdir -p "$TEST_DIR"
echo '# README' > "$TEST_DIR/README.md"
run_test "Fallback (latest-idea)" "$TEST_DIR" "latest-idea" 20 30

echo ""
echo "🏁 TIER 2: EDGE CASES"
echo "===================="

# Test 9: HTML with parent package.json
TEST_DIR="$TEST_ROOT/html-with-parent"
mkdir -p "$TEST_ROOT/parent-dir"
cat > "$TEST_ROOT/parent-dir/package.json" << 'EOF'
{
  "name": "parent-project"
}
EOF
mkdir -p "$TEST_ROOT/parent-dir/static-site"
cat > "$TEST_ROOT/parent-dir/static-site/index.html" << 'EOF'
<!DOCTYPE html>
<html><body><h1>Nested</h1></body></html>
EOF
run_test "HTML with parent package.json" "$TEST_ROOT/parent-dir/static-site" "static-html" 40 50

# Test 10: Empty project
TEST_DIR="$TEST_ROOT/empty"
mkdir -p "$TEST_DIR"
run_test "Empty project" "$TEST_DIR" "latest-idea" 20 30

# Test 11: Node API
TEST_DIR="$TEST_ROOT/node-api"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "test-api",
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF
echo 'const express = require("express");' > "$TEST_DIR/server.js"
run_test "Node.js API (Express)" "$TEST_DIR" "node-api" 40 60

# Test 12: Vue TypeScript
TEST_DIR="$TEST_ROOT/vue-ts"
mkdir -p "$TEST_DIR"
cat > "$TEST_DIR/package.json" << 'EOF'
{
  "name": "test-vue-ts",
  "dependencies": {
    "vue": "^3.3.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
EOF
echo '<template><div>Vue</div></template>' > "$TEST_DIR/App.vue"
run_test "Vue TypeScript" "$TEST_DIR" "vue-ts" 40 60

echo ""
echo "========================================="
echo "🏁 TEST SUMMARY"
echo "========================================="
echo -e "Total:  ${TESTS_RUN}"
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

echo "=========================================" >> "$RESULTS_FILE"
echo "SUMMARY" >> "$RESULTS_FILE"
echo "=========================================" >> "$RESULTS_FILE"
echo "Total:  $TESTS_RUN" >> "$RESULTS_FILE"
echo "Passed: $TESTS_PASSED" >> "$RESULTS_FILE"
echo "Failed: $TESTS_FAILED" >> "$RESULTS_FILE"

echo "📄 Full results: $RESULTS_FILE"
echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}❌ CHAMPIONSHIP FAILED - Fix errors and retest${NC}"
    exit 1
else
    echo -e "${GREEN}✅ CHAMPIONSHIP PASSED - All systems operational${NC}"
    exit 0
fi
