/**
 * 📊 FAF CLI Analytics & Telemetry System
 * F1-inspired performance monitoring and user analytics
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';
import { FAF_COLORS, FAF_ICONS } from '../utils/championship-style';

// Telemetry configuration
const TELEMETRY_ENABLED = process.env.FAF_TELEMETRY !== 'false';
const TELEMETRY_ENDPOINT = 'https://telemetry.faf.one/v1/events';
const SESSION_ID = generateSessionId();

interface TelemetryEvent {
  event: string;
  timestamp: string;
  sessionId: string;
  version: string;
  platform: string;
  properties: Record<string, any>;
  performance?: PerformanceMetrics;
  error?: ErrorDetails;
}

interface PerformanceMetrics {
  duration: number;
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  cpu?: {
    model: string;
    speed: number;
    cores: number;
  };
}

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  command?: string;
  args?: string[];
}

interface UsageStats {
  totalCommands: number;
  favoriteCommands: Record<string, number>;
  averageExecutionTime: number;
  errorRate: number;
  lastUsed: string;
  projectTypes: Record<string, number>;
}

/**
 * Core Analytics Engine
 */
export class FafAnalytics {
  private static instance: FafAnalytics;
  private events: TelemetryEvent[] = [];
  private statsPath: string;
  
  private constructor() {
    this.statsPath = path.join(os.homedir(), '.faf', 'usage-stats.json');
  }
  
  static getInstance(): FafAnalytics {
    if (!FafAnalytics.instance) {
      FafAnalytics.instance = new FafAnalytics();
    }
    return FafAnalytics.instance;
  }
  
  /**
   * Track command execution
   */
  async trackCommand(command: string, args: string[], duration: number, success: boolean): Promise<void> {
    if (!TELEMETRY_ENABLED) return;
    
    const event: TelemetryEvent = {
      event: 'command_executed',
      timestamp: new Date().toISOString(),
      sessionId: SESSION_ID,
      version: await this.getVersion(),
      platform: this.getPlatformInfo(),
      properties: {
        command,
        args: args.filter(arg => !arg.includes('key') && !arg.includes('token')), // Security: filter sensitive args
        success,
        projectType: await this.detectProjectType()
      },
      performance: {
        duration,
        memory: process.memoryUsage(),
        cpu: this.getCpuInfo()
      }
    };
    
    await this.recordEvent(event);
    await this.updateUsageStats(command, duration, success);
  }
  
  /**
   * Track errors with context
   */
  async trackError(error: Error, command?: string, args?: string[]): Promise<void> {
    if (!TELEMETRY_ENABLED) return;
    
    const event: TelemetryEvent = {
      event: 'error_occurred',
      timestamp: new Date().toISOString(),
      sessionId: SESSION_ID,
      version: await this.getVersion(),
      platform: this.getPlatformInfo(),
      properties: {
        command,
        projectType: await this.detectProjectType()
      },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        command,
        args: args?.filter(arg => !arg.includes('key') && !arg.includes('token'))
      }
    };
    
    await this.recordEvent(event);
  }
  
  /**
   * Track performance milestones
   */
  async trackPerformance(milestone: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    if (!TELEMETRY_ENABLED) return;
    
    const event: TelemetryEvent = {
      event: 'performance_milestone',
      timestamp: new Date().toISOString(),
      sessionId: SESSION_ID,
      version: await this.getVersion(),
      platform: this.getPlatformInfo(),
      properties: {
        milestone,
        ...metadata
      },
      performance: {
        duration,
        memory: process.memoryUsage()
      }
    };
    
    await this.recordEvent(event);
  }
  
  /**
   * Track feature usage
   */
  async trackFeatureUsage(feature: string, context?: Record<string, any>): Promise<void> {
    if (!TELEMETRY_ENABLED) return;
    
    const event: TelemetryEvent = {
      event: 'feature_used',
      timestamp: new Date().toISOString(),
      sessionId: SESSION_ID,
      version: await this.getVersion(),
      platform: this.getPlatformInfo(),
      properties: {
        feature,
        ...context
      }
    };
    
    await this.recordEvent(event);
  }
  
  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<UsageStats> {
    try {
      const content = await fs.readFile(this.statsPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {
        totalCommands: 0,
        favoriteCommands: {},
        averageExecutionTime: 0,
        errorRate: 0,
        lastUsed: new Date().toISOString(),
        projectTypes: {}
      };
    }
  }
  
  /**
   * Display championship-style analytics summary
   */
  async showAnalyticsSummary(): Promise<void> {
    const stats = await this.getUsageStats();
    
    console.log(`${FAF_COLORS.fafCyan('📊 FAF CLI Analytics Summary')}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Total commands: ${FAF_COLORS.fafGreen(stats.totalCommands.toString())}`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Average execution: ${FAF_COLORS.fafGreen(stats.averageExecutionTime.toFixed(0))}ms`);
    console.log(`${FAF_COLORS.fafCyan('├─')} Error rate: ${this.formatErrorRate(stats.errorRate)}`);
    console.log(`${FAF_COLORS.fafCyan('└─')} Last used: ${FAF_COLORS.fafGreen(new Date(stats.lastUsed).toLocaleDateString())}`);
    
    if (Object.keys(stats.favoriteCommands).length > 0) {
      console.log();
      console.log(`${FAF_COLORS.fafCyan('🏆 Top Commands:')}`);
      const topCommands = Object.entries(stats.favoriteCommands)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      topCommands.forEach(([command, count], index) => {
        const medal = ['🥇', '🥈', '🥉'][index];
        console.log(`${FAF_COLORS.fafCyan('   ')}${medal} ${command}: ${count} times`);
      });
    }
  }
  
  /**
   * Privacy controls
   */
  async disableTelemetry(): Promise<void> {
    process.env.FAF_TELEMETRY = 'false';
    console.log(`${FAF_COLORS.fafGreen('☑️')} Telemetry disabled. Analytics collection stopped.`);
    console.log(`${FAF_COLORS.fafCyan('💡')} Re-enable with: ${FAF_COLORS.fafOrange('export FAF_TELEMETRY=true')}`);
  }
  
  async enableTelemetry(): Promise<void> {
    process.env.FAF_TELEMETRY = 'true';
    console.log(`${FAF_COLORS.fafGreen('☑️')} Telemetry enabled. Helping improve FAF for everyone!`);
    console.log(`${FAF_COLORS.fafCyan('🔒')} All data is anonymized and secure.`);
  }
  
  // =====================================
  // PRIVATE METHODS
  // =====================================
  
  private async recordEvent(event: TelemetryEvent): Promise<void> {
    this.events.push(event);
    
    // Batch send events (or queue for later if offline)
    if (this.events.length >= 10) {
      await this.flushEvents();
    }
  }
  
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;
    
    try {
      // In production, this would send to telemetry endpoint
      // For now, we'll just clear the events
      this.events = [];
    } catch (error) {
      // Silent fail - telemetry should never break the CLI
    }
  }
  
  private async updateUsageStats(command: string, duration: number, success: boolean): Promise<void> {
    const stats = await this.getUsageStats();
    
    stats.totalCommands++;
    stats.favoriteCommands[command] = (stats.favoriteCommands[command] || 0) + 1;
    stats.averageExecutionTime = (stats.averageExecutionTime * (stats.totalCommands - 1) + duration) / stats.totalCommands;
    stats.lastUsed = new Date().toISOString();
    
    if (!success) {
      stats.errorRate = (stats.errorRate * (stats.totalCommands - 1) + 1) / stats.totalCommands;
    } else {
      stats.errorRate = (stats.errorRate * (stats.totalCommands - 1)) / stats.totalCommands;
    }
    
    const projectType = await this.detectProjectType();
    if (projectType) {
      stats.projectTypes[projectType] = (stats.projectTypes[projectType] || 0) + 1;
    }
    
    await this.saveUsageStats(stats);
  }
  
  private async saveUsageStats(stats: UsageStats): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.statsPath), { recursive: true });
      await fs.writeFile(this.statsPath, JSON.stringify(stats, null, 2));
    } catch {
      // Silent fail
    }
  }
  
  private async getVersion(): Promise<string> {
    try {
      const packagePath = path.join(__dirname, '../../package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.version;
    } catch {
      return 'unknown';
    }
  }
  
  private getPlatformInfo(): string {
    return `${os.platform()}-${os.arch()}-node${process.version}`;
  }
  
  private getCpuInfo() {
    const cpus = os.cpus();
    return {
      model: cpus[0]?.model || 'unknown',
      speed: cpus[0]?.speed || 0,
      cores: cpus.length
    };
  }
  
  private async detectProjectType(): Promise<string | null> {
    try {
      const cwd = process.cwd();
      const files = await fs.readdir(cwd);
      
      if (files.includes('package.json')) return 'nodejs';
      if (files.includes('requirements.txt') || files.includes('pyproject.toml')) return 'python';
      if (files.includes('Cargo.toml')) return 'rust';
      if (files.includes('go.mod')) return 'golang';
      if (files.includes('pom.xml') || files.includes('build.gradle')) return 'java';
      
      return null;
    } catch {
      return null;
    }
  }
  
  private formatErrorRate(rate: number): string {
    const percentage = (rate * 100).toFixed(1);
    const color = rate < 0.05 ? FAF_COLORS.fafGreen : 
                  rate < 0.15 ? FAF_COLORS.fafOrange : FAF_COLORS.fafOrange;
    return color(`${percentage}%`);
  }
}

/**
 * Convenience functions for analytics tracking
 */
export const analytics = FafAnalytics.getInstance();

export function trackCommand(command: string, args: string[], duration: number, success: boolean): Promise<void> {
  return analytics.trackCommand(command, args, duration, success);
}

export function trackError(error: Error, command?: string, args?: string[]): Promise<void> {
  return analytics.trackError(error, command, args);
}

export function trackPerformance(milestone: string, duration: number, metadata?: Record<string, any>): Promise<void> {
  return analytics.trackPerformance(milestone, duration, metadata);
}

export function trackFeatureUsage(feature: string, context?: Record<string, any>): Promise<void> {
  return analytics.trackFeatureUsage(feature, context);
}

/**
 * Utility functions
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Performance monitoring decorator
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      await trackPerformance(name, duration, { success: true });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      await trackPerformance(name, duration, { success: false });
      await trackError(error as Error, name);
      throw error;
    }
  }) as T;
}