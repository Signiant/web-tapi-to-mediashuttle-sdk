const path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  mode: 'none',
  output: {
    filename: 'mediashuttle-bundle.js',
    path: path.resolve(__dirname, '../dist'),
  },
};
