/**
 * 🔒 License Manager for FAF Engine
 * Controls access to premium features
 */

import { createHash } from 'crypto';

export type LicenseLevel = 'free' | 'developer' | 'enterprise' | 'championship';

interface LicenseInfo {
  level: LicenseLevel;
  scoreLimit: number;
  features: string[];
  expiresAt?: Date;
}

export class LicenseManager {
  private static readonly LICENSE_KEYS = new Map<string, LicenseInfo>();

  // Initialize with some keys (in production, fetch from server)
  static {
    // Hash real keys in production
    this.LICENSE_KEYS.set(
      this.hashKey('CHAMPIONSHIP-2025-WOLFEJAM'),
      {
        level: 'championship',
        scoreLimit: 100,
        features: ['all']
      }
    );
  }

  private static hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  static validateLicense(key?: string): LicenseInfo {
    // No key = free tier
    if (!key) {
      return {
        level: 'free',
        scoreLimit: 70,
        features: ['basic_scoring', 'basic_context']
      };
    }

    // Check environment variable
    if (process.env.FAF_LICENSE_KEY) {
      key = process.env.FAF_LICENSE_KEY;
    }

    // Special developer keys
    if (key.startsWith('dev_')) {
      return {
        level: 'developer',
        scoreLimit: 85,
        features: ['advanced_scoring', 'chrome_extension', 'cache_warming']
      };
    }

    // Check against known keys
    const hashedKey = this.hashKey(key);
    const licenseInfo = this.LICENSE_KEYS.get(hashedKey);

    if (licenseInfo) {
      // Check expiration
      if (licenseInfo.expiresAt && licenseInfo.expiresAt < new Date()) {
        return this.validateLicense(); // Return free tier
      }
      return licenseInfo;
    }

    // Invalid key = free tier
    return {
      level: 'free',
      scoreLimit: 70,
      features: ['basic_scoring', 'basic_context']
    };
  }

  static getScoreLimit(level: LicenseLevel): number {
    const limits: Record<LicenseLevel, number> = {
      free: 70,
      developer: 85,
      enterprise: 95,
      championship: 100
    };
    return limits[level] || 70;
  }

  static hasFeature(license: LicenseInfo, feature: string): boolean {
    return license.features.includes('all') || license.features.includes(feature);
  }

  static capScore(score: number, license: LicenseInfo): number {
    return Math.min(score, license.scoreLimit);
  }

  static getLicenseMessage(license: LicenseInfo): string {
    const messages: Record<LicenseLevel, string> = {
      free: '🆓 Free Tier - Score capped at 70%',
      developer: '👨‍💻 Developer Tier - Score up to 85%',
      enterprise: '🏢 Enterprise - Score up to 95%',
      championship: '🏁 Championship - Unlimited scoring!'
    };
    return messages[license.level] || messages.free;
  }

  static generateTrialKey(email: string, days: number = 14): string {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);

    const trialKey = `trial_${Buffer.from(email).toString('base64')}_${expires.getTime()}`;

    // Register the trial key
    this.LICENSE_KEYS.set(this.hashKey(trialKey), {
      level: 'developer',
      scoreLimit: 85,
      features: ['advanced_scoring', 'trial'],
      expiresAt: expires
    });

    return trialKey;
  }

  static async validateOnline(key: string): Promise<LicenseInfo> {
    // In production, validate against your license server
    try {
      // const response = await fetch('https://api.faf.one/validate', {
      //   method: 'POST',
      //   body: JSON.stringify({ key }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // return await response.json();

      // For now, use offline validation
      return this.validateLicense(key);
    } catch {
      // Fallback to offline validation
      return this.validateLicense(key);
    }
  }

  static telemetry(license: LicenseInfo, action: string): void {
    // Track usage for analytics
    if (process.env.FAF_TELEMETRY !== 'false') {
      // In production, send to analytics server
      const data = {
        level: license.level,
        action,
        timestamp: new Date().toISOString(),
        version: require('../../package.json').version
      };

      // Non-blocking telemetry
      process.nextTick(() => {
        // fetch('https://telemetry.faf.one/track', { method: 'POST', body: JSON.stringify(data) }).catch(() => {});
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Telemetry:', data);
        }
      });
    }
  }
}