# FAF Skills Installation CLI Automation Specification

**Purpose:** Seamless installation commands that integrate MCP + Skills ecosystem

## 🎯 Core Commands Design

### **Primary Setup Commands**
```bash
faf setup                    # MCP + Core skills bundle (recommended)
faf setup --complete         # MCP + All 32 skills  
faf setup --minimal          # MCP only (existing behavior)
faf setup --check           # Verify complete installation
```

### **Skills Management Commands** 
```bash
faf skills list              # Show all available skills
faf skills list --installed  # Show installed skills only
faf skills list --bundle=X   # Show specific collection

faf skills install X         # Install individual skill
faf skills install --bundle=core      # Install collection
faf skills install --bundle=complete  # Install all skills

faf skills status           # Show installation status
faf skills update           # Update all installed skills
faf skills uninstall X     # Remove specific skill
```

### **Bundle Collections**
```bash
faf skills install --bundle=core        # 5 essential FAF skills
faf skills install --bundle=development # 7 git/workflow skills  
faf skills install --bundle=publishing  # 5 publishing skills
faf skills install --bundle=creative    # 8 architecture skills
faf skills install --bundle=utilities   # 7 automation skills
faf skills install --bundle=complete    # All 32 skills
```

## 🏗️ Implementation Architecture

### **File Structure**
```
src/
├── commands/
│   ├── skills/
│   │   ├── list.ts          # faf skills list
│   │   ├── install.ts       # faf skills install  
│   │   ├── status.ts        # faf skills status
│   │   └── uninstall.ts     # faf skills uninstall
│   └── setup.ts             # Enhanced faf setup
├── core/
│   ├── skills-manager.ts    # Skills installation logic
│   ├── skills-registry.ts   # Available skills catalog
│   └── bundles.ts          # Bundle definitions
└── utils/
    ├── claude-detection.ts  # Detect Claude Code installation
    └── skills-sync.ts      # Sync with ~/.claude/skills/
```

### **Skills Registry Structure**
```typescript
interface SkillDefinition {
  id: string;              // 'faf-expert'
  name: string;            // 'FAF Expert'
  description: string;     // 'Deep .faf knowledge expert'
  bundle: string[];        // ['core', 'complete']
  priority: 'essential' | 'high' | 'medium' | 'low';
  dependencies: string[];   // Other skills required
  source: {
    type: 'github' | 'local';
    url?: string;           // GitHub raw URL
    path?: string;          // Local file path
  };
}

interface BundleDefinition {
  id: string;              // 'core'
  name: string;            // 'FAF Core Collection'
  description: string;     // 'Essential .faf management'
  skills: string[];        // ['faf-expert', 'faf-go', ...]
  installOrder: string[];  // Installation sequence
}
```

## 📦 Installation Flow Design

### **MCP + Skills Integration**
```typescript
async function setupComplete() {
  // 1. Verify/install MCP server
  await ensureMCPInstalled();
  
  // 2. Detect Claude Code installation
  const claudeConfig = await detectClaudeConfig();
  
  // 3. Install core skills by default
  await installSkillsBundle('core');
  
  // 4. Configure integration
  await configureMCPSkillsIntegration();
  
  // 5. Verify installation
  return await verifyInstallation();
}
```

### **Skills Installation Process**
```typescript
async function installSkill(skillId: string) {
  // 1. Resolve skill definition
  const skill = await getSkillDefinition(skillId);
  
  // 2. Check dependencies
  await installDependencies(skill.dependencies);
  
  // 3. Download/copy skill files
  await downloadSkillFiles(skill);
  
  // 4. Install to ~/.claude/skills/
  await installToClaudeDirectory(skill);
  
  // 5. Verify installation
  return await verifySkillInstallation(skillId);
}
```

## 🔧 Command Implementations

### **Enhanced faf setup Command**
```typescript
// src/commands/setup.ts
export async function setupCommand(options: {
  complete?: boolean;
  minimal?: boolean;
  check?: boolean;
}) {
  if (options.check) {
    return await checkInstallation();
  }
  
  // Install MCP server (existing logic)
  await installMCPServer();
  
  // Install skills based on options
  if (options.complete) {
    await installSkillsBundle('complete');
  } else if (!options.minimal) {
    // Default: install core bundle
    await installSkillsBundle('core');
  }
  
  // Configure integration
  await configureMCPSkillsIntegration();
  
  // Show success message with next steps
  showSuccessMessage();
}
```

### **Skills List Command**
```typescript
// src/commands/skills/list.ts
export async function listSkills(options: {
  installed?: boolean;
  bundle?: string;
}) {
  const allSkills = await getAvailableSkills();
  const installedSkills = await getInstalledSkills();
  
  let displaySkills = allSkills;
  
  if (options.installed) {
    displaySkills = allSkills.filter(s => installedSkills.includes(s.id));
  }
  
  if (options.bundle) {
    const bundle = await getBundle(options.bundle);
    displaySkills = allSkills.filter(s => bundle.skills.includes(s.id));
  }
  
  displaySkillsTable(displaySkills);
}
```

### **Skills Install Command**
```typescript
// src/commands/skills/install.ts
export async function installSkills(
  skillIds: string[],
  options: { bundle?: string }
) {
  if (options.bundle) {
    return await installSkillsBundle(options.bundle);
  }
  
  for (const skillId of skillIds) {
    await installSkill(skillId);
    console.log(`✅ Installed ${skillId}`);
  }
  
  await showInstallationSummary();
}
```

## 🎨 User Experience Design

### **Success Messages**
```
🏆 FAF Setup Complete!

✅ MCP Server: claude-faf-mcp (33 tools)
✅ Core Skills: 5 essential workflows installed
✅ Integration: Ready for Claude Code

Next steps:
• Try: /faf-expert
• Browse all: faf skills list  
• Install more: faf skills install --bundle=development

Your AI now has persistent project context! 🚀
```

### **Skills Status Output**
```
📊 FAF Skills Status

Installed (12/32):
✅ faf-expert       ✅ faf-go         ✅ commit
✅ pr               ✅ review         ✅ pubpro
✅ arch-builder     ✅ diagram-builder
...

Available Bundles:
• development (5 more skills)
• publishing (3 more skills)  
• creative (6 more skills)
• utilities (6 more skills)

Install: faf skills install --bundle=development
```

## 🔄 Integration Points

### **MCP Server Integration**
- Detect existing claude-faf-mcp installation
- Auto-configure skills discovery in MCP server
- Enable MCP <-> Skills data sharing

### **Claude Code Detection**
- Find ~/.claude/skills/ directory
- Verify Claude Code installation
- Handle permission issues gracefully

### **Cross-Platform Support** 
- Windows: %APPDATA%\Claude\skills\
- macOS: ~/.claude/skills/
- Linux: ~/.config/claude/skills/

## 📊 Analytics & Feedback

### **Installation Tracking**
```typescript
interface InstallationEvent {
  command: string;        // 'faf setup --complete'
  timestamp: Date;
  skills_installed: string[];
  bundle?: string;
  success: boolean;
  error?: string;
}
```

### **Usage Metrics**
- Track which bundles are most popular
- Monitor installation success rates
- Identify common failure points
- Gather performance metrics

---
*Seamless installation experience that positions FAF as complete ecosystem, not just individual tools*