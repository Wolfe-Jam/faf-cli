/**
 * BRAKE: faf never writes over an edit made after it read the file —
 * adversarial #7 (t-toctou T1/T2/T3).
 *
 * Every writer read the file, built the new text, and renamed it over
 * whatever was on disk by then. An edit made in between was lost: the user's
 * change to soul.fafm while a Soul was loaded (T1), to project.faf while
 * `faf auto` ran detection (T2), another faf process's growth in .faf-dna (T3)
 * — and, inside one call, anything written between faf's read and its rename.
 *
 * safeWriteFile now takes `expect` — the bytes the caller read. Just before
 * the rename the file is read again; when it changed, the temp file is removed
 * and the write is refused: "<file> changed on disk while faf was writing —
 * not written; original kept". `expect: null` means there was no file: one
 * that appeared is not written over. injectFafBlock, updateFafFile, writeFaf,
 * FafmSoul.save (the loaded text), FafDNAManager and writeClaudeMemory pass it.
 */
import { describe, test, expect, spyOn } from 'bun:test';
import * as fs from 'fs';
import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { SafePathError, safeWriteFile } from '../../src/core/safe-write.js';
import { injectFafBlock } from '../../src/interop/inject.js';
import { writeClaudeMemory } from '../../src/interop/claude-memory.js';
import { readFaf, updateFafFile, writeFaf } from '../../src/interop/faf.js';
import { updateExistingFaf } from '../../src/detect/assemble.js';
import { FafDNAManager } from '../../src/core/faf-dna.js';
import { Soul } from '../../src/fafm/soul.js';
import { setNestedValue } from '../../src/core/dot-path.js';

const DATA: any = { project: { name: 'demo', goal: 'Demo goal', main_language: 'TypeScript' }, stack: { frontend: 'React' } };
const NOW = '2026-01-01T00:00:00.000Z';
/** faf's own .faf-dna text (t-toctou T3's lineage, as faf writes it). */
const DNA = `${JSON.stringify(
  {
    birthCertificate: { born: NOW, birthDNA: 20, birthDNASource: 'init', projectDNA: 'a', certificate: 'c' },
    versions: [{ version: 'v1.0.0', timestamp: NOW, score: 20, changes: ['Birth'], growth: 0 }],
    current: { version: 'v1.0.0', score: 20, lastSync: NOW },
    growth: { totalGrowth: 0, daysActive: 0, milestones: [] },
    lastModified: NOW,
    format: 'faf-dna-v1',
  },
  null,
  2,
)}\n`;

const tmp = (): string => realpathSync(mkdtempSync(join(tmpdir(), 'faf-cas-')));
const temps = (dir: string): string[] => readdirSync(dir).filter(n => n.endsWith('.faf-tmp'));

function changed(fn: () => unknown): SafePathError {
  try {
    fn();
  } catch (e) {
    if (e instanceof SafePathError && e.reason === 'changed') {return e;}
    throw new Error(`expected a 'changed' refusal, got: ${e instanceof Error ? e.message : String(e)}`);
  }
  throw new Error("expected a 'changed' refusal, but the write went through");
}

/** Run `fn`; while it flushes its temp file (after it read `file`, before the
 *  rename), another writer puts `edit` in `file` — or removes it (null). */
function editDuringWrite(file: string, edit: string | null, fn: () => unknown): unknown {
  const realFsync = fs.fsyncSync;
  const spy = spyOn(fs, 'fsyncSync').mockImplementationOnce((fd: number) => {
    if (edit === null) {fs.unlinkSync(file);} else {writeFileSync(file, edit);}
    realFsync(fd);
  });
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}

describe('BRAKE: safeWriteFile({ expect }) writes only over the bytes the caller read', () => {
  test('bytes that still match are written; bytes that no longer match are refused in one line, the file on disk kept', () => {
    const d = tmp();
    const f = join(d, 'notes.md');
    writeFileSync(f, 'one\n');
    safeWriteFile(f, 'two\n', { expect: 'one\n' });
    safeWriteFile(f, 'three\n', { expect: Buffer.from('two\n') });
    expect(readFileSync(f, 'utf-8')).toBe('three\n');

    writeFileSync(f, 'USER EDIT\n');
    const e = changed(() => safeWriteFile(f, 'faf\n', { expect: 'what faf read\n' }));
    expect(e.message).toBe(`${f} changed on disk while faf was writing — not written; original kept`);
    changed(() => safeWriteFile(f, 'faf\n', { expect: Buffer.from('what faf read\n') }));
    expect(readFileSync(f, 'utf-8')).toBe('USER EDIT\n');
    expect(temps(d)).toEqual([]);
  });

  test('expect null: a missing file stays missing only if nothing appeared; a deleted file is not re-created', () => {
    const d = tmp();
    const f = join(d, 'new.md');
    safeWriteFile(f, 'created\n', { expect: null });
    expect(readFileSync(f, 'utf-8')).toBe('created\n');
    changed(() => safeWriteFile(f, 'faf\n', { expect: null })); // something is there now
    expect(readFileSync(f, 'utf-8')).toBe('created\n');
    const g = join(d, 'gone.md');
    changed(() => safeWriteFile(g, 'faf\n', { expect: 'was here\n' }));
    expect(existsSync(g)).toBe(false);
    expect(temps(d)).toEqual([]);
  });
});

describe('BRAKE: an edit made between the read and the write is kept (t-toctou)', () => {
  test('T1: a Soul loaded, the user edits soul.fafm, then etch + save — refused, the edit kept', () => {
    const d = tmp();
    const p = join(d, 'soul.fafm');
    writeFileSync(p, 'namepoint: "@me"\nmemory:\n  facts:\n    - FACT-A\n');
    const s = Soul.load(p);
    appendFileSync(p, '    - USER-ADDED-WHILE-LOADED\n');
    writeFileSync(p, readFileSync(p, 'utf-8').replace('namepoint: "@me"', 'namepoint: "@me" # USER-COMMENT-WHILE-LOADED'));
    const edited = readFileSync(p, 'utf-8');
    // A save with nothing new writes nothing: the edit stays (it was written back over before).
    s.save(p);
    expect(readFileSync(p, 'utf-8')).toBe(edited);
    s.etch('ETCHED-BY-FAF');
    changed(() => s.save(p));
    expect(readFileSync(p, 'utf-8')).toBe(edited);
    // With no edit in between, a loaded soul saves — and saves again.
    const q = join(d, 'other.fafm');
    writeFileSync(q, 'namepoint: "@me"\nmemory:\n  facts:\n    - FACT-A\n');
    const t = Soul.load(q);
    t.etch('ONE');
    t.save(q);
    t.etch('TWO');
    t.save(q);
    expect(Soul.load(q).facts.map(f => f.text)).toEqual(['FACT-A', 'ONE', 'TWO']);
  });

  test('T2: faf auto — the user edits project.faf between readFaf and writeFaf — refused, the edit kept', () => {
    const d = tmp();
    const p = join(d, 'project.faf');
    writeFileSync(join(d, 'package.json'), '{"name":"demo","dependencies":{"react":"18"}}');
    writeFileSync(p, 'project:\n  name: demo\n  goal: Old goal\n');
    const filled = updateExistingFaf(d, readFaf(p));
    const edit = 'project:\n  name: demo\n  goal: USER-EDITED-GOAL # USER-NOTE-DURING-AUTO\n';
    writeFileSync(p, edit);
    changed(() => writeFaf(p, filled));
    expect(readFileSync(p, 'utf-8')).toBe(edit);
    expect(temps(d)).toEqual([]);

    // faf edit's shape: readFaf, change a value, writeFaf — the same check.
    const data = readFaf(p);
    setNestedValue(data as Record<string, unknown>, 'project.goal', 'NEW GOAL');
    writeFileSync(p, `${edit}# ANOTHER-USER-LINE\n`);
    changed(() => writeFaf(p, data));
    expect(readFileSync(p, 'utf-8')).toBe(`${edit}# ANOTHER-USER-LINE\n`);

    // No edit in between: written, and the same data object can be written again.
    const fresh = readFaf(p);
    setNestedValue(fresh as Record<string, unknown>, 'project.goal', 'NEW GOAL');
    expect(writeFaf(p, fresh)).toBe(true);
    setNestedValue(fresh as Record<string, unknown>, 'project.goal', 'NEWER GOAL');
    expect(writeFaf(p, fresh)).toBe(true);
    expect(readFaf(p).project?.goal).toBe('NEWER GOAL');
  });

  test('T3: DNA loaded, another process records growth, then recordGrowth — refused, the other growth kept', () => {
    const d = tmp();
    writeFileSync(join(d, '.faf-dna'), DNA);
    const a = new FafDNAManager(d);
    a.load();
    const other = new FafDNAManager(d);
    expect(other.recordGrowth(40, ['OTHER-PROCESS-GROWTH'])).not.toBeNull();
    const afterOther = readFileSync(join(d, '.faf-dna'), 'utf-8');
    changed(() => a.recordGrowth(60, ['this process']));
    expect(readFileSync(join(d, '.faf-dna'), 'utf-8')).toBe(afterOther);
    expect(temps(d)).toEqual([]);
  });
});

describe('BRAKE: inside one call, a write that lands between faf\'s read and its rename is kept', () => {
  test('injectFafBlock (CLAUDE.md): refused, the other write kept', () => {
    const d = tmp();
    const f = join(d, 'CLAUDE.md');
    writeFileSync(f, '# Mine\nHAND\n');
    changed(() => editDuringWrite(f, '# Mine\nHAND\nLINE-ADDED-MEANWHILE\n', () => injectFafBlock(f, 'BODY')));
    expect(readFileSync(f, 'utf-8')).toBe('# Mine\nHAND\nLINE-ADDED-MEANWHILE\n');
    expect(temps(d)).toEqual([]);
    // No file when faf looked, one by the rename: not written over.
    const g = join(d, 'AGENTS.md');
    changed(() => editDuringWrite(g, 'AGENTS-WRITTEN-MEANWHILE\n', () => injectFafBlock(g, 'BODY')));
    expect(readFileSync(g, 'utf-8')).toBe('AGENTS-WRITTEN-MEANWHILE\n');
  });

  test('writeClaudeMemory: refused, the note Claude wrote meanwhile kept', () => {
    const d = tmp();
    const mem = join(tmp(), 'mem');
    fs.mkdirSync(mem);
    const f = join(mem, 'MEMORY.md');
    writeFileSync(f, '- a note\n');
    changed(() => editDuringWrite(f, '- a note\n- CLAUDE-NOTE-MEANWHILE\n', () => writeClaudeMemory(d, DATA, { memoryDir: mem })));
    expect(readFileSync(f, 'utf-8')).toBe('- a note\n- CLAUDE-NOTE-MEANWHILE\n');
  });

  test('updateFafFile and writeFaf (a new project.faf): refused, the other write kept', () => {
    const d = tmp();
    const p = join(d, 'project.faf');
    writeFileSync(p, 'project:\n  name: demo\n  goal: Old goal\n');
    const edit = 'project:\n  name: demo\n  goal: Old goal\n# EDITED-MEANWHILE\n';
    changed(() => editDuringWrite(p, edit, () => updateFafFile(p, doc => doc.setIn(['project', 'goal'], 'NEW'))));
    expect(readFileSync(p, 'utf-8')).toBe(edit);

    const n = join(tmp(), 'project.faf');
    changed(() => editDuringWrite(n, 'project:\n  name: CREATED-MEANWHILE\n', () => writeFaf(n, DATA)));
    expect(readFileSync(n, 'utf-8')).toBe('project:\n  name: CREATED-MEANWHILE\n');
  });

  test('FafmSoul.save of a new soul and FafDNAManager.birth: a file that appeared meanwhile is kept', () => {
    const d = tmp();
    const p = join(d, 'soul.fafm');
    changed(() => editDuringWrite(p, 'namepoint: "@hand"\n', () => new Soul('@demo').save(p)));
    expect(readFileSync(p, 'utf-8')).toBe('namepoint: "@hand"\n');
    const dna = join(d, '.faf-dna');
    changed(() => editDuringWrite(dna, DNA, () => new FafDNAManager(d).birth(42)));
    expect(readFileSync(dna, 'utf-8')).toBe(DNA);
    expect(temps(dirname(dna))).toEqual([]);
  });
});
