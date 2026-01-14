const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

// load env file so sentry plugin could be feed...
// eslint-disable-next-line
const env = require("dotenv").config({
  path: ".env"
});

module.exports = {
  entry: "./src/index.js",
  plugins: [
    new Dotenv({
      expand: true
    }),
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser"
    }),
    new CleanWebpackPlugin(),
    // new webpack.DefinePlugin(),
    new HtmlWebpackPlugin({
      title: "Show Admin",
      template: "./src/index.ejs"
    }),
    ...("SENTRY_AUTH_TOKEN" in process.env &&
    "SENTRY_PROJECT" in process.env &&
    "SENTRY_ORG" in process.env
      ? [
          sentryWebpackPlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            // Specify the directory containing build artifacts
            include: [
              {
                paths: ["dist"],
                urlPrefix: "~/"
              },
              {
                paths: ["node_modules/openstack-uicore-foundation/lib"],
                urlPrefix: "~/node_modules/openstack-uicore-foundation/lib"
              }
            ],
            // and needs the `project:releases` and `org:read` scopes
            authToken: process.env.SENTRY_AUTH_TOKEN,
            // Optionally uncomment the line below to override automatic release name detection
            release: process.env.SENTRY_RELEASE
          })
        ]
      : [])
  ],
  resolve: {
    extensions: [".js", ".jsx"],
    mainFields: ["browser", "module", "main"],
    fallback: {
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer"),
      fs: require.resolve("fs"),
      process: require.resolve("process"),
      vm: false
    }
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: { node: "current" } }],
              "@babel/preset-react",
              "@babel/preset-flow"
            ],
            plugins: [
              "@babel/plugin-proposal-object-rest-spread",
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-nullish-coalescing-operator"
            ]
          }
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.less/,
        exclude: /\.module\.less/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
      },
      {
        test: /\.module.less/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              modules: true
            }
          },
          {
            loader: "less-loader"
          }
        ]
      },
      {
        test: /\.scss/,
        exclude: /\.module\.scss/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource"
      },
      {
        test: /\.jpg|\.png|\.gif$/,
        use: "file-loader?name=images/[name].[ext]"
      },
      {
        test: /\.svg/,
        use: "file-loader?name=svg/[name].[ext]!svgo-loader"
      },
      {
        test: /\.ya?ml$/,
        use: "js-yaml-loader"
      },
      // word around for react dnd
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  devtool: "source-map"
};
