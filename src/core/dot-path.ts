import { describeShape, isMapping } from './shape.js';

/** Get a nested value from an object by dot-path (undefined when a step is missing or not a mapping). */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {return undefined;}
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * The first intermediate step of `path` that holds something other than a
 * mapping — a scalar or a list — as `{ at, value }`, or null when every step is
 * a mapping or absent. Setting `path` would have to replace that value.
 */
export function blockingStep(obj: Record<string, unknown>, path: string): { at: string; value: unknown } | null {
  const parts = path.split('.');
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const step = (current as Record<string, unknown>)[parts[i]];
    if (step === null || step === undefined) {return null;}
    if (!isMapping(step)) {return { at: parts.slice(0, i + 1).join('.'), value: step };}
    current = step;
  }
  return null;
}

/** The refusal message for a blocked `path` — names the path, the step and what is there. */
export function blockedMessage(path: string, block: { at: string; value: unknown }): string {
  return `cannot set ${path}: ${block.at} is ${describeShape(block.value)}, not a mapping. ` +
    `faf will not replace it — make ${block.at} a mapping in project.faf by hand, then run again.`;
}

/**
 * Set a nested value by dot-path. A missing (or null) intermediate step becomes
 * a new mapping. A step that already holds anything else — a scalar or a list —
 * is refused with an Error naming the path: the existing value is never
 * replaced with `{}`, and `obj` is left unchanged.
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const block = blockingStep(obj, path);
  if (block) {throw new Error(blockedMessage(path, block));}
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === null || current[parts[i]] === undefined) {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}
