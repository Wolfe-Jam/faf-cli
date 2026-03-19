# Claude Code Skills

**FAF ships 16 skills** that run inside Claude Code sessions. Type `/` and go — no install, no setup.

| Skill | What it does |
|-------|-------------|
| `/faf-score` | Score your `.faf` (0-100%) — runs in background while you work |
| `/faf-auto` | Zero to 100% in one command |
| `/faf-go` | Guided interview to Gold Code |
| `/faf-init` | Create `.faf` from your project |
| `/faf-sync` | Bi-sync `.faf` ↔ CLAUDE.md |
| `/faf-status` | Quick health check (<200ms) |
| `/faf-formats` | TURBO-CAT discovers all formats |
| `/faf-expert` | Deep `.faf` knowledge on demand |
| `/commit` | Context-aware git commits powered by FAF |
| `/pr` | Context-aware pull requests powered by FAF |
| `/review` | Context-aware code reviews powered by FAF |
| `/wjttc-builder` | Auto-generate championship-grade test suites |
| `/wjttc-tester` | F1-inspired testing expert |
| `/mcp-builder` | Guide for creating MCP servers |
| `/pubblog` | Generate release blog posts |
| `/pubpro` | npm + MCP Registry publish protocol |

## Why skills matter

Claude Code runs `faf score` in the background while you're coding. No context switch, no terminal tab, no waiting. The skill tells Claude what to do — the CLI does the work. You get a score without lifting a finger.

```
You: "check the score"
Claude: runs /faf-score in background, continues helping you code
Claude: "100/100 🏆 — Trophy. Born at 33%, now 100% over 59 days."
```

Skills are defined in your Claude Code config. [Learn more about Claude Code skills](https://code.claude.com/docs/en/skills). Publish and discover skills on the [Anthropic Skills Registry](https://github.com/anthropics/skills).
