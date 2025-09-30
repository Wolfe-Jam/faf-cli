/**
 * 🍜 YAML FIX-ONCE ABSTRACTION
 *
 * This module will handle the transition from external yaml
 * to bundled yaml seamlessly!
 *
 * CURRENT STATUS: Using external yaml
 * FUTURE STATUS: Will use bundled yaml
 */

// For now, use the external yaml package
import * as yaml from 'yaml';

// Export everything FAF uses
export const parse = yaml.parse;
export const stringify = yaml.stringify;
export const Document = yaml.Document;
export const parseDocument = yaml.parseDocument;

// Re-export as default for compatibility
export default {
  parse,
  stringify,
  Document,
  parseDocument
};

// Also export as YAML for compatibility
export const YAML = {
  parse,
  stringify,
  Document,
  parseDocument
};

/**
 * FIX-ONCE BENEFITS:
 * 1. All yaml imports go through here
 * 2. Easy to switch to bundled version later
 * 3. Can add logging/debugging if needed
 * 4. Single place to manage yaml
 *
 * BUNDLE STRATEGY:
 * When we're ready to bundle, we'll:
 * 1. Copy yaml source into src/bundled/
 * 2. Update this file to import from there
 * 3. Remove yaml from package.json
 * 4. Done! YAML is part of FAF!
 */

/**
 * FAF YAML USAGE PATTERNS:
 *
 * 1. Parsing .faf files:
 *    const config = parse(fileContent);
 *
 * 2. Writing .faf files:
 *    const yamlString = stringify(config);
 *
 * 3. That's literally it! We keep it simple!
 *
 * 🍜 NOODLE PRESERVATION STATUS: SECURED
 */