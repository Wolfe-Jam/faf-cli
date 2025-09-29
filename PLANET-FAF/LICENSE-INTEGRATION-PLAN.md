# License System Integration Plan

## Goal
Make the license system actually work and testable in the FAF CLI

## Current State
- ✅ License modules created (but isolated)
- ✅ Engine loader created (but not used)
- ❌ Not integrated into CLI
- ❌ MK-2 has compilation errors
- ❌ Score command doesn't use license system

## Integration Plan

### Phase 1: Fix Foundation (Priority 1)
**Goal:** Get everything compiling

1. **Fix TypeScript Errors**
   - Create `src/types/engine-types.ts` for shared types
   - Fix MK-2 engine imports (TURBO_CAT_KNOWLEDGE doesn't exist as export)
   - Fix engine-bridge.ts imports
   - Ensure all files compile

2. **Create Fallback Stubs**
   - If MK-2 can't load, fallback to basic scoring
   - Ensure CLI works even without engine

### Phase 2: Wire License Commands (Priority 2)
**Goal:** Make license commands available

1. **Add to cli.ts**
   ```typescript
   program
     .command('license')
     .description('Manage FAF license')
     .action(showLicense);

   program
     .command('license:set <key>')
     .description('Set license key')
     .action(setLicense);
   ```

2. **Add license-config commands**
   ```typescript
   program
     .command('license:config')
     .description('Show license configuration')
     .action(showLicenseConfig);
   ```

### Phase 3: Integrate Engine Loader (Priority 3)
**Goal:** Make scoring use the license system

1. **Update score command**
   - Import engineLoader
   - Load appropriate engine based on license
   - Apply score caps based on license tier
   - Show license info in score output

2. **Update init command**
   - Use engine loader for analysis
   - Show license tier in output
   - Add upgrade prompts if hitting limits

### Phase 4: Simplify MK-2 (Priority 4)
**Goal:** Get MK-2 working without all dependencies

1. **Create Minimal MK-2**
   - Remove dependency on non-existent modules
   - Use simplified scoring for now
   - Focus on license validation working

2. **Stub Complex Features**
   - FAB-FORMATS → simple file counting
   - TURBO-CAT → basic format detection
   - DNA system → skip for now

### Phase 5: Testing Flow (Priority 5)
**Goal:** Verify it works end-to-end

1. **Test Commands**
   ```bash
   # Check default (free tier)
   faf license

   # Test scoring with free tier (85% cap)
   faf score

   # Set developer license
   faf license:set DEVELOPER-MK1-NEVER-test123

   # Test scoring with developer tier (90% cap)
   faf score

   # Test championship mode
   faf championship

   # Test config
   FAF_FREE_LIMIT=75 faf score
   ```

2. **Expected Behaviors**
   - Free tier: Scores cap at 85%
   - Developer: Scores cap at 90%
   - License persists across runs
   - Config overrides work

## Implementation Order

### Step 1: Minimal Working Version (30 min)
1. Fix type errors to compile
2. Add basic license command
3. Make score command check license
4. Test free tier works

### Step 2: Full Integration (30 min)
1. Add all license commands
2. Integrate engine loader
3. Add championship mode
4. Test tier switching

### Step 3: Polish (15 min)
1. Add upgrade prompts
2. Improve error messages
3. Add help text
4. Document usage

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| MK-2 won't compile | High | Use stub version initially |
| Engine loader fails | High | Fallback to direct scoring |
| License file issues | Medium | Use in-memory fallback |
| Config complexity | Low | Start with defaults only |

## Success Criteria

✅ **Minimum Viable**
- [ ] `faf license` shows current tier
- [ ] `faf score` respects tier limits
- [ ] Can switch between tiers
- [ ] Compiles without errors

✅ **Full Success**
- [ ] All license commands work
- [ ] Config system works
- [ ] Championship mode works
- [ ] MK-1/MK-2 selection works
- [ ] Persistent license storage

## Alternative Approach

If the full integration is too complex, we could:

1. **Super Simple Version**
   - Just add score cap based on env variable
   - `FAF_SCORE_CAP=85 faf score`
   - Skip engines, just cap the number
   - Add license commands later

2. **Benefits**
   - Works in 10 minutes
   - No complex dependencies
   - Easy to test
   - Can evolve later

## Recommendation

**Start with Alternative Approach** - Get something working quickly:
1. Add simple score capping
2. Add basic license command
3. Test it works
4. Then add complexity

This gets you testing in 10 minutes vs 1 hour.

---

**What approach would you prefer?**
1. Full integration (1 hour, everything)
2. Minimal viable (30 min, basics work)
3. Super simple (10 min, just caps)