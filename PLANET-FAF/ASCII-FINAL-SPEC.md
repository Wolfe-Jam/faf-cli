# 🎨 FAF ASCII Platform - FINAL TECHNICAL SPECIFICATION
**Sign-Off Document - Version 1.0**

---

## 📐 CANVAS SPECIFICATIONS

### Canvas Dimensions
```typescript
interface CanvasSpec {
  // Standard Sizes
  standard: {
    terminal: { width: 80, height: 24 },    // Classic terminal
    extended: { width: 120, height: 40 },   // Modern terminal
    square: { width: 64, height: 64 },      // Square canvas
    banner: { width: 80, height: 8 },       // Banner/header
    card: { width: 60, height: 20 }         // Score card size
  },
  
  // Limits
  minimum: { width: 20, height: 4 },
  maximum: { width: 256, height: 256 },
  
  // Grid
  cellSize: {
    width: '1ch',   // CSS character width
    height: '1em',  // CSS line height
    aspect: 0.5     // Height/width ratio (chars are ~2x tall)
  }
}
```

### DPI / Dot Specifications
```typescript
interface DotSpec {
  // Character Cell
  cell: {
    pixelWidth: 10,     // Actual pixels per character
    pixelHeight: 20,    // Actual pixels per line
    displayWidth: 8,    // Logical width in points
    displayHeight: 16   // Logical height in points
  },
  
  // Export Resolutions
  export: {
    png: {
      low: 1,     // 1x (80x24 = 800x480px)
      medium: 2,  // 2x (80x24 = 1600x960px)
      high: 4,    // 4x (80x24 = 3200x1920px)
      print: 10   // 10x for print quality
    },
    svg: 'vector', // Infinite resolution
    pdf: 300       // 300 DPI for PDF
  },
  
  // Display Scaling
  zoom: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0]
}
```

---

## 🎨 COLOR SYSTEM

### Primary Palette (FAF Brand)
```typescript
const FAF_COLORS = {
  // Brand Colors
  orange: '#FF914D',    // FAF Orange (Primary)
  cyan: '#0CC0DF',      // FAF Cyan (Secondary)
  white: '#FFFFFF',     // FAF White
  black: '#1A1A1A',     // Near black (better than pure black)
  
  // Achievement Colors
  gold: '#FFD700',      // Championship
  silver: '#C0C0C0',    // Second place
  bronze: '#CD7F32',    // Third place
  
  // Semantic Colors
  success: '#00FF00',   // Green (checkmarks)
  warning: '#FFFF00',   // Yellow (caution)
  error: '#FF0000',     // Red (errors)
  info: '#00FFFF'       // Cyan (information)
} as const;
```

### Terminal Colors (16-color ANSI)
```typescript
const ANSI_COLORS = {
  // Normal (0-7)
  black: '#000000',
  red: '#CD0000',
  green: '#00CD00',
  yellow: '#CDCD00',
  blue: '#0000EE',
  magenta: '#CD00CD',
  cyan: '#00CDCD',
  white: '#E5E5E5',
  
  // Bright (8-15)
  brightBlack: '#7F7F7F',
  brightRed: '#FF0000',
  brightGreen: '#00FF00',
  brightYellow: '#FFFF00',
  brightBlue: '#5C5CFF',
  brightMagenta: '#FF00FF',
  brightCyan: '#00FFFF',
  brightWhite: '#FFFFFF'
} as const;
```

### Extended Colors (256-color mode)
```typescript
interface ExtendedColors {
  // Grayscale (232-255)
  grayscale: string[24];  // 24 shades from #080808 to #EEEEEE
  
  // 6x6x6 RGB Cube (16-231)
  rgbCube: string[216];   // All combinations of 0,95,135,175,215,255
  
  // Custom FAF Gradients
  gradients: {
    orangeFade: ['#FF914D', '#FF9F66', '#FFAD80', '#FFBA99', '#FFC8B3'],
    cyanFade: ['#0CC0DF', '#33CCEB', '#5AD7F7', '#80E3FF', '#A6EEFF'],
    grayscale: ['#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF']
  }
}
```

---

## 🔤 GRAPHICS & SYMBOLS

### Character Sets
```typescript
const CHARACTER_SETS = {
  // Basic ASCII (32-126)
  ascii: {
    range: [0x20, 0x7E],
    count: 95,
    safe: true  // Works everywhere
  },
  
  // Extended ASCII (128-255)
  extended: {
    range: [0x80, 0xFF],
    count: 128,
    safe: false  // May have encoding issues
  },
  
  // Box Drawing (U+2500-257F)
  boxDrawing: {
    horizontal: ['─', '━', '═', '╌', '┄', '┈'],
    vertical: ['│', '┃', '║', '╎', '┆', '┊'],  // FORBIDDEN in frames!
    corners: [
      '┌', '┐', '└', '┘',  // Light
      '╔', '╗', '╚', '╝',  // Double
      '╭', '╮', '╰', '╯'   // Rounded
    ],
    junctions: ['├', '┤', '┬', '┴', '┼', '╬', '╫', '╪']
  },
  
  // Block Elements (U+2580-259F)
  blocks: {
    full: '█',
    shades: ['░', '▒', '▓'],  // 25%, 50%, 75%
    partial: ['▀', '▄', '▌', '▐', '▖', '▗', '▘', '▝'],
    quarters: ['▙', '▛', '▜', '▟']
  },
  
  // Geometric Shapes (U+25A0-25FF)
  shapes: {
    squares: ['■', '□', '▪', '▫'],
    circles: ['●', '○', '◐', '◑', '◒', '◓'],
    triangles: ['▲', '△', '▼', '▽', '◀', '▷'],
    diamonds: ['◆', '◇', '◈', '◊']
  },
  
  // Emojis (Racing Theme)
  emojis: {
    flags: ['🏁', '🏳️', '🏴'],
    racing: ['🏎️', '🏆', '🥇', '🥈', '🥉'],
    achievement: ['⭐', '✨', '🌟', '💫'],
    indicators: ['✅', '❌', '⚠️', '💡', '🔥'],
    bookends: ['🍊', '🚀', '⚡', '🎯']
  },
  
  // Mathematical
  math: {
    arrows: ['→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐'],
    operators: ['±', '×', '÷', '≈', '≠', '≤', '≥'],
    misc: ['∞', '∑', '∏', '√', '∫', '∂']
  }
};
```

### Open-Ended Safe Characters
```typescript
const SAFE_FRAME_CHARS = {
  // ALLOWED for frames
  horizontal: ['─', '━', '═', '╌', '┄'],
  bookends: ['🏁', '🍊', '✨', '☑️', '[', ']', '{', '}'],
  corners: ['┌', '┐', '└', '┘'],  // Only if connected horizontally
  
  // FORBIDDEN in frames (causes misalignment)
  forbidden: ['|', '│', '┃', '║', '╎', '┆', '┊', '╏', '╽', '╿']
};
```

---

## 🖌️ SHADING & BRUSHES

### Shading Patterns
```typescript
interface ShadingSystem {
  // Density Levels
  levels: [
    { char: ' ', density: 0,    name: 'Empty' },
    { char: '·', density: 0.1,  name: 'Dots' },
    { char: '░', density: 0.25, name: 'Light' },
    { char: '▒', density: 0.50, name: 'Medium' },
    { char: '▓', density: 0.75, name: 'Dark' },
    { char: '█', density: 1.0,  name: 'Full' }
  ],
  
  // Pattern Types
  patterns: {
    solid: '████████',
    checkerboard: '█ █ █ █ ',
    horizontal: '═══════',
    vertical: '│││││││',  // Not for frames!
    diagonal: '╱╱╱╱╱╱╱',
    dots: '········',
    cross: '╬╬╬╬╬╬╬',
    wave: '∼∼∼∼∼∼∼',
    gradient: '░▒▓█▓▒░'
  },
  
  // Dithering Modes
  dithering: {
    none: 'solid',
    ordered: 'bayer',
    random: 'noise',
    floyd: 'floyd-steinberg'
  }
}
```

### Brush System
```typescript
interface BrushSpec {
  // Brush Types
  types: {
    pen: {
      size: 1,
      shape: 'point',
      char: string  // User selected
    },
    line: {
      size: 1,
      smart: boolean,  // Auto-connect corners
      style: '─' | '━' | '═' | '╌'
    },
    rectangle: {
      filled: boolean,
      borderStyle: string,
      fillChar: string
    },
    circle: {
      filled: boolean,
      approximate: boolean,  // ASCII approximation
      char: string
    },
    spray: {
      size: 3 | 5 | 7,
      density: 0.1 | 0.3 | 0.5,
      chars: string[]
    },
    eraser: {
      size: 1 | 3 | 5,
      char: ' '  // Always space
    },
    fill: {
      mode: 'flood' | 'replace',
      char: string,
      pattern: Pattern
    }
  },
  
  // Brush Presets
  presets: [
    { name: 'Solid', char: '█' },
    { name: 'Shade', char: '▒' },
    { name: 'Line', char: '─' },
    { name: 'Dot', char: '·' },
    { name: 'Star', char: '*' },
    { name: 'Cross', char: '+' },
    { name: 'Flag', char: '🏁' },
    { name: 'Orange', char: '🍊' }
  ]
}
```

---

## 💾 SAVE FORMATS

### Native Format (.faf-art)
```typescript
interface FafArtFormat {
  version: '1.0.0',
  metadata: {
    title: string,
    author: string,
    created: ISO8601,
    modified: ISO8601,
    software: 'FAF ASCII v2.4.0',
    tags: string[],
    score?: number,  // Min score to unlock
    achievement?: string
  },
  canvas: {
    width: number,
    height: number,
    background: string,  // Hex color or 'transparent'
    grid: Cell[][]  // 2D array
  },
  cell: {
    char: string,     // UTF-8 character
    fg: string,       // Foreground color (hex)
    bg: string,       // Background color (hex)
    style?: number    // Bold=1, Italic=2, Underline=4
  },
  layers?: Layer[],   // Optional layers
  history?: UndoEntry[],  // Optional undo history
  macros?: Macro[],   // Saved macros
  validation: {
    openEnded: boolean,
    checksum: string  // SHA256 of canvas
  }
}
```

### Export Formats
```typescript
const EXPORT_FORMATS = {
  // Text Formats
  '.txt': {
    encoding: 'UTF-8',
    lineEnding: 'LF',  // \n
    colors: false,
    metadata: false
  },
  
  '.ansi': {
    encoding: 'UTF-8',
    lineEnding: 'LF',
    colors: true,  // ANSI escape codes
    metadata: false
  },
  
  // Image Formats
  '.png': {
    scale: [1, 2, 4],
    background: 'transparent' | '#color',
    font: 'monospace',
    antialiasing: false  // Keep pixels crisp
  },
  
  '.svg': {
    scalable: true,
    textElements: true,
    cssStyles: true,
    embedFonts: false
  },
  
  // Code Formats
  '.js': {
    format: 'const art = `...`;',
    escaped: true,
    module: 'ES6'
  },
  
  '.json': {
    format: 'array' | 'string',
    pretty: true,
    base64: optional
  },
  
  // FAF Integration
  '.faf': {
    section: 'ascii_art',
    compatibility: '2.4.0+',
    autoScore: true
  },
  
  // Share Format
  '.share': {
    compression: 'gzip',
    encoding: 'base64',
    url: 'https://ascii.faf.one/s/{id}',
    qrCode: true
  }
};
```

---

## 🔄 SPA/CLI SEAMLESS INTEGRATION

### Shared Core Engine
```typescript
// Shared between SPA and CLI
class ASCIIEngine {
  // Core functionality used by both
  canvas: Canvas;
  rules: OpenEndedRules;
  renderer: Renderer;
  exporter: Exporter;
  
  // Platform-specific implementations
  input: WebInput | TerminalInput;
  display: WebCanvas | TerminalDisplay;
  storage: LocalStorage | FileSystem;
}
```

### Data Sync Protocol
```typescript
interface SyncProtocol {
  // File Format Compatibility
  format: 'faf-art-v1',
  
  // Import/Export
  cli: {
    export: 'faf ascii-export [file]',
    import: 'faf ascii-import [file]',
    edit: 'faf ascii-edit [file]'
  },
  
  spa: {
    import: 'Drag & drop or upload',
    export: 'Download or share link',
    edit: 'In-browser editor'
  },
  
  // Cloud Sync (Future)
  cloud: {
    provider: 'FAF Cloud',
    autoSync: boolean,
    conflictResolution: 'latest-wins'
  }
}
```

### Command Parity
```typescript
const COMMAND_PARITY = {
  // Every CLI command has SPA equivalent
  'faf ascii-new': 'File → New',
  'faf ascii-edit': 'File → Open',
  'faf ascii-save': 'Cmd+S',
  'faf ascii-export': 'File → Export',
  ':line': 'Tools → Line',
  ':rect': 'Tools → Rectangle',
  ':fill': 'Tools → Fill',
  'v': 'Selection Mode',
  'i': 'Insert Mode'
};
```

---

## 🛡️ ERROR-FREE EDITING SYSTEM

### Validation Rules
```typescript
class ValidationEngine {
  // Real-time validation
  validatePlacement(x: number, y: number, char: string): ValidationResult {
    const rules = [
      this.checkOpenEnded,
      this.checkAlignment,
      this.checkBounds,
      this.checkCharacterSet
    ];
    
    for (const rule of rules) {
      const result = rule(x, y, char);
      if (!result.valid) {
        return {
          valid: false,
          reason: result.reason,
          suggestion: result.suggestion,
          autoFix: result.autoFix
        };
      }
    }
    
    return { valid: true };
  }
  
  // Open-ended enforcement
  checkOpenEnded(x: number, y: number, char: string): ValidationResult {
    if (FORBIDDEN_VERTICALS.includes(char)) {
      // Check if it's part of a frame
      if (this.isFramePosition(x, y)) {
        return {
          valid: false,
          reason: 'Vertical lines in frames cause misalignment',
          suggestion: 'Use bookends instead: 🏁 text 🏁',
          autoFix: () => this.replaceWithBookend(x, y)
        };
      }
    }
    return { valid: true };
  }
  
  // Auto-correction
  autoCorrect: {
    corners: true,      // Auto-adjust corner pieces
    junctions: true,    // Auto-connect junctions
    alignment: true,    // Auto-align text
    spacing: true       // Auto-fix spacing issues
  }
}
```

### Error Prevention
```typescript
const ERROR_PREVENTION = {
  // Can't make these mistakes
  impossible: [
    'Misaligned frames',       // Open-ended design
    'Character overflow',       // Canvas bounds enforced
    'Encoding issues',         // UTF-8 validated
    'Lost work',              // Auto-save + undo tree
    'Broken patterns'          // Pattern validation
  ],
  
  // Warnings (can override)
  warnings: [
    'Non-monospace display',
    'Color contrast issues',
    'Export compatibility',
    'Large file size'
  ],
  
  // Auto-fixes
  autoFix: [
    'Corner connections',
    'Junction alignment',
    'Pattern completion',
    'Symmetry correction'
  ]
};
```

---

## 🎯 HEX DOT REPRESENTATION

### Internal Representation
```typescript
// Everything is just colored dots internally!
type Cell = {
  hex: string;      // Character as hex: '0x2588' for █
  fg: number;       // Foreground as 0xRRGGBB
  bg: number;       // Background as 0xRRGGBB
  flags: number;    // Style flags as bits
};

// Canvas is just a 2D array of colored hex dots
type Canvas = Cell[][];

// Example: Orange block on black
const cell: Cell = {
  hex: '0x2588',    // █ character
  fg: 0xFF914D,     // FAF Orange
  bg: 0x1A1A1A,     // Near black
  flags: 0b0000     // No styles
};
```

### Rendering Pipeline
```typescript
class RenderPipeline {
  // From hex dots to display
  render(canvas: Cell[][]): void {
    for (let y = 0; y < canvas.length; y++) {
      for (let x = 0; x < canvas[y].length; x++) {
        const cell = canvas[y][x];
        
        // Convert hex to character
        const char = String.fromCodePoint(cell.hex);
        
        // Apply colors
        const fg = `#${cell.fg.toString(16).padStart(6, '0')}`;
        const bg = `#${cell.bg.toString(16).padStart(6, '0')}`;
        
        // Render to target
        this.renderCell(x, y, char, fg, bg, cell.flags);
      }
    }
  }
}
```

---

## ✅ SIGN-OFF CHECKLIST

### Core Specifications
- [x] Canvas: 80x24 default, 256x256 max
- [x] Colors: FAF palette + ANSI 16 + Extended 256
- [x] Characters: UTF-8, emoji support
- [x] Shading: 6 levels (0%, 10%, 25%, 50%, 75%, 100%)
- [x] Brushes: 8 types with presets
- [x] Save format: .faf-art native + 10 export formats
- [x] SPA/CLI: Seamless with shared engine
- [x] Error-free: Validation + auto-correction
- [x] Hex dots: Internal Cell representation

### Unique Features
- [x] Open-ended design (no vertical frame lines)
- [x] Vi-mode editing
- [x] Racing theme gamification
- [x] Score-based unlocks
- [x] Can't make a mistake philosophy

### Performance Targets
- [x] <16ms canvas updates (60fps)
- [x] <100KB bundle size
- [x] <100ms first paint
- [x] >95 Lighthouse score

---

## 📝 FINAL NOTES

**This is it!** Everything is just colored hex dots on a grid, but we present it as:
- A powerful ASCII art editor
- A Vi-like text manipulation tool
- A gamified creative platform
- An error-free design system

The beauty is in the **simplicity**:
1. Store as hex + colors
2. Validate with rules
3. Render to any target
4. Export to any format

**No magic, just perfectly engineered colored dots!**

---

**APPROVED FOR DEVELOPMENT**

Signature: _____________________
Date: _____________________
Version: 1.0.0

*"From colored hex dots to ASCII art mastery"*
*FAF ASCII Platform 2024*