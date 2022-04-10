const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MinifyPlugin = require("babel-minify-webpack-plugin");
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
const currentYear = new Date().getFullYear();

const PUBLIC_PATH = '';

module.exports = {
  entry: './src/index.tsx',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.txt$/i,
        use: 'raw-loader',
      },
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {  loader:'babel-loader' },
          {  loader:'ts-loader' }
        ]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {// css-loader to bundle all the css files into one file and style-loader to add all the styles  inside the style tag of the document
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts','.tsx','.js','.jsx'],
    alias: { "./dist/cpexcel.js": "" }
  },
  output: {
    path: __dirname + '/dist',
    publicPath: PUBLIC_PATH,
    filename: 'LLQdmn.js'
  },
  optimization: {
    minimize: true,
    //https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production
    minimizer: [
       new MinifyPlugin({"mangle": { topLevel: true }}), //zet {"mangle": false} bij te weinig memory/timeout van build:extra-memory
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html'
    }),
    // load `moment/locale/ja.js` and `moment/locale/it.js`
    /*
    new webpack.ContextReplacementPlugin(/moment[/\\]locale$/, /nl|en-gb/),
    new MomentTimezoneDataPlugin({
      matchZones: 'Etc/UTC',
      startYear: currentYear - 2,
      endYear: currentYear + 10,
    }),*/
  ],
};
