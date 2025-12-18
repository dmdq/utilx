// 最小化 Nuxt 4 配置用于测试
export default defineNuxtConfig({
  devtools: { enabled: true },

  // 不使用 Tailwind，只用基础 CSS
  css: ['@/assets/css/main.css'],

  // 不使用任何模块
  modules: [],

  // Nuxt 4 兼容
  compatibilityDate: '2024-11-25',

  // 基础配置
  app: {
    head: {
      title: '有条工具',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})