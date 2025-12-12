// 主题管理 composable
export const useTheme = () => {
  // 获取当前主题
  const getTheme = () => {
    if (process.client) {
      return localStorage.getItem('theme') || 'dark'
    }
    return 'dark'
  }

  // 设置主题
  const setTheme = (theme) => {
    if (process.client) {
      const html = document.documentElement
      if (theme === 'dark') {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
      localStorage.setItem('theme', theme)
    }
  }

  // 切换主题
  const toggleTheme = () => {
    const currentTheme = getTheme()
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    return newTheme
  }

  // 初始化主题
  const initTheme = () => {
    if (process.client) {
      const savedTheme = getTheme()
      setTheme(savedTheme)
    }
  }

  return {
    getTheme,
    setTheme,
    toggleTheme,
    initTheme
  }
}