/**
 * Tests for FAF Pro Gate — licensing, trial, and gate logic
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Paths matching production code
const FAF_DIR = path.join(os.homedir(), '.faf');
const TRIAL_PATH = path.join(FAF_DIR, 'trial.json');
const LICENSE_PATH = path.join(FAF_DIR, 'license.json');
const LEGACY_LICENSE_PATH = path.join(FAF_DIR, 'turbo-license.json');
const HMAC_SECRET = 'faf-pro-v1-honest-user';

function sign(payload: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

// Backup and restore helpers — we write real files but clean up
let backups: Record<string, string | null> = {};

function backupFile(filePath: string): void {
  try {
    backups[filePath] = fs.readFileSync(filePath, 'utf-8');
  } catch {
    backups[filePath] = null; // did not exist
  }
}

function restoreFile(filePath: string): void {
  if (backups[filePath] === null) {
    try { fs.unlinkSync(filePath); } catch { /* already gone */ }
  } else if (backups[filePath] !== undefined) {
    fs.writeFileSync(filePath, backups[filePath]!);
  }
}

function removeIfExists(filePath: string): void {
  try { fs.unlinkSync(filePath); } catch { /* ok */ }
}

// Fresh import for each test to avoid module-level caching
function freshImport() {
  // Clear the module cache so each test gets fresh reads
  const modPath = require.resolve('../../src/licensing/pro-gate');
  delete require.cache[modPath];
  return require('../../src/licensing/pro-gate') as typeof import('../../src/licensing/pro-gate');
}

describe('FAF Pro Gate', () => {
  beforeAll(() => {
    // Ensure .faf dir exists
    if (!fs.existsSync(FAF_DIR)) {
      fs.mkdirSync(FAF_DIR, { recursive: true });
    }
    // Backup existing files
    backupFile(TRIAL_PATH);
    backupFile(LICENSE_PATH);
    backupFile(LEGACY_LICENSE_PATH);
  });

  afterAll(() => {
    // Restore original state
    restoreFile(TRIAL_PATH);
    restoreFile(LICENSE_PATH);
    restoreFile(LEGACY_LICENSE_PATH);
  });

  beforeEach(() => {
    // Clean slate for each test
    removeIfExists(TRIAL_PATH);
    removeIfExists(LICENSE_PATH);
    removeIfExists(LEGACY_LICENSE_PATH);
  });

  // --------------------------------------------------------------------------
  // checkProAccess — no files → starts trial
  // --------------------------------------------------------------------------
  it('should auto-start trial when no files exist', () => {
    const mod = freshImport();
    const status = mod.checkProAccess();
    expect(status.allowed).toBe(true);
    expect(status.reason).toBe('trial');
    expect(status.daysLeft).toBe(14);
    // trial.json should now exist
    expect(fs.existsSync(TRIAL_PATH)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // checkProAccess — valid trial within 14 days
  // --------------------------------------------------------------------------
  it('should allow access during valid trial', () => {
    // Create a trial that started 5 days ago
    const started = new Date();
    started.setDate(started.getDate() - 5);
    const expires = new Date(started);
    expires.setDate(expires.getDate() + 14);

    const startedAt = started.toISOString();
    const expiresAt = expires.toISOString();
    const payload = `${startedAt}:${expiresAt}`;

    fs.writeFileSync(TRIAL_PATH, JSON.stringify({
      startedAt,
      expiresAt,
      signature: sign(payload),
    }));

    const mod = freshImport();
    const status = mod.checkProAccess();
    expect(status.allowed).toBe(true);
    expect(status.reason).toBe('trial');
    expect(status.daysLeft).toBeGreaterThan(0);
    expect(status.daysLeft).toBeLessThanOrEqual(9);
  });

  // --------------------------------------------------------------------------
  // checkProAccess — expired trial
  // --------------------------------------------------------------------------
  it('should block access when trial is expired', () => {
    const started = new Date();
    started.setDate(started.getDate() - 20);
    const expires = new Date(started);
    expires.setDate(expires.getDate() + 14);

    const startedAt = started.toISOString();
    const expiresAt = expires.toISOString();
    const payload = `${startedAt}:${expiresAt}`;

    fs.writeFileSync(TRIAL_PATH, JSON.stringify({
      startedAt,
      expiresAt,
      signature: sign(payload),
    }));

    const mod = freshImport();
    const status = mod.checkProAccess();
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('trial_expired');
    expect(status.daysLeft).toBe(0);
  });

  // --------------------------------------------------------------------------
  // checkProAccess — valid license
  // --------------------------------------------------------------------------
  it('should allow access with valid license', () => {
    const key = 'FAF-PRO-TEST-ABCD-1234';
    const activatedAt = new Date().toISOString();
    const payload = `${key}:${activatedAt}`;

    fs.writeFileSync(LICENSE_PATH, JSON.stringify({
      key,
      activatedAt,
      tier: 'pro',
      signature: sign(payload),
    }));

    const mod = freshImport();
    const status = mod.checkProAccess();
    expect(status.allowed).toBe(true);
    expect(status.reason).toBe('licensed');
  });

  // --------------------------------------------------------------------------
  // checkProAccess — tampered trial (bad signature)
  // --------------------------------------------------------------------------
  it('should treat tampered trial as no trial and start fresh', () => {
    fs.writeFileSync(TRIAL_PATH, JSON.stringify({
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      signature: 'tampered-bad-sig',
    }));

    const mod = freshImport();
    const status = mod.checkProAccess();
    // Should start a fresh trial (tampered = no trial)
    expect(status.allowed).toBe(true);
    expect(status.reason).toBe('trial');
    expect(status.daysLeft).toBe(14);
  });

  // --------------------------------------------------------------------------
  // checkProAccess — tampered license (bad signature)
  // --------------------------------------------------------------------------
  it('should treat tampered license as no license', () => {
    fs.writeFileSync(LICENSE_PATH, JSON.stringify({
      key: 'FAF-PRO-FAKE-FAKE-FAKE',
      activatedAt: new Date().toISOString(),
      tier: 'pro',
      signature: 'tampered-bad-sig',
    }));

    const mod = freshImport();
    const status = mod.checkProAccess();
    // Falls through to trial (no valid license, no trial)
    expect(status.allowed).toBe(true);
    expect(status.reason).toBe('trial');
    expect(status.daysLeft).toBe(14);
  });

  // --------------------------------------------------------------------------
  // checkProAccess — legacy turbo-license
  // --------------------------------------------------------------------------
  it('should always allow legacy dev users', () => {
    fs.writeFileSync(LEGACY_LICENSE_PATH, JSON.stringify({
      key: 'FAF-DEV0-W0LF-3JAM-FREE',
    }));

    const mod = freshImport();
    const status = mod.checkProAccess();
    expect(status.allowed).toBe(true);
    expect(status.reason).toBe('legacy_dev');
  });

  // --------------------------------------------------------------------------
  // activateLicense — valid key format
  // --------------------------------------------------------------------------
  it('should activate license with valid key', () => {
    const mod = freshImport();
    const result = mod.activateLicense('FAF-PRO-TEST-ABCD-1234');
    expect(result.success).toBe(true);
    expect(fs.existsSync(LICENSE_PATH)).toBe(true);

    // Verify the written file has correct structure
    const written = JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf-8'));
    expect(written.key).toBe('FAF-PRO-TEST-ABCD-1234');
    expect(written.tier).toBe('pro');
    expect(written.signature).toBeTruthy();
  });

  // --------------------------------------------------------------------------
  // activateLicense — invalid key format
  // --------------------------------------------------------------------------
  it('should reject invalid key format', () => {
    const mod = freshImport();

    expect(mod.activateLicense('bad-key').success).toBe(false);
    expect(mod.activateLicense('FAF-PRO-SHORT').success).toBe(false);
    expect(mod.activateLicense('FAF-PRO-toolong-toolong-toolong').success).toBe(false);
    expect(mod.activateLicense('').success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // startTrial — creates trial.json with correct expiry
  // --------------------------------------------------------------------------
  it('should create trial with 14-day window', () => {
    const mod = freshImport();
    const trial = mod.startTrial();

    expect(trial.startedAt).toBeTruthy();
    expect(trial.expiresAt).toBeTruthy();
    expect(trial.signature).toBeTruthy();

    const start = new Date(trial.startedAt).getTime();
    const end = new Date(trial.expiresAt).getTime();
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeCloseTo(14, 0);

    // File should exist
    expect(fs.existsSync(TRIAL_PATH)).toBe(true);
  });
});
