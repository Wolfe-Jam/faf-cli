/**
 * 🔒 FAF Engine Webpack Configuration
 * Bundles and obfuscates the secret sauce
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
  mode: 'production',
  entry: './faf-engine/src/index.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'engine.bundle.js',
    library: {
      name: 'FafEngineCore',
      type: 'commonjs2'
    },
    clean: false // Don't clean other dist files
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@engine': path.resolve(__dirname, 'faf-engine/src')
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 3,
            unsafe: true,
            unsafe_math: true,
            unsafe_symbols: true,
            pure_getters: true
          },
          mangle: {
            reserved: ['FafEngine', 'score', 'init', 'generateContext'],
            properties: {
              regex: /^_/ // Mangle private properties
            }
          },
          format: {
            comments: false,
            ascii_only: true
          }
        },
        extractComments: false
      })
    ]
  },

  plugins: [
    new WebpackObfuscator({
      // String Array Encoding
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayIndexShift: true,
      stringArrayRotate: true,
      stringArrayShuffle: true,
      stringArrayWrappersCount: 2,
      stringArrayWrappersChainedCalls: true,
      stringArrayWrappersParametersMaxCount: 4,
      stringArrayWrappersType: 'function',
      stringArrayThreshold: 0.75,

      // Control Flow Flattening
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,

      // Dead Code Injection
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,

      // Variable Renaming
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: true,
      renameProperties: false, // Keep API intact

      // Other Security
      debugProtection: true,
      debugProtectionInterval: 2000,
      disableConsoleOutput: true,
      domainLock: [],
      domainLockRedirectUrl: 'https://faf.one',

      // Self Defending
      selfDefending: true,

      // Transformations
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,

      // Additional Options
      seed: 42, // Consistent obfuscation for debugging
      target: 'node',
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    }, [
      // Exclude files from obfuscation
      'node_modules/**'
    ])
  ],

  // Exclude node modules from bundle
  externals: {
    // Keep these as external dependencies
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'crypto': 'commonjs crypto',
    'os': 'commonjs os',
    'child_process': 'commonjs child_process'
  },

  // No source maps in production!
  devtool: false,

  // Performance hints
  performance: {
    maxAssetSize: 1000000, // 1MB
    maxEntrypointSize: 1000000,
    hints: 'warning'
  },

  // Stats for build output
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
    warnings: false
  }
};