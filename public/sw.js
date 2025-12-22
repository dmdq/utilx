const CACHE_NAME = 'util-tools-v1'
const STATIC_CACHE = 'util-static-v1'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/tools/',
  '/manifest.json',
  '/_nuxt/css/style.css'
]

// 工具页面缓存策略
const TOOL_CACHE_STRATEGY = {
  cacheName: 'util-tools-v2',
  networkTimeoutSeconds: 3,
  cacheableResponse: { statuses: [0, 200] }
}

// 安装事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

// 激活事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return
  }

  // 工具页面：网络优先，缓存备用
  if (url.pathname.startsWith('/tools/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 缓存成功的响应
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // 网络失败时返回缓存
          return caches.match(request)
        })
    )
    return
  }

  // 静态资源：缓存优先
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
        })
    )
    return
  }

  // 其他请求：直接网络请求
  event.respondWith(fetch(request))
})