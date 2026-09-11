import { join } from 'path';
import { readFafRaw } from '../interop/faf.js';
import * as kernel from '../wasm/kernel.js';
import { enrichScore } from '../core/scorer.js';
import { displayScore } from '../ui/display.js';
import { fafCyan, dim, bold } from '../ui/colors.js';
import { makeTempDir, removeTempDir, safeWriteFile } from '../core/safe-write.js';

/** Demo walkthrough — show what faf does without modifying user's project */
export function demoCommand(): void {
  // A fresh temp folder of faf's own (mkdtemp: no one else can have made it),
  // removed at the end — the user's project is never touched.
  const demoDir = makeTempDir('faf-demo-');

  console.log(`${fafCyan('demo')} ${dim('— FAF in action')}\n`);

  // Step 1: Create a sample .faf
  const sampleYaml = `faf_version: 2.5.0
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
  safeWriteFile(fafPath, sampleYaml, { root: demoDir, expect: null });

  console.log(`  ${bold('1.')} Created sample project.faf`);
  console.log(dim(`     ${fafPath}\n`));

  // Step 2: Score it
  console.log(`  ${bold('2.')} Scoring...`);
  const result = enrichScore(kernel.score(readFafRaw(fafPath)));
  console.log('');
  displayScore(result, 'project.faf', true);

  // Cleanup
  removeTempDir(demoDir);

  console.log(`\n${dim('  Demo complete. Run "faf init" in your project to get started.')}`);
}
