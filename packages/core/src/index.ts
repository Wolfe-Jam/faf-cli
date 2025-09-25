/**
 * @faf/core - Zero-dependency FAF scoring engine
 *
 * 🏎️ F1-Inspired performance with zero dependencies
 * Perfect for MCP servers, edge functions, and lightweight environments
 */

export {
  calculateScore,
  validateFafData,
  getMissingRequiredSlots,
  CORE_SLOTS
} from './scorer';

export type {
  FafData,
  ScoreResult,
  SlotDefinition
} from './types';

// Package metadata
export const version = '1.0.0';
export const name = '@faf/core';