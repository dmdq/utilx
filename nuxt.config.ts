// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

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
    // 开发环境优化
    server: isDev ? {
      fs: {
        strict: false
      },
      watch: {
        // 开发环境使用更高效的监听
        usePolling: false,
        depth: 1,
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
            vendor: ['vue', 'vue-router'],
            ui: ['naive-ui', '@vueuse/integrations'],
            utils: ['crypto-js', 'marked', 'qrcode']
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
        'naive-ui',
        'marked',
        'crypto-js',
        'qrcode',
        'lucide-vue-next',
        'pixi.js',
        '@esotericsoftware/spine-webgl',
        'pixi-spine'
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
  // 设置自定义挂载点 - 移除 rootId 配置，使用默认值
  // vueApp: {
  //   rootId: 'app'
  // },
  // 配置路由规则
  nitro: {
    prerender: {
      routes: ['/', '/ai', '/crypto', '/dev', '/encode', '/format', '/image', '/network', '/text', '/time', '/all']
    },
    // 静态资源处理
    publicAssets: [
      {
        baseURL: '/',
        dir: 'public',
        maxAge: 60 * 60 * 24 * 365
      }
    ]
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
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: '有条工具' },
        { name: 'application-name', content: '有条工具' },
        { name: 'msapplication-TileColor', content: '#6366f1' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
      ],
      link: [
        // { rel: 'preload', href: '/_nuxt/entry.js', as: 'script' },
        // { rel: 'preload', href: '/_nuxt/app.css', as: 'style' },

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