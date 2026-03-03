# FAF Pro — tri-sync

**Define once. Remember forever.**

## What is tri-sync?

FAF has two layers of memory:

```
bi-sync:   project.faf  <-->  CLAUDE.md                    (free forever)
tri-sync:  project.faf  <-->  CLAUDE.md  <-->  MEMORY.md   (Pro)
```

- **ROM** (`.faf`) — Your project DNA. Stack, conventions, architecture. Defined once, portable everywhere.
- **RAM** (`MEMORY.md`) — Session memory. Your AI remembers project context, decisions, and conventions across every session. No more re-explaining.

bi-sync keeps your `.faf` and `CLAUDE.md` in sync. Free for all devs, forever.

tri-sync adds RAM — persistent session memory that survives across every AI session.

## Commands

```bash
faf tri-sync              # ROM <-> CLAUDE.md <-> MEMORY.md
faf ram export            # ROM -> RAM (seed Claude's memory)
faf ram import            # RAM -> ROM (harvest Claude's notes)
faf ram sync              # Bidirectional sync
faf ram status            # Show sync status
faf pro                   # Check Pro status
faf pro activate <key>    # Activate your license
```

## 14-Day Free Trial

tri-sync starts with a free 14-day trial. No signup, no credit card. Just run `faf tri-sync` and it activates automatically.

After the trial:
- **bi-sync stays free** — `.faf` and `CLAUDE.md` sync forever
- **tri-sync locks** — RAM (session memory) requires a Pro license

## Pricing

Early-adopter rates, locked in forever:

| Plan | Price | Savings |
|------|-------|---------|
| Monthly | $3/mo | 70% off (normally $10/mo) |
| Annual | $19/yr | 84% off |
| Global (CLI + MCP) | $29/yr | 88% off |

Purchase at **[faf.one/pro](https://faf.one/pro)**

## Activation

After purchase, you'll receive a license key via email:

```bash
faf pro activate FAF-XXXX-XXXX-XXXX-XXXX
```

Check your status anytime:

```bash
faf pro
```

## How It Works

tri-sync is merge-safe. It preserves Claude's existing notes and only touches the FAF section of MEMORY.md. Your AI's own observations stay intact.

```bash
# Seed Claude's memory with your project context
faf ram export

# After working with Claude, harvest what it learned
faf ram import

# Or just sync both ways
faf ram sync
```

The 200-line MEMORY.md ceiling is respected — tri-sync warns you if you're approaching the limit.

## File Locations

```
~/.faf/trial.json         # Trial state (auto-created)
~/.faf/license.json       # Pro license (after activation)
```

## FAQ

**What if I lose my license key?**
Reply to your activation email at team@faf.one. We'll resend it.

**Does it work offline?**
Yes. License validation is local — no phone-home, no internet required.

**Can I use it on multiple machines?**
Yes. Activate with the same key on each machine.

**What's the difference between bi-sync and tri-sync?**
bi-sync: `.faf` <-> `CLAUDE.md` (project structure). Free.
tri-sync: adds `MEMORY.md` (session memory). Pro.

**What happens to bi-sync if I don't upgrade?**
Nothing. bi-sync is free forever. Your `.faf` and `CLAUDE.md` keep syncing.

## Support

- [Documentation](https://github.com/Wolfe-Jam/faf-cli#readme)
- [Community Discussions](https://github.com/Wolfe-Jam/faf-cli/discussions)
- Email: team@faf.one
