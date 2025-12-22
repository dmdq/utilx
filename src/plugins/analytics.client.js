export default defineNuxtPlugin(() => {
  // 工具使用统计
  const trackToolUsage = (toolName) => {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'tool_usage', {
        tool_name: toolName,
        timestamp: new Date().toISOString()
      })
    }

    // 本地存储使用次数
    const usage = JSON.parse(localStorage.getItem('toolUsage') || '{}')
    usage[toolName] = (usage[toolName] || 0) + 1
    localStorage.setItem('toolUsage', JSON.stringify(usage))
  }

  // 添加到全局
  provide('trackToolUsage', trackToolUsage)
})