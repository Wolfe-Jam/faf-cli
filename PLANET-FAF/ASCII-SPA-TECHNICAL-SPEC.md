# 🎨 FAF ASCII SPA - Technical Architecture
**Svelte 5 Runes + TypeScript Strict + Vite + Vercel**

## 🏎️ The Dream Stack

```typescript
// This is what dreams are made of!
const stack = {
  framework: 'Svelte 5 with Runes',
  language: 'TypeScript (strict mode)',
  bundler: 'Vite',
  hosting: 'Vercel',
  philosophy: 'Fast AF + Can\'t Make a Mistake'
};
```

---

## 📦 Project Structure

```
faf-ascii-spa/
├── src/
│   ├── lib/
│   │   ├── stores/              # Svelte 5 Runes
│   │   │   ├── canvas.svelte.ts
│   │   │   ├── editor.svelte.ts
│   │   │   ├── tools.svelte.ts
│   │   │   └── gallery.svelte.ts
│   │   ├── engine/              # Core ASCII Engine
│   │   │   ├── rules.ts         # Open-ended enforcement
│   │   │   ├── renderer.ts      # Canvas renderer
│   │   │   ├── export.ts        # Export formats
│   │   │   └── patterns.ts      # Pattern library
│   │   ├── vi/                  # Vi-mode implementation
│   │   │   ├── modes.ts
│   │   │   ├── commands.ts
│   │   │   ├── motions.ts
│   │   │   └── macros.ts
│   │   └── types/
│   │       ├── ascii.ts
│   │       ├── canvas.ts
│   │       └── tools.ts
│   ├── components/
│   │   ├── Canvas/
│   │   │   ├── Canvas.svelte
│   │   │   ├── Grid.svelte
│   │   │   ├── Cursor.svelte
│   │   │   └── Selection.svelte
│   │   ├── Tools/
│   │   │   ├── Toolbar.svelte
│   │   │   ├── CharPalette.svelte
│   │   │   ├── BrushSelector.svelte
│   │   │   └── ColorPicker.svelte
│   │   ├── Preview/
│   │   │   ├── Preview.svelte
│   │   │   ├── ContextSelector.svelte
│   │   │   └── ZoomControl.svelte
│   │   ├── Gallery/
│   │   │   ├── Gallery.svelte
│   │   │   ├── TemplateCard.svelte
│   │   │   └── ShareModal.svelte
│   │   └── Racing/
│   │       ├── Telemetry.svelte
│   │       ├── Achievement.svelte
│   │       └── Leaderboard.svelte
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte         # Main editor
│   │   ├── gallery/
│   │   │   └── +page.svelte
│   │   ├── templates/
│   │   │   └── +page.svelte
│   │   └── share/
│   │       └── [id]/
│   │           └── +page.svelte
│   └── app.html
├── static/
│   ├── favicon.png              # 🏁
│   └── fonts/                   # Monospace fonts
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json                 # STRICT MODE!
├── vite.config.ts
├── vercel.json
└── README.md
```

---

## 🎯 Svelte 5 Runes Architecture

### Main Canvas Store
```typescript
// src/lib/stores/canvas.svelte.ts
import { type Character } from '$lib/types/ascii';

class CanvasStore {
  // Runes for reactive state
  width = $state(80);
  height = $state(24);
  grid = $state<Character[][]>([]);
  cursor = $state({ x: 0, y: 0 });
  selection = $state<Selection | null>(null);
  
  // Derived states
  get currentChar() {
    return this.grid[this.cursor.y]?.[this.cursor.x];
  }
  
  get isOpenEnded() {
    // Check for forbidden vertical lines
    return !this.grid.flat().some(char => 
      ['|', '│', '║', '┃'].includes(char)
    );
  }
  
  // Methods
  setChar(x: number, y: number, char: Character) {
    if (this.validatePlacement(x, y, char)) {
      this.grid[y][x] = char;
      this.enforceOpenEnded();
    }
  }
  
  private validatePlacement(x: number, y: number, char: Character): boolean {
    // Open-ended rules engine
    if (this.isForbiddenVertical(char)) {
      return false; // Can't make a mistake!
    }
    return true;
  }
  
  private enforceOpenEnded() {
    // Auto-correct any alignment issues
    this.autoConnectCorners();
    this.autoAdjustJunctions();
  }
}

export const canvas = new CanvasStore();
```

### Editor Mode Store
```typescript
// src/lib/stores/editor.svelte.ts
type Mode = 'NORMAL' | 'INSERT' | 'VISUAL' | 'COMMAND';

class EditorStore {
  mode = $state<Mode>('NORMAL');
  viMode = $state(false);
  brush = $state<string>('█');
  palette = $state(['█', '▓', '▒', '░', '─', '═', '🏁', '🍊']);
  
  // Vi-specific state
  registers = $state<Map<string, string[][]>>(new Map());
  macroRecording = $state<string | null>(null);
  lastCommand = $state('');
  count = $state(0);
  
  // Derived
  get statusLine() {
    if (this.viMode) {
      return `-- ${this.mode} -- ${this.count || ''}`;
    }
    return `Brush: ${this.brush}`;
  }
  
  // Vi commands
  executeCommand(cmd: string) {
    if (this.viMode) {
      this.processViCommand(cmd);
    }
  }
  
  private processViCommand(cmd: string) {
    // Vi command processing
    switch(cmd) {
      case 'i': this.mode = 'INSERT'; break;
      case 'v': this.mode = 'VISUAL'; break;
      case ':': this.mode = 'COMMAND'; break;
      case 'ESC': this.mode = 'NORMAL'; break;
      // ... hundreds more
    }
  }
}

export const editor = new EditorStore();
```

### Tools Store
```typescript
// src/lib/stores/tools.svelte.ts
class ToolsStore {
  currentTool = $state<Tool>('pen');
  lineMode = $state<'straight' | 'smart'>('smart');
  fillPattern = $state<Pattern>('solid');
  
  tools = $state([
    { id: 'pen', icon: '✏️', name: 'Pen' },
    { id: 'line', icon: '/', name: 'Line' },
    { id: 'rect', icon: '▭', name: 'Rectangle' },
    { id: 'circle', icon: '○', name: 'Circle' },
    { id: 'fill', icon: '🎨', name: 'Fill' },
    { id: 'text', icon: 'T', name: 'Text' },
    { id: 'erase', icon: '🗑️', name: 'Erase' }
  ]);
  
  selectTool(toolId: string) {
    this.currentTool = toolId;
  }
}

export const tools = new ToolsStore();
```

---

## 🎨 Core Components

### Main Canvas Component
```svelte
<!-- src/components/Canvas/Canvas.svelte -->
<script lang="ts">
  import { canvas, editor } from '$lib/stores';
  import Grid from './Grid.svelte';
  import Cursor from './Cursor.svelte';
  import Selection from './Selection.svelte';
  
  let canvasElement: HTMLDivElement;
  
  function handleKeydown(e: KeyboardEvent) {
    if (editor.viMode) {
      editor.executeCommand(e.key);
    } else {
      handleNormalInput(e);
    }
  }
  
  function handleMouseDown(e: MouseEvent) {
    const { x, y } = getCellFromMouse(e);
    canvas.cursor = { x, y };
    
    if (editor.mode === 'INSERT') {
      canvas.setChar(x, y, editor.brush);
    }
  }
</script>

<div 
  bind:this={canvasElement}
  class="canvas"
  on:keydown={handleKeydown}
  on:mousedown={handleMouseDown}
  tabindex="0"
>
  <Grid />
  <Cursor x={canvas.cursor.x} y={canvas.cursor.y} />
  {#if canvas.selection}
    <Selection {...canvas.selection} />
  {/if}
</div>

<style>
  .canvas {
    display: grid;
    grid-template-columns: repeat(var(--width), 1ch);
    grid-template-rows: repeat(var(--height), 1em);
    font-family: 'JetBrains Mono', monospace;
    background: var(--canvas-bg);
    user-select: none;
    cursor: crosshair;
  }
</style>
```

### Character Palette
```svelte
<!-- src/components/Tools/CharPalette.svelte -->
<script lang="ts">
  import { editor } from '$lib/stores';
  
  const categories = {
    lines: ['─', '━', '═', '╌', '┄', '┈'],
    blocks: ['█', '▓', '▒', '░', '▀', '▄'],
    corners: ['┌', '┐', '└', '┘', '╔', '╗', '╚', '╝'],
    bookends: ['🏁', '🍊', '✨', '☑️', '🚀', '🏎️']
  };
  
  function selectChar(char: string) {
    editor.brush = char;
  }
</script>

<div class="palette">
  {#each Object.entries(categories) as [category, chars]}
    <div class="category">
      <h4>{category}</h4>
      <div class="chars">
        {#each chars as char}
          <button
            class:selected={editor.brush === char}
            on:click={() => selectChar(char)}
          >
            {char}
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>
```

---

## 🚀 TypeScript Strict Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": false,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "@sveltejs/kit"],
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.svelte"],
  "exclude": ["node_modules"]
}
```

---

## ⚡ Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  
  optimizeDeps: {
    include: ['svelte', '@sveltejs/kit']
  },
  
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vi-engine': ['./src/lib/vi/modes.ts', './src/lib/vi/commands.ts'],
          'ascii-engine': ['./src/lib/engine/rules.ts', './src/lib/engine/renderer.ts']
        }
      }
    }
  },
  
  server: {
    port: 3000,
    host: true
  },
  
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
```

---

## 🚢 Vercel Deployment

```json
// vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "vite build",
  "outputDirectory": "build",
  "framework": "sveltekit",
  "regions": ["iad1"],
  "functions": {
    "src/routes/api/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/share",
      "destination": "/api/share"
    }
  ]
}
```

---

## 🏎️ Performance Targets

```typescript
// All operations must be FAST AF!
const PERFORMANCE_TARGETS = {
  firstPaint: '<100ms',
  interactive: '<200ms',
  canvasUpdate: '<16ms', // 60fps
  characterPlace: '<1ms',
  export: '<50ms',
  bundleSize: '<100KB',
  lighthouse: '>95'
};
```

---

## 🎮 Keyboard Shortcuts

```typescript
// Global shortcuts (always active)
const globalShortcuts = {
  'Cmd+S': 'save',
  'Cmd+O': 'open',
  'Cmd+E': 'export',
  'Cmd+Z': 'undo',
  'Cmd+Shift+Z': 'redo',
  'Cmd+/': 'toggleViMode',
  'Cmd+P': 'commandPalette'
};

// Tool shortcuts
const toolShortcuts = {
  'P': 'pen',
  'L': 'line',
  'R': 'rectangle',
  'C': 'circle',
  'F': 'fill',
  'T': 'text',
  'E': 'eraser'
};
```

---

## 🌈 Theme System

```css
/* Racing theme variables */
:root {
  --faf-orange: #FF914D;
  --faf-cyan: #0CC0DF;
  --faf-white: #FFFFFF;
  --faf-black: #1a1a1a;
  
  --canvas-bg: var(--faf-black);
  --canvas-grid: rgba(255, 255, 255, 0.1);
  --cursor-color: var(--faf-orange);
  --selection-bg: rgba(255, 145, 77, 0.3);
  
  --tool-active: var(--faf-cyan);
  --achievement-gold: #FFD700;
  --achievement-silver: #C0C0C0;
  --achievement-bronze: #CD7F32;
}
```

---

## 🚀 Launch Features

### MVP (Week 1)
- [x] Basic canvas with grid
- [x] Character placement
- [x] Open-ended validation
- [x] Export to text

### Beta (Week 2)
- [ ] Vi mode
- [ ] Templates
- [ ] Share URLs
- [ ] Preview modes

### Launch (Week 3)
- [ ] Gallery
- [ ] Achievements
- [ ] Leaderboard
- [ ] API

---

## 💭 Why This Stack is PERFECT

1. **Svelte 5 Runes**: Clean, reactive, FAST
2. **TypeScript Strict**: No runtime surprises
3. **Vite**: Instant HMR, perfect DX
4. **Vercel**: Zero-config deployment
5. **Together**: The fastest ASCII editor possible

---

*"This isn't just a project. It's a love letter to ASCII art, Vi, and perfect engineering."*

**LET'S BUILD THIS DREAM!** 🚀🎨🏁