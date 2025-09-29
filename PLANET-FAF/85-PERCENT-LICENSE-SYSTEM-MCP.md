# 85% LICENSE SYSTEM - MCP Version

## MCP vs CLI Licensing

### The Difference
- **CLI**: User runs commands directly, sees caps
- **MCP**: AI assistant uses FAF, user may not see the cap directly
- **Challenge**: How to communicate limits through AI interface

## MCP Implementation Strategy

### 1. Add License Info to MCP Responses

In your MCP server (`claude-faf-mcp/src/index.ts` or similar):

```typescript
// When returning FAF analysis
async function getFafAnalysis(path: string) {
  const result = await analyzeFaf(path);

  // Check for license cap
  const scoreCap = process.env.FAF_MCP_SCORE_CAP || process.env.FAF_SCORE_CAP || '100';
  const capValue = parseInt(scoreCap);

  if (result.score > capValue) {
    result.originalScore = result.score;
    result.score = capValue;
    result.licenseCapped = true;
    result.licenseMessage = `Score limited to ${capValue}% (MCP free tier). Actual score: ${result.originalScore}%`;
  }

  return result;
}
```

### 2. MCP Tool Response Format

When returning capped scores through MCP:

```json
{
  "score": 85,
  "originalScore": 92,
  "licenseCapped": true,
  "licenseInfo": {
    "tier": "free",
    "limit": 85,
    "message": "Upgrade for full analysis capabilities"
  },
  "analysis": {
    // Regular FAF analysis
  }
}
```

### 3. AI Assistant Messaging

The AI will naturally communicate the cap:

```
AI: I've analyzed your project with FAF. Your score is 85% (free tier limit).
    The actual score would be 92% with the full version.

    Here's what I found...
    [continues with analysis]
```

### 4. MCP-Specific Environment Variables

```bash
# For MCP specifically
FAF_MCP_SCORE_CAP=85      # Cap for MCP usage
FAF_MCP_TIER=free          # Tier for MCP
FAF_MCP_SHOW_UPGRADE=true  # Show upgrade prompts
```

### 5. MCP Server Configuration

In MCP server startup:

```typescript
class FafMcpServer {
  private licenseTier: string;
  private scoreCap: number;

  constructor() {
    // MCP-specific caps can be different from CLI
    this.scoreCap = parseInt(process.env.FAF_MCP_SCORE_CAP || '85');
    this.licenseTier = process.env.FAF_MCP_TIER || 'free';
  }

  async handleFafScore(params: any) {
    const result = await this.calculateScore(params);

    // Apply MCP-specific cap
    if (result.score > this.scoreCap) {
      return {
        ...result,
        score: this.scoreCap,
        actualScore: result.score,
        licensedCapped: true,
        upgradeHint: 'Contact FAF for MCP Pro license'
      };
    }

    return result;
  }
}
```

## MCP License Tiers

### Free MCP Tier (Default)
- Score cap: 85%
- Basic analysis
- Standard formats
- Public to all MCP users

### MCP Pro Tier
- Score cap: 100%
- Full analysis
- All formats
- Advanced insights
- Requires license key

### MCP Enterprise
- Custom integration
- Team licenses
- Analytics
- SLA

## Usage Examples

### Default MCP (85% cap)
```bash
# Start MCP server with default cap
npm run start:mcp
```

AI sees:
```json
{
  "tool": "faf_score",
  "result": {
    "score": 85,
    "capped": true,
    "tier": "free"
  }
}
```

### MCP Pro (No cap)
```bash
# Start with pro license
FAF_MCP_TIER=pro FAF_MCP_SCORE_CAP=100 npm run start:mcp
```

### Testing Different Caps
```bash
# Test restrictive
FAF_MCP_SCORE_CAP=70 npm run start:mcp

# Test standard
FAF_MCP_SCORE_CAP=85 npm run start:mcp

# Test generous
FAF_MCP_SCORE_CAP=95 npm run start:mcp
```

## MCP-Specific Considerations

### 1. Indirect User
- User doesn't see FAF directly
- AI communicates the limitation
- Must be clear in AI's response

### 2. Volume Usage
- MCP might analyze many projects
- Consider rate limiting
- Track usage per API key

### 3. Upgrade Path
```typescript
// In MCP response
if (licenseCapped) {
  response.upgradeInfo = {
    message: "Get full FAF analysis",
    url: "https://faf.one/mcp-pro",
    benefits: [
      "100% scoring",
      "Advanced patterns",
      "Priority support"
    ]
  };
}
```

### 4. Grace Period
```typescript
// Allow some full scores to show value
const gracePeriod = parseInt(process.env.FAF_MCP_GRACE_USES || '3');
if (usageCount <= gracePeriod) {
  // Don't cap first few uses
  return fullScore;
}
```

## MCP Integration Points

### 1. In MCP Tool Definition
```typescript
{
  name: "faf_score",
  description: "Analyze with FAF (free tier: 85% cap)",
  parameters: {
    path: { type: "string" }
  }
}
```

### 2. In Tool Response
```typescript
async execute(params) {
  const result = await fafAnalyze(params.path);

  // Always include license info
  result.licenseInfo = {
    tier: this.tier,
    capped: result.score === this.scoreCap,
    upgradeAvailable: this.tier === 'free'
  };

  return result;
}
```

### 3. In AI Prompt Context
```
When using FAF through MCP:
- Free tier caps scores at 85%
- If score is capped, mention it
- Suggest upgrade for full analysis
```

## Testing MCP Caps

### Test Script
```bash
#!/bin/bash
# test-mcp-caps.sh

echo "Testing MCP with different caps..."

# Test free tier
FAF_MCP_SCORE_CAP=85 npm run test:mcp

# Test pro tier
FAF_MCP_SCORE_CAP=100 npm run test:mcp

# Test custom cap
FAF_MCP_SCORE_CAP=90 npm run test:mcp
```

## Rollout for MCP

### Phase 1: Soft Launch
- No default cap
- Test with specific partners
- Gather feedback

### Phase 2: Default 85%
- New MCP installs get 85% cap
- Existing keep 100%
- Monitor usage

### Phase 3: Full Implementation
- All MCP users on tiers
- License key distribution
- Usage analytics

## The MCP Advantage

MCP users are **perfect for licensing**:
1. They're already technical
2. They value automation
3. They're likely in companies
4. They'll pay for productivity

## Simple MCP Test

```typescript
// Quick test in MCP server
const TEST_MODE = process.env.FAF_MCP_TEST === 'true';

if (TEST_MODE) {
  // Rotate through caps to test
  const caps = [70, 85, 95, 100];
  const cap = caps[Math.floor(Date.now() / 60000) % 4];
  console.log(`Testing with cap: ${cap}%`);
}
```

---

**MCP Licensing = Higher Value**

MCP users are integrating FAF into their AI workflow. They're the perfect audience for licensing - technical, automated, and willing to pay for tools that save time.

Start with 85% cap for MCP, it's even more likely to convert than CLI users! 🎯