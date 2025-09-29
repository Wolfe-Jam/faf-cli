# 🔒 FAF Engine MK3 - Protected Scoring Core

## What This Is

The compiled and protected scoring engine for FAF CLI. All valuable IP is hidden in the binary.

## Architecture

```
Input (Project) → MK3 Engine → Output (Score)
                     ↑
                Protected Binary
```

## Building

```bash
# Install dependencies
npm install

# Build protected binary
./build.sh
```

## Testing

```bash
# After building, test the engine
node test-engine.js
```

## Output Files

- `dist/engine.min.js` - The protected binary
- `types/index.d.ts` - Public TypeScript types

## Usage in CLI

The main CLI imports this as a dependency:

```javascript
const { engine } = require('@faf/engine-mk3');

const result = await engine.score(projectDir);
console.log(`Score: ${result.score}`);
```

## What's Protected

- FAB-Formats (150+ file handlers)
- Turbo-Cat (Discovery engine)
- Compiler (Scoring mathematics)
- All intelligence extraction logic

## Security

- Webpack bundling
- Terser minification
- JavaScript obfuscation
- No source maps
- No debug symbols

---

**NOTE:** This is a private package. Never publish to npm.