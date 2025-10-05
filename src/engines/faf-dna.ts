/**
 * FAF DNA - The Lifecycle of AI Context
 *
 * Revolutionary Context Authentication & Versioning System
 * Every .faf has:
 * - Birth Certificate (Authentication)
 * - Birth DNA (Initial score from CLAUDE.md)
 * - Growth Record (Version history)
 * - Life Events (Log of all changes)
 * - Immortality (Disaster recovery through bi-sync)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { colors } from '../fix-once/colors';

// ==================== TYPE DEFINITIONS ====================

export interface BirthCertificate {
  born: Date;
  birthDNA: number;  // Initial score from CLAUDE.md only
  birthDNASource: 'CLAUDE.md' | 'legacy';
  projectDNA: string;   // Hash of initial state
  authenticated: boolean;
  certificate: string;  // FAF-YYYY-PROJECT-XXXX
  authDate?: Date;
}

export interface VersionEntry {
  version: string;      // v1.0.0, v1.0.1, etc
  timestamp: Date;
  score: number;
  changes: string[];
  approved?: boolean;
  growth?: number;      // Points from birth weight
  growthRate?: number;  // Points per day
}

export interface Milestone {
  type: 'birth' | 'first_save' | 'doubled' | 'championship' | 'elite' | 'peak' | 'perfect' | 'current';
  score: number;
  date: Date;
  version: string;
  label?: string;
  emoji?: string;
}

export interface CurrentState {
  version: string;
  score: number;
  approved: boolean;
  lastApproved?: string;  // Version number of last approval
  lastSync: Date;
}

export interface RecoveryInfo {
  claudeMD: string;      // Path to CLAUDE.md
  lastBackup: Date;
  syncStatus: 'active' | 'pending' | 'failed';
  autoRecover: boolean;
}

export interface GrowthAnalytics {
  totalGrowth: number;        // Total points gained
  daysActive: number;         // Days since birth
  averageDailyGrowth: number; // Points per day
  bestDay: { date: Date; growth: number };
  bestWeek: { start: Date; growth: number };
  milestones: Milestone[];
}

export interface FafDNA {
  // Birth Certificate - Immutable origin
  birthCertificate: BirthCertificate;
  
  // Version History - Complete evolution
  versions: VersionEntry[];
  
  // Current State
  current: CurrentState;
  
  // Immortality - Recovery capability
  recovery: RecoveryInfo;
  
  // Analytics
  growth: GrowthAnalytics;
  
  // Metadata
  lastModified: Date;
  format: 'faf-dna-v1';
}

// ==================== DNA MANAGER ====================

export class FafDNAManager {
  private dnaPath: string;
  private projectPath: string;
  private dna: FafDNA | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.dnaPath = path.join(projectPath, '.faf-dna');
  }

  /**
   * Initialize DNA (Birth)
   */
  async birth(birthDNA: number, fromClaudeMD: boolean = true): Promise<FafDNA> {
    // Generate birth certificate
    const birthCertificate: BirthCertificate = {
      born: new Date(),
      birthDNA,
      birthDNASource: fromClaudeMD ? 'CLAUDE.md' : 'legacy',
      projectDNA: await this.generateProjectDNA(),
      authenticated: false,
      certificate: this.generateCertificate()
    };

    // Create initial version
    const initialVersion: VersionEntry = {
      version: 'v1.0.0',
      timestamp: new Date(),
      score: birthDNA,
      changes: ['Initial context from CLAUDE.md'],
      approved: false,
      growth: 0,
      growthRate: 0
    };

    // Initialize DNA structure
    this.dna = {
      birthCertificate,
      versions: [initialVersion],
      current: {
        version: 'v1.0.0',
        score: birthDNA,
        approved: false,
        lastSync: new Date()
      },
      recovery: {
        claudeMD: path.join(this.projectPath, 'CLAUDE.md'),
        lastBackup: new Date(),
        syncStatus: 'active',
        autoRecover: true
      },
      growth: {
        totalGrowth: 0,
        daysActive: 0,
        averageDailyGrowth: 0,
        bestDay: { date: new Date(), growth: 0 },
        bestWeek: { start: new Date(), growth: 0 },
        milestones: [
          {
            type: 'birth',
            score: birthDNA,
            date: new Date(),
            version: 'v1.0.0',
            label: 'Birth',
            emoji: '🐣'
          }
        ]
      },
      lastModified: new Date(),
      format: 'faf-dna-v1'
    };

    await this.save();
    return this.dna;
  }

  /**
   * Authenticate the DNA (Birth Certificate)
   */
  async authenticate(): Promise<string> {
    if (!this.dna) throw new Error('DNA not initialized');
    
    this.dna.birthCertificate.authenticated = true;
    this.dna.birthCertificate.authDate = new Date();
    
    await this.save();
    return this.dna.birthCertificate.certificate;
  }

  /**
   * Record growth (Auto Evolution)
   */
  async recordGrowth(newScore: number, changes: string[]): Promise<VersionEntry> {
    if (!this.dna) throw new Error('DNA not initialized');

    // Calculate growth metrics
    const growth = newScore - this.dna.birthCertificate.birthDNA;
    const daysSinceBirth = this.getDaysSince(this.dna.birthCertificate.born);
    const growthRate = daysSinceBirth > 0 ? growth / daysSinceBirth : growth;

    // Generate new version number
    const lastVersion = this.dna.versions[this.dna.versions.length - 1];
    const newVersion = this.incrementVersion(lastVersion.version, 'patch');

    // Create version entry
    const versionEntry: VersionEntry = {
      version: newVersion,
      timestamp: new Date(),
      score: newScore,
      changes,
      approved: false,
      growth,
      growthRate
    };

    // Add to versions
    this.dna.versions.push(versionEntry);

    // Update current state
    this.dna.current = {
      version: newVersion,
      score: newScore,
      approved: false,
      lastApproved: this.dna.current.lastApproved,
      lastSync: new Date()
    };

    // Update milestones
    this.updateMilestones(newScore, newVersion);

    // Update analytics
    this.updateAnalytics(newScore);

    await this.save();
    return versionEntry;
  }

  /**
   * Approve current version (User satisfaction)
   */
  async approve(): Promise<void> {
    if (!this.dna) throw new Error('DNA not initialized');

    const currentVersion = this.dna.versions.find(v => v.version === this.dna!.current.version);
    if (currentVersion) {
      currentVersion.approved = true;
      
      // Increment minor version for approval
      const newVersion = this.incrementVersion(this.dna.current.version, 'minor');
      
      // Create approval version
      const approvalEntry: VersionEntry = {
        version: newVersion,
        timestamp: new Date(),
        score: this.dna.current.score,
        changes: ['User approved'],
        approved: true,
        growth: this.dna.current.score - this.dna.birthCertificate.birthDNA,
        growthRate: this.calculateGrowthRate()
      };
      
      this.dna.versions.push(approvalEntry);
      this.dna.current.version = newVersion;
      this.dna.current.approved = true;
      this.dna.current.lastApproved = newVersion;
      
      // Mark as first save if it's the first approval
      if (!this.dna.growth.milestones.find(m => m.type === 'first_save')) {
        this.dna.growth.milestones.push({
          type: 'first_save',
          score: this.dna.current.score,
          date: new Date(),
          version: newVersion,
          label: 'First Save',
          emoji: '💾'
        });
      }
    }

    await this.save();
  }

  /**
   * Get journey display (for UI)
   */
  getJourney(format: 'compact' | 'detailed' = 'compact'): string | Milestone[] {
    if (!this.dna) return format === 'compact' ? '' : [];

    const milestones = this.dna.growth.milestones;

    if (format === 'compact') {
      // Build compact journey: 22% → 85% → 99% ← 92%
      const birth = milestones.find(m => m.type === 'birth');
      const firstSave = milestones.find(m => m.type === 'first_save');
      const peak = milestones.find(m => m.type === 'peak');
      const current = this.dna.current.score;

      let journey = `${birth?.score || 0}%`;
      
      if (firstSave && firstSave.score !== birth?.score) {
        journey += ` → ${firstSave.score}%`;
      }
      
      if (peak) {
        journey += ` → ${peak.score}%`;
        
        // Add back arrow if current is less than peak
        if (current < peak.score) {
          journey += ` ← ${current}%`;
        }
      } else if (current !== (firstSave?.score || birth?.score)) {
        journey += ` → ${current}%`;
      }

      return journey;
    }

    return milestones;
  }

  /**
   * Get Birth DNA display (always show origin)
   */
  getBirthDNADisplay(): { current: number; birthDNA: number; growth: number; birthDate: Date } {
    if (!this.dna) {
      return { current: 0, birthDNA: 0, growth: 0, birthDate: new Date() };
    }

    return {
      current: this.dna.current.score,
      birthDNA: this.dna.birthCertificate.birthDNA,
      growth: this.dna.current.score - this.dna.birthCertificate.birthDNA,
      birthDate: this.dna.birthCertificate.born
    };
  }

  /**
   * Get version log (Complete history)
   */
  getLog(): string[] {
    if (!this.dna) return [];

    return this.dna.versions.map(v => {
      const growth = v.growth || 0;
      const emoji = v.approved ? '✅' : growth > 50 ? '🚀' : growth > 20 ? '📈' : '📊';
      return `${v.version} - ${v.score}% ${emoji} (${this.formatDate(v.timestamp)}) ${v.changes.join(', ')}`;
    });
  }

  /**
   * Load existing DNA
   */
  async load(): Promise<FafDNA | null> {
    try {
      const content = await fs.readFile(this.dnaPath, 'utf-8');
      this.dna = JSON.parse(content);
      
      // Convert date strings back to Date objects
      if (this.dna) {
        this.dna.birthCertificate.born = new Date(this.dna.birthCertificate.born);
        if (this.dna.birthCertificate.authDate) {
          this.dna.birthCertificate.authDate = new Date(this.dna.birthCertificate.authDate);
        }
        
        this.dna.versions = this.dna.versions.map(v => ({
          ...v,
          timestamp: new Date(v.timestamp)
        }));
        
        this.dna.current.lastSync = new Date(this.dna.current.lastSync);
        this.dna.recovery.lastBackup = new Date(this.dna.recovery.lastBackup);
        
        this.dna.growth.bestDay.date = new Date(this.dna.growth.bestDay.date);
        this.dna.growth.bestWeek.start = new Date(this.dna.growth.bestWeek.start);
        
        this.dna.growth.milestones = this.dna.growth.milestones.map(m => ({
          ...m,
          date: new Date(m.date)
        }));
        
        this.dna.lastModified = new Date(this.dna.lastModified);
      }
      
      return this.dna;
    } catch (err) {
      return null;
    }
  }

  /**
   * Save DNA to disk
   */
  private async save(): Promise<void> {
    if (!this.dna) return;

    this.dna.lastModified = new Date();
    await fs.writeFile(
      this.dnaPath,
      JSON.stringify(this.dna, null, 2),
      'utf-8'
    );
  }

  /**
   * Generate unique project DNA hash
   */
  private async generateProjectDNA(): Promise<string> {
    const projectInfo = [
      this.projectPath,
      Date.now().toString(),
      Math.random().toString(36)
    ].join(':');

    return crypto
      .createHash('sha256')
      .update(projectInfo)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate certificate number
   */
  private generateCertificate(): string {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const projectName = path.basename(this.projectPath)
      .replace(/[^A-Z0-9]/gi, '')  // Remove special characters
      .toUpperCase()
      .substring(0, 8)
      .padEnd(4, 'X');  // Ensure minimum length
    return `FAF-${year}-${projectName}-${random}`;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
    const parts = version.replace('v', '').split('.').map(Number);
    
    switch (type) {
      case 'major':
        return `v${parts[0] + 1}.0.0`;
      case 'minor':
        return `v${parts[0]}.${parts[1] + 1}.0`;
      case 'patch':
        return `v${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    }
  }

  /**
   * Update milestones based on score
   */
  private updateMilestones(score: number, version: string): void {
    if (!this.dna) return;

    const milestones = this.dna.growth.milestones;
    const birthDNA = this.dna.birthCertificate.birthDNA;

    // Check for doubled score
    if (score >= birthDNA * 2 && !milestones.find(m => m.type === 'doubled')) {
      milestones.push({
        type: 'doubled',
        score,
        date: new Date(),
        version,
        label: 'Doubled',
        emoji: '2️⃣'
      });
    }

    // Check for championship (70%)
    if (score >= 70 && !milestones.find(m => m.type === 'championship')) {
      milestones.push({
        type: 'championship',
        score,
        date: new Date(),
        version,
        label: 'Championship',
        emoji: '🏆'
      });
    }

    // Check for elite (85%)
    if (score >= 85 && !milestones.find(m => m.type === 'elite')) {
      milestones.push({
        type: 'elite',
        score,
        date: new Date(),
        version,
        label: 'Elite',
        emoji: '⭐'
      });
    }

    // Check for perfect (100%)
    if (score >= 100 && !milestones.find(m => m.type === 'perfect')) {
      milestones.push({
        type: 'perfect',
        score,
        date: new Date(),
        version,
        label: 'Perfect',
        emoji: '💎'
      });
    }

    // Update peak if necessary
    const peakMilestone = milestones.find(m => m.type === 'peak');
    if (!peakMilestone || score > peakMilestone.score) {
      // Remove old peak
      if (peakMilestone) {
        const index = milestones.indexOf(peakMilestone);
        milestones.splice(index, 1);
      }
      
      // Add new peak
      milestones.push({
        type: 'peak',
        score,
        date: new Date(),
        version,
        label: 'Peak',
        emoji: '🏔️'
      });
    }

    // Always update current
    const currentIndex = milestones.findIndex(m => m.type === 'current');
    if (currentIndex >= 0) {
      milestones.splice(currentIndex, 1);
    }
    milestones.push({
      type: 'current',
      score,
      date: new Date(),
      version,
      label: 'Current',
      emoji: '📍'
    });
  }

  /**
   * Update growth analytics
   */
  private updateAnalytics(score: number): void {
    if (!this.dna) return;

    const growth = score - this.dna.birthCertificate.birthDNA;
    const daysSinceBirth = this.getDaysSince(this.dna.birthCertificate.born);

    this.dna.growth.totalGrowth = growth;
    this.dna.growth.daysActive = daysSinceBirth;
    this.dna.growth.averageDailyGrowth = daysSinceBirth > 0 ? growth / daysSinceBirth : growth;

    // Check for best day
    const todayGrowth = score - (this.dna.versions[this.dna.versions.length - 2]?.score || this.dna.birthCertificate.birthDNA);
    if (todayGrowth > this.dna.growth.bestDay.growth) {
      this.dna.growth.bestDay = {
        date: new Date(),
        growth: todayGrowth
      };
    }

    // TODO: Calculate best week
  }

  /**
   * Calculate days since date
   */
  private getDaysSince(date: Date): number {
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(): number {
    if (!this.dna) return 0;

    const growth = this.dna.current.score - this.dna.birthCertificate.birthDNA;
    const days = this.getDaysSince(this.dna.birthCertificate.born);
    
    return days > 0 ? growth / days : growth;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Display helper for Birth DNA in all score outputs
 */
export function displayScoreWithBirthDNA(
  current: number,
  birthDNA: number,
  birthDate: Date,
  options: { showGrowth?: boolean; showJourney?: boolean } = {}
): void {
  // Import championship medal system
  const { getScoreMedal, getTierInfo } = require('../utils/championship-core');

  // Get medal for current score
  const { medal, status} = getScoreMedal(current);
  const tierInfo = getTierInfo(current);
  const growth = current - birthDNA;

  // OPTIMIZED FIRST TWO LINES - Match MCP's championship scorecard format
  // Line 1: Score with medal (STRONG WHITE BOLD - default)
  console.log(colors.bold(`${medal} Score: ${current}/100`));

  // Line 2: Progress bar (STRONG WHITE - default)
  const barWidth = 24;
  const filled = Math.floor((current / 100) * barWidth);
  const empty = barWidth - filled;
  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  console.log(colors.bold(`${progressBar} ${current}%`));

  // Line 3: Status (STRONG WHITE - default)
  console.log(colors.bold(`Status: ${status}`));

  // Line 4: Next milestone (STRONG WHITE - default)
  if (tierInfo.next && tierInfo.nextTarget && tierInfo.nextMedal) {
    const pointsToGo = tierInfo.nextTarget - current;
    console.log('');
    console.log(colors.bold(`Next milestone: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${pointsToGo} points to go!)`));
  }

  // Detailed breakdown (collapsed in Claude Code, visible in terminal)
  console.log('');
  console.log(colors.bold('🏎️  FAF Championship Status'));
  console.log('━'.repeat(40));
  console.log(`Birth DNA: ${birthDNA}% (born ${birthDate.toISOString().split('T')[0]})`);

  const timeMs = Date.now() - new Date(birthDate).getTime();
  const daysOld = Math.floor(timeMs / (1000 * 60 * 60 * 24));
  const hoursOld = Math.floor(timeMs / (1000 * 60 * 60));

  let timeDisplay = '';
  if (daysOld > 0) {
    timeDisplay = `${daysOld} day${daysOld === 1 ? '' : 's'}`;
  } else if (hoursOld > 0) {
    timeDisplay = `${hoursOld} hour${hoursOld === 1 ? '' : 's'}`;
  } else {
    const minutesOld = Math.floor(timeMs / (1000 * 60));
    timeDisplay = `${minutesOld} minute${minutesOld === 1 ? '' : 's'}`;
  }

  console.log(`Growth: +${growth}% over ${timeDisplay}`);

  if (tierInfo.next && tierInfo.nextTarget && tierInfo.nextMedal) {
    const pointsToGo = tierInfo.nextTarget - current;
    console.log(colors.bold(`Next Milestone: ${tierInfo.nextTarget}% ${tierInfo.nextMedal} ${tierInfo.next} (${pointsToGo}% to go!)`));
  }
  console.log('');
}

/**
 * Get emoji for score
 */
function getScoreEmoji(score: number): string {
  if (score >= 100) return '💎';
  if (score >= 90) return '🏆';
  if (score >= 85) return '⭐';
  if (score >= 70) return '🎯';
  if (score >= 50) return '📈';
  return '🌱';
}