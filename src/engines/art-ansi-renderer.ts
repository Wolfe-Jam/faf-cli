/**
 * 🎨 .art ANSI Renderer Engine
 * Renders ASCII art with ANSI colors for UI mockups
 * Foundation for .art → UI compilation
 */

/**
 * ANSI Color Palette for .art files
 * Extended 256-color support for rich UI mockups
 */
export const ART_ANSI = {
  // Reset
  reset: '\x1b[0m',
  clear: '\x1b[2J\x1b[H', // Clear screen and home cursor

  // Text Styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m',

  // Standard Colors (30-37)
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright Colors (90-97)
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background Colors (40-47)
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Bright Background Colors (100-107)
  bgGray: '\x1b[100m',
  bgBrightRed: '\x1b[101m',
  bgBrightGreen: '\x1b[102m',
  bgBrightYellow: '\x1b[103m',
  bgBrightBlue: '\x1b[104m',
  bgBrightMagenta: '\x1b[105m',
  bgBrightCyan: '\x1b[106m',
  bgBrightWhite: '\x1b[107m',

  // Cursor Movement
  up: (n: number = 1) => `\x1b[${n}A`,
  down: (n: number = 1) => `\x1b[${n}B`,
  forward: (n: number = 1) => `\x1b[${n}C`,
  back: (n: number = 1) => `\x1b[${n}D`,
  nextLine: (n: number = 1) => `\x1b[${n}E`,
  prevLine: (n: number = 1) => `\x1b[${n}F`,
  column: (n: number) => `\x1b[${n}G`,
  position: (row: number, col: number) => `\x1b[${row};${col}H`,

  // 256 Color Mode
  color256: (n: number) => `\x1b[38;5;${n}m`,
  bg256: (n: number) => `\x1b[48;5;${n}m`,

  // RGB True Color (24-bit)
  rgb: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  bgRgb: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
};

/**
 * UI Component Color Schemes
 */
export const UI_THEMES = {
  // FAF Brand Colors
  faf: {
    primary: ART_ANSI.cyan,
    secondary: ART_ANSI.color256(208), // Orange
    success: ART_ANSI.green,
    warning: ART_ANSI.yellow,
    error: ART_ANSI.red,
    info: ART_ANSI.blue,
    border: ART_ANSI.cyan,
    text: ART_ANSI.white,
    muted: ART_ANSI.gray,
  },

  // Dark Mode Theme
  dark: {
    primary: ART_ANSI.brightCyan,
    secondary: ART_ANSI.brightMagenta,
    background: ART_ANSI.bgBlack,
    foreground: ART_ANSI.brightWhite,
    border: ART_ANSI.gray,
  },

  // Light Mode Theme
  light: {
    primary: ART_ANSI.blue,
    secondary: ART_ANSI.magenta,
    background: ART_ANSI.bgWhite,
    foreground: ART_ANSI.black,
    border: ART_ANSI.gray,
  },
};

/**
 * Box Drawing Characters for .art files
 */
export const BOX_CHARS = {
  // Single Line
  single: {
    horizontal: '─',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    cross: '┼',
    teeDown: '┬',
    teeUp: '┴',
    teeRight: '├',
    teeLeft: '┤',
  },

  // Double Line
  double: {
    horizontal: '═',
    vertical: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    cross: '╬',
    teeDown: '╦',
    teeUp: '╩',
    teeRight: '╠',
    teeLeft: '╣',
  },

  // Rounded
  rounded: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
  },

  // Block Elements
  blocks: {
    full: '█',
    upper: '▀',
    lower: '▄',
    left: '▌',
    right: '▐',
    light: '░',
    medium: '▒',
    dark: '▓',
  },
};

/**
 * Render .art syntax to ANSI output
 */
export class ArtRenderer {
  private theme = UI_THEMES.faf;

  /**
   * Parse .art color tags and convert to ANSI
   * @example [red]Text[/red] → \x1b[31mText\x1b[0m
   */
  parseColorTags(text: string): string {
    return text
      .replace(/\[red\]/g, ART_ANSI.red)
      .replace(/\[green\]/g, ART_ANSI.green)
      .replace(/\[blue\]/g, ART_ANSI.blue)
      .replace(/\[cyan\]/g, ART_ANSI.cyan)
      .replace(/\[yellow\]/g, ART_ANSI.yellow)
      .replace(/\[orange\]/g, ART_ANSI.color256(208))
      .replace(/\[bold\]/g, ART_ANSI.bold)
      .replace(/\[dim\]/g, ART_ANSI.dim)
      .replace(/\[\/\w+\]/g, ART_ANSI.reset);
  }

  /**
   * Draw a box with ANSI colors
   */
  drawBox(width: number, height: number, style: 'single' | 'double' = 'single'): string {
    const box = BOX_CHARS[style];
    const lines: string[] = [];

    // Top border
    lines.push(
      this.theme.border +
      box.topLeft +
      box.horizontal.repeat(width - 2) +
      box.topRight +
      ART_ANSI.reset
    );

    // Middle lines
    for (let i = 0; i < height - 2; i++) {
      lines.push(
        this.theme.border +
        box.vertical +
        ' '.repeat(width - 2) +
        box.vertical +
        ART_ANSI.reset
      );
    }

    // Bottom border
    lines.push(
      this.theme.border +
      box.bottomLeft +
      box.horizontal.repeat(width - 2) +
      box.bottomRight +
      ART_ANSI.reset
    );

    return lines.join('\n');
  }

  /**
   * Create a progress bar with ANSI colors
   */
  progressBar(percent: number, width: number = 20): string {
    const filled = Math.floor((percent / 100) * width);
    const empty = width - filled;

    return (
      ART_ANSI.green +
      BOX_CHARS.blocks.full.repeat(filled) +
      ART_ANSI.gray +
      BOX_CHARS.blocks.light.repeat(empty) +
      ART_ANSI.reset
    );
  }

  /**
   * Render a button component
   */
  button(text: string, selected: boolean = false): string {
    const padding = 2;
    const _width = text.length + (padding * 2);

    if (selected) {
      return (
        `${ART_ANSI.bgBlue + ART_ANSI.brightWhite + ART_ANSI.bold 
        }[${  ' '.repeat(padding)  }${text  }${' '.repeat(padding)  }]${ 
        ART_ANSI.reset}`
      );
    } else {
      return (
        `${this.theme.primary 
        }[${  ' '.repeat(padding)  }${text  }${' '.repeat(padding)  }]${ 
        ART_ANSI.reset}`
      );
    }
  }

  /**
   * Create a gradient effect (256 color mode)
   */
  gradient(text: string, startColor: number, endColor: number): string {
    const chars = text.split('');
    const steps = chars.length;
    const colorStep = (endColor - startColor) / steps;

    return chars.map((char, i) => {
      const color = Math.round(startColor + (colorStep * i));
      return ART_ANSI.color256(color) + char;
    }).join('') + ART_ANSI.reset;
  }
}

/**
 * Example .art file structure (for future implementation)
 *
 * @art-file dashboard.art
 * ```
 * @theme: faf
 * @size: 80x24
 *
 * [cyan]┌──────────────────────────────────┐[/cyan]
 * [cyan]│[/cyan] [bold]Dashboard[/bold]              [button]Settings[/button] [cyan]│[/cyan]
 * [cyan]├──────────────────────────────────┤[/cyan]
 * [cyan]│[/cyan] CPU: [progress:75]              [cyan]│[/cyan]
 * [cyan]│[/cyan] RAM: [progress:45]              [cyan]│[/cyan]
 * [cyan]│[/cyan] Disk: [progress:90]             [cyan]│[/cyan]
 * [cyan]└──────────────────────────────────┘[/cyan]
 * ```
 *
 * This would compile to a full React/Vue/Svelte component!
 */

/**
 * Export for use in .art compiler
 */
export default {
  ART_ANSI,
  UI_THEMES,
  BOX_CHARS,
  ArtRenderer,
};

/**
 * FUTURE: .art → Component Compiler
 *
 * 1. Parse .art file
 * 2. Extract layout from ASCII art
 * 3. Apply ANSI colors for preview
 * 4. Generate component code (React/Vue/Svelte)
 * 5. Apply CSS from ANSI color mappings
 *
 * The ANSI codes become the bridge between
 * ASCII mockups and real UI components!
 */