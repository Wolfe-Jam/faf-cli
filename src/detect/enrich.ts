import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';
import { detectCommands, detectKeyFiles } from './scanner.js';

type Pkg = {
  type?: string;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
} | null;

/**
 * Detect the toolchain that governs code conventions. Emits POINTERS ("obey the
 * configs"), never restated lint rules — restating toolchain-enforced rules is a
 * known AGENTS.md anti-pattern (ASDLC "toolchain-first").
 */
function detectConventions(dir: string, pkg: Pkg): string[] {
  const conv: string[] = [];
  const has = (f: string): boolean => existsSync(join(dir, f));
  const read = (f: string): string => {
    try {
      return readFileSync(join(dir, f), 'utf-8');
    } catch {
      return '';
    }
  };

  if (has('tsconfig.json') && /"strict"\s*:\s*true/.test(read('tsconfig.json'))) {
    conv.push('TypeScript strict mode (tsconfig.json)');
  }
  if (pkg?.type === 'module') conv.push('ESM modules (`type: module`)');

  const tools: string[] = [];
  const dev = pkg?.devDependencies ?? {};
  if (
    has('.eslintrc') || has('.eslintrc.json') || has('.eslintrc.cjs') ||
    has('eslint.config.js') || has('eslint.config.mjs') || 'eslint' in dev
  ) {
    tools.push('ESLint');
  }
  if (has('.prettierrc') || has('.prettierrc.json') || has('prettier.config.js') || 'prettier' in dev) {
    tools.push('Prettier');
  }
  const py = has('pyproject.toml') ? read('pyproject.toml') : '';
  if (/\[tool\.black\]/.test(py)) tools.push('black');
  if (/\[tool\.ruff\]/.test(py)) tools.push('ruff');
  if (/\[tool\.mypy\]/.test(py)) tools.push('mypy');
  if (has('rustfmt.toml') || has('.rustfmt.toml')) tools.push('rustfmt');
  if (tools.length) conv.push(`Style enforced by ${tools.join(' · ')} — obey the configs`);

  return conv;
}

/**
 * Enrich .faf data with facts DETECTED from the repo at export time, so a lean
 * or stale .faf still yields a complete AGENTS.md — the "frictionless, any repo"
 * goal. Fill-if-absent: hand-authored .faf values always WIN; detection only
 * fills the gaps. Pure (returns a shallow copy; never mutates the input).
 *
 * Detects: build/test/lint commands, key files/entry points, and secrets
 * (.env presence — location only, never the values).
 */
export function enrichFromRepo(dir: string, data: FafData): FafData {
  const out: FafData = { ...data };

  let pkg: unknown = null;
  const pj = join(dir, 'package.json');
  if (existsSync(pj)) {
    try {
      pkg = JSON.parse(readFileSync(pj, 'utf-8'));
    } catch {
      pkg = null;
    }
  }

  // Commands: detected fills gaps; any hand-authored command key wins.
  const detected = detectCommands(dir, pkg as never);
  if (Object.keys(detected).length) {
    out.commands = { ...detected, ...(data.commands ?? {}) };
  }

  // Key files: keep the hand-authored list if present, else use detected.
  const existing =
    data.key_files ?? (data.instant_context as { key_files?: string[] } | undefined)?.key_files;
  if (!existing || existing.length === 0) {
    const files = detectKeyFiles(dir);
    if (files.length) out.key_files = files;
  }

  // Security: detect a secrets file (.env), keep hand-authored if present.
  if (!data.security) {
    const envFiles = ['.env', '.env.local', '.env.development'];
    const secrets = envFiles.find((f) => existsSync(join(dir, f)));
    if (secrets) {
      const example = ['.env.example', '.env.sample', '.env.template'].find((f) =>
        existsSync(join(dir, f)),
      );
      out.security = { secrets, ...(example ? { example } : {}) };
    }
  }

  // Conventions: detect the governing toolchain (fill-if-absent).
  if (!data.conventions) {
    const conv = detectConventions(dir, pkg as Pkg);
    if (conv.length) out.conventions = conv;
  }

  return out;
}
