/**
 * WJTTC Test Suite: faf-git-generator
 *
 * Tests language detection, stack analysis, README extraction,
 * and clean output format. Every language, every edge case.
 *
 * Tiers:
 *   Brake (critical)  — Language detection must be correct
 *   Engine (core)     — Stack analysis, 6W extraction
 *   Aero (polish)     — Output format, edge cases
 */

import {
  extractFromLanguages,
  analyzePackageJson,
  extract6WsFromReadme,
  getScoreTier,
} from '../../src/github/faf-git-generator';

import type { GitHubMetadata } from '../../src/github/github-extractor';

// === Helpers ===

/** Build a minimal GitHubMetadata with language percentages */
function metaWithLangs(...langs: string[]): GitHubMetadata {
  return {
    owner: 'test',
    repo: 'test',
    url: 'https://github.com/test/test',
    languages: langs,
  };
}

/** Build GitHubMetadata with topics */
function metaWithTopics(topics: string[], langs?: string[]): GitHubMetadata {
  return {
    owner: 'test',
    repo: 'test',
    url: 'https://github.com/test/test',
    topics,
    languages: langs || [],
  };
}

// ============================================================
// TIER: BRAKE — Language Detection (extractFromLanguages)
// These MUST be correct. Wrong language = rejected PR.
// ============================================================

describe('BRAKE: Primary Language Detection', () => {
  test('React → JavaScript (66.8% JS > 30.3% TS)', () => {
    const result = extractFromLanguages(metaWithLangs(
      'JavaScript (66.8%)', 'TypeScript (30.3%)', 'HTML (1.4%)'
    ));
    expect(result.language).toBe('JavaScript');
    expect(result.runtime).toBe('Node.js');
  });

  test('Bitcoin → C++ (65.6%)', () => {
    const result = extractFromLanguages(metaWithLangs(
      'C++ (65.6%)', 'Python (19.2%)', 'C (11.4%)', 'CMake (1.3%)'
    ));
    expect(result.language).toBe('C++');
    expect(result.runtime).toBe('C++');
  });

  test('PyTorch → Python (61.3%)', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Python (61.3%)', 'C++ (30.9%)', 'Cuda (2.8%)'
    ));
    expect(result.language).toBe('Python');
    expect(result.runtime).toBe('Python');
  });

  test('Linux → C (98.0%)', () => {
    const result = extractFromLanguages(metaWithLangs(
      'C (98.0%)', 'Assembly (0.7%)', 'Shell (0.4%)', 'Rust (0.3%)'
    ));
    expect(result.language).toBe('C');
    expect(result.runtime).toBe('C');
  });

  test('Rust project → Rust', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Rust (92.1%)', 'Shell (5.2%)', 'Dockerfile (2.7%)'
    ));
    expect(result.language).toBe('Rust');
    expect(result.runtime).toBe('Rust');
  });

  test('Go project → Go', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Go (87.5%)', 'Makefile (6.3%)', 'Shell (4.1%)', 'Dockerfile (2.1%)'
    ));
    expect(result.language).toBe('Go');
    expect(result.runtime).toBe('Go');
  });

  test('TypeScript primary → TypeScript', () => {
    const result = extractFromLanguages(metaWithLangs(
      'TypeScript (85.3%)', 'JavaScript (10.2%)', 'CSS (4.5%)'
    ));
    expect(result.language).toBe('TypeScript');
    expect(result.runtime).toBe('Node.js');
  });

  test('Java project → Java + JVM', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Java (78.4%)', 'Kotlin (15.2%)', 'Groovy (6.4%)'
    ));
    expect(result.language).toBe('Java');
    expect(result.runtime).toBe('JVM');
  });

  test('Swift project → Swift', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Swift (91.2%)', 'Objective-C (5.4%)', 'C (3.4%)'
    ));
    expect(result.language).toBe('Swift');
    expect(result.runtime).toBe('Swift');
  });

  test('Kotlin project → Kotlin + JVM', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Kotlin (72.3%)', 'Java (20.1%)', 'Groovy (7.6%)'
    ));
    expect(result.language).toBe('Kotlin');
    expect(result.runtime).toBe('JVM');
  });

  test('Ruby project → Ruby', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Ruby (88.7%)', 'JavaScript (6.2%)', 'HTML (5.1%)'
    ));
    expect(result.language).toBe('Ruby');
    expect(result.runtime).toBe('Ruby');
  });

  test('Zig project → Zig', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Zig (95.0%)', 'C (3.5%)', 'Shell (1.5%)'
    ));
    expect(result.language).toBe('Zig');
    expect(result.runtime).toBe('Zig');
  });

  test('PHP project → PHP', () => {
    const result = extractFromLanguages(metaWithLangs(
      'PHP (80.2%)', 'JavaScript (12.1%)', 'CSS (7.7%)'
    ));
    expect(result.language).toBe('PHP');
    expect(result.runtime).toBe('PHP');
  });

  test('Elixir project → Elixir + BEAM', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Elixir (94.3%)', 'JavaScript (3.2%)', 'CSS (2.5%)'
    ));
    expect(result.language).toBe('Elixir');
    expect(result.runtime).toBe('BEAM');
  });

  test('Scala project → Scala + JVM', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Scala (76.8%)', 'Java (18.2%)', 'Shell (5.0%)'
    ));
    expect(result.language).toBe('Scala');
    expect(result.runtime).toBe('JVM');
  });

  test('Dart project → Dart', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Dart (89.4%)', 'Swift (5.3%)', 'Kotlin (5.3%)'
    ));
    expect(result.language).toBe('Dart');
    expect(result.runtime).toBe('Dart');
  });

  test('Haskell project → Haskell + GHC', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Haskell (90.1%)', 'C (6.4%)', 'Shell (3.5%)'
    ));
    expect(result.language).toBe('Haskell');
    expect(result.runtime).toBe('GHC');
  });
});

describe('BRAKE: Language Edge Cases', () => {
  test('Empty languages → no language detected', () => {
    const result = extractFromLanguages(metaWithLangs());
    expect(result.language).toBeUndefined();
    expect(result.runtime).toBeUndefined();
  });

  test('Unknown primary language (Cuda) → no language detected', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Cuda (55.0%)', 'Python (45.0%)'
    ));
    // Cuda is not in the map, so no language set
    expect(result.language).toBeUndefined();
  });

  test('Shell primary (claude-code) → no language detected', () => {
    // Shell isn't in the language map — intentional,
    // since shell-primary repos are usually misclassified
    const result = extractFromLanguages(metaWithLangs(
      'Shell (44.9%)', 'Python (30.5%)', 'TypeScript (18.4%)'
    ));
    expect(result.language).toBeUndefined();
  });

  test('Lua project → Lua', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Lua (82.3%)', 'C (17.7%)'
    ));
    expect(result.language).toBe('Lua');
    expect(result.runtime).toBe('Lua');
  });

  test('Primary language uses first entry only (order matters)', () => {
    // Even though Python has 40%, JS at 60% is primary
    const result = extractFromLanguages(metaWithLangs(
      'JavaScript (60.0%)', 'Python (40.0%)'
    ));
    expect(result.language).toBe('JavaScript');
  });
});

// ============================================================
// TIER: BRAKE — Build System Detection
// ============================================================

describe('BRAKE: Build System Detection', () => {
  test('CMake detected from languages', () => {
    const result = extractFromLanguages(metaWithLangs(
      'C++ (85.0%)', 'CMake (10.0%)', 'Shell (5.0%)'
    ));
    expect(result.buildTool).toBe('CMake');
  });

  test('Makefile detected from languages', () => {
    const result = extractFromLanguages(metaWithLangs(
      'C (98.0%)', 'Makefile (1.5%)', 'Shell (0.5%)'
    ));
    expect(result.buildTool).toBe('Make');
  });

  test('Gradle detected from languages', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Java (70.0%)', 'Gradle (20.0%)', 'Shell (10.0%)'
    ));
    expect(result.buildTool).toBe('Gradle');
  });

  test('Maven detected from languages', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Java (75.0%)', 'Maven (15.0%)', 'Shell (10.0%)'
    ));
    expect(result.buildTool).toBe('Maven');
  });

  test('Docker detected from Dockerfile in languages', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Go (80.0%)', 'Dockerfile (15.0%)', 'Shell (5.0%)'
    ));
    expect(result.hosting).toBe('Docker');
  });

  test('No build system when none in languages', () => {
    const result = extractFromLanguages(metaWithLangs(
      'Python (95.0%)', 'Shell (5.0%)'
    ));
    expect(result.buildTool).toBeUndefined();
  });
});

// ============================================================
// TIER: ENGINE — Package.json Analysis (analyzePackageJson)
// ============================================================

describe('ENGINE: Package.json Stack Detection', () => {
  test('React detected from dependencies', () => {
    const result = analyzePackageJson(
      { dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' } },
      metaWithLangs()
    );
    expect(result.frontend).toBe('React');
    expect(result.frameworks).toContain('React');
  });

  test('Vue detected from dependencies', () => {
    const result = analyzePackageJson(
      { dependencies: { vue: '^3.0.0' } },
      metaWithLangs()
    );
    expect(result.frontend).toBe('Vue');
  });

  test('Svelte detected from devDependencies', () => {
    const result = analyzePackageJson(
      { devDependencies: { svelte: '^4.0.0' } },
      metaWithLangs()
    );
    expect(result.frontend).toBe('Svelte');
  });

  test('Next.js detected', () => {
    const result = analyzePackageJson(
      { dependencies: { next: '^14.0.0', react: '^18.0.0' } },
      metaWithLangs()
    );
    expect(result.frontend).toBe('React');
    // next is checked after react, so frontend = React
  });

  test('Express backend detected', () => {
    const result = analyzePackageJson(
      { dependencies: { express: '^4.18.0' } },
      metaWithLangs()
    );
    expect(result.backend).toBe('Express');
    expect(result.frameworks).toContain('Express');
  });

  test('Fastify backend detected', () => {
    const result = analyzePackageJson(
      { dependencies: { fastify: '^4.0.0' } },
      metaWithLangs()
    );
    expect(result.backend).toBe('Fastify');
  });

  test('NestJS backend detected', () => {
    const result = analyzePackageJson(
      { dependencies: { '@nestjs/core': '^10.0.0' } },
      metaWithLangs()
    );
    expect(result.backend).toBe('NestJS');
  });

  test('MongoDB detected from mongoose', () => {
    const result = analyzePackageJson(
      { dependencies: { mongoose: '^7.0.0' } },
      metaWithLangs()
    );
    expect(result.database).toBe('MongoDB');
  });

  test('PostgreSQL detected from pg', () => {
    const result = analyzePackageJson(
      { dependencies: { pg: '^8.0.0' } },
      metaWithLangs()
    );
    expect(result.database).toBe('PostgreSQL');
  });

  test('Redis detected', () => {
    const result = analyzePackageJson(
      { dependencies: { redis: '^4.0.0' } },
      metaWithLangs()
    );
    expect(result.database).toBe('Redis');
  });

  test('Jest testing detected', () => {
    const result = analyzePackageJson(
      { devDependencies: { jest: '^29.0.0' } },
      metaWithLangs()
    );
    expect(result.testing).toBe('Jest');
  });

  test('Vitest testing detected', () => {
    const result = analyzePackageJson(
      { devDependencies: { vitest: '^1.0.0' } },
      metaWithLangs()
    );
    expect(result.testing).toBe('Vitest');
  });

  test('Vite build detected', () => {
    const result = analyzePackageJson(
      { devDependencies: { vite: '^5.0.0' } },
      metaWithLangs()
    );
    expect(result.buildTool).toBe('Vite');
  });

  test('Rollup build detected', () => {
    const result = analyzePackageJson(
      { devDependencies: { rollup: '^4.0.0' } },
      metaWithLangs()
    );
    expect(result.buildTool).toBe('Rollup');
  });

  test('Turborepo build detected', () => {
    const result = analyzePackageJson(
      { devDependencies: { turbo: '^2.0.0' } },
      metaWithLangs()
    );
    expect(result.buildTool).toBe('Turborepo');
  });

  test('Full-stack: React + Express + MongoDB + Jest', () => {
    const result = analyzePackageJson(
      {
        dependencies: { react: '^18.0.0', express: '^4.18.0', mongoose: '^7.0.0' },
        devDependencies: { jest: '^29.0.0', vite: '^5.0.0' }
      },
      metaWithLangs()
    );
    expect(result.frontend).toBe('React');
    expect(result.backend).toBe('Express');
    expect(result.database).toBe('MongoDB');
    expect(result.testing).toBe('Jest');
    expect(result.buildTool).toBe('Vite');
    expect(result.frameworks).toContain('React');
    expect(result.frameworks).toContain('Express');
  });

  test('Empty package.json → empty analysis', () => {
    const result = analyzePackageJson({}, metaWithLangs());
    expect(result.frontend).toBeUndefined();
    expect(result.backend).toBeUndefined();
    expect(result.database).toBeUndefined();
    expect(result.frameworks).toEqual([]);
  });

  test('No dependencies key → no crash', () => {
    const result = analyzePackageJson({ name: 'test' }, metaWithLangs());
    expect(result.frameworks).toEqual([]);
  });

  test('Language NOT overridden by analyzePackageJson', () => {
    // analyzePackageJson should NOT set language anymore
    const result = analyzePackageJson(
      { dependencies: { react: '^18.0.0' } },
      metaWithLangs('TypeScript (85.0%)', 'JavaScript (15.0%)')
    );
    // language should NOT be set by analyzePackageJson
    expect(result.language).toBeUndefined();
  });
});

// ============================================================
// TIER: ENGINE — README 6Ws Extraction
// ============================================================

describe('ENGINE: Install Detection (language-aware)', () => {
  const meta = metaWithLangs();

  test('pip install → detected', () => {
    const result = extract6WsFromReadme('## Installation\npip install pytorch', meta);
    expect(result.how).toBe('pip install (see README)');
  });

  test('pip3 install → detected', () => {
    const result = extract6WsFromReadme('pip3 install package-name', meta);
    expect(result.how).toBe('pip install (see README)');
  });

  test('cargo install → detected', () => {
    const result = extract6WsFromReadme('cargo install my-tool', meta);
    expect(result.how).toBe('cargo install (see README)');
  });

  test('cargo add → detected', () => {
    const result = extract6WsFromReadme('cargo add my-lib', meta);
    expect(result.how).toBe('cargo install (see README)');
  });

  test('go install → detected', () => {
    const result = extract6WsFromReadme('go install github.com/user/tool@latest', meta);
    expect(result.how).toBe('go install (see README)');
  });

  test('go get → detected', () => {
    const result = extract6WsFromReadme('go get github.com/user/lib', meta);
    expect(result.how).toBe('go install (see README)');
  });

  test('npm install → detected', () => {
    const result = extract6WsFromReadme('npm install react', meta);
    expect(result.how).toBe('npm install (see README)');
  });

  test('npx command → detected as npm', () => {
    const result = extract6WsFromReadme('npx create-react-app my-app', meta);
    expect(result.how).toBe('npm install (see README)');
  });

  test('yarn add → detected as npm', () => {
    const result = extract6WsFromReadme('yarn add express', meta);
    expect(result.how).toBe('npm install (see README)');
  });

  test('brew install → detected', () => {
    const result = extract6WsFromReadme('brew install my-tool', meta);
    expect(result.how).toBe('brew install (see README)');
  });

  test('docker pull → detected', () => {
    const result = extract6WsFromReadme('docker pull myimage:latest', meta);
    expect(result.how).toBe('Docker (see README)');
  });

  test('docker run → detected', () => {
    const result = extract6WsFromReadme('docker run -it myimage', meta);
    expect(result.how).toBe('Docker (see README)');
  });

  test('Getting Started header → detected', () => {
    const result = extract6WsFromReadme('## Getting Started\nFollow these steps...', meta);
    expect(result.how).toBe('See Getting Started in README');
  });

  test('Quick Start header → detected', () => {
    const result = extract6WsFromReadme('## Quick Start\nRun this command...', meta);
    expect(result.how).toBe('See Getting Started in README');
  });

  test('Installation header → detected', () => {
    const result = extract6WsFromReadme('## Installation\nDownload from releases...', meta);
    expect(result.how).toBe('See Getting Started in README');
  });

  test('No install info → default', () => {
    const result = extract6WsFromReadme('# My Project\nThis is a project.', meta);
    expect(result.how).toBe('See README for usage');
  });

  test('pip takes priority over Getting Started', () => {
    const result = extract6WsFromReadme(
      '## Getting Started\npip install my-package',
      meta
    );
    expect(result.how).toBe('pip install (see README)');
  });
});

describe('ENGINE: Who Extraction Filtering', () => {
  const meta = metaWithLangs();

  test('Trailing pipe filtered out', () => {
    const readme = '# PyTorch\nmaximum flexibility |\nSome other text';
    const result = extract6WsFromReadme(readme, meta);
    // Should NOT set who to "maximum flexibility |"
    expect(result.who).toBe('Open source contributors');
  });

  test('Trailing colon filtered out', () => {
    const readme = '# React\nBuilt for gradual adoption from the start, and you can use as little or as much React as you need:';
    const result = extract6WsFromReadme(readme, meta);
    // Contains colon — should be filtered
    expect(result.who).toBe('Open source contributors');
  });

  test('Code blocks in who filtered out', () => {
    const readme = '## Who\n```bash\nnpm install```';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.who).toBe('Open source contributors');
  });

  test('Markdown links in who filtered out', () => {
    const readme = '## Who\n[Click here](https://example.com) for more info about users';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.who).toBe('Open source contributors');
  });

  test('Valid audience description kept', () => {
    const readme = 'Built for developers who want fast, reliable testing';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.who).toBe('developers who want fast, reliable testing');
  });

  test('Too short who filtered out', () => {
    const readme = 'Built for ten ppl';
    const result = extract6WsFromReadme(readme, meta);
    // "ten ppl" is < 15 chars → filtered
    expect(result.who).toBe('Open source contributors');
  });
});

describe('ENGINE: What Extraction', () => {
  const meta: GitHubMetadata = {
    owner: 'test', repo: 'test', url: 'https://github.com/test/test',
    description: 'A testing framework',
  };

  test('Bold subtitle after H1 extracted', () => {
    const readme = '# MyProject\n\n**A blazing fast JavaScript bundler**\n\nMore text.';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.what).toBe('A blazing fast JavaScript bundler');
  });

  test('First paragraph extracted when no bold subtitle', () => {
    const readme = '# MyProject\n\nA comprehensive testing framework that makes it easy to write reliable tests for any JavaScript codebase.';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.what).toContain('comprehensive testing framework');
  });

  test('Falls back to description when no README patterns match', () => {
    const readme = '# MyProject\n\n```\ncode block\n```';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.what).toBe('A testing framework');
  });
});

describe('ENGINE: Why Extraction', () => {
  const meta = metaWithLangs();

  test('**Problem:** pattern extracted', () => {
    const readme = '**Problem:** Context is lost every time you start a new AI session';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.why).toContain('Context is lost');
  });

  test('## Why section extracted', () => {
    const readme = '# Tool\n## Why\nExisting tools are too slow for large codebases and waste developer time.\n## How';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.why).toContain('too slow');
  });

  test('No why pattern → empty string', () => {
    const readme = '# Simple Project\nJust a project.';
    const result = extract6WsFromReadme(readme, meta);
    expect(result.why).toBe('');
  });
});

describe('ENGINE: Confidence Scoring', () => {
  const meta = metaWithLangs();

  test('Bare minimum README → confidence 40', () => {
    const result = extract6WsFromReadme('# Project\nShort.', meta);
    expect(result.confidence).toBe(40);
  });

  test('Rich README → high confidence', () => {
    const readme = `# MyTool
**A fast, reliable build tool for JavaScript projects**

**Problem:** Existing bundlers are slow and complex.

Built for frontend developers who need fast iteration cycles

## Quick Start
npm install my-tool
`;
    const result = extract6WsFromReadme(readme, meta);
    // Bold subtitle (+15) + Problem (+10) + Built for (+10) + npm install (+5) = 40 boost
    expect(result.confidence).toBeGreaterThanOrEqual(75);
  });
});

// ============================================================
// TIER: AERO — Score Tiers
// ============================================================

describe('AERO: Score Tier Display', () => {
  test('100% → Trophy', () => {
    expect(getScoreTier(100)).toContain('Trophy');
  });

  test('99% → Gold', () => {
    expect(getScoreTier(99)).toContain('Gold');
  });

  test('95% → Silver', () => {
    expect(getScoreTier(95)).toContain('Silver');
  });

  test('85% → Bronze', () => {
    expect(getScoreTier(85)).toContain('Bronze');
  });

  test('70% → Green', () => {
    expect(getScoreTier(70)).toContain('Green');
  });

  test('55% → Yellow', () => {
    expect(getScoreTier(55)).toContain('Yellow');
  });

  test('30% → Red', () => {
    expect(getScoreTier(30)).toContain('Red');
  });

  test('0% → White', () => {
    expect(getScoreTier(0)).toContain('White');
  });
});
