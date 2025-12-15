export default defineNuxtPlugin((nuxtApp) => {
  // 确保进度条样式在客户端加载时立即应用
  if (typeof window !== 'undefined') {
    // 创建进度条元素（如果不存在）
    const createProgressBar = () => {
      if (!document.getElementById('nuxt-progress')) {
        const progressBar = document.createElement('div')
        progressBar.id = 'nuxt-progress'
        progressBar.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 0;
          height: 1px;
          z-index: 9999;
          background: linear-gradient(90deg, rgb(60, 60, 60) 0%, rgb(80, 80, 80) 25%, rgb(100, 100, 100) 50%, rgb(80, 80, 80) 75%, rgb(60, 60, 60) 100%);
          opacity: 0;
          transition: opacity 0.3s ease, width 0.3s ease;
          background-size: 200% 100%;
          animation: progressGlow 2s ease-in-out infinite;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
        `
        document.body.appendChild(progressBar)

        // 添加动画样式
        if (!document.getElementById('progress-styles')) {
          const style = document.createElement('style')
          style.id = 'progress-styles'
          style.textContent = `
            @keyframes progressGlow {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .dark #nuxt-progress {
              background: linear-gradient(90deg, rgb(90, 90, 90) 0%, rgb(120, 120, 120) 25%, rgb(150, 150, 150) 50%, rgb(120, 120, 120) 75%, rgb(90, 90, 90) 100%) !important;
              box-shadow: 0 0 10px rgba(150, 150, 150, 0.2) !important;
            }
          `
          document.head.appendChild(style)
        }
      }
      return document.getElementById('nuxt-progress')
    }

    // 动画进度条
    let progressInterval: NodeJS.Timeout | null = null
    let currentProgress = 0

    const startProgress = () => {
      const progressBar = createProgressBar()
      if (!progressBar) return

      currentProgress = 0
      progressBar.style.opacity = '0.9'
      progressBar.style.width = '0%'

      // 清除旧的interval
      if (progressInterval) clearInterval(progressInterval)

      // 开始动画
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 30
        if (currentProgress > 90) currentProgress = 90
        progressBar.style.width = currentProgress + '%'
      }, 100)
    }

    const finishProgress = () => {
      const progressBar = document.getElementById('nuxt-progress')
      if (!progressBar) return

      // 清除interval
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }

      // 完成100%
      progressBar.style.width = '100%'

      // 延迟隐藏
      setTimeout(() => {
        progressBar.style.opacity = '0'
        setTimeout(() => {
          progressBar.style.width = '0%'
        }, 300)
      }, 200)
    }

    // 监听路由变化
    let routeChangeTimer: NodeJS.Timeout | null = null

    nuxtApp.hook('page:start', () => {
      // 清除旧的计时器
      if (routeChangeTimer) {
        clearTimeout(routeChangeTimer)
      }

      // 延迟显示进度条，避免快速切换时的闪烁
      routeChangeTimer = setTimeout(() => {
        startProgress()
      }, 50)
    })

    nuxtApp.hook('page:finish', () => {
      if (routeChangeTimer) {
        clearTimeout(routeChangeTimer)
        routeChangeTimer = null
      }
      finishProgress()
    })

    // 初始化进度条
    nextTick(() => {
      createProgressBar()
    })
  }
})