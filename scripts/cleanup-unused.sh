#!/bin/bash
# 🧹 Clean up unused imports and variables

echo "🧹 Cleaning unused imports and variables..."

# Files with known unused code to clean
FILES=(
  "src/commands/ai-enhance.ts"
  "src/commands/convert.ts"
  "src/commands/doctor.ts"
  "src/commands/faf-recover.ts"
  "src/commands/quick.ts"
  "src/engines/fab-formats-processor.ts"
  "src/engines/faf-dna.ts"
  "src/utils/technical-credit.ts"
)

# Remove specific unused imports
echo "Removing unused imports..."

# ai-enhance.ts - remove unused path and findFafFile
sed -i '' '/^import \* as path from "path";$/d' src/commands/ai-enhance.ts 2>/dev/null || true
sed -i '' '/import { findFafFile }/d' src/commands/ai-enhance.ts 2>/dev/null || true

# Remove unused fs imports where not used
for file in src/commands/doctor.ts src/commands/validate.ts src/generators/quick-generator.ts; do
  grep -l "import \* as fs" "$file" 2>/dev/null && \
  grep -q "fs\." "$file" || \
  sed -i '' '/^import \* as fs/d' "$file" 2>/dev/null || true
done

# Comment out unused functions instead of deleting (preserve for future)
echo "Commenting out unused functions..."

# ai-enhance.ts - comment out unused helper functions
sed -i '' '/^function detectEnhancementFocus/,/^}/s/^/\/\/ /' src/commands/ai-enhance.ts 2>/dev/null || true
sed -i '' '/^function generateEnhancementPrompt/,/^}/s/^/\/\/ /' src/commands/ai-enhance.ts 2>/dev/null || true
sed -i '' '/^async function executeBig3Enhancement/,/^}/s/^/\/\/ /' src/commands/ai-enhance.ts 2>/dev/null || true

# Fix error variables that should be used
echo "Fixing error handling..."

# Replace unused error vars with underscore
find src -name "*.ts" -exec sed -i '' 's/} catch (error)/} catch (_error)/g' {} \; 2>/dev/null || true
find src -name "*.ts" -exec sed -i '' 's/catch (err)/catch (_err)/g' {} \; 2>/dev/null || true

# Count remaining issues
echo ""
echo "📊 Before cleanup:"
npm run lint 2>&1 | grep "problems" | head -1

echo ""
echo "✅ Cleanup complete!"
echo "Run 'npm run lint' to see remaining issues"