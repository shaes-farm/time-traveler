const config = require('config');
const debug = require('debug')('admin:next:config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/utils/supabase/image-loader.js',
  },
  reactStrictMode: true,
  transpilePackages: ['ui', 'service'],
  experimental: {
    serverActions: true,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    app: config.get('app'),
  },
  serverRuntimeConfig: {
    // Will be available only on server
    api: config.get('api'),
  }
}

debug({ publicRuntimeConfig: nextConfig.publicRuntimeConfig });
debug({ serverRuntimeConfig: nextConfig.serverRuntimeConfig });

module.exports = nextConfig
