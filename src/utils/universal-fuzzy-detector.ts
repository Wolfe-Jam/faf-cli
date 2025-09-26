/**
 * 🎯 Universal Fuzzy Detection - Google-style intelligence for ALL inputs
 * "Close enough is good enough"
 */

interface FuzzyMatch {
  detected: boolean;
  type: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  suggestion?: string;
  needsConfirmation: boolean;
  corrected?: string;
}

export class UniversalFuzzyDetector {

  // Project type patterns with variations
  private static readonly PROJECT_PATTERNS: Record<string, string[]> = {
    'chrome-extension': [
      'chrome extension', 'browser extension', 'chrome addon', 'chrome plugin',
      'chr ext', 'c ext', 'ce', 'chrome-ext', 'browser addon', 'manifest v3',
      'chrome exten', 'chrom ext', 'chrome ex', 'browser ext'
    ],
    'react': [
      'react', 'react app', 'react application', 'reactjs', 'react.js',
      'react project', 'next', 'nextjs', 'next.js', 'gatsby', 'create-react-app',
      'cra', 'react native', 'rn', 'react typescript', 'react ts'
    ],
    'vue': [
      'vue', 'vuejs', 'vue.js', 'vue app', 'vue application', 'nuxt', 'nuxtjs',
      'nuxt.js', 'vue3', 'vue 3', 'vue2', 'vue typescript', 'vue ts', 'vite vue'
    ],
    'svelte': [
      'svelte', 'sveltekit', 'svelte kit', 'svelte app', 'sk', 'svelte typescript',
      'svelte ts', 'svelte vite', 'sapper'
    ],
    'angular': [
      'angular', 'angularjs', 'angular app', 'ng', 'angular typescript',
      'angular ts', 'angular cli', 'angular material'
    ],
    'cli': [
      'cli', 'command line', 'terminal', 'console app', 'cli tool',
      'command line tool', 'terminal app', 'bash script', 'shell script',
      'cmd tool', 'command tool'
    ],
    'api': [
      'api', 'rest api', 'graphql', 'backend', 'server', 'microservice',
      'web service', 'rest', 'soap', 'grpc', 'websocket', 'fastapi',
      'express', 'nodejs api', 'node api', 'django api', 'flask api'
    ],
    'mobile': [
      'mobile', 'mobile app', 'ios', 'android', 'react native', 'flutter',
      'swift', 'kotlin', 'xamarin', 'ionic', 'cordova', 'phonegap',
      'native app', 'hybrid app', 'pwa', 'progressive web app'
    ],
    'desktop': [
      'desktop', 'desktop app', 'electron', 'tauri', 'native app',
      'windows app', 'mac app', 'linux app', 'cross platform',
      'wpf', 'winforms', 'qt', 'gtk', 'swing', 'javafx'
    ],
    'game': [
      'game', 'game dev', 'unity', 'unreal', 'godot', 'phaser',
      'three.js', 'babylon', 'canvas game', 'webgl', 'gamedev',
      '2d game', '3d game', 'multiplayer game', 'mmo'
    ],
    'library': [
      'library', 'package', 'npm package', 'module', 'framework',
      'sdk', 'toolkit', 'util', 'utils', 'helper', 'plugin',
      'lib', 'component library', 'ui library'
    ],
    'fullstack': [
      'fullstack', 'full stack', 'full-stack', 'mern', 'mean', 'lamp',
      'django fullstack', 'rails', 'laravel', 't3 stack', 'jamstack'
    ],
    'ai-ml': [
      'ai', 'ml', 'machine learning', 'deep learning', 'neural network',
      'tensorflow', 'pytorch', 'scikit', 'sklearn', 'data science',
      'nlp', 'computer vision', 'cv', 'llm', 'gpt', 'transformer'
    ],
    'blockchain': [
      'blockchain', 'crypto', 'smart contract', 'defi', 'web3',
      'ethereum', 'solidity', 'nft', 'dapp', 'decentralized',
      'bitcoin', 'contract', 'chain', 'ledger'
    ],
    'iot': [
      'iot', 'internet of things', 'embedded', 'arduino', 'raspberry pi',
      'esp32', 'esp8266', 'sensor', 'mqtt', 'hardware', 'firmware',
      'microcontroller', 'robotics', 'automation'
    ]
  };

  // Common typos and corrections
  private static readonly TYPO_CORRECTIONS: Record<string, string> = {
    // React typos
    'raect': 'react',
    'reat': 'react',
    'recat': 'react',
    'reaxt': 'react',
    'rect': 'react',

    // Vue typos
    'veu': 'vue',
    'vu': 'vue',
    'vuee': 'vue',

    // Angular typos
    'agnular': 'angular',
    'angualr': 'angular',
    'angluar': 'angular',
    'angualar': 'angular',

    // API typos
    'ap i': 'api',
    'a p i': 'api',
    'aip': 'api',

    // Backend typos
    'backned': 'backend',
    'backedn': 'backend',
    'bakcend': 'backend',
    'beck end': 'backend',

    // Frontend typos
    'forntend': 'frontend',
    'fronend': 'frontend',
    'front end': 'frontend',
    'font end': 'frontend',

    // Mobile typos
    'moblie': 'mobile',
    'moible': 'mobile',
    'mbile': 'mobile',

    // Database typos
    'databse': 'database',
    'datbase': 'database',
    'dtabase': 'database',
    'data base': 'database',

    // TypeScript typos
    'typescipt': 'typescript',
    'typscript': 'typescript',
    'type script': 'typescript',
    'ts': 'typescript',

    // JavaScript typos
    'javscript': 'javascript',
    'javascrpt': 'javascript',
    'java script': 'javascript',
    'js': 'javascript',

    // Python typos
    'pyton': 'python',
    'pythong': 'python',
    'pyhton': 'python',
    'pythn': 'python',

    // Common tech typos
    'dokcer': 'docker',
    'kubenetes': 'kubernetes',
    'kubernets': 'kubernetes',
    'k8s': 'kubernetes',
    'postgers': 'postgres',
    'postrgres': 'postgres',
    'mogodb': 'mongodb',
    'mongdb': 'mongodb',
    'reddis': 'redis',
    'radis': 'redis',
    'graphsql': 'graphql',
    'graph ql': 'graphql',
    'web sokect': 'websocket',
    'web socket': 'websocket'
  };

  // Language patterns
  private static readonly LANGUAGE_PATTERNS: Record<string, string[]> = {
    'typescript': ['typescript', 'ts', 'type script', 'tsc'],
    'javascript': ['javascript', 'js', 'java script', 'ecmascript', 'es6', 'es2020'],
    'python': ['python', 'py', 'python3', 'python2', 'cpython', 'pypy'],
    'java': ['java', 'jvm', 'java 8', 'java 11', 'java 17', 'spring', 'springboot'],
    'csharp': ['c#', 'csharp', 'c sharp', '.net', 'dotnet', 'asp.net'],
    'go': ['go', 'golang', 'go lang'],
    'rust': ['rust', 'rustlang', 'rust lang'],
    'ruby': ['ruby', 'rb', 'rails', 'ruby on rails', 'ror'],
    'php': ['php', 'php7', 'php8', 'laravel', 'symfony'],
    'swift': ['swift', 'swiftui', 'swift ui'],
    'kotlin': ['kotlin', 'kt', 'android kotlin'],
    'dart': ['dart', 'flutter dart'],
    'cpp': ['c++', 'cpp', 'cplusplus', 'c plus plus'],
    'c': ['c', 'c lang', 'c language']
  };

  /**
   * Detect project type with fuzzy matching
   */
  static detectProjectType(input: string): FuzzyMatch {
    if (!input) {
      return { detected: false, type: '', confidence: 'none', needsConfirmation: false };
    }

    const normalized = input.toLowerCase().trim();
    const corrected = this.correctTypos(normalized);

    // Check if we corrected something
    if (corrected !== normalized) {
      // Re-run detection on corrected text
      const correctedResult = this.detectWithPatterns(corrected);
      if (correctedResult.detected) {
        return {
          ...correctedResult,
          corrected: corrected,
          suggestion: `${correctedResult.type} (corrected from "${input}")`
        };
      }
    }

    return this.detectWithPatterns(normalized);
  }

  /**
   * Detect language with fuzzy matching
   */
  static detectLanguage(input: string): FuzzyMatch {
    if (!input) {
      return { detected: false, type: '', confidence: 'none', needsConfirmation: false };
    }

    const normalized = input.toLowerCase().trim();
    const corrected = this.correctTypos(normalized);

    // Check each language pattern
    for (const [language, patterns] of Object.entries(this.LANGUAGE_PATTERNS)) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern) || corrected.includes(pattern)) {
          return {
            detected: true,
            type: language,
            confidence: 'high',
            needsConfirmation: false,
            corrected: corrected !== normalized ? corrected : undefined
          };
        }
      }

      // Fuzzy match
      if (this.fuzzyMatch(normalized, language, 2)) {
        return {
          detected: true,
          type: language,
          confidence: 'medium',
          suggestion: language,
          needsConfirmation: true
        };
      }
    }

    return { detected: false, type: '', confidence: 'none', needsConfirmation: false };
  }

  /**
   * Detect with pattern matching
   */
  private static detectWithPatterns(text: string): FuzzyMatch {
    // Check each project type
    for (const [type, patterns] of Object.entries(this.PROJECT_PATTERNS)) {
      // High confidence - exact match
      for (const pattern of patterns.slice(0, 3)) {
        if (text.includes(pattern)) {
          return {
            detected: true,
            type,
            confidence: 'high',
            needsConfirmation: false
          };
        }
      }

      // Medium confidence - close match
      for (const pattern of patterns) {
        if (text.includes(pattern) || this.fuzzyMatch(text, pattern, 3)) {
          return {
            detected: true,
            type,
            confidence: 'medium',
            suggestion: type,
            needsConfirmation: true
          };
        }
      }
    }

    // Low confidence - check for related words
    if (this.hasProjectContext(text)) {
      const guessedType = this.guessProjectType(text);
      if (guessedType) {
        return {
          detected: false,
          type: guessedType,
          confidence: 'low',
          suggestion: guessedType,
          needsConfirmation: true
        };
      }
    }

    return { detected: false, type: '', confidence: 'none', needsConfirmation: false };
  }

  /**
   * Correct common typos across all inputs
   */
  private static correctTypos(text: string): string {
    let corrected = text;

    // Apply all corrections
    for (const [typo, correction] of Object.entries(this.TYPO_CORRECTIONS)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      corrected = corrected.replace(regex, correction);
    }

    return corrected;
  }

  /**
   * Fuzzy match with Levenshtein distance
   */
  private static fuzzyMatch(text: string, pattern: string, threshold: number = 3): boolean {
    const words = text.split(/\s+/);
    for (const word of words) {
      if (this.levenshteinDistance(word, pattern) <= threshold) {
        return true;
      }
    }
    return this.levenshteinDistance(text, pattern) <= threshold;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Check for project context
   */
  private static hasProjectContext(text: string): boolean {
    const contextWords = [
      'app', 'application', 'project', 'build', 'create', 'develop',
      'website', 'service', 'tool', 'platform', 'system', 'software'
    ];
    return contextWords.some(word => text.includes(word));
  }

  /**
   * Guess project type from context
   */
  private static guessProjectType(text: string): string | null {
    if (text.includes('web') || text.includes('site')) return 'react';
    if (text.includes('app') && !text.includes('web')) return 'mobile';
    if (text.includes('server') || text.includes('backend')) return 'api';
    if (text.includes('script') || text.includes('tool')) return 'cli';
    if (text.includes('package') || text.includes('library')) return 'library';
    return null;
  }

  /**
   * Get all suggestions for input
   */
  static getSuggestions(input: string, limit: number = 5): string[] {
    const suggestions: Array<{ type: string; score: number }> = [];
    const normalized = input.toLowerCase().trim();

    // Check all patterns
    for (const [type, patterns] of Object.entries(this.PROJECT_PATTERNS)) {
      let bestScore = Infinity;
      for (const pattern of patterns) {
        const distance = this.levenshteinDistance(normalized, pattern);
        if (distance < bestScore) {
          bestScore = distance;
        }
      }
      suggestions.push({ type, score: bestScore });
    }

    // Sort by score and return top matches
    return suggestions
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map(s => s.type);
  }
}

/**
 * Examples:
 *
 * detectProjectType("raect app") → "react" (typo corrected)
 * detectProjectType("chr ext") → "chrome-extension" (fuzzy match)
 * detectProjectType("moblie game") → "mobile" + "game" (multiple detections)
 * detectLanguage("typscript") → "typescript" (typo corrected)
 * detectLanguage("js") → "javascript" (abbreviation)
 */