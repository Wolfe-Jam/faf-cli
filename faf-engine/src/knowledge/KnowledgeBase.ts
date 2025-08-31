/**
 * Knowledge Base - Simplified version for standalone engine
 */

export interface FormatKnowledge {
  frameworks: string[];
  slots?: Record<string, string>;
  priority: number;
  intelligence: 'low' | 'medium' | 'high' | 'very-high' | 'ultra-high';
}

export const KNOWLEDGE_BASE: Record<string, FormatKnowledge> = {
  'package.json': {
    frameworks: ['Node.js', 'JavaScript', 'TypeScript'],
    slots: { packageManager: 'npm', mainLanguage: 'JavaScript' },
    priority: 35,
    intelligence: 'ultra-high'
  },
  'requirements.txt': {
    frameworks: ['Python'],
    slots: { packageManager: 'pip', mainLanguage: 'Python' },
    priority: 35,
    intelligence: 'ultra-high'
  },
  'tsconfig.json': {
    frameworks: ['TypeScript'],
    slots: { mainLanguage: 'TypeScript', build: 'TypeScript' },
    priority: 25,
    intelligence: 'high'
  },
  'svelte.config.js': {
    frameworks: ['SvelteKit', 'Svelte'],
    slots: { frontend: 'SvelteKit', build: 'Vite' },
    priority: 30,
    intelligence: 'very-high'
  },
  'next.config.js': {
    frameworks: ['Next.js'],
    slots: { frontend: 'Next.js', build: 'Next.js' },
    priority: 30,
    intelligence: 'very-high'
  },
  'vite.config.ts': {
    frameworks: ['Vite'],
    slots: { build: 'Vite' },
    priority: 25,
    intelligence: 'high'
  },
  'Dockerfile': {
    frameworks: ['Docker'],
    slots: { hosting: 'Docker', cicd: 'Docker' },
    priority: 30,
    intelligence: 'very-high'
  },
  '*.py': {
    frameworks: ['Python'],
    slots: { mainLanguage: 'Python' },
    priority: 15,
    intelligence: 'medium'
  },
  '*.ts': {
    frameworks: ['TypeScript'],
    slots: { mainLanguage: 'TypeScript' },
    priority: 15,
    intelligence: 'medium'
  },
  '*.svelte': {
    frameworks: ['Svelte', 'SvelteKit'],
    slots: { frontend: 'Svelte' },
    priority: 20,
    intelligence: 'high'
  }
};