/**
 * 🏎️ WJTTC — Ruby Content-Aware Context Engine
 *
 * BRAKE:  Gemfile is NEVER blindly Rails / backend
 * ENGINE: gem names · layout · MCP · CLI · library
 * AERO:   turbo-cat + tech_stack compose
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import {
  detectRubyProject,
  parseGemfileGems,
  parseGemfileLockGems,
} from '../../src/detect/ruby.js';
import {
  detectProjectTypeWithRationale,
  detectFrameworks,
} from '../../src/detect/scanner.js';
import { detectStack } from '../../src/detect/stack.js';
import { turboCatSlots } from '../../src/detect/turbo-cat.js';
import rubySpec from '../../src/detect/ruby-detection.json';

let dir: string;

beforeEach(() => {
  dir = join(tmpdir(), `wjttc-ruby-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function file(rel: string, content = ''): void {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

describe('WJTTC BRAKE: Gemfile alone ≠ Rails', () => {
  test('bare rake Gemfile → library, not Rails', () => {
    file('Gemfile', "source 'https://rubygems.org'\ngem 'rake'\n");
    const r = detectRubyProject(dir);
    expect(r?.appType).toBe('library');
    expect(r?.framework).toBe('');
    expect(detectProjectTypeWithRationale(dir).type).toBe('library');
  });

  test('no ruby markers → null', () => {
    file('README.md', 'hello');
    expect(detectRubyProject(dir)).toBeNull();
  });

  test('knowledge has MCP + web gems (single source)', () => {
    expect((rubySpec.mcpGems as string[]).length).toBeGreaterThan(0);
    expect((rubySpec.webGems as unknown[]).length).toBeGreaterThan(0);
  });

  test('detectFrameworks does not assert Rails from bare Gemfile', () => {
    file('Gemfile', "gem 'rake'\n");
    expect(detectFrameworks(dir).some(f => f.slug === 'rails')).toBe(false);
  });
});

describe('WJTTC ENGINE: Ruby classification', () => {
  test('rails gem → backend + Rails', () => {
    file('Gemfile', "gem 'rails', '~> 7.1'\n");
    const r = detectRubyProject(dir);
    expect(r?.appType).toBe('backend');
    expect(r?.framework).toBe('Rails');
  });

  test('Rails layout without gem name → backend', () => {
    file('Gemfile', "gem 'puma'\n");
    file('config/application.rb', "require 'rails'\n");
    expect(detectRubyProject(dir)?.appType).toBe('backend');
  });

  test('mcp gem wins over rails', () => {
    file('Gemfile', "gem 'mcp'\ngem 'rails'\n");
    expect(detectRubyProject(dir)?.appType).toBe('mcp');
  });

  test('sinatra → backend', () => {
    file('Gemfile', "gem 'sinatra'\n");
    expect(detectRubyProject(dir)?.framework).toBe('Sinatra');
  });

  test('thor → cli', () => {
    file('Gemfile', "gem 'thor'\n");
    expect(detectRubyProject(dir)?.appType).toBe('cli');
  });

  test('parseGemfileGems single + double quotes', () => {
    const g = parseGemfileGems("gem 'rails'\ngem \"sinatra\", '~> 3'\n# gem 'nope'\n");
    expect(g.has('rails')).toBe(true);
    expect(g.has('sinatra')).toBe(true);
    expect(g.has('nope')).toBe(false);
  });

  test('parseGemfileLockGems specs', () => {
    const g = parseGemfileLockGems(`GEM
  remote: https://rubygems.org/
  specs:
    rails (7.1.0)
      railties (= 7.1.0)
    railties (7.1.0)

PLATFORMS
  ruby
`);
    expect(g.has('rails')).toBe(true);
    expect(g.has('railties')).toBe(true);
  });
});

describe('WJTTC AERO: multi-surface compose', () => {
  test('Turbo-Cat bare Gemfile does not stamp Rails backend', () => {
    file('Gemfile', "gem 'rake'\n");
    const tc = turboCatSlots(dir);
    expect(tc.stack?.backend).not.toBe('Rails');
    expect(tc.project?.main_language).toBe('Ruby');
  });

  test('Turbo-Cat Rails from gem rails', () => {
    file('Gemfile', "gem 'rails'\n");
    const tc = turboCatSlots(dir);
    expect(tc.stack?.backend).toBe('Rails');
  });

  test('tech_stack bare Gemfile has Ruby not Rails', () => {
    file('Gemfile', "gem 'rake'\n");
    const data = detectStack(dir);
    expect(data.project?.type).toMatch(/library/);
    expect(data.tech_stack ?? []).toContain('Ruby');
    expect(data.tech_stack ?? []).not.toContain('Rails');
  });

  test('tech_stack Rails when rails in Gemfile', () => {
    file('Gemfile', "gem 'rails'\n");
    const data = detectStack(dir);
    expect(data.project?.type).toBe('backend');
    expect(data.tech_stack ?? []).toContain('Rails');
  });
});
