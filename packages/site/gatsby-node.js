const path = require('path');
const fs = require('fs');

/**
 * Développement local : Yarn `file:` pointe vers une copie figée dans le cache.
 * On réécrit le module vers le build TypeScript du dépôt requestNetwork pour que
 * webpack (develop) surveille les fichiers réels. Lancer en parallèle :
 * `yarn watch:request-light` dans ce package pour recompiler le .ts → dist.
 */
const LOCAL_REQUEST_LIGHT_DIST = path.resolve(
  __dirname,
  '../../../requestNetwork/packages/request-light.js/dist/index.js',
);

/** @type {import('gatsby').GatsbyNode['onCreateWebpackConfig']} */
exports.onCreateWebpackConfig = ({ actions }) => {
  const webpack = require('webpack');

  const resolve = {
    fallback: {
      assert: require.resolve('assert/'),
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
    },
  };

  if (fs.existsSync(LOCAL_REQUEST_LIGHT_DIST)) {
    resolve.alias = {
      '@requestnetwork/request-light.js': LOCAL_REQUEST_LIGHT_DIST,
    };
  }

  actions.setWebpackConfig({
    resolve,
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
    ],
  });
};
