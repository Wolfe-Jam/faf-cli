/**
 * 🏎️ FAF Engine MK-2 Webpack Configuration
 * Championship Edition - Maximum Protection
 */

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/engine-mk2/mk2-core.ts',
  target: 'node',

  output: {
    path: path.resolve(__dirname, 'dist/protected'),
    filename: 'engine-mk2.min.js',
    library: {
      name: 'FafEngineMK2',
      type: 'commonjs2',
      export: 'default'
    },
    clean: false
  },

  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@mk2': path.resolve(__dirname, 'src/engine-mk2'),
      '@engines': path.resolve(__dirname, 'src/engines'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              target: 'ES2020',
              module: 'commonjs',
              removeComments: true
            }
          }
        },
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
    // Define MK-2 constants
    new webpack.DefinePlugin({
      'process.env.ENGINE_VERSION': JSON.stringify('MK-2'),
      'process.env.ENGINE_BUILD': JSON.stringify(Date.now()),
      'process.env.PROTECTION_LEVEL': JSON.stringify('MAXIMUM')
    }),

    // Banner for legal protection
    new webpack.BannerPlugin({
      banner: `FAF Engine MK-2 - Proprietary Software
Copyright (c) 2025 Wolfejam. All rights reserved.
Unauthorized use, reproduction, or distribution is prohibited.
Protected by obfuscation - tampering will void warranty.`,
      entryOnly: true
    })
  ],

  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          ecma: 2020,
          parse: {
            ecma: 2020
          },
          compress: {
            ecma: 2020,
            warnings: false,
            comparisons: false,
            inline: 3,
            drop_console: true,
            drop_debugger: true,
            dead_code: true,
            evaluate: true,
            if_return: true,
            join_vars: true,
            keep_fargs: false,
            keep_infinity: false,
            loops: true,
            negate_iife: false,
            passes: 5,
            properties: true,
            reduce_vars: true,
            sequences: true,
            side_effects: true,
            switches: true,
            toplevel: true,
            typeofs: false,
            unused: true,
            conditionals: true,
            arrows: true,
            collapse_vars: true,
            computed_props: true,
            hoist_funs: true,
            hoist_props: true,
            hoist_vars: false,
            module: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            pure_getters: true,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_comps: true,
            unsafe_Function: true,
            unsafe_math: true,
            unsafe_methods: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_symbols: true,
            unsafe_undefined: true
          },
          mangle: {
            eval: true,
            reserved: ['FafEngineMK2', 'analyzeProject', 'calculateScore'],
            properties: {
              regex: /^_|^private_/,
              reserved: ['constructor', 'prototype', 'exports', 'module', 'require']
            },
            toplevel: true,
            safari10: true
          },
          format: {
            ascii_only: true,
            beautify: false,
            comments: false,
            ecma: 2020,
            indent_level: 0,
            max_line_len: 1000,
            preamble: '/* FAF Engine MK-2 - Protected */',
            quote_keys: true,
            quote_style: 3,
            wrap_iife: true,
            wrap_func_args: true
          },
          module: true,
          toplevel: true,
          nameCache: {}
        },
        extractComments: false
      })
    ]
  },

  // Externals - keep minimal for security
  externals: {
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'crypto': 'commonjs crypto',
    'os': 'commonjs os'
  },

  // No source maps in production!
  devtool: false,

  // Performance configuration
  performance: {
    maxAssetSize: 2000000, // 2MB max
    maxEntrypointSize: 2000000,
    hints: 'warning'
  },

  // Clean output
  stats: {
    all: false,
    errors: true,
    warnings: true,
    timings: true,
    assets: true
  }
};