# FAF Skills Collections Strategy

**Purpose:** Logical bundling for easy installation and distribution across aggregators

## 🏆 Collection Categories

### **FAF Core Collection** (5 skills)
**Target:** New FAF users, onboarding  
**Install:** `faf skills install --bundle=core`

| Skill | Purpose | Priority |
|-------|---------|----------|
| `/faf-expert` | Deep .faf knowledge expert | Essential |
| `/faf-go` | Guided setup & optimization | Essential |
| `/faf-wizard` | Done-for-you generation | High |
| `/faf-champion` | Achieve 100% AI-readiness | High |
| `/faf-sync-master` | Bi-sync .faf ↔ CLAUDE.md | Medium |

### **Publishing Pro Collection** (5 skills)
**Target:** Package maintainers, open source devs  
**Install:** `faf skills install --bundle=publishing`

| Skill | Purpose | Priority |
|-------|---------|----------|
| `/pubpro` | Zero-mistakes publish protocol | Essential |
| `/pubblog` | Release blog post generator | High |
| `/pubpypi` | PyPI publishing workflow | High |
| `/pubcrate` | crates.io publishing workflow | High |
| `/npm-downloads` | Multi-registry analytics | Medium |

### **Development Workflow Collection** (7 skills)
**Target:** Daily development, teams  
**Install:** `faf skills install --bundle=development`

| Skill | Purpose | Priority |
|-------|---------|----------|
| `/commit` | FAF-powered git commits | Essential |
| `/pr` | Context-aware pull requests | Essential |
| `/review` | Intelligent code reviews | High |
| `/git` | Advanced git operations | High |
| `/wjttc-builder` | Championship test suites | Medium |
| `/wjttc-tester` | F1-inspired testing | Medium |
| `/mcp-builder` | MCP server creation | Medium |

### **Creative & Architecture Collection** (8 skills)
**Target:** Product teams, technical architects  
**Install:** `faf skills install --bundle=creative`

| Skill | Purpose | Priority |
|-------|---------|----------|
| `/arch-builder` | Architecture planning | High |
| `/diagram-builder` | Visual diagrams | High |
| `/prd-builder` | Product requirements | High |
| `/sys-reqs-builder` | System requirements | Medium |
| `/gif-recorder` | GIF workflows | Medium |
| `/n8n-builder` | Automation workflows | Medium |
| `/n8n-debugger` | n8n debugging | Low |
| `/claude-md` | CLAUDE.md optimization | Low |

### **Automation & Utilities Collection** (7 skills)
**Target:** Power users, workflow optimization  
**Install:** `faf skills install --bundle=utilities`

| Skill | Purpose | Priority |
|-------|---------|----------|
| `/radiofaf` | Radio FAF protocols | Medium |
| `/send-email` | Email automation | Medium |
| `/globe-post` | Global posting workflows | Medium |
| `/claim-namepoint` | Name/namespace claiming | Low |
| `/repo-maintainer` | Repository maintenance | Low |
| `/xai-faf-rag` | xAI RAG integration | Low |
| `/social-media-check` | Social media auditing | Low |

## 📦 Bundle Installation Strategy

### **Complete Installation**
```bash
faf skills install --bundle=complete
# Installs all 32 skills across all collections
```

### **Curated Bundles**
```bash
faf skills install --bundle=starter     # Core + Development (12 skills)
faf skills install --bundle=publisher   # Publishing + Utilities (12 skills)
faf skills install --bundle=enterprise  # All except personal tools (25 skills)
```

### **Individual Installation**
```bash
faf skills install faf-expert
faf skills install commit pr review
```

## 🎯 Distribution Strategy Per Collection

### **For MCP Listing Updates**
**Current:** "MCP server for .faf format"  
**New:** "Complete FAF ecosystem: MCP + 32 skills in 5 collections for championship-grade workflows"

### **For Skills Aggregators**
Each collection gets submitted as a cohesive package with clear use cases:

1. **FAF Core** → "Essential AI-readiness tools"
2. **Publishing Pro** → "Professional package publishing workflows"  
3. **Development Workflow** → "Context-aware git and code review tools"
4. **Creative & Architecture** → "Technical planning and visualization tools"
5. **Automation & Utilities** → "Workflow automation and productivity tools"

## 🚀 Installation CLI Requirements

### **Core Commands**
```bash
faf skills list                    # Show all available skills
faf skills list --bundle=core      # Show specific collection
faf skills install --bundle=core   # Install collection
faf skills status                  # Show installed skills
faf skills update                  # Update all installed skills
```

### **Integration with MCP**
```bash
faf setup                          # Install MCP + Core skills bundle
faf setup --complete               # Install MCP + All skills
faf setup --check                  # Verify installation
```

## 📊 Success Metrics

### **Adoption Targets**
- **Core Collection:** 1,000+ installs by Q3 2026
- **Publishing Pro:** 500+ installs (package maintainer audience)  
- **Complete Bundle:** 250+ installs (power users)

### **Distribution Targets**
- **Skills Aggregators:** 10+ repositories include FAF collections
- **MCP Cross-promotion:** All 7+ MCP listings mention skills
- **Community Adoption:** 5+ testimonials from teams using FAF workflow

---
*Strategic bundling transforms 32 individual skills into 5 coherent products for different developer personas*