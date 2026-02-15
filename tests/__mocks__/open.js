/**
 * Mock for 'open' package (ESM module)
 * Used in tests to avoid ESM import issues
 */

module.exports = async function open(url) {
  // Mock implementation - just return success
  return { exitCode: 0 };
};

module.exports.default = module.exports;
