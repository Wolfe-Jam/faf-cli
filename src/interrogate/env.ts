/**
 * .env.example interrogation — where secrets live.
 *
 * A repo that ships `.env.example` (or `.env.sample`) is telling you: secrets go
 * in `.env`, this file is the template. Fills `security.secrets` + `.example`.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import type { ExtractedContext } from './types.js';

const CANDIDATES = [
  '.env.example', '.env.sample', '.env.template', '.env.dist',
  'env.example', '.env.local.example',
];

export function interrogateEnv(dir: string): ExtractedContext {
  for (const rel of CANDIDATES) {
    if (existsSync(join(dir, rel))) {
      return { security: { secrets: '.env', example: rel } };
    }
  }
  return {};
}
