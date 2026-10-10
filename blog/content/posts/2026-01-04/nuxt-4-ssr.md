---
title: "Nuxt 4服务端渲染性能优化实战指南"
slug: "nuxt-4-ssr"
date: 2026-01-04T13:00:00+08:00
draft: false
author: "技术团队"
description: "深入探讨Nuxt 4框架的SSR性能优化策略，包括服务端缓存、流式渲染、Hydration优化等技术细节"
tags: ["Nuxt", "SSR", "性能优化", "Vue", "服务端渲染"]
categories: ["前端技术", "Nuxt"]
---

## Nuxt 4 SSR优化概览

Nuxt 4基于Vue 3和Nitro构建，提供了强大的SSR能力。本文将深入分析各种性能优化技术。

## 服务端缓存策略

### routeRules缓存

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    // 静态页面缓存1小时
    '/': { isr: 3600 },
    // API缓存
    '/api/**': { cors: true, headers: { 'cache-control': 'max-age=60' } },
    // 动态路由ISR
    '/blog/**': { isr: true },
    // 完全静态
    '/about': { isr: false },
    // SPA模式
    '/app/**': { ssr: false }
  }
})
```

### 服务端数据缓存

```typescript
// server/api/data.ts
export default defineEventHandler(async (event) => {
  // 使用Nitro存储缓存
  const storage = useStorage('redis')

  const cached = await storage.getItem('expensive-data')
  if (cached) {
    return cached
  }

  const data = await fetchExpensiveData()
  await storage.setItem('expensive-data', data, { ttl: 3600 })

  return data
})
```

### useAsyncData缓存

```vue
<script setup lang="ts">
// 缓存API响应
const { data, refresh } = await useAsyncData(
  'user-profile',
  () => $fetch('/api/user/profile'),
  {
    transform: (data) => data.result,
    // 5分钟缓存
    getCachedData: (key) => useNuxtData(key).data,
    dedupe: 'cancel'
  }
)
</script>
```

## 流式渲染

### 使用Suspense流式渲染

```vue
<!-- app.vue -->
<template>
  <div>
    <NuxtPage />
  </div>
</template>

<!-- pages/index.vue -->
<template>
  <div>
    <!-- 立即渲染部分 -->
    <header>Header</header>

    <!-- 异步组件流式加载 -->
    <Suspense>
      <template #default>
        <AsyncComponent />
      </template>
      <template #fallback>
        <LoadingSkeleton />
      </template>
    </Suspense>

    <footer>Footer</footer>
  </div>
</template>
```

### Nitro流式响应

```typescript
// server/api/stream.ts
export default defineEventHandler(async (event) => {
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < 10; i++) {
        const data = `chunk ${i}\n`
        controller.enqueue(new TextEncoder().encode(data))
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      controller.close()
    }
  })

  return sendStream(event, stream)
})
```

## Hydration优化

### 懒加载Hydration

```vue
<template>
  <div>
    <!-- 关键内容立即hydration -->
    <CriticalContent />

    <!-- 非关键内容延迟hydration -->
    <LazyNonCritical @vue:mounted="hydrateComponent" />
  </div>
</template>

<script setup>
function hydrateComponent() {
  // 组件mounted后才hydration
}
</script>
```

### 选择性Hydration

```vue
<script setup>
// 只hydration需要的部分
const { data } = await useAsyncData('posts', () =>
  $fetch('/api/posts'),
  {
    // 只在客户端获取
    server: false
  }
)
</script>
```

## 性能监控

### 服务端性能追踪

```typescript
// server/middleware/performance.ts
export default defineEventHandler((event) => {
  const start = Date.now()

  event.node.res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[Performance] ${event.node.req.url} - ${duration}ms`)
  })
})
```

### 使用Nitro钩子

```typescript
// server/plugins/performance.ts
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('renderResponse', (response, { event }) => {
    const timing = Date.now() - event.context.startTime
    event.node.res.setHeader('X-Response-Time', `${timing}ms`)
  })
})
```

## 数据获取优化

### 并行数据获取

```vue
<script setup lang="ts">
// 并行获取多个数据
const [user, posts, comments] = await Promise.all([
  $fetch('/api/user'),
  $fetch('/api/posts'),
  $fetch('/api/comments')
])
</script>
```

### useLazyAsyncData延迟加载

```vue
<script setup lang="ts">
// 不阻塞导航
const { data, pending } = useLazyAsyncData(
  'dashboard',
  () => $fetch('/api/dashboard')
)
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <div v-if="pending">Loading...</div>
    <div v-else>{{ data }}</div>
  </div>
</template>
```

## 预渲染策略

### 静态生成

```bash
# 生成静态站点
nuxt generate

# 仅预渲染特定路由
nuxt generate --prerender /about /contact
```

### 增量静态再生

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  routeRules: {
    '/blog/**': {
      // ISR：每小时重新生成
      isr: 3600,
      // 允许预渲染
      prerender: true
    }
  }
})
```

## 代码分割优化

### 动态导入

```vue
<script setup>
// 组件懒加载
const HeavyComponent = defineAsyncComponent(() =>
  import('~/components/HeavyComponent.vue')
)
</script>

<template>
  <Suspense>
    <component :is="HeavyComponent" />
  </Suspense>
</template>
```

### 路由级代码分割

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  experimental: {
    // 启用路由级代码分割
    typedPages: true
  }
})
```

## 生产环境优化

### 构建优化

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      // Rollup配置
      rollupOptions: {
        output: {
          // 手动代码分割
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', '@vue/runtime-core'],
            'ui-vendor': ['@headlessui/vue', 'heroicons']
          }
        }
      }
    }
  },
  // 压缩
  nitro: {
    minify: true
  }
})
```

### CDN配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    // 静态资源CDN
    cdnURL: 'https://cdn.example.com'
  },
  // 压缩中间件
  nitro: {
    compressPublicAssets: true
  }
})
```

## 总结

Nuxt 4提供了完整的SSR优化工具链。通过合理使用缓存、流式渲染、Hydration优化等技术，可以显著提升应用性能。
