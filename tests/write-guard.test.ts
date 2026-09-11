/**
 * TRUST SEAL — "enhance, never replace" (source write-guard).
 *
 * faf must NEVER raw-overwrite a context / IDE-rule file. Every such write goes
 * through injectFafBlock (non-destructive). This guard fails the build if any
 * `fs.writeFile` / `writeFileSync` targets a context file directly — so the
 * file-wipe bug physically cannot be reintroduced. The code is not allowed to.
 */
import { describe, test } from 'bun:test';
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
