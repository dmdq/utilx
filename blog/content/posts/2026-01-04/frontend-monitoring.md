---
title: "前端监控与错误追踪实战指南"
slug: "frontend-monitoring"
date: 2026-01-04T16:00:00+08:00
draft: false
author: "技术团队"
description: "全面介绍前端监控系统的构建，包括性能监控、错误追踪、用户行为分析等技术，帮助提升应用质量和用户体验"
tags: ["前端监控", "性能优化", "错误追踪", "用户体验", "数据分析"]
categories: ["前端技术", "监控"]
---

## 前端监控系统概览

完整的前端监控系统应该包含：

1. **性能监控** - 页面加载、资源、交互性能
2. **错误追踪** - JavaScript错误、资源错误、网络错误
3. **用户体验** - Core Web Vitals、用户行为
4. **业务指标** - 转化率、留存率等

## 性能监控

### Performance API

```javascript
// 页面加载性能
function measurePagePerformance() {
  if (!window.performance) return

  const timing = window.performance.timing
  const navigation = performance.getEntriesByType('navigation')[0]

  const metrics = {
    // DNS查询时间
    dns: timing.domainLookupEnd - timing.domainLookupStart,

    // TCP连接时间
    tcp: timing.connectEnd - timing.connectStart,

    // 请求响应时间
    request: timing.responseEnd - timing.requestStart,

    // DOM解析时间
    domParse: timing.domComplete - timing.domLoading,

    // 首次内容绘制
    fcp: navigation?.loadEventEnd,

    // 首次输入延迟
    fid: 0,

    // 最大内容绘制
    lcp: 0,

    // 首次字节时间
    ttfb: timing.responseStart - timing.navigationStart,

    // 页面完全加载时间
    loadTime: timing.loadEventEnd - timing.navigationStart
  }

  return metrics
}
```

### Core Web Vitals

```javascript
// LCP (Largest Contentful Paint)
function measureLCP() {
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    console.log('LCP:', lastEntry.startTime)
  }).observe({ entryTypes: ['largest-contentful-paint'] })
}

// FID (First Input Delay)
function measureFID() {
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('FID:', entry.processingStart - entry.startTime)
    }
  }).observe({ entryTypes: ['first-input'] })
}

// CLS (Cumulative Layout Shift)
function measureCLS() {
  let clsValue = 0
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    }
    console.log('CLS:', clsValue)
  }).observe({ entryTypes: ['layout-shift'] })
}
```

### 资源加载监控

```javascript
function monitorResources() {
  const resources = performance.getEntriesByType('resource')

  resources.forEach(resource => {
    const data = {
      name: resource.name,
      type: resource.initiatorType,
      duration: resource.duration,
      size: resource.transferSize,
      // 资源加载时间分解
      dns: resource.domainLookupEnd - resource.domainLookupStart,
      tcp: resource.connectEnd - resource.connectStart,
      ssl: resource.secureConnectionStart > 0 ?
        resource.connectEnd - resource.secureConnectionStart : 0,
      ttfb: resource.responseStart - resource.requestStart,
      download: resource.responseEnd - resource.responseStart
    }

    // 检测慢资源
    if (data.duration > 1000) {
      console.warn('Slow resource:', data)
    }
  })
}
```

## 错误追踪

### 全局错误捕获

```javascript
// JavaScript错误
window.addEventListener('error', (event) => {
  const error = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack,
    type: 'javascript',
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }

  sendErrorToServer(error)
})

// Promise错误
window.addEventListener('unhandledrejection', (event) => {
  const error = {
    reason: event.reason,
    promise: event.promise,
    type: 'promise',
    timestamp: Date.now(),
    url: window.location.href
  }

  sendErrorToServer(error)
})

// 资源加载错误
window.addEventListener('error', (event) => {
  if (event.target !== window) {
    const error = {
      tagName: event.target.tagName,
      src: event.target.src || event.target.href,
      type: 'resource',
      timestamp: Date.now()
    }

    sendErrorToServer(error)
  }
}, true)
```

### Vue错误处理

```javascript
// Vue应用全局错误处理
app.config.errorHandler = (err, instance, info) => {
  const error = {
    message: err.message,
    stack: err.stack,
    component: instance?.$options.name,
    info: info,
    type: 'vue',
    timestamp: Date.now()
  }

  sendErrorToServer(error)
}
```

### 错误聚合上报

```javascript
class ErrorTracker {
  constructor(config) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000,
      ...config
    }
    this.errorQueue = []
    this.startFlushTimer()
  }

  addError(error) {
    this.errorQueue.push({
      ...error,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId()
    })

    if (this.errorQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  async flush() {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      })
    } catch (e) {
      console.error('Failed to send errors:', e)
      // 重新入队
      this.errorQueue.unshift(...errors)
    }
  }

  startFlushTimer() {
    setInterval(() => {
      this.flush()
    }, this.config.flushInterval)
  }

  getUserId() {
    // 获取或生成用户ID
    let userId = localStorage.getItem('tracker_user_id')
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random()
      localStorage.setItem('tracker_user_id', userId)
    }
    return userId
  }
}
```

## 用户行为追踪

### 页面访问追踪

```javascript
class PageTracker {
  constructor() {
    this.currentPage = null
    this.pageStartTime = null
    this.init()
  }

  init() {
    // 页面加载完成
    window.addEventListener('load', () => {
      this.trackPageView()
    })

    // SPA路由变化
    this.trackRouteChanges()
  }

  trackPageView() {
    this.pageStartTime = Date.now()
    this.currentPage = {
      url: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
      timestamp: this.pageStartTime
    }

    this.sendEvent('pageview', this.currentPage)
  }

  trackRouteChanges() {
    // 监听路由变化（需要根据具体框架实现）
    let lastUrl = location.href
    new MutationObserver(() => {
      const url = location.href
      if (url !== lastUrl) {
        lastUrl = url
        this.trackPageView()
      }
    }).observe(document, { subtree: true, childList: true })
  }

  trackEvent(category, action, label, value) {
    this.sendEvent('event', {
      category,
      action,
      label,
      value,
      timestamp: Date.now()
    })
  }

  sendEvent(type, data) {
    // 发送到分析服务器
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data,
        userId: this.getUserId(),
        sessionId: this.getSessionId()
      })
    })
  }
}
```

### 交互追踪

```javascript
class InteractionTracker {
  constructor() {
    this.init()
  }

  init() {
    // 点击追踪
    document.addEventListener('click', (e) => {
      const target = e.target
      const data = {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        text: target.textContent?.slice(0, 50),
        x: e.clientX,
        y: e.clientY
      }
      this.track('click', data)
    }, true)

    // 滚动追踪
    let scrollTimeout
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        this.track('scroll', {
          scrollDepth: this.getScrollDepth()
        })
      }, 100)
    })
  }

  getScrollDepth() {
    const scrollTop = window.pageYOffset
    const docHeight = document.documentElement.scrollHeight
    const winHeight = window.innerHeight
    return Math.round((scrollTop / (docHeight - winHeight)) * 100)
  }

  track(type, data) {
    // 发送交互数据
  }
}
```

## 完整监控方案

```javascript
class MonitorSDK {
  constructor(config) {
    this.config = config
    this.errorTracker = new ErrorTracker(config.error)
    this.pageTracker = new PageTracker()
    this.interactionTracker = new InteractionTracker()
  }

  // 性能指标
  startPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
      // 监控LCP
      this.observeLCP()
      // 监控FID
      this.observeFID()
      // 监控CLS
      this.observeCLS()
    }

    // 页面卸载时发送最终数据
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  observeLCP() {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.reportMetric('LCP', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
  }

  observeFID() {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.reportMetric('FID', entry.processingStart - entry.startTime)
      }
    }).observe({ entryTypes: ['first-input'] })
  }

  observeCLS() {
    let clsValue = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      this.reportMetric('CLS', clsValue)
    }).observe({ entryTypes: ['layout-shift'] })
  }

  reportMetric(name, value) {
    // 上报性能指标
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value,
        timestamp: Date.now(),
        url: window.location.href
      })
    })
  }

  flush() {
    this.errorTracker.flush()
  }
}

// 初始化
const monitor = new MonitorSDK({
  error: {
    batchSize: 10,
    flushInterval: 5000
  }
})

monitor.startPerformanceMonitoring()
```

## 最佳实践

1. **采样策略** - 高流量时采用采样
2. **数据压缩** - 减少传输数据量
3. **本地缓存** - 离线时缓存数据
4. **隐私保护** - 遵守隐私法规
5. **性能影响** - 最小化监控对性能的影响

## 总结

前端监控系统是保障应用质量的重要工具。通过全面的性能监控、错误追踪和用户行为分析，可以及时发现并解决问题，提升用户体验。
