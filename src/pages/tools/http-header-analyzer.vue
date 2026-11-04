<template>
  <div class="max-w-6xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">HTTP头分析器</h1>
      <p class="text-muted-foreground">分析和验证HTTP响应头，检查安全配置、CORS、缓存策略等</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 左侧：输入和分析 -->
      <div class="space-y-4">
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe class="w-5 h-5 text-primary" />
            输入URL或HTTP头
          </h2>

          <div class="space-y-4">
            <!-- 输入方式选择 -->
            <div class="flex gap-2">
              <button
                @click="inputMode = 'url'"
                :class="['px-4 py-2 rounded-lg text-sm transition-colors', inputMode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
              >
                URL分析
              </button>
              <button
                @click="inputMode = 'headers'"
                :class="['px-4 py-2 rounded-lg text-sm transition-colors', inputMode === 'headers' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80']"
              >
                粘贴HTTP头
              </button>
            </div>

            <!-- URL输入 -->
            <div v-if="inputMode === 'url'">
              <label class="text-sm font-medium mb-2 block">网站URL</label>
              <div class="flex gap-2">
                <input
                  v-model="urlInput"
                  type="url"
                  placeholder="https://example.com"
                  class="flex-1 px-4 py-3 border border-border rounded-lg font-mono text-sm"
                >
                <button
                  @click="fetchHeaders"
                  :disabled="!urlInput || fetching"
                  class="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
                >
                  {{ fetching ? '分析中...' : '分析' }}
                </button>
              </div>
              <p class="text-xs text-muted-foreground mt-2">
                注意：由于CORS限制，此功能需要后端代理支持
              </p>
            </div>

            <!-- HTTP头粘贴 -->
            <div v-if="inputMode === 'headers'">
              <label class="text-sm font-medium mb-2 block">HTTP响应头</label>
              <textarea
                v-model="headersInput"
                class="w-full px-4 py-3 border border-border rounded-lg font-mono text-xs min-h-[200px]"
                placeholder="粘贴HTTP响应头，例如：
Content-Type: text/html; charset=utf-8
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
..."
              ></textarea>
              <button
                @click="analyzeHeaders"
                :disabled="!headersInput.trim()"
                class="w-full mt-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
              >
                分析HTTP头
              </button>
            </div>

            <!-- 示例 -->
            <button
              @click="loadExample"
              class="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm"
            >
              加载示例HTTP头
            </button>
          </div>
        </div>

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileCheck class="w-5 h-5 text-green-500" />
            分析结果
          </h2>

          <div class="space-y-4">
            <!-- 评分 -->
            <div class="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-muted-foreground">安全评分</p>
                  <p class="text-3xl font-bold text-primary">{{ analysisResult.score }}/100</p>
                </div>
                <div :class="[
                  'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                  analysisResult.score >= 80 ? 'bg-green-500 text-white' :
                  analysisResult.score >= 60 ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                ]">
                  {{ analysisResult.score }}
                </div>
              </div>
            </div>

            <!-- 分类结果 -->
            <div class="space-y-3">
              <div v-for="category in analysisResult.categories" :key="category.name">
                <button
                  @click="toggleCategory(category.name)"
                  class="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-muted"
                >
                  <span class="flex items-center gap-2">
                    <component :is="getCategoryIcon(category.name)" class="w-4 h-4" :class="category.color" />
                    <span class="font-medium">{{ category.label }}</span>
                  </span>
                  <span :class="[
                    'text-xs px-2 py-1 rounded',
                    category.status === 'pass' ? 'bg-green-100 text-green-700' :
                    category.status === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  ]">
                    {{ category.status === 'pass' ? '通过' : category.status === 'warn' ? '警告' : '失败' }}
                  </span>
                </button>

                <div v-if="expandedCategories.has(category.name)" class="mt-2 space-y-2 pl-4">
                  <div v-for="item in category.items" :key="item.header" class="text-sm">
                    <div class="flex items-start gap-2 p-2 rounded" :class="{
                      'bg-green-50 dark:bg-green-900/20': item.status === 'pass',
                      'bg-yellow-50 dark:bg-yellow-900/20': item.status === 'warn',
                      'bg-red-50 dark:bg-red-900/20': item.status === 'fail'
                    }">
                      <CheckCircle v-if="item.status === 'pass'" class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <AlertTriangle v-else-if="item.status === 'warn'" class="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <XCircle v-else class="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div class="flex-1">
                        <p class="font-mono text-xs">{{ item.header }}</p>
                        <p class="text-muted-foreground text-xs mt-1">{{ item.message }}</p>
                        <p v-if="item.value" class="text-xs mt-1 font-mono bg-background p-1 rounded">{{ item.value }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：说明和建议 -->
      <div class="space-y-4">
        <!-- HTTP头列表 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <List class="w-5 h-5 text-blue-500" />
            检测到的HTTP头
          </h2>

          <div v-if="parsedHeaders.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(header, index) in parsedHeaders"
              :key="index"
              class="flex items-start gap-2 p-2 bg-muted rounded text-sm"
            >
              <span class="font-mono text-primary min-w-[150px] text-xs">{{ header.key }}</span>
              <span class="text-xs break-all">{{ header.value }}</span>
            </div>
          </div>
          <div v-else class="text-center py-8 text-sm text-muted-foreground">
            暂无HTTP头数据
          </div>
        </div>

        <!-- 安全建议 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            安全建议
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">必要的安全HTTP头</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">Content-Security-Policy：</strong>防止XSS攻击</li>
                <li><strong class="text-foreground">X-Frame-Options：</strong>防止点击劫持</li>
                <li><strong class="text-foreground">X-Content-Type-Options：</strong>防止MIME嗅探</li>
                <li><strong class="text-foreground">Strict-Transport-Security：</strong>强制HTTPS</li>
                <li><strong class="text-foreground">Referrer-Policy：</strong>控制Referer信息泄露</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">推荐配置</p>
              <pre class="text-xs bg-muted p-3 rounded overflow-x-auto"><code>Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Referrer-Policy: no-referrer</code></pre>
            </div>
          </div>
        </div>

        <!-- CORS检查 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitCompare class="w-5 h-5 text-purple-500" />
            CORS配置检查
          </h2>

          <div v-if="corsAnalysis" class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>Access-Control-Allow-Origin</span>
              <span :class="corsAnalysis.allowOrigin ? 'text-green-600' : 'text-red-600'">
                {{ corsAnalysis.allowOrigin || '未设置' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Access-Control-Allow-Methods</span>
              <span :class="corsAnalysis.allowMethods ? 'text-green-600' : 'text-red-600'">
                {{ corsAnalysis.allowMethods || '未设置' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>Access-Control-Allow-Credentials</span>
              <span :class="corsAnalysis.allowCredentials ? 'text-green-600' : 'text-muted-foreground'">
                {{ corsAnalysis.allowCredentials || '未设置' }}
              </span>
            </div>
          </div>
          <div v-else class="text-center py-4 text-sm text-muted-foreground">
            未检测到CORS相关HTTP头
          </div>
        </div>

        <!-- 缓存分析 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database class="w-5 h-5 text-orange-500" />
            缓存策略分析
          </h2>

          <div v-if="cacheAnalysis" class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Cache-Control</span>
              <span class="font-mono text-xs">{{ cacheAnalysis.cacheControl || '未设置' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">ETag</span>
              <span class="font-mono text-xs">{{ cacheAnalysis.etag ? '已设置' : '未设置' }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Last-Modified</span>
              <span class="font-mono text-xs">{{ cacheAnalysis.lastModified || '未设置' }}</span>
            </div>
          </div>
          <div v-else class="text-center py-4 text-sm text-muted-foreground">
            未检测到缓存相关HTTP头
          </div>
        </div>

        <!-- 使用说明 -->
        <div class="bg-card rounded-lg p-6 border">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-blue-500" />
            使用说明
          </h2>

          <div class="space-y-3 text-sm text-muted-foreground">
            <div>
              <p class="font-medium text-foreground mb-1">如何获取HTTP响应头？</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong class="text-foreground">Chrome DevTools：</strong>Network → Headers</li>
                <li><strong class="text-foreground">curl：</strong>curl -I https://example.com</li>
                <li><strong class="text-foreground">在线工具：</strong>使用各种HTTP头检查工具</li>
              </ul>
            </div>

            <div>
              <p class="font-medium text-foreground mb-1">分析方法</p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>安全配置检查（CSP、HSTS等）</li>
                <li>信息泄露检测（服务器版本等）</li>
                <li>CORS配置验证</li>
                <li>缓存策略分析</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSeoMeta } from '#app'
import {
  Globe,
  FileCheck,
  List,
  Lightbulb,
  GitCompare,
  Database,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield,
  Lock,
  Eye,
  Server,
  Cookie
} from 'lucide-vue-next'

const inputMode = ref('headers')
const urlInput = ref('')
const headersInput = ref('')
const fetching = ref(false)

const parsedHeaders = ref([])
const analysisResult = ref(null)
const corsAnalysis = ref(null)
const cacheAnalysis = ref(null)

const expandedCategories = ref(new Set(['security', 'cors', 'cache']))

// 解析HTTP头
function parseHeaders(text) {
  const lines = text.split('\n')
  const headers = []

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      headers.push({ key, value })
    }
  }

  return headers
}

// 分析HTTP头
function analyzeHeaders() {
  if (!headersInput.value.trim()) return

  parsedHeaders.value = parseHeaders(headersInput.value)
  analyzeSecurity()
  analyzeCORS()
  analyzeCache()
}

// 安全分析
function analyzeSecurity() {
  const headers = parsedHeaders.value
  const headerMap = new Map(headers.map(h => [h.key.toLowerCase(), h.value]))

  let score = 100
  const categories = []

  // 安全头检查
  const securityItems = []

  // CSP
  if (headerMap.has('content-security-policy')) {
    securityItems.push({
      header: 'Content-Security-Policy',
      status: 'pass',
      message: '已设置CSP策略，有效防止XSS攻击',
      value: headerMap.get('content-security-policy')
    })
  } else {
    securityItems.push({
      header: 'Content-Security-Policy',
      status: 'fail',
      message: '未设置CSP策略，网站容易受到XSS攻击'
    })
    score -= 20
  }

  // X-Frame-Options
  if (headerMap.has('x-frame-options')) {
    const value = headerMap.get('x-frame-options')
    if (value === 'DENY' || value === 'SAMEORIGIN') {
      securityItems.push({
        header: 'X-Frame-Options',
        status: 'pass',
        message: '已设置X-Frame-Options，防止点击劫持',
        value
      })
    } else {
      securityItems.push({
        header: 'X-Frame-Options',
        status: 'warn',
        message: 'X-Frame-Options值不是DENY或SAMEORIGIN',
        value
      })
      score -= 5
    }
  } else {
    securityItems.push({
      header: 'X-Frame-Options',
      status: 'fail',
      message: '未设置X-Frame-Options，容易受到点击劫持攻击'
    })
    score -= 15
  }

  // X-Content-Type-Options
  if (headerMap.get('x-content-type-options')?.toLowerCase() === 'nosniff') {
    securityItems.push({
      header: 'X-Content-Type-Options',
      status: 'pass',
      message: '已设置nosniff，防止MIME类型嗅探',
      value: headerMap.get('x-content-type-options')
    })
  } else {
    securityItems.push({
      header: 'X-Content-Type-Options',
      status: 'fail',
      message: '未设置X-Content-Type-Options: nosniff'
    })
    score -= 10
  }

  // HSTS
  if (headerMap.has('strict-transport-security')) {
    const value = headerMap.get('strict-transport-security')
    if (value.includes('max-age')) {
      const match = value.match(/max-age=(\d+)/)
      const maxAge = match ? parseInt(match[1]) : 0
      if (maxAge >= 31536000) { // 1年
        securityItems.push({
          header: 'Strict-Transport-Security',
          status: 'pass',
          message: 'HSTS已设置，强制HTTPS连接',
          value
        })
      } else {
        securityItems.push({
          header: 'Strict-Transport-Security',
          status: 'warn',
          message: 'max-age建议设置为至少31536000（1年）',
          value
        })
        score -= 5
      }
    }
  } else {
    securityItems.push({
      header: 'Strict-Transport-Security',
      status: 'fail',
      message: '未设置HSTS，无法强制HTTPS连接'
    })
    score -= 10
  }

  // Referrer-Policy
  if (headerMap.has('referrer-policy')) {
    securityItems.push({
      header: 'Referrer-Policy',
      status: 'pass',
      message: '已设置Referrer-Policy',
      value: headerMap.get('referrer-policy')
    })
  } else {
    securityItems.push({
      header: 'Referrer-Policy',
      status: 'warn',
      message: '建议设置Referrer-Policy保护用户隐私'
    })
    score -= 5
  }

  // Permissions-Policy
  if (headerMap.has('permissions-policy') || headerMap.has('feature-policy')) {
    securityItems.push({
      header: 'Permissions-Policy',
      status: 'pass',
      message: '已设置Permissions-Policy',
      value: headerMap.get('permissions-policy') || headerMap.get('feature-policy')
    })
  } else {
    securityItems.push({
      header: 'Permissions-Policy',
      status: 'warn',
      message: '建议设置Permissions-Policy限制浏览器功能'
    })
    score -= 5
  }

  categories.push({
    name: 'security',
    label: '安全配置',
    status: score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail',
    color: 'text-green-500',
    items: securityItems
  })

  // 信息泄露检查
  const infoItems = []

  // Server
  if (headerMap.has('server')) {
    const server = headerMap.get('server')
    if (server.length > 20 || /[0-9.]/.test(server)) {
      infoItems.push({
        header: 'Server',
        status: 'warn',
        message: '服务器版本信息可能被利用进行攻击',
        value: server
      })
      score -= 5
    } else {
      infoItems.push({
        header: 'Server',
        status: 'pass',
        message: '服务器头信息简洁',
        value: server
      })
    }
  } else {
    infoItems.push({
      header: 'Server',
      status: 'pass',
      message: '未泄露服务器信息'
    })
  }

  // X-Powered-By
  if (headerMap.has('x-powered-by')) {
    infoItems.push({
      header: 'X-Powered-By',
      status: 'fail',
      message: '泄露了技术栈信息，建议移除此头',
      value: headerMap.get('x-powered-by')
    })
    score -= 5
  } else {
    infoItems.push({
      header: 'X-Powered-By',
      status: 'pass',
      message: '未泄露技术栈信息'
    })
  }

  categories.push({
    name: 'info',
    label: '信息泄露',
    status: infoItems.some(i => i.status === 'fail') ? 'fail' : infoItems.some(i => i.status === 'warn') ? 'warn' : 'pass',
    color: 'text-orange-500',
    items: infoItems
  })

  // 确保分数在0-100之间
  score = Math.max(0, Math.min(100, score))

  analysisResult.value = {
    score,
    categories
  }
}

// CORS分析
function analyzeCORS() {
  const headers = parsedHeaders.value
  const headerMap = new Map(headers.map(h => [h.key.toLowerCase(), h.value]))

  const cors = {}

  if (headerMap.has('access-control-allow-origin')) {
    cors.allowOrigin = headerMap.get('access-control-allow-origin')
  }
  if (headerMap.has('access-control-allow-methods')) {
    cors.allowMethods = headerMap.get('access-control-allow-methods')
  }
  if (headerMap.has('access-control-allow-headers')) {
    cors.allowHeaders = headerMap.get('access-control-allow-headers')
  }
  if (headerMap.has('access-control-allow-credentials')) {
    cors.allowCredentials = headerMap.get('access-control-allow-credentials')
  }
  if (headerMap.has('access-control-max-age')) {
    cors.maxAge = headerMap.get('access-control-max-age')
  }

  corsAnalysis.value = Object.keys(cors).length > 0 ? cors : null
}

// 缓存分析
function analyzeCache() {
  const headers = parsedHeaders.value
  const headerMap = new Map(headers.map(h => [h.key.toLowerCase(), h.value]))

  const cache = {}

  if (headerMap.has('cache-control')) {
    cache.cacheControl = headerMap.get('cache-control')
  }
  if (headerMap.has('etag')) {
    cache.etag = headerMap.get('etag').substring(0, 50) + '...'
  }
  if (headerMap.has('last-modified')) {
    cache.lastModified = headerMap.get('last-modified')
  }

  cacheAnalysis.value = Object.keys(cache).length > 0 ? cache : null
}

// 切换分类展开
function toggleCategory(name) {
  if (expandedCategories.value.has(name)) {
    expandedCategories.value.delete(name)
  } else {
    expandedCategories.value.add(name)
  }
}

// 获取分类图标
function getCategoryIcon(name) {
  const icons = {
    security: Shield,
    cors: GitCompare,
    cache: Database,
    info: Eye
  }
  return icons[name] || List
}

// 加载示例
function loadExample() {
  headersInput.value = `HTTP/2 200
content-type: text/html; charset=utf-8
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
strict-transport-security: max-age=31536000; includeSubDomains
referrer-policy: strict-origin-when-cross-origin
permissions-policy: geolocation=(), microphone=(), camera=()
x-powered-by: Express
server: cloudflare
cache-control: public, max-age=3600
etag: W/"1234567890"
last-modified: Mon, 01 Jan 2024 00:00:00 GMT
access-control-allow-origin: *
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization`
  analyzeHeaders()
}

// 获取HTTP头（模拟）
async function fetchHeaders() {
  if (!urlInput.value) return

  fetching.value = true
  try {
    // 由于CORS限制，这里只能模拟
    // 实际应用中需要后端代理支持
    alert('由于浏览器CORS限制，请使用"粘贴HTTP头"功能。\n\n您可以使用以下命令获取HTTP头：\ncurl -I ' + urlInput.value)
  } finally {
    fetching.value = false
  }
}

useSeoMeta({
  title: 'HTTP头分析器 - 在线安全头检查工具',
  description: '免费在线HTTP头分析器，检查安全配置、CORS设置、缓存策略，提供安全建议。',
  keywords: ['http头', '安全头', 'http header', 'security headers', 'cors检查', 'csp分析', '在线工具']
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('HTTP头分析器')
</script>
