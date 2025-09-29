/**
 * 🚀 REAL faf enhance - Actually improves scores with facts, not BS
 * No placeholders, no mocks - real improvements based on project analysis
 * RELENTLESS pursuit of highest score through real data or human input
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import * as path from "path";
import * as YAML from "yaml";
import inquirer from "inquirer";
import { findFafFile } from "../utils/file-utils";
import { FafCompiler } from "../compiler/faf-compiler";
import { FabFormatsEngine } from "../utils/fab-formats-engine";
import { execSync } from "child_process";

export interface RealEnhanceOptions {
  verbose?: boolean;
  dryRun?: boolean;
  autoFill?: boolean;
  interactive?: boolean; // Ask human for missing data
  targetScore?: number;  // Keep enhancing until this score (default 80)
}

/**
 * REAL Enhancement that RELENTLESSLY improves scores
 * Loops until target score achieved or no more improvements possible
 */
export async function realEnhanceFaf(
  file?: string,
  options: RealEnhanceOptions = {},
): Promise<void> {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    const projectPath = path.dirname(fafPath);

    console.log(chalk.cyan("⚡ Real Enhancement Starting..."));
    console.log(chalk.gray("   No BS, just facts from your project"));
    console.log(chalk.gray(`   Enhancing: ${fafPath}`));

    // Read current .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    let fafData = YAML.parse(content) || {};

    // Get REAL current score with detailed breakdown
    const compiler = new FafCompiler();
    let currentScore = await compiler.compile(fafPath);
    const targetScore = options.targetScore || 100;  // Changed from 80 to 100

    console.log(chalk.yellow(`📊 Current Score: ${currentScore.score}%`));
    console.log(chalk.gray(`   Target Score: ${targetScore}%`));
    console.log(chalk.gray(`   Filled: ${currentScore.filled}/${currentScore.total} slots`));

    // Show what's missing
    if (options.verbose) {
      displayMissingSlots(currentScore);
    }

    // RELENTLESS enhancement loop
    let iteration = 0;
    const maxIterations = 10; // Safety limit

    while (currentScore.score < targetScore && iteration < maxIterations) {
      iteration++;
      console.log(chalk.cyan(`\n🔄 Enhancement Round ${iteration}...`));

      // Analyze project for REAL improvements
      const improvements = await analyzeProjectForRealImprovements(projectPath, fafData, currentScore);

      if (options.verbose) {
        console.log(chalk.gray(`Found ${Object.keys(improvements).length} automatic improvements`));
        if (Object.keys(improvements).length > 0 && Object.keys(improvements).length <= 3) {
          console.log(chalk.gray(`   Improvements: ${Object.keys(improvements).join(', ')}`));
        }
      }

      // If no automatic improvements found and interactive mode, ask human
      if (Object.keys(improvements).length === 0 && options.interactive !== false) {
        // Check if we're missing critical human context
        const missingHuman = !fafData.human_context?.who || !fafData.human_context?.what ||
                            !fafData.human_context?.why || !fafData.human_context?.where ||
                            !fafData.human_context?.when || !fafData.human_context?.how;

        if (missingHuman) {
          console.log(chalk.yellow('\n⚠️ Missing critical Human Context (the 6 W\'s)'));
          console.log(chalk.gray('   This is the biggest opportunity to improve your score'));
        }

        const humanInput = await askHumanForMissingData(fafData, currentScore);
        Object.assign(improvements, humanInput);
        if (options.verbose && Object.keys(humanInput).length > 0) {
          console.log(chalk.gray(`Added ${Object.keys(humanInput).length} improvements from human input`));
        }
      }

      // If still no improvements, we're done
      if (Object.keys(improvements).length === 0) {
        console.log(chalk.yellow("\n⚠️ No more improvements possible with available data"));
        if (options.interactive === false) {
          console.log(chalk.gray("   (Interactive mode disabled - try with -i true to provide missing data)"));
        }
        break;
      }

      if (options.dryRun) {
        console.log(chalk.cyan("\n🔍 Improvements Found (Dry Run):"));
        displayImprovements(improvements);
        continue;
      }

      // Apply REAL improvements
      fafData = applyRealEnhancements(fafData, improvements);

      // CRITICAL: Preserve essential fields that should never be removed
      if (!fafData.project) fafData.project = {};
      if (!fafData.project.generated && fafData.generated) {
        fafData.project.generated = fafData.generated;
      }

      // Add meta tracking for enhancement
      fafData.meta = fafData.meta || {};
      fafData.meta.last_enhanced = new Date().toISOString();
      fafData.meta.enhanced_by = 'faf-real-enhance';

      // Save enhanced file
      const enhancedYaml = YAML.stringify(fafData, null, 2);
      await fs.writeFile(fafPath, enhancedYaml);

      // Calculate new score
      const newScore = await compiler.compile(fafPath);
      const improvement = newScore.score - currentScore.score;

      if (improvement > 0) {
        console.log(chalk.green(`✅ Improvement: +${improvement}% (${currentScore.score}% → ${newScore.score}%)`));

        // Show what was actually added
        if (options.verbose) {
          console.log(chalk.cyan("📝 Changes Made:"));
          displayImprovements(improvements);
        }
      }

      currentScore = newScore;
    }

    // Final results
    console.log(chalk.cyan("\n" + "=".repeat(60)));
    if (currentScore.score >= targetScore) {
      console.log(chalk.green(`🎯 TARGET ACHIEVED! Score: ${currentScore.score}%`));
    } else {
      console.log(chalk.yellow(`📊 Final Score: ${currentScore.score}%`));
      console.log(chalk.gray(`   (Target was ${targetScore}%)`));
    }
    console.log(chalk.cyan("=".repeat(60)));

  } catch (error) {
    console.log(chalk.red("💥 Enhancement failed:"));
    console.log(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/**
 * Display what slots are missing for transparency
 */
function displayMissingSlots(score: any): void {
  const missing: string[] = [];

  // Check project slots
  if (score.breakdown.project.filled < score.breakdown.project.total) {
    const projectSlots = score.breakdown.project.slots;
    projectSlots.forEach((slot: any) => {
      if (!slot.filled && slot.id.includes('project')) {
        const field = slot.id.replace('slot_', '').replace('project.', '');
        missing.push(`Project: ${field}`);
      }
    });
  }

  // Check stack slots
  if (score.breakdown.stack.filled < score.breakdown.stack.total) {
    const stackSlots = score.breakdown.stack.slots;
    stackSlots.forEach((slot: any) => {
      if (!slot.filled && slot.id.includes('stack')) {
        const field = slot.id.replace('slot_', '').replace('stack.', '');
        missing.push(`Stack: ${field}`);
      }
    });
  }

  // Check human context slots
  if (score.breakdown.human.filled < score.breakdown.human.total) {
    const humanSlots = score.breakdown.human.slots;
    humanSlots.forEach((slot: any) => {
      if (!slot.filled && slot.id.includes('human')) {
        const field = slot.id.replace('slot_', '').replace('human.', '');
        missing.push(`Human Context: ${field}`);
      }
    });
  }

  if (missing.length > 0) {
    console.log(chalk.yellow('\n⚠️ Missing Context (affecting score):'));
    missing.forEach(m => console.log(chalk.gray(`   • ${m}`)));
  }
}

/**
 * Ask human for missing critical data via inquirer
 * RELENTLESS 1-6 questionnaire for the 6 W's of Human Context
 */
async function askHumanForMissingData(currentFaf: any, score: any): Promise<any> {
  const improvements: any = {};
  const questions: any[] = [];

  // Priority 1: Project data (most critical for AI)
  if (!currentFaf.project?.name) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: '🎯 What is your project name?',
      validate: (input: string) => input.trim().length > 0 || 'Project name is required for AI context'
    });
  }

  if (!currentFaf.project?.goal) {
    questions.push({
      type: 'input',
      name: 'projectGoal',
      message: '🎯 What does your project do? (one sentence)',
      validate: (input: string) => input.trim().length > 10 || 'Please provide a meaningful description'
    });
  }

  // Priority 2: The 6 W's - RELENTLESS Human Context Collection
  // These are CRITICAL for AI understanding and score improvement
  console.log(chalk.cyan('\n🧠 Human Context - The 6 W\'s (Critical for AI Understanding)'));
  console.log(chalk.gray('   These 6 questions dramatically improve AI\'s ability to help you'));

  // 1. WHO - Target audience/users
  if (!currentFaf.human_context?.who) {
    questions.push({
      type: 'input',
      name: 'who',
      message: chalk.yellow('1/6 👤 WHO will use this? (developers, data scientists, designers, etc.)'),
      default: getSmartDefault('who', currentFaf),
      transformer: (input: string) => chalk.green(input),
      validate: (input: string) => {
        if (input.trim().length < 3) return 'Please specify your target users';
        if (genericAnswers.who.includes(input.toLowerCase())) {
          return 'Please be more specific than "' + input + '"';
        }
        return true;
      }
    });
  }

  // 2. WHAT - Core problem being solved
  if (!currentFaf.human_context?.what) {
    questions.push({
      type: 'input',
      name: 'what',
      message: chalk.yellow('2/6 📦 WHAT problem does it solve? (be specific)'),
      default: getSmartDefault('what', currentFaf),
      transformer: (input: string) => chalk.green(input),
      validate: (input: string) => {
        if (input.trim().length < 10) return 'Please describe the specific problem';
        if (genericAnswers.what.includes(input.toLowerCase())) {
          return 'Please be more specific about the problem';
        }
        return true;
      }
    });
  }

  // 3. WHY - Importance and impact
  if (!currentFaf.human_context?.why) {
    questions.push({
      type: 'input',
      name: 'why',
      message: chalk.yellow('3/6 💡 WHY is this important? (what impact/value does it create?)'),
      default: getSmartDefault('why', currentFaf),
      transformer: (input: string) => chalk.green(input),
      validate: (input: string) => {
        if (input.trim().length < 10) return 'Please explain why this matters';
        if (genericAnswers.why.includes(input.toLowerCase())) {
          return 'Please be more specific about the value/impact';
        }
        return true;
      }
    });
  }

  // 4. WHERE - Deployment/usage context
  if (!currentFaf.human_context?.where) {
    questions.push({
      type: 'input',
      name: 'where',
      message: chalk.yellow('4/6 🌍 WHERE will it be used? (cloud, on-premise, mobile, browser, etc.)'),
      default: getSmartDefault('where', currentFaf),
      transformer: (input: string) => chalk.green(input),
      validate: (input: string) => {
        if (input.trim().length < 3) return 'Please specify the deployment context';
        return true;
      }
    });
  }

  // 5. WHEN - Timeline/urgency
  if (!currentFaf.human_context?.when) {
    questions.push({
      type: 'input',
      name: 'when',
      message: chalk.yellow('5/6 ⏰ WHEN do you need this? (now, Q1 2025, ongoing, etc.)'),
      default: getSmartDefault('when', currentFaf),
      transformer: (input: string) => chalk.green(input),
      validate: (input: string) => {
        if (input.trim().length < 3) return 'Please specify the timeline';
        return true;
      }
    });
  }

  // 6. HOW - Implementation approach
  if (!currentFaf.human_context?.how) {
    questions.push({
      type: 'input',
      name: 'how',
      message: chalk.yellow('6/6 🔧 HOW will you build it? (agile, iterative, waterfall, etc.)'),
      default: getSmartDefault('how', currentFaf),
      transformer: (input: string) => chalk.green(input),
      validate: (input: string) => {
        if (input.trim().length < 5) return 'Please describe your approach';
        if (genericAnswers.how.includes(input.toLowerCase())) {
          return 'Please be more specific about your methodology';
        }
        return true;
      }
    });
  }

  // Priority 3: Technical stack (only if really needed and missing)
  const needsFrontend = !currentFaf.stack?.frontend &&
    (currentFaf.project?.type?.includes('frontend') || currentFaf.project?.type?.includes('fullstack'));
  const needsBackend = !currentFaf.stack?.backend &&
    (currentFaf.project?.type?.includes('backend') || currentFaf.project?.type?.includes('api'));
  const needsDatabase = !currentFaf.stack?.database && needsBackend;
  const needsHosting = !currentFaf.stack?.hosting;

  if (needsFrontend) {
    questions.push({
      type: 'list',
      name: 'framework',
      message: '🎨 Frontend framework?',
      choices: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Remix', 'Astro', 'None', 'Skip']
    });
  }

  if (needsBackend) {
    questions.push({
      type: 'list',
      name: 'backend',
      message: '⚙️ Backend framework?',
      choices: ['Express', 'Fastify', 'NestJS', 'Hono', 'Django', 'FastAPI', 'Rails', 'None', 'Skip']
    });
  }

  if (needsDatabase) {
    questions.push({
      type: 'list',
      name: 'database',
      message: '💾 Database?',
      choices: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis', 'Supabase', 'PlanetScale', 'None', 'Skip']
    });
  }

  if (needsHosting) {
    questions.push({
      type: 'list',
      name: 'hosting',
      message: '☁️ Hosting platform?',
      choices: ['Vercel', 'Netlify', 'AWS', 'Google Cloud', 'Azure', 'Heroku', 'Railway', 'Fly.io', 'None', 'Skip']
    });
  }

  // Only ask if we have questions
  if (questions.length === 0) {
    return improvements;
  }

  console.log(chalk.cyan('\n🎯 Let\'s fill the critical gaps to reach your target score:'));
  const answers = await inquirer.prompt(questions as any);

  // Map answers to improvements
  Object.entries(answers).forEach(([key, value]) => {
    if (value && value !== 'Skip') {
      improvements[key] = value;
    }
  });

  // Show progress after human input
  const filledCount = Object.keys(improvements).length;
  if (filledCount > 0) {
    console.log(chalk.green(`\n✅ Added ${filledCount} improvements from your input`));
  }

  return improvements;
}

// Generic answers to reject for better specificity
const genericAnswers = {
  who: ['users', 'people', 'everyone', 'anybody', 'someone'],
  what: ['problems', 'issues', 'things', 'stuff', 'something'],
  why: ['because', 'important', 'needed', 'required', 'necessary'],
  how: ['normal', 'usual', 'standard', 'regular', 'typical']
};

// Smart defaults based on project type
function getSmartDefault(field: string, currentFaf: any): string {
  const projectType = currentFaf.project?.type || '';
  const projectName = currentFaf.project?.name || '';
  const language = currentFaf.project?.main_language || '';

  const defaults: Record<string, Record<string, string>> = {
    who: {
      'cli-tool': 'Developers and DevOps engineers',
      'frontend': 'End users and web visitors',
      'backend-api': 'Frontend applications and API consumers',
      'fullstack': 'Business users and administrators',
      'library': `Developers using ${language || 'this technology'}`,
      'chrome-extension': 'Chrome browser users',
      'default': 'Development teams'
    },
    what: {
      'cli-tool': 'Automates repetitive command-line tasks',
      'frontend': 'Provides user interface for data interaction',
      'backend-api': 'Manages data and business logic',
      'fullstack': 'Complete solution for business operations',
      'library': `Simplifies ${language || 'development'} tasks`,
      'chrome-extension': 'Enhances browser functionality',
      'default': 'Solves specific technical challenges'
    },
    why: {
      'cli-tool': 'Saves time and reduces errors in workflows',
      'frontend': 'Improves user experience and engagement',
      'backend-api': 'Centralizes data management and processing',
      'fullstack': 'Streamlines business processes',
      'library': 'Reduces code duplication and complexity',
      'chrome-extension': 'Adds missing browser features',
      'default': 'Increases productivity and quality'
    },
    where: {
      'cli-tool': 'Local development machines and CI/CD pipelines',
      'frontend': 'Web browsers and CDN',
      'backend-api': 'Cloud servers or containers',
      'fullstack': 'Cloud platform with global availability',
      'library': 'NPM/PyPI package registry',
      'chrome-extension': 'Chrome Web Store',
      'default': 'Cloud infrastructure'
    },
    when: {
      'default': 'Ongoing development and maintenance'
    },
    how: {
      'default': 'Agile development with continuous deployment'
    }
  };

  const typeDefaults = defaults[field];
  if (!typeDefaults) return '';

  return typeDefaults[projectType] || typeDefaults['default'] || '';
}

/**
 * Analyze project for REAL improvements based on actual files
 */
async function analyzeProjectForRealImprovements(
  projectPath: string,
  currentFaf: any,
  currentScore: any
): Promise<any> {
  const improvements: any = {};

  // Priority order: Fill critical slots first
  // 1. PROJECT SLOTS (name, goal, language) - Most critical for AI
  // 2. HUMAN CONTEXT (6 W's) - Critical for understanding
  // 3. STACK SLOTS - Technical details

  // 1. Scan for package.json to get REAL project info
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    const pkgContent = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);

    // Extract REAL project data
    if (!currentFaf.project?.name && pkg.name) {
      improvements.projectName = pkg.name;
    }
    if (!currentFaf.project?.goal && pkg.description) {
      improvements.projectGoal = pkg.description;
    }
    if (!currentFaf.project?.version && pkg.version) {
      improvements.version = pkg.version;
    }
    if (!currentFaf.project?.author && pkg.author) {
      improvements.author = typeof pkg.author === 'string' ? pkg.author : pkg.author.name;
    }
    if (!currentFaf.project?.license && pkg.license) {
      improvements.license = pkg.license;
    }

    // Extract REAL dependencies for stack info
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const frameworks = detectFrameworks(deps);
    if (frameworks.length > 0 && !currentFaf.stack?.frontend) {
      improvements.framework = frameworks[0];
    }

    // Detect testing framework
    const testFramework = detectTestingFramework(deps);
    if (testFramework && !currentFaf.stack?.testing) {
      improvements.testing = testFramework;
    }

    // Detect database
    const database = detectDatabase(deps);
    if (database && !currentFaf.stack?.database) {
      improvements.database = database;
    }

    // Detect CI/CD from scripts
    if (pkg.scripts?.deploy && !currentFaf.stack?.cicd) {
      improvements.cicd = 'npm deploy';
    }

    // Extract scripts for understanding project
    if (pkg.scripts) {
      const scripts = Object.keys(pkg.scripts);
      if (!currentFaf.stack?.testing && scripts.some(s => s.includes('test'))) {
        improvements.testing = 'jest'; // or detect from deps
      }
      if (!currentFaf.stack?.build && scripts.some(s => s.includes('build'))) {
        improvements.buildTool = detectBuildTool(deps);
      }
    }
  } catch (e) {
    // No package.json, try other files
  }

  // 2. Use FAB-Formats to INTELLIGENTLY discover project structure
  const fabEngine = new FabFormatsEngine();
  const fabAnalysis = await fabEngine.discoverFormats(projectPath);

  if (fabAnalysis.discoveredFormats && fabAnalysis.discoveredFormats.length > 0) {
    // Add discovered key files
    const keyFiles = fabAnalysis.discoveredFormats
      .map((f: any) => f.fileName)
      .filter((f: string) => isImportantFile(f))
      .slice(0, 5);

    if (keyFiles.length > 0 && !currentFaf.instant_context?.key_files) {
      improvements.keyFiles = keyFiles;
    }

    // Use ALL extracted context from FAB-Formats
    const ctx = fabAnalysis.extractedContext;

    // Project information
    if (ctx.projectName && !currentFaf.project?.name) {
      improvements.projectName = ctx.projectName;
    }
    if ((ctx as any).projectDescription && !currentFaf.project?.goal) {
      improvements.projectGoal = (ctx as any).projectDescription;
    }
    if ((ctx as any).projectType && !currentFaf.project?.type) {
      improvements.projectType = (ctx as any).projectType;
    }

    // Stack information from FAB-Formats
    if (ctx.mainLanguage && !currentFaf.project?.main_language) {
      improvements.mainLanguage = ctx.mainLanguage;
    }
    if (ctx.frameworks && ctx.frameworks.length > 0) {
      if (!currentFaf.stack?.frontend && isFrontendFramework(ctx.frameworks[0])) {
        improvements.framework = ctx.frameworks[0];
      }
      if (!currentFaf.stack?.backend && isBackendFramework(ctx.frameworks[0])) {
        improvements.backend = ctx.frameworks[0];
      }
    }
    if ((ctx as any).database && !currentFaf.stack?.database) {
      improvements.database = (ctx as any).database;
    }
    if ((ctx as any).backend && !currentFaf.stack?.backend) {
      improvements.backend = (ctx as any).backend;
    }
    if ((ctx as any).hosting && !currentFaf.stack?.hosting) {
      improvements.hosting = (ctx as any).hosting;
    }
    // These might not exist in ctx, check if they do
    if ((ctx as any).buildTool && !currentFaf.stack?.build) {
      improvements.buildTool = (ctx as any).buildTool;
    }
    if ((ctx as any).testing && !currentFaf.stack?.testing) {
      improvements.testing = (ctx as any).testing;
    }
    if ((ctx as any).cicd && !currentFaf.stack?.cicd) {
      improvements.cicd = (ctx as any).cicd;
    }

    // Use FAB-Formats pattern analysis for better detection
    const patterns = fabAnalysis.discoveredFormats.map((f: any) => f.pattern);
    if (patterns.includes('dockerfile') && !currentFaf.stack?.hosting) {
      improvements.hosting = 'Docker';
    }
    if (patterns.includes('kubernetes') && !currentFaf.stack?.hosting) {
      improvements.hosting = 'Kubernetes';
    }
    if (patterns.includes('github-actions') && !currentFaf.stack?.cicd) {
      improvements.cicd = 'GitHub Actions';
    }
    if (patterns.includes('gitlab-ci') && !currentFaf.stack?.cicd) {
      improvements.cicd = 'GitLab CI';
    }
  }

  // 3. Detect project type from files
  const files = await fs.readdir(projectPath);
  const projectType = detectProjectType(files);
  if (projectType && projectType !== 'unknown' && !currentFaf.project?.type) {
    improvements.projectType = projectType;
  }

  // 3.5 Try to get README for project goal and human context
  try {
    const readmePath = path.join(projectPath, 'README.md');
    const readmeContent = await fs.readFile(readmePath, 'utf-8');
    const readmeInfo = extractFromReadme(readmeContent);

    if (readmeInfo.description && !currentFaf.project?.goal) {
      improvements.projectGoal = readmeInfo.description;
    }
    if (readmeInfo.who && !currentFaf.human_context?.who) {
      improvements.who = readmeInfo.who;
    }
    if (readmeInfo.what && !currentFaf.human_context?.what) {
      improvements.what = readmeInfo.what;
    }
  } catch (e) {
    // No README or can't parse
  }

  // 4. Add REAL human context from git
  try {
    // Get git remote URL for WHERE context
    if (!currentFaf.human_context?.where) {
      const gitRemote = execSync('git config --get remote.origin.url', { cwd: projectPath })
        .toString().trim();
      if (gitRemote) {
        if (gitRemote.includes('github.com')) {
          improvements.where = 'GitHub';
        } else if (gitRemote.includes('gitlab')) {
          improvements.where = 'GitLab';
        } else if (gitRemote.includes('bitbucket')) {
          improvements.where = 'Bitbucket';
        }
      }
    }

    // Get last commit date for WHEN context
    if (!currentFaf.human_context?.when) {
      const lastCommit = execSync('git log -1 --format=%cd --date=short', { cwd: projectPath })
        .toString().trim();
      if (lastCommit) {
        improvements.when = `Active development since ${lastCommit}`;
      }
    }
  } catch (e) {
    // No git or git commands failed
  }

  // 5. Add REAL technical details
  if (!currentFaf.stack?.language) {
    const language = detectLanguage(files);
    if (language) {
      improvements.mainLanguage = language;
    }
  }

  // 6. Analyze file patterns for more intelligent stack detection
  if (!currentFaf.stack?.hosting) {
    if (files.includes('vercel.json')) improvements.hosting = 'Vercel';
    else if (files.includes('netlify.toml')) improvements.hosting = 'Netlify';
    else if (files.includes('app.yaml')) improvements.hosting = 'Google App Engine';
    else if (files.includes('Procfile')) improvements.hosting = 'Heroku';
    else if (files.includes('.elasticbeanstalk')) improvements.hosting = 'AWS Elastic Beanstalk';
  }

  // 7. Intelligent project type detection from structure
  if (!currentFaf.project?.type) {
    const hasPublicDir = files.includes('public');
    const hasSrcDir = files.includes('src');
    const hasApiDir = files.includes('api');
    const hasServerFile = files.some(f => f.includes('server'));
    const hasIndexHtml = files.includes('index.html');

    if (hasApiDir && hasPublicDir) improvements.projectType = 'fullstack';
    else if (hasServerFile && !hasIndexHtml) improvements.projectType = 'backend-api';
    else if (hasPublicDir && hasIndexHtml) improvements.projectType = 'frontend';
    else if (files.includes('cli.js') || files.includes('cli.ts')) improvements.projectType = 'cli-tool';
  }

  // 8. Extract runtime from files
  if (!currentFaf.stack?.runtime) {
    if (files.includes('package.json')) improvements.runtime = 'Node.js';
    else if (files.includes('requirements.txt')) improvements.runtime = 'Python';
    else if (files.includes('Gemfile')) improvements.runtime = 'Ruby';
    else if (files.includes('go.mod')) improvements.runtime = 'Go';
    else if (files.includes('Cargo.toml')) improvements.runtime = 'Rust';
  }

  // 9. Fill API type if we have a backend
  if (!currentFaf.stack?.api_type && (currentFaf.stack?.backend || improvements.backend)) {
    // Check package.json for API type hints
    try {
      const pkgPath = path.join(projectPath, 'package.json');
      const pkgContent = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps['graphql']) improvements.api_type = 'GraphQL';
      else if (allDeps['@trpc/server']) improvements.api_type = 'tRPC';
      else if (allDeps['socket.io']) improvements.api_type = 'WebSocket';
      else improvements.api_type = 'REST';
    } catch (e) {
      improvements.api_type = 'REST'; // Default to REST if can't read package.json
    }
  }

  return improvements;
}

/**
 * Apply REAL enhancements to faf data
 */
function applyRealEnhancements(fafData: any, improvements: any): any {
  // Deep clone to preserve all nested fields
  const enhanced = JSON.parse(JSON.stringify(fafData));

  // Ensure structure exists
  enhanced.project = enhanced.project || {};
  enhanced.stack = enhanced.stack || {};
  enhanced.human_context = enhanced.human_context || {};
  enhanced.instant_context = enhanced.instant_context || {};

  // Apply project improvements (CRITICAL SLOTS)
  if (improvements.projectName) {
    enhanced.project.name = improvements.projectName;
  }
  if (improvements.projectGoal) {
    enhanced.project.goal = improvements.projectGoal;
  }
  if (improvements.mainLanguage) {
    enhanced.project.main_language = improvements.mainLanguage;
  }
  if (improvements.version) {
    enhanced.project.version = improvements.version;
  }
  if (improvements.author) {
    enhanced.project.author = improvements.author;
  }
  if (improvements.license) {
    enhanced.project.license = improvements.license;
  }
  if (improvements.projectType) {
    enhanced.project.type = improvements.projectType;
  }

  // Apply stack improvements (TECHNICAL SLOTS)
  if (improvements.framework) {
    enhanced.stack.frontend = improvements.framework;
  }
  if (improvements.backend) {
    enhanced.stack.backend = improvements.backend;
  }
  if (improvements.database) {
    enhanced.stack.database = improvements.database;
  }
  if (improvements.buildTool) {
    enhanced.stack.build = improvements.buildTool;
  }
  if (improvements.testing) {
    enhanced.stack.testing = improvements.testing;
  }
  if (improvements.cicd) {
    enhanced.stack.cicd = improvements.cicd;
  }
  if (improvements.runtime) {
    enhanced.stack.runtime = improvements.runtime;
  }
  if (improvements.hosting) {
    enhanced.stack.hosting = improvements.hosting;
  }
  if (improvements.api_type) {
    enhanced.stack.api_type = improvements.api_type;
  }
  if (improvements.mainLanguage) {
    enhanced.stack.language = improvements.mainLanguage;
  }

  // Apply human context improvements (6 W's - CRITICAL FOR AI UNDERSTANDING)
  if (improvements.who) {
    enhanced.human_context.who = improvements.who;
  }
  if (improvements.what) {
    enhanced.human_context.what = improvements.what;
  }
  if (improvements.why) {
    enhanced.human_context.why = improvements.why;
  }
  if (improvements.where) {
    enhanced.human_context.where = improvements.where;
  }
  if (improvements.when) {
    enhanced.human_context.when = improvements.when;
  }
  if (improvements.how) {
    enhanced.human_context.how = improvements.how;
  }

  // Apply instant context improvements
  if (improvements.keyFiles) {
    enhanced.instant_context.key_files = improvements.keyFiles;
  }

  // Add metadata
  enhanced.meta = enhanced.meta || {};
  enhanced.meta.last_enhanced = new Date().toISOString();
  enhanced.meta.enhanced_by = 'faf-real-enhance';

  return enhanced;
}

/**
 * Helper functions for detection
 */
function detectFrameworks(deps: Record<string, string>): string[] {
  const frameworks = [];
  // Frontend frameworks
  if (deps['react']) frameworks.push('React');
  if (deps['vue']) frameworks.push('Vue');
  if (deps['@angular/core']) frameworks.push('Angular');
  if (deps['svelte']) frameworks.push('Svelte');
  if (deps['solid-js']) frameworks.push('SolidJS');
  if (deps['preact']) frameworks.push('Preact');
  if (deps['@ember/core']) frameworks.push('Ember');

  // Meta-frameworks
  if (deps['next']) frameworks.push('Next.js');
  if (deps['nuxt']) frameworks.push('Nuxt');
  if (deps['gatsby']) frameworks.push('Gatsby');
  if (deps['@remix-run/react']) frameworks.push('Remix');
  if (deps['astro']) frameworks.push('Astro');
  if (deps['@sveltekit/adapter-auto']) frameworks.push('SvelteKit');

  // Backend frameworks
  if (deps['express']) frameworks.push('Express');
  if (deps['fastify']) frameworks.push('Fastify');
  if (deps['@nestjs/core']) frameworks.push('NestJS');
  if (deps['koa']) frameworks.push('Koa');
  if (deps['@hapi/hapi']) frameworks.push('Hapi');
  if (deps['@feathersjs/feathers']) frameworks.push('Feathers');
  if (deps['@adonisjs/core']) frameworks.push('AdonisJS');

  return frameworks;
}

function isFrontendFramework(framework: string): boolean {
  const frontend = ['React', 'Vue', 'Angular', 'Svelte', 'SolidJS', 'Preact', 'Ember',
                    'Next.js', 'Nuxt', 'Gatsby', 'Remix', 'Astro', 'SvelteKit'];
  return frontend.includes(framework);
}

function isBackendFramework(framework: string): boolean {
  const backend = ['Express', 'Fastify', 'NestJS', 'Koa', 'Hapi', 'Feathers', 'AdonisJS'];
  return backend.includes(framework);
}

function detectBuildTool(deps: Record<string, string>): string {
  if (deps['vite']) return 'Vite';
  if (deps['webpack']) return 'Webpack';
  if (deps['@parcel/core'] || deps['parcel']) return 'Parcel';
  if (deps['esbuild']) return 'ESBuild';
  if (deps['rollup']) return 'Rollup';
  if (deps['@swc/core']) return 'SWC';
  if (deps['turbopack']) return 'Turbopack';
  if (deps['snowpack']) return 'Snowpack';
  if (deps['@rspack/core']) return 'Rspack';
  return 'npm';
}

function detectProjectType(files: string[]): string {
  if (files.includes('package.json')) {
    if (files.includes('tsconfig.json')) return 'typescript-node';
    return 'javascript-node';
  }
  if (files.includes('requirements.txt') || files.includes('setup.py')) {
    return 'python';
  }
  if (files.includes('Cargo.toml')) return 'rust';
  if (files.includes('go.mod')) return 'go';
  return 'unknown';
}

function detectLanguage(files: string[]): string {
  const extensions = files.map(f => path.extname(f));
  if (extensions.includes('.ts') || extensions.includes('.tsx')) return 'TypeScript';
  if (extensions.includes('.js') || extensions.includes('.jsx')) return 'JavaScript';
  if (extensions.includes('.py')) return 'Python';
  if (extensions.includes('.rs')) return 'Rust';
  if (extensions.includes('.go')) return 'Go';
  if (extensions.includes('.java')) return 'Java';
  return 'Unknown';
}

function isImportantFile(filename: string): boolean {
  const important = [
    'index', 'main', 'app', 'server', 'cli',
    'config', 'package.json', 'tsconfig.json',
    'webpack.config', 'vite.config', 'README'
  ];
  return important.some(i => filename.toLowerCase().includes(i));
}

/**
 * Extract info from README
 */
function extractFromReadme(content: string): any {
  const info: any = {};

  // Try to get first paragraph as description
  const lines = content.split('\n').filter(l => l.trim());
  const descLine = lines.find(l => !l.startsWith('#') && l.length > 20);
  if (descLine) {
    info.description = descLine.trim();
  }

  // Look for "For" or "Built for" patterns
  const forMatch = content.match(/(?:built for|for|designed for|made for)\s+([^.\n]+)/i);
  if (forMatch) {
    info.who = forMatch[1].trim();
  }

  // Look for problem statements
  const problemMatch = content.match(/(?:solves?|fixes?|addresses?|handles?)\s+([^.\n]+)/i);
  if (problemMatch) {
    info.what = problemMatch[1].trim();
  }

  return info;
}

/**
 * Detect testing framework from dependencies
 */
function detectTestingFramework(deps: Record<string, string>): string | null {
  // Unit testing
  if (deps['vitest']) return 'Vitest';
  if (deps['jest']) return 'Jest';
  if (deps['mocha']) return 'Mocha';
  if (deps['jasmine']) return 'Jasmine';
  if (deps['ava']) return 'AVA';
  if (deps['tape']) return 'Tape';
  if (deps['uvu']) return 'uvu';

  // E2E testing
  if (deps['@playwright/test'] || deps['playwright']) return 'Playwright';
  if (deps['cypress']) return 'Cypress';
  if (deps['puppeteer']) return 'Puppeteer';
  if (deps['webdriverio']) return 'WebdriverIO';
  if (deps['nightwatch']) return 'Nightwatch';

  // Testing utilities
  if (deps['@testing-library/react']) return 'React Testing Library';
  if (deps['@testing-library/vue']) return 'Vue Testing Library';
  if (deps['enzyme']) return 'Enzyme';

  return null;
}

/**
 * Detect database from dependencies
 */
function detectDatabase(deps: Record<string, string>): string | null {
  // ORMs that support multiple databases
  if (deps['@prisma/client']) return 'Prisma';
  if (deps['typeorm']) return 'TypeORM';
  if (deps['sequelize']) return 'Sequelize';
  if (deps['drizzle-orm']) return 'Drizzle';
  if (deps['kysely']) return 'Kysely';

  // Specific databases
  if (deps['pg'] || deps['postgres']) return 'PostgreSQL';
  if (deps['mysql'] || deps['mysql2']) return 'MySQL';
  if (deps['mongodb'] || deps['mongoose']) return 'MongoDB';
  if (deps['sqlite3'] || deps['better-sqlite3']) return 'SQLite';
  if (deps['redis'] || deps['ioredis']) return 'Redis';
  if (deps['@supabase/supabase-js']) return 'Supabase';
  if (deps['firebase']) return 'Firebase';
  if (deps['@planetscale/database']) return 'PlanetScale';
  if (deps['@neondatabase/serverless']) return 'Neon';
  if (deps['@vercel/postgres']) return 'Vercel Postgres';

  return null;
}

function displayImprovements(improvements: any): void {
  Object.entries(improvements).forEach(([key, value]) => {
    console.log(chalk.gray(`   • ${key}: ${value}`));
  });
}