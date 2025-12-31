/**
 * 外链拦截器配置文件
 */

window.ExternalLinkConfig = {
  // 是否启用拦截器
  enabled: true,

  // 当前域名，用于判断是否为外部链接
  currentDomain: window.location.hostname,

  // 内部域名列表（这些域名不会被拦截）
  internalDomains: [
    // 可以添加子域名或其他相关域名
    // 'subdomain.example.com',
    // 'api.example.com'
  ],

  // 确认页面配置
  confirmPage: {
    // 页面标题
    title: '外链跳转提示',

    // 主要提示信息
    message: '您即将离开本站，访问外部链接：',

    // 确认按钮文本
    confirmText: '继续访问',

    // 取消按钮文本
    cancelText: '返回',

    // 安全提示
    securityNote: '请注意：外部网站的内容和安全性与本站无关',

    // 显示倒计时（秒），0 表示不显示倒计时
    countdown: 10,

    // 是否记住用户选择（使用 localStorage）
    rememberChoice: true,

    // 记忆选择的过期时间（毫秒），默认24小时
    memoryExpiry: 24 * 60 * 60 * 1000
  },

  // 缓存配置
  cache: {
    // 是否启用缓存
    enabled: true,

    // 缓存过期时间（毫秒）
    expiry: 24 * 60 * 60 * 1000, // 24小时

    // 缓存键名前缀
    keyPrefix: 'ext_link_cache_'
  },

  // 自定义样式（可选）
  customStyles: {
    // 主容器背景色
    containerBackground: '#ffffff',

    // 边框颜色
    borderColor: '#e5e7eb',

    // 主要按钮颜色
    primaryButtonColor: '#3b82f6',

    // 危险按钮颜色
    dangerButtonColor: '#ef4444'
  }
};