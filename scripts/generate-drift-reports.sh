#!/bin/bash
# 📊 Generate Real Drift Reports for Social Media
# Championship-grade proof of context-drift impact

set -e

echo "🍊 FAF DRIFT REPORT GENERATOR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Output directory for reports
REPORT_DIR="/tmp/faf-drift-reports"
mkdir -p "$REPORT_DIR"

echo "📁 Reports will be saved to: $REPORT_DIR"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Report 1: FAF CLI itself
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🏎️ REPORT 1: FAF CLI (Self-Analysis)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$(dirname "$0")/.."
node dist/cli.js drift --export "$REPORT_DIR/faf-cli-drift.json" | tee "$REPORT_DIR/faf-cli-drift.txt"

echo ""
echo "✅ Report saved:"
echo "   - JSON: $REPORT_DIR/faf-cli-drift.json"
echo "   - Text: $REPORT_DIR/faf-cli-drift.txt"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Report 2: Other FAF projects (if available)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Scanning for other FAF projects..."
echo ""

# Check if faf-dev-tools exists
if [ -d "/Users/wolfejam/FAF/faf-dev-tools" ]; then
  echo "🌐 REPORT 2: faf-dev-tools"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  cd /Users/wolfejam/FAF/faf-dev-tools
  node /Users/wolfejam/FAF/cli/dist/cli.js drift --export "$REPORT_DIR/faf-dev-tools-drift.json" | tee "$REPORT_DIR/faf-dev-tools-drift.txt"

  echo ""
  echo "✅ Report saved:"
  echo "   - JSON: $REPORT_DIR/faf-dev-tools-drift.json"
  echo "   - Text: $REPORT_DIR/faf-dev-tools-drift.txt"
  echo ""
fi

# Check if claude-faf-mcp exists
if [ -d "/Users/wolfejam/FAF/claude-faf-mcp" ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔌 REPORT 3: claude-faf-mcp"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  cd /Users/wolfejam/FAF/claude-faf-mcp
  node /Users/wolfejam/FAF/cli/dist/cli.js drift --export "$REPORT_DIR/claude-faf-mcp-drift.json" | tee "$REPORT_DIR/claude-faf-mcp-drift.txt"

  echo ""
  echo "✅ Report saved:"
  echo "   - JSON: $REPORT_DIR/claude-faf-mcp-drift.json"
  echo "   - Text: $REPORT_DIR/claude-faf-mcp-drift.txt"
  echo ""
fi

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generate Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "All reports saved to: $REPORT_DIR"
echo ""
echo "Reports generated:"
ls -lh "$REPORT_DIR"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 READY FOR SOCIAL MEDIA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Text reports (ready to copy/paste):"
for file in "$REPORT_DIR"/*.txt; do
  if [ -f "$file" ]; then
    echo "  📄 $(basename "$file")"
  fi
done
echo ""
echo "JSON reports (for web visualization):"
for file in "$REPORT_DIR"/*.json; do
  if [ -f "$file" ]; then
    echo "  📊 $(basename "$file")"
  fi
done
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Context-drift makes you pay."
echo ".faf keeps you drift-free."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
