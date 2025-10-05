/**
 * 📈 faf score - Scoring Command
 * Calculates .faf completeness score with detailed breakdown
 */

import { scoreCommandV3 } from "./score-v3";

interface ScoreOptions {
  details?: boolean;
  minimum?: string;
  compiler?: boolean;
  trace?: boolean;
  verify?: string;
  checksum?: boolean;
  breakdown?: boolean;
}

export async function scoreFafFile(file?: string, options: ScoreOptions = {}) {
  // Always use compiler-based scoring (Mk3)
  return scoreCommandV3(file, {
    trace: options.trace,
    verify: options.verify,
    breakdown: options.breakdown,
    checksum: options.checksum,
    verbose: options.details
  });
}
