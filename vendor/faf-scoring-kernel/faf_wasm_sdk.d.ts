/* tslint:disable */
/* eslint-disable */

/**
 * Compile YAML to a FAFb v2 binary — returns Uint8Array.
 */
export function compile_fafb(yaml: string): Uint8Array;

/**
 * Decompile a FAFb binary to JSON (full content) — returns JSON string.
 */
export function decompile_fafb(bytes: Uint8Array): string;

/**
 * Get FAFb file info (header + section metadata, no content) — returns JSON.
 */
export function fafb_info(bytes: Uint8Array): string;

/**
 * Score FAF YAML content — 21-slot base (CLI default). Returns JSON.
 */
export function score_faf(yaml: string): string;

/**
 * Score FAF YAML content — full 33-slot Mk4. Returns JSON.
 */
export function score_faf_enterprise(yaml: string): string;

/**
 * Score a FAFb binary — returns JSON string (same shape as `score_faf`).
 */
export function score_fafb(bytes: Uint8Array): string;

/**
 * Get SDK version.
 */
export function sdk_version(): string;

/**
 * Validate FAF YAML content — true if it parses as a YAML mapping.
 */
export function validate_faf(yaml: string): boolean;
