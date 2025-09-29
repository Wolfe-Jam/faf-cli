# Testing .npmignore Safely

## The Safe Way to Test (Won't Break Anything)

### 1. Test with npm pack (Local Only)
```bash
# This creates a .tgz file locally, doesn't publish
npm pack

# See what's in the package
tar -tzf faf-cli-*.tgz | grep "src/engines"
# If .npmignore works: Should show NOTHING
# If not working: Will show .ts files
```

### 2. What .npmignore Actually Does

**.npmignore ONLY affects `npm publish` and `npm pack`**

It does NOT affect:
- ❌ Your local development
- ❌ Your website
- ❌ Your git repository
- ❌ Your current installation

It ONLY controls:
- ✅ What files go into the npm package
- ✅ What users download from npm

### 3. Current Problem

Right now when someone does `npm install faf-cli`, they get:
```
node_modules/faf-cli/
├── src/
│   └── engines/
│       ├── fab-formats-processor.ts  ← SECRET SAUCE EXPOSED!
│       ├── relentless-context-extractor.ts  ← EXPOSED!
│       └── faf-dna.ts  ← EXPOSED!
└── dist/
    └── (compiled JS)
```

### 4. After .npmignore

They would get:
```
node_modules/faf-cli/
├── dist/     ← Only compiled JS
├── README.md
└── package.json
```

No source code!

## Testing Without Risk

### Option 1: Dry Run Test
```bash
# See what WOULD be included (no file created)
npm pack --dry-run 2>&1 | grep "src/"
```

### Option 2: Test Pack Locally
```bash
# Create package locally
npm pack

# Check contents
tar -tzf faf-cli-*.tgz > package-contents.txt
cat package-contents.txt | grep "\.ts$"

# Should see NO .ts files if .npmignore works

# Clean up
rm faf-cli-*.tgz
```

### Option 3: Test in Separate Directory
```bash
# Copy to test location
cp -r /Users/wolfejam/FAF/cli /tmp/test-cli
cd /tmp/test-cli

# Test there
npm pack
tar -tzf faf-cli-*.tgz | grep "src/"

# No risk to your main project!
```

## What Could Break?

### If .npmignore is TOO aggressive:

**Symptom**: Users get error when installing
```
Error: Cannot find module './dist/cli.js'
```

**Fix**: Make sure dist/ is NOT in .npmignore

### If we exclude needed files:

**Symptom**: CLI doesn't work after install
```
Error: Cannot find required file
```

**Fix**: Make sure these are NOT ignored:
- dist/**/*.js
- package.json
- README.md

## The Current .npmignore

```gitignore
# Source code - never publish
src/**/*.ts
*.ts
!*.d.ts

# Secret sauce - CRITICAL
src/engines/*.ts
src/utils/turbo-cat*.ts

# Only affects npm publish, not your local!
```

## Quick Safety Check

Run this to see what's currently exposed:
```bash
# Download current npm package
npm pack faf-cli
tar -tzf faf-cli-*.tgz | grep -E "engines.*\.ts|turbo-cat.*\.ts"

# If you see .ts files = SECRET SAUCE EXPOSED!
```

## Bottom Line

**.npmignore is SAFE to add because:**
1. Only affects npm publishing
2. Doesn't touch your local files
3. Doesn't affect your website
4. Easy to test locally first
5. Can be removed if issues

**The RISK is NOT using it:**
- Your secret sauce is exposed
- Competitors can copy
- IP value lost

## Recommended Test

```bash
# 1. Add .npmignore
# 2. Test locally
npm pack
tar -tzf faf-cli-*.tgz | head -30

# 3. Check no source included
tar -tzf faf-cli-*.tgz | grep "\.ts$" | grep -v "\.d\.ts$"

# Should be empty!

# 4. Clean up
rm faf-cli-*.tgz
```

---

**No risk to your site, only protects your IP!** 🔒