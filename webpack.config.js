const packagejson = require('./package.json');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const mode = process.env.NODE_ENV || 'development';
const minimize = mode === 'production';

module.exports = {
  mode,
  entry: './src/index.ts',
  devtool: 'source-map',
  devServer: {
    host: '0.0.0.0',
    contentBase: path.join(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.s?css$/i,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { sourceMap: true, url: false }
          },
          {
            loader: 'sass-loader',
            options: { sourceMap: true, url: false }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new Dotenv(),
    new HtmlWebpackPlugin({
      title: packagejson.name
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  ],
  optimization: {
    minimize,
    splitChunks: {
      chunks: 'all'
    },
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
        terserOptions: {
          compress: {
            pure_funcs: ['console.log', 'console.debug', 'console.group', 'console.groupEnd', 'console.time', 'console.timeEnd']
          }
        }
      })
    ]
  }
};
