// 临时简化的 Nuxt 4 配置
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  modules: ['@nuxtjs/tailwindcss'],

  
  // Nuxt 4 兼容
  compatibilityDate: '2024-11-25',

  // 简化路由配置
  nitro: {
    prerender: {
      routes: ['/']
    }
  },

  // 基础 App 配置
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