// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  modules: [
    '@nuxtjs/tailwindcss',
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
          // 不要缓存错误页面
          navigateFallbackDenylist: [/^\/200$/, /^\/404$/],
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
        }
      }
    ] : null
  ].filter(Boolean),

  vite: {
    plugins: [],
    // 优化文件监视，减少文件句柄使用
    server: {
      fs: {
        strict: false
      },
      watch: {
        usePolling: true,
        interval: 1000,
        depth: 2,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/.nuxt/**',
          '**/target/**',
          '**/.output/**',
          '**/coverage/**'
        ]
      }
    },
    build: {
      rollupOptions: {
        onwarn: (warning, warn) => {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
          warn(warning)
        }
      }
    },
    optimizeDeps: {
      include: [],
      exclude: ['@tauri-apps/api']
    }
  },

  compatibilityDate: '2025-12-10',
  // 更新目录结构配置
  srcDir: 'src/',
  dir: {
    pages: 'pages',
    layouts: 'layouts',
    middleware: 'middleware',
    plugins: 'plugins',
    modules: 'modules',
    public: '../public',
    assets: './assets',
    app: '../app'
  },
  // 设置自定义挂载点 - 移除 rootId 配置，使用默认值
  // vueApp: {
  //   rootId: 'app'
  // },
  // 配置路由规则
  nitro: {
    prerender: {
      routes: ['/ai', '/crypto', '/dev', '/encode', '/format', '/image', '/network', '/text', '/time', '/all']
    },
    // 确保静态文件可以正确访问
    publicAssets: [
      {
        baseURL: '/blog/',
        dir: 'public/blog',
        maxAge: 60 * 60 * 24 * 365 // 1年缓存
      }
    ]
  },
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
      // 添加主题初始化脚本，在页面加载前执行
      script: [
        {
          innerHTML: `
            (function() {
              try {
                // 获取保存的主题，如果没有则默认使用暗色主题
                const savedTheme = localStorage.getItem('theme') || 'dark';
                if (savedTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                // 确保主题被保存
                if (!localStorage.getItem('theme')) {
                  localStorage.setItem('theme', 'dark');
                }
              } catch (e) {
                // 如果 localStorage 不可用，默认使用暗色主题
                document.documentElement.classList.add('dark');
              }
            })();
          `,
          type: 'text/javascript'
        }
      ]
    }
  },
  // 定义运行时配置
  runtimeConfig: {
    public: {
      siteUrl: 'https://www.util.cn'
    }
  }
})