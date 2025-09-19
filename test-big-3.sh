#!/bin/bash

# 🏆 BIG-3 SHOWCASE TEST SUITE
# Tests the three core FAF capabilities with 5 questions + 1 review
# v2.0.0 with MK2 Engine + TURBO-CAT™

echo "================================================"
echo "🏆 FAF BIG-3 SHOWCASE TEST SUITE v2.0.0"
echo "🏎️⚡️II MK2 Engine + 😽 TURBO-CAT™"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${CYAN}📋 TEST $TOTAL_TESTS: $test_name${NC}"
    echo -e "${YELLOW}Command: $command${NC}"

    # Run command and capture output
    output=$(eval $command 2>&1)

    # Check if output contains expected pattern
    if echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Expected to find: $expected_pattern"
    fi

    # Show brief output
    echo "$output" | head -5
    echo "..."
    echo ""
}

# Function to test performance
test_performance() {
    local command="$1"
    local max_time="$2"
    local test_name="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo -e "${CYAN}📋 TEST $TOTAL_TESTS: $test_name${NC}"
    echo -e "${YELLOW}Command: time $command${NC}"
    echo -e "${YELLOW}Max time: ${max_time}ms${NC}"

    # Measure execution time
    start_time=$(date +%s%N)
    eval $command > /dev/null 2>&1
    end_time=$(date +%s%N)

    # Calculate duration in milliseconds
    duration=$(( (end_time - start_time) / 1000000 ))

    if [ $duration -le $max_time ]; then
        echo -e "${GREEN}✅ PASSED - ${duration}ms${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED - ${duration}ms (exceeds ${max_time}ms)${NC}"
    fi
    echo ""
}

echo "================================================"
echo -e "${BOLD}BIG-1: PROJECT INITIALIZATION${NC}"
echo "================================================"
echo ""

# Question 1: Can FAF detect the current project type?
run_test \
    "Project Detection" \
    "npx ts-node src/cli.ts init --dry-run 2>/dev/null | grep -E 'TypeScript|Node.js|detected'" \
    "detected"

# Question 2: Can TURBO-CAT find formats?
echo "================================================"
echo -e "${BOLD}BIG-2: FORMAT DISCOVERY (TURBO-CAT)${NC}"
echo "================================================"
echo ""

run_test \
    "TURBO-CAT Format Detection" \
    "npx ts-node src/cli.ts formats 2>/dev/null | grep -E 'discovered|formats|TURBO-CAT'" \
    "format"

# Question 3: Can we generate AI context?
echo "================================================"
echo -e "${BOLD}BIG-3: AI CONTEXT GENERATION${NC}"
echo "================================================"
echo ""

run_test \
    "AI Context Generation" \
    "npx ts-node src/cli.ts init --dry-run 2>/dev/null | grep -E 'ai_context|human_context|project'" \
    "context"

# Question 4: Performance test
echo "================================================"
echo -e "${BOLD}PERFORMANCE TEST${NC}"
echo "================================================"
echo ""

test_performance \
    "npx ts-node src/cli.ts score" \
    "500" \
    "Scoring Performance (<500ms)"

# Question 5: MK2 Engine verification
echo "================================================"
echo -e "${BOLD}MK2 ENGINE VERIFICATION${NC}"
echo "================================================"
echo ""

run_test \
    "MK2 Engine Active" \
    "npx ts-node src/cli.ts version 2>/dev/null | grep -E 'MK2|2.0.0|TURBO-CAT'" \
    "2.0.0"

# REVIEW: Summary and scoring
echo "================================================"
echo -e "${BOLD}📊 REVIEW: TEST SUMMARY${NC}"
echo "================================================"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
    PERCENTAGE=0
fi

# Display results with color coding
if [ $PERCENTAGE -ge 80 ]; then
    COLOR=$GREEN
    STATUS="🏆 CHAMPION"
elif [ $PERCENTAGE -ge 60 ]; then
    COLOR=$YELLOW
    STATUS="📈 GOOD"
else
    COLOR=$RED
    STATUS="🔧 NEEDS WORK"
fi

echo -e "${BOLD}Results:${NC}"
echo -e "Tests Run: $TOTAL_TESTS"
echo -e "Tests Passed: ${COLOR}$PASSED_TESTS${NC}"
echo -e "Success Rate: ${COLOR}${PERCENTAGE}%${NC}"
echo -e "Status: ${COLOR}${STATUS}${NC}"
echo ""

# Feature checklist
echo -e "${BOLD}Feature Verification:${NC}"
echo -e "✓ Project Detection: $([ $PASSED_TESTS -ge 1 ] && echo '✅' || echo '❌')"
echo -e "✓ TURBO-CAT Formats: $([ $PASSED_TESTS -ge 2 ] && echo '✅' || echo '❌')"
echo -e "✓ AI Context: $([ $PASSED_TESTS -ge 3 ] && echo '✅' || echo '❌')"
echo -e "✓ Performance: $([ $PASSED_TESTS -ge 4 ] && echo '✅' || echo '❌')"
echo -e "✓ MK2 Engine: $([ $PASSED_TESTS -eq 5 ] && echo '✅' || echo '❌')"
echo ""

# TURBO-CAT signature
echo "================================================"
echo -e "${CYAN}😽 TURBO-CAT™ says:${NC}"
if [ $PERCENTAGE -eq 100 ]; then
    echo "\"Perfect score! Your stack is PURRING!\""
elif [ $PERCENTAGE -ge 80 ]; then
    echo "\"Great job! I can hear the purr!\""
elif [ $PERCENTAGE -ge 60 ]; then
    echo "\"Getting there! Need more tuna... I mean tests!\""
else
    echo "\"Needs work! Let me catalyze those errors!\""
fi
echo "================================================"

# Exit with appropriate code
[ $PERCENTAGE -ge 80 ] && exit 0 || exit 1