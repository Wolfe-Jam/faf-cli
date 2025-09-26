# ⚡️💥 GET ALL! Installation Guide

## One-Liner Power Install

```bash
npm i -g faf-cli claude-faf-mcp && echo "⚡️💥 DOUBLE DOWN! You got BOTH!"
```

## Chrome Extension
**[🖥️⚡️ INSTALL CHROME EXTENSION → faf.one/chrome](https://faf.one/chrome)**

## What You Get

### 🩵⚡️ faf-cli
- AI-powered CLI
- Zero-dependency @faf/core
- 33% leaner (only 6 deps)
- <50ms operations
- 100% tested

### 🧡⚡️ claude-faf-mcp
- Claude Desktop integration
- 33+ MCP tools
- Real-time scoring
- Single dependency
- PR #2759 submitted

## Complete Setup

```bash
# 1. Install BOTH packages ⚡️💥
npm install -g faf-cli claude-faf-mcp

# 2. Configure Claude Desktop (Mac)
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << EOF
{
  "mcpServers": {
    "claude-faf-mcp": {
      "command": "claude-faf-mcp",
      "args": [],
      "env": {}
    }
  }
}
EOF

# 3. Restart Claude Desktop

# 4. Test CLI
faf auto  # Generate .faf in any project

# 5. Test MCP in Claude
# Type: "faf score" in Claude Desktop
```

## Why Get BOTH?

**CLI + MCP = MAXIMUM POWER! ⚡️💥**

- **CLI**: Work from terminal, generate .faf files, check scores
- **MCP**: Use Claude Desktop with 33+ context tools
- **Together**: Complete AI context ecosystem

## Quick Commands

### CLI Commands 🩵⚡️
```bash
faf auto              # Smart .faf generation
faf score --details   # AI-readiness percentage
faf trust            # Trust dashboard
faf chat             # Interactive setup
```

### MCP Tools in Claude 🧡⚡️
```
faf_score           # Get current score
faf_auto            # Generate .faf
faf_enhance         # Improve context
faf_validate        # Check validity
```

---

**🏎️⚡️ FAST AF - The JPEG for AI™**