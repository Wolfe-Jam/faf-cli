# 🏎️ FAF Version Management System

**Never have version mismatches again!**

## 🎯 Problem Solved

Previously, version updates required manually updating:
- `package.json` version field
- ASCII art in `championship-style.ts` 
- Comments in multiple files
- Build output verification

This led to inconsistent versions across the codebase.

## ✅ Solution: Automated Version Management

### 🚀 Quick Start

**To update version (e.g., to 2.9.0):**
```bash
npm run version:update 2.9.0
npm run build
npm test
git add .
git commit -m "chore: bump version to v2.9.0"
```

**To check version consistency:**
```bash
npm run version:check
```

## 🛠 How It Works

### 1. Version Update Script (`npm run version:update X.Y.Z`)
- Updates `package.json` version field
- Updates ASCII art in `championship-style.ts`
- Updates version comments in source files
- Scans for stray version references
- Provides clear next steps

### 2. Version Check Script (`npm run version:check`)
- Verifies package.json version
- Checks ASCII art version matches
- Validates comment versions
- Tests CLI --version output
- Fails with helpful error messages if mismatched

### 3. Pre-commit Hook (Automatic)
- Runs `version:check` before every commit
- Prevents committing inconsistent versions
- Provides fix command if issues found

## 📁 Files Involved

### Core Version Files
- `package.json` - Source of truth for version
- `src/utils/championship-style.ts` - ASCII art and visual version displays
- `dist/cli.js` - Built CLI that outputs version

### Version Management Scripts
- `scripts/update-version.js` - Updates all version references
- `scripts/check-version.js` - Validates version consistency
- `.husky/pre-commit` - Git hook for automatic checking

## 🔄 Version Update Workflow

1. **Decide on new version** following semantic versioning:
   - Patch: `2.8.0` → `2.8.1` (bug fixes)
   - Minor: `2.8.0` → `2.9.0` (new features, backwards compatible)
   - Major: `2.8.0` → `3.0.0` (breaking changes)

2. **Run update command:**
   ```bash
   npm run version:update 2.9.0
   ```

3. **Build and test:**
   ```bash
   npm run build
   npm test
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "chore: bump version to v2.9.0"
   ```

## 🚨 Troubleshooting

### Version Mismatch Error
```
❌ Version mismatch in championship-style.ts ASCII art:
   Package.json: 2.9.0
   ASCII art:    2.8.0
```

**Fix:** Run `npm run version:update 2.9.0`

### CLI Version Output Wrong
```
❌ CLI --version output mismatch:
   Package.json: 2.9.0
   CLI output:   2.8.0
```

**Fix:** Run `npm run build`

### Pre-commit Hook Fails
```
❌ Version check failed! Fix with: npm run version:update X.Y.Z
```

**Fix:** Run the suggested command with your intended version

## 🎯 Best Practices

1. **Always use the update script** - Never manually edit versions
2. **Check before release** - Run `npm run version:check` 
3. **Semantic versioning** - Follow major.minor.patch convention
4. **Build after update** - Always run `npm run build` after version changes
5. **Test after update** - Run tests to ensure nothing broke

## 🏁 Version History

### NEW MK2 ERA (Current)
- **v2.0.0** - MK2 Engine with TURBO-CAT™ integration, 154 Format Pyramid

### LEGACY VERSIONS (Pre-MK2)
- **v1.8.0** - Last version before MK2 engine
- **v1.7.0** - Championship style updates, trust cache system
- **v1.6.0** - Enhanced AI verification, bi-sync improvements
- **v1.5.0** - Nested snake_case format, fab-formats discovery

## 💡 Schema Versions vs CLI Versions

**Important:** Schema versions (like 2.4.0, 2.5.0 in test files) are NOT the same as CLI versions. Schema versions define the .faf file format and should only change when the format itself changes.

The version management system ignores schema version references to prevent breaking format compatibility.

---

*Version management system implemented to ensure consistent versioning across all FAF CLI components. Never worry about version mismatches again!* 🚀