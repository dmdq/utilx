// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import { visualizer } from 'rollup-plugin-visualizer'

const isDev = process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  // Nuxt 4.2.2 的新devtools配置
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
    // PWA模块仅在生产环境启用，且配置独立
    process.env.NODE_ENV === 'production' ? '@vite-pwa/nuxt' : undefined
  ].filter(Boolean) as string[], // 确保类型正确

  // modules: [
  //   '@nuxtjs/tailwindcss',
  //   process.env.NODE_ENV === 'production' ? [
  //     '@vite-pwa/nuxt', {
  //       registerType: 'autoUpdate',
  //       strategies: 'generateSW',
  //       injectRegister: 'auto',
  //       workbox: {
  //         globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
  //         navigateFallback: '/',
  //         skipWaiting: true,
  //         clientsClaim: true,
  //         // 不要缓存错误页面
  //         navigateFallbackDenylist: [/^\/200$/, /^\/404$/],
  //         runtimeCaching: [
  //           {
  //             urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  //             handler: 'CacheFirst',
  //             options: {
  //               cacheName: 'google-fonts-cache',
  //               expiration: {
  //                 maxEntries: 10,
  //                 maxAgeSeconds: 60 * 60 * 24 * 365 // 1 年
  //               }
  //             }
  //           },
  //           {
  //             urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
  //             handler: 'CacheFirst',
  //             options: {
  //               cacheName: 'gstatic-fonts-cache',
  //               expiration: {
  //                 maxEntries: 10,
  //                 maxAgeSeconds: 60 * 60 * 24 * 365 // 1 年
  //               }
  //             }
  //           }
  //         ]
  //       },
  //       client: {
  //         installPrompt: true,
  //         periodicSyncForUpdates: 30 * 60 * 1000 // 30 分钟
  //       }
  //     }
  //   ] : null
  // ].filter(Boolean),

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
        strict: false
      },
      watch: {
        // 开发环境使用更高效的监听
        usePolling: false,
        depth: 2,
        // 排除更多文件以减少监听负担
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
          '!**/src-tauri/tauri.conf.json'
        ]
      },
      // 减少开发服务器的资源使用
      hmr: {
        overlay: false
      }
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
        },
        external: ['web-vitals/attribution']
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
      // 强制重新构建
      force: isDev
    },
    },

  // Nuxt 4.2.2 兼容日期
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
    // 减少构建时间
    nitro: {
      minify: false,
      sourceMap: false,
      prerender: {
        routes: []
      }
    },
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
    prerender: {
      routes: [
        '/',
        '/all',
        '/ai',
        '/calculate',
        '/crypto',
        '/data',
        '/design',
        '/dev',
        '/encode',
        '/finance',
        '/format',
        '/health',
        '/image',
        '/network',
        '/productivity',
        '/random',
        '/security',
        '/text',
        '/time',
        '/visualization',
        '/tags'
      ]
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