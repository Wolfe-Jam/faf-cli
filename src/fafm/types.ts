/**
 * .fafm types — INTEROP-aligned with claude-fafm-sdk 1.0.0
 * application/vnd.fafm+yaml v1.1
 */

export const PRIORITY_ORDER = ['ephemeral', 'standard', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITY_ORDER)[number];

export const PRIORITY_RANK: Record<string, number> = Object.fromEntries(
  PRIORITY_ORDER.map((p, i) => [p, i]),
);

export const KNOWLEDGE_TYPES = new Set(['user', 'feedback', 'project', 'reference']);

export const KNOWN_DOC_KEYS = new Set([
  'version',
  'profile',
  'namepoint',
  'created',
  'last_etched',
  'retention',
  'index',
  'memory',
]);

export const KNOWN_MEMORY_KEYS = new Set(['facts', 'sessions', 'preferences', 'custom']);

export const LEGACY_PRIORITY: Record<string, Priority> = {
  low: 'ephemeral',
  medium: 'standard',
};

export interface Fact {
  text: string;
  id?: string | null;
  type?: string | null;
  priority: Priority | string;
  tags: string[];
  links: string[];
  timestamp?: string | null;
  source?: string | null;
  /** Unknown fact fields (INTEROP §4) */
  extra: Record<string, unknown>;
}

export type Profile = 'voice' | 'knowledge';

export interface SoulDoc {
  version: string;
  profile: string;
  namepoint: string;
  created: string;
  last_etched: string;
  retention: string;
  index: string[];
  memory: {
    facts: unknown[];
    sessions: unknown[];
    preferences: Record<string, unknown>;
    custom: Record<string, unknown>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
