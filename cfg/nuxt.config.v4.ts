// Nuxt 4.2.2 配置文件
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  // Nuxt 4 的新devtools配置
  devtools: {
    enabled: true,
    // 启用Nuxt 4的新功能
    timeline: {
      enabled: true
    }
  },

  // CSS配置
  css: ['@/assets/css/main.css'],

  // 模块配置
  modules: [
    '@nuxtjs/tailwindcss',
    // PWA模块只在生产环境启用
    process.env.NODE_ENV === 'production' ? [
      '@vite-pwa/nuxt', {
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/',
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [/^\/200$/, /^\/404$/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
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
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            }
          ]
        },
        client: {
          installPrompt: true,
          periodicSyncForUpdates: 30 * 60 * 1000
        }
      }
    ] : null
  ].filter(Boolean),

  // Vite配置 - Nuxt 4优化
  vite: {
    plugins: [],
    // 开发环境优化
    server: {
      fs: {
        strict: false
      },
      watch: {
        // Nuxt 4推荐使用原生文件监听
        usePolling: false,
        depth: 1,
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
          '**/docs/**'
        ]
      },
      // 减少开发服务器资源使用
      hmr: {
        overlay: false
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
        // Nuxt 4的代码分割优化
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router'],
            ui: ['naive-ui', '@vueuse/integrations'],
            utils: ['crypto-js', 'marked', 'qrcode']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'naive-ui',
        'marked',
        'crypto-js',
        'qrcode',
        'lucide-vue-next'
      ],
      exclude: [
        '@tauri-apps/api',
        'exifreader',
        'jszip'
      ],
      force: process.env.NODE_ENV === 'development'
    }
  },

  // Nuxt 4的新功能
  features: {
    // 启用Nuxt 4的实验性功能
    experimental: {
      payloadExtraction: false,
      crossOriginPrefetch: false,
      renderJsonPayloads: false,
      viewTransition: false,
      externalVueSupport: true
    },
    // 启用内置的TypeScript支持
    typescript: {
      strict: process.env.NODE_ENV === 'production'
    },
    // 启用内联CSS
    inlineStyles: false
  },

  // 兼容日期
  compatibilityDate: '2024-11-25',

  // 开发环境优化
  ...(process.env.NODE_ENV === 'development' ? {
    // 禁用SSR以提高开发速度
    nitro: {
      prerender: {
        routes: []
      },
      minify: false,
      sourceMap: false
    },
    // 优化页面加载
    loading: false
  } : {}),

  // 目录结构配置
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

  // App配置
  app: {
    head: {
      title: '有条工具 - 开发者的常用的工具集合',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '无广告 · 本地计算 · 即开即用的在线工具平台' },
        { name: 'theme-color', content: '#6366f1' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: '有条工具' },
        { name: 'application-name', content: '有条工具' },
        { name: 'msapplication-TileColor', content: '#6366f1' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
      ],
      link: [
        { rel: 'preload', href: '/_nuxt/entry.js', as: 'script' },
        { rel: 'preload', href: '/_nuxt/app.css', as: 'style' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ],
      // 主题初始化脚本
      script: [
        {
          innerHTML: `
            (function() {
              try {
                const savedTheme = localStorage.getItem('theme') || 'dark';
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                if (!localStorage.getItem('theme')) {
                  localStorage.setItem('theme', 'dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            })();
          `,
          type: 'text/javascript'
        }
      ]
    },
    // Nuxt 4的页面过渡配置
    pageTransition: false,
    layoutTransition: false
  },

  // Nitro配置
  nitro: {
    prerender: {
      routes: ['/ai', '/crypto', '/dev', '/encode', '/format', '/image', '/network', '/text', '/time', '/all']
    },
    publicAssets: [
      {
        baseURL: '/blog/',
        dir: 'public/blog',
        maxAge: 60 * 60 * 24 * 365
      }
    ]
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
    },
    // 错误处理钩子
    'render:error': (error) => {
      console.error('Nuxt 4 渲染错误:', error)
    }
  }
})