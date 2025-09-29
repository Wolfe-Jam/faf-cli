const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  target: 'node',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'engine.min.js',
    library: {
      name: 'FAFEngineMK3',
      type: 'commonjs2'
    },
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@compiler': path.resolve(__dirname, '../src/compiler'),
      '@engines': path.resolve(__dirname, '../src/engines'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@scoring': path.resolve(__dirname, '../src/scoring')
    }
  },

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            dead_code: true,
            unused: true
          },
          mangle: {
            properties: {
              regex: /^_/  // Mangle private properties
            }
          },
          format: {
            comments: false
          }
        },
        extractComments: false
      })
    ]
  },

  plugins: [
    new JavaScriptObfuscator({
      rotateStringArray: true,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      deadCodeInjection: false,
      debugProtection: false,
      debugProtectionInterval: 0,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      numbersToExpressions: true,
      renameGlobals: false,
      selfDefending: false,
      simplify: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      unicodeEscapeSequence: false,
      // Performance optimizations
      compact: true,
      controlFlowFlattening: false,  // Disabled for performance
      controlFlowFlatteningThreshold: 0.75,
      transformObjectKeys: true,
      shuffleStringArray: true
    })
  ],

  // No source maps in production
  devtool: false,

  // Performance hints
  performance: {
    hints: false
  },

  // Exclude node_modules from bundle
  externals: {
    // Keep external if needed
  }
};