# 📱 r/ClaudeAI Reddit Post (High Impact!)

## The Post

**Title:** I made an MCP server that gives Claude instant understanding of any codebase (800+ weekly downloads)

---

Hey r/ClaudeAI! 👋

You know that painful process of copy-pasting files into Claude, explaining your project structure, listing dependencies, and STILL having it misunderstand your codebase?

I built an MCP server that solves this.

## What it does:
- Scans your entire project (any language/framework)
- Generates a complete .faf context file
- Claude instantly understands everything
- Shows you an "AI readiness score" (aim for 99%)

## The results:
- **Time to explain project:** 20+ minutes → 3 minutes
- **Claude's understanding:** ~22% → 99%
- **Weekly downloads:** 800+ (you all are amazing!)
- **Processing time:** <50ms even on huge codebases

## How to install:
```bash
npm install -g claude-faf-mcp
```

Then add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "claude-faf": {
      "command": "claude-faf-mcp"
    }
  }
}
```

## Also available as CLI:
If you want command-line power too:
```bash
npm install -g faf-cli  # 201 weekly downloads
cd your-project
faf auto  # Generates .faf file
```

## Cool features:
- 33+ MCP tools available in Claude
- Real-time context scoring
- Bi-directional sync with CLAUDE.md
- Works with 154+ file formats
- Zero configuration needed

The idea is to make AI context as standardized as image formats (hence "The JPEG for AI").

**NPM:** https://www.npmjs.com/package/claude-faf-mcp

Would love your feedback! What features would make this more useful for your Claude workflow?

Have you been dot.faffed yet? 🧡⚡️

---

## Why This Works for r/ClaudeAI

1. **They WANT MCP tools** - Hungry for new MCP servers
2. **Solves their exact pain** - Context management
3. **Social proof** - 800 downloads shows it works
4. **Immediate value** - They can install and use RIGHT NOW
5. **Not salesy** - Asking for feedback, not selling

## Best Time to Post

- **Tuesday-Thursday**
- **10am-12pm EST** (Most active)
- **Avoid Mondays** (Anthropic announcements)

## Engagement Strategy

1. **Respond quickly** to first comments
2. **Thank people** for trying it
3. **Ask specifics:** "What's your use case?"
4. **Share tips:** How to get to 99% score
5. **Cross-link:** Mention CLI for non-Claude users

## Expected Response

- "Finally! I needed this!"
- "How does it compare to [other tool]?"
- "Can it handle [specific framework]?"
- "What about security/privacy?"
- "Feature request: [specific need]"

## Follow-up Posts (Later)

- "Update: Added feature you all requested!"
- "Thanks r/ClaudeAI - we hit 1,000 downloads!"
- "Tutorial: Getting 99% scores with .faf"

---

## Alternative Titles

1. "Made an MCP that explains your whole codebase to Claude in 3 minutes"
2. "800+ people are using this MCP for instant Claude context"
3. "Stop copy-pasting files to Claude - MCP server for instant context"
4. "From 20 minutes to 3 minutes: MCP for Claude context management"

---

**Remember:** r/ClaudeAI is YOUR PEOPLE. They have the exact problem you solve!