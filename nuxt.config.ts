// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { visualizer } from 'rollup-plugin-visualizer'

const isDev = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  // Nuxt 4.0.0 的新devtools配置
  devtools: {
    enabled: isDev,
    // 启用Nuxt 4的新功能
    timeline: {
      enabled: isDev
    }
  },
  css: ['@/assets/css/main.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    // PWA模块配置
    [
      '@vite-pwa/nuxt',
      {
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/',
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 年
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 年
                }
              }
            }
          ]
        },
        client: {
          installPrompt: true,
          periodicSyncForUpdates: 30 * 60 * 1000 // 30 分钟
        },
        // 添加推送通知支持
        webManifest: {
          name: '有条工具 - 开发者效率工具箱',
          short_name: '有条工具',
          description: '极简、高效、全能的开发者工具集合',
          theme_color: '#6366f1',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          lang: 'zh-CN',
          dir: 'ltr',
          icons: [
            {
              src: 'logo/logo-96.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: 'logo/logo-128.png',
              sizes: '128x128',
              type: 'image/png'
            },
            {
              src: 'logo/logo-256.png',
              sizes: '256x256',
              type: 'image/png'
            },
            {
              src: 'logo/logo-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ],
          categories: ['productivity', 'utilities', 'developer'],
          // 推送通知相关配置
          gcm_sender_id: '103953800507', // GCM 发送者ID（需要替换为您的）
          gcm_user_visible_only: true
        }
      }
    ]
  ],

  vite: {
    plugins: [
      visualizer({
        open: false,
        filename: 'stats.html'
      })
    ],
    // 开发环境优化
    server: isDev ? {
      fs: {
        strict: false,
        // 限制文件监听数量
        maxRooms: 100
      },
      watch: {
        // 开发环境使用更高效的监听
        usePolling: false,
        depth: 0,
        // 排除更多文件以减少监听负担（解决 EMFILE 错误）
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.nuxt/**',
          '**/target/**',
          '**/.output/**',
          '**/coverage/**',
          '**/.vscode/**',
          '**/.idea/**',
          '**/scripts/**',
          '**/*.log',
          '**/README*.md',
          '**/docs/**',
          '**/src-tauri/**',
          '**/*.bak',
          '!**/src-tauri/tauri.conf.json',
          // 排除 blog 目录（避免监听大量博客文件）
          '**/blog/**',
          '**/blog/content/**',
          '**/blog/public/**',
          '**/blog/layouts/**',
          '**/blog/themes/**',
          // 排除构建产物
          '**/*.min.js',
          '**/*.min.css',
          // 排除图片和媒体文件
          '**/*.{png,jpg,jpeg,gif,svg,ico,webp,mp4,mp3,wav,ogg}',
          // 排除字体文件
          '**/*.{woff,woff2,ttf,eot}',
          // 排除测试文件
          '**/__tests__/**',
          '**/*.test.{js,ts,vue}',
          '**/*.spec.{js,ts,vue}',
          // 排除数据文件（避免监听大型JSON文件）
          '**/data/**/*.json',
          '**/public/**',
          // 排除所有工具页面（440个文件）
          '**/src/pages/tools/**'
        ]
      },
      // 减少开发服务器的资源使用
      hmr: {
        overlay: false,
        // 降低热更新频率
        timeout: 5000
      },
      // 优化中间件
      middlewareMode: false
    } : {
      fs: {
        strict: false
      }
    },
    build: {
      // 优化构建性能
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        onwarn: (warning, warn) => {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
          warn(warning)
        },
        // 优化依赖预构建
        output: {
          manualChunks: {
            vendor: ['vue'], // 核心框架
            ui: ['lucide-vue-next', '@vueuse/integrations'], // UI工具
            utils: ['crypto-js', 'marked', 'qrcode', 'sortablejs'], // 工具库
            graphics: ['@esotericsoftware/spine-player'] // 图形库
          }
        }
      },
      // 提高构建速度
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      // 预构建优化
      include: [
        'vue',
        'vue-router',
        'marked',
        'crypto-js',
        'qrcode',
        'lucide-vue-next',
        '@esotericsoftware/spine-player'
      ],
      exclude: [
        '@tauri-apps/api',
        'exifreader',
        'jszip'
      ],
      // 移除强制重新构建，大幅提升启动速度
      force: false
    },
    },

  // Nuxt 4.0.0 兼容日期
  compatibilityDate: '2024-11-25',

  // Nuxt 4的新功能
  features: {
    // 启用内联CSS
    inlineStyles: false,
    // 开发日志
    devLogs: isDev,
    // 禁用不必要的脚本
    noScripts: false
  },

  // 开发环境优化
  ...(isDev ? {
    // 启用SSR以确保资源路径正确
    ssr: true,
    // 优化页面加载 - 启用进度条
    loading: {
      color: 'rgb(80, 80, 80)',
      height: '1px',
      continuous: true,
      duration: 3000
    }
  } : {}),

  // 更新目录结构配置
  srcDir: 'src/',
  dir: {
    pages: 'pages',
    layouts: 'layouts',
    middleware: 'middleware',
    plugins: 'plugins',
    modules: 'modules',
    public: 'public',
    assets: './assets'
  },
  // 配置路由规则
  nitro: {
    // 优化内存使用
    minify: true,
    sourceMap: false,
    // 只预渲染重要页面，避免内存溢出
    prerender: {
      routes: [
        '/',
        '/all',
        '/about',
        '/tags',
        '/sitemap'
      ],
      // 优化预渲染配置
      concurrency: 5, // 提高并发数加快预渲染
      failOnError: false, // 遇到错误不中断构建
      interval: 0 // 移除间隔，加快渲染速度
    },
    // 静态资源处理
    publicAssets: [
      {
        baseURL: '/',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 365
      }
    ],
    // 开发环境优化
    compressPublicAssets: false,
    // 优化构建输出
    minify: !isDev,
    // 优化路由缓存
    routeRules: {
      '/': { prerender: true },
      '/all': { prerender: true },
      '/ai/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/calculate/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/crypto/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/data/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/design/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/dev/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/encode/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/finance/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/format/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/health/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/image/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/network/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/productivity/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/random/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/security/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/text/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/time/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/visualization/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/tags': { prerender: true },
      '/tags/**': { headers: { 'cache-control': 'public, max-age=3600' } },
      '/tag/**': { headers: { 'cache-control': 'public, max-age=3600' } }
    }
  },
  // 添加实验性配置以支持静态文件
  experimental: {
    payloadExtraction: false
  },
  app: {
    head: {
      title: '有条工具 - 开发者的常用的工具集合',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '无广告 · 本地计算 · 即开即用的在线工具平台' },
        { name: 'theme-color', content: '#6366f1' },
        { name: 'msapplication-TileColor', content: '#6366f1' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ],
      // 添加主题初始化脚本，在页面加载前执行
      script: [
                {
          innerHTML: `(function(){try{const t=localStorage.getItem('theme')||'dark';document.documentElement.classList[t==='dark'?'add':'remove']('dark');if(!localStorage.getItem('theme'))localStorage.setItem('theme','dark')}catch(e){document.documentElement.classList.add('dark')}})();`,
          type: 'text/javascript'
        }
      ]
    }
  },
  // 运行时配置
  runtimeConfig: {
    private: {
      // 私有配置，只在服务端可用
    },
    public: {
      siteUrl: process.env.NODE_ENV === 'production' ? 'https://www.util.cn' : 'http://localhost:3000'
    }
  },

  // Nuxt 4的钩子
  hooks: {
    // 构建完成后钩子
    'build:done': () => {
      console.log('✅ Nuxt 4 构建完成')
    }
  }
})