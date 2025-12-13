import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async () => {
  // Tauri 环境检测
  if (window.__TAURI__) {
    const { WebviewWindow } = window.__TAURI__.window
    const { appWindow } = window.__TAURI__.window

    // 设置窗口最小尺寸 - 添加错误处理
    try {
      await appWindow.setMinSize(800, 600)
      console.log('窗口最小尺寸设置成功: 800x600')
    } catch (error) {
      console.warn('设置窗口最小尺寸失败:', error)
      // 不阻断应用启动，继续执行
    }

    // Tauri 环境检测完成
    console.log('Tauri environment detected')
  }
})

// 扩展 Window 类型以包含 Tauri API
declare global {
  interface Window {
    __TAURI__?: {
      window: {
        WebviewWindow: any
        appWindow: any
      }
      [key: string]: any
    }
  }
}