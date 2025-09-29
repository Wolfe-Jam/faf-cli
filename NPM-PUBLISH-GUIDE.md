# 📦 NPM Publishing Guide - MANUAL CONTROL ONLY

## 🎯 Philosophy: Human-Controlled Publishing
**We NEVER auto-publish. A human must manually run the final publish command.**

---

## 📋 Pre-Publish Checklist

### 1. Update Package Content
```bash
# Update package.json description for clarity
# Update README.md for better community focus
# Ensure all messaging is humble and helpful
```

### 2. Version Bump
```bash
# Edit package.json version field manually
# Current: 2.4.2
# Format: MAJOR.MINOR.PATCH
```

### 3. Build Project
```bash
npm run build
```

### 4. Test Critical Functions
```bash
# Quick smoke test
node dist/cli.js --version

# Run edge case tests (auto-runs on publish)
npm run test:audit
```

### 5. Commit Changes
```bash
git add README.md package.json
git commit -m "docs: improve npm package clarity and community focus

- Update package description to clearly explain what .faf does
- Enhance README with community hub emphasis
- Add enterprise-grade technical features section
- Update to vX.X.X for npm release"
```

---

## 🚀 MANUAL PUBLISH COMMAND

### ⚠️ FINAL STEP - HUMAN DECISION REQUIRED

**When ready, manually paste and run:**
```bash
npm publish --access public
```

**This command:**
- Runs prepare script (build + test:audit)
- Packages the dist/ folder
- Uploads to npm registry
- Makes immediately available

---

## 📊 Post-Publish Verification

### 1. Verify on npm
```bash
npm view faf-cli version
# Should show your new version
```

### 2. Check npm website
- Visit: https://www.npmjs.com/package/faf-cli
- Verify description updated
- Check README rendered correctly

### 3. Test Installation
```bash
npm install -g faf-cli@latest
faf --version
```

---

## 🔒 Security Notes

1. **npm Login**: Must be logged in as authorized publisher
   ```bash
   npm whoami  # Check current user
   npm login   # If needed
   ```

2. **2FA**: If enabled, you'll need your authenticator code

3. **Dry Run**: To preview without publishing:
   ```bash
   npm pack --dry-run
   ```

---

## 📝 What Gets Published

From package.json `files` field:
- `dist/**/*` - Compiled JavaScript
- `README.md` - Package documentation
- `LICENSE` - MIT license

**Excluded automatically:**
- Source files (src/)
- Tests
- Config files
- node_modules/

---

## 🚫 Common Mistakes to Avoid

1. **DON'T** use `npm version` - Edit package.json manually
2. **DON'T** use CI/CD auto-publish - Keep human control
3. **DON'T** publish without testing the build
4. **DON'T** forget to commit before publishing
5. **DON'T** use --force flags

---

## 📈 Version Strategy

- **PATCH** (2.4.x): Bug fixes, documentation updates
- **MINOR** (2.x.0): New features, backwards compatible
- **MAJOR** (x.0.0): Breaking changes

Current: v2.4.2
Next likely: v2.4.3 (patch) or v2.5.0 (dependency reduction)

---

*Generated: 2024-09-28*
*Philosophy: Manual control prevents mistakes*
*🧡⚡️ FAF CLI Publishing Guide*