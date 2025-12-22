/**
 * 外链拦截器配置文件
 * 在这里自定义你的拦截器设置
 */

window.EXTERNAL_LINK_CONFIG = {
  // 是否启用拦截器
  enabled: true,

  // 内部域名（这些域名不会被拦截）
  internalDomains: [
    'util.cn',
    'www.util.cn',
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
    // 添加你的其他子域名
    // 'blog.example.com',
    // 'api.example.com',
    // 'docs.example.com'
  ],

  // 确认页面配置
  confirmPage: {
    title: '即将离开本站',
    message: '您即将访问外部链接，请确认是否继续：',
    cancelText: '取消',
    continueText: '继续访问',
    timer: 5, // 自动跳转倒计时（秒）
    favicon: '/favicon.ico'
  },

  // 缓存配置
  cache: {
    enabled: true, // 启用缓存（记住用户的选择）
    expiry: 24 * 60 * 60 * 1000 // 缓存过期时间：24小时
  },

  // 调试模式
  debug: false
};

// 如果你的网站使用特定的路径前缀，可以在这里配置
window.EXTERNAL_LINK_CONFIG.pathPrefix = '';

// 如果你想拦截特定的协议，可以在这里配置
window.EXTERNAL_LINK_CONFIG.blockedProtocols = [];

// 如果你想自动信任某些顶级域名，可以在这里配置
window.EXTERNAL_LINK_CONFIG.trustedTLDs = [
  'gov',
  'edu',
  'mil'
  // 'org' // 如果你想信任 .org 域名
];