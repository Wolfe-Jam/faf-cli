#!/bin/bash
# 🔥 ROCK SOLID YAML FIX - Migrate all files to use fix-once/yaml
# FIX ONCE, DONE FOREVER

set -e

echo "🔧 Migrating all YAML imports to fix-once/yaml..."
echo ""

# Find all TypeScript files with yaml imports
FILES=$(grep -r "import.*yaml" src/ --include="*.ts" -l || true)

COUNT=0
for file in $FILES; do
  # Skip the fix-once/yaml.ts file itself
  if [[ "$file" == *"fix-once/yaml.ts"* ]]; then
    continue
  fi

  echo "📝 Processing: $file"

  # Pattern 1: import * as YAML from 'yaml'
  sed -i '' "s|import \* as YAML from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml'|g" "$file"
  sed -i '' "s|import \* as YAML from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../fix-once/yaml'|g" "$file"
  sed -i '' "s|import \* as YAML from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../../fix-once/yaml'|g" "$file"

  # Pattern 2: import * as yaml from 'yaml'
  sed -i '' "s|import \* as yaml from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml'|g" "$file"
  sed -i '' "s|import \* as yaml from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../fix-once/yaml'|g" "$file"
  sed -i '' "s|import \* as yaml from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../../fix-once/yaml'|g" "$file"

  # Pattern 3: import yaml from 'yaml'
  sed -i '' "s|import yaml from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml'|g" "$file"
  sed -i '' "s|import yaml from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../fix-once/yaml'|g" "$file"
  sed -i '' "s|import yaml from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../../fix-once/yaml'|g" "$file"

  # Pattern 4: import { parse, stringify } from 'yaml'
  sed -i '' "s|import { parse, stringify } from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml'|g" "$file"
  sed -i '' "s|import { parse, stringify } from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../fix-once/yaml'|g" "$file"
  sed -i '' "s|import { parse, stringify } from ['\"]yaml['\"]|import { parse as parseYAML, stringify as stringifyYAML } from '../../../fix-once/yaml'|g" "$file"

  COUNT=$((COUNT + 1))
done

echo ""
echo "✅ Migrated $COUNT files to use fix-once/yaml"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   Replace all instances of:"
echo "   - YAML.parse(x) → parseYAML(x, { filepath: path })"
echo "   - yaml.parse(x) → parseYAML(x, { filepath: path })"
echo "   - YAML.stringify(x) → stringifyYAML(x)"
echo "   - yaml.stringify(x) → stringifyYAML(x)"
echo ""
echo "🏎️ YAML is now ROCK SOLID - FIX ONCE, DONE FOREVER"
