<template>
  <div class="max-w-8xl mx-auto">
    <!-- Hero 头部区 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-3">Headers查看器 - 在线HTTP请求头查看工具 | API调试</h1>
      <p class="text-muted-foreground">免费在线HTTP请求头查看器，实时监控和分析HTTP Headers信息，支持Headers解析、格式化显示、分类查看，适用于API调试、网络开发和性能优化。</p>
    </div>

    <!-- 工具交互区 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- 左侧：输入区 -->
      <div class="space-y-4">
        <!-- 输入区域 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-foreground">Headers 输入</h3>
            <button
              @click="loadSample"
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              加载示例
            </button>
          </div>
          <textarea
            v-model="rawHeaders"
            class="w-full h-64 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-none"
            placeholder="粘贴Headers数据，每行一个，格式：HeaderName: Value&#10;Content-Type: application/json&#10;Authorization: Bearer token123"
          ></textarea>
          <div class="flex gap-2 mt-3">
            <button
              @click="handleParse"
              class="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Code :size="18" />
              解析
            </button>
            <button
              @click="clear"
              class="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm"
            >
              清空
            </button>
          </div>
        </div>

        <!-- 搜索和过滤 -->
        <div class="bg-card border border-border rounded-lg p-5">
          <div class="flex items-center gap-2 mb-3">
            <Search :size="18" class="text-muted-foreground" />
            <input
              v-model="searchQuery"
              type="text"
              class="flex-1 px-3 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              placeholder="搜索Headers..."
            />
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="cat in categoryOptions"
              :key="cat"
              @click="selectedCategory = cat"
              :class="[
                'px-3 py-1.5 rounded-lg transition text-sm',
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              ]"
            >
              {{ cat === 'all' ? '全部' : headerCategories[cat]?.name || '其他' }}
            </button>
          </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="headersList.length > 0" class="bg-muted border border-border rounded-lg p-5">
          <h3 class="font-semibold text-foreground mb-3">统计信息</h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-card rounded-lg p-3 text-center border border-border">
              <div class="text-2xl font-bold text-foreground">{{ headersList.length }}</div>
              <div class="text-xs text-muted-foreground">Headers数量</div>
            </div>
            <div class="bg-card rounded-lg p-3 text-center border border-border">
              <div class="text-2xl font-bold text-foreground">{{ Object.keys(groupedHeaders).length }}</div>
              <div class="text-xs text-muted-foreground">分类数量</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：展示区 -->
      <div class="lg:col-span-2 space-y-4">
        <!-- 顶部操作栏 -->
        <div class="flex items-center justify-between bg-card border border-border rounded-lg p-4">
          <div class="flex items-center gap-2">
            <FileCode :size="24" class="text-primary" />
            <h2 class="text-lg font-semibold text-foreground">HTTP Headers 查看器</h2>
          </div>
          <div class="flex gap-2">
            <button
              @click="captureBrowserHeaders"
              class="px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition text-sm flex items-center gap-1"
            >
              <RefreshCw :size="16" />
              获取当前页面
            </button>
            <button
              @click="copyAllHeaders"
              :disabled="headersList.length === 0"
              class="px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg transition text-sm flex items-center gap-1"
            >
              <Copy :size="16" />
              复制全部
            </button>
          </div>
        </div>

        <!-- 分类显示 -->
        <div class="bg-card border border-border rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-border bg-muted/30">
            <h3 class="text-lg font-semibold text-foreground">
              Headers 详情
              <span class="text-sm font-normal text-muted-foreground ml-2">
                ({{ filteredHeaders.length }} 条)
              </span>
            </h3>
          </div>

          <div v-if="Object.keys(groupedHeaders).length > 0" class="p-5 space-y-6">
            <div
              v-for="(headers, category) in groupedHeaders"
              :key="category"
              class="space-y-2"
            >
              <h4 class="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wide">
                <component :is="headerCategories[category]?.icon || Code" :size="16" class="text-primary" />
                {{ headerCategories[category]?.name || '其他' }}
                <span class="text-xs font-normal text-muted-foreground">
                  ({{ headers.length }} 个)
                </span>
              </h4>

              <div class="space-y-1">
                <div
                  v-for="(header, index) in headers"
                  :key="index"
                  class="group bg-muted hover:bg-muted/80 rounded-lg p-3 transition cursor-pointer"
                  @click="copyHeader(header)"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-mono text-sm font-semibold text-primary">
                          {{ header.name }}
                        </span>
                      </div>
                      <div class="text-sm text-muted-foreground break-all">
                        {{ header.value }}
                      </div>
                    </div>
                    <Copy :size="14" class="text-muted-foreground group-hover:text-primary transition flex-shrink-0 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-else
            class="p-12 text-center text-muted-foreground"
          >
            <FileCode :size="48" class="mx-auto mb-3 opacity-50" />
            <p>没有找到匹配的Headers</p>
          </div>
        </div>

        <!-- JSON格式 -->
        <div v-if="headersList.length > 0" class="bg-card border border-border rounded-lg p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-foreground flex items-center gap-2">
              <Code :size="18" class="text-primary" />
              JSON 格式
            </h3>
            <button
              @click="() => { navigator.clipboard.writeText(formatAsJSON()); alert('已复制JSON'); }"
              class="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground"
            >
              复制JSON
            </button>
          </div>
          <pre class="bg-muted border border-border rounded-lg p-4 overflow-x-auto text-sm max-h-64"><code>{{ formatAsJSON() }}</code></pre>
        </div>
      </div>
    </div>

    <!-- SEO 内容长尾区 -->
    <div class="p-6 mb-12 relative">
      <!-- 折叠按钮 -->
      <button
        @click="toggleSeoContent"
        class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        :title="isSeoContentVisible ? '折叠内容' : '展开内容'"
      >
        <HelpCircle v-if="!isSeoContentVisible" class="w-5 h-5" />
        <ChevronUp v-else class="w-5 h-5" />
      </button>

      <!-- 内容区域 -->
      <div v-show="isSeoContentVisible">
        <h2 class="text-2xl font-bold text-foreground mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          什么是 HTTP Headers？
        </h2>
        <p class="text-muted-foreground mb-4">
          HTTP Headers（HTTP 头部）是在 HTTP 请求和响应消息中传递的元数据信息。
          它们提供了关于客户端、服务器、请求的资源以及如何处理该资源的重要信息。
          Headers 包含了诸如内容类型、内容长度、缓存控制、认证信息等关键数据。
        </p>
        <p class="text-muted-foreground">
          HTTP Headers 分为请求头（Request Headers）和响应头（Response Headers）。
          请求头由客户端发送，告诉服务器关于客户端的信息和期望的响应格式；
          响应头由服务器返回，提供关于响应内容的详细信息。
        </p>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          如何使用本工具
        </h2>
        <ol class="list-decimal list-inside space-y-2 text-muted-foreground mb-6">
          <li>将您的 Headers 数据粘贴到左侧输入框，每行一个，格式为 "HeaderName: Value"</li>
          <li>点击"解析"按钮或使用"加载示例"查看演示数据</li>
          <li>使用搜索框或分类按钮筛选您需要的 Headers</li>
          <li>点击任意 Header 可快速复制，或点击"复制全部"导出所有数据</li>
          <li>点击"获取当前页面"可以捕获当前页面的实际 Headers 信息</li>
        </ol>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见 Headers 分类说明
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground mb-6">
          <div class="bg-muted border border-border rounded-lg p-4">
            <h4 class="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Code :size="16" class="text-primary" />
              通用信息
            </h4>
            <ul class="space-y-1 text-sm">
              <li><strong>Content-Type</strong>: 响应内容的MIME类型</li>
              <li><strong>Content-Length</strong>: 响应体大小（字节）</li>
              <li><strong>Date</strong>: 响应生成的日期时间</li>
            </ul>
          </div>
          <div class="bg-muted border border-border rounded-lg p-4">
            <h4 class="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Lock :size="16" class="text-destructive" />
              安全相关
            </h4>
            <ul class="space-y-1 text-sm">
              <li><strong>Authorization</strong>: 认证信息（Bearer Token等）</li>
              <li><strong>Set-Cookie</strong>: 设置Cookie</li>
              <li><strong>WWW-Authenticate</strong>: 认证挑战</li>
            </ul>
          </div>
          <div class="bg-muted border border-border rounded-lg p-4">
            <h4 class="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Zap :size="16" class="text-yellow-600" />
              缓存控制
            </h4>
            <ul class="space-y-1 text-sm">
              <li><strong>Cache-Control</strong>: 缓存策略指令</li>
              <li><strong>ETag</strong>: 内容版本标识</li>
              <li><strong>Last-Modified</strong>: 最后修改时间</li>
            </ul>
          </div>
          <div class="bg-muted border border-border rounded-lg p-4">
            <h4 class="font-semibold text-foreground mb-2 flex items-center gap-2">
              <Shield :size="16" class="text-green-600" />
              跨域CORS
            </h4>
            <ul class="space-y-1 text-sm">
              <li><strong>Access-Control-Allow-Origin</strong>: 允许的源</li>
              <li><strong>Access-Control-Allow-Methods</strong>: 允许的方法</li>
              <li><strong>Access-Control-Allow-Headers</strong>: 允许的Headers</li>
            </ul>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-foreground mt-8 mb-4 flex items-center">
          <span class="text-primary mr-2">#</span>
          常见问题 (FAQ)
        </h2>
        <div class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold text-foreground">为什么需要查看 HTTP Headers？</h3>
            <p class="text-muted-foreground mt-1">
              HTTP Headers 包含了请求和响应的重要元数据，可以帮助开发者：
              1) 调试 API 接口问题，检查请求参数是否正确；2) 分析性能瓶颈，优化缓存策略；
              3) 排查跨域问题，配置 CORS；4) 验证安全性，检查认证信息；
              5) 了解服务器配置，如内容编码、压缩等。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">如何获取当前页面的 Headers？</h3>
            <p class="text-muted-foreground mt-1">
              您可以使用浏览器的开发者工具（F12）打开 Network 面板，
              刷新页面后点击任意请求，在 Headers 标签中即可查看完整的请求和响应头。
              或者使用本工具的"获取当前页面"功能，可以快速捕获当前页面的部分响应头信息。
            </p>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-foreground">本工具的数据安全吗？</h3>
            <p class="text-muted-foreground mt-1">
              完全安全。本工具采用纯前端技术实现，所有 Headers 数据处理都在您的浏览器本地完成，
              不会上传到任何服务器。您的敏感信息（如 Authorization Token）完全保留在本地，
              不会被收集或存储。
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关推荐区 -->
    <section class="mb-12">
      <h2 class="text-2xl font-bold text-foreground mb-4">您可能还需要...</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NuxtLink
          v-for="relatedTool in relatedTools"
          :key="relatedTool.id"
          :to="`/tools/${relatedTool.id}`"
          class="block p-4 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <div class="flex items-center gap-2 mb-2">
            <component
              :is="iconMap[relatedTool.icon]"
              class="w-5 h-5 text-primary"
            />
            <span class="font-medium text-foreground">{{ relatedTool.name }}</span>
          </div>
          <p class="text-sm text-muted-foreground line-clamp-2">{{ relatedTool.description }}</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FileCode, Copy, RefreshCw, Search, Code, Lock, Shield, Zap, HelpCircle, ChevronUp, Wifi, Globe, Cookie, Timer, Zap as Bolt } from 'lucide-vue-next'
import { tools } from '~/data/tools'
import { categories } from '~/data/categories'
import { addRecentTool } from '~/composables/useTools'

// SEO配置
useSeoMeta({
  title: 'Headers查看器 - 在线HTTP请求头查看工具 | API调试 | Util工具箱',
  description: '免费在线HTTP请求头查看器，实时监控和分析HTTP Headers信息，支持Headers解析、格式化显示、分类查看，适用于API调试、网络开发和性能优化。纯本地计算，数据隐私安全。',
  keywords: 'HTTP Headers,请求头,Headers查看,API调试,网络调试,HTTP协议,请求分析,响应头,在线Headers工具',
  author: 'Util工具箱',
  ogTitle: 'Headers查看器 - 免费在线HTTP请求头查看工具',
  ogDescription: '专业的HTTP Headers查看器，支持实时解析、格式化显示、分类查看。纯前端处理，数据安全可靠，适用于API调试和网络开发。',
  ogImage: 'https://www.util.cn/images/tools/headers-viewer.png',
  ogUrl: 'https://www.util.cn/tools/headers-viewer',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Headers查看器 - 免费在线HTTP请求头查看工具',
  twitterDescription: '专业的HTTP Headers查看器，支持实时解析、格式化显示、分类查看。纯前端处理，数据安全可靠。',
  twitterImage: 'https://www.util.cn/images/tools/headers-viewer.png'
})

// JSON-LD 结构化数据
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'Headers查看器',
            description: '免费在线HTTP请求头查看器，支持Headers解析和格式化显示',
            url: 'https://www.util.cn/tools/headers-viewer',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY'
            },
            featureList: [
              'HTTP Headers解析',
              'Headers格式化显示',
              '分类查看管理',
              '一键复制导出',
              '搜索过滤功能',
              '本地安全处理',
              'JSON格式导出'
            ]
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: '首页',
                item: 'https://www.util.cn'
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: '工具',
                item: 'https://www.util.cn/tools'
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: 'Headers查看器',
                item: 'https://www.util.cn/tools/headers-viewer'
              }
            ]
          },
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: '为什么需要查看HTTP Headers？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'HTTP Headers包含了请求和响应的重要元数据，可以帮助开发者调试API接口、分析性能、排查跨域问题、验证安全性等。'
                }
              },
              {
                '@type': 'Question',
                name: '本工具的数据安全吗？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '完全安全。本工具采用纯前端技术实现，所有Headers数据处理都在您的浏览器本地完成，不会上传到任何服务器。'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})

const router = useRouter()

// 定义当前工具和分类
const tool = tools.find(t => t.id === 'headers-viewer')
const category = categories.find(c => c.id === 'others')

// 常见Headers分类
const headerCategories = {
  general: {
    name: '通用信息',
    icon: Code,
    color: 'blue',
    headers: ['content-type', 'content-length', 'date', 'connection']
  },
  security: {
    name: '安全相关',
    icon: Lock,
    color: 'red',
    headers: ['authorization', 'www-authenticate', 'proxy-authenticate', 'set-cookie']
  },
  caching: {
    name: '缓存控制',
    icon: Zap,
    color: 'yellow',
    headers: ['cache-control', 'etag', 'expires', 'last-modified', 'vary']
  },
  cors: {
    name: '跨域',
    icon: Shield,
    color: 'green',
    headers: ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers']
  },
  performance: {
    name: '性能优化',
    icon: Zap,
    color: 'purple',
    headers: ['keep-alive', 'transfer-encoding', 'content-encoding']
  }
}

const rawHeaders = ref('')
const headersList = ref([])
const searchQuery = ref('')
const selectedCategory = ref('all')

// SEO内容折叠状态
const isSeoContentVisible = ref(true)

// 图标映射
const iconMap = {
  FileCode, Copy, RefreshCw, Search, Code, Lock, Shield, Zap, Wifi, Globe, Cookie, Timer, Bolt
}

// 相关工具
const relatedTools = computed(() => {
  // 获取相关工具：同一分类下的其他工具 + 推荐工具
  const sameCategory = tools.filter(t =>
    t.category === 'others' && t.id !== 'headers-viewer'
  ).slice(0, 2)

  // 添加一些推荐工具
  const recommended = [
    tools.find(t => t.id === 'http-client'),
    tools.find(t => t.id === 'cookies-manager'),
    tools.find(t => t.id === 'bulk-request')
  ].filter(Boolean)

  return [...sameCategory, ...recommended].slice(0, 4)
})

// 解析Headers字符串
const parseHeaders = (raw) => {
  if (!raw.trim()) return []

  const lines = raw.split('\n')
  const headers = []

  lines.forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) return

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) return

    const name = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    headers.push({ name, value })
  })

  return headers
}

// 获取Header分类
const getHeaderCategory = (headerName) => {
  const name = headerName.toLowerCase()
  for (const [key, category] of Object.entries(headerCategories)) {
    if (category.headers.some(h => h === name)) {
      return key
    }
  }
  return 'other'
}

// 过滤和排序后的Headers
const filteredHeaders = computed(() => {
  let filtered = headersList.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(h =>
      h.name.toLowerCase().includes(query) ||
      h.value.toLowerCase().includes(query)
    )
  }

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(h => getHeaderCategory(h.name) === selectedCategory.value)
  }

  return filtered
})

// 按分类分组的Headers
const groupedHeaders = computed(() => {
  const groups = {}

  filteredHeaders.value.forEach(header => {
    const category = getHeaderCategory(header.name)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(header)
  })

  return groups
})

// 获取所有分类
const categoryOptions = computed(() => {
  const cats = Object.keys(headerCategories)
  return ['all', ...cats, 'other']
})

// 解析输入
const handleParse = () => {
  headersList.value = parseHeaders(rawHeaders.value)
}

// 获取浏览器Headers
const captureBrowserHeaders = async () => {
  try {
    const response = await fetch(window.location.href)
    const headers = []
    response.headers.forEach((value, key) => {
      headers.push({ name: key, value })
    })
    headersList.value = headers
    rawHeaders.value = headers.map(h => `${h.name}: ${h.value}`).join('\n')
  } catch (error) {
    alert('无法获取Headers: ' + error.message)
  }
}

// 复制单个Header
const copyHeader = (header) => {
  navigator.clipboard.writeText(`${header.name}: ${header.value}`)
}

// 复制所有Headers
const copyAllHeaders = () => {
  const text = headersList.value.map(h => `${h.name}: ${h.value}`).join('\n')
  navigator.clipboard.writeText(text)
  alert('已复制所有Headers')
}

// 格式化JSON Headers
const formatAsJSON = () => {
  const obj = headersList.value.reduce((acc, h) => {
    acc[h.name] = h.value
    return acc
  }, {})
  return JSON.stringify(obj, null, 2)
}

// 加载示例
const loadSample = () => {
  rawHeaders.value = `# 常见的HTTP Headers示例
Content-Type: application/json
Content-Length: 1024
Date: ${new Date().toUTCString()}
Connection: keep-alive
Cache-Control: max-age=3600
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT
Vary: Accept-Encoding
Keep-Alive: timeout=5, max=100
Server: nginx/1.18.0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization`
  handleParse()
}

// 清空
const clear = () => {
  if (confirm('确定要清空吗？')) {
    rawHeaders.value = ''
    headersList.value = []
  }
}

// 切换SEO内容显示状态
const toggleSeoContent = () => {
  isSeoContentVisible.value = !isSeoContentVisible.value
}

const handleToolSelect = (selectedTool) => {
  router.push(`/tools/${selectedTool.id}`)
  addRecentTool(selectedTool.id)
}

// 添加到最近使用
if (tool) {
  addRecentTool(tool.id)
}

onMounted(() => {
  // 自动加载示例
  loadSample()
})
</script>
