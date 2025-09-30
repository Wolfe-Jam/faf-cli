/**
 * 🍜 YAML BUNDLER - ADOPTING YAML INTO FAF!
 *
 * This bundles the yaml package directly into FAF
 * No more external dependency - YAML becomes PART of us!
 */

const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/bundled/yaml-entry.js',
  output: {
    path: path.resolve(__dirname, 'src/bundled'),
    filename: 'yaml-bundled.js',
    library: {
      type: 'commonjs2'
    }
  },
  target: 'node',
  externals: {
    // No externals - we want EVERYTHING bundled
  },
  optimization: {
    minimize: true,
    // Keep it readable for debugging if needed
    usedExports: true,
    sideEffects: false
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};