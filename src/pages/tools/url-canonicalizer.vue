<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">URL 标准化工具</h1>
      <p class="text-muted-foreground">在线 URL 标准化处理工具，移除跟踪参数、统一协议格式、优化 URL 结构，提升 SEO 效果</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">输入 URL</h2>
          <div class="flex gap-2">
            <button @click="clearInput" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">清空</button>
            <button @click="loadExample" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">示例</button>
          </div>
        </div>

        <textarea v-model="inputText" placeholder="https://example.com/path?utm_source=google&utm_medium=cpc&amp;campaign=spring" class="w-full h-40 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm bg-card"></textarea>

        <div class="bg-muted p-4 rounded-lg">
          <h3 class="font-medium text-sm mb-3">标准化选项</h3>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.removeUTM" class="w-4 h-4 rounded">
              <span class="text-sm">移除 UTM 跟踪参数</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.removeOtherTracking" class="w-4 h-4 rounded">
              <span class="text-sm">移除其他跟踪参数 (fbclid, gclid等)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.forceHTTPS" class="w-4 h-4 rounded">
              <span class="text-sm">强制使用 HTTPS</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.removeWWW" class="w-4 h-4 rounded">
              <span class="text-sm">移除 WWW 前缀</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.removeTrailingSlash" class="w-4 h-4 rounded">
              <span class="text-sm">移除尾部斜杠</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.lowercase" class="w-4 h-4 rounded">
              <span class="text-sm">转换为小写</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.removeFragment" class="w-4 h-4 rounded">
              <span class="text-sm">移除片段标识符 (#)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="options.sortParams" class="w-4 h-4 rounded">
              <span class="text-sm">参数按字母排序</span>
            </label>
          </div>
        </div>

        <button @click="canonicalize" class="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
          标准化 URL
        </button>
      </div>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">标准化结果</h2>
          <button v-if="result.canonical" @click="copyResult" class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground">
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>

        <div v-if="result.canonical" class="space-y-3">
          <div class="p-3 bg-muted rounded-lg">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs text-muted-foreground">标准化 URL:</p>
              <button @click="copyText(result.canonical)" class="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">复制</button>
            </div>
            <code class="text-sm font-mono break-all">{{ result.canonical }}</code>
          </div>

          <div v-if="result.original !== result.canonical" class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p class="text-xs text-muted-foreground mb-1">原始 URL:</p>
            <code class="text-xs font-mono break-all text-blue-800 dark:text-blue-200">{{ result.original }}</code>
          </div>

          <div v-if="changes.length > 0" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-2">应用的更改:</p>
            <ul class="space-y-1">
              <li v-for="(change, index) in changes" :key="index" class="flex items-center gap-2 text-sm">
                <span class="text-green-600 dark:text-green-400">✓</span>
                <span>{{ change }}</span>
              </li>
            </ul>
          </div>

          <div v-if="urlParts" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-2">URL 组成部分:</p>
            <div class="space-y-1 text-sm font-mono">
              <p><span class="text-muted-foreground">协议:</span> {{ urlParts.protocol }}</p>
              <p><span class="text-muted-foreground">域名:</span> {{ urlParts.hostname }}</p>
              <p v-if="urlParts.pathname"><span class="text-muted-foreground">路径:</span> {{ urlParts.pathname }}</p>
              <p v-if="urlParts.search"><span class="text-muted-foreground">参数:</span> {{ urlParts.search }}</p>
              <p v-if="urlParts.hash && !options.removeFragment"><span class="text-muted-foreground">片段:</span> {{ urlParts.hash }}</p>
            </div>
          </div>

          <div v-if="seoTips.length > 0" class="p-3 bg-muted rounded-lg">
            <p class="text-xs text-muted-foreground mb-2">SEO 建议:</p>
            <ul class="space-y-1">
              <li v-for="(tip, index) in seoTips" :key="index" class="flex items-start gap-2 text-sm">
                <span class="text-primary mt-0.5">•</span>
                <span>{{ tip }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div v-else class="p-8 text-center text-muted-foreground">
          <p>输入 URL 并选择标准化选项后点击"标准化 URL"按钮</p>
        </div>

        <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- 批量处理 -->
    <div class="mt-8 bg-card border rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4">批量处理</h3>
      <div class="space-y-4">
        <textarea v-model="bulkInput" placeholder="每行一个 URL，批量标准化多个链接&#10;https://example.com/page1?utm_source=google&#10;https://example.com/page2?fbclid=abc123" class="w-full h-32 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm bg-card"></textarea>
        <div class="flex gap-2">
          <button @click="bulkCanonicalize" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">批量标准化</button>
          <button v-if="bulkResults.length > 0" @click="copyBulkResults" class="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
            {{ copiedBulk ? '已复制' : '复制全部结果' }}
          </button>
        </div>
        <div v-if="bulkResults.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="(item, index) in bulkResults" :key="index" class="p-3 bg-muted rounded-lg text-sm">
            <p class="text-muted-foreground mb-1 truncate">{{ item.original }}</p>
            <p class="font-mono truncate">{{ item.canonical }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 常见跟踪参数 -->
    <div class="mt-6 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">常见跟踪参数说明</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 class="font-medium mb-2">UTM 参数 (Google Analytics)</h4>
          <ul class="space-y-1 text-muted-foreground">
            <li><code>utm_source</code> - 流量来源</li>
            <li><code>utm_medium</code> - 流量媒介</li>
            <li><code>utm_campaign</code> - 营销活动</li>
            <li><code>utm_term</code> - 搜索关键词</li>
            <li><code>utm_content</code> - 内容标识</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium mb-2">其他跟踪参数</h4>
          <ul class="space-y-1 text-muted-foreground">
            <li><code>fbclid</code> - Facebook Click ID</li>
            <li><code>gclid</code> - Google Click ID</li>
            <li><code>msclkid</code> - Microsoft Click ID</li>
            <li><code>ref</code> - 推荐来源</li>
            <li><code>source</code> - 来源标识</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- SEO 最佳实践 -->
    <div class="mt-6 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">URL 标准化 SEO 最佳实践</h3>
      <div class="space-y-3 text-sm text-muted-foreground">
        <div>
          <h4 class="font-medium text-foreground mb-2">1. 使用规范 URL (Canonical URL)</h4>
          <p>在 HTML head 中添加 <code>&lt;link rel="canonical" href="..."&gt;</code> 标签，指定页面的规范 URL，避免重复内容。</p>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">2. 保持 URL 简洁</h4>
          <p>移除不必要的参数和跟踪代码，使 URL 更简洁、更易读，提升用户体验和 SEO。</p>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">3. 统一协议和域名</h4>
          <p>选择使用 HTTPS 或 HTTP，带 WWW 或不带 WWW，并保持一致性。建议使用 HTTPS 并移除 WWW。</p>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">4. 处理尾部斜杠</h4>
          <p>选择保留或移除尾部斜杠，并在整个网站中保持一致。大多数情况下建议移除。</p>
        </div>
        <div>
          <h4 class="font-medium text-foreground mb-2">5. 使用小写字母</h4>
          <p>URL 区分大小写，使用小写可以避免重复内容和用户输入错误。</p>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-6 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/url-encode" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">URL 编码/解码</NuxtLink>
        <NuxtLink to="/tools/url-params-builder" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">URL 参数构建</NuxtLink>
        <NuxtLink to="/tools/html-encode" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">HTML 编码</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'

const inputText = ref('')
const bulkInput = ref('')
const copied = ref(false)
const copiedBulk = ref(false)
const error = ref('')

const options = ref({
  removeUTM: true,
  removeOtherTracking: true,
  forceHTTPS: true,
  removeWWW: true,
  removeTrailingSlash: true,
  lowercase: true,
  removeFragment: false,
  sortParams: true
})

const result = ref({
  canonical: '',
  original: ''
})

const urlParts = ref(null)
const changes = ref([])
const seoTips = ref([])
const bulkResults = ref([])

const examples = [
  'https://example.com/path?utm_source=google&utm_medium=cpc&campaign=spring',
  'https://www.example.com/page/?fbclid=abc123&ref=twitter',
  'http://Example.com/Page/ID=123#section',
  'https://example.com/path/to/page/?param1=value2&param2=value1'
]
const currentExample = ref(0)

const trackingParams = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'msclkid', 'twclid', 'igshid',
  '_ga', '_gid', 'ref', 'source', 'campaign'
]

const canonicalize = () => {
  error.value = ''
  changes.value = []
  seoTips.value = []
  bulkResults.value = []

  if (!inputText.value.trim()) {
    error.value = '请输入 URL'
    return
  }

  try {
    const originalUrl = inputText.value.trim()
    result.value.original = originalUrl

    let url = new URL(originalUrl)
    const appliedChanges = []

    // 1. 强制 HTTPS
    if (options.value.forceHTTPS && url.protocol !== 'https:') {
      url.protocol = 'https:'
      appliedChanges.push('已将协议改为 HTTPS')
    }

    // 2. 移除 WWW
    if (options.value.removeWWW && url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.replace(/^www\./, '')
      appliedChanges.push('已移除 WWW 前缀')
    }

    // 3. 移除 UTM 参数
    if (options.value.removeUTM) {
      const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
      let removedCount = 0
      utmParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param)
          removedCount++
        }
      })
      if (removedCount > 0) {
        appliedChanges.push(`已移除 ${removedCount} 个 UTM 参数`)
      }
    }

    // 4. 移除其他跟踪参数
    if (options.value.removeOtherTracking) {
      let removedCount = 0
      trackingParams.forEach(param => {
        if (url.searchParams.has(param) && !param.startsWith('utm_')) {
          url.searchParams.delete(param)
          removedCount++
        }
      })
      if (removedCount > 0) {
        appliedChanges.push(`已移除 ${removedCount} 个跟踪参数`)
      }
    }

    // 5. 移除片段
    if (options.value.removeFragment && url.hash) {
      url.hash = ''
      appliedChanges.push('已移除片段标识符 (#)')
    }

    // 6. 移除尾部斜杠
    let originalPath = url.pathname
    if (options.value.removeTrailingSlash && url.pathname.endsWith('/') && url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/$/, '')
      appliedChanges.push('已移除尾部斜杠')
    }

    // 7. 转换为小写
    if (options.value.lowercase) {
      const originalHostname = url.hostname
      url.hostname = url.hostname.toLowerCase()
      if (originalHostname !== url.hostname) {
        appliedChanges.push('已转换为小写')
      }
      // 路径也可以转换为小写（可选）
      // url.pathname = url.pathname.toLowerCase()
    }

    // 8. 参数排序
    if (options.value.sortParams && url.search.length > 0) {
      const params = new URLSearchParams(url.search)
      const sortedParams = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]))
      url.search = ''
      sortedParams.forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
      appliedChanges.push('已按字母排序参数')
    }

    result.value.canonical = url.toString()
    changes.value = appliedChanges

    // URL 组成部分
    urlParts.value = {
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search || '',
      hash: url.hash || ''
    }

    // SEO 建议
    generateSeoTips(url)

  } catch (e) {
    error.value = '无效的 URL: ' + e.message
  }
}

const generateSeoTips = (url) => {
  const tips = []

  // 检查是否使用 HTTPS
  if (url.protocol === 'https:') {
    tips.push('✓ 已使用 HTTPS，有利于 SEO 和安全')
  } else {
    tips.push('建议使用 HTTPS')
  }

  // 检查 URL 长度
  const urlLength = url.toString().length
  if (urlLength < 100) {
    tips.push('✓ URL 长度适中')
  } else {
    tips.push('URL 较长，建议简化')
  }

  // 检查是否包含关键词（简化检查）
  if (url.pathname.split('-').length > 2) {
    tips.push('✓ 路径使用了分隔符，有利于 SEO')
  }

  // 检查参数数量
  if (url.searchParams.toString().split('&').length > 3) {
    tips.push('参数较多，考虑使用路由重写简化 URL')
  } else {
    tips.push('✓ 参数数量适中')
  }

  seoTips.value = tips
}

const bulkCanonicalize = () => {
  if (!bulkInput.value.trim()) {
    error.value = '请输入要批量处理的 URL'
    return
  }

  const urls = bulkInput.value.split('\n').filter(u => u.trim())
  bulkResults.value = []

  urls.forEach(urlStr => {
    try {
      const url = new URL(urlStr.trim())
      const original = url.toString()

      // 应用相同的标准化逻辑
      if (options.value.forceHTTPS) url.protocol = 'https:'
      if (options.value.removeWWW) url.hostname = url.hostname.replace(/^www\./, '')
      if (options.value.removeUTM) {
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(p => url.searchParams.delete(p))
      }
      if (options.value.removeOtherTracking) {
        trackingParams.forEach(p => { if (!p.startsWith('utm_')) url.searchParams.delete(p) })
      }
      if (options.value.removeFragment) url.hash = ''
      if (options.value.removeTrailingSlash && url.pathname.endsWith('/') && url.pathname !== '/') {
        url.pathname = url.pathname.replace(/\/$/, '')
      }
      if (options.value.lowercase) url.hostname = url.hostname.toLowerCase()

      bulkResults.value.push({
        original: original,
        canonical: url.toString()
      })
    } catch (e) {
      bulkResults.value.push({
        original: urlStr,
        canonical: `错误: ${e.message}`
      })
    }
  })
}

const clearInput = () => {
  inputText.value = ''
  result.value = { canonical: '', original: '' }
  urlParts.value = null
  changes.value = []
  seoTips.value = []
  error.value = ''
}

const loadExample = () => {
  inputText.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
}

const copyResult = async () => {
  await copyText(result.value.canonical)
}

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

const copyBulkResults = async () => {
  const allResults = bulkResults.value.map(r => r.canonical).join('\n')
  try {
    await navigator.clipboard.writeText(allResults)
    copiedBulk.value = true
    setTimeout(() => copiedBulk.value = false, 2000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = allResults
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copiedBulk.value = true
    setTimeout(() => copiedBulk.value = false, 2000)
  }
}

// SEO
useSeoMeta({
  title: 'URL标准化工具 - 在线URL规范化处理',
  description: '免费在线URL标准化工具，支持移除UTM跟踪参数、移除其他跟踪参数、统一协议、移除WWW、处理尾部斜杠，生成规范URL，提升SEO效果。',
  keywords: [
    'url标准化',
    'url规范化',
    'url优化',
    'utm参数移除',
    'canonical url',
    'url清理',
    'seo url',
    '跟踪参数',
    'url处理',
    '在线工具'
  ],
  ogTitle: 'URL标准化工具 - 在线URL规范化处理',
  ogDescription: '移除跟踪参数、标准化URL格式，生成规范URL，提升SEO效果',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('URL标准化工具')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'URL标准化工具',
        description: '在线URL标准化工具，支持移除跟踪参数、统一协议、规范化URL格式',
        url: 'https://www.util.cn/tools/url-canonicalizer',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          '移除UTM跟踪参数',
          '移除其他跟踪参数',
          '强制使用HTTPS',
          '移除WWW前缀',
          '移除尾部斜杠',
          '转换为小写',
          '参数排序',
          '批量处理'
        ]
      })
    }
  ]
})
</script>
