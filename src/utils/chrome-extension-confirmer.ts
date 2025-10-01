/**
 * 🎯 Chrome Extension Interactive Confirmation
 * Google-style "Did you mean?" with inquirer
 */

import inquirer from 'inquirer';
import { chalk } from '../fix-once/colors';
import { ChromeExtensionDetector } from './chrome-extension-detector';

export class ChromeExtensionConfirmer {

  /**
   * Ask user to confirm Chrome Extension detection
   */
  static async confirmDetection(
    text: string,
    confidence: 'medium' | 'low'
  ): Promise<boolean> {

    const messages = {
      medium: `🎯 Detected possible Chrome Extension from: "${chalk.yellow(text)}"`,
      low: `💭 Found extension-related terms in: "${chalk.gray(text)}"`
    };

    const questions = {
      medium: 'Did you mean to create a Chrome Extension?',
      low: 'Is this a Chrome Extension project?'
    };

    console.log();
    console.log(messages[confidence]);

    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: questions[confidence],
        default: confidence === 'medium'
      }
    ]);

    return confirmed;
  }

  /**
   * Show suggestions for common variations
   */
  static async selectFromSuggestions(input: string): Promise<string | null> {
    const suggestions = this.generateSuggestions(input);

    if (suggestions.length === 0) {
      return null;
    }

    console.log();
    console.log(chalk.cyan('🔍 Did you mean one of these?'));

    const { selection } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: 'Select project type:',
        choices: [
          ...suggestions.map(s => ({
            name: s.display,
            value: s.value
          })),
          new inquirer.Separator(),
          {
            name: 'None of these (continue as-is)',
            value: null
          }
        ]
      }
    ]);

    return selection;
  }

  /**
   * Generate smart suggestions based on input
   */
  private static generateSuggestions(input: string): Array<{ display: string; value: string }> {
    const normalized = input.toLowerCase();
    const suggestions = [];

    // Check for Chrome Extension indicators
    const ceDetection = ChromeExtensionDetector.detect(normalized);
    if (ceDetection.confidence !== 'none') {
      suggestions.push({
        display: '🧩 Chrome Extension - Browser extension for Chrome/Edge',
        value: 'chrome-extension'
      });
    }

    // Check for related types
    if (normalized.includes('browser') || normalized.includes('web')) {
      if (!suggestions.find(s => s.value === 'chrome-extension')) {
        suggestions.push({
          display: '🌐 Web Application - Traditional web app',
          value: 'web-app'
        });
      }
    }

    if (normalized.includes('ext') || normalized.includes('plugin')) {
      suggestions.push({
        display: '🔌 Browser Plugin/Extension',
        value: 'browser-extension'
      });
    }

    if (normalized.includes('popup') || normalized.includes('toolbar')) {
      suggestions.push({
        display: '📱 Chrome Extension with Popup UI',
        value: 'chrome-extension-popup'
      });
    }

    if (normalized.includes('script') || normalized.includes('inject')) {
      suggestions.push({
        display: '💉 Content Script Extension',
        value: 'chrome-extension-content'
      });
    }

    return suggestions;
  }

  /**
   * Interactive project type selector with fuzzy search
   */
  static async selectProjectType(currentInput?: string): Promise<string> {
    const projectTypes = [
      { name: '🧩 Chrome Extension', value: 'chrome-extension' },
      { name: '🌐 Web Application', value: 'web-app' },
      { name: '📱 Mobile App', value: 'mobile' },
      { name: '⚙️ CLI Tool', value: 'cli' },
      { name: '📚 Library/Package', value: 'library' },
      { name: '🔧 API/Backend', value: 'api' },
      { name: '🎮 Game', value: 'game' },
      { name: '🤖 Bot/Automation', value: 'bot' },
      { name: '📊 Data Science', value: 'data-science' },
      { name: '🎨 Other/Custom', value: 'other' }
    ];

    // If we have input, check for matches
    if (currentInput) {
      const detection = ChromeExtensionDetector.detect(currentInput);
      if (detection.confidence === 'high') {
        console.log(chalk.green('✅ Chrome Extension detected automatically!'));
        return 'chrome-extension';
      }
      if (detection.confidence === 'medium' || detection.confidence === 'low') {
        const confirmed = await this.confirmDetection(currentInput, detection.confidence);
        if (confirmed) {
          return 'chrome-extension';
        }
      }
    }

    const { projectType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: 'What type of project is this?',
        choices: projectTypes,
        default: currentInput ? this.guessDefault(currentInput) : 'web-app'
      }
    ]);

    return projectType;
  }

  /**
   * Guess the most likely default based on input
   */
  private static guessDefault(input: string): string {
    const normalized = input.toLowerCase();

    if (ChromeExtensionDetector.detect(normalized).confidence !== 'none') {
      return 'chrome-extension';
    }
    if (normalized.includes('api') || normalized.includes('backend')) {
      return 'api';
    }
    if (normalized.includes('cli') || normalized.includes('command')) {
      return 'cli';
    }
    if (normalized.includes('library') || normalized.includes('package')) {
      return 'library';
    }

    return 'web-app';
  }
}

/**
 * Example usage:
 *
 * Input: "chr ext for managing tabs"
 * → Shows: "🎯 Detected possible Chrome Extension"
 * → Asks: "Did you mean to create a Chrome Extension?" [Y/n]
 *
 * Input: "c e"
 * → Shows suggestions list with Chrome Extension highlighted
 *
 * Input: "extension"
 * → Shows: "💭 Found extension-related terms"
 * → Asks: "Is this a Chrome Extension project?" [y/N]
 */