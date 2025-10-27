// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 圖片域名配置
  images: {
    domains: ["avatars.githubusercontent.com", "lh3.googleusercontent.com"],
  },

  // CORS 配置（用於跨子域 API 訪問）
  async headers() {
    const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_DOMAINS || "";
    const fallbackOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const allowedOrigin =
      rawAllowedOrigins
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin && origin !== "*")[0] || fallbackOrigin;

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
            // 僅允許明確的來源以符合瀏覽器對 credentials 模式的要求
            value: allowedOrigin
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

  // React Strict Mode (建議開啟以捕獲潛在問題)
  reactStrictMode: true,

  // 實驗性功能
  experimental: {
    // 優化套件導入以減少 bundle 大小
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
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

  // Webpack 配置（簡化版，更適合 Edge Runtime）
  webpack: (config, { isServer }) => {
    // 只在客戶端排除 Node.js 模組
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
