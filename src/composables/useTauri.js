// Tauri 特定功能 composable
import { useNotification } from './useNotification'

export const useTauri = () => {
  const isTauri = typeof window !== 'undefined' && window.__TAURI__
  const { showSuccess, showError, showInfo } = useNotification()

  // 打开外部链接
  const openExternalLink = async (url) => {
    if (isTauri) {
      try {
        await window.__TAURI__.invoke('open_external_link', { url })

        // 显示成功通知
        showSuccess(`正在打开: ${url}`)

      } catch (error) {

        // 显示错误通知
        showError(`打开链接失败: ${error.message || error}`)

        // 降级到普通方式打开
        window.open(url, '_blank')
      }
    } else {
      // Web 环境
      window.open(url, '_blank')
    }
  }

  // 下载文件
  const downloadFile = async (url, filename, showProgress = true) => {

    if (showProgress) {
      showInfo(`开始下载: ${filename}`)
    }

    if (isTauri) {
      try {
        const result = await window.__TAURI__.invoke('download_file', { url, filename })

        if (showProgress) {
          showSuccess(`下载完成: ${filename}`)
        }

        // 尝试系统通知
        try {
          if (window.__TAURI__ && window.__TAURI__.invoke) {
            // 使用我们的自定义系统通知命令
            await window.__TAURI__.invoke('send_system_notification', {
              title: '下载完成',
              body: `文件 ${filename} 已下载完成`
            })
          }
        } catch (systemNotificationError) {
          // 系统通知失败但不影响主功能
        }

        return result
      } catch (error) {

        if (showProgress) {
          showError(`下载失败: ${error.message || error}`)
        }

        // 降级到普通方式下载
        return fallbackDownload(url, filename, showProgress)
      }
    } else {
      // Web 环境
      return fallbackDownload(url, filename, showProgress)
    }
  }

  // 降级下载方式（适用于 Web 环境）
  const fallbackDownload = (url, filename, showProgress = true) => {
    return new Promise((resolve, reject) => {
      try {
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.target = '_blank'

        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        if (showProgress) {
          showInfo(`开始下载: ${filename}`)
        }

        resolve(`Download started: ${filename}`)
      } catch (error) {

      showError(`下载失败: ${error.message || error}`)

        reject(error)
      }
    })
  }

  // 检查是否在 Tauri 环境中
  const checkIsTauri = () => {
    return isTauri
  }

  return {
    openExternalLink,
    downloadFile,
    checkIsTauri
  }
}