---
title: "2025年前端性能优化终极指南：从Core Web Vitals到用户体验优化"
summary: "深入探讨2025年前端性能优化的最新技术和最佳实践，包括Core Web Vitals优化、代码分割、懒加载、缓存策略和现代Web性能工具的使用。"
date: 2025-12-22T15:00:00+08:00
draft: false
tags: ["前端性能", "Web Vitals", "性能优化", "用户体验", "现代Web"]
categories: ["前端开发"]
---

前端性能优化是提升用户体验的关键因素。随着2025年Web应用的复杂度不断增加，掌握最新的性能优化技术变得尤为重要。本文将全面介绍现代前端性能优化的策略和实践方法。

## Core Web Vitals优化

### Largest Contentful Paint (LCP) 优化

LCP测量页面加载过程中最大的内容元素的绘制时间：

```javascript
// LCP优化工具类
class LCPOptimizer {
  constructor() {
    this.lcpElements = new Set();
    this.optimizationStrategies = new Map();
  }

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { href: '/css/critical.css', as: 'style' },
      { href: '/images/hero.webp', as: 'image' }
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      Object.entries(resource).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
      document.head.appendChild(link);
    });
  }

  // 优化图片加载
  optimizeImages() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      // 使用现代图片格式
      this.convertToModernFormat(img);

      // 实现渐进式加载
      this.implementProgressiveLoading(img);

      // 优化图片尺寸
      this.optimizeImageDimensions(img);
    });
  }

  // 转换为现代图片格式
  convertToModernFormat(img) {
    const src = img.src;
    if (src && !src.includes('.webp') && !src.includes('.avif')) {
      // 动态生成WebP版本
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, '.webp');

      // 创建Picture元素
      const picture = document.createElement('picture');

      // AVIF源（优先级最高）
      const avifSource = document.createElement('source');
      avifSource.srcset = src.replace(/\.(jpg|jpeg|png)$/, '.avif');
      avifSource.type = 'image/avif';
      picture.appendChild(avifSource);

      // WebP源
      const webpSource = document.createElement('source');
      webpSource.srcset = webpSrc;
      webpSource.type = 'image/webp';
      picture.appendChild(webpSource);

      // 原始图片作为fallback
      picture.appendChild(img.cloneNode());

      img.parentNode.replaceChild(picture, img);
    }
  }

  // 实现渐进式图片加载
  implementProgressiveLoading(img) {
    img.loading = 'lazy';
    img.decoding = 'async';

    // 添加低质量图片占位符（LQIP）
    const lqipUrl = this.generateLQIP(img.src);

    if (lqipUrl) {
      img.style.filter = 'blur(10px)';
      img.style.transition = 'filter 0.3s ease-out';

      img.onload = () => {
        img.style.filter = 'none';
      };

      // 设置LQIP作为src
      if (!img.src || img.src === window.location.href) {
        img.src = lqipUrl;
        img.dataset.src = img.dataset.src || img.getAttribute('data-src');
      }
    }
  }

  // 生成低质量图片占位符
  generateLQIP(src) {
    // 实际项目中可以使用服务端生成的LQIP
    return `${src}?w=20&h=20&blur=10&format=webp`;
  }

  // 优化字体加载
  optimizeFontLoading() {
    // 预加载关键字体
    const fontDisplay = 'swap';

    // 使用Font Face Observer
    const font = new FontFaceObserver('Main Font', {
      weight: 400
    });

    font.load().then(() => {
      document.documentElement.classList.add('fonts-loaded');
    });

    // 优化字体回退策略
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Main Font';
        font-display: ${fontDisplay};
        src: url('/fonts/main.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }

  // 监控LCP性能
  observeLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      console.log('LCP:', {
        value: lastEntry.renderTime || lastEntry.loadTime,
        element: lastEntry.element?.tagName,
        url: lastEntry.url
      });

      // 发送性能数据到分析服务
      this.sendToAnalytics('LCP', {
        value: lastEntry.renderTime || lastEntry.loadTime,
        element: lastEntry.element?.tagName,
        url: lastEntry.url
      });
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
}
```

### First Input Delay (FID) 优化

FID测量用户首次交互到浏览器响应的时间：

```javascript
// FID优化工具类
class FIDOptimizer {
  constructor() {
    this.eventListeners = new Map();
    this.taskQueue = [];
  }

  // 优化JavaScript执行
  optimizeJavaScriptExecution() {
    // 代码分割
    this.implementCodeSplitting();

    // 延迟加载非关键JavaScript
    this.deferNonCriticalJS();

    // 优化事件监听器
    this.optimizeEventListeners();

    // 使用Web Workers
    this.setupWebWorkers();
  }

  // 实现代码分割
  implementCodeSplitting() {
    // 动态导入模块
    const loadModule = async (moduleName) => {
      try {
        const module = await import(`/modules/${moduleName}.js`);
        return module.default;
      } catch (error) {
        console.error(`Failed to load module ${moduleName}:`, error);
      }
    };

    // 路由级别的代码分割
    const loadRoute = async (route) => {
      const routeModule = await loadModule(`routes/${route}`);
      return routeModule;
    };

    // 组件级别的懒加载
    const LazyComponent = () => {
      return import('./components/HeavyComponent.js')
        .then(module => module.default);
    };
  }

  // 延迟加载非关键JavaScript
  deferNonCriticalJS() {
    const deferScripts = () => {
      const scripts = [
        '/js/analytics.js',
        '/js/chat-widget.js',
        '/js/feedback-form.js'
      ];

      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      });
    };

    // 在主线程空闲时加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(deferScripts, { timeout: 2000 });
    } else {
      setTimeout(deferScripts, 100);
    }
  }

  // 优化事件监听器
  optimizeEventListeners() {
    // 使用事件委托
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (target) {
        this.handleAction(target.dataset.action, event);
      }
    });

    // 防抖和节流
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    const throttle = (func, limit) => {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    };

    // 应用到滚动事件
    window.addEventListener('scroll', throttle(() => {
      this.handleScroll();
    }, 100));

    // 应用到输入事件
    const searchInput = document.getElementById('search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        this.handleSearch(e.target.value);
      }, 300));
    }
  }

  // 设置Web Workers
  setupWebWorkers() {
    // 创建Web Worker进行复杂计算
    const workerCode = `
      self.onmessage = function(e) {
        const { type, data } = e.data;

        switch(type) {
          case 'heavy_computation':
            const result = heavyComputation(data);
            self.postMessage({ type: 'computation_result', result });
            break;

          case 'data_processing':
            const processedData = processData(data);
            self.postMessage({ type: 'processing_result', data: processedData });
            break;
        }
      };

      function heavyComputation(data) {
        // 执行密集计算
        return data.reduce((sum, item) => sum + item.value, 0);
      }

      function processData(data) {
        // 处理大型数据集
        return data.map(item => ({ ...item, processed: true }));
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.onmessage = (e) => {
      this.handleWorkerMessage(e.data);
    };

    this.worker = worker;
  }

  // 监控FID性能
  observeFID() {
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        console.log('FID:', {
          value: entry.processingStart - entry.startTime,
          inputType: entry.name
        });

        // 发送性能数据
        this.sendToAnalytics('FID', {
          value: entry.processingStart - entry.startTime,
          inputType: entry.name
        });
      }
    }).observe({ entryTypes: ['first-input'] });
  }
}
```

### Cumulative Layout Shift (CLS) 优化

CLS测量页面内容的视觉稳定性：

```javascript
// CLS优化工具类
class CLSOptimizer {
  constructor() {
    this.reservedSpace = new Map();
    this.layoutShiftThreshold = 0.1;
  }

  // 为动态内容预留空间
  reserveSpaceForDynamicContent() {
    // 预留广告空间
    this.reserveAdSpace();

    // 预留图片空间
    this.reserveImageSpace();

    // 预留字体加载空间
    this.reserveFontSpace();

    // 预留动态内容空间
    this.reserveDynamicContentSpace();
  }

  // 预留广告空间
  reserveAdSpace() {
    const adContainers = document.querySelectorAll('.ad-container');

    adContainers.forEach(container => {
      const ad = container.querySelector('.ad');
      if (!ad) {
        // 创建占位符
        const placeholder = document.createElement('div');
        placeholder.className = 'ad-placeholder';
        placeholder.style.cssText = `
          width: 300px;
          height: 250px;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        `;
        placeholder.textContent = 'Advertisement';

        container.appendChild(placeholder);
        this.reservedSpace.set(container, placeholder);
      }
    });
  }

  // 预留图片空间
  reserveImageSpace() {
    const images = document.querySelectorAll('img[data-width][data-height]');

    images.forEach(img => {
      const width = img.dataset.width;
      const height = img.dataset.height;

      // 设置明确的尺寸以避免布局偏移
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      img.style.aspectRatio = `${width}/${height}`;
    });
  }

  // 预留字体空间
  reserveFontSpace() {
    // 设置最小字体高度以避免字体加载时的偏移
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Custom Font';
        font-display: swap;
        src: url('/fonts/custom.woff2') format('woff2');
        size-adjust: 95%;
      }

      body {
        font-family: 'Custom Font', system-ui, sans-serif;
      }

      /* 预留字体加载空间 */
      h1, h2, h3, h4, h5, h6 {
        height: 1.2em;
        line-height: 1.2;
      }

      p, div, span {
        min-height: 1em;
        line-height: 1.5;
      }
    `;
    document.head.appendChild(style);
  }

  // 预留动态内容空间
  reserveDynamicContentSpace() {
    const dynamicContainers = document.querySelectorAll('[data-dynamic-content]');

    dynamicContainers.forEach(container => {
      const defaultHeight = container.dataset.defaultHeight || '100px';
      const minHeight = container.dataset.minHeight || '50px';

      container.style.cssText += `
        min-height: ${minHeight};
        height: ${defaultHeight};
        transition: height 0.3s ease;
      `;

      // 监听内容加载
      this.observeDynamicContent(container);
    });
  }

  // 观察动态内容变化
  observeDynamicContent(container) {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const height = entry.contentRect.height;

        // 平滑调整高度
        container.style.height = `${height}px`;

        // 移除最小高度限制
        if (height > parseInt(container.dataset.minHeight)) {
          container.style.minHeight = 'auto';
        }
      }
    });

    resizeObserver.observe(container);
  }

  // 优化动画和过渡
  optimizeAnimations() {
    // 使用transform和opacity进行动画
    const animatedElements = document.querySelectorAll('[data-animate]');

    animatedElements.forEach(element => {
      const animation = element.dataset.animate;

      // 添加will-change提示
      element.style.willChange = 'transform, opacity';

      // 动画结束后移除will-change
      element.addEventListener('animationend', () => {
        element.style.willChange = 'auto';
      });

      // 使用CSS动画
      element.style.animation = animation;
    });
  }

  // 监控CLS性能
  observeCLS() {
    let clsValue = 0;

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;

          console.log('CLS:', {
            value: clsValue,
            entry: {
              value: entry.value,
              sources: entry.sources
            }
          });

          // 如果CLS超过阈值，发送警告
          if (clsValue > this.layoutShiftThreshold) {
            console.warn('CLS threshold exceeded:', clsValue);
            this.sendToAnalytics('CLS_WARNING', {
              value: clsValue,
              threshold: this.layoutShiftThreshold
            });
          }
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
}
```

## 现代性能优化技术

### 资源优先级和加载策略

```javascript
// 资源加载优化器
class ResourceLoadOptimizer {
  constructor() {
    this.loadingStrategies = new Map();
    this.criticalResources = new Set();
    this.preloadedResources = new Set();
  }

  // 实现智能预加载
  implementSmartPreloading() {
    // 基于用户行为预测的预加载
    this.setupBehavioralPreloading();

    // 基于路由的预加载
    this.setupRoutePreloading();

    // 基于视口的预加载
    this.setupViewportPreloading();
  }

  // 基于用户行为的预加载
  setupBehavioralPreloading() {
    const behaviorTracker = {
      hoverTimer: null,
      clickPatterns: new Map(),

      init() {
        this.trackHoverBehavior();
        this.trackClickPatterns();
        this.trackScrollBehavior();
      },

      trackHoverBehavior() {
        document.addEventListener('mouseover', (e) => {
          const link = e.target.closest('a');
          if (link && link.href) {
            this.hoverTimer = setTimeout(() => {
              this.preloadLink(link.href);
            }, 100);
          }
        });

        document.addEventListener('mouseout', (e) => {
          if (this.hoverTimer) {
            clearTimeout(this.hoverTimer);
          }
        });
      },

      trackClickPatterns() {
        document.addEventListener('click', (e) => {
          const link = e.target.closest('a');
          if (link && link.href) {
            const pattern = this.extractPattern(link.href);
            this.clickPatterns.set(pattern, (this.clickPatterns.get(pattern) || 0) + 1);

            // 如果某个模式被频繁点击，预加载相关资源
            if (this.clickPatterns.get(pattern) > 3) {
              this.preloadRelatedResources(pattern);
            }
          }
        });
      },

      extractPattern(url) {
        // 提取URL模式
        return new URL(url).pathname.replace(/\/\d+/, '/:id');
      },

      preloadLink(href) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      },

      preloadRelatedResources(pattern) {
        // 根据模式预加载相关资源
        const relatedResources = this.getRelatedResources(pattern);
        relatedResources.forEach(resource => {
          this.preloadResource(resource);
        });
      }
    };

    behaviorTracker.init();
  }

  // 实现资源提示（Resource Hints）
  implementResourceHints() {
    // DNS预解析
    const dnsPrefetchDomains = [
      'fonts.googleapis.com',
      'cdn.example.com',
      'analytics.example.com'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // 预连接关键域名
    const preconnectDomains = [
      'https://fonts.gstatic.com',
      'https://api.example.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  // 优化第三方资源加载
  optimizeThirdPartyResources() {
    // 延迟加载非关键第三方脚本
    this.deferThirdPartyScripts();

    // 使用Web Workers加载第三方脚本
    this.loadThirdPartyInWorkers();
  }

  // 延迟加载第三方脚本
  deferThirdPartyScripts() {
    const thirdPartyScripts = [
      { src: 'https://www.googletagmanager.com/gtag/js', name: 'google-analytics' },
      { src: 'https://cdn.jsdelivr.net/npm/chart.js', name: 'chartjs' },
      { src: 'https://platform.twitter.com/widgets.js', name: 'twitter' }
    ];

    const loadThirdPartyScript = (scriptConfig) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptConfig.src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    // 使用Intersection Observer延迟加载
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          thirdPartyScripts.forEach(scriptConfig => {
            loadThirdPartyScript(scriptConfig);
          });
          observer.disconnect();
        }
      });
    });

    // 观察页面底部
    const footer = document.querySelector('footer');
    if (footer) {
      observer.observe(footer);
    }
  }
}
```

### 缓存策略优化

```javascript
// 智能缓存管理器
class IntelligentCacheManager {
  constructor() {
    this.cacheStrategies = new Map();
    this.serviceWorker = null;
    this.cacheVersion = 'v1.0.0';
  }

  // 实现多级缓存策略
  implementMultiLevelCaching() {
    // 内存缓存
    this.setupMemoryCache();

    // Service Worker缓存
    this.setupServiceWorkerCache();

    // HTTP缓存优化
    this.optimizeHTTPCache();

    // IndexedDB缓存
    this.setupIndexedDBCache();
  }

  // 设置内存缓存
  setupMemoryCache() {
    class MemoryCache {
      constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
      }

      get(key) {
        if (this.cache.has(key)) {
          // 移到最后（LRU策略）
          const value = this.cache.get(key);
          this.cache.delete(key);
          this.cache.set(key, value);
          return value;
        }
        return null;
      }

      set(key, value, ttl = 300000) { // 默认5分钟
        if (this.cache.size >= this.maxSize) {
          // 删除最旧的条目
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }

        this.cache.set(key, {
          value,
          timestamp: Date.now(),
          ttl
        });
      }

      cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
          if (now - item.timestamp > item.ttl) {
            this.cache.delete(key);
          }
        }
      }
    }

    this.memoryCache = new MemoryCache();

    // 定期清理过期缓存
    setInterval(() => {
      this.memoryCache.cleanup();
    }, 60000);
  }

  // 设置Service Worker缓存
  async setupServiceWorkerCache() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.serviceWorker = registration.active || registration.installing;

      // 监听Service Worker消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  // 智能缓存策略
  getCacheStrategy(url, resourceType) {
    const strategies = {
      'image': {
        strategy: 'cache-first',
        cacheName: 'images',
        maxAge: 2592000, // 30天
        maxEntries: 100
      },
      'script': {
        strategy: 'stale-while-revalidate',
        cacheName: 'scripts',
        maxAge: 86400, // 1天
        maxEntries: 50
      },
      'style': {
        strategy: 'cache-first',
        cacheName: 'styles',
        maxAge: 2592000, // 30天
        maxEntries: 20
      },
      'api': {
        strategy: 'network-first',
        cacheName: 'api',
        maxAge: 300, // 5分钟
        maxEntries: 200
      }
    };

    return strategies[resourceType] || strategies['api'];
  }

  // 实现缓存预热
  implementCacheWarming() {
    // 关键资源预热
    this.warmCriticalResources();

    // 基于用户行为的缓存预热
    this.warmResourcesBasedOnBehavior();
  }

  // 预热关键资源
  async warmCriticalResources() {
    const criticalResources = [
      '/css/main.css',
      '/js/main.js',
      '/fonts/main.woff2',
      '/api/user/profile'
    ];

    for (const resource of criticalResources) {
      try {
        await this.cacheResource(resource);
        console.log(`Warmed cache for: ${resource}`);
      } catch (error) {
        console.error(`Failed to warm cache for ${resource}:`, error);
      }
    }
  }

  // 缓存资源
  async cacheResource(url) {
    const response = await fetch(url);
    if (response.ok) {
      const resourceType = this.getResourceType(url);
      const strategy = this.getCacheStrategy(url, resourceType);

      // 根据策略缓存资源
      if (this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'CACHE_RESOURCE',
          url,
          strategy
        });
      }
    }
  }

  // 获取资源类型
  getResourceType(url) {
    const extension = url.split('.').pop().toLowerCase();
    const typeMap = {
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'webp': 'image',
      'avif': 'image',
      'svg': 'image',
      'js': 'script',
      'css': 'style',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font'
    };

    return typeMap[extension] || 'other';
  }
}
```

## 性能监控与分析

### 实时性能监控

```javascript
// 实时性能监控系统
class RealTimePerformanceMonitor {
  constructor() {
    this.metrics = {
      navigation: {},
      resources: [],
      vitals: {},
      userInteractions: []
    };

    this.thresholds = {
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800,
      FCP: 1800
    };

    this.startMonitoring();
  }

  // 开始监控
  startMonitoring() {
    this.observeNavigation();
    this.observeResources();
    this.observeWebVitals();
    this.observeUserInteractions();
    this.startContinuousMonitoring();
  }

  // 观察页面导航
  observeNavigation() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];

      this.metrics.navigation = {
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        sslHandshake: navigation.secureConnectionStart > 0
          ? navigation.connectEnd - navigation.secureConnectionStart
          : 0,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
        domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        pageLoad: navigation.loadEventEnd - navigation.loadEventStart
      };

      this.analyzeNavigationPerformance();
    });
  }

  // 观察资源加载
  observeResources() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.entryType === 'resource') {
          this.metrics.resources.push({
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            startTime: entry.startTime
          });
        }
      });

      this.analyzeResourcePerformance();
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  // 观察Web Vitals
  observeWebVitals() {
    // LCP
    this.observeLCP();

    // FID
    this.observeFID();

    // CLS
    this.observeCLS();

    // 其他指标
    this.observeFCP();
    this.observeTTFB();
  }

  // 观察LCP
  observeLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.metrics.vitals.LCP = {
        value: lastEntry.renderTime || lastEntry.loadTime,
        element: lastEntry.element?.tagName,
        url: lastEntry.url
      };

      this.evaluateMetric('LCP', this.metrics.vitals.LCP.value);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }

  // 观察用户交互
  observeUserInteractions() {
    const interactionEvents = ['click', 'keydown', 'scroll', 'touchstart'];

    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const interaction = {
          type: eventType,
          timestamp: Date.now(),
          target: event.target.tagName,
          coordinates: {
            x: event.clientX,
            y: event.clientY
          }
        };

        this.metrics.userInteractions.push(interaction);
        this.analyzeInteractionPattern(interaction);
      });
    });
  }

  // 开始持续监控
  startContinuousMonitoring() {
    setInterval(() => {
      this.collectRealTimeMetrics();
      this.detectPerformanceAnomalies();
      this.updateDashboard();
    }, 5000); // 每5秒更新一次
  }

  // 收集实时指标
  collectRealTimeMetrics() {
    const realTimeMetrics = {
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      network: this.getNetworkInfo(),
      rendering: this.getRenderingPerformance(),
      activeTime: this.getActiveTime()
    };

    this.metrics.realTime = realTimeMetrics;
  }

  // 获取内存使用情况
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // 检测性能异常
  detectPerformanceAnomalies() {
    const anomalies = [];

    // 检测内存泄漏
    if (this.metrics.realTime?.memory?.percentage > 80) {
      anomalies.push({
        type: 'memory_leak',
        severity: 'high',
        message: 'Memory usage is above 80%'
      });
    }

    // 检测长时间任务
    const longTasks = this.getLongTasks();
    if (longTasks.length > 0) {
      anomalies.push({
        type: 'long_tasks',
        severity: 'medium',
        message: `Detected ${longTasks.length} long tasks`,
        details: longTasks
      });
    }

    // 检测网络问题
    if (this.metrics.realTime?.network?.effectiveType === 'slow-2g') {
      anomalies.push({
        type: 'slow_network',
        severity: 'medium',
        message: 'Network connection is very slow'
      });
    }

    if (anomalies.length > 0) {
      this.handleAnomalies(anomalies);
    }
  }

  // 处理异常
  handleAnomalies(anomalies) {
    anomalies.forEach(anomaly => {
      console.warn('Performance anomaly detected:', anomaly);

      // 发送告警
      this.sendAlert(anomaly);

      // 尝试自动修复
      this.attemptAutoFix(anomaly);
    });
  }

  // 尝试自动修复
  attemptAutoFix(anomaly) {
    switch (anomaly.type) {
      case 'memory_leak':
        this.triggerGarbageCollection();
        break;
      case 'long_tasks':
        this.optimizeTaskScheduling();
        break;
      case 'slow_network':
        this.enableDataSavingMode();
        break;
    }
  }

  // 更新仪表板
  updateDashboard() {
    const dashboardData = {
      vitals: this.metrics.vitals,
      realTime: this.metrics.realTime,
      resources: this.getResourceSummary(),
      score: this.calculatePerformanceScore()
    };

    this.renderDashboard(dashboardData);
  }

  // 计算性能评分
  calculatePerformanceScore() {
    const weights = {
      LCP: 0.3,
      FID: 0.2,
      CLS: 0.2,
      FCP: 0.15,
      TTFB: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([metric, weight]) => {
      const value = this.metrics.vitals[metric]?.value || 0;
      const threshold = this.thresholds[metric];

      let score;
      if (value <= threshold) {
        score = 100;
      } else if (value <= threshold * 2) {
        score = 100 - ((value - threshold) / threshold) * 50;
      } else {
        score = 50 - ((value - threshold * 2) / threshold) * 25;
        score = Math.max(0, score);
      }

      totalScore += score * weight;
      totalWeight += weight;
    });

    return totalScore / totalWeight;
  }
}
```

## 总结

前端性能优化是一个持续的过程，需要综合考虑多个方面：

1. **Core Web Vitals优化**：重点关注LCP、FID、CLS三大指标
2. **资源加载优化**：使用现代加载策略和缓存技术
3. **代码优化**：减少包大小，优化执行效率
4. **渲染性能**：优化DOM操作和样式计算
5. **监控分析**：建立完善的性能监控体系

通过应用这些优化技术，你可以显著提升Web应用的性能，为用户提供更好的使用体验。记住，性能优化是一个持续迭代的过程，需要不断测试、监控和改进。