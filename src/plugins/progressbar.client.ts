// import { defineNuxtPlugin } from '#app'

// export default defineNuxtPlugin((nuxtApp) => {
//   // 进度条状态
//   let progress = 0
//   let interval: any = null

//   // 创建进度条元素
//   const createProgressBar = () => {
//     // 检查是否已存在进度条
//     if (document.getElementById('nuxt-progress')) {
//       return
//     }

//     const progressBar = document.createElement('div')
//     progressBar.id = 'nuxt-progress'
//     progressBar.className = 'fixed top-0 left-0 right-0 z-50 h-1 bg-transparent pointer-events-none'
//     progressBar.innerHTML = `
//       <div class="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out" style="width: 0%"></div>
//     `
//     document.body.appendChild(progressBar)
//   }

//   // 更新进度条
//   const updateProgress = (value: number) => {
//     const bar = document.querySelector('#nuxt-progress > div') as HTMLElement
//     if (bar) {
//       bar.style.width = `${value}%`
//     }
//   }

//   // 开始进度
//   const start = () => {
//     createProgressBar()
//     progress = 0
//     updateProgress(0)

//     // 模拟进度增长
//     interval = setInterval(() => {
//       if (progress < 90) {
//         progress += Math.random() * 30
//         if (progress > 90) progress = 90
//         updateProgress(progress)
//       }
//     }, 100)
//   }

//   // 完成进度
//   const finish = () => {
//     if (interval) {
//       clearInterval(interval)
//       interval = null
//     }

//     updateProgress(100)

//     // 延迟后移除进度条
//     setTimeout(() => {
//       const bar = document.getElementById('nuxt-progress-bar')
//       if (bar) {
//         bar.remove()
//       }
//     }, 300)
//   }

//   // 监听路由开始
//   nuxtApp.hook('page:start', () => {
//     start()
//   })

//   // 监听路由完成
//   nuxtApp.hook('page:finish', () => {
//     finish()
//   })

//   // 监听路由错误
//   nuxtApp.hook('page:error', () => {
//     finish()
//   })
// })