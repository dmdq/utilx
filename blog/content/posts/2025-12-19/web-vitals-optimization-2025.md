---
title: "2025年Web Vitals性能优化终极指南"
slug: "web-vitals-optimization-2025"
date: "2025-12-19T20:00:00+08:00"
author: "技术团队"
draft: false
description: "全面解析2025年Web Vitals优化策略，包括Core Web Vitals指标、最新优化技术和性能监控最佳实践。"
keywords: ["Web Vitals", "性能优化", "LCP", "FID", "CLS", "用户体验"]
summary: "掌握最新的Web性能优化技术，提升网站用户体验和搜索排名。"
categories: ["前端开发"]
tags: ["性能优化", "Web Vitals", "用户体验", "SEO", "前端"]
lastmod: "2025-12-19T20:00:00+08:00"
reading_time: true
toc: true
featured: true
---

## 2025年Web Vitals性能优化终极指南

Web Vitals已成为衡量网站用户体验的核心指标，直接影响SEO排名和用户满意度。本指南将深入探讨2025年最新的优化策略和技术。

### Core Web Vitals 2025更新

#### 1. LCP (Largest Contentful Paint) 优化

```javascript
// LCP监测和优化
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// 监测LCP
getLCP(console.log);

// LCP优化策略
class LCPOptimizer {
  constructor() {
    this.optimizationStrategies = [
      this.preloadCriticalResources.bind(this),
      this.optimizeImages.bind(this),
      this.minifyCriticalCSS.bind(this),
      this.useResourceHints.bind(this)
    ];
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/critical.js', as: 'script' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.keys(resource).forEach(key => {
        link.setAttribute(key, resource[key]);
      });
      document.head.appendChild(link);
    });
  }

  // 图片优化
  async optimizeImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImageOptimized(img);
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });

    images.forEach(img => imageObserver.observe(img));
  }

  // 优化图片加载
  async loadImageOptimized(img) {
    // 使用WebP格式
    const webpUrl = img.dataset.src.replace(/\.(jpg|png)$/, '.webp');

    // 响应式图片
    const srcset = this.generateSrcset(img.dataset.src);
    img.srcset = srcset;
    img.sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

    // 渐进式加载
    img.style.filter = 'blur(5px)';
    img.onload = () => {
      img.style.filter = 'none';
      img.style.transition = 'filter 0.3s';
    };

    img.src = webpUrl;
  }

  // 生成响应式图片srcset
  generateSrcset(baseUrl) {
    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map(width => `${baseUrl}?w=${width} ${width}w`)
      .join(', ');
  }
}

// 关键CSS内联
class CriticalCSS {
  constructor() {
    this.injectCriticalCSS();
    this.loadNonCriticalCSS();
  }

  injectCriticalCSS() {
    const criticalCSS = `
      /* 关键CSS内容 */
      body { margin: 0; font-family: system-ui; }
      .header { height: 60px; background: #fff; }
      .hero { min-height: 400px; background: linear-gradient(45deg, #667eea 0%, #764ba2 100%); }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  loadNonCriticalCSS() {
    const nonCriticalCSS = [
      '/css/animations.css',
      '/css/components.css',
      '/css/utilities.css'
    ];

    nonCriticalCSS.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.onload = function() {
        this.rel = 'stylesheet';
      };
      link.href = href;
      document.head.appendChild(link);
    });
  }
}
```

#### 2. FID (First Input Delay) 优化

```javascript
// FID优化策略
class FIDOptimizer {
  constructor() {
    this.optimizeJavaScript();
    this.setupEventListeners();
    this.minimizeMainThreadWork();
  }

  // JavaScript优化
  optimizeJavaScript() {
    // 代码分割
    this.lazyLoadModules();
    // 优化第三方脚本
    this.optimizeThirdPartyScripts();
    // 使用Web Workers
    this.setupWebWorkers();
  }

  // 懒加载模块
  lazyLoadModules() {
    const modules = {
      // 交互式地图
      map: () => import('./modules/map.js'),
      // 图表组件
      charts: () => import('./modules/charts.js'),
      // 视频播放器
      video: () => import('./modules/video.js')
    };

    // 按需加载
    document.addEventListener('click', (e) => {
      if (e.target.matches('.map-trigger')) {
        modules.map().then(module => module.init());
      }
    }, { passive: true });

    // 交集观察器加载
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const moduleName = entry.target.dataset.module;
          if (modules[moduleName]) {
            modules[moduleName]();
            observer.unobserve(entry.target);
          }
        }
      });
    }, { rootMargin: '100px' });

    document.querySelectorAll('[data-module]').forEach(el => {
      observer.observe(el);
    });
  }

  // 优化第三方脚本
  optimizeThirdPartyScripts() {
    // 延迟加载分析脚本
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.loadScript('https://www.google-analytics.com/analytics.js', {
          async: true,
          defer: true
        });
      }, 2000);
    });

    // 预连接到第三方域名
    const preconnectDomains = [
      'https://www.google-analytics.com',
      'https://stats.g.doubleclick.net',
      'https://fonts.googleapis.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  // Web Workers设置
  setupWebWorkers() {
    // 计算密集型任务移至Web Worker
    const workerCode = `
      self.onmessage = function(e) {
        const result = heavyComputation(e.data);
        self.postMessage(result);
      };

      function heavyComputation(data) {
        // 复杂计算逻辑
        return data.reduce((acc, val) => acc + val, 0);
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    // 使用示例
    worker.postMessage([1, 2, 3, 4, 5]);
    worker.onmessage = (e) => {
      console.log('计算结果:', e.data);
    };
  }

  // 优化事件监听器
  setupEventListeners() {
    // 使用事件委托
    document.body.addEventListener('click', (e) => {
      if (e.target.matches('.btn')) {
        this.handleButtonClick(e);
      }
    }, { passive: true });

    // 防抖滚动事件
    let ticking = false;
    const updatePosition = () => {
      // 更新位置逻辑
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updatePosition);
        ticking = true;
      }
    }, { passive: true });
  }
}
```

#### 3. CLS (Cumulative Layout Shift) 优化

```javascript
// CLS优化策略
class CLSOptimizer {
  constructor() {
    this.reserveSpace();
    this.optimizeFontLoading();
    this.handleAdsAndWidgets();
  }

  // 为动态内容预留空间
  reserveSpace() {
    // 图片容器预留空间
    const imageContainers = document.querySelectorAll('.image-container');
    imageContainers.forEach(container => {
      const aspectRatio = container.dataset.aspectRatio || '16/9';
      const [width, height] = aspectRatio.split('/').map(Number);
      const paddingBottom = (height / width) * 100;

      container.style.paddingBottom = `${paddingBottom}%`;
      container.style.position = 'relative';
    });

    // 字体加载前设置行高
    const headings = document.querySelectorAll('h1, h2, h3');
    headings.forEach(heading => {
      heading.style.lineHeight = '1.2';
      heading.style.minHeight = '1.2em';
    });

    // 广告位预留
    const adSlots = document.querySelectorAll('.ad-slot');
    adSlots.forEach(slot => {
      const width = slot.dataset.width || '300';
      const height = slot.dataset.height || '250';
      slot.style.width = `${width}px`;
      slot.style.height = `${height}px`;
      slot.style.backgroundColor = '#f0f0f0';
    });
  }

  // 优化字体加载
  optimizeFontLoading() {
    // 字体显示策略
    const fontDisplay = `
      @font-face {
        font-family: 'Custom Font';
        src: url('/fonts/custom-font.woff2') format('woff2');
        font-display: swap;
        ascent-override: 90%;
        descent-override: 35%;
      }
    `;

    const style = document.createElement('style');
    style.textContent = fontDisplay;
    document.head.appendChild(style);

    // 预加载关键字体
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = '/fonts/critical-font.woff2';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);

    // 字体加载优化
    if ('fonts' in document) {
      Promise.all([
        document.fonts.load('16px Custom Font'),
        document.fonts.load('24px Custom Font')
      ]).then(() => {
        document.documentElement.classList.add('fonts-loaded');
      });
    }
  }

  // 处理广告和嵌入内容
  handleAdsAndWidgets() {
    // 广告容器优化
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach(container => {
      container.style.minHeight = container.dataset.minHeight || '250px';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.backgroundColor = '#f5f5f5';
    });

    // 延迟加载嵌入内容
    const embedElements = document.querySelectorAll('[data-embed]');
    const embedObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          this.loadEmbed(element);
          embedObserver.unobserve(element);
        }
      });
    }, { rootMargin: '200px' });

    embedElements.forEach(el => embedObserver.observe(el));
  }

  // 加载嵌入内容
  loadEmbed(element) {
    const embedType = element.dataset.embed;
    const embedSrc = element.dataset.src;

    switch (embedType) {
      case 'youtube':
        element.innerHTML = `
          <iframe
            src="${embedSrc}"
            frameborder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
          </iframe>
        `;
        break;
      case 'twitter':
        this.loadTwitterEmbed(embedSrc, element);
        break;
    }
  }
}
```

### 性能监控和测量

#### 1. 实时性能监控

```javascript
// 性能监控系统
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.setupObservers();
    this.trackWebVitals();
  }

  setupObservers() {
    // Performance Observer
    if ('PerformanceObserver' in window) {
      this.observeNavigation();
      this.observeResources();
      this.observePaint();
      this.observeLayoutShift();
      this.observeLongTasks();
    }
  }

  // 导航性能监控
  observeNavigation() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          this.metrics.navigation = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            ssl: entry.secureConnectionStart > 0 ?
                 entry.connectEnd - entry.secureConnectionStart : 0,
            ttfb: entry.responseStart - entry.requestStart,
            download: entry.responseEnd - entry.responseStart,
            domParse: entry.domContentLoadedEventStart - entry.responseEnd,
            domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            loadComplete: entry.loadEventEnd - entry.loadEventStart
          };
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  // 资源加载监控
  observeResources() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        const resource = {
          name: entry.name,
          type: this.getResourceType(entry),
          duration: entry.duration,
          size: entry.transferSize || 0,
          cached: entry.transferSize === 0 && entry.decodedBodySize > 0
        };

        if (!this.metrics.resources) {
          this.metrics.resources = [];
        }
        this.metrics.resources.push(resource);
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  // LCP监控
  observePaint() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name === 'largest-contentful-paint') {
          this.metrics.lcp = entry.startTime;
        }
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  // CLS监控
  observeLayoutShift() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          this.metrics.cls = clsValue;
        }
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  // 长任务监控
  observeLongTasks() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!this.metrics.longTasks) {
          this.metrics.longTasks = [];
        }
        this.metrics.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime
        });
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);
  }

  // Web Vitals追踪
  trackWebVitals() {
    // 使用web-vitals库
    getCLS((metric) => {
      this.sendMetric('CLS', metric);
    });

    getFID((metric) => {
      this.sendMetric('FID', metric);
    });

    getLCP((metric) => {
      this.sendMetric('LCP', metric);
    });

    getFCP((metric) => {
      this.sendMetric('FCP', metric);
    });

    getTTFB((metric) => {
      this.sendMetric('TTFB', metric);
    });
  }

  // 发送指标到分析服务
  sendMetric(name, metric) {
    const data = {
      name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    // 发送到分析服务器
    fetch('/api/vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).catch(err => {
      console.warn('Failed to send vitals:', err);
    });
  }

  // 生成性能报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.lcp > 2500) {
      recommendations.push({
        metric: 'LCP',
        suggestion: '优化LCP：预加载关键资源，优化图片，使用CDN'
      });
    }

    if (this.metrics.fid > 100) {
      recommendations.push({
        metric: 'FID',
        suggestion: '优化FID：减少JavaScript执行时间，使用Web Workers'
      });
    }

    if (this.metrics.cls > 0.1) {
      recommendations.push({
        metric: 'CLS',
        suggestion: '优化CLS：为动态内容预留空间，优化字体加载'
      });
    }

    return recommendations;
  }
}
```

### 高级优化技术

#### 1. HTTP/3 和 QUIC 优化

```javascript
// HTTP/3优化配置
class HTTP3Optimizer {
  constructor() {
    this.optimizeConnections();
    this.enableEarlyHints();
  }

  optimizeConnections() {
    // Alt-Svc头部提示
    const altSvc = document.createElement('meta');
    altSvc.httpEquiv = 'Alt-Svc';
    altSvc.content = 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000';
    document.head.appendChild(altSvc);

    // 预连接到HTTP/3端点
    const h3Endpoints = [
      'https://api.example.com',
      'https://cdn.example.com'
    ];

    h3Endpoints.forEach(endpoint => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = endpoint;
      link.setAttribute('crossorigin', 'anonymous');
      document.head.appendChild(link);
    });
  }

  enableEarlyHints() {
    // 103 Early Hints支持
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-hints.js').then(registration => {
        registration.addEventListener('message', event => {
          if (event.data.type === 'EARLY_HINTS') {
            this.processEarlyHints(event.data.hints);
          }
        });
      });
    }
  }

  processEarlyHints(hints) {
    hints.link.forEach(link => {
      const linkEl = document.createElement('link');
      Object.keys(link).forEach(key => {
        linkEl.setAttribute(key, link[key]);
      });
      document.head.appendChild(linkEl);
    });
  }
}
```

#### 2. 边缘计算优化

```javascript
// 边缘计算优化
class EdgeOptimizer {
  constructor() {
    this.setupEdgeHeaders();
    this.configureCdnFeatures();
  }

  // 边缘优化头部
  setupEdgeHeaders() {
    const edgeHeaders = [
      { name: 'Edge-Cache-Tag', content: 'product-page,v2' },
      { name: 'Edge-Cache-TTL', content: '3600' },
      { name: 'Edge-Compute', content: 'true' }
    ];

    edgeHeaders.forEach(header => {
      const meta = document.createElement('meta');
      meta.name = header.name;
      meta.content = header.content;
      document.head.appendChild(meta);
    });
  }

  // CDN功能配置
  configureCdnFeatures() {
    // 自动图片优化
    const imgUrls = document.querySelectorAll('img[src*="cdn.example.com"]');
    imgUrls.forEach(img => {
      const url = new URL(img.src);
      url.searchParams.set('auto', 'format,compress');
      url.searchParams.set('width', img.getAttribute('width') || 'auto');
      url.searchParams.set('quality', '80');
      img.src = url.toString();
    });

    // 字体优化
    const fontUrls = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
    fontUrls.forEach(link => {
      const url = new URL(link.href);
      url.searchParams.set('display', 'swap');
      url.searchParams.set('subset', 'latin,latin-ext');
      link.href = url.toString();
    });
  }
}
```

### 实施和测试

#### 1. A/B测试框架

```javascript
// 性能A/B测试
class PerformanceABTest {
  constructor() {
    this.variant = this.getVariant();
    this.trackVariant();
  }

  getVariant() {
    // 从URL参数获取变体
    const urlParams = new URLSearchParams(window.location.search);
    const variant = urlParams.get('variant');

    if (variant) {
      return variant;
    }

    // 随机分配变体
    const variants = ['control', 'optimized'];
    const randomIndex = Math.floor(Math.random() * variants.length);
    const assignedVariant = variants[randomIndex];

    // 存储变体
    localStorage.setItem('ab_test_variant', assignedVariant);

    return assignedVariant;
  }

  trackVariant() {
    // 发送变体信息到分析服务
    fetch('/api/ab-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: 'performance_optimization',
        variant: this.variant,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    });
  }

  applyOptimizations() {
    if (this.variant === 'optimized') {
      // 应用性能优化
      new LCPOptimizer();
      new FIDOptimizer();
      new CLSOptimizer();
      new HTTP3Optimizer();
    }
  }

  trackPerformance() {
    // 追踪性能指标
    getCLS((metric) => {
      this.sendPerformanceMetric('CLS', metric);
    });

    getFID((metric) => {
      this.sendPerformanceMetric('FID', metric);
    });

    getLCP((metric) => {
      this.sendPerformanceMetric('LCP', metric);
    });
  }

  sendPerformanceMetric(metricName, metric) {
    fetch('/api/ab-test-metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: 'performance_optimization',
        variant: this.variant,
        metric: metricName,
        value: metric.value,
        timestamp: Date.now()
      })
    });
  }
}

// 初始化A/B测试
const abTest = new PerformanceABTest();
abTest.applyOptimizations();
abTest.trackPerformance();
```

### 2025年最新趋势

#### 1. AI驱动的性能优化

```javascript
// AI性能优化器
class AIPerformanceOptimizer {
  constructor() {
    this.aiModel = null;
    this.loadAIModel();
  }

  async loadAIModel() {
    // 加载TensorFlow.js模型
    const model = await tf.loadLayersModel('/models/performance-optimizer/model.json');
    this.aiModel = model;
  }

  async predictOptimalStrategy() {
    // 收集上下文数据
    const context = this.collectContext();

    // 预测最优策略
    const prediction = await this.aiModel.predict(context);

    return this.applyPredictedOptimizations(prediction);
  }

  collectContext() {
    return {
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      browserCapabilities: this.getBrowserCapabilities(),
      currentMetrics: this.getCurrentMetrics()
    };
  }

  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return 'mobile';
    } else if (/Tablet/.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  getConnectionType() {
    if ('connection' in navigator) {
      return navigator.connection.effectiveType;
    }
    return 'unknown';
  }

  getBrowserCapabilities() {
    return {
      webp: this.supportsWebP(),
      webp2: this.supportsWebP2(),
      avif: this.supportsAVIF(),
      http2: this.supportsHTTP2(),
      serviceWorker: 'serviceWorker' in navigator
    };
  }

  supportsWebP() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  supportsAVIF() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  supportsHTTP2() {
    // 通过检查资源时间戳判断
    const timing = performance.getEntriesByType('navigation')[0];
    return timing && timing.nextHopProtocol === 'h2';
  }

  async applyPredictedOptimizations(prediction) {
    const strategies = {
      images: {
        format: prediction.imageFormat,
        quality: prediction.imageQuality,
        lazyLoad: prediction.lazyLoadImages
      },
      scripts: {
        defer: prediction.deferScripts,
        preload: prediction.preloadCriticalScripts
      },
      styles: {
        inline: prediction.inlineCriticalCSS,
        preload: prediction.preloadFonts
      }
    };

    // 应用AI推荐的优化策略
    this.applyImageOptimizations(strategies.images);
    this.applyScriptOptimizations(strategies.scripts);
    this.applyStyleOptimizations(strategies.styles);
  }
}
```

### 最佳实践清单

#### 1. 部署前检查

```javascript
// 性能检查清单
class PerformanceChecklist {
  constructor() {
    this.checks = [
      this.checkImageOptimization,
      this.checkCriticalResources,
      this.checkThirdPartyScripts,
      this.checkCachingHeaders,
      this.checkCompression,
      this.checkMinification,
      this.checkCoreWebVitals
    ];
  }

  async runAllChecks() {
    const results = await Promise.all(
      this.checks.map(check => check.call(this))
    );

    return {
      score: this.calculateScore(results),
      results: results,
      recommendations: this.generateRecommendations(results)
    };
  }

  async checkImageOptimization() {
    const images = document.querySelectorAll('img');
    const issues = [];

    images.forEach(img => {
      // 检查格式
      if (!img.src.match(/\.(webp|avif|svg)$/)) {
        issues.push({
          element: img,
          issue: 'Suboptimal image format',
          suggestion: 'Use WebP or AVIF format'
        });
      }

      // 检查尺寸
      if (!img.srcset && !img.sizes) {
        issues.push({
          element: img,
          issue: 'Missing responsive images',
          suggestion: 'Add srcset and sizes attributes'
        });
      }

      // 检查懒加载
      if (!img.loading && !img.dataset.src) {
        const rect = img.getBoundingClientRect();
        if (rect.top > window.innerHeight) {
          issues.push({
            element: img,
            issue: 'Lazy loading not implemented',
            suggestion: 'Add loading="lazy" or implement custom lazy loading'
          });
        }
      }
    });

    return {
      name: 'Image Optimization',
      passed: issues.length === 0,
      issues: issues
    };
  }

  async checkCoreWebVitals() {
    return new Promise((resolve) => {
      let metrics = {};

      getCLS((metric) => {
        metrics.cls = metric;
        checkComplete();
      });

      getFID((metric) => {
        metrics.fid = metric;
        checkComplete();
      });

      getLCP((metric) => {
        metrics.lcp = metric;
        checkComplete();
      });

      function checkComplete() {
        if (metrics.cls && metrics.fid && metrics.lcp) {
          const issues = [];

          if (metrics.lcp.value > 2500) {
            issues.push({
              metric: 'LCP',
              value: metrics.lcp.value,
              threshold: 2500,
              status: metrics.lcp.value > 4000 ? 'poor' : 'needs-improvement'
            });
          }

          if (metrics.fid.value > 100) {
            issues.push({
              metric: 'FID',
              value: metrics.fid.value,
              threshold: 100,
              status: metrics.fid.value > 300 ? 'poor' : 'needs-improvement'
            });
          }

          if (metrics.cls.value > 0.1) {
            issues.push({
              metric: 'CLS',
              value: metrics.cls.value,
              threshold: 0.1,
              status: metrics.cls.value > 0.25 ? 'poor' : 'needs-improvement'
            });
          }

          resolve({
            name: 'Core Web Vitals',
            passed: issues.length === 0,
            metrics: metrics,
            issues: issues
          });
        }
      }
    });
  }

  calculateScore(results) {
    const totalChecks = results.length;
    const passedChecks = results.filter(r => r.passed).length;
    return Math.round((passedChecks / totalChecks) * 100);
  }

  generateRecommendations(results) {
    const allIssues = results.flatMap(r => r.issues || []);
    return allIssues.map(issue => ({
      priority: this.calculatePriority(issue),
      description: issue.suggestion || issue.issue,
      element: issue.element?.outerHTML?.substring(0, 100) + '...'
    })).sort((a, b) => b.priority - a.priority);
  }

  calculatePriority(issue) {
    // 根据影响程度计算优先级
    const highImpactMetrics = ['LCP', 'CLS', 'FID'];
    if (issue.metric && highImpactMetrics.includes(issue.metric)) {
      return issue.status === 'poor' ? 10 : 7;
    }
    return 5;
  }
}

// 运行性能检查
const checklist = new PerformanceChecklist();
const performanceReport = await checklist.runAllChecks();
console.log('Performance Score:', performanceReport.score);
```

### 总结

2025年Web Vitals优化的关键策略：

1. **LCP优化**：关键资源预加载、图片优化、CDN使用
2. **FID优化**：JavaScript优化、Web Workers、代码分割
3. **CLS优化**：空间预留、字体优化、异步内容加载
4. **监控测量**：实时监控、A/B测试、AI优化
5. **新技术应用**：HTTP/3、边缘计算、AI驱动优化

通过实施这些策略，可以显著提升网站性能，改善用户体验。

### 相关资源

- [Web Vitals官方文档](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)