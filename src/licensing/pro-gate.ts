/**
 * FAF Pro Gate — Zero-Friction License System for tri-sync
 *
 * Gates: faf ram, faf tri-sync, faf bi-sync --ram/--all
 * Model: PHPStan Pro — 14-day free trial, no signup, no credit card.
 *
 * Flow:
 *   User runs gated command
 *     → checkProAccess()
 *       → isLegacyDev()? → ALLOW
 *       → hasLicense()? → verify sig → ALLOW
 *       → hasTrial()? → verify sig → check expiry
 *         → within 14 days? → ALLOW (hint days left)
 *         → expired? → BLOCK (upgrade prompt)
 *       → no trial? → startTrial() → ALLOW
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import {
  MESSAGES,
  showTrialStarted,
  showTrialReminder,
  showTrialExpired,
  showLicenseActive,
} from './license-messages';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const FAF_DIR = path.join(os.homedir(), '.faf');
const TRIAL_PATH = path.join(FAF_DIR, 'trial.json');
const LICENSE_PATH = path.join(FAF_DIR, 'license.json');
const LEGACY_LICENSE_PATH = path.join(FAF_DIR, 'turbo-license.json');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrialState {
  startedAt: string;
  expiresAt: string;
  signature: string;
}

export interface LicenseState {
  key: string;
  activatedAt: string;
  email?: string;
  tier: string;
  signature: string;
}

export type ProReason = 'licensed' | 'trial' | 'trial_expired' | 'no_trial' | 'legacy_dev';

export interface ProStatus {
  allowed: boolean;
  reason: ProReason;
  daysLeft?: number;
  justStarted?: boolean;
}

export interface ActivationResult {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// HMAC Signing (v1 — honest-user guard, not DRM)
// ---------------------------------------------------------------------------

const HMAC_SECRET = 'faf-pro-v1-honest-user';

function sign(payload: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

function verify(payload: string, signature: string): boolean {
  return sign(payload) === signature;
}

// ---------------------------------------------------------------------------
// File helpers (sync for <10ms)
// ---------------------------------------------------------------------------

function ensureFafDir(): void {
  if (!fs.existsSync(FAF_DIR)) {
    fs.mkdirSync(FAF_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) { return null; }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON<T>(filePath: string, data: T): void {
  ensureFafDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Legacy dev check
// ---------------------------------------------------------------------------

export function isLegacyDev(): boolean {
  const legacy = readJSON<{ key?: string }>(LEGACY_LICENSE_PATH);
  if (!legacy || !legacy.key) { return false; }
  return legacy.key.startsWith('FAF-DEV0-');
}

// ---------------------------------------------------------------------------
// Trial management
// ---------------------------------------------------------------------------

function readTrial(): TrialState | null {
  const trial = readJSON<TrialState>(TRIAL_PATH);
  if (!trial) { return null; }

  // Verify integrity
  const payload = `${trial.startedAt}:${trial.expiresAt}`;
  if (!verify(payload, trial.signature)) { return null; }

  return trial;
}

export function startTrial(): TrialState {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 14);

  const startedAt = now.toISOString();
  const expiresAt = expires.toISOString();
  const payload = `${startedAt}:${expiresAt}`;

  const trial: TrialState = {
    startedAt,
    expiresAt,
    signature: sign(payload),
  };

  writeJSON(TRIAL_PATH, trial);
  return trial;
}

function trialDaysLeft(trial: TrialState): number {
  const now = Date.now();
  const expires = new Date(trial.expiresAt).getTime();
  const msLeft = expires - now;
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// License management
// ---------------------------------------------------------------------------

const LICENSE_KEY_REGEX = /^FAF-PRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

function readLicense(): LicenseState | null {
  const license = readJSON<LicenseState>(LICENSE_PATH);
  if (!license) { return null; }

  // Verify integrity
  const payload = `${license.key}:${license.activatedAt}`;
  if (!verify(payload, license.signature)) { return null; }

  return license;
}

export function activateLicense(key: string): ActivationResult {
  const trimmed = key.trim().toUpperCase();

  if (!LICENSE_KEY_REGEX.test(trimmed)) {
    return { success: false, message: MESSAGES.invalidKey };
  }

  // Check if already licensed
  const existing = readLicense();
  if (existing) {
    return { success: false, message: MESSAGES.alreadyLicensed };
  }

  const activatedAt = new Date().toISOString();
  const payload = `${trimmed}:${activatedAt}`;

  const license: LicenseState = {
    key: trimmed,
    activatedAt,
    tier: 'pro',
    signature: sign(payload),
  };

  writeJSON(LICENSE_PATH, license);
  return { success: true, message: MESSAGES.licenseActivated };
}

// ---------------------------------------------------------------------------
// Core gate check
// ---------------------------------------------------------------------------

export function checkProAccess(): ProStatus {
  // 1. Legacy dev — always allowed
  if (isLegacyDev()) {
    return { allowed: true, reason: 'legacy_dev' };
  }

  // 2. Active license
  const license = readLicense();
  if (license) {
    return { allowed: true, reason: 'licensed' };
  }

  // 3. Active trial
  const trial = readTrial();
  if (trial) {
    const days = trialDaysLeft(trial);
    if (days > 0) {
      return { allowed: true, reason: 'trial', daysLeft: days };
    }
    return { allowed: false, reason: 'trial_expired', daysLeft: 0 };
  }

  // 4. No trial yet — start one automatically
  startTrial();
  return { allowed: true, reason: 'trial', daysLeft: 14, justStarted: true };
}

// ---------------------------------------------------------------------------
// Gate wrapper — call before any Pro feature
// ---------------------------------------------------------------------------

export function gateProFeature(): boolean {
  const status = checkProAccess();

  if (!status.allowed) {
    if (status.reason === 'trial_expired') {
      showTrialExpired();
    }
    return false;
  }

  // Show contextual messages
  if (status.reason === 'trial' && status.justStarted) {
    showTrialStarted();
  } else if (status.reason === 'trial') {
    showTrialReminder(status.daysLeft!);
  } else if (status.reason === 'licensed') {
    showLicenseActive();
  }
  // legacy_dev — silent pass

  return true;
}

// ---------------------------------------------------------------------------
// Status helpers (for `faf pro` command)
// ---------------------------------------------------------------------------

export function getProStatus(): {
  state: 'licensed' | 'trial' | 'trial_expired' | 'none' | 'legacy_dev';
  daysLeft?: number;
  key?: string;
  tier?: string;
  trialStarted?: string;
  trialExpires?: string;
  activatedAt?: string;
} {
  if (isLegacyDev()) {
    return { state: 'legacy_dev' };
  }

  const license = readLicense();
  if (license) {
    return {
      state: 'licensed',
      key: license.key,
      tier: license.tier,
      activatedAt: license.activatedAt,
    };
  }

  const trial = readTrial();
  if (trial) {
    const days = trialDaysLeft(trial);
    if (days > 0) {
      return {
        state: 'trial',
        daysLeft: days,
        trialStarted: trial.startedAt,
        trialExpires: trial.expiresAt,
      };
    }
    return {
      state: 'trial_expired',
      daysLeft: 0,
      trialStarted: trial.startedAt,
      trialExpires: trial.expiresAt,
    };
  }

  return { state: 'none' };
}
