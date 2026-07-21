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
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';

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

export interface Milestone {
  type: 'birth' | 'doubled' | 'championship' | 'elite' | 'peak' | 'perfect' | 'current';
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

export class FafDNAManager {
  private readonly projectPath: string;
  private readonly dnaPath: string;
  private dna: FafDNA | null = null;

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

  /** Record growth — a new score on the journey. Returns null if no DNA yet. */
  recordGrowth(newScore: number, changes: string[]): FafDNA | null {
    if (!this.dna && !this.load()) {return null;}
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
      born: dna.birthCertificate.born,
    };
  }

  /** Complete version history, newest last. */
  getLog(): string[] {
    if (!this.dna && !this.load()) {return [];}
    return this.dna!.versions.map((v) => {
      const emoji = v.growth > 50 ? '🚀' : v.growth > 20 ? '📈' : '📊';
      return `${v.version} — ${v.score}% ${emoji} (${v.timestamp.split('T')[0]}) ${v.changes.join(', ')}`;
    });
  }

  load(): FafDNA | null {
    if (this.dna) {return this.dna;}
    if (!existsSync(this.dnaPath)) {return null;}
    try {
      this.dna = JSON.parse(readFileSync(this.dnaPath, 'utf-8')) as FafDNA;
      return this.dna;
    } catch {
      return null;
    }
  }

  private save(): void {
    if (!this.dna) {return;}
    this.dna.lastModified = new Date().toISOString();
    writeFileSync(this.dnaPath, `${JSON.stringify(this.dna, null, 2)  }\n`, 'utf-8');
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
    if (score >= 70 && !has('championship')) {add('championship', 'Championship', '🏆');}
    if (score >= 85 && !has('elite')) {add('elite', 'Elite', '◆');}
    if (score >= 100 && !has('perfect')) {add('perfect', 'Perfect', '🏆');}

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
