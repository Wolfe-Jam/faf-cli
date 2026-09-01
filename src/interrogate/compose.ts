/**
 * docker-compose interrogation — the services a repo runs ARE its stack.
 *
 * A polyglot / platform repo declares Postgres, Redis, ClickHouse, MinIO, Kafka…
 * in compose and nowhere the root-only detectors look. We read the `image:` lines
 * (naive regex — same style as cargo.ts's TOML reader) and map well-known infra
 * images onto stack slots. Facts, not prose — so these win over README guesses.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { ExtractedContext } from './types.js';

/** image name (before ':' tag, after last '/') → { slot, label }. */
const IMAGE_MAP: Array<{ re: RegExp; slot: 'database' | 'cache' | 'search' | 'storage' | 'runtime'; label: string }> = [
  { re: /^postgres|postgis|pgvector/, slot: 'database', label: 'PostgreSQL' },
  { re: /^mysql/, slot: 'database', label: 'MySQL' },
  { re: /^mariadb/, slot: 'database', label: 'MariaDB' },
  { re: /^mongo/, slot: 'database', label: 'MongoDB' },
  { re: /clickhouse/, slot: 'database', label: 'ClickHouse' },
  { re: /^cockroach/, slot: 'database', label: 'CockroachDB' },
  { re: /^redis|^valkey/, slot: 'cache', label: 'Redis' },
  { re: /^memcached/, slot: 'cache', label: 'Memcached' },
  { re: /elasticsearch/, slot: 'search', label: 'Elasticsearch' },
  { re: /opensearch/, slot: 'search', label: 'OpenSearch' },
  { re: /meilisearch/, slot: 'search', label: 'Meilisearch' },
  { re: /typesense/, slot: 'search', label: 'Typesense' },
  { re: /qdrant/, slot: 'search', label: 'Qdrant (vector)' },
  { re: /weaviate/, slot: 'search', label: 'Weaviate (vector)' },
  { re: /^minio/, slot: 'storage', label: 'MinIO (S3-compatible)' },
  { re: /localstack/, slot: 'storage', label: 'LocalStack (AWS)' },
  { re: /rabbitmq/, slot: 'runtime', label: 'RabbitMQ' },
  { re: /kafka/, slot: 'runtime', label: 'Kafka' },
  { re: /nats/, slot: 'runtime', label: 'NATS' },
  { re: /temporalio\/|temporal-server|temporal:/, slot: 'runtime', label: 'Temporal' },
];

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'vendor', 'target', 'e2e', 'tests', 'test',
]);

/** Every compose file at root + one directory deep. */
function findComposeFiles(dir: string): string[] {
  const out: string[] = [];
  const scan = (d: string, depth: number): void => {
    let entries: import('fs').Dirent[];
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isFile() && /^(docker-)?compose.*\.ya?ml$/i.test(e.name)) {out.push(join(d, e.name));}
      else if (e.isDirectory() && depth > 0 && !e.name.startsWith('.') && !IGNORE_DIRS.has(e.name)) {
        scan(join(d, e.name), depth - 1);
      }
    }
  };
  scan(dir, 1);
  return out;
}

/** Join distinct labels for a slot: "PostgreSQL · ClickHouse". */
function joinSlot(labels: Set<string>): string {
  return [...labels].join(' · ');
}

/** Read every compose file and map service images onto stack slots. */
export function interrogateCompose(dir: string): ExtractedContext {
  const files = findComposeFiles(dir);
  if (files.length === 0) {return {};}

  const found: Record<string, Set<string>> = {
    database: new Set(), cache: new Set(), search: new Set(), storage: new Set(), runtime: new Set(),
  };

  for (const file of files) {
    let body: string;
    try { body = readFileSync(file, 'utf-8'); } catch { continue; }
    for (const m of body.matchAll(/^\s*image:\s*["']?([^\s"'#]+)/gm)) {
      const ref = m[1].toLowerCase();
      // strip registry host + tag: ghcr.io/foo/redis:7-alpine → redis
      const name = ref.replace(/:[^/]*$/, '').split('/').pop() ?? ref;
      const hostAndName = ref.replace(/:[^/]*$/, ''); // keep owner for temporalio/ etc.
      for (const { re, slot, label } of IMAGE_MAP) {
        if (re.test(name) || re.test(hostAndName)) {found[slot].add(label);}
      }
    }
  }

  const stack: NonNullable<ExtractedContext['stack']> = {};
  if (found.database.size) {stack.database = joinSlot(found.database);}
  if (found.cache.size) {stack.cache = joinSlot(found.cache);}
  if (found.search.size) {stack.search = joinSlot(found.search);}
  if (found.storage.size) {stack.storage = joinSlot(found.storage);}
  if (found.runtime.size) {stack.runtime = `Docker Compose (${joinSlot(found.runtime)})`;}
  if (Object.keys(stack).length === 0 && !found.runtime.size) {
    // compose present but no recognised infra — still a real hosting fact
    return { stack: { hosting: 'Docker Compose' } };
  }
  stack.hosting = 'Docker Compose';
  return { stack };
}
