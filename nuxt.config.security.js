// 安全性配置
export default defineNuxtConfig({
  // Content Security Policy
  app: {
    head: {
      meta: [
        {
          'http-equiv': 'Content-Security-Policy',
          content: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.iskytrip.com",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests"
          ].join('; ')
        },
        // 其他安全头
        { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
        { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
        { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' },
        { 'http-equiv': 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
        { name: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=()' }
      ]
    }
  },

  // 环境变量安全
  runtimeConfig: {
    // 私有密钥（只在服务器端可用）
    apiSecret: process.env.API_SECRET,
    recaptchaSecret: process.env.RECAPTCHA_SECRET,

    // 公共密钥（客户端也可用）
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
      recaptchaKey: process.env.NUXT_PUBLIC_RECAPTCHA_KEY
    }
  }
})