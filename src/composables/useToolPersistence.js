export const useToolPersistence = (toolName) => {
  // 保存工具配置
  const saveConfig = (config) => {
    const key = `tool_${toolName}_config`
    localStorage.setItem(key, JSON.stringify({
      data: config,
      timestamp: new Date().toISOString()
    }))
  }

  // 加载工具配置
  const loadConfig = () => {
    const key = `tool_${toolName}_config`
    const saved = localStorage.getItem(key)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.data
      } catch (error) {
        console.error('Failed to load config:', error)
        return null
      }
    }
    return null
  }

  // 保存导出历史
  const saveExportHistory = (type, data) => {
    const key = `tool_${toolName}_exports`
    const history = JSON.parse(localStorage.getItem(key) || '[]')
    history.unshift({
      type,
      data,
      timestamp: new Date().toISOString()
    })

    // 只保留最近50条记录
    if (history.length > 50) {
      history.splice(50)
    }

    localStorage.setItem(key, JSON.stringify(history))
  }

  // 获取导出历史
  const getExportHistory = () => {
    const key = `tool_${toolName}_exports`
    return JSON.parse(localStorage.getItem(key) || '[]')
  }

  return {
    saveConfig,
    loadConfig,
    saveExportHistory,
    getExportHistory
  }
}