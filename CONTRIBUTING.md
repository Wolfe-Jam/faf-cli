# Contributing to faf-cli

🚀 **STOP faffing About!** Thanks for contributing to the Universal AI Context Format CLI.

**Anti-Faff Development** - We eliminate unnecessary complexity and build tools that just work.

## 🎯 **Quick Start**

```bash
# Clone and setup
git clone https://github.com/Wolfe-Jam/faf-cli
cd faf-cli
npm install

# Development workflow  
npm run dev          # Test CLI locally
npm run build        # Compile TypeScript
npm run lint         # Check code style
npm run format       # Auto-fix formatting
```

## 🧪 **Our Testing Philosophy**

**Real-World Validation > Synthetic Unit Tests**

We use **RAW Testing** methodology:
- Test with actual AI assistants (Claude, Gemini)
- Real project structures, not mocked data
- Cold environment validation  
- Cross-platform compatibility testing

See our [Testing & Validation](README.md#-testing--validation) section for details.

## 🏗️ **Project Structure**

```
faf-cli/
├── src/
│   ├── cli.ts                 # Main CLI entry point
│   ├── commands/              # CLI command implementations
│   ├── generators/            # .faf file generation logic
│   ├── utils/                 # Utility functions
│   └── scoring/               # Scoring algorithm
├── dist/                      # Compiled TypeScript output
├── public/                    # Landing page for fafcli.dev
└── tests/                     # Test files (Jest setup)
```

## 🎨 **Code Standards**

### **TypeScript Quality**: F1-Inspired Standards
- **Strict Mode**: All TypeScript strict checks enabled
- **No Any**: Explicit typing required
- **ESLint**: Configured for security and quality
- **Prettier**: Consistent formatting

### **Commit Messages**: Conventional Commits
```
feat: add Python FastAPI detection
fix: resolve file detection FATAL bug  
docs: update README with testing methodology
perf: optimize TypeScript analysis performance
```

## 🚀 **Development Workflow**

### **1. Feature Development**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Develop with live testing
npm run dev

# Test on real projects
cd ../faf-cli-testing
../faf-cli/dist/cli.js init --force
../faf-cli/dist/cli.js score --details
```

### **2. Quality Checks**
```bash
# Code quality
npm run lint          # ESLint checks
npm run format        # Prettier formatting
npm run build         # TypeScript compilation

# Functionality validation
npm run dev init      # Test CLI commands
npm run dev score     # Test scoring system
```

### **3. Submit Changes**
```bash
# Commit changes
git add .
git commit -m "feat: your awesome feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 🎯 **Contribution Types**

### **🔥 High Priority**
- **Framework Detection**: Add support for new frameworks
- **Language Support**: Extend beyond JavaScript/TypeScript/Python
- **Scoring Algorithm**: Improve context quality detection
- **Performance**: Optimize file scanning and analysis

### **✅ Welcome Contributions**
- **Documentation**: Improve README, examples, guides
- **Bug Fixes**: Address issues and edge cases  
- **CLI UX**: Better error messages, help text
- **Platform Support**: Windows, Linux compatibility

### **⚠️ Please Discuss First**
- **Major Architecture Changes**: Open an issue first
- **Breaking Changes**: Coordinate with maintainers
- **New Dependencies**: Keep minimal dependency philosophy
- **Format Changes**: Impact on .faf specification

## 🏷️ **Issue Guidelines**

### **🐛 Bug Reports**
```markdown
**Expected Behavior**: What should happen
**Actual Behavior**: What actually happens  
**Steps to Reproduce**: Minimal reproduction case
**Environment**: OS, Node version, CLI version
**Project Type**: Framework/language being analyzed
```

### **💡 Feature Requests**  
```markdown
**Problem**: What challenge does this solve
**Solution**: Proposed approach
**Use Case**: Real-world scenario
**Priority**: How critical is this feature
```

## 🔒 **Security**

- **Never commit secrets** or API keys
- **Follow our Security Policy**: See [SECURITY.md](SECURITY.md)
- **Report vulnerabilities privately**: `security@fafcli.dev`

## 📋 **Code Review Process**

### **What We Look For**:
- ✅ **Real-world testing**: Did you test on actual projects?
- ✅ **TypeScript quality**: Proper typing and strict compliance  
- ✅ **Performance**: Efficient file scanning and analysis
- ✅ **Documentation**: Clear comments and examples
- ✅ **Backward compatibility**: Don't break existing functionality

### **Review Timeline**:
- **Simple fixes**: 1-2 days
- **New features**: 3-7 days  
- **Major changes**: 1-2 weeks

## 🏎️ **Performance Standards**

faf-cli is built for **F1-Inspired performance**:

- **Generation**: < 200ms for typical projects
- **Scoring**: < 100ms with full analysis
- **Validation**: < 50ms for .faf files
- **Memory**: Minimal footprint, no memory leaks

## 🤝 **Community**

- **Be Respectful**: We're all here to build something awesome
- **Ask Questions**: No question is too basic
- **Share Knowledge**: Help others learn and contribute
- **Have Fun**: Enjoy building tools that eliminate faff!

## 📞 **Get Help**

- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bugs and feature requests  
- **Email**: `hello@fafcli.dev` for direct contact

## 🎉 **Recognition**

Contributors are recognized in:
- **Release Notes**: Feature contributors credited
- **README**: Major contributors listed
- **fafcli.dev**: Contributor showcase (coming soon)

---

**Ready to contribute?** Create an issue or jump straight into a PR!

**The dial IS .faf** 🎯