/**
 * FAF DNA — the lifecycle of AI context. The "first heartbeat".
 *
 * Every project.faf gets a `.faf-dna` lineage record (separate file, NOT
 * embedded in the .faf — so it's compatible with the clean dialect):
 *   - Birth Certificate: the honest first score (even 0%) — the "before" picture
 *   - Growth Record: version history as the score improves
 *   - Journey: the one-line story, e.g. "22% → 85% → 99% ← 92%"
 *
 * Birth DNA = the raw slot-based score at init. The growth from Birth DNA to
 * the current score is the demonstrated value of FAF.
 *
 * Restored 2026-05-21 — silently dropped in the v6.0 clean-architecture rewrite
 * (it was never knowingly removed). Ported from v5 (sync, v6-native, load-compatible).
 *
 * Other shapes. `.faf-dna` is committed lineage, and other tools have written
 * it in their own shape (claude-faf-mcp's faf_dna wrote `milestones` at the top
 * level and no `versions` or `growth`). Reading never throws on such a file: it
 * reads what it can, and missing parts are derived from what is there. Writing
 * is different: recordGrowth rewrites the file only when faf can prove it wrote
 * every byte — the file is in faf's shape AND its text is exactly faf's own
 * serialisation of what it holds (`JSON.stringify(data, null, 2)` and a final
 * newline), and nothing faf would replace carries a note of the user's. Hand
 * formatting, CRLF, reordered keys, a repeated key or a number JSON cannot hold
 * exactly (a 20-digit id) would all be lost in a rewrite, so such a file — like
 * one in another shape — is read and left exactly as it is, and
 * `readOnlyReason()` says why in one line. `faf init --force` starts a fresh
 * lineage when you ask it to.
 */

import { existsSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { readBytesIfPresent, readUtf8, resolveInside, safeWriteFile } from './safe-write.js';

export interface BirthCertificate {
  born: string; // ISO timestamp
  birthDNA: number; // honest first score (raw slot-based, even 0)
  birthDNASource: 'init' | 'legacy';
  projectDNA: string; // 16-char hash of initial state
  certificate: string; // FAF-YYYY-PROJECT-XXXX
}

export interface VersionEntry {
  version: string; // v1.0.0, v1.0.1, …
  timestamp: string; // ISO
  score: number;
  changes: string[];
  growth: number; // points above Birth DNA
}

/** Journey markers only — not score tiers.
 *  Tiers live solely in tiers.ts (Trophy 100 · Gold 99 · Silver 95 · Bronze 85 · …).
 *  There is no championship / elite / perfect milestone. */
export interface Milestone {
  type: 'birth' | 'doubled' | 'peak' | 'current';
  score: number;
  date: string; // ISO
  version: string;
  label: string;
  emoji: string;
}

export interface FafDNA {
  birthCertificate: BirthCertificate;
  versions: VersionEntry[];
  current: { version: string; score: number; lastSync: string };
  growth: { totalGrowth: number; daysActive: number; milestones: Milestone[] };
  lastModified: string;
  format: 'faf-dna-v1';
}

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const VERSION_RE = /^v?\d+\.\d+\.\d+$/;
const MILESTONE_TYPES = new Set(['birth', 'doubled', 'peak', 'current']);

/** A version entry faf wrote: a semver-ish version and a numeric score. */
function isVersionEntry(v: unknown): v is VersionEntry {
  return isObject(v) && isStr(v.version) && VERSION_RE.test(v.version) && isNum(v.score);
}

/**
 * True when `raw` is a `.faf-dna` in the shape faf writes: a birth certificate
 * with a birth date and a numeric Birth DNA, a non-empty `versions` list whose
 * entries carry a version and a score, a `current` score and version, and a
 * `growth.milestones` list of entries. Only such a file is ever added to
 * (unknown extra keys in it are kept).
 */
const birthOk = (bc: unknown): boolean => isObject(bc) && isNum(bc.birthDNA) && isStr(bc.born);
const versionsOk = (v: unknown): boolean => Array.isArray(v) && v.length > 0 && v.every(isVersionEntry);
const currentOk = (c: unknown): boolean => isObject(c) && isNum(c.score) && isStr(c.version);
const growthOk = (g: unknown): boolean => isObject(g) && Array.isArray(g.milestones) && g.milestones.every(isObject);

function hasFafShape(raw: unknown): raw is FafDNA {
  return isObject(raw) && birthOk(raw.birthCertificate) && versionsOk(raw.versions) && currentOk(raw.current) && growthOk(raw.growth);
}

/** faf's own serialisation of a `.faf-dna` — the exact text save() writes. */
const serialise = (dna: unknown): string => `${JSON.stringify(dna, null, 2)}\n`;

/** What faf writes in `current` and in a milestone. recordGrowth replaces
 *  `current` and the peak / current milestones whole, so a key of the user's
 *  in one of them would be lost. */
const CURRENT_KEYS = new Set(['version', 'score', 'lastSync']);
const MILESTONE_KEYS = new Set(['type', 'score', 'date', 'version', 'label', 'emoji']);
const onlyKeys = (o: object, keys: Set<string>): boolean => Object.keys(o).every((k) => keys.has(k));

/** True when every object recordGrowth replaces holds only what faf writes there. */
function growthLosesNothing(dna: FafDNA): boolean {
  return onlyKeys(dna.current, CURRENT_KEYS) &&
    dna.growth.milestones.every((m) => (m.type !== 'peak' && m.type !== 'current') || onlyKeys(m, MILESTONE_KEYS));
}

/** Why faf leaves a `.faf-dna` as it is, in one line. */
const NOT_FAF_SHAPE = ".faf-dna is not in faf's shape: faf reads it and leaves it as it is.";
const NOT_FAF_TEXT =
  '.faf-dna is not exactly as faf wrote it (hand formatting, key order, a repeated key or a number JSON cannot hold exactly): faf reads it and leaves it as it is.';
const USER_NOTE =
  '.faf-dna has a key of yours in an entry faf would replace (current, or the peak or current milestone): faf reads it and leaves it as it is.';
const NO_BIRTH = '.faf-dna has no birth certificate faf can read: faf leaves it as it is.';

/** Milestones as the journey reads them: well-formed entries only. */
function readMilestones(v: unknown): Milestone[] {
  if (!Array.isArray(v)) {return [];}
  return v.filter((m): m is Milestone => isObject(m) && isStr(m.type) && MILESTONE_TYPES.has(m.type) && isNum(m.score));
}

/**
 * A readable view of a `.faf-dna` in any shape, or null when there is no usable
 * birth certificate (no numeric Birth DNA). Missing parts are derived from what
 * is there — `growth.milestones` falls back to a top-level `milestones`, the
 * current score to the last version or the Birth DNA — so the journey reads
 * without throwing. The view is for reading; it is never written back.
 */
const str = (v: unknown, fallback = ''): string => (isStr(v) ? v : fallback);

/** Well-formed version entries, each with every field the log reads. */
function readVersions(v: unknown, birthDNA: number): VersionEntry[] {
  if (!Array.isArray(v)) {return [];}
  return v.filter(isVersionEntry).map((e) => ({
    version: e.version,
    timestamp: str(e.timestamp),
    score: e.score,
    changes: Array.isArray(e.changes) ? e.changes.filter(isStr) : [],
    growth: isNum(e.growth) ? e.growth : e.score - birthDNA,
  }));
}

/** The current score and version: as written, else the last version, else birth. */
function readCurrent(cur: Json, last: VersionEntry | undefined, birthDNA: number, born: string): FafDNA['current'] {
  return {
    version: str(cur.version, last?.version ?? 'v1.0.0'),
    score: isNum(cur.score) ? cur.score : (last?.score ?? birthDNA),
    lastSync: str(cur.lastSync, born),
  };
}

function readableView(raw: unknown): FafDNA | null {
  if (!isObject(raw) || !isObject(raw.birthCertificate) || !isNum(raw.birthCertificate.birthDNA)) {return null;}
  const bc = raw.birthCertificate;
  const birthDNA = bc.birthDNA as number;
  const born = str(bc.born);
  const versions = readVersions(raw.versions, birthDNA);
  const current = readCurrent(isObject(raw.current) ? raw.current : {}, versions[versions.length - 1], birthDNA, born);
  const growth = isObject(raw.growth) ? raw.growth : {};
  return {
    birthCertificate: {
      born,
      birthDNA,
      birthDNASource: bc.birthDNASource === 'legacy' ? 'legacy' : 'init',
      projectDNA: str(bc.projectDNA),
      certificate: str(bc.certificate),
    },
    versions,
    current,
    growth: {
      totalGrowth: current.score - birthDNA,
      daysActive: isNum(growth.daysActive) ? growth.daysActive : 0,
      milestones: readMilestones(Array.isArray(growth.milestones) ? growth.milestones : raw.milestones),
    },
    lastModified: str(raw.lastModified, born),
    format: 'faf-dna-v1',
  };
}

/**
 * The `.faf-dna` lineage of one project: birth, growth and the journey line.
 * This is the API `faf init` (birth), `faf auto` / `faf refresh` (recordGrowth)
 * and `faf dna` (getJourney, getBirthDNADisplay, getLog) use.
 *
 *   - `birth(score)` starts a new lineage and writes it, replacing any
 *     `.faf-dna` there (check `exists()` first unless a fresh start is meant —
 *     `faf init` births only when there is none, or with `--force`).
 *   - `recordGrowth(score, changes)` adds a version when the score changed.
 *     It adds only to a file faf can prove it wrote (see the file header);
 *     for any other file it writes nothing and returns null, and
 *     `readOnlyReason()` says why.
 *   - Reads never throw: a missing, unreadable, non-UTF-8 or non-JSON file,
 *     or one with no usable birth certificate, reads as null / '' / [].
 *
 * Every write is atomic and stays inside the project: a `.faf-dna` link that
 * leads out of the project, dangles or leads to a file with another name is
 * refused (and reads as absent). A write is refused, too, when the file
 * changed on disk after this manager read it (another `faf` process recorded
 * growth meanwhile, say): SafePathError `changed`, nothing written.
 */
export class FafDNAManager {
  private readonly projectPath: string;
  private readonly dnaPath: string;
  private dna: FafDNA | null = null;
  /** True when the loaded file is one faf wrote (so it may be added to). */
  private own = false;
  /** The text read from `.faf-dna` (or last written), for the write's check. */
  private text: string | undefined;
  /** Why the file is read only, when it is; null when faf may add to it. */
  private reason: string | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.dnaPath = join(projectPath, '.faf-dna');
  }

  exists(): boolean {
    return existsSync(this.dnaPath);
  }

  /** Birth — the first heartbeat. Writes the birth certificate with the honest first score. */
  birth(birthDNA: number): FafDNA {
    const now = new Date().toISOString();
    this.own = true;
    this.dna = {
      birthCertificate: {
        born: now,
        birthDNA,
        birthDNASource: 'init',
        projectDNA: this.generateProjectDNA(),
        certificate: this.generateCertificate(),
      },
      versions: [{ version: 'v1.0.0', timestamp: now, score: birthDNA, changes: ['Birth — initial context'], growth: 0 }],
      current: { version: 'v1.0.0', score: birthDNA, lastSync: now },
      growth: {
        totalGrowth: 0,
        daysActive: 0,
        milestones: [{ type: 'birth', score: birthDNA, date: now, version: 'v1.0.0', label: 'Birth', emoji: '🐣' }],
      },
      lastModified: now,
      format: 'faf-dna-v1',
    };
    this.save();
    return this.dna;
  }

  /** True when `.faf-dna` exists and is one faf wrote — in faf's shape, and
   *  exactly faf's own text — so recordGrowth may add to it. Any other file is
   *  read, not written. */
  isFafShape(): boolean {
    return this.load() !== null && this.own;
  }

  /** Why faf leaves this `.faf-dna` as it is, in one plain line — or null when
   *  there is none, or recordGrowth may add to it. */
  readOnlyReason(): string | null {
    this.load();
    return this.own ? null : this.reason;
  }

  /** Record growth — a new score on the journey. Returns null when there is no
   *  DNA yet, or when the file is in another tool's shape (nothing is written). */
  recordGrowth(newScore: number, changes: string[]): FafDNA | null {
    if (!this.dna && !this.load()) {return null;}
    if (!this.own) {return null;}
    const dna = this.dna!;
    if (newScore === dna.current.score) {return dna;} // no change, no new version

    const now = new Date().toISOString();
    const birthDNA = dna.birthCertificate.birthDNA;
    const growth = newScore - birthDNA;
    const newVersion = this.incrementVersion(dna.versions[dna.versions.length - 1].version);

    dna.versions.push({ version: newVersion, timestamp: now, score: newScore, changes, growth });
    dna.current = { version: newVersion, score: newScore, lastSync: now };
    dna.growth.totalGrowth = growth;
    dna.growth.daysActive = this.daysSince(dna.birthCertificate.born);
    this.updateMilestones(newScore, newVersion, now);
    this.save();
    return dna;
  }

  /** The one-line journey: e.g. "22% → 85% → 99% ← 92%". */
  getJourney(): string {
    if (!this.dna && !this.load()) {return '';}
    const dna = this.dna!;
    const birth = dna.birthCertificate.birthDNA;
    const peak = dna.growth.milestones.find((m) => m.type === 'peak');
    const current = dna.current.score;

    let journey = `${birth}%`;
    if (peak && peak.score !== birth) {
      journey += ` → ${peak.score}%`;
      if (current < peak.score) {journey += ` ← ${current}%`;}
    } else if (current !== birth) {
      journey += ` → ${current}%`;
    }
    return journey;
  }

  getBirthDNADisplay(): { current: number; birthDNA: number; growth: number; born: string } | null {
    if (!this.dna && !this.load()) {return null;}
    const dna = this.dna!;
    return {
      current: dna.current.score,
      birthDNA: dna.birthCertificate.birthDNA,
      growth: dna.current.score - dna.birthCertificate.birthDNA,
      born: isStr(dna.birthCertificate.born) ? dna.birthCertificate.born : '',
    };
  }

  /** Complete version history, newest last. */
  getLog(): string[] {
    if (!this.dna && !this.load()) {return [];}
    return this.dna!.versions.map((v) => {
      const emoji = v.growth > 50 ? '🚀' : v.growth > 20 ? '📈' : '📊';
      const day = isStr(v.timestamp) ? v.timestamp.split('T')[0] : '';
      const changes = Array.isArray(v.changes) ? v.changes.filter(isStr).join(', ') : '';
      return `${v.version} — ${v.score}% ${emoji} (${day}) ${changes}`;
    });
  }

  /** Load `.faf-dna`. Never throws: missing, unreadable, not UTF-8, not JSON, a
   *  refused link, or no usable birth certificate → null. A file faf did not
   *  write (another shape, or not exactly faf's text) loads as a readable view
   *  (see the file header). */
  load(): FafDNA | null {
    if (this.dna) {return this.dna;}
    if (!existsSync(this.dnaPath)) {return null;}
    const read = this.read();
    if (read === null) {return null;}
    const { text, raw } = read;
    if (hasFafShape(raw) && serialise(raw) === text && growthLosesNothing(raw)) {
      this.own = true;
      this.reason = null;
      this.dna = raw;
    } else {
      this.own = false;
      this.dna = readableView(raw);
      this.reason = !this.dna ? NO_BIRTH : !hasFafShape(raw) ? NOT_FAF_SHAPE : serialise(raw) !== text ? NOT_FAF_TEXT : USER_NOTE;
    }
    this.text = text;
    return this.dna;
  }

  /** The file's text (strict UTF-8) and its JSON, or null with the reason noted. */
  private read(): { text: string; raw: unknown } | null {
    let text: string;
    try {
      text = readUtf8(resolveInside(this.projectPath, '.faf-dna'));
    } catch (e) {
      this.reason = e instanceof Error ? e.message : String(e);
      return null;
    }
    try {
      return { text, raw: JSON.parse(text) as unknown };
    } catch {
      this.reason = '.faf-dna is not JSON: faf leaves it as it is.';
      return null;
    }
  }

  private save(): void {
    if (!this.dna) {return;}
    this.dna.lastModified = new Date().toISOString();
    const text = serialise(this.dna);
    // The file must still be what this manager read (or, before any read, what
    // is there now): another process's growth is never written over.
    const expect = this.text ?? readBytesIfPresent(resolveInside(this.projectPath, '.faf-dna'));
    // Atomic, and never through a link that leaves the project or dangles.
    safeWriteFile(this.dnaPath, text, { root: this.projectPath, expect });
    this.text = text;
  }

  private generateProjectDNA(): string {
    return createHash('sha256')
      .update([this.projectPath, Date.now().toString(), Math.random().toString(36)].join(':'))
      .digest('hex')
      .substring(0, 16);
  }

  private generateCertificate(): string {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const proj = basename(this.projectPath).replace(/[^A-Z0-9]/gi, '').toUpperCase().substring(0, 8).padEnd(4, 'X');
    return `FAF-${year}-${proj}-${rand}`;
  }

  private incrementVersion(version: string): string {
    const [maj, min, patch] = version.replace('v', '').split('.').map(Number);
    return `v${maj}.${min}.${patch + 1}`;
  }

  private daysSince(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  }

  private updateMilestones(score: number, version: string, now: string): void {
    if (!this.dna) {return;}
    const ms = this.dna.growth.milestones;
    const has = (t: Milestone['type']) => ms.some((m) => m.type === t);
    const add = (type: Milestone['type'], label: string, emoji: string) =>
      ms.push({ type, score, date: now, version, label, emoji });

    if (score >= this.dna.birthCertificate.birthDNA * 2 && score > 0 && !has('doubled')) {add('doubled', 'Doubled', '2️⃣');}

    const peak = ms.find((m) => m.type === 'peak');
    if (!peak || score > peak.score) {
      if (peak) {ms.splice(ms.indexOf(peak), 1);}
      add('peak', 'Peak', '🏔️');
    }
    const cur = ms.findIndex((m) => m.type === 'current');
    if (cur >= 0) {ms.splice(cur, 1);}
    add('current', 'Current', '📍');
  }
}
