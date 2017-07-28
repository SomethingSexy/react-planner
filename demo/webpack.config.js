const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const plugins = [
  new HtmlWebpackPlugin({
    template: './demo/index.ejs',
    filename: '../../index.html',
    hash: true
  }),
  new ExtractTextPlugin({
    filename: 'style.css',
    disable: false,
    allChunks: true
  })
];

module.exports = {
  entry: [
    'babel-polyfill',
    './demo/demo.js'
  ],
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
    // publicPath: '/public',
    // filename: '[hash].bundle.js'
  },
  resolve: {
    unsafeCache: true,
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules']
  },
  resolveLoader: {
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules']
  },
  plugins,
  // Enable this if you want to generate source maps for the Panda client
  //   [http://webpack.github.io/docs/configuration.html#devtool]
  // devtool: "#inline-source-map",
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      include: [
        path.resolve(__dirname),
        path.resolve(__dirname, '../src')
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            'react',
            ['env', {
              targets: {
                browsers: ['last 2 versions'],
                node: 8
              },
              include: []
            }]
          ],
          plugins: ['transform-class-properties', 'transform-object-rest-spread']
        }
      }
    }, {
      test: /\.css$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: ['css-loader']
      })
    }, {
      test: /\.less$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: ['css-loader', 'less-loader']
      })
    }, {
      test: /\.(eot|woff|woff2|ttf|svg|png|jpg|jpeg)(\?v=\d+.\d+.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          name: '/[name]-[hash].[ext]',
          limit: '10000'
        }
      }]
    }]
  }
};

