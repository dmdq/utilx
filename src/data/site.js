// 网站配置文件
export const siteConfig = {
  // Google Analytics ID (如果有的话)
  googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',

  // 自定义头部脚本
  customHeadScripts: process.env.CUSTOM_HEAD_SCRIPTS || '',

  // 自定义底部脚本
  customFooterScripts: process.env.CUSTOM_FOOTER_SCRIPTS || '',

  // 网站标题（与首页 TDK 保持同一定位：具体场景 + 隐私本地，避开红海通用词）
  title: '有条工具 · 免注册的本地小工具集',

  // SEO标题后缀（用于页面标题）
  titleSuffix: ' - 有条工具',

  // 网站描述
  description: '收录各类浏览器本地小工具，覆盖开发、计算、设计、健康与工程场景，数据不上传、免注册、无广告，打开即用。',

  // 网站关键词
  keywords: '本地计算工具,免注册在线工具,在线换算器,隐私安全工具箱,场景工具合集,离线可用小工具,有条工具',

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