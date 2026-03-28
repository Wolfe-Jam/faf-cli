import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { fafCyan, dim, bold } from '../ui/colors.js';

/** Demo walkthrough — show what faf does without modifying user's project */
export function demoCommand(): void {
  const demoDir = join(tmpdir(), `faf-demo-${Date.now()}`);
  mkdirSync(demoDir, { recursive: true });

  console.log(`${fafCyan('demo')} ${dim('— FAF in action')}\n`);

  // Step 1: Create a sample .faf
  const sampleYaml = `faf_version: "3.0"
project:
  name: acme-app
  goal: Full-stack web application for team collaboration
  main_language: TypeScript
stack:
  frontend: React
  css_framework: Tailwind CSS
  ui_library: shadcn/ui
  state_management: Zustand
  backend: Express
  api_type: REST
  runtime: Node.js
  database: PostgreSQL
  connection: Prisma
  hosting: Vercel
  build: Vite
  cicd: GitHub Actions
human_context:
  who: Startup engineering team
  what: Real-time collaboration platform
  why: Replace fragmented team tools
  where: Cloud (Vercel + AWS)
  when: "2026"
  how: Agile sprints with CI/CD
`;

  const fafPath = join(demoDir, 'project.faf');
  writeFileSync(fafPath, sampleYaml);

  console.log(`  ${bold('1.')} Created sample project.faf`);
  console.log(dim(`     ${fafPath}\n`));

  // Step 2: Score it
  console.log(`  ${bold('2.')} Scoring...`);
  const result = enrichScore(kernel.score(readFafRaw(fafPath)));
  console.log('');
  displayScore(result, 'project.faf', true);

  // Cleanup
  rmSync(demoDir, { recursive: true, force: true });

  console.log(`\n${dim('  Demo complete. Run "faf init" in your project to get started.')}`);
}
