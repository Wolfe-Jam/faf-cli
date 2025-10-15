#!/bin/bash
# MCP Ecosystem Research - Get stats for all major MCP servers

echo "🔍 MCP ECOSYSTEM RESEARCH"
echo "========================="
echo ""

packages=(
  "@modelcontextprotocol/sdk"
  "@playwright/mcp"
  "chrome-devtools-mcp"
  "@mastra/mcp"
  "n8n-mcp"
  "mcp-proxy"
  "@langchain/mcp-adapters"
  "mcp-handler"
  "tavily-mcp"
  "n8n-nodes-mcp"
  "@supabase/mcp-utils"
  "@upstash/context7-mcp"
  "mcp-framework"
  "@hono/mcp"
  "gemini-mcp-tool"
  "@expo/mcp-tunnel"
  "@browsermcp/mcp"
  "@agent-infra/mcp-server-browser"
  "@mobilenext/mobile-mcp"
  "mcp-hello-world"
  "@mzxrai/mcp-webresearch"
)

for pkg in "${packages[@]}"; do
  echo "📦 $pkg"

  # Get package info
  info=$(npm view "$pkg" version description 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "   $info" | sed 's/^/   /'

    # Get download stats
    downloads=$(curl -s "https://api.npmjs.org/downloads/point/last-week/$pkg" 2>/dev/null)
    if [ $? -eq 0 ]; then
      dl_count=$(echo "$downloads" | grep -o '"downloads":[0-9]*' | cut -d: -f2)
      if [ -n "$dl_count" ]; then
        # Format with commas
        formatted=$(printf "%'d" $dl_count 2>/dev/null || echo $dl_count)
        echo "   📊 Weekly downloads: $formatted"
      fi
    fi
  else
    echo "   ⚠️  Package not found"
  fi

  echo ""
  sleep 0.2  # Rate limit
done

echo "✅ Research complete!"
