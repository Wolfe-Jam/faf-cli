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
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  external: ['openai'],
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = 'node18';
  }
});