/**
 * The 6Ws Interview — SINGLE SOURCE.
 *
 * The canonical question registry for filling a .faf by asking a human (or an
 * agent asking a human). faf-cli OWNS it; consumers (claude-faf-mcp's faf_go,
 * siblings, UIs) IMPORT it — never reimplement, never copy. Decided
 * 2026-06-10: the CLI exports, CFM consumes, zero drift. (CFM's previous
 * hand-maintained registry had already drifted — e.g. its `how` asked "How
 * should AI assist?" while the canonical slot semantic is "How is it built /
 * used?". This file is the arbiter; slots.ts is its spine.)
 *
 * Shape carries what interactive consumers need: question text, a short
 * header chip, input type, required flag, select options where a closed-ish
 * vocabulary exists. Question SEMANTICS align to core/slots.ts descriptions —
 * the slot is the meaning, the question is just its interview voice.
 *
 * Authoring doctrine baked into the prompts: 6Ws answers are terse LABELS
 * (3-4 words, hard cap <6) — a scannable spec card, not prose.
 */

import { SLOTS, SLOT_BY_PATH } from './slots.js';

/** Bump when questions/options change — consumers can pin or report it. */
export const INTERVIEW_VERSION = 'faf-interview/1';

export interface InterviewOption {
  label: string;
  value: string;
  description: string;
}

export interface InterviewQuestion {
  /** Canonical slot path (core/slots.ts is the spine). */
  path: string;
  question: string;
  /** Short chip/header label (max ~12 chars) for option-UI consumers. */
  header: string;
  type: 'text' | 'select';
  required: boolean;
  options?: InterviewOption[];
}

const TERSE = '(terse — 3-4 words)';

/**
 * THE 8-Q 6Ws INTERVIEW — the core. Project identity (name + goal) plus the
 * six Ws. Language is deliberately NOT here: detection finds it; humans are
 * only asked what machines cannot derive. The 6Ws are the underivable half.
 */
export const SIX_WS_INTERVIEW: InterviewQuestion[] = [
  {
    path: 'project.name',
    question: 'What is the name of this project?',
    header: 'Name',
    type: 'text',
    required: true,
  },
  {
    path: 'project.goal',
    question: 'What does this project do? (one sentence)',
    header: 'Goal',
    type: 'text',
    required: true,
  },
  {
    path: 'human_context.who',
    question: `Who is this for? ${TERSE}`,
    header: 'Who',
    type: 'text',
    required: true,
  },
  {
    path: 'human_context.what',
    question: `What are they building? ${TERSE}`,
    header: 'What',
    type: 'text',
    required: true,
  },
  {
    path: 'human_context.why',
    question: `Why does it exist? ${TERSE}`,
    header: 'Why',
    type: 'text',
    required: true,
  },
  {
    path: 'human_context.where',
    question: `Where does it run or ship? ${TERSE}`,
    header: 'Where',
    type: 'text',
    required: true,
  },
  {
    path: 'human_context.when',
    question: `When — timeline or stage? ${TERSE}`,
    header: 'When',
    type: 'text',
    required: true,
  },
  {
    path: 'human_context.how',
    question: `How is it built or used? ${TERSE}`,
    header: 'How',
    type: 'text',
    required: true,
  },
];

/**
 * Stack interview — asked only for slots ACTIVE for the app_type and still
 * empty. Selects where a common vocabulary exists; every select includes
 * Other (specify) and None where absence is legitimate.
 */
export const STACK_INTERVIEW: InterviewQuestion[] = [
  {
    path: 'project.main_language',
    question: 'What is the primary programming language?',
    header: 'Language',
    type: 'select',
    required: true,
    options: [
      { label: 'TypeScript', value: 'TypeScript', description: 'JavaScript with types' },
      { label: 'JavaScript', value: 'JavaScript', description: 'Vanilla JS or Node.js' },
      { label: 'Python', value: 'Python', description: 'Python 3.x' },
      { label: 'Rust', value: 'Rust', description: 'Systems programming' },
      { label: 'Go', value: 'Go', description: 'Golang' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },
  {
    path: 'stack.frontend',
    question: 'What frontend framework does it use?',
    header: 'Frontend',
    type: 'select',
    required: false,
    options: [
      { label: 'React', value: 'React', description: 'React.js' },
      { label: 'Vue', value: 'Vue', description: 'Vue.js' },
      { label: 'Svelte', value: 'Svelte', description: 'Svelte/SvelteKit' },
      { label: 'Next.js', value: 'Next.js', description: 'React framework' },
      { label: 'None', value: 'None', description: 'No frontend' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },
  {
    path: 'stack.backend',
    question: 'What backend framework does it use?',
    header: 'Backend',
    type: 'select',
    required: false,
    options: [
      { label: 'Express', value: 'Express', description: 'Node.js Express' },
      { label: 'Fastify', value: 'Fastify', description: 'Node.js Fastify' },
      { label: 'Django', value: 'Django', description: 'Python Django' },
      { label: 'FastAPI', value: 'FastAPI', description: 'Python FastAPI' },
      { label: 'None', value: 'None', description: 'No backend' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },
  {
    path: 'stack.database',
    question: 'What database does it use?',
    header: 'Database',
    type: 'select',
    required: false,
    options: [
      { label: 'PostgreSQL', value: 'PostgreSQL', description: 'Postgres' },
      { label: 'MySQL', value: 'MySQL', description: 'MySQL/MariaDB' },
      { label: 'SQLite', value: 'SQLite', description: 'Embedded SQL' },
      { label: 'MongoDB', value: 'MongoDB', description: 'Document store' },
      { label: 'None', value: 'None', description: 'No database' },
      { label: 'Other', value: 'Other', description: 'Specify manually' },
    ],
  },
  {
    path: 'stack.runtime',
    question: 'What runtime does it run on?',
    header: 'Runtime',
    type: 'text',
    required: false,
  },
  {
    path: 'stack.hosting',
    question: 'Where is it hosted or distributed?',
    header: 'Hosting',
    type: 'text',
    required: false,
  },
  {
    path: 'stack.build',
    question: 'What is the build tool?',
    header: 'Build',
    type: 'text',
    required: false,
  },
  {
    path: 'stack.cicd',
    question: 'What CI/CD does it use?',
    header: 'CI/CD',
    type: 'text',
    required: false,
  },
];

/** The full ordered registry: the 8-Q core first, then stack. */
export const INTERVIEW: InterviewQuestion[] = [...SIX_WS_INTERVIEW, ...STACK_INTERVIEW];

/** Lookup by slot path. */
export const INTERVIEW_BY_PATH = new Map<string, InterviewQuestion>(
  INTERVIEW.map((q) => [q.path, q]),
);

/**
 * Interview voice for ANY slot: the registry question when one exists,
 * otherwise derived from the slot's canonical description — so slot-driven
 * flows (faf go) and registry-driven flows (faf_go) speak the same language.
 */
export function questionForSlot(path: string): string {
  const q = INTERVIEW_BY_PATH.get(path);
  if (q) return q.question;
  const slot = SLOT_BY_PATH.get(path) ?? SLOTS.find((s) => s.canonical === path);
  return slot ? `${slot.description}?`.replace(/\?\?$/, '?') : `${path}?`;
}

/**
 * The questions still worth asking for a given .faf: registry order, empty
 * (or placeholder) slots only, slotignored skipped — the What-Not is never
 * interviewed. `data` is the parsed .faf object.
 */
export function interviewForMissing(
  data: Record<string, unknown>,
  isEmpty: (value: unknown) => boolean,
): InterviewQuestion[] {
  return INTERVIEW.filter((q) => {
    const parts = q.path.split('.');
    let cur: unknown = data;
    for (const part of parts) {
      if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        cur = undefined;
        break;
      }
    }
    if (cur === 'slotignored') return false;
    return isEmpty(cur);
  });
}
