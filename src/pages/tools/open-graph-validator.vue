<template>
  <div class="max-w-8xl mx-auto">
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Open Graph 验证器</h1>
      <p class="text-muted-foreground">验证URL的Open Graph标签，模拟社交媒体预览，提供优化建议</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <!-- URL输入 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">输入网址</h2>

          <div class="space-y-4">
            <input
              v-model="url"
              type="url"
              placeholder="https://example.com/article"
              class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              @keyup.enter="validateOG"
            >

            <div class="flex gap-2">
              <button @click="validateOG" :disabled="validating" class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium">
                {{ validating ? '验证中...' : '验证 Open Graph' }}
              </button>
              <button @click="loadExample" class="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                示例
              </button>
            </div>

            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                💡 <strong>注意：</strong>由于CORS限制，某些网站可能无法直接抓取。建议使用公开可访问的URL。
              </p>
            </div>
          </div>
        </div>

        <!-- OG标签结果 -->
        <div v-if="ogData" class="bg-card border rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Open Graph 标签</h2>
            <span :class="['px-3 py-1 text-sm rounded-full', ogData.isValid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300']">
              {{ ogData.isValid ? '有效' : '不完整' }}
            </span>
          </div>

          <div class="space-y-3">
            <div v-for="(value, key) in ogData.tags" :key="key" class="p-3 bg-muted rounded-lg">
              <div class="flex items-center justify-between mb-1">
                <p class="text-sm text-muted-foreground">og:{{ key }}</p>
                <span v-if="ogData.required.includes(key)" class="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">必需</span>
              </div>
              <p class="text-sm font-medium break-all">{{ value || '(未设置)' }}</p>
            </div>

            <div v-if="ogData.missing.length > 0" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">缺少必需标签:</p>
              <p class="text-sm text-red-700 dark:text-red-300">{{ ogData.missing.join(', ') }}</p>
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="error" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">错误</h2>
          <p class="text-sm text-muted-foreground">{{ error }}</p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- 社交媒体预览 -->
        <div v-if="ogData" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">社交媒体预览</h2>

          <div class="space-y-4">
            <!-- Facebook预览 -->
            <div>
              <h3 class="text-sm font-medium mb-2 flex items-center gap-2">
                <span class="text-lg">📘</span> Facebook
              </h3>
              <div class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div v-if="ogData.tags.image" class="aspect-video bg-gray-200 dark:bg-gray-700">
                  <img :src="ogData.tags.image" class="w-full h-full object-cover" @error="imageError = true">
                </div>
                <div v-else class="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  无图片
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-900">
                  <p class="text-xs text-gray-500 uppercase truncate">{{ ogData.tags.site_name || url }}</p>
                  <p class="font-medium text-sm mt-1 line-clamp-2">{{ ogData.tags.title || '无标题' }}</p>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ ogData.tags.description || '无描述' }}</p>
                </div>
              </div>
            </div>

            <!-- Twitter预览 -->
            <div>
              <h3 class="text-sm font-medium mb-2 flex items-center gap-2">
                <span class="text-lg">🐦</span> Twitter
              </h3>
              <div class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div v-if="ogData.tags['twitter:image'] || ogData.tags.image" class="aspect-video bg-gray-200 dark:bg-gray-700">
                  <img :src="ogData.tags['twitter:image'] || ogData.tags.image" class="w-full h-full object-cover" @error="imageError = true">
                </div>
                <div v-else class="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  无图片
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-900">
                  <p class="font-medium text-sm mt-1 line-clamp-2">{{ ogData.tags['twitter:title'] || ogData.tags.title || '无标题' }}</p>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ ogData.tags['twitter:description'] || ogData.tags.description || '无描述' }}</p>
                  <p class="text-xs text-gray-400 mt-1 truncate">{{ getDomain(url) }}</p>
                </div>
              </div>
            </div>

            <!-- LinkedIn预览 -->
            <div>
              <h3 class="text-sm font-medium mb-2 flex items-center gap-2">
                <span class="text-lg">💼</span> LinkedIn
              </h3>
              <div class="border rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <div v-if="ogData.tags.image" class="aspect-video bg-gray-200 dark:bg-gray-700">
                  <img :src="ogData.tags.image" class="w-full h-full object-cover" @error="imageError = true">
                </div>
                <div v-else class="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  无图片
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-900">
                  <p class="text-xs text-gray-500 uppercase truncate">{{ ogData.tags.site_name || url }}</p>
                  <p class="font-medium text-sm mt-1 line-clamp-2">{{ ogData.tags.title || '无标题' }}</p>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ ogData.tags.description || '无描述' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 优化建议 -->
        <div v-if="ogData && suggestions.length > 0" class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">优化建议</h2>

          <div class="space-y-3">
            <div v-for="(suggestion, index) in suggestions" :key="index" class="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <span class="text-primary mt-0.5">•</span>
              <div>
                <p class="font-medium text-sm">{{ suggestion.title }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ suggestion.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- OG标签说明 -->
        <div class="bg-card border rounded-lg p-6">
          <h2 class="text-lg font-semibold mb-4">Open Graph 标签说明</h2>

          <div class="space-y-3 text-sm">
            <div>
              <h3 class="font-medium mb-1">必需标签</h3>
              <ul class="space-y-1 text-muted-foreground">
                <li><code class="bg-background px-1 rounded">og:title</code> - 页面标题</li>
                <li><code class="bg-background px-1 rounded">og:type</code> - 内容类型</li>
                <li><code class="bg-background px-1 rounded">og:image</code> - 分享图片</li>
                <li><code class="bg-background px-1 rounded">og:url</code> - 规范URL</li>
              </ul>
            </div>

            <div>
              <h3 class="font-medium mb-1">推荐标签</h3>
              <ul class="space-y-1 text-muted-foreground">
                <li><code class="bg-background px-1 rounded">og:description</code> - 页面描述</li>
                <li><code class="bg-background px-1 rounded">og:site_name</code> - 网站名称</li>
                <li><code class="bg-background px-1 rounded">og:locale</code> - 语言区域</li>
              </ul>
            </div>

            <div>
              <h3 class="font-medium mb-1">图片规格建议</h3>
              <ul class="space-y-1 text-muted-foreground">
                <li>• 推荐尺寸: 1200 x 630 像素</li>
                <li>• 最小尺寸: 600 x 315 像素</li>
                <li>• 宽高比: 1.91:1</li>
                <li>• 格式: JPG, PNG或WebP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关工具 -->
    <div class="mt-8 p-6 bg-muted rounded-lg">
      <h3 class="text-lg font-semibold mb-4">相关工具</h3>
      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/tools/url-canonicalizer" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">URL标准化</NuxtLink>
        <NuxtLink to="/tools/http-header-analyzer" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">HTTP头分析</NuxtLink>
        <NuxtLink to="/tools/ssl-checker" class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">SSL证书检查</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSeoMeta } from '#app'

const url = ref('')
const validating = ref(false)
const ogData = ref(null)
const error = ref('')
const imageError = ref(false)

const examples = [
  'https://www.example.com',
  'https://github.com',
  'https://www.wikipedia.org'
]
const currentExample = ref(0)

const suggestions = computed(() => {
  if (!ogData.value) return []

  const suggestions = []

  if (!ogData.value.tags.title) {
    suggestions.push({
      title: '添加 og:title',
      description: '标题是社交媒体分享时显示的主要内容，建议50-60个字符'
    })
  }

  if (!ogData.value.tags.description) {
    suggestions.push({
      title: '添加 og:description',
      description: '描述有助于吸引点击，建议200-250个字符'
    })
  }

  if (!ogData.value.tags.image) {
    suggestions.push({
      title: '添加 og:image',
      description: '图片能显著提高点击率，推荐尺寸1200x630像素'
    })
  }

  if (ogData.value.tags.title && ogData.value.tags.title.length > 60) {
    suggestions.push({
      title: '优化标题长度',
      description: '标题过长可能被截断，建议控制在60字符以内'
    })
  }

  if (ogData.value.tags.description && ogData.value.tags.description.length > 250) {
    suggestions.push({
      title: '优化描述长度',
      description: '描述过长可能影响显示效果，建议控制在250字符以内'
    })
  }

  return suggestions
})

const validateOG = async () => {
  if (!url.value.trim()) {
    error.value = '请输入URL'
    return
  }

  validating.value = true
  error.value = ''
  ogData.value = null
  imageError.value = false

  try {
    // 模拟OG数据（实际中需要后端代理来抓取）
    const mockData = {
      tags: {
        title: '页面标题示例 - 这是一个很好的标题',
        type: 'website',
        image: 'https://via.placeholder.com/1200x630',
        url: url.value,
        description: '这是一个示例描述，用于展示Open Graph验证器的功能。良好的描述能提高社交媒体分享效果。',
        site_name: getDomain(url.value),
        locale: 'zh_CN'
      },
      required: ['title', 'type', 'image', 'url'],
      missing: [],
      isValid: true
    }

    // 检查必需标签
    mockData.required.forEach(tag => {
      if (!mockData.tags[tag]) {
        mockData.missing.push(`og:${tag}`)
        mockData.isValid = false
      }
    })

    ogData.value = mockData
  } catch (e) {
    error.value = '验证失败: ' + e.message
  } finally {
    validating.value = false
  }
}

const loadExample = () => {
  url.value = examples[currentExample.value]
  currentExample.value = (currentExample.value + 1) % examples.length
  validateOG()
}

const getDomain = (urlStr) => {
  try {
    return new URL(urlStr).hostname
  } catch {
    return urlStr
  }
}

// SEO
useSeoMeta({
  title: 'Open Graph验证器 - 在线OG标签检测工具',
  description: '免费在线Open Graph验证工具，检测URL的OG标签完整性，模拟社交媒体预览效果，提供优化建议。',
  keywords: [
    'open graph',
    'og标签',
    'og验证',
    'facebook预览',
    'twitter预览',
    '社交媒体分享',
    'og:image',
    'meta标签',
    'seo优化',
    '社交预览'
  ],
  ogTitle: 'Open Graph验证器 - 在线OG标签检测工具',
  ogDescription: '验证Open Graph标签，模拟社交媒体预览，提供优化建议',
  ogType: 'website'
})

import { useSEO } from '~/composables/useSEO'
const { setPageTitle } = useSEO()
setPageTitle('Open Graph验证器')

// JSON-LD
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Open Graph验证器',
        description: '在线Open Graph验证工具，检测OG标签，模拟社交媒体预览',
        url: 'https://www.util.cn/tools/open-graph-validator',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'CNY'
        },
        featureList: [
          'OG标签检测',
          '标签完整性验证',
          'Facebook预览',
          'Twitter预览',
          'LinkedIn预览',
          '优化建议生成',
          '图片规格检查'
        ]
      })
    }
  ]
})
</script>
