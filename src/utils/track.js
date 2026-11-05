// 百度统计自定义事件封装（仅客户端）
// hm.js 仅生产环境注入（见 plugins/baidu-analytics.client.js），dev 下 _hmt 不存在时静默跳过。
// 用法：trackEvent('工具结果', '复制', 'vat-calculator')
// 事件规范见 docs/BA_EVENT_TRACKING_PLAN.md
export function trackEvent(category, action, label, value) {
  if (!import.meta.client) return
  const hmt = typeof window !== 'undefined' ? window._hmt : null
  if (!Array.isArray(hmt)) return
  const args = ['_trackEvent', String(category), String(action)]
  if (label !== undefined && label !== null) args.push(String(label))
  if (value !== undefined && value !== null) args.push(Number(value))
  hmt.push(args)
}
