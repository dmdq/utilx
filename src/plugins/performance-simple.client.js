export default defineNuxtPlugin(() => {
  // 简化的性能监控（无需额外依赖）

  // 基础性能指标监控
  const measureBasicPerformance = () => {
    if (!process.client) return

    // 监控页面加载时间
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0]
        if (navigation) {
          const metrics = {
            // DNS 查询时间
            dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
            // TCP 连接时间
            tcpTime: navigation.connectEnd - navigation.connectStart,
            // 请求响应时间
            requestTime: navigation.responseEnd - navigation.requestStart,
            // DOM 解析时间
            domParseTime: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            // 页面加载总时间
            loadTime: navigation.loadEventEnd - navigation.navigationStart,
            // 首次内容渲染
            firstContentfulPaint: 0
          }

          // 尝试获取 First Contentful Paint
          const paintEntries = performance.getEntriesByType('paint')
          if (paintEntries.length > 0) {
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
            if (fcp) {
              metrics.firstContentfulPaint = Math.round(fcp.startTime)
            }
          }

          // 保存到本地存储
          const allMetrics = JSON.parse(localStorage.getItem('basicPerformanceMetrics') || '[]')
          allMetrics.push({
            ...metrics,
            url: window.location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          })

          // 只保留最近50条记录
          if (allMetrics.length > 50) {
            allMetrics.splice(0, allMetrics.length - 50)
          }

          localStorage.setItem('basicPerformanceMetrics', JSON.stringify(allMetrics))

          // 发送到分析服务（如果有 Google Analytics）
          if (typeof gtag !== 'undefined') {
            Object.entries(metrics).forEach(([key, value]) => {
              if (value > 0) {
                gtag('event', 'performance_metric', {
                  event_category: 'Performance',
                  event_label: key,
                  value: Math.round(value),
                  non_interaction: true
                })
              }
            })
          }

          // 控制台警告慢页面
          if (metrics.loadTime > 3000) {
            console.warn(`🐌 Slow page detected: ${Math.round(metrics.loadTime)}ms load time`)
          }
        }
      }, 0)
    })
  }

  // 监控用户交互
  const measureUserInteractions = () => {
    if (!process.client) return

    let clickCount = 0
    let scrollDepth = 0
    let startTime = Date.now()

    // 点击统计
    document.addEventListener('click', () => {
      clickCount++
    })

    // 滚动深度监控
    let maxScroll = 0
    let scrollTimer = null

    const updateScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const currentScroll = Math.round((scrollTop / scrollHeight) * 100)

      maxScroll = Math.max(maxScroll, currentScroll)

      // 防抖处理
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        if (maxScroll >= 25 && maxScroll < 50) {
          console.log(`📊 用户滚动到页面 ${maxScroll}%`)
        } else if (maxScroll >= 50 && maxScroll < 75) {
          console.log(`📊 用户滚动到页面 ${maxScroll}%`)
        } else if (maxScroll >= 75) {
          console.log(`📊 用户滚动到页面 ${maxScroll}%`)
        }
      }, 100)
    }

    window.addEventListener('scroll', updateScrollDepth, { passive: true })

    // 页面离开时记录数据
    const recordInteraction = () => {
      const timeOnPage = Date.now() - startTime

      const interactionData = {
        url: window.location.pathname,
        clickCount,
        scrollDepth: maxScroll,
        timeOnPage: Math.round(timeOnPage / 1000), // 转换为秒
        timestamp: new Date().toISOString()
      }

      // 保存到本地存储
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      interactions.push(interactionData)

      // 只保留最近30条记录
      if (interactions.length > 30) {
        interactions.splice(0, interactions.length - 30)
      }

      localStorage.setItem('userInteractions', JSON.stringify(interactions))

      // 发送到分析服务
      if (typeof gtag !== 'undefined') {
        gtag('event', 'user_engagement', {
          event_category: 'User Behavior',
          custom_parameters: {
            click_count: clickCount,
            scroll_depth: maxScroll,
            time_on_page: interactionData.timeOnPage
          }
        })
      }
    }

    // 监听页面离开
    window.addEventListener('beforeunload', recordInteraction)
    window.addEventListener('pagehide', recordInteraction)

    // SPA 路由切换时记录
    if (window.$nuxt) {
      window.$nuxt.$router.afterEach(recordInteraction)
    }
  }

  // 监控资源加载
  const measureResourceLoading = () => {
    if (!process.client) return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) {
          console.warn(`🐌 Slow resource: ${entry.name} took ${Math.round(entry.duration)}ms`)
        }

        // 记录大文件
        if (entry.transferSize > 1024 * 1024) { // 1MB
          console.warn(`📦 Large resource: ${entry.name} is ${Math.round(entry.transferSize / 1024 / 1024)}MB`)
        }
      })
    })

    try {
      observer.observe({ entryTypes: ['resource'] })
    } catch (error) {
      console.warn('Resource timing API not supported')
    }
  }

  // 监控 Long Tasks
  const measureLongTasks = () => {
    if (!process.client || !window.PerformanceObserver) return

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`⚠️ Long Task detected: ${Math.round(entry.duration)}ms blocking the main thread`)

            // 发送到分析服务
            if (typeof gtag !== 'undefined') {
              gtag('event', 'long_task', {
                event_category: 'Performance',
                value: Math.round(entry.duration),
                non_interaction: true
              })
            }
          }
        })
      })

      observer.observe({ entryTypes: ['longtask'] })
    } catch (error) {
      console.warn('Long Tasks API not supported')
    }
  }

  // 监控内存使用
  const measureMemoryUsage = () => {
    if (!process.client || !window.performance || !window.performance.memory) return

    const checkMemory = () => {
      const memory = window.performance.memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)

      // 内存使用超过 50MB 时警告
      if (usedMB > 50) {
        console.warn(`💾 High memory usage: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`)
      }

      // 保存内存数据
      const memoryData = {
        used: usedMB,
        total: totalMB,
        limit: limitMB,
        timestamp: new Date().toISOString(),
        url: window.location.pathname
      }

      const allMemoryData = JSON.parse(localStorage.getItem('memoryUsage') || '[]')
      allMemoryData.push(memoryData)

      // 只保留最近20条记录
      if (allMemoryData.length > 20) {
        allMemoryData.splice(0, allMemoryData.length - 20)
      }

      localStorage.setItem('memoryUsage', JSON.stringify(allMemoryData))
    }

    // 每30秒检查一次内存使用
    setInterval(checkMemory, 30000)
    checkMemory() // 立即检查一次
  }

  // 初始化所有监控
  if (process.client) {
    measureBasicPerformance()
    measureUserInteractions()
    measureResourceLoading()
    measureLongTasks()
    measureMemoryUsage()

    console.log('📊 Performance monitoring initialized (basic mode)')
  }

  // 提供全局访问
  provide('performanceMonitor', {
    getMetrics: () => JSON.parse(localStorage.getItem('basicPerformanceMetrics') || '[]'),
    getInteractions: () => JSON.parse(localStorage.getItem('userInteractions') || '[]'),
    getMemoryUsage: () => JSON.parse(localStorage.getItem('memoryUsage') || '[]'),
    // 生成性能报告
    generateReport: () => {
      const metrics = JSON.parse(localStorage.getItem('basicPerformanceMetrics') || '[]')
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      const memory = JSON.parse(localStorage.getItem('memoryUsage') || '[]')

      return {
        performance: {
          avgLoadTime: metrics.length > 0 ?
            Math.round(metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length) : 0,
          avgFCP: metrics.filter(m => m.firstContentfulPaint > 0).length > 0 ?
            Math.round(metrics.filter(m => m.firstContentfulPaint > 0)
              .reduce((sum, m) => sum + m.firstContentfulPaint, 0) /
              metrics.filter(m => m.firstContentfulPaint > 0).length) : 0
        },
        engagement: {
          avgTimeOnPage: interactions.length > 0 ?
            Math.round(interactions.reduce((sum, i) => sum + i.timeOnPage, 0) / interactions.length) : 0,
          avgScrollDepth: interactions.length > 0 ?
            Math.round(interactions.reduce((sum, i) => sum + i.scrollDepth, 0) / interactions.length) : 0
        },
        memory: {
          currentUsage: memory.length > 0 ? memory[memory.length - 1].used : 0,
          peakUsage: memory.length > 0 ? Math.max(...memory.map(m => m.used)) : 0
        }
      }
    }
  })
})