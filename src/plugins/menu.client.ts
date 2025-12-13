// 菜单功能插件 - 客户端
export default defineNuxtPlugin(() => {
  // 只在 Tauri 环境中运行
  if (process.client && window.__TAURI__) {
    // 添加退出快捷键支持
    const addQuitShortcuts = () => {
      document.addEventListener('keydown', (event) => {
        // Ctrl+Q 或 Cmd+Q - 退出程序
        if ((event.ctrlKey || event.metaKey) && event.key === 'q') {
          event.preventDefault()
          // 调用退出程序
          if ((window as any).__TAURI__?.invoke) {
            (window as any).__TAURI__.invoke('quit_app')
          } else {
            // 备用方案
            window.close()
          }
        }
      })
    }

    // 导航到指定页面
    const navigateToPage = async (page: string) => {
      try {
        if (window.__TAURI__?.invoke) {
          await window.__TAURI__.invoke('navigate_to_page', { page })
        } else {
          // 降级到客户端路由
          switch (page) {
            case 'home':
              // 强制返回首页，处理外部链接情况
              console.log('🏠 [CLIENT] 强制返回首页')
              if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                console.log('检测到外部链接，强制返回应用首页')
                window.location.replace('/')
              } else {
                window.location.href = '/'
              }
              break
            case 'updates':
              window.location.href = '/feedback/'
              break
            case 'about':
              window.location.href = '/about/'
              break
          }
        }
      } catch (error) {
        console.error('导航失败:', error)
      }
    }

    // 初始化退出快捷键
    addQuitShortcuts()

    // 添加全局菜单函数到 window 对象
    ;(window as any).utilMenu = {
      goHome: () => navigateToPage('home'),
      checkUpdates: () => navigateToPage('updates'),
      showAbout: () => navigateToPage('about'),
      quitApp: () => {
        if ((window as any).__TAURI__?.invoke) {
          (window as any).__TAURI__.invoke('quit_app')
        }
      }
    }
  }
})