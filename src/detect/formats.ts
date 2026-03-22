/** Supported format types — data catalog */
export interface FormatEntry {
  name: string;
  extensions: string[];
  category: string;
}

/** Format catalog — curated list of recognized formats */
export const FORMATS: FormatEntry[] = [
  // Web
  { name: 'HTML', extensions: ['.html', '.htm'], category: 'web' },
  { name: 'CSS', extensions: ['.css'], category: 'web' },
  { name: 'JavaScript', extensions: ['.js', '.mjs', '.cjs'], category: 'web' },
  { name: 'TypeScript', extensions: ['.ts', '.tsx', '.mts', '.cts'], category: 'web' },
  { name: 'JSX', extensions: ['.jsx'], category: 'web' },
  { name: 'Vue', extensions: ['.vue'], category: 'web' },
  { name: 'Svelte', extensions: ['.svelte'], category: 'web' },
  { name: 'Astro', extensions: ['.astro'], category: 'web' },

  // Data
  { name: 'JSON', extensions: ['.json'], category: 'data' },
  { name: 'YAML', extensions: ['.yml', '.yaml'], category: 'data' },
  { name: 'TOML', extensions: ['.toml'], category: 'data' },
  { name: 'XML', extensions: ['.xml'], category: 'data' },
  { name: 'CSV', extensions: ['.csv'], category: 'data' },

  // Config
  { name: 'INI', extensions: ['.ini', '.cfg'], category: 'config' },
  { name: 'Env', extensions: ['.env'], category: 'config' },
  { name: 'Dockerfile', extensions: ['Dockerfile'], category: 'config' },

  // Systems
  { name: 'Rust', extensions: ['.rs'], category: 'systems' },
  { name: 'Go', extensions: ['.go'], category: 'systems' },
  { name: 'C', extensions: ['.c', '.h'], category: 'systems' },
  { name: 'C++', extensions: ['.cpp', '.cc', '.hpp'], category: 'systems' },
  { name: 'Zig', extensions: ['.zig'], category: 'systems' },

  // Scripting
  { name: 'Python', extensions: ['.py'], category: 'scripting' },
  { name: 'Ruby', extensions: ['.rb'], category: 'scripting' },
  { name: 'Shell', extensions: ['.sh', '.bash', '.zsh'], category: 'scripting' },
  { name: 'Lua', extensions: ['.lua'], category: 'scripting' },

  // JVM
  { name: 'Java', extensions: ['.java'], category: 'jvm' },
  { name: 'Kotlin', extensions: ['.kt', '.kts'], category: 'jvm' },
  { name: 'Scala', extensions: ['.scala'], category: 'jvm' },

  // .NET
  { name: 'C#', extensions: ['.cs'], category: 'dotnet' },
  { name: 'F#', extensions: ['.fs'], category: 'dotnet' },

  // Mobile
  { name: 'Swift', extensions: ['.swift'], category: 'mobile' },
  { name: 'Dart', extensions: ['.dart'], category: 'mobile' },

  // Docs
  { name: 'Markdown', extensions: ['.md', '.mdx'], category: 'docs' },
  { name: 'LaTeX', extensions: ['.tex'], category: 'docs' },
  { name: 'reStructuredText', extensions: ['.rst'], category: 'docs' },

  // FAF
  { name: 'FAF', extensions: ['.faf'], category: 'faf' },
  { name: 'FAFb', extensions: ['.fafb'], category: 'faf' },
];

/** Get format by extension */
export function getFormatByExtension(ext: string): FormatEntry | undefined {
  return FORMATS.find(f => f.extensions.includes(ext));
}

/** Get all formats in a category */
export function getFormatsByCategory(category: string): FormatEntry[] {
  return FORMATS.filter(f => f.category === category);
}
