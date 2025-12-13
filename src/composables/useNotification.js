// 通知系统 composable
import { ref } from 'vue'

export const useNotification = () => {
  const notifications = ref([])

  // 添加通知
  const addNotification = (message, type = 'info', duration = 3000) => {
    const id = Date.now()
    const notification = {
      id,
      message,
      type,
      show: true
    }

    notifications.value.push(notification)

    // 自动隐藏通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  // 移除通知
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 显示成功通知
  const showSuccess = (message, duration = 3000) => {
    return addNotification(message, 'success', duration)
  }

  // 显示错误通知
  const showError = (message, duration = 5000) => {
    return addNotification(message, 'error', duration)
  }

  // 显示信息通知
  const showInfo = (message, duration = 3000) => {
    return addNotification(message, 'info', duration)
  }

  // 显示警告通知
  const showWarning = (message, duration = 4000) => {
    return addNotification(message, 'warning', duration)
  }

  // 清除所有通知
  const clearAll = () => {
    notifications.value = []
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearAll
  }
}