# 🏎️ FAF CLI v2.0.0 Build Specification

## EXACTLY What We're Building

**Current State:** CLI has inferior TURBO-CAT scoring (24-43% scores)
**Target State:** CLI with FAB-FORMATS engine matching web's 86% scores

---

## 🎯 Core Changes Required

### 1. RIP OUT TURBO-CAT, INSERT FAB-FORMATS
**Location:** `/Users/wolfejam/FAF/cli/src/scoring/score-calculator.ts`
**Action:** Replace entire TurboCat implementation with FAB-FORMATS engine
**Source:** Port from `/Users/wolfejam/FAF/faf-svelte-engine/src/lib/services/FileProcessor.ts`

### 2. FAB-FORMATS ENGINE FEATURES TO PORT
```typescript
// FROM WEB VERSION - MUST HAVE ALL:
- 150+ file format handlers
- Two-stage discovery pattern (find first, read second)
- 5-tier quality grading (EXCEPTIONAL/PROFESSIONAL/GOOD/BASIC/MINIMAL)
- Deep extraction per format (not just detection)
- Intelligent deduplication
- Context extraction with confidence scores
- Slot fill recommendations
```

### 3. RELENTLESSCONTEXTEXTRACTOR INTEGRATION
**New Feature:** Hunt down human context with 3-tier confidence
```typescript
// MUST INCLUDE:
- CERTAIN level (explicit statements)
- PROBABLE level (strong indicators)
- INFERRED level (contextual clues)
- Aggressive prompting for missing context
- Won't accept <99% completion
```

### 4. AI|HUMAN BALANCE VISUAL
**New Feature:** Visual gamification without math
```typescript
// REQUIREMENTS:
- Progress bars for AI vs Human context
- Color coding (RED/YELLOW/GREEN)
- Psychological motivation (not percentages)
- "You're killing the AI" messaging
- Visual slot filling (15 tech + 6 human)
```

### 5. CONTEXT-MIRRORING BI-SYNC
**Critical Feature:** Never lose context between sessions
```typescript
// IMPLEMENTATION:
- .faf ←→ CLAUDE.md bi-directional sync
- Automatic session persistence
- Cross-project context sharing
- Version tracking
- Conflict resolution
```

---

## 📦 Exact File Changes Needed

### Files to CREATE:
```
/cli/src/engines/fab-formats-engine.ts     # Full FAB-FORMATS port
/cli/src/engines/relentless-extractor.ts   # Human context hunter
/cli/src/engines/context-mirror.ts         # Bi-sync engine
/cli/src/ui/balance-visualizer.ts          # AI|HUMAN visual
/cli/src/ui/drop-coach.ts                  # File drop guidance
```

### Files to MODIFY:
```
/cli/src/scoring/score-calculator.ts       # Replace TurboCat with FAB
/cli/src/commands/enhance.ts               # Add RelentlessExtractor
/cli/src/commands/sync.ts                  # Add Context-Mirroring
/cli/src/utils/faf-manager.ts              # Add visual balance
```

### Files to DELETE:
```
/cli/src/utils/turbo-cat.ts               # Remove inferior engine
```

---

## 🔧 Technical Implementation Details

### FAB-FORMATS Two-Stage Pattern:
```typescript
// STAGE 1: Discovery without reading
const allFiles = await findAllFormats(projectDir);

// STAGE 2: Smart reading with dedup
const categorized = categorizeAndDeduplicate(allFiles);
const results = await extractIntelligence(categorized);
```

### Quality Grading System:
```typescript
gradeQuality(data: any): QualityGrade {
  // MUST MATCH WEB VERSION EXACTLY:
  if (has10+DetailedSections) return 'EXCEPTIONAL';
  if (has5+Sections) return 'PROFESSIONAL';
  if (has3+Sections) return 'GOOD';
  if (hasBasicInfo) return 'BASIC';
  return 'MINIMAL';
}
```

### RelentlessExtractor Prompts:
```typescript
const prompts = {
  CERTAIN: "What EXACTLY is this project?",
  PROBABLE: "What does this PROBABLY do?",
  INFERRED: "What can we INFER from structure?"
};
```

---

## 🎯 Success Criteria

### MUST ACHIEVE:
1. **Score Improvement:** 24% → 85%+ on FAF CLI project
2. **Feature Parity:** All web innovations in CLI
3. **Performance:** <50ms operations
4. **Quality:** 5-tier grading working
5. **Persistence:** Context never lost

### MUST INCLUDE TOOLS:
- [x] FAB-FORMATS Engine (150+ formats)
- [x] RelentlessContextExtractor
- [x] AI|HUMAN Balance
- [x] Context-Mirroring
- [x] DropCoach
- [x] Championship Scoring
- [x] 21-Slot System

---

## 🏁 Build Priority Order

### PHASE 1: Core Engine (IMMEDIATE)
1. Port FAB-FORMATS engine completely
2. Replace TurboCat in score-calculator
3. Test scoring improvement

### PHASE 2: Enhancement Tools (NEXT)
4. Add RelentlessContextExtractor
5. Implement AI|HUMAN Balance visual
6. Add DropCoach guidance

### PHASE 3: Persistence (FINAL)
7. Implement Context-Mirroring
8. Add bi-sync with CLAUDE.md
9. Test session persistence

---

## 💻 Development Commands

```bash
# Current working directory
/Users/wolfejam/FAF/cli

# Test current scoring (baseline)
npm test

# Run scoring on self
npm run score

# Build and test
npm run build
npm test

# Test on real projects
faf score /Users/wolfejam/FAF/cli
faf score /Users/wolfejam/FAF/theblockchain-ai
```

---

## 🚀 Expected Results

### BEFORE (Current):
- FAF CLI: 24% score
- theblockchain-ai: 38% score
- No human context extraction
- No persistence
- Basic file detection only

### AFTER (Target):
- FAF CLI: 85%+ score
- theblockchain-ai: 90%+ score
- Aggressive human context hunting
- Perfect session persistence
- Deep intelligence extraction

---

## 🏆 The Bottom Line

**We're taking the championship web engine and putting it in the CLI.**

Not improving TURBO-CAT.
Not tweaking scores.
**REPLACING WITH FAB-FORMATS.**

This is the web's 86% engine going into CLI.
This is championship performance.
This is what ships Monday.

---

## Ready to Build?

All source code is in `/Users/wolfejam/FAF/faf-svelte-engine`
All target code goes in `/Users/wolfejam/FAF/cli`

**Let's build the championship CLI.**

🏁