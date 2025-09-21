/**
 * FAF VIBE Platform Detector ⚡️😽
 * Detects no-code/low-code platforms for simplified $9 tier
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface PlatformInfo {
  platform: string;
  tier: 'vibe' | 'pro';
  detected: boolean;
  confidence: number;
  indicators: string[];
}

export class PlatformDetector {
  private readonly VIBE_PLATFORMS = [
    {
      name: 'Replit',
      indicators: [
        '.replit',
        'replit.nix',
        process.env.REPL_ID,
        process.env.REPL_OWNER,
        process.env.REPLIT_DB_URL
      ]
    },
    {
      name: 'Lovable',
      indicators: [
        '.lovable',
        'lovable.json',
        process.env.LOVABLE_PROJECT_ID
      ]
    },
    {
      name: 'Wix',
      indicators: [
        'wix.config.json',
        '.wix',
        process.env.WIX_INSTANCE_ID
      ]
    },
    {
      name: 'Base44',
      indicators: [
        'base44.json',
        '.base44'
      ]
    },
    {
      name: 'Glitch',
      indicators: [
        '.glitch-assets',
        'watch.json',
        process.env.PROJECT_DOMAIN,
        process.env.PROJECT_ID
      ]
    },
    {
      name: 'CodeSandbox',
      indicators: [
        'sandbox.config.json',
        '.codesandbox',
        process.env.CODESANDBOX_ENV
      ]
    },
    {
      name: 'Stackblitz',
      indicators: [
        '.stackblitzrc',
        process.env.STACKBLITZ_ENV
      ]
    },
    {
      name: 'Warp',
      indicators: [
        process.env.WARP_USE_SSH_AGENT,
        process.env.WARP_DEV
      ]
    }
  ];

  /**
   * Detect if running on a FAF VIBE eligible platform
   */
  public async detectPlatform(projectPath?: string): Promise<PlatformInfo> {
    const basePath = projectPath || process.cwd();
    
    // Check each VIBE platform
    for (const platform of this.VIBE_PLATFORMS) {
      const foundIndicators: string[] = [];
      
      for (const indicator of platform.indicators) {
        if (typeof indicator === 'string') {
          // Check for files
          if (!indicator.startsWith('process.env')) {
            const filePath = path.join(basePath, indicator);
            try {
              if (fs.existsSync(filePath)) {
                foundIndicators.push(indicator);
              }
            } catch {}
          } else {
            // Check environment variables
            const envVar = indicator.replace('process.env.', '');
            if (process.env[envVar]) {
              foundIndicators.push(envVar);
            }
          }
        }
      }
      
      // If we found any indicators, it's a VIBE platform
      if (foundIndicators.length > 0) {
        const confidence = Math.min(100, foundIndicators.length * 33);
        return {
          platform: platform.name,
          tier: 'vibe',
          detected: true,
          confidence,
          indicators: foundIndicators
        };
      }
    }
    
    // Check for traditional dev environments (Pro tier)
    const proIndicators: string[] = [];
    
    // VS Code
    if (process.env.VSCODE_CLI || process.env.TERM_PROGRAM === 'vscode') {
      proIndicators.push('VS Code');
    }
    
    // Cursor
    if (process.env.CURSOR_EDITOR) {
      proIndicators.push('Cursor');
    }
    
    // Git repository
    if (fs.existsSync(path.join(basePath, '.git'))) {
      proIndicators.push('Git');
    }
    
    // Local development
    if (!process.env.CI && !process.env.CONTAINER_ID) {
      proIndicators.push('Local Development');
    }
    
    if (proIndicators.length > 0) {
      return {
        platform: 'Professional Development Environment',
        tier: 'pro',
        detected: true,
        confidence: 95,
        indicators: proIndicators
      };
    }
    
    // No platform detected
    return {
      platform: 'Unknown',
      tier: 'pro', // Default to pro
      detected: false,
      confidence: 0,
      indicators: []
    };
  }

  /**
   * Get pricing tier based on platform
   */
  public getPricingTier(platform: PlatformInfo): { price: number; name: string; emoji: string } {
    if (platform.tier === 'vibe') {
      return {
        price: 9,
        name: 'FAF VIBE',
        emoji: '⚡️'
      };
    }
    
    return {
      price: 100,
      name: 'FAF Professional',
      emoji: '🏎️'
    };
  }

  /**
   * Get platform-specific messaging
   */
  public getPlatformMessage(platform: PlatformInfo): string {
    if (!platform.detected) {
      return '🏎️ FAF Professional - Championship Context for Serious Developers';
    }
    
    if (platform.tier === 'vibe') {
      return `⚡️ FAF VIBE on ${platform.platform}! No-code builder special: $9/month FOREVER! 😽`;
    }
    
    return '🏎️ FAF Professional - F1-Inspired Software Engineering';
  }
}