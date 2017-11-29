const fs = require('fs-extra');
const path = require('path');
const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');

const IS_PRODUCTION = String(process.env.NODE_ENV).match(/^prod/i);
const VERSION = fs.readJsonSync('package.json').version;

module.exports = {
  devtool: 'source-map',

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9090
  },

  resolve: {
    alias: {
      game: path.resolve(__dirname, 'src/game'),
      engine: path.resolve(__dirname, 'src/engine'),
      root: path.resolve(__dirname, 'src')
    }
  },

  entry: {
    app: [
      './src/app.js',
      './src/app.scss'
    ]
  },

  plugins: [
    new WebpackNotifierPlugin(),
    new Webpack.DefinePlugin({
      DEBUG: !IS_PRODUCTION,
      VERSION: `"${VERSION}"`
    }),
    new Webpack.optimize.UglifyJsPlugin({
      minimize: IS_PRODUCTION,
      sourceMap: true,
      compress: {
        warnings: false,
        passes: 2,
        unused: true,
        dead_code: true,
        keep_fargs: false,
        drop_console: IS_PRODUCTION,
        drop_debugger: IS_PRODUCTION
      }
    }),
    new Webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      chunks: ['app'],
      minChunks: (m) => {
        const context = m.context;
        if ( typeof context !== 'string' ) {
          return false;
        }
        return context.indexOf('node_modules') !== -1;
      }
    }),
    new HtmlWebpackPlugin({
      template: path.resolve('./src/index.html')
    }),
    new ExtractTextPlugin('[name].css')
  ].filter((p) => !!p),

  output: {
    path: path.resolve('./dist'),
    sourceMapFilename: '[file].map',
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules(?!\/webpack-dev-server)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.(png|jpe?g|ico)$/,
        loader: 'file-loader'
      },
      {
        test: /((\w+)\.(eot|svg|ttf|woff|woff2))$/,
        loader: 'file-loader?name=fonts/[name].[ext]'
      },
      {
        test: /\.s?css$/,
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                minimize: IS_PRODUCTION,
                sourceMap: true
              }
            },
            {
              loader: 'sass-loader',
              options: {
                minimize: IS_PRODUCTION,
                sourceMap: true
              }
            }
          ]
        })
      }
    ]
  }
};
