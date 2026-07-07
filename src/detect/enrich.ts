import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { FafData } from '../core/types.js';
import { detectCommands, detectKeyFiles } from './scanner.js';

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

  return out;
}
