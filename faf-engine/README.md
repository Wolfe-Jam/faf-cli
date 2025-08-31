# 🚀 .faf-engine Mk-1

**Universal Context-On-Demand Intelligence Engine**  
*Platform-agnostic .faf technology for CLI, Web, Vercel, and custom architectures*

[![Version](https://img.shields.io/npm/v/@faf/engine)](https://www.npmjs.com/package/@faf/engine)
[![License](https://img.shields.io/npm/l/@faf/engine)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)

## 🎯 What is .faf-engine?

The .faf-engine is a **standalone TypeScript intelligence engine** that powers Context-On-Demand technology across any platform. It's the core engine extracted from the .faf CLI, now available as an independent, licensable package.

### Key Features

- **🧠 fab-formats Mother Ship**: 200+ file format intelligence with evidence-based detection
- **📊 Context-On-Demand**: Automatic project context generation with 75%+ accuracy
- **🎯 Universal Deployment**: Works on CLI, Vercel Edge, Web, or custom architectures
- **⚡ Zero Dependencies**: Lightweight core with optional AI enhancements
- **🔧 TypeScript Native**: Full type safety and modern development experience

## 🚀 Quick Start

### Installation

```bash
npm install @faf/engine
# or
yarn add @faf/engine
# or
pnpm add @faf/engine
```

### Basic Usage

```typescript
import { createFafEngine } from '@faf/engine';

// Create engine instance
const engine = await createFafEngine({
  platform: 'cli', // or 'vercel', 'web', 'custom'
  projectDir: './my-project'
});

// Generate Context-On-Demand
const result = await engine.generateContext();

console.log(`Score: ${result.score.totalScore}%`);
console.log(`Framework: ${result.context.stack.frontend}`);
console.log(`Confidence: ${result.confidence}%`);
```

## 🎯 Platform Integrations

### Vercel Deployment

Deploy as an edge function for global, low-latency Context-On-Demand:

```typescript
// api/faf-engine.ts
export { default } from '@faf/engine/vercel';
```

**Environment Variables:**
```env
FAF_ENGINE_LICENSE=your-license-key
OPENAI_API_KEY=optional-for-ai-enhancement
```

### CLI Integration

Use in command-line tools:

```typescript
import { FafEngine } from '@faf/engine';

const engine = new FafEngine({ platform: 'cli' });
const context = await engine.generateContext(process.cwd());
```

### Web Application

Integrate into web apps:

```typescript
import { FafEngine, WebAdapter } from '@faf/engine';

const engine = new FafEngine({
  platform: 'web',
  adapter: new WebAdapter({ 
    files: uploadedFiles 
  })
});
```

### Custom Architecture

Build your own adapter:

```typescript
import { FafEngine, PlatformAdapter } from '@faf/engine';

class CustomAdapter implements PlatformAdapter {
  // Implement your platform-specific logic
}

const engine = new FafEngine({
  adapter: new CustomAdapter()
});
```

## 📊 API Reference

### Core Methods

```typescript
// Generate Context-On-Demand
const result = await engine.generateContext(projectDir?);

// Load existing .faf file
const data = await engine.loadFaf(filePath);

// Save .faf file
await engine.saveFaf(data, filePath);

// Validate .faf data
const validation = engine.validate(data);

// Calculate score
const score = engine.score(data);
```

### Result Types

```typescript
interface ContextOnDemandResult {
  context: FafData;           // Complete .faf context
  score: FafScore;            // Scoring breakdown
  discovery: FormatDiscovery[]; // Discovered formats
  recommendations: string[];   // Improvement suggestions
  confidence: number;          // 0-100 confidence level
}

interface FafScore {
  totalScore: number;         // 0-100 percentage
  filledSlots: number;        // Filled context slots
  totalSlots: number;         // Total available slots
  confidence: 'LOW' | 'MODERATE' | 'GOOD' | 'HIGH' | 'VERY_HIGH';
}
```

## 🚀 Vercel Edge Deployment

### Setup

1. **Install package:**
```bash
npm install @faf/engine
```

2. **Create API route:**
```typescript
// api/faf.ts
export { default } from '@faf/engine/vercel';
export { config } from '@faf/engine/vercel';
```

3. **Deploy to Vercel:**
```bash
vercel deploy
```

### API Endpoints

```http
# Get engine info
GET https://your-app.vercel.app/api/faf?action=version

# Generate Context-On-Demand
POST https://your-app.vercel.app/api/faf?action=generate
Content-Type: application/json
{
  "projectData": { ... }
}

# Validate .faf data
POST https://your-app.vercel.app/api/faf?action=validate
Content-Type: application/json
{
  "fafData": { ... }
}

# Calculate score
POST https://your-app.vercel.app/api/faf?action=score
Content-Type: application/json
{
  "fafData": { ... }
}
```

## 🏗️ Architecture

```
.faf-engine/
├── core/
│   └── FafEngine.ts         # Main engine orchestrator
├── formats/
│   └── FabFormatsEngine.ts  # 200+ format intelligence
├── context/
│   └── ContextOnDemand.ts   # Context assembly
├── scoring/
│   └── ScoreCalculator.ts   # Scoring algorithm
├── adapters/
│   ├── CLIAdapter.ts        # CLI filesystem access
│   ├── VercelAdapter.ts     # Vercel Edge runtime
│   └── WebAdapter.ts        # Browser environment
└── knowledge/
    └── KnowledgeBase.ts     # Mother Ship data
```

## 💡 Use Cases

### 1. **AI-Powered Development Tools**
Integrate Context-On-Demand into IDEs, code generators, and AI assistants.

### 2. **Project Analysis Services**
Build SaaS platforms that analyze and score project quality.

### 3. **CI/CD Intelligence**
Add context awareness to deployment pipelines.

### 4. **Documentation Generation**
Automatically generate project documentation from context.

### 5. **Code Review Automation**
Enhance PR reviews with project context understanding.

## 📈 Performance

- **Format Detection**: 200+ formats in <100ms
- **Context Generation**: Full analysis in <500ms
- **Memory Usage**: <50MB for large projects
- **Bundle Size**: ~150KB minified + gzipped

## 🔐 Licensing

The .faf-engine is available under **MIT License** for open-source projects.

**Commercial Licensing** available for:
- SaaS platforms
- Enterprise deployments
- Custom integrations
- White-label solutions

Contact: license@faf-engine.dev

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🚀 Roadmap

- [ ] v1.1: WebAssembly support
- [ ] v1.2: Python bindings
- [ ] v1.3: Rust core for 10x performance
- [ ] v2.0: AI-native architecture

## 📚 Documentation

- [Full API Documentation](https://docs.faf-engine.dev)
- [Integration Guides](https://docs.faf-engine.dev/guides)
- [Platform Examples](https://github.com/faf-engine/examples)

## 🏎️ About

Built with precision engineering by **🏎️⚡️_wolfejam.dev**

The .faf-engine represents a breakthrough in Context-On-Demand technology, making project intelligence universally accessible across any platform or architecture.

---

**Ready to eliminate context gaps?** Install .faf-engine and experience 75%+ Context-On-Demand accuracy today!