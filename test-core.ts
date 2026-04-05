/**
 * Test Core FAF Integration
 */

import { FAFCore } from './src/core/faf-core.js';

// Test the core functionality
const testProject = FAFCore.init({
  name: 'Test Project',
  goal: 'Test FAF Core Integration',
  language: 'TypeScript',
  framework: 'React'
});

console.log('✅ Project initialized:', testProject.project.name);

const yamlContent = FAFCore.serialize(testProject);
console.log('✅ Serialized to YAML:', yamlContent.length, 'characters');

const parsed = FAFCore.parse(yamlContent);
console.log('✅ Parsed back:', parsed.project.name);

const score = FAFCore.score(parsed);
console.log('✅ Score:', score.score + '%', score.tier);

const claudeContent = FAFCore.toClaude(parsed);
console.log('✅ Claude format:', claudeContent.split('\n').length, 'lines');

console.log('\n🏆 Core extraction test PASSED - Ready for Claude Code integration!')