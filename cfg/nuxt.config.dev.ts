// 开发环境专用配置
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // 开发环境特定配置
  devtools: {
    enabled: true,
    experimental: {
      richIframes: false
    }
  },

  css: ['@/assets/css/main.css'],

  modules: [
    '@nuxtjs/tailwindcss'
  ],

  // 完全禁用SSR以获得最快的热重载速度
  ssr: false,

  // 简化渲染模式
  experimental: {
    payloadExtraction: false,
    crossOriginPrefetch: false,
    renderJsonPayloads: false,
    viewTransition: false
  },

  // 优化Vite开发服务器
  vite: {
    server: {
      hmr: {
        overlay: false // 禁用错误遮罩以提高性能
      },
      watch: {
        usePolling: false, // 使用原生文件监听
        interval: 100,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.nuxt/**',
          '**/target/**',
          '**/.output/**',
          '**/.vscode/**',
          '**/.idea/**',
          '**/scripts/**',
          '**/*.log',
          '**/README*.md',
          '**/docs/**',
          '**/*.md',
          '**/package-lock.json',
          '**/yarn.lock'
        ]
      }
    },
    optimizeDeps: {
      force: true, // 强制预构建
      include: [
        'vue',
        'vue-router',
        'naive-ui',
        'marked',
        'crypto-js',
        'qrcode',
        'lucide-vue-next'
      ]
    },
    clearScreen: false, // 不清屏以保持日志可见
    logLevel: 'warn' // 减少日志输出
  },

  // 关闭不必要的功能
  components: false,
  nitro: {
    minify: false,
    sourceMap: false,
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },

  // 禁用TypeScript检查以提高速度（开发时）
  typescript: {
    typeCheck: false,
    strict: false,
    shim: false
  },

  // 禁用页面过渡动画
  app: {
    pageTransition: false,
    layoutTransition: false
  },

  // 禁用CSS提取
  postcss: {
    plugins: {}
  },

  // 目录配置
  srcDir: 'src/',
  dir: {
    pages: 'pages',
    layouts: 'layouts',
    middleware: 'middleware',
    plugins: 'plugins',
    modules: 'modules',
    public: '../public',
    assets: './assets'
  },

  compatibilityDate: '2025-12-10',

  // 运行时配置
  runtimeConfig: {
    public: {
      siteUrl: 'http://localhost:3000'
    }
  },

  // 优化构建输出
  hooks: {
    'build:done': () => {
      console.log('✅ Development build completed')
    }
  }
})