export default defineNuxtPlugin(() => {
  // Web Vitals 监控
  const reportWebVitals = (metric) => {
    // 发送到分析服务
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true
      })
    }

    // 本地存储用于调试
    const vitals = JSON.parse(localStorage.getItem('webVitals') || '[]')
    vitals.push({
      ...metric,
      timestamp: new Date().toISOString(),
      url: window.location.pathname
    })

    // 只保留最近100条记录
    if (vitals.length > 100) {
      vitals.splice(0, vitals.length - 100)
    }

    localStorage.setItem('webVitals', JSON.stringify(vitals))
  }

  // 监控页面性能
  const observePagePerformance = () => {
    // 监控 Long Tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long Task detected: ${entry.duration}ms`, entry)

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
    }

    // 监控资源加载
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) {
          console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`)
        }
      })
    })

    resourceObserver.observe({ entryTypes: ['resource'] })
  }

  // 监控用户交互
  const observeUserInteractions = () => {
    let clickCount = 0
    let scrollDepth = 0
    let timeOnPage = 0

    // 点击统计
    document.addEventListener('click', () => {
      clickCount++
    })

    // 滚动深度
    let maxScroll = 0
    window.addEventListener('scroll', () => {
      const scrollPercentage = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      )
      maxScroll = Math.max(maxScroll, scrollPercentage)
    })

    // 页面停留时间
    const startTime = Date.now()

    // 页面卸载时发送数据
    const sendAnalytics = () => {
      timeOnPage = Date.now() - startTime
      scrollDepth = maxScroll

      // 发送到分析服务
      if (typeof gtag !== 'undefined') {
        gtag('event', 'page_interaction', {
          event_category: 'User Engagement',
          custom_parameters: {
            click_count: clickCount,
            scroll_depth: scrollDepth,
            time_on_page: Math.round(timeOnPage / 1000)
          }
        })
      }

      // 本地存储
      const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]')
      interactions.push({
        url: window.location.pathname,
        clickCount,
        scrollDepth,
        timeOnPage,
        timestamp: new Date().toISOString()
      })

      // 只保留最近50条记录
      if (interactions.length > 50) {
        interactions.splice(0, interactions.length - 50)
      }

      localStorage.setItem('userInteractions', JSON.stringify(interactions))
    }

    // 页面卸载时发送
    window.addEventListener('beforeunload', sendAnalytics)
    // SPA 路由切换时发送
    window.addEventListener('popstate', sendAnalytics)
  }

  // 初始化监控
  if (process.client) {
    // 检查是否可以导入 web-vitals 库
    observePagePerformance()
    observeUserInteractions()

    // Web Vitals monitoring (optional)
    // 注意：web-vitals库可能会影响构建，如果不需要可以注释掉
    try {
      // 使用动态导入，并添加错误处理
      import('web-vitals/attribution').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        console.log('Web Vitals monitoring enabled')
        onCLS(reportWebVitals)
        onINP(reportWebVitals)
        onFCP(reportWebVitals)
        onLCP(reportWebVitals)
        onTTFB(reportWebVitals)
      }).catch((error) => {
        console.warn('web-vitals library not available, using built-in performance monitoring only:', error.message)
      })
    } catch (error) {
      console.warn('Failed to load web-vitals library:', error.message)
    }
  }

  // 提供全局访问
  provide('performanceMonitor', {
    reportWebVitals,
    getMetrics: () => JSON.parse(localStorage.getItem('webVitals') || '[]'),
    getInteractions: () => JSON.parse(localStorage.getItem('userInteractions') || '[]')
  })
})