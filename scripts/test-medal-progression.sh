#!/bin/bash

##
# 🏁 WJTC Medal Progression Visual Test
# Manual verification of championship medal display
#
# Philosophy: "We break things so others never even know they were ever broken"
##

set -e

echo "🏎️⚡️ WJTC MEDAL PROGRESSION TEST - Championship Visual Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test scores covering all medal tiers
TEST_SCORES=(
  "0:🔴 Stop - Needs work"
  "48:🔴 Stop - Needs work (near threshold)"
  "55:🟡 Caution - Getting ready"
  "62:🟡 Caution - Getting ready (mid-range)"
  "70:🟢 GO! - Ready for Target 1"
  "77:🟢 GO! - Ready for Target 1 (mid-range)"
  "85:🥉 Target 1 - Bronze"
  "88:🥉 Target 1 - Bronze (mid-range)"
  "95:🥈 Target 2 - Silver"
  "96:🥈 Target 2 - Silver (mid-range)"
  "99:🥇 Gold"
  "100:🏆 Trophy - Championship"
)

# Create temp directory
TEST_DIR="/tmp/faf-medal-test-$$"
mkdir -p "$TEST_DIR"

echo "📁 Test directory: $TEST_DIR"
echo ""

# Function to create a test .faf file with specific score
create_test_faf() {
  local score=$1
  local label=$2
  local dir="$TEST_DIR/project-$score"

  mkdir -p "$dir"

  # Calculate filled slots based on score
  # 21 total slots, so score% = (filled/21) * 100
  local filled_slots=$(echo "scale=0; ($score * 21) / 100" | bc)

  # Create minimal .faf file
  cat > "$dir/.faf" <<EOF
faf_version: "2.4.0"
ai_scoring_system: "2025-08-30"
ai_score: "${score}%"
ai_confidence: $([ $score -ge 70 ] && echo "HIGH" || echo "LOW")
project:
  name: "Test Project $score%"
  goal: "Testing medal display at $score%"
  main_language: "TypeScript"
stack:
  frontend: "React"
  backend: "Node.js"
  database: "PostgreSQL"
human_context:
  who: "Developers"
  what: "Test project for medal validation"
  why: "WJTC championship testing"
  where: "Testing environment"
  when: "Now"
  how: "Manual test script"
ai_instructions:
  priority_order:
    - "Test medal display"
  working_style:
    code_first: true
context_quality:
  slots_filled: "$filled_slots/21 (${score}%)"
  ai_confidence: $([ $score -ge 70 ] && echo "HIGH" || echo "LOW")
EOF

  echo "$dir"
}

echo "🔨 Creating test projects..."
echo ""

# Create all test projects
TEST_PROJECTS=()
for entry in "${TEST_SCORES[@]}"; do
  score="${entry%%:*}"
  label="${entry#*:}"

  project_dir=$(create_test_faf "$score" "$label")
  TEST_PROJECTS+=("$score:$label:$project_dir")

  echo "  ✅ Created: $score% - $label"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏁 RUNNING VISUAL VERIFICATION TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run faf show on each project
for entry in "${TEST_PROJECTS[@]}"; do
  score="${entry%%:*}"
  rest="${entry#*:}"
  label="${rest%%:*}"
  project_dir="${rest#*:}"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Testing: $score% - $label"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Run faf show
  npx ts-node src/cli.ts show "$project_dir"

  echo ""
  echo "✅ Verify: Medal matches expected '$label'"
  echo ""
  read -p "Press Enter to continue to next test..."
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏆 WJTC MEDAL PROGRESSION TEST COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Manual Verification Checklist:"
echo ""
echo "  [ ] All medals display correctly"
echo "  [ ] Traffic light progression is clear (🔴→🟡→🟢)"
echo "  [ ] Medal progression is clear (🥉→🥈→🥇→🏆)"
echo "  [ ] No medals shown at wrong scores"
echo "  [ ] Colors match medal tier appropriately"
echo ""
echo "🧹 Cleanup: rm -rf $TEST_DIR"
echo ""
echo "Status: ${GREEN}READY FOR WJTC REPORT${NC}"
echo ""
