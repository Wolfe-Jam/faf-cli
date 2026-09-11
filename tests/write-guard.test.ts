/**
 * TRUST SEAL — "enhance, never replace" (source write-guard).
 *
 * faf must NEVER raw-overwrite a context / IDE-rule file. Every such write goes
 * through injectFafBlock (non-destructive). This guard fails the build if any
 * `fs.writeFile` / `writeFileSync` targets a context file directly — so the
 * file-wipe bug physically cannot be reintroduced. The code is not allowed to.
 */
import { describe, test, expect } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// A write whose line names a context/IDE-rule file literally.
const LITERAL =
  /\b(writeFile|writeFileSync)\s*\([^;]*\b(AGENTS\.md|CLAUDE\.md|GEMINI\.md|\.cursorrules|\.windsurfrules|\.clinerules)\b/;
// A write of generated context content to a bare context-file path variable.
// (Tuned to interop vars + content vars; `.faf` writes use fafContent/fafPath, allowed.)
const BARE =
  /\b(writeFile|writeFileSync)\s*\(\s*(outputPath|targetPath|claudeMdPath|claudePath)\s*,\s*(content|platformContent|claudeMdContent|merged)\b/;

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === 'inject.ts') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) tsFiles(p, out);
    else if (e.endsWith('.ts') && !e.endsWith('.test.ts') && !e.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

describe('BRAKE: TRUST SEAL — enhance, never replace', () => {
  test('no raw fs.writeFile to a context/IDE-rule file — use injectFafBlock', () => {
    const violations: string[] = [];
    for (const f of tsFiles('src')) {
      readFileSync(f, 'utf-8').split('\n').forEach((line, i) => {
        // A write is allowed only if it routes through injectFafBlock OR carries an
        // explicit, auditable `trust-seal-ok:` exemption (e.g. a verified marker-merge).
        if ((LITERAL.test(line) || BARE.test(line)) && !line.includes('trust-seal-ok')) {
          violations.push(`${f}:${i + 1}  ${line.trim()}`);
        }
      });
    }
    if (violations.length) {
      throw new Error(
        'TRUST SEAL BROKEN — raw context-file write detected. Route it through injectFafBlock ' +
        '("enhance, never replace"):\n  ' + violations.join('\n  '),
      );
    }
  });
});

// Library writers (src/interop, src/fafm, src/core) never write with a raw
// fs.writeFileSync / appendFileSync: every one goes through safeWriteFile
// (src/core/safe-write.ts), which refuses a link that leaves the project and
// replaces the file atomically. fce35d6b had raw writes in faf.ts, soul.ts,
// inject.ts, projecthtml.ts, servercard.ts, grok.ts, cards.ts and faf-dna.ts.
describe('BRAKE: TRUST SEAL — library writers go through safeWriteFile', () => {
  test('no raw writeFileSync / appendFileSync / writeFile in src/interop, src/fafm, src/core', () => {
    const RAW = /\b(writeFileSync|appendFileSync|writeFile|appendFile)\s*\(/;
    const violations: string[] = [];
    for (const root of ['src/interop', 'src/fafm', 'src/core']) {
      for (const f of libFiles(root)) {
        if (f.endsWith('safe-write.ts')) continue; // the primitive itself
        readFileSync(f, 'utf-8').split('\n').forEach((line, i) => {
          if (RAW.test(line) && !line.trim().startsWith('*') && !line.trim().startsWith('//')) {
            violations.push(`${f}:${i + 1}  ${line.trim()}`);
          }
        });
      }
    }
    if (violations.length) {
      throw new Error(`raw write in a library writer — use safeWriteFile:\n  ${violations.join('\n  ')}`);
    }
  });
});

function libFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) libFiles(p, out);
    else if (e.endsWith('.ts') && !e.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 7.13 round 3 — every writer, no exceptions. No file in src/ may call an fs
// API that writes, appends, renames, deletes, creates a folder, links or
// changes a mode, except src/core/safe-write.ts — the one primitive (resolve
// inside the project, atomic write, compare before rename, faf's own mark).
// 7.13 round 2 still had raw writes in refresh/compile (.fafb), server-card
// (server.json), taf (taf.yml, --output), diff --install-driver
// (.gitattributes), go (session), bench (state), demo, hooks, git/clear (temp
// folders), the star nudge, and mkdirSync in five writers.
//
// What the seal cannot see: it reads source text, so a write made by a
// subprocess is invisible to it. Two commands run one that writes, and their
// effects follow the owner rule by construction (tested in
// tests/core/owner-rule-r4.test.ts):
//   - `faf diff --install-driver` / `--uninstall-driver` run `git config` on
//     `diff.faf.command`. faf reads `git config --get-all` first, sets it only
//     when it is unset or already faf's value (`faf-cli diff-driver`), and
//     unsets it only when its one value is exactly that; any other value is
//     left alone with one line.
//   - `faf git` runs `git clone` into a `repo/` folder inside a temp folder
//     faf made (makeTempDir, with faf's marker file), removed when it ends.
// ---------------------------------------------------------------------------
const SAFE_WRITE = join('src', 'core', 'safe-write.ts');

/** fs APIs that change the disk. */
const MUTATORS = new Set([
  'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'createWriteStream',
  'rename', 'renameSync', 'unlink', 'unlinkSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync',
  'mkdir', 'mkdirSync', 'mkdtemp', 'mkdtempSync', 'copyFile', 'copyFileSync', 'cp', 'cpSync',
  'truncate', 'truncateSync', 'ftruncate', 'ftruncateSync', 'write', 'writeSync', 'writev', 'writevSync',
  'symlink', 'symlinkSync', 'link', 'linkSync', 'chmod', 'chmodSync', 'fchmod', 'fchmodSync',
  'lchmod', 'lchmodSync', 'chown', 'chownSync', 'fchown', 'fchownSync', 'lchown', 'lchownSync',
  'utimes', 'utimesSync', 'futimes', 'futimesSync', 'lutimes', 'lutimesSync', 'open', 'openSync', 'promises',
]);

/**
 * Named exceptions: `file:api` → the one-line reason it may not go through
 * safe-write. Every entry must still match a use (a stale one fails).
 * Currently none: every write in src/ goes through src/core/safe-write.ts.
 */
const EXCEPTIONS: Record<string, string> = {};

const FS = /^(?:node:)?fs(?:\/promises)?$/;
const IDENT = '[A-Za-z_$][\\w$]*';

/** Every fs mutation `text` reaches, as `api` or `ns.api` — through a named
 *  import (aliases too), a namespace or default import, require / import(),
 *  destructured or member access, and Bun.write. */
function fsMutations(text: string): string[] {
  const hits: string[] = [];
  const names = (list: string): void => {
    for (const part of list.split(',')) {
      const spec = part.trim();
      if (!spec || spec.startsWith('type ')) {continue;}
      const name = spec.split(/\s+as\s+|\s*:\s*/)[0].trim();
      if (MUTATORS.has(name)) {hits.push(name);}
    }
  };
  const members = (ns: string): void => {
    for (const u of text.matchAll(new RegExp(`(?<![\\w$.])${ns.replace(/\$/g, '\\$')}\\s*\\.\\s*(${IDENT})`, 'g'))) {
      if (MUTATORS.has(u[1])) {hits.push(`${ns}.${u[1]}`);}
    }
  };
  for (const m of text.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    if (!m[1] && FS.test(m[3])) {names(m[2]);}
  }
  for (const m of text.matchAll(new RegExp(`import\\s+(?:\\*\\s+as\\s+)?(${IDENT})\\s*(?:,\\s*\\{([^}]*)\\})?\\s*from\\s*['"]([^'"]+)['"]`, 'g'))) {
    if (FS.test(m[3])) {
      members(m[1]);
      if (m[2]) {names(m[2]);}
    }
  }
  for (const m of text.matchAll(new RegExp(`import\\s+(${IDENT})\\s*=\\s*require\\(\\s*['"]([^'"]+)['"]\\s*\\)`, 'g'))) {
    if (FS.test(m[2])) {members(m[1]);}
  }
  for (const m of text.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(?:require|await\s+import)\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (FS.test(m[2])) {names(m[1]);}
  }
  for (const m of text.matchAll(new RegExp(`(?:const|let|var)\\s+(${IDENT})\\s*=\\s*(?:require|await\\s+import)\\(\\s*['"]([^'"]+)['"]\\s*\\)`, 'g'))) {
    if (FS.test(m[2])) {members(m[1]);}
  }
  for (const m of text.matchAll(new RegExp(`(?:require|import)\\(\\s*['"]([^'"]+)['"]\\s*\\)\\s*\\.\\s*(${IDENT})`, 'g'))) {
    if (FS.test(m[1]) && MUTATORS.has(m[2])) {hits.push(m[2]);}
  }
  if (/\bBun\s*\.\s*write\s*\(/.test(text)) {hits.push('Bun.write');}
  return hits;
}

function allSrc(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) {allSrc(p, out);}
    else if (e.endsWith('.ts')) {out.push(p);}
  }
  return out;
}

describe('BRAKE: TRUST SEAL — every fs write in src/ goes through src/core/safe-write.ts', () => {
  /** The scanner sees every way to reach a write (so the seal cannot pass by blindness). */
  function scannerSelfCheck(): void {
    const cases: [string, string[]][] = [
      ["import { writeFileSync as w, readFileSync } from 'node:fs';", ['writeFileSync']],
      ["import * as fs from 'fs';\nfs.renameSync(a, b); fs.readFileSync(a);", ['fs.renameSync']],
      ["import fs, { mkdirSync } from 'fs';\nfs . unlinkSync(p);", ['fs.unlinkSync', 'mkdirSync']],
      ["const { appendFileSync, watch } = require('fs');", ['appendFileSync']],
      ["require('fs').chmodSync(p, 0o755);", ['chmodSync']],
      ["const nfs = require('node:fs');\nnfs.rmSync(p);", ['nfs.rmSync']],
      ["import { readFile, writeFile } from 'fs/promises';", ['writeFile']],
      ["import { promises } from 'fs';", ['promises']],
      ["const { createWriteStream } = await import('fs');", ['createWriteStream']],
      ["await Bun.write('x', 'y');", ['Bun.write']],
      ["import { readFileSync, type Dirent } from 'fs';\nlet e: import('fs').Dirent[];\nimport type { WriteStream } from 'fs';", []],
    ];
    for (const [src, want] of cases) {
      expect(fsMutations(src).sort()).toEqual(want.sort());
    }
  }

  test('no fs write, append, rename, delete, mkdir, link or chmod outside safe-write.ts (named exceptions only)', () => {
    scannerSelfCheck();
    const used = new Set<string>();
    const violations: string[] = [];
    for (const f of allSrc('src')) {
      if (f === SAFE_WRITE) {continue;}
      for (const api of fsMutations(readFileSync(f, 'utf-8'))) {
        const key = `${f.split('\\').join('/')}:${api}`;
        if (EXCEPTIONS[key]) {used.add(key);}
        else {violations.push(key);}
      }
    }
    if (violations.length) {
      throw new Error(`fs write outside src/core/safe-write.ts — route it through safeWriteFile / safeReplaceOwned / makeDirInside / safeUnlink:\n  ${violations.join('\n  ')}`);
    }
    // A named exception must still be needed, and carry a one-line reason.
    for (const [key, reason] of Object.entries(EXCEPTIONS)) {
      expect(used.has(key)).toBe(true);
      expect(reason.trim().length > 0 && !reason.includes('\n')).toBe(true);
    }
  });
});
