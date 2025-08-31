/**
 * 🔄 faf sync - Sync Command
 * Sync .faf file with project changes (package.json, git, etc.)
 */

import chalk from "chalk";
import { promises as fs } from "fs";
import * as YAML from "yaml";
import { findFafFile, findPackageJson } from "../utils/file-utils";

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

    console.log(chalk.blue(`🔄 Syncing: ${fafPath}`));

    // Read current .faf file
    const content = await fs.readFile(fafPath, "utf-8");
    const fafData = YAML.parse(content);

    // Detect changes
    const changes = await detectProjectChanges(fafData);

    if (changes.length === 0) {
      console.log(chalk.green("✅ .faf file is up to date"));
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
    const updatedContent = YAML.stringify(fafData);
    await fs.writeFile(fafPath, updatedContent, "utf-8");

    console.log(chalk.green("✅ .faf file synced successfully"));
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
