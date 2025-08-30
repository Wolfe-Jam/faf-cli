/**
 * Tests for .fafignore parser
 */

import { parseFafIgnore, shouldIgnore, createDefaultFafIgnore, getFileSizeLimit } from '../../src/utils/fafignore-parser';
import { promises as fs } from 'fs';
import * as path from 'path';

describe('FafIgnore Parser', () => {
  const testDir = path.join(__dirname, '../temp-fafignore');
  
  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, ignore
    }
  });

  describe('parseFafIgnore', () => {
    it('should return default patterns when no .fafignore exists', async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      const patterns = await parseFafIgnore(testDir);
      
      expect(patterns).toContain('node_modules/');
      expect(patterns).toContain('dist/');
      expect(patterns).toContain('.git/');
      expect(patterns).toContain('*.log');
      expect(patterns.length).toBeGreaterThan(10);
    });

    it('should parse custom .fafignore file and merge with defaults', async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      const customIgnore = `# Custom ignore patterns
my-custom-folder/
*.custom
temp-files/

# Comment should be ignored
debug.log`;

      await fs.writeFile(path.join(testDir, '.fafignore'), customIgnore);
      
      const patterns = await parseFafIgnore(testDir);
      
      expect(patterns).toContain('node_modules/'); // Default pattern
      expect(patterns).toContain('my-custom-folder/'); // Custom pattern
      expect(patterns).toContain('*.custom'); // Custom pattern
      expect(patterns).toContain('temp-files/'); // Custom pattern
      expect(patterns).toContain('debug.log'); // Custom pattern
      expect(patterns).not.toContain('# Comment should be ignored'); // Comments excluded
    });

    it('should handle empty lines and comments in .fafignore', async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      const fafIgnoreWithEmptyLines = `
# This is a comment
node_modules/

# Another comment

*.tmp


dist/
`;

      await fs.writeFile(path.join(testDir, '.fafignore'), fafIgnoreWithEmptyLines);
      
      const patterns = await parseFafIgnore(testDir);
      
      expect(patterns).toContain('*.tmp');
      expect(patterns).not.toContain(''); // Empty lines excluded
      expect(patterns).not.toContain('# This is a comment'); // Comments excluded
    });

    it('should remove duplicate patterns', async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      const duplicateIgnore = `node_modules/
dist/
node_modules/
*.log
dist/`;

      await fs.writeFile(path.join(testDir, '.fafignore'), duplicateIgnore);
      
      const patterns = await parseFafIgnore(testDir);
      
      const nodeModulesCount = patterns.filter(p => p === 'node_modules/').length;
      const distCount = patterns.filter(p => p === 'dist/').length;
      
      expect(nodeModulesCount).toBe(1);
      expect(distCount).toBe(1);
    });
  });

  describe('shouldIgnore', () => {
    const testPatterns = [
      'node_modules/',
      'dist/',
      '*.log',
      '*.tmp',
      '.env',
      'debug.txt'
    ];

    it('should ignore directory patterns', () => {
      expect(shouldIgnore('src/node_modules/package/index.js', testPatterns)).toBe(true);
      expect(shouldIgnore('node_modules/lodash/index.js', testPatterns)).toBe(true);
      expect(shouldIgnore('build/dist/app.js', testPatterns)).toBe(true);
      expect(shouldIgnore('dist/index.js', testPatterns)).toBe(true);
    });

    it('should ignore file extension patterns', () => {
      expect(shouldIgnore('app.log', testPatterns)).toBe(true);
      expect(shouldIgnore('src/debug.log', testPatterns)).toBe(true);
      expect(shouldIgnore('temp.tmp', testPatterns)).toBe(true);
      expect(shouldIgnore('data/cache.tmp', testPatterns)).toBe(true);
    });

    it('should ignore exact file matches', () => {
      expect(shouldIgnore('.env', testPatterns)).toBe(true);
      expect(shouldIgnore('config/.env', testPatterns)).toBe(true);
      expect(shouldIgnore('debug.txt', testPatterns)).toBe(true);
      expect(shouldIgnore('logs/debug.txt', testPatterns)).toBe(true);
    });

    it('should not ignore files that do not match patterns', () => {
      expect(shouldIgnore('src/index.js', testPatterns)).toBe(false);
      expect(shouldIgnore('README.md', testPatterns)).toBe(false);
      expect(shouldIgnore('package.json', testPatterns)).toBe(false);
      expect(shouldIgnore('src/components/Button.tsx', testPatterns)).toBe(false);
    });

    it('should handle Windows-style paths', () => {
      expect(shouldIgnore('src\\node_modules\\package\\index.js', testPatterns)).toBe(true);
      expect(shouldIgnore('build\\dist\\app.js', testPatterns)).toBe(true);
      expect(shouldIgnore('logs\\app.log', testPatterns)).toBe(true);
    });

    it('should handle complex nested paths', () => {
      expect(shouldIgnore('projects/web-app/node_modules/@types/node/index.d.ts', testPatterns)).toBe(true);
      expect(shouldIgnore('backend/api/dist/controllers/user.js', testPatterns)).toBe(true);
      expect(shouldIgnore('frontend/build/logs/webpack.log', testPatterns)).toBe(true);
    });
  });

  describe('createDefaultFafIgnore', () => {
    it('should create .fafignore file with default content', async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      await createDefaultFafIgnore(testDir);
      
      const fafIgnorePath = path.join(testDir, '.fafignore');
      const exists = await fs.access(fafIgnorePath).then(() => true).catch(() => false);
      
      expect(exists).toBe(true);
      
      const content = await fs.readFile(fafIgnorePath, 'utf-8');
      expect(content).toContain('# .fafignore');
      expect(content).toContain('node_modules/');
      expect(content).toContain('dist/');
      expect(content).toContain('.env');
      expect(content).toContain('*.log');
      expect(content).toContain('# Custom exclusions');
    });

    it('should overwrite existing .fafignore file', async () => {
      await fs.mkdir(testDir, { recursive: true });
      
      // Create existing file
      const existingContent = 'old-pattern/';
      await fs.writeFile(path.join(testDir, '.fafignore'), existingContent);
      
      await createDefaultFafIgnore(testDir);
      
      const newContent = await fs.readFile(path.join(testDir, '.fafignore'), 'utf-8');
      expect(newContent).not.toContain('old-pattern/');
      expect(newContent).toContain('node_modules/');
    });
  });

  describe('getFileSizeLimit', () => {
    it('should return 1MB file size limit', () => {
      const limit = getFileSizeLimit();
      expect(limit).toBe(1024 * 1024); // 1MB in bytes
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical JavaScript project structure', () => {
      const jsProjectPatterns = [
        'node_modules/',
        'dist/',
        'build/',
        '.git/',
        '*.log',
        '.env',
        'coverage/'
      ];

      const filesToIgnore = [
        'node_modules/react/index.js',
        'dist/bundle.js',
        'build/static/js/main.js',
        '.git/config',
        'npm.log',
        '.env.local',
        'coverage/lcov-report/index.html'
      ];

      const filesToInclude = [
        'src/index.js',
        'src/components/App.js',
        'package.json',
        'README.md',
        'tests/app.test.js'
      ];

      filesToIgnore.forEach(file => {
        expect(shouldIgnore(file, jsProjectPatterns)).toBe(true);
      });

      filesToInclude.forEach(file => {
        expect(shouldIgnore(file, jsProjectPatterns)).toBe(false);
      });
    });

    it('should handle typical Python project structure', () => {
      const pythonPatterns = [
        '__pycache__/',
        '*.pyc',
        'venv/',
        '.venv/',
        'dist/',
        'build/',
        '.git/',
        '*.log'
      ];

      const filesToIgnore = [
        'src/__pycache__/main.cpython-39.pyc',
        'utils.pyc',
        'venv/lib/python3.9/site-packages/',
        '.venv/bin/python',
        'dist/myapp-1.0.0.tar.gz',
        'build/lib/myapp/main.py'
      ];

      const filesToInclude = [
        'src/main.py',
        'src/utils.py',
        'requirements.txt',
        'setup.py',
        'tests/test_main.py'
      ];

      filesToIgnore.forEach(file => {
        expect(shouldIgnore(file, pythonPatterns)).toBe(true);
      });

      filesToInclude.forEach(file => {
        expect(shouldIgnore(file, pythonPatterns)).toBe(false);
      });
    });
  });
});