/**
 * 🔺 TURBO-CAT™ FORMAT PYRAMID v1.0.0
 *
 * THE SACRED 154 - Each format is a pyramid stone!
 *
 * Like precious metals in a catalytic converter - each format triggers
 * a specific intelligence reaction. We CAN catalyze ANY format, but only
 * the WORTHY earn a pyramid stone!
 *
 * Pyramid Status: 134/154 stones placed (20 positions available)
 *
 * THE DOCTRINE: To add a new format, PROVE it's better than existing ones!
 * Sum(1..17) = 153 + TURBO-CAT = 154 Perfect Formats
 *
 * 😽 We are the FORMAT FREAKS - Quality over Quantity!
 */

export interface FormatKnowledge {
  frameworks: string[];           // Possible frameworks this format indicates
  slots: Partial<ContextSlots>;  // Direct Context-On-Demand slot mappings
  priority: number;               // Intelligence score (0-35 points)
  intelligence: 'ultra-high' | 'high' | 'medium' | 'low';
  confirmWith?: string[];         // Additional files to check for confirmation
}

export interface ContextSlots {
  // Technical slots (1-15)
  framework: string;
  mainLanguage: string;
  buildTool: string;
  packageManager: string;
  hosting: string;
  backend: string;
  apiType: string;
  cicd: string;
  database: string;
  cssFramework: string;
  uiLibrary: string;
  stateManagement: string;
  server: string;
  connection: string;
  runtime: string;
  // Display slots (for stack display compatibility)
  frontend: string;
  build: string;
  
  // Human context slots (16-21)
  targetUser: string;
  coreProblem: string;
  missionPurpose: string;
  deploymentMarket: string;
  timeline: string;
  approach: string;
}

/**
 * THE KNOWLEDGE BASE
 * 
 * Add any file format here and map it to:
 * 1. Frameworks it indicates
 * 2. Context slots it can fill
 * 3. Priority/intelligence score
 * 
 * The fab-formats engine will automatically use this knowledge!
 */
export const KNOWLEDGE_BASE: Record<string, FormatKnowledge> = {
  // ============================================
  // ULTRA-HIGH VALUE (35 points) - Package Managers
  // ============================================
  
  'package.json': {
    frameworks: ['Node.js', 'JavaScript', 'TypeScript'],
    slots: {
      packageManager: 'npm/yarn/pnpm',
      mainLanguage: 'JavaScript/TypeScript'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },

  'README.md': {
    frameworks: [], // Can be any framework
    slots: {
      targetUser: 'developers', // Often contains who it's for
      coreProblem: 'understanding project', // Usually describes the problem
      missionPurpose: 'project documentation' // Contains the why
    },
    priority: 25, // HIGH: Human context goldmine
    intelligence: 'high'
  },

  'requirements.txt': {
    frameworks: ['Python'],
    slots: { 
      packageManager: 'pip',
      mainLanguage: 'Python'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'Pipfile': {
    frameworks: ['Python'],
    slots: { 
      packageManager: 'pipenv',
      mainLanguage: 'Python'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'pyproject.toml': {
    frameworks: ['Python'],
    slots: { 
      packageManager: 'poetry',
      mainLanguage: 'Python',
      buildTool: 'poetry'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'Gemfile': {
    frameworks: ['Ruby', 'Rails'],
    slots: { 
      packageManager: 'bundler',
      mainLanguage: 'Ruby'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'composer.json': {
    frameworks: ['PHP', 'Laravel', 'Symfony'],
    slots: { 
      packageManager: 'composer',
      mainLanguage: 'PHP'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'Cargo.toml': {
    frameworks: ['Rust'],
    slots: { 
      packageManager: 'cargo',
      mainLanguage: 'Rust',
      buildTool: 'cargo'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'go.mod': {
    frameworks: ['Go'],
    slots: { 
      packageManager: 'go modules',
      mainLanguage: 'Go',
      buildTool: 'go build'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'pubspec.yaml': {
    frameworks: ['Flutter', 'Dart'],
    slots: { 
      packageManager: 'pub',
      mainLanguage: 'Dart',
      framework: 'Flutter'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'pom.xml': {
    frameworks: ['Java', 'Spring', 'Maven'],
    slots: { 
      packageManager: 'maven',
      mainLanguage: 'Java',
      buildTool: 'maven'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },
  
  'build.gradle': {
    frameworks: ['Java', 'Kotlin', 'Spring', 'Gradle'],
    slots: { 
      packageManager: 'gradle',
      mainLanguage: 'Java/Kotlin',
      buildTool: 'gradle'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },

  // ============================================
  // HIGH VALUE (30 points) - JavaScript Frameworks
  // ============================================
  
  'next.config.js': {
    frameworks: ['Next.js'],
    slots: { 
      framework: 'Next.js',
      runtime: 'Node.js',
      buildTool: 'Next.js',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'next.config.mjs': {
    frameworks: ['Next.js'],
    slots: { 
      framework: 'Next.js',
      runtime: 'Node.js',
      buildTool: 'Next.js',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'next.config.ts': {
    frameworks: ['Next.js 13+'],
    slots: { 
      framework: 'Next.js 13+',
      runtime: 'Node.js',
      buildTool: 'Next.js',
      mainLanguage: 'TypeScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'nuxt.config.js': {
    frameworks: ['Nuxt 2'],
    slots: { 
      framework: 'Nuxt 2',
      runtime: 'Node.js',
      buildTool: 'Nuxt',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'nuxt.config.ts': {
    frameworks: ['Nuxt 3'],
    slots: { 
      framework: 'Nuxt 3',
      runtime: 'Node.js',
      buildTool: 'Nuxt',
      mainLanguage: 'TypeScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'svelte.config.js': {
    frameworks: ['SvelteKit'],
    slots: { 
      framework: 'SvelteKit',
      buildTool: 'Vite',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'angular.json': {
    frameworks: ['Angular'],
    slots: {
      framework: 'Angular',
      buildTool: 'Angular CLI',
      mainLanguage: 'TypeScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },

  // ============================================
  // CHROME EXTENSION SUPPORT
  // ============================================

  'manifest.json': {
    frameworks: ['Chrome Extension', 'Browser Extension'],
    slots: {
      framework: 'Chrome Extension',
      runtime: 'Chrome/Browser',
      mainLanguage: 'JavaScript',
      hosting: 'Chrome Web Store',
      apiType: 'Chrome APIs'
    },
    priority: 35,
    intelligence: 'ultra-high',
    confirmWith: ['popup.html', 'background.js', 'content.js']
  },
  
  'vue.config.js': {
    frameworks: ['Vue'],
    slots: { 
      framework: 'Vue',
      buildTool: 'Vue CLI',
      mainLanguage: 'JavaScript'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'remix.config.js': {
    frameworks: ['Remix'],
    slots: { 
      framework: 'Remix',
      runtime: 'Node.js',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'gatsby-config.js': {
    frameworks: ['Gatsby'],
    slots: { 
      framework: 'Gatsby',
      buildTool: 'Gatsby',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'gatsby-config.ts': {
    frameworks: ['Gatsby'],
    slots: { 
      framework: 'Gatsby',
      buildTool: 'Gatsby',
      mainLanguage: 'TypeScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'astro.config.mjs': {
    frameworks: ['Astro'],
    slots: { 
      framework: 'Astro',
      buildTool: 'Vite',
      mainLanguage: 'JavaScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'redwood.toml': {
    frameworks: ['RedwoodJS'],
    slots: { 
      framework: 'RedwoodJS',
      buildTool: 'Webpack',
      mainLanguage: 'JavaScript/TypeScript',
      server: 'Node.js',
      database: 'Prisma'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'blitz.config.ts': {
    frameworks: ['Blitz.js'],
    slots: { 
      framework: 'Blitz.js',
      buildTool: 'Next.js',
      mainLanguage: 'TypeScript',
      server: 'Node.js',
      database: 'Prisma'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'qwik.config.ts': {
    frameworks: ['Qwik'],
    slots: { 
      framework: 'Qwik',
      buildTool: 'Vite',
      mainLanguage: 'TypeScript',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },

  // ============================================
  // HIGH VALUE (30 points) - Backend Frameworks
  // ============================================
  
  'manage.py': {
    frameworks: ['Django'],
    slots: { 
      framework: 'Django',
      backend: 'Django',
      mainLanguage: 'Python',
      server: 'Django',
      apiType: 'Django Views'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'artisan': {
    frameworks: ['Laravel'],
    slots: { 
      framework: 'Laravel',
      backend: 'Laravel',
      mainLanguage: 'PHP',
      server: 'PHP',
      apiType: 'Laravel Routes'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'mix.exs': {
    frameworks: ['Phoenix', 'Elixir'],
    slots: { 
      framework: 'Phoenix',
      backend: 'Phoenix',
      mainLanguage: 'Elixir',
      server: 'BEAM'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'nest-cli.json': {
    frameworks: ['NestJS'],
    slots: { 
      framework: 'NestJS',
      backend: 'NestJS',
      mainLanguage: 'TypeScript',
      server: 'Node.js',
      apiType: 'REST API'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'strapi.config.js': {
    frameworks: ['Strapi'],
    slots: { 
      backend: 'Strapi',
      apiType: 'REST API',
      database: 'Required',
      server: 'Node.js'
    },
    priority: 30,
    intelligence: 'high'
  },

  // ============================================
  // HIGH VALUE (30 points) - Infrastructure
  // ============================================
  
  'Dockerfile': {
    frameworks: ['Docker'],
    slots: { 
      hosting: 'Docker',
      connection: 'Containerized'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'docker-compose.yml': {
    frameworks: ['Docker Compose'],
    slots: { 
      hosting: 'Docker',
      connection: 'Multi-container'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'docker-compose.yaml': {
    frameworks: ['Docker Compose'],
    slots: { 
      hosting: 'Docker',
      connection: 'Multi-container'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'kubernetes.yml': {
    frameworks: ['Kubernetes'],
    slots: { 
      hosting: 'Kubernetes',
      connection: 'Orchestrated'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'k8s.yaml': {
    frameworks: ['Kubernetes'],
    slots: { 
      hosting: 'Kubernetes',
      connection: 'Orchestrated'
    },
    priority: 30,
    intelligence: 'high'
  },

  // ============================================
  // HIGH VALUE (30 points) - Deployment
  // ============================================
  
  'vercel.json': {
    frameworks: ['Vercel'],
    slots: { 
      hosting: 'Vercel',
      cicd: 'Vercel'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'netlify.toml': {
    frameworks: ['Netlify'],
    slots: { 
      hosting: 'Netlify',
      cicd: 'Netlify'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'render.yaml': {
    frameworks: ['Render'],
    slots: { 
      hosting: 'Render',
      cicd: 'Render'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'fly.toml': {
    frameworks: ['Fly.io'],
    slots: { 
      hosting: 'Fly.io',
      cicd: 'Fly.io'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'railway.json': {
    frameworks: ['Railway'],
    slots: { 
      hosting: 'Railway',
      cicd: 'Railway'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'railway.toml': {
    frameworks: ['Railway'],
    slots: { 
      hosting: 'Railway',
      cicd: 'Railway'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'app.yaml': {
    frameworks: ['Google App Engine'],
    slots: { 
      hosting: 'Google Cloud',
      cicd: 'Google Cloud'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'Procfile': {
    frameworks: ['Heroku'],
    slots: { 
      hosting: 'Heroku',
      cicd: 'Heroku'
    },
    priority: 30,
    intelligence: 'high'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - Build Tools
  // ============================================
  
  'vite.config.js': {
    frameworks: ['Vite'],
    slots: { 
      buildTool: 'Vite'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'vite.config.ts': {
    frameworks: ['Vite'],
    slots: { 
      buildTool: 'Vite',
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'webpack.config.js': {
    frameworks: ['Webpack'],
    slots: { 
      buildTool: 'Webpack'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'rollup.config.js': {
    frameworks: ['Rollup'],
    slots: { 
      buildTool: 'Rollup'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'esbuild.config.js': {
    frameworks: ['esbuild'],
    slots: { 
      buildTool: 'esbuild'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'parcel.config.js': {
    frameworks: ['Parcel'],
    slots: { 
      buildTool: 'Parcel'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'snowpack.config.js': {
    frameworks: ['Snowpack'],
    slots: { 
      buildTool: 'Snowpack'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - Language Config
  // ============================================
  
  'tsconfig.json': {
    frameworks: ['TypeScript'],
    slots: { 
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'jsconfig.json': {
    frameworks: ['JavaScript'],
    slots: { 
      mainLanguage: 'JavaScript'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'babel.config.js': {
    frameworks: ['Babel'],
    slots: { 
      buildTool: 'Babel'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  '.babelrc': {
    frameworks: ['Babel'],
    slots: { 
      buildTool: 'Babel'
    },
    priority: 20,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - Testing
  // ============================================
  
  'jest.config.js': {
    frameworks: ['Jest'],
    slots: { 
      cicd: 'Jest'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'jest.config.ts': {
    frameworks: ['Jest'],
    slots: { 
      cicd: 'Jest',
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'vitest.config.ts': {
    frameworks: ['Vitest'],
    slots: { 
      cicd: 'Vitest',
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'cypress.config.js': {
    frameworks: ['Cypress'],
    slots: { 
      cicd: 'Cypress'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'playwright.config.ts': {
    frameworks: ['Playwright'],
    slots: { 
      cicd: 'Playwright',
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'karma.conf.js': {
    frameworks: ['Karma'],
    slots: { 
      cicd: 'Karma'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'mocha.opts': {
    frameworks: ['Mocha'],
    slots: { 
      cicd: 'Mocha'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  '.rspec': {
    frameworks: ['RSpec'],
    slots: { 
      cicd: 'RSpec',
      mainLanguage: 'Ruby'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'pytest.ini': {
    frameworks: ['Pytest'],
    slots: { 
      cicd: 'Pytest',
      mainLanguage: 'Python'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'phpunit.xml': {
    frameworks: ['PHPUnit'],
    slots: { 
      cicd: 'PHPUnit',
      mainLanguage: 'PHP'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - Database/ORM
  // ============================================
  
  'schema.prisma': {
    frameworks: ['Prisma'],
    slots: { 
      database: 'Prisma ORM',
      connection: 'Prisma'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'drizzle.config.ts': {
    frameworks: ['Drizzle'],
    slots: { 
      database: 'Drizzle ORM',
      connection: 'Drizzle',
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'ormconfig.js': {
    frameworks: ['TypeORM'],
    slots: { 
      database: 'TypeORM',
      connection: 'TypeORM'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'knexfile.js': {
    frameworks: ['Knex.js'],
    slots: { 
      database: 'Knex.js',
      connection: 'Knex.js'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'sequelize.config.js': {
    frameworks: ['Sequelize'],
    slots: { 
      database: 'Sequelize',
      connection: 'Sequelize'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'alembic.ini': {
    frameworks: ['Alembic'],
    slots: { 
      database: 'Alembic',
      mainLanguage: 'Python'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - CI/CD
  // ============================================
  
  '.github/workflows': {
    frameworks: ['GitHub Actions'],
    slots: { 
      cicd: 'GitHub Actions'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  '.gitlab-ci.yml': {
    frameworks: ['GitLab CI'],
    slots: { 
      cicd: 'GitLab CI'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'Jenkinsfile': {
    frameworks: ['Jenkins'],
    slots: { 
      cicd: 'Jenkins'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  '.circleci/config.yml': {
    frameworks: ['CircleCI'],
    slots: { 
      cicd: 'CircleCI'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  '.travis.yml': {
    frameworks: ['Travis CI'],
    slots: { 
      cicd: 'Travis CI'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'azure-pipelines.yml': {
    frameworks: ['Azure DevOps'],
    slots: { 
      cicd: 'Azure DevOps'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'bitbucket-pipelines.yml': {
    frameworks: ['Bitbucket Pipelines'],
    slots: { 
      cicd: 'Bitbucket Pipelines'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (20 points) - CSS/UI
  // ============================================
  
  'tailwind.config.js': {
    frameworks: ['Tailwind CSS'],
    slots: { 
      cssFramework: 'Tailwind CSS'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'tailwind.config.ts': {
    frameworks: ['Tailwind CSS'],
    slots: { 
      cssFramework: 'Tailwind CSS',
      mainLanguage: 'TypeScript'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'postcss.config.js': {
    frameworks: ['PostCSS'],
    slots: { 
      cssFramework: 'PostCSS'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'uno.config.ts': {
    frameworks: ['UnoCSS'],
    slots: { 
      cssFramework: 'UnoCSS',
      mainLanguage: 'TypeScript'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'styled-components.config.js': {
    frameworks: ['styled-components'],
    slots: { 
      cssFramework: 'styled-components',
      uiLibrary: 'styled-components'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'emotion.config.js': {
    frameworks: ['Emotion'],
    slots: { 
      cssFramework: 'Emotion',
      uiLibrary: 'Emotion'
    },
    priority: 20,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - Mobile
  // ============================================
  
  'metro.config.js': {
    frameworks: ['React Native'],
    slots: { 
      framework: 'React Native',
      mainLanguage: 'JavaScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'expo.config.js': {
    frameworks: ['Expo'],
    slots: { 
      framework: 'React Native',
      buildTool: 'Expo'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'app.json': {
    frameworks: ['React Native', 'Expo'],
    slots: { 
      framework: 'React Native'
    },
    priority: 20,
    intelligence: 'medium',
    confirmWith: ['expo']
  },
  
  'capacitor.config.ts': {
    frameworks: ['Capacitor'],
    slots: { 
      framework: 'Capacitor',
      mainLanguage: 'TypeScript'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'ionic.config.json': {
    frameworks: ['Ionic'],
    slots: { 
      framework: 'Ionic',
      uiLibrary: 'Ionic'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // MEDIUM VALUE (25 points) - Monorepo
  // ============================================
  
  'nx.json': {
    frameworks: ['Nx'],
    slots: { 
      buildTool: 'Nx'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'turbo.json': {
    frameworks: ['Turborepo'],
    slots: { 
      buildTool: 'Turborepo'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'lerna.json': {
    frameworks: ['Lerna'],
    slots: { 
      buildTool: 'Lerna'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'rush.json': {
    frameworks: ['Rush'],
    slots: { 
      buildTool: 'Rush'
    },
    priority: 25,
    intelligence: 'medium'
  },
  
  'pnpm-workspace.yaml': {
    frameworks: ['pnpm workspaces'],
    slots: { 
      packageManager: 'pnpm',
      buildTool: 'pnpm workspaces'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // LOW VALUE (15 points) - File Extensions
  // These are pattern-based and less definitive
  // ============================================
  
  '*.svelte': {
    frameworks: ['Svelte', 'SvelteKit'],
    slots: { 
      framework: 'Svelte'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.vue': {
    frameworks: ['Vue'],
    slots: { 
      framework: 'Vue'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.jsx': {
    frameworks: ['React'],
    slots: { 
      framework: 'React',
      mainLanguage: 'JavaScript'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.ts': {
    frameworks: ['TypeScript'],
    slots: {
      mainLanguage: 'TypeScript'
    },
    priority: 15,
    intelligence: 'low'
  },

  '*.tsx': {
    frameworks: ['React', 'TypeScript'],
    slots: {
      framework: 'React',
      mainLanguage: 'TypeScript'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.py': {
    frameworks: ['Python'],
    slots: { 
      mainLanguage: 'Python'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.rb': {
    frameworks: ['Ruby'],
    slots: { 
      mainLanguage: 'Ruby'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.php': {
    frameworks: ['PHP'],
    slots: { 
      mainLanguage: 'PHP'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.java': {
    frameworks: ['Java'],
    slots: { 
      mainLanguage: 'Java'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.kt': {
    frameworks: ['Kotlin'],
    slots: { 
      mainLanguage: 'Kotlin'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.swift': {
    frameworks: ['Swift'],
    slots: { 
      mainLanguage: 'Swift'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.go': {
    frameworks: ['Go'],
    slots: { 
      mainLanguage: 'Go'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.rs': {
    frameworks: ['Rust'],
    slots: { 
      mainLanguage: 'Rust'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.dart': {
    frameworks: ['Flutter', 'Dart'],
    slots: { 
      mainLanguage: 'Dart'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.ex': {
    frameworks: ['Elixir'],
    slots: { 
      mainLanguage: 'Elixir'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.exs': {
    frameworks: ['Elixir'],
    slots: { 
      mainLanguage: 'Elixir'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.scala': {
    frameworks: ['Scala'],
    slots: { 
      mainLanguage: 'Scala'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.clj': {
    frameworks: ['Clojure'],
    slots: { 
      mainLanguage: 'Clojure'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.lua': {
    frameworks: ['Lua'],
    slots: { 
      mainLanguage: 'Lua'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.r': {
    frameworks: ['R'],
    slots: { 
      mainLanguage: 'R'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.R': {
    frameworks: ['R'],
    slots: { 
      mainLanguage: 'R'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.jl': {
    frameworks: ['Julia'],
    slots: { 
      mainLanguage: 'Julia'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.nim': {
    frameworks: ['Nim'],
    slots: { 
      mainLanguage: 'Nim'
    },
    priority: 15,
    intelligence: 'low'
  },
  
  '*.zig': {
    frameworks: ['Zig'],
    slots: {
      mainLanguage: 'Zig'
    },
    priority: 15,
    intelligence: 'low'
  },

  'build.zig': {
    frameworks: ['Zig'],
    slots: {
      // camelCase slots (standard TURBO-CAT)
      packageManager: 'Zig Package Manager',
      mainLanguage: 'Zig',
      buildTool: 'zig build',
      framework: 'Zig',
      // snake_case slots (template compatibility)
      frontend: 'Zig',
      build: 'zig build'
    },
    priority: 35,
    intelligence: 'ultra-high'
  },

  // ============================================
  // SPECIAL VALUE (20 points) - API/Schema
  // ============================================
  
  'openapi.json': {
    frameworks: ['OpenAPI'],
    slots: { 
      apiType: 'REST API',
      backend: 'API Server'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'openapi.yaml': {
    frameworks: ['OpenAPI'],
    slots: { 
      apiType: 'REST API',
      backend: 'API Server'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'swagger.json': {
    frameworks: ['Swagger'],
    slots: { 
      apiType: 'REST API',
      backend: 'API Server'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'graphql.schema': {
    frameworks: ['GraphQL'],
    slots: { 
      apiType: 'GraphQL',
      backend: 'GraphQL Server'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  'schema.graphql': {
    frameworks: ['GraphQL'],
    slots: { 
      apiType: 'GraphQL',
      backend: 'GraphQL Server'
    },
    priority: 30,
    intelligence: 'high'
  },
  
  '.graphqlconfig': {
    frameworks: ['GraphQL'],
    slots: { 
      apiType: 'GraphQL'
    },
    priority: 25,
    intelligence: 'medium'
  },

  // ============================================
  // SPECIAL VALUE (20 points) - State Management
  // ============================================
  
  'redux.config.js': {
    frameworks: ['Redux'],
    slots: { 
      stateManagement: 'Redux'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'mobx.config.js': {
    frameworks: ['MobX'],
    slots: { 
      stateManagement: 'MobX'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'vuex.config.js': {
    frameworks: ['Vuex'],
    slots: { 
      stateManagement: 'Vuex',
      framework: 'Vue'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'pinia.config.js': {
    frameworks: ['Pinia'],
    slots: { 
      stateManagement: 'Pinia',
      framework: 'Vue'
    },
    priority: 20,
    intelligence: 'medium'
  },
  
  'zustand.config.js': {
    frameworks: ['Zustand'],
    slots: { 
      stateManagement: 'Zustand'
    },
    priority: 20,
    intelligence: 'medium'
  },

  // ============================================
  // SPECIAL VALUE (15 points) - Linting/Formatting
  // ============================================
  
  '.eslintrc.js': {
    frameworks: ['ESLint'],
    slots: {},
    priority: 15,
    intelligence: 'low'
  },
  
  '.eslintrc.json': {
    frameworks: ['ESLint'],
    slots: {},
    priority: 15,
    intelligence: 'low'
  },
  
  '.prettierrc': {
    frameworks: ['Prettier'],
    slots: {},
    priority: 15,
    intelligence: 'low'
  },
  
  '.prettierrc.json': {
    frameworks: ['Prettier'],
    slots: {},
    priority: 15,
    intelligence: 'low'
  },
  
  'biome.json': {
    frameworks: ['Biome'],
    slots: {},
    priority: 15,
    intelligence: 'low'
  },
  
  '.editorconfig': {
    frameworks: ['EditorConfig'],
    slots: {},
    priority: 10,
    intelligence: 'low'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get knowledge for a specific format
 */
export function getFormatKnowledge(format: string): FormatKnowledge | undefined {
  return KNOWLEDGE_BASE[format];
}

/**
 * Get all format keys
 */
export function getAllFormats(): string[] {
  return Object.keys(KNOWLEDGE_BASE);
}

/**
 * Get high-value formats (priority >= 30)
 */
export function getHighValueFormats(): string[] {
  return Object.entries(KNOWLEDGE_BASE)
    .filter(([, knowledge]) => knowledge.priority >= 30)
    .map(([format]) => format);
}

/**
 * Get formats by intelligence level
 */
export function getFormatsByIntelligence(level: FormatKnowledge['intelligence']): string[] {
  return Object.entries(KNOWLEDGE_BASE)
    .filter(([, knowledge]) => knowledge.intelligence === level)
    .map(([format]) => format);
}

/**
 * Get formats that can fill a specific slot
 */
export function getFormatsForSlot(slotName: keyof ContextSlots): string[] {
  return Object.entries(KNOWLEDGE_BASE)
    .filter(([, knowledge]) => slotName in knowledge.slots)
    .map(([format]) => format);
}

/**
 * Calculate total possible intelligence score
 */
export function getMaxIntelligenceScore(): number {
  return Object.values(KNOWLEDGE_BASE)
    .reduce((sum, knowledge) => sum + knowledge.priority, 0);
}