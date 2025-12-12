// Service Worker 错误处理插件
export default defineNuxtPlugin(() => {
  if (process.client && 'serviceWorker' in navigator) {
    window.addEventListener('error', (event) => {
      // 忽略 workbox 预缓存的特定错误
      if (event.message && event.message.includes('bad-precaching-response')) {
        console.warn('Workbox precaching warning (safe to ignore):', event.message)
        event.preventDefault()
      }
    })

    window.addEventListener('unhandledrejection', (event) => {
      // 忽略 workbox 预缓存的 promise rejection
      if (event.reason && event.reason.toString().includes('bad-precaching-response')) {
        console.warn('Workbox precaching warning (safe to ignore):', event.reason)
        event.preventDefault()
      }
    })
  }
})