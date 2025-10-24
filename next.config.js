// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 圖片域名配置
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },

  // CORS 配置（用於跨子域 API 訪問）
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
            // 從環境變量讀取允許的域名
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

  // TypeScript 配置
  typescript: {
    // !! WARN !!
    // 允許生產構建完成即使專案有類型錯誤
    // 建議：修復類型錯誤後設置為 false
    ignoreBuildErrors: true,
  },

  // ESLint 配置
  eslint: {
    // !! WARN !!
    // 允許生產構建完成即使有 ESLint 錯誤
    // 建議：修復 lint 錯誤後設置為 false
    ignoreDuringBuilds: true,
  },

  // React Strict Mode
  reactStrictMode: false,

  // 實驗性功能
  experimental: {
    optimizePackageImports: [],
    serverMinification: false,
    serverSourceMaps: true,
  },

  // 防止這些套件被打包到 Edge Runtime (Next.js 15+)
  serverExternalPackages: [
    'winston',
    'winston-elasticsearch',
    '@elastic/elasticsearch',
    'editorconfig',
    '@one-ini/wasm',
    'prettier',
    'js-beautify',
  ],

  // Webpack 配置
  webpack: (config, { isServer, nextRuntime }) => {
    // 為所有環境排除使用 CommonJS 的套件
    // 設置為 false 會讓 webpack 完全忽略這些套件的 import
    config.resolve.alias = {
      ...config.resolve.alias,
      'winston': false,
      'winston-elasticsearch': false,
      '@elastic/elasticsearch': false,
      'editorconfig': false,
      '@one-ini/wasm': false,
      'prettier': false,
      'js-beautify': false,
    };

    // 客戶端 polyfills 配置
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js 內建模組設置為 false（客戶端不需要）
        fs: false,
        net: false,
        tls: false,
        os: false,
        path: false,
        zlib: false,
        console: false,
        diagnostics_channel: false,
        // 使用 browserify polyfills
        crypto: "crypto-browserify",
        stream: "stream-browserify",
        buffer: "buffer",
        util: "util",
        http: "stream-http",
        https: "https-browserify",
        url: false,
        querystring: false,
      };

      // 排除服務器端專用模組
      config.module.rules.push({
        test: /winston|winston-elasticsearch|@elastic\/elasticsearch|editorconfig|@one-ini\/wasm|prettier|js-beautify/,
        use: 'null-loader',
      });
    }

    return config;
  },
};

module.exports = nextConfig;
