/**
 * 🔄 faf sync - Sync Command
 * Sync .faf file with project changes (package.json, git, etc.)
 */

import { chalk } from "../fix-once/colors";
import { promises as fs } from "fs";
import { parse as parseYAML, stringify as stringifyYAML } from '../fix-once/yaml';
import path from "path";
import { findFafFile, findPackageJson } from "../utils/file-utils";
import { FAF_COLORS } from "../utils/championship-style";
import { FafDNAManager } from "../engines/faf-dna";

interface SyncOptions {
  auto?: boolean;
  dryRun?: boolean;
}

export async function syncFafFile(file?: string, options: SyncOptions = {}) {
  try {
    const fafPath = file || (await findFafFile());

    if (!fafPath) {
      console.log(chalk.red("❌ No .faf file found"));
      console.log(chalk.yellow('💡 Run "faf init" to create one'));
      process.exit(1);
    }

    console.log(FAF_COLORS.fafCyan(`🔄 Syncing: ${fafPath}`));

    // Read current .faf file
    const content = await fs.readFile(fafPath, "utf-8");

    // Auto-migrate markdown-style .faf files (legacy MCP v2.2.0)
    let fafData;
    try {
      fafData = parseYAML(content);
    } catch (parseError) {
      // Check if it's a markdown-style .faf file
      if (content.includes('## Context') || content.includes('## Stack') || content.includes('## Performance')) {
        console.log(FAF_COLORS.fafOrange('🔄 Detected legacy markdown-style .faf file'));
        console.log(chalk.dim('   Auto-migrating to YAML format...'));

        // Create backup
        const backupPath = `${fafPath}.markdown-backup-${Date.now()}`;
        await fs.copyFile(fafPath, backupPath);
        console.log(chalk.dim(`   📁 Backup saved: ${backupPath}`));

        // Convert markdown to YAML
        fafData = await convertMarkdownFafToYaml(content, fafPath);

        // Write new YAML format
        const yamlContent = stringifyYAML(fafData);
        await fs.writeFile(fafPath, yamlContent, 'utf-8');

        console.log(chalk.green('   ✅ Migration complete - now using YAML format'));

        // Create DNA for migrated project
        const projectRoot = path.dirname(fafPath);
        const dnaManager = new FafDNAManager(projectRoot);

        // Check if DNA already exists
        const existingDNA = await dnaManager.load();
        if (!existingDNA) {
          console.log(FAF_COLORS.fafCyan('   🧬 Creating DNA for your project...'));

          // Get initial score from migrated data
          const initialScore = parseInt(String(fafData.ai_score || '50').replace('%', ''));

          // Initialize DNA with birth certificate (false = legacy migration source)
          const dna = await dnaManager.birth(initialScore, false);
          await dnaManager.recordGrowth(initialScore, ['Migrated from legacy markdown format to YAML v2.5.0']);

          console.log(FAF_COLORS.fafGreen(`   ✅ DNA created! Certificate: ${dna.birthCertificate.certificate}`));
          console.log(FAF_COLORS.fafWhite(`   📊 Birth weight: ${initialScore}%`));
        }

        console.log('');
      } else {
        // Not markdown, re-throw original error
        throw parseError;
      }
    }

    // Detect changes
    const changes = await detectProjectChanges(fafData);

    if (changes.length === 0) {
      console.log(chalk.green("☑️ .faf file is up to date"));
      return;
    }

    // Show detected changes
    console.log(chalk.yellow(`⚡ Found ${changes.length} potential updates:`));
    changes.forEach((change, index) => {
      console.log(chalk.yellow(`   ${index + 1}. ${change.description}`));
      if (change.oldValue !== change.newValue) {
        console.log(
          chalk.gray(`      ${change.oldValue} → ${change.newValue}`),
        );
      }
    });

    if (options.dryRun) {
      console.log(chalk.blue("\n🔍 Dry run complete - no changes applied"));
      return;
    }

    // Apply changes
    if (options.auto) {
      console.log(chalk.blue("\n🤖 Auto-applying changes..."));

      // Create backup before applying changes
      const backupPath = `${fafPath}.backup-${Date.now()}`;
      await fs.copyFile(fafPath, backupPath);
      console.log(chalk.dim(`📁 Backup created: ${backupPath}`));

      applyChanges(fafData, changes);
    } else {
      // Interactive mode (simplified for now)
      console.log(
        chalk.yellow("\n💡 Run with --auto to apply changes automatically"),
      );
      console.log(chalk.yellow("   Or edit .faf file manually"));
      return;
    }

    // Update generated timestamp
    fafData.generated = new Date().toISOString();

    // Write updated .faf file
    const updatedContent = stringifyYAML(fafData);
    await fs.writeFile(fafPath, updatedContent, "utf-8");

    console.log(chalk.green("☑️ .faf file synced successfully"));
    console.log(chalk.gray(`   Applied ${changes.length} changes`));
  } catch (error) {
    console.log(chalk.red("💥 Sync failed:"));
    console.log(
      chalk.red(error instanceof Error ? error.message : String(error)),
    );
    process.exit(1);
  }
}

interface ProjectChange {
  path: string;
  description: string;
  oldValue: any;
  newValue: any;
  confidence: "high" | "medium" | "low";
}

async function detectProjectChanges(fafData: any): Promise<ProjectChange[]> {
  const changes: ProjectChange[] = [];

  try {
    // Check package.json changes
    const packageJsonPath = await findPackageJson();
    if (packageJsonPath) {
      const packageContent = await fs.readFile(packageJsonPath, "utf-8");
      const packageData = JSON.parse(packageContent);

      // Project name change (flat structure)
      if (packageData.name && packageData.name !== fafData.projectName) {
        changes.push({
          path: "projectName",
          description: "Project name changed in package.json",
          oldValue: fafData.projectName || "undefined",
          newValue: packageData.name,
          confidence: "high",
        });
      }

      // Description/goal change (flat structure)
      if (
        packageData.description &&
        packageData.description !== fafData.projectGoal
      ) {
        changes.push({
          path: "projectGoal",
          description: "Project description changed in package.json",
          oldValue: fafData.projectGoal || "undefined",
          newValue: packageData.description,
          confidence: "medium",
        });
      }

      // Dependencies changes - detect frameworks (flat structure)
      const deps = {
        ...packageData.dependencies,
        ...packageData.devDependencies,
      };

      // Check for framework changes
      if (deps.svelte && !fafData.framework?.includes("Svelte")) {
        changes.push({
          path: "framework",
          description: "Svelte dependency detected",
          oldValue: fafData.framework || "",
          newValue: "Svelte",
          confidence: "high",
        });
      }

      if (deps.react && !fafData.framework?.includes("React")) {
        changes.push({
          path: "framework",
          description: "React dependency detected",
          oldValue: fafData.framework || "",
          newValue: "React",
          confidence: "high",
        });
      }
      
      if (deps.vue && !fafData.framework?.includes("Vue")) {
        changes.push({
          path: "framework",
          description: "Vue dependency detected",
          oldValue: fafData.framework || "",
          newValue: "Vue",
          confidence: "high",
        });
      }

      if (deps["@angular/core"] && !fafData.framework?.includes("Angular")) {
        changes.push({
          path: "framework",
          description: "Angular dependency detected",
          oldValue: fafData.framework || "",
          newValue: "Angular",
          confidence: "high",
        });
      }

      // Check for CSS frameworks
      if (deps.tailwindcss && !fafData.cssFramework?.includes("Tailwind")) {
        changes.push({
          path: "cssFramework",
          description: "Tailwind CSS dependency detected",
          oldValue: fafData.cssFramework || "",
          newValue: "Tailwind CSS",
          confidence: "high",
        });
      }

      if (deps.bootstrap && !fafData.cssFramework?.includes("Bootstrap")) {
        changes.push({
          path: "cssFramework",
          description: "Bootstrap dependency detected",
          oldValue: fafData.cssFramework || "",
          newValue: "Bootstrap",
          confidence: "high",
        });
      }

      // Check for UI libraries
      if (deps["@mui/material"] && !fafData.uiLibrary?.includes("MUI")) {
        changes.push({
          path: "uiLibrary",
          description: "Material-UI (MUI) dependency detected",
          oldValue: fafData.uiLibrary || "",
          newValue: "Material-UI (MUI)",
          confidence: "high",
        });
      }

      if (deps.antd && !fafData.uiLibrary?.includes("Ant Design")) {
        changes.push({
          path: "uiLibrary",
          description: "Ant Design dependency detected",
          oldValue: fafData.uiLibrary || "",
          newValue: "Ant Design",
          confidence: "high",
        });
      }

      if (deps["@chakra-ui/react"] && !fafData.uiLibrary?.includes("Chakra")) {
        changes.push({
          path: "uiLibrary",
          description: "Chakra UI dependency detected",
          oldValue: fafData.uiLibrary || "",
          newValue: "Chakra UI",
          confidence: "high",
        });
      }

      // Check for state management
      if ((deps.redux || deps["@reduxjs/toolkit"]) && !fafData.stateManagement?.includes("Redux")) {
        changes.push({
          path: "stateManagement",
          description: "Redux dependency detected",
          oldValue: fafData.stateManagement || "",
          newValue: "Redux Toolkit",
          confidence: "high",
        });
      }

      if (deps.zustand && !fafData.stateManagement?.includes("Zustand")) {
        changes.push({
          path: "stateManagement",
          description: "Zustand dependency detected",
          oldValue: fafData.stateManagement || "",
          newValue: "Zustand",
          confidence: "high",
        });
      }

      if (deps.jotai && !fafData.stateManagement?.includes("Jotai")) {
        changes.push({
          path: "stateManagement",
          description: "Jotai dependency detected",
          oldValue: fafData.stateManagement || "",
          newValue: "Jotai",
          confidence: "high",
        });
      }

      // Check for build tools
      if (deps.vite && !fafData.buildTool?.includes("Vite")) {
        changes.push({
          path: "buildTool",
          description: "Vite build tool detected",
          oldValue: fafData.buildTool || "",
          newValue: "Vite",
          confidence: "high",
        });
      }

      if (deps.webpack && !fafData.buildTool?.includes("Webpack")) {
        changes.push({
          path: "buildTool",
          description: "Webpack build tool detected",
          oldValue: fafData.buildTool || "",
          newValue: "Webpack",
          confidence: "high",
        });
      }

    }


    // Check if generated timestamp is very old (30+ days)
    if (fafData.generated) {
      const generatedDate = new Date(fafData.generated);
      const daysSince =
        Math.abs(Date.now() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince > 30) {
        changes.push({
          path: "generated",
          description: `Generated timestamp is ${Math.round(daysSince)} days old`,
          oldValue: fafData.generated,
          newValue: new Date().toISOString(),
          confidence: "high",
        });
      }
    }
  } catch {
    // Continue with what we have
  }

  return changes;
}

function applyChanges(fafData: any, changes: ProjectChange[]): void {
  changes.forEach((change) => {
    if (change.confidence === "high" || change.confidence === "medium") {
      setNestedValue(fafData, change.path, change.newValue);
    }
  });
}

function setNestedValue(obj: any, path: string, value: any): void {
  // For flat .faf structure, path is just the direct property name
  obj[path] = value;
}

/**
 * Convert legacy markdown-style .faf to proper YAML format
 */
async function convertMarkdownFafToYaml(content: string, fafPath: string): Promise<any> {
  // Extract key info from markdown format
  const lines = content.split('\n');
  const projectLine = lines.find(l => l.startsWith('project:'));
  const versionLine = lines.find(l => l.startsWith('version:'));

  const projectName = projectLine ? projectLine.replace('project:', '').trim() : 'Unknown Project';
  const version = versionLine ? versionLine.replace('version:', '').trim() : '1.0.0';

  // Extract context section
  let contextText = '';
  let inContext = false;
  for (const line of lines) {
    if (line.startsWith('## Context')) {
      inContext = true;
      continue;
    }
    if (line.startsWith('## ')) {
      inContext = false;
    }
    if (inContext && line.trim()) {
      contextText += line.trim() + ' ';
    }
  }

  // Extract stack info
  const stackLines: string[] = [];
  let inStack = false;
  for (const line of lines) {
    if (line.startsWith('## Stack')) {
      inStack = true;
      continue;
    }
    if (line.startsWith('## ')) {
      inStack = false;
    }
    if (inStack && line.trim().startsWith('-')) {
      stackLines.push(line.trim().replace(/^-\s*/, ''));
    }
  }

  // Detect framework from stack
  let framework = 'None';
  let language = 'TypeScript';
  const stackStr = stackLines.join(' ').toLowerCase();

  if (stackStr.includes('svelte')) framework = 'SvelteKit';
  else if (stackStr.includes('react')) framework = 'React';
  else if (stackStr.includes('vue')) framework = 'Vue';
  else if (stackStr.includes('angular')) framework = 'Angular';

  if (stackStr.includes('typescript')) language = 'TypeScript';
  else if (stackStr.includes('javascript')) language = 'JavaScript';
  else if (stackStr.includes('python')) language = 'Python';

  // Build proper YAML structure
  return {
    faf_version: '2.5.0',
    ai_scoring_system: '2025-09-20',
    ai_score: '50%',
    ai_confidence: 'LOW',
    ai_value: '30_seconds_replaces_20_minutes_of_questions',
    ai_tldr: {
      project: `${projectName} - ${contextText.trim() || 'Migrated from legacy format'}`,
      stack: stackLines.join('/') || language,
      quality_bar: 'ZERO_ERRORS_F1_STANDARDS',
      current_focus: 'Production deployment preparation',
      your_role: 'Build features with perfect context'
    },
    instant_context: {
      what_building: contextText.trim() || 'Project migrated from legacy .faf format',
      tech_stack: stackLines.join('/') || language,
      main_language: language,
      deployment: 'None',
      key_files: ['package.json', 'tsconfig.json']
    },
    context_quality: {
      slots_filled: '10/21 (48%)',
      ai_confidence: 'LOW',
      handoff_ready: false,
      missing_context: [
        'CI/CD pipeline',
        'Database',
        'Human context (who/what/why/where/when/how)'
      ]
    },
    project: {
      name: projectName,
      goal: contextText.trim() || 'Migrated from legacy format',
      main_language: language,
      generated: new Date().toISOString(),
      mission: '🚀 Make Your AI Happy! 🧡 Trust-Driven 🤖',
      revolution: '30 seconds replaces 20 minutes of questions',
      brand: 'F1-Inspired Software Engineering - Championship AI Context',
      version: version,
      type: framework.toLowerCase()
    },
    ai_instructions: {
      priority_order: [
        '1. Read THIS .faf file first',
        '2. Check CLAUDE.md for session context',
        '3. Review package.json for dependencies'
      ],
      working_style: {
        code_first: true,
        explanations: 'minimal',
        quality_bar: 'zero_errors',
        testing: 'required'
      },
      warnings: [
        'Never modify dial components without approval',
        'All TypeScript must pass strict mode',
        'Test coverage required for new features'
      ]
    },
    stack: {
      frontend: framework !== 'None' ? framework : 'None',
      css_framework: 'None',
      ui_library: 'None',
      state_management: 'None',
      backend: stackLines.find(s => s.toLowerCase().includes('node')) ? 'Node.js' : 'None',
      runtime: stackLines.find(s => s.toLowerCase().includes('node')) ? 'Node.js' : 'None',
      database: 'None',
      build: 'Vite',
      package_manager: 'npm',
      api_type: stackLines.find(s => s.toLowerCase().includes('mcp')) ? 'MCP' : 'REST',
      hosting: 'None',
      cicd: 'None',
      testing: 'None',
      language: language
    },
    preferences: {
      quality_bar: 'zero_errors',
      commit_style: 'conventional_emoji',
      response_style: 'concise_code_first',
      explanation_level: 'minimal',
      communication: 'direct',
      testing: 'required',
      documentation: 'as_needed'
    },
    state: {
      phase: 'development',
      version: version,
      focus: 'production_deployment',
      status: 'green_flag',
      next_milestone: 'npm_publication',
      blockers: null
    },
    tags: {
      auto_generated: [
        projectName.toLowerCase().replace(/\s+/g, '-'),
        ...stackLines.map(s => s.toLowerCase())
      ],
      smart_defaults: [
        '.faf',
        'ai-ready',
        '2025',
        'software',
        'open-source'
      ],
      user_defined: null
    },
    human_context: {
      who: null,
      what: null,
      why: null,
      where: null,
      when: null,
      how: null,
      additional_context: null,
      context_score: 0,
      total_prd_score: 50,
      success_rate: '50%'
    },
    ai_scoring_details: {
      system_date: '2025-09-20',
      slot_based_percentage: 48,
      ai_score: 50,
      total_slots: 21,
      filled_slots: 10,
      scoring_method: 'Honest percentage - no fake minimums',
      trust_embedded: 'COUNT ONCE architecture - trust MY embedded scores'
    },
    meta: {
      last_enhanced: new Date().toISOString(),
      enhanced_by: 'faf-auto-migration'
    },
    projectName: projectName.toLowerCase().replace(/\s+/g, '-'),
    projectGoal: contextText.trim() || 'Migrated from legacy format',
    framework: framework,
    buildTool: 'Vite',
    generated: new Date().toISOString()
  };
}
