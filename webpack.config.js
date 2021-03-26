const path = require('path')
const webpack = require('webpack')
// Plugins
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
//
const PROJECT_ROOT = path.join(__dirname)
const RENDERING_ROOT = path.join(PROJECT_ROOT, './src/cornerstone-core/')
const TOOLS_ROOT = path.resolve(PROJECT_ROOT, './src/cornerstone-tools/')
const LOADER_ROOT = path.resolve(PROJECT_ROOT, './src/cornerstone-streaming-image-volume-loader/')
const SRC_PATH = path.join(PROJECT_ROOT, './src')
const OUT_PATH = path.join(PROJECT_ROOT, './dist')

/**
 * `argv` are options from the CLI. They will override our config here if set.
 * `-d` - Development shorthand, sets `debug`, `devtool`, and `mode`
 * `-p` - Production shorthand, sets `minimize`, `NODE_ENV`, and `mode`
 */
module.exports = (env, argv) => {
  const isProdBuild = argv.mode !== 'development'
  const outputFilename = isProdBuild ? '[name].umd.min.js' : '[name].umd.js'

  return {
    entry: {
      rendering: RENDERING_ROOT,
      tools: TOOLS_ROOT,
      streaming_volume_loader: LOADER_ROOT,
    },
    devtool: 'source-map',
    output: {
      path: OUT_PATH,
      filename: outputFilename,
      library: 'Cornerstone3D',
      libraryTarget: 'umd',
      globalObject: 'this',
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules/,
          use: ['babel-loader'],
        },
      ],
    },
    resolve: {
      modules: [path.resolve(PROJECT_ROOT, './node_modules'), SRC_PATH],
      alias: {
        // https://stackoverflow.com/a/40444084/1867984
        '@cornerstone': RENDERING_ROOT,
        '@cornerstone-tools': TOOLS_ROOT,
        '@cornerstone-streaming-image-volume-loader': LOADER_ROOT,
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        fs: false,
        path: require.resolve('path-browserify'),
      },
    },
    externals: [
      // :wave:
      /\b(vtk.js)/,
      // Used to build/load metadata
      // TODO: Remove these as dependencies
      {
        'cornerstone-wado-image-loader': {
          commonjs: 'cornerstone-wado-image-loader',
          commonjs2: 'cornerstone-wado-image-loader',
          amd: 'cornerstone-wado-image-loader',
          root: 'cornerstoneWADOImageLoader',
        }
      }
    ],
    plugins: [
      // Uncomment to generate bundle analyzer
      // new BundleAnalyzerPlugin(),
      // Show build progress
      new webpack.ProgressPlugin(),
      // Clear dist between builds
      new CleanWebpackPlugin(),
    ],
  }
}
