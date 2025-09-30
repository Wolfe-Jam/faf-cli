# 🔄 Seamless Development Protocol

## Context That Travels

### Core Files (Auto-Sync)
- `.faf` - Project DNA, universal truth
- `CLAUDE.md` - Session persistence & memory
- `package.json` - Dependencies & configuration
- `.fafignore` - Exclusion rules

### Session Handoffs
When switching between sessions/agents:
1. Changes are reflected in files
2. Context travels automatically
3. No repeated explanations needed
4. Work continues uninterrupted

## Recent Improvements

### Clean Build Script (Node.js)
**Problem**: Shell commands hit sandbox restrictions
**Solution**: `scripts/clean-build.js` using Node.js
**Benefits**:
- Works in all environments (sandbox-safe)
- Cross-platform (Windows/Mac/Linux)
- Uses existing dependencies (glob)
- Clear error messages

### Quick Mode (-q flag)
**Problem**: Codex users typing --quiet repeatedly
**Solution**: Added -q shortcut
**Benefits**:
- Shorter commands
- Unix standard
- Both -q and --quiet work

## The Seamless Philosophy

"It should just work" - across:
- Different AI assistants (Claude, Codex, Copilot)
- Multiple sessions
- Various platforms
- Team members
- Time gaps

## Implementation Checklist

✅ Shared context files (.faf, CLAUDE.md)
✅ Cross-platform scripts (Node.js based)
✅ Sandbox-friendly operations
✅ Clear documentation
✅ Backwards compatibility
✅ Smart defaults

---

*This is how we achieve "just works" development - context that travels seamlessly everywhere.*