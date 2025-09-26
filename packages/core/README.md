# @faf/core

<div align="center">
<img src="https://faf.one/orange-smiley.svg" alt="Orange Smiley Logo" width="120" />

### Zero-dependency FAF scoring engine
**Perfect for MCP servers, edge functions, and lightweight environments**

</div>

## Installation

```bash
npm install @faf/core
```

## Usage

```typescript
import { calculateScore, validateFafData } from '@faf/core';

const fafData = {
  project: { name: 'My Project' },
  instant_context: {
    what_building: 'Web app',
    main_language: 'TypeScript'
  }
};

if (validateFafData(fafData)) {
  const result = calculateScore(fafData);
  console.log(`FAF Score: ${result.totalScore}%`);
}
```

## Features

- 🏎️ **Zero dependencies** - Pure TypeScript
- ⚡ **<1ms scoring** - F1-inspired performance
- 📦 **6KB minified** - Tiny footprint
- 🎯 **TypeScript first** - Full type safety
- ✅ **100% tested** - Zero errors philosophy

## API

### `calculateScore(fafData: FafData): ScoreResult`
Calculates the FAF score from data.

### `validateFafData(data: any): boolean`
Type guard to validate FAF data structure.

### `getMissingRequiredSlots(fafData: FafData): string[]`
Returns array of missing required fields.

## License

MIT © 🏎️⚡️_wolfejam.dev