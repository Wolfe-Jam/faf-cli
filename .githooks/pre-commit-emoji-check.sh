#!/bin/bash

# FAF CLI Emoji Standards Enforcement
# This hook prevents commits with forbidden emojis

echo "🏁 FAF Emoji Standards Check..."

# Check for forbidden emojis
FORBIDDEN_EMOJIS=("🎯" "✅")
for emoji in "${FORBIDDEN_EMOJIS[@]}"; do
  if git diff --cached --name-only --diff-filter=ACM | xargs grep -l "$emoji" 2>/dev/null; then
    echo ""
    echo "❌ COMMIT BLOCKED: Forbidden emoji detected!"
    echo "🚫 The $emoji emoji is explicitly forbidden."
    if [ "$emoji" = "✅" ]; then
      echo "☑️ Use ☑️ instead of ✅ for checkmarks."
    fi
    echo "📚 See EMOJI-STANDARDS.md for approved emojis."
    echo ""
    echo "Files containing forbidden emoji:"
    git diff --cached --name-only --diff-filter=ACM | xargs grep -l "$emoji" 2>/dev/null
    exit 1
  fi
done

# Check for any changes to emoji standards files
if git diff --cached --name-only | grep -E "(EMOJI-STANDARDS\.md|championship-style\.ts)" > /dev/null; then
  echo ""
  echo "⚠️  WARNING: Modifying emoji standards!"
  echo "📏 EMOJI-STANDARDS.md and championship-style.ts emoji definitions are LOCKED."
  echo "🔒 These standards are IMMUTABLE and cannot be changed."
  echo ""
  read -p "Are you ABSOLUTELY SURE you want to modify locked standards? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ Good call! Commit blocked to preserve standards."
    exit 1
  fi
  echo "⚠️  Proceeding with caution - this will require team review!"
fi

echo "☑️ Emoji standards check passed!"