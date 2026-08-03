import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import spec from './ruby-detection.json';

/**
 * Ruby detection — CONTENT-AWARE Gemfile / gemspec classification.
 *
 * Kill line: Gemfile alone ≠ Rails.
 * Bundler backs libraries, Rails apps, Sinatra/Roda/Grape/Hanami, CLIs, and MCP
 * servers. We read gem names (+ light layout), then branch.
 *
 * Same composition as go.ts / jvm.ts: knowledge in ruby-detection.json.
 */

export type RubyAppType = 'mcp' | 'backend' | 'cli' | 'library';

export interface RubyProject {
  appType: RubyAppType;
  /** Primary framework label (Rails / Sinatra / …) or ''. */
  framework: string;
  /** package manager signal */
  packageManager: 'bundler' | 'rubygems';
  /** Glass Hood rationale for .faf `# found:`. */
  found: string;
}

const MCP_GEMS = (spec.mcpGems as string[]).map(g => g.toLowerCase());
const WEB_GEMS = (spec.webGems as Array<[string, string]>).map(
  ([g, label]) => [g.toLowerCase(), label] as [string, string],
);
const CLI_GEMS = (spec.cliGems as Array<[string, string]>).map(
  ([g, label]) => [g.toLowerCase(), label] as [string, string],
);
const RAILS_LAYOUT = spec.railsLayoutFiles as string[];

/** True if directory looks like a Ruby project root. */
export function isRubyRoot(dir: string): boolean {
  return (
    existsSync(join(dir, 'Gemfile')) ||
    existsSync(join(dir, 'gems.rb')) ||
    hasGemspec(dir)
  );
}

function hasGemspec(dir: string): boolean {
  try {
    return readdirSync(dir).some(f => f.endsWith('.gemspec'));
  } catch {
    return false;
  }
}

function readText(path: string): string | null {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Extract gem names from a Gemfile / gems.rb (static — does NOT execute Ruby).
 * Handles: gem 'x', gem "x", gem :x (rare), gem "x", "1.0"
 */
export function parseGemfileGems(content: string): Set<string> {
  const gems = new Set<string>();
  for (const raw of content.split('\n')) {
    // Strip comments
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) {continue;}
    // gem 'name' or gem "name" optionally followed by comma/version
    const m = line.match(/^\s*gem\s+['"]([^'"]+)['"]/i)
      || line.match(/^\s*gem\s+:([A-Za-z0-9_.-]+)/i);
    if (m) {gems.add(m[1].toLowerCase());}
  }
  return gems;
}

/**
 * Extract gem names from Gemfile.lock SPECS sections (static).
 * Lines like "    rails (7.1.0)" under GEM specs.
 */
export function parseGemfileLockGems(content: string): Set<string> {
  const gems = new Set<string>();
  let inSpecs = false;
  for (const raw of content.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (/^\s*specs:\s*$/.test(line)) {
      inSpecs = true;
      continue;
    }
    // Leave specs on blank line at column 0 or new top-level section (no indent)
    if (inSpecs) {
      if (/^[A-Z]/.test(line) || line.startsWith('PLATFORMS') || line.startsWith('DEPENDENCIES')
        || line.startsWith('BUNDLED') || line.startsWith('RUBY VERSION') || line.startsWith('CHECKSUMS')) {
        inSpecs = false;
        continue;
      }
      // "    gemname (1.2.3)" — 4 spaces typical
      const m = line.match(/^\s{2,}([a-zA-Z0-9_.-]+)\s*\(/);
      if (m) {gems.add(m[1].toLowerCase());}
    }
  }
  return gems;
}

/** Gem names from *.gemspec dependency lines (static). */
export function parseGemspecGems(content: string): Set<string> {
  const gems = new Set<string>();
  for (const raw of content.split('\n')) {
    const line = raw.replace(/#.*$/, '');
    // add_dependency "x" / add_runtime_dependency 'x' / add_development_dependency
    const m = line.match(/add_(?:runtime_|development_)?dependency\s*\(?\s*['"]([^'"]+)['"]/i);
    if (m) {gems.add(m[1].toLowerCase());}
  }
  return gems;
}

function collectGems(dir: string): { gems: Set<string>; sources: string[] } {
  const gems = new Set<string>();
  const sources: string[] = [];

  for (const name of ['Gemfile', 'gems.rb']) {
    const p = join(dir, name);
    const body = readText(p);
    if (body) {
      for (const g of parseGemfileGems(body)) {gems.add(g);}
      sources.push(name);
    }
  }

  const lock = readText(join(dir, 'Gemfile.lock')) || readText(join(dir, 'gems.locked'));
  if (lock) {
    for (const g of parseGemfileLockGems(lock)) {gems.add(g);}
    sources.push('Gemfile.lock');
  }

  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.gemspec')) {continue;}
      const body = readText(join(dir, f));
      if (body) {
        for (const g of parseGemspecGems(body)) {gems.add(g);}
        sources.push(f);
      }
    }
  } catch { /* skip */ }

  return { gems, sources };
}

function hasGem(gems: Set<string>, name: string): boolean {
  const n = name.toLowerCase();
  if (gems.has(n)) {return true;}
  // rails engines sometimes appear as path gems still named rails
  return false;
}

function findLabeled(
  gems: Set<string>,
  entries: Array<[string, string]>,
): [string, string] | undefined {
  let best: [string, string] | undefined;
  for (const [id, label] of entries) {
    if (!hasGem(gems, id)) {continue;}
    // Prefer longer / more specific gem names
    if (!best || id.length > best[0].length) {best = [id, label];}
  }
  return best;
}

function findMcp(gems: Set<string>): string | undefined {
  let best: string | undefined;
  for (const id of MCP_GEMS) {
    if (hasGem(gems, id) && (!best || id.length > best.length)) {best = id;}
  }
  return best;
}

function railsLayoutHit(dir: string): string | undefined {
  for (const rel of RAILS_LAYOUT) {
    if (existsSync(join(dir, rel))) {return rel;}
  }
  return undefined;
}

/** True if gemspec or package marks executables / bin tools. */
function hasCliShape(dir: string, gems: Set<string>): { hit: boolean; why: string } {
  const cli = findLabeled(gems, CLI_GEMS);
  if (cli) {return { hit: true, why: cli[0] };}

  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.gemspec')) {continue;}
      const body = readText(join(dir, f));
      if (body && /executables\s*=/.test(body) && !/executables\s*=\s*\[\s*\]/.test(body)) {
        return { hit: true, why: `${f} executables` };
      }
    }
  } catch { /* skip */ }

  const binDir = join(dir, 'bin');
  if (existsSync(binDir)) {
    try {
      const bins = readdirSync(binDir).filter(b => {
        if (b === 'setup' || b === 'console' || b === 'rake') {return false;}
        try {
          return statSync(join(binDir, b)).isFile();
        } catch {
          return false;
        }
      });
      // bin/rails alone is Rails, not CLI product
      const nonRails = bins.filter(b => b !== 'rails');
      if (nonRails.length > 0 && !hasGem(gems, 'rails') && !railsLayoutHit(dir)) {
        return { hit: true, why: `bin/${nonRails[0]}` };
      }
    } catch { /* skip */ }
  }

  return { hit: false, why: '' };
}

/**
 * Classify a Ruby project from Gemfile / lock / gemspec (+ light layout).
 * Returns null if not a Ruby root.
 */
export function detectRubyProject(dir: string): RubyProject | null {
  if (!isRubyRoot(dir)) {return null;}

  const { gems, sources } = collectGems(dir);
  const srcLabel = sources[0] || 'Gemfile';
  const packageManager: 'bundler' | 'rubygems' =
    sources.some(s => s === 'Gemfile' || s === 'gems.rb' || s.includes('lock'))
      ? 'bundler'
      : 'rubygems';

  const mcp = findMcp(gems);
  const web = findLabeled(gems, WEB_GEMS);
  const railsLayout = railsLayoutHit(dir);
  const hasRailsGem = hasGem(gems, 'rails') || hasGem(gems, 'railties');
  const cliShape = hasCliShape(dir, gems);
  const hasConfigRu = existsSync(join(dir, 'config.ru'));

  // Rails is NEVER inferred from Gemfile existence alone.
  // rails gem and/or classic layout required.
  const isRails = hasRailsGem || !!railsLayout;

  // Strong web gems (not bare rack without config.ru)
  const strongWeb =
    web &&
    web[1] !== 'Rails' &&
    !(web[0] === 'rack' && !hasConfigRu)
      ? web
      : undefined;

  let appType: RubyAppType;
  let framework = '';
  let found: string;

  // Priority: MCP → Rails → other web → CLI → library
  // Gemfile alone is never backend.
  if (mcp) {
    appType = 'mcp';
    framework = 'MCP';
    found = `${srcLabel} + gem ${mcp} (Ruby MCP)`;
  } else if (isRails) {
    appType = 'backend';
    framework = 'Rails';
    if (hasRailsGem && railsLayout) {
      found = `${srcLabel} + rails + ${railsLayout} (Rails)`;
    } else if (hasRailsGem) {
      found = `${srcLabel} + gem rails (Rails)`;
    } else {
      found = `${railsLayout} (Rails layout)`;
    }
  } else if (strongWeb) {
    appType = 'backend';
    framework = strongWeb[1];
    found = `${srcLabel} + gem ${strongWeb[0]} (Ruby backend)`;
  } else if (cliShape.hit) {
    appType = 'cli';
    framework = findLabeled(gems, CLI_GEMS)?.[1] || '';
    found = `${srcLabel} + ${cliShape.why} (Ruby CLI)`;
  } else {
    appType = 'library';
    found = `${srcLabel} (Ruby library)`;
  }

  return { appType, framework, packageManager, found };
}
