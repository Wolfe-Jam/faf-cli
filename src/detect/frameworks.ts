import type { FrameworkSignature } from '../core/types.js';

/** Data-driven framework signatures — one scanner evaluates all */
export const FRAMEWORKS: FrameworkSignature[] = [
  // Frontend Frameworks
  { name: 'Next.js', slug: 'nextjs', category: 'frontend', signals: [
    { type: 'dependency', key: 'next' },
    { type: 'file', pattern: 'next.config.*' },
  ]},
  { name: 'React', slug: 'react', category: 'frontend', signals: [
    { type: 'dependency', key: 'react' },
  ]},
  { name: 'SvelteKit', slug: 'sveltekit', category: 'frontend', signals: [
    { type: 'dependency', key: '@sveltejs/kit' },
    { type: 'file', pattern: 'svelte.config.*' },
  ]},
  { name: 'Svelte', slug: 'svelte', category: 'frontend', signals: [
    { type: 'dependency', key: 'svelte' },
  ]},
  { name: 'Vue.js', slug: 'vue', category: 'frontend', signals: [
    { type: 'dependency', key: 'vue' },
  ]},
  { name: 'Nuxt', slug: 'nuxt', category: 'frontend', signals: [
    { type: 'dependency', key: 'nuxt' },
    { type: 'file', pattern: 'nuxt.config.*' },
  ]},
  { name: 'Angular', slug: 'angular', category: 'frontend', signals: [
    { type: 'dependency', key: '@angular/core' },
    { type: 'file', pattern: 'angular.json' },
  ]},
  { name: 'Astro', slug: 'astro', category: 'frontend', signals: [
    { type: 'dependency', key: 'astro' },
    { type: 'file', pattern: 'astro.config.*' },
  ]},
  { name: 'Solid', slug: 'solid', category: 'frontend', signals: [
    { type: 'dependency', key: 'solid-js' },
  ]},
  { name: 'Remix', slug: 'remix', category: 'frontend', signals: [
    { type: 'dependency', key: '@remix-run/react' },
  ]},
  { name: 'Gatsby', slug: 'gatsby', category: 'frontend', signals: [
    { type: 'dependency', key: 'gatsby' },
    { type: 'file', pattern: 'gatsby-config.*' },
  ]},
  { name: 'Qwik', slug: 'qwik', category: 'frontend', signals: [
    { type: 'dependency', key: '@builder.io/qwik' },
  ]},

  // SvelteKit Adapters (hosting signal)
  { name: 'Vercel (SvelteKit)', slug: 'adapter-vercel', category: 'hosting', signals: [
    { type: 'dependency', key: '@sveltejs/adapter-vercel' },
    { type: 'devDependency', key: '@sveltejs/adapter-vercel' },
  ]},
  { name: 'Node (SvelteKit)', slug: 'adapter-node', category: 'hosting', signals: [
    { type: 'dependency', key: '@sveltejs/adapter-node' },
    { type: 'devDependency', key: '@sveltejs/adapter-node' },
  ]},
  { name: 'Static (SvelteKit)', slug: 'adapter-static', category: 'hosting', signals: [
    { type: 'dependency', key: '@sveltejs/adapter-static' },
    { type: 'devDependency', key: '@sveltejs/adapter-static' },
  ]},
  { name: 'Cloudflare (SvelteKit)', slug: 'adapter-cloudflare', category: 'hosting', signals: [
    { type: 'dependency', key: '@sveltejs/adapter-cloudflare' },
    { type: 'devDependency', key: '@sveltejs/adapter-cloudflare' },
  ]},
  { name: 'Netlify (SvelteKit)', slug: 'adapter-netlify', category: 'hosting', signals: [
    { type: 'dependency', key: '@sveltejs/adapter-netlify' },
    { type: 'devDependency', key: '@sveltejs/adapter-netlify' },
  ]},

  // CSS Frameworks
  { name: 'Tailwind CSS', slug: 'tailwind', category: 'css', signals: [
    { type: 'dependency', key: 'tailwindcss' },
    { type: 'devDependency', key: 'tailwindcss' },
    { type: 'file', pattern: 'tailwind.config.*' },
  ]},
  { name: 'Bootstrap', slug: 'bootstrap', category: 'css', signals: [
    { type: 'dependency', key: 'bootstrap' },
  ]},
  { name: 'Styled Components', slug: 'styled-components', category: 'css', signals: [
    { type: 'dependency', key: 'styled-components' },
  ]},

  // UI Libraries
  { name: 'shadcn/ui', slug: 'shadcn', category: 'ui', signals: [
    { type: 'file', pattern: 'components.json' },
    { type: 'dependency', key: '@radix-ui/react-dialog' },
  ]},
  { name: 'Material UI', slug: 'mui', category: 'ui', signals: [
    { type: 'dependency', key: '@mui/material' },
  ]},
  { name: 'Chakra UI', slug: 'chakra', category: 'ui', signals: [
    { type: 'dependency', key: '@chakra-ui/react' },
  ]},
  { name: 'Ant Design', slug: 'antd', category: 'ui', signals: [
    { type: 'dependency', key: 'antd' },
  ]},

  // State Management
  { name: 'Redux', slug: 'redux', category: 'state', signals: [
    { type: 'dependency', key: '@reduxjs/toolkit' },
  ]},
  { name: 'Zustand', slug: 'zustand', category: 'state', signals: [
    { type: 'dependency', key: 'zustand' },
  ]},
  { name: 'Jotai', slug: 'jotai', category: 'state', signals: [
    { type: 'dependency', key: 'jotai' },
  ]},
  { name: 'Pinia', slug: 'pinia', category: 'state', signals: [
    { type: 'dependency', key: 'pinia' },
  ]},

  // Backend Frameworks
  { name: 'Express', slug: 'express', category: 'backend', signals: [
    { type: 'dependency', key: 'express' },
  ]},
  { name: 'Fastify', slug: 'fastify', category: 'backend', signals: [
    { type: 'dependency', key: 'fastify' },
  ]},
  { name: 'Hono', slug: 'hono', category: 'backend', signals: [
    { type: 'dependency', key: 'hono' },
  ]},
  { name: 'Elysia', slug: 'elysia', category: 'backend', signals: [
    { type: 'dependency', key: 'elysia' },
  ]},
  { name: 'NestJS', slug: 'nestjs', category: 'backend', signals: [
    { type: 'dependency', key: '@nestjs/core' },
  ]},
  { name: 'Koa', slug: 'koa', category: 'backend', signals: [
    { type: 'dependency', key: 'koa' },
  ]},
  { name: 'Django', slug: 'django', category: 'backend', signals: [
    { type: 'file', pattern: 'manage.py' },
    { type: 'file', pattern: 'settings.py' },
  ]},
  { name: 'Flask', slug: 'flask', category: 'backend', signals: [
    { type: 'file', pattern: 'app.py' },
  ]},
  { name: 'FastAPI', slug: 'fastapi', category: 'backend', signals: [
    { type: 'file', pattern: 'main.py' },
  ]},
  { name: 'Rails', slug: 'rails', category: 'backend', signals: [
    { type: 'file', pattern: 'Gemfile' },
    { type: 'file', pattern: 'config/routes.rb' },
  ]},
  { name: 'Spring Boot', slug: 'spring', category: 'backend', signals: [
    { type: 'file', pattern: 'pom.xml' },
    { type: 'file', pattern: 'build.gradle' },
  ]},

  // Databases
  { name: 'Prisma', slug: 'prisma', category: 'database', signals: [
    { type: 'dependency', key: 'prisma' },
    { type: 'devDependency', key: 'prisma' },
    { type: 'file', pattern: 'prisma/schema.prisma' },
  ]},
  { name: 'Drizzle', slug: 'drizzle', category: 'database', signals: [
    { type: 'dependency', key: 'drizzle-orm' },
    { type: 'file', pattern: 'drizzle.config.*' },
  ]},
  { name: 'TypeORM', slug: 'typeorm', category: 'database', signals: [
    { type: 'dependency', key: 'typeorm' },
  ]},
  { name: 'Mongoose', slug: 'mongoose', category: 'database', signals: [
    { type: 'dependency', key: 'mongoose' },
  ]},

  // Build Tools
  { name: 'Vite', slug: 'vite', category: 'build', signals: [
    { type: 'dependency', key: 'vite' },
    { type: 'devDependency', key: 'vite' },
    { type: 'file', pattern: 'vite.config.*' },
  ]},
  { name: 'webpack', slug: 'webpack', category: 'build', signals: [
    { type: 'dependency', key: 'webpack' },
    { type: 'devDependency', key: 'webpack' },
    { type: 'file', pattern: 'webpack.config.*' },
  ]},
  { name: 'esbuild', slug: 'esbuild', category: 'build', signals: [
    { type: 'dependency', key: 'esbuild' },
    { type: 'devDependency', key: 'esbuild' },
  ]},
  { name: 'Turbopack', slug: 'turbopack', category: 'build', signals: [
    { type: 'file', pattern: 'turbo.json' },
  ]},

  // Testing
  { name: 'Jest', slug: 'jest', category: 'testing', signals: [
    { type: 'devDependency', key: 'jest' },
    { type: 'file', pattern: 'jest.config.*' },
  ]},
  { name: 'Vitest', slug: 'vitest', category: 'testing', signals: [
    { type: 'devDependency', key: 'vitest' },
  ]},
  { name: 'Playwright', slug: 'playwright', category: 'testing', signals: [
    { type: 'devDependency', key: '@playwright/test' },
    { type: 'file', pattern: 'playwright.config.*' },
  ]},
  { name: 'Cypress', slug: 'cypress', category: 'testing', signals: [
    { type: 'devDependency', key: 'cypress' },
    { type: 'file', pattern: 'cypress.config.*' },
  ]},

  // Monorepo Tools
  { name: 'Turborepo', slug: 'turborepo', category: 'monorepo', signals: [
    { type: 'devDependency', key: 'turbo' },
    { type: 'file', pattern: 'turbo.json' },
  ]},
  { name: 'Nx', slug: 'nx', category: 'monorepo', signals: [
    { type: 'devDependency', key: 'nx' },
    { type: 'file', pattern: 'nx.json' },
  ]},
  { name: 'Lerna', slug: 'lerna', category: 'monorepo', signals: [
    { type: 'devDependency', key: 'lerna' },
    { type: 'file', pattern: 'lerna.json' },
  ]},

  // MCP / AI
  { name: 'MCP SDK', slug: 'mcp', category: 'ai', signals: [
    { type: 'dependency', key: '@modelcontextprotocol/sdk' },
  ]},
  { name: 'Anthropic SDK', slug: 'anthropic', category: 'ai', signals: [
    { type: 'dependency', key: '@anthropic-ai/sdk' },
  ]},
  { name: 'OpenAI SDK', slug: 'openai', category: 'ai', signals: [
    { type: 'dependency', key: 'openai' },
  ]},
  { name: 'LangChain', slug: 'langchain', category: 'ai', signals: [
    { type: 'dependency', key: 'langchain' },
  ]},

  // Hosting / Deploy
  { name: 'Vercel', slug: 'vercel', category: 'hosting', signals: [
    { type: 'file', pattern: 'vercel.json' },
  ]},
  { name: 'Netlify', slug: 'netlify', category: 'hosting', signals: [
    { type: 'file', pattern: 'netlify.toml' },
  ]},
  { name: 'Docker', slug: 'docker', category: 'hosting', signals: [
    { type: 'file', pattern: 'Dockerfile' },
    { type: 'file', pattern: 'docker-compose.yml' },
  ]},
  { name: 'Cloudflare Workers', slug: 'cloudflare', category: 'hosting', signals: [
    { type: 'file', pattern: 'wrangler.toml' },
    { type: 'dependency', key: 'wrangler' },
  ]},

  // CI/CD
  { name: 'GitHub Actions', slug: 'github-actions', category: 'cicd', signals: [
    { type: 'file', pattern: '.github/workflows/*.yml' },
  ]},

  // Commander (CLI indicator)
  { name: 'Commander.js', slug: 'commander', category: 'cli', signals: [
    { type: 'dependency', key: 'commander' },
  ]},
];
