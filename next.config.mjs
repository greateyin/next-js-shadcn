import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // CORS 配置（用于跨子域 API 访问）
  async headers() {
    return [
      {
        // API 路由的 CORS 配置
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true"
          },
          {
            key: "Access-Control-Allow-Origin",
            // 从环境变量读取允许的域名
            value: process.env.ALLOWED_ORIGINS || process.env.ALLOWED_DOMAINS || "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,DELETE,OPTIONS"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With"
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400" // 24 hours
          }
        ]
      }
    ];
  },
  
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
