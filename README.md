# 🚀 faf-cli

![CI](https://github.com/Wolfe-Jam/faf-cli/workflows/CI/badge.svg)
![npm version](https://img.shields.io/npm/v/@faf/cli.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Generate comprehensive AI context files for any project.**

Command-line interface for .faf (Foundational AI-Context Format) - Create structured context files that help AI understand your project instantly, with validation, scoring, and synchronization capabilities.

## Key Features

- **Balanced Context**: Combines human project context (goals, team, requirements) with technical implementation details
- **Performance Focused**: Championship speed status (<30ms) and fast generation (<200ms)
- **Zero Configuration**: Intelligent project detection with sensible defaults
- **Quality Scoring**: Objective measurement of context completeness (0-100%)

The .faf format bridges human project understanding with technical implementation, providing AI assistants with both the "why" and the "how" of your project.

## 🎯 Quick Start

```bash
# Install globally
npm install -g @faf/cli

# Generate .faf file for your project
faf init

# Validate and score your .faf
faf validate
faf score --details

# Keep it synchronized
faf sync --auto
```

## 📋 Commands

### `faf init`
Generate initial .faf file from project structure
```bash
faf init                           # Auto-detect project type
faf init --template react          # Use specific template
faf init --force                   # Overwrite existing .faf
faf init --output my-project.faf   # Custom output path
```

### `faf validate`
Validate .faf file against schema
```bash
faf validate                    # Validate .faf in current directory
faf validate project.faf        # Validate specific file
faf validate --verbose          # Show detailed validation
faf validate --schema 2.4.0     # Validate against specific version
```

### `faf score`
Calculate completeness score (0-100%)
```bash
faf score                       # Show basic score
faf score --details             # Detailed breakdown by section
faf score --minimum 80          # Fail if score below threshold
```

### `faf sync`
Sync .faf with project changes
```bash
faf sync                        # Show detected changes
faf sync --auto                 # Auto-apply changes
faf sync --dry-run              # Preview changes only
```

### `faf audit`
Check freshness and completeness
```bash
faf audit                       # Full audit report
faf audit --warn-days 7         # Warn if older than 7 days
faf audit --error-days 30       # Error if older than 30 days
```

### `faf lint`
Format compliance checking
```bash
faf lint                        # Check for issues
faf lint --fix                  # Auto-fix formatting
faf lint --schema-version 2.4.0 # Validate against specific schema
```

## 🎯 Scoring System

The CLI uses a comprehensive scoring algorithm that balances human project context with technical implementation details:

- **21 Context Slots**: Covers both project purpose (WHO/WHAT) and technical implementation (HOW)
- **Weighted Scoring**: Human context fields have higher importance weights to prioritize project understanding
- **Project Identity First**: Project goals and team context drive the scoring methodology
- **Technical Completeness**: Ensures AI has all necessary technical details for effective assistance

### Score Ranges
- 🟢 **90-100%**: Comprehensive context coverage
- 🟡 **70-89%**: Good coverage with minor gaps  
- 🔴 **Below 70%**: Requires additional context for optimal AI assistance

## 🏗️ Project Type Detection

Automatically detects and optimizes for:

- **Svelte/SvelteKit** projects
- **React/Next.js** applications  
- **Vue/Nuxt** applications
- **Node.js APIs** and servers
- **Generic** projects with smart defaults

## 📊 What Gets Analyzed

**Anti-Faff Detection** - Smart analysis, automatic context:

The CLI examines your project to populate:

### From `package.json`
- Project name, description, version
- Dependencies → Tech stack detection
- Scripts → Build tools identification

### From File Structure  
- Framework detection (`.svelte`, `.jsx`, `.vue` files)
- Configuration files
- Project organization patterns

### Smart Defaults
- Current year tags
- Project type categorization  
- Open source assumptions
- AI-ready optimizations

## 🔄 Sync Intelligence

**Anti-Faff Automation** - Smart monitoring, zero manual overhead:

`faf sync` monitors and updates:

- Package.json changes (name, version, dependencies)
- Major framework additions/removals
- Stale timestamps (30+ days old)
- Version bumps and releases

## ⚙️ Configuration

The CLI respects `.faf` format standards:

- **Schema Version**: 2.4.0 (latest)
- **Output Format**: Clean YAML with 100-char line width
- **Validation**: Strict schema compliance
- **Timestamps**: ISO 8601 format

## 🎪 Integration Examples

### In CI/CD Pipelines
```yaml
# .github/workflows/faf-check.yml
- name: Validate .faf file
  run: |
    npx @faf/cli validate --minimum 70
    npx @faf/cli audit --error-days 30
```

### Pre-commit Hooks
```bash
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: faf-lint
        name: Lint .faf file
        entry: faf lint --fix
        language: system
```

### Package.json Scripts
```json
{
  "scripts": {
    "faf:check": "faf validate && faf score --minimum 80",
    "faf:sync": "faf sync --auto",
    "faf:audit": "faf audit"
  }
}
```

## 🚀 Programmatic Usage

```typescript
import { validateFafFile, scoreFafFile, generateFafFromProject } from '@faf/cli';

// Validate a .faf file
const validation = await validateFafFile('./project.faf');

// Calculate score
const score = await scoreFafFile('./project.faf', { details: true });

// Generate new .faf
const fafContent = await generateFafFromProject({
  projectType: 'svelte',
  projectRoot: './my-project'
});
```

## 🏎️ Performance

**F1-Inspired Software Engineering** - No bloat, just results:

- **Validation**: < 50ms for typical .faf files
- **Scoring**: < 100ms with full analysis  
- **Generation**: < 200ms including file system scans
- **Zero Dependencies**: Core functionality, minimal overhead
- **Anti-Faff Philosophy**: Every millisecond matters, every feature justified

## 🧪 Testing & Validation

**Real-World Testing** - Validated with actual AI assistants rather than synthetic tests:

### ✅ **Multi-Platform RAW Validation**
- **Claude AI**: 85% accuracy score on cold testing
- **Gemini AI**: 88% accuracy score on zero-context deployment  
- **Fresh Sessions**: Tested with completely new AI assistants (no prior context)

### ✅ **Real-World Project Testing**
- **Go Projects**: Full project detection and scoring
- **Python FastAPI**: Complete framework recognition  
- **React/TypeScript**: Advanced type analysis and strictness levels
- **Vue Applications**: Framework-specific optimizations
- **Node.js APIs**: Backend service detection

### ✅ **Production Environment Testing**  
- **Cold Deployment**: Packaged CLI tested in isolated environments
- **Cross-Platform**: macOS, Linux compatibility validated
- **Network Resilience**: GitHub → npm → global install workflow proven
- **Zero Dependencies**: Core functionality works without external services

### 📊 **Test Results Summary**
```
✅ Framework Detection: 100% accuracy across test projects
✅ TypeScript Analysis: F1-Inspired strictness levels working  
✅ File Detection: FATAL bugs eliminated (bulletproof fs.readdir approach)
✅ AI Validation: 85-88% scores from independent AI evaluation
✅ Package Integrity: 38.1 kB compressed, clean distribution
```

**Why RAW Testing?** Unit tests can lie. AI assistants using your tool in real scenarios cannot.

## 🤝 Contributing

Built with TypeScript and follows the .faf specification. All contributions are validated through our RAW testing methodology.

**Anti-Faff Software Development** - Quality contributions, zero process bloat.

```bash
git clone https://github.com/Wolfe-Jam/faf-cli
cd faf-cli
npm install
npm run dev

# Test with real projects
npm run test:real-world  # References /faf-cli-testing projects
```

## 📄 License

MIT © 🏎️⚡️_wolfejam.dev

---

**🎯 Complete .faf files enable effective AI collaboration**  
*Performance-focused engineering: Comprehensive context with minimal setup overhead.*
