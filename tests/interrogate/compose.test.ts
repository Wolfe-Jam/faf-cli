import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { interrogateCompose } from '../../src/interrogate/compose.js';

let dir: string;
beforeEach(() => { dir = join(tmpdir(), `faf-compose-${Date.now()}-${Math.random().toString(36).slice(2)}`); mkdirSync(dir, { recursive: true }); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

const compose = (body: string, name = 'docker-compose.yml') => writeFileSync(join(dir, name), body);

describe('ENGINE: interrogateCompose — services are the stack', () => {
  test('maps postgres / redis / minio / clickhouse onto slots', () => {
    compose(`services:
  db:
    image: postgres:16-alpine
  cache:
    image: redis:7-alpine
  blobs:
    image: minio/minio:latest
  olap:
    image: clickhouse/clickhouse-server:25.3-alpine
`);
    const r = interrogateCompose(dir);
    expect(r.stack?.database).toMatch(/PostgreSQL/);
    expect(r.stack?.database).toMatch(/ClickHouse/);
    expect(r.stack?.cache).toBe('Redis');
    expect(r.stack?.storage).toMatch(/MinIO/);
    expect(r.stack?.hosting).toBe('Docker Compose');
  });

  test('queue images (kafka / rabbitmq / temporal) → runtime note', () => {
    compose(`services:
  q:
    image: rabbitmq:3-management
  bus:
    image: apache/kafka:4.1.0
  wf:
    image: temporalio/auto-setup:1.29
`);
    const r = interrogateCompose(dir);
    expect(r.stack?.runtime).toMatch(/Kafka/);
    expect(r.stack?.runtime).toMatch(/RabbitMQ/);
    expect(r.stack?.runtime).toMatch(/Temporal/);
  });

  test('vector DBs → search slot', () => {
    compose(`services:
  v:
    image: qdrant/qdrant:latest
  w:
    image: semitechnologies/weaviate:1.25.0
`);
    const r = interrogateCompose(dir);
    expect(r.stack?.search).toMatch(/Qdrant/);
    expect(r.stack?.search).toMatch(/Weaviate/);
  });

  test('finds compose files one directory deep', () => {
    mkdirSync(join(dir, 'backend'), { recursive: true });
    writeFileSync(join(dir, 'backend', 'docker-compose.yml'), 'services:\n  db:\n    image: postgres:16\n');
    const r = interrogateCompose(dir);
    expect(r.stack?.database).toMatch(/PostgreSQL/);
  });

  test('compose with only app images → hosting fact only', () => {
    compose('services:\n  app:\n    image: myorg/myapp:latest\n');
    const r = interrogateCompose(dir);
    expect(r.stack?.hosting).toBe('Docker Compose');
    expect(r.stack?.database).toBeUndefined();
  });

  test('no compose file → empty', () => {
    expect(interrogateCompose(dir)).toEqual({});
  });
});
