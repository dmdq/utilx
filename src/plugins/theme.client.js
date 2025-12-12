// 客户端主题初始化插件
export default defineNuxtPlugin(() => {
  // 只在客户端执行
  if (process.client) {
    // 确保DOM已加载
    onMounted(() => {
      // 检查并应用保存的主题
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // 默认使用暗色主题
        document.documentElement.classList.add('dark')
      }
    })
  }
})