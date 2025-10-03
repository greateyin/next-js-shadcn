import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle Node.js built-in modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        console: false,
        diagnostics_channel: false,
      };
    }

    // Exclude server-only modules from client bundles
    if (!isServer) {
      config.module.rules.push({
        test: /winston|winston-elasticsearch|@elastic\/elasticsearch/,
        use: 'null-loader',
      });
    }

    return config;
  },
};

export default nextConfig;
