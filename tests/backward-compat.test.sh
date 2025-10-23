#!/bin/bash
# 🏎️ Backward Compatibility Testing
# Ensure existing .faf files work with new project.type field

set -e

CLI_PATH="/Users/wolfejam/FAF/cli/dist/cli.js"
TEST_DIR="/tmp/faf-backward-compat"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏁 BACKWARD COMPATIBILITY TESTS"
echo "================================"
echo ""

rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Test 1: .faf WITHOUT project.type field (v2.4.0 format)
echo -e "${YELLOW}[TEST 1]${NC} Old .faf WITHOUT project.type field"
cat > .faf << 'EOF'
faf_version: 2.5.0
ai_score: 50%
project:
  name: Old Project
  goal: Test backward compatibility
  main_language: JavaScript
stack:
  frontend: React
  backend: Node.js
  runtime: Node.js
EOF

# Should still score correctly
score=$($CLI_PATH score --raw 2>&1 | grep "Score:" | head -1 | sed 's/.*Score: //' | sed 's/\/.*//' | sed 's/%//' | sed 's/\x1b\[[0-9;]*m//g')
if [ "$score" -ge 25 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Score: $score% (no project.type field, no regression)"
else
    echo -e "${RED}❌ FAIL${NC} - Score too low: $score (regression detected)"
    exit 1
fi

# Test 2: .faf WITH project.type: null
echo -e "${YELLOW}[TEST 2]${NC} .faf with project.type: null"
cat > .faf << 'EOF'
faf_version: 2.5.0
ai_score: 50%
project:
  name: Null Type Project
  goal: Test null handling
  main_language: JavaScript
  type: null
stack:
  frontend: React
  backend: Node.js
EOF

score=$($CLI_PATH score --raw 2>&1 | grep "Score:" | head -1 | sed 's/.*Score: //' | sed 's/\/.*//' | sed 's/%//' | sed 's/\x1b\[[0-9;]*m//g')
if [ "$score" -ge 20 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Score: $score% (null type handled, no crash)"
else
    echo -e "${RED}❌ FAIL${NC} - Score too low: $score (null handling broken)"
    exit 1
fi

# Test 3: .faf WITH project.type: "chrome-extension"
echo -e "${YELLOW}[TEST 3]${NC} .faf with project.type: chrome-extension"
cat > .faf << 'EOF'
faf_version: 2.5.0
ai_score: 50%
project:
  name: Chrome Extension
  goal: Test chrome extension pattern
  main_language: JavaScript
  type: chrome-extension
stack:
  frontend: Svelte
  runtime: None
  hosting: None
EOF

score=$($CLI_PATH score --raw 2>&1 | grep "Score:" | head -1 | sed 's/.*Score: //' | sed 's/\/.*//' | sed 's/%//' | sed 's/\x1b\[[0-9;]*m//g')
if [ "$score" -ge 50 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Score: $score (chrome-extension auto-fill applied)"
else
    echo -e "${RED}❌ FAIL${NC} - Score too low: $score (expected auto-fill boost)"
    exit 1
fi

# Test 4: .faf WITH project.type: "static-html"
echo -e "${YELLOW}[TEST 4]${NC} .faf with project.type: static-html"
cat > .faf << 'EOF'
faf_version: 2.5.0
ai_score: 40%
project:
  name: Static Site
  goal: Test static HTML pattern
  main_language: JavaScript
  type: static-html
stack:
  frontend: None
  backend: None
  runtime: None
  hosting: None
EOF

score=$($CLI_PATH score --raw 2>&1 | grep "Score:" | head -1 | sed 's/.*Score: //' | sed 's/\/.*//' | sed 's/%//' | sed 's/\x1b\[[0-9;]*m//g')
if [ "$score" -ge 40 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Score: $score (static-html auto-fill applied)"
else
    echo -e "${RED}❌ FAIL${NC} - Score too low: $score"
    exit 1
fi

# Test 5: Score command doesn't crash on old .faf
echo -e "${YELLOW}[TEST 5]${NC} Score old .faf (no project.type)"
cat > .faf << 'EOF'
faf_version: 2.5.0
project:
  name: Old Format
  goal: Score test
  main_language: TypeScript
stack:
  frontend: React
EOF

# Just verify it doesn't crash
score_output=$($CLI_PATH score --raw 2>&1)
if echo "$score_output" | grep -q "Score:"; then
    echo -e "${GREEN}✅ PASS${NC} - Score command succeeded on old .faf"
else
    echo -e "${RED}❌ FAIL${NC} - Score command failed on old .faf"
    echo "$score_output"
    exit 1
fi

# Test 6: Init adds project.type to new .faf
echo -e "${YELLOW}[TEST 6]${NC} New init ADDS project.type field"
rm -f .faf
$CLI_PATH init --force > /dev/null 2>&1

if grep -q "^  type:" .faf; then
    type_value=$(grep "^  type:" .faf | sed 's/  type: //')
    echo -e "${GREEN}✅ PASS${NC} - project.type added: $type_value"
else
    echo -e "${RED}❌ FAIL${NC} - project.type NOT added to new .faf"
    exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ ALL BACKWARD COMPATIBILITY TESTS PASSED${NC}"
echo "================================"
