// 网站配置文件
export const siteConfig = {
  // Google Analytics ID (如果有的话)
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',

  // 自定义头部脚本
  customHeadScripts: process.env.CUSTOM_HEAD_SCRIPTS || '',

  // 自定义底部脚本
  customFooterScripts: process.env.CUSTOM_FOOTER_SCRIPTS || '',

  // 网站标题
  title: '有条工具 - 开发者的常用的工具集合',

  // SEO标题后缀（用于页面标题）
  titleSuffix: ' - 有条工具',

  // 网站描述
  description: '无广告 · 本地计算 · 即开即用的在线工具平台',

  // 网站关键词
  keywords: '在线工具, 开发工具, JSON格式化, Base64编码, 时间戳转换, 正则表达式测试',

  // 快捷工具配置
  quickTools: {
    // 返回顶部工具
    backToTop: {
      enabled: true, // 默认开启
      threshold: 0.2, // 滚动到20%时显示，降低阈值使其更容易触发
      showDuration: 300, // 显示动画时长(ms)
      hideDuration: 200 // 隐藏动画时长(ms)
    }
  }
}