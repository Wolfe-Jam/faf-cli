# 📍 SOURCE CODE LOCATIONS - Where Everything Lives

## The Championship Code to Port

---

## 🎯 FAB-FORMATS Engine (The Main Prize)

### PRIMARY SOURCE:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/FileProcessor.ts
```
**Lines: 1-500+** - Complete FAB-FORMATS implementation
- `discoverFormats()` method
- `gradePackageJsonQuality()` method
- 150+ file handlers
- Two-stage pattern implementation

### SUPPORTING FILES:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/types/index.ts
```
**Lines: 50-200** - Type definitions for FAB-FORMATS

---

## 🔥 RelentlessContextExtractor

### SOURCE:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ContextExtractor.ts
```
**Lines: 1-300** - Three-tier confidence system
- `extractWithConfidence()` method
- CERTAIN/PROBABLE/INFERRED levels
- Aggressive prompting logic

---

## ⚖️ AI|HUMAN Balance Visualizer

### SOURCE:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/components/BalanceVisualizer.svelte
```
**Lines: 1-250** - Visual gamification component
- Progress bar calculations
- Color coding logic (RED/YELLOW/GREEN)
- Psychological messaging

### ALSO CHECK:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/stores/balance.ts
```
**Lines: 1-100** - Balance calculation logic

---

## 🔄 Context-Mirroring (Bi-Sync)

### SOURCE:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ContextMirror.ts
```
**Lines: 1-400** - Bi-directional sync engine
- `.faf` ↔ `CLAUDE.md` sync
- Conflict resolution
- Version tracking

---

## 📚 DropCoach

### SOURCE:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/DropCoach.ts
```
**Lines: 1-200** - Intelligent file guidance
- TOP-6 priority system
- Language-specific recommendations
- Smart file ordering

---

## 🏆 Championship Scoring

### SOURCE:
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ScoreCalculator.ts
```
**Lines: 1-350** - 99-point scale implementation
- Score calculation with FAB-FORMATS
- Visual indicators
- Championship thresholds

---

## 📂 Complete File List to Review

### CORE ENGINE FILES:
```bash
# FAB-FORMATS Core
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/FileProcessor.ts
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/FormatHandlers.ts
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/IntelligenceExtractor.ts

# Human Context Tools
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ContextExtractor.ts
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/RelentlessEngine.ts

# Visual/UX
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/components/BalanceVisualizer.svelte
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/components/DropCoach.svelte
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/components/ScoreDisplay.svelte

# Sync/Persistence
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ContextMirror.ts
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/BiSync.ts

# Scoring
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ScoreCalculator.ts
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ChampionshipScoring.ts
```

---

## 🔍 Key Methods to Port

### From FileProcessor.ts:
```typescript
async discoverFormats(projectDir: string)
gradePackageJsonQuality(packageJson: any): QualityGrade
extractIntelligenceFromFile(filePath: string)
categorizeAndDeduplicate(files: string[])
```

### From ContextExtractor.ts:
```typescript
extractWithConfidence(context: any): ConfidenceLevel
huntForHumanContext(projectDir: string)
buildConfidenceTiers(data: any)
```

### From ContextMirror.ts:
```typescript
syncFafToClaudeMd(fafPath: string, claudePath: string)
syncClaudeMdToFaf(claudePath: string, fafPath: string)
resolveConflicts(fafData: any, claudeData: any)
```

---

## 🎯 The Money Shot - Main File

**THIS IS THE FILE THAT HAS EVERYTHING:**
```
/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/FileProcessor.ts
```

Start here. This has FAB-FORMATS core.
Port this first.
Everything else supports this.

---

## 💻 Quick Commands to View

```bash
# View the main FAB-FORMATS engine
cat /Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/FileProcessor.ts

# See the type definitions
cat /Users/wolfejam/FAF/faf-svelte-engine/src/lib/types/index.ts

# Check RelentlessExtractor
cat /Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ContextExtractor.ts

# View scoring implementation
cat /Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/ScoreCalculator.ts
```

---

## 🏁 Port Priority

### MUST PORT (Core):
1. FileProcessor.ts → fab-formats-engine.ts
2. ScoreCalculator.ts → Update existing score-calculator.ts

### SHOULD PORT (Enhancement):
3. ContextExtractor.ts → relentless-extractor.ts
4. ContextMirror.ts → context-mirror.ts

### NICE TO PORT (Polish):
5. BalanceVisualizer.svelte → balance-visualizer.ts
6. DropCoach.ts → drop-coach.ts

---

**All the championship code is in `/Users/wolfejam/FAF/faf-svelte-engine/`**
**Port it to `/Users/wolfejam/FAF/cli/`**

🏆