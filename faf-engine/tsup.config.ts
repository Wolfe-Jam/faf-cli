import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    vercel: 'src/vercel/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: false,  // Disable treeshaking to avoid rollup native deps
  minify: false,     // Disable minification to avoid rollup native deps
  external: ['openai'],
  bundle: true,      // Ensure bundling without native optimizations
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node18';
    options.packages = 'external';  // Keep dependencies external
  }
});