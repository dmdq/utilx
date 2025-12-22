<template>
  <div class="max-w-8xl mx-auto">
    <!-- 面包屑导航 -->
    <!-- <Breadcrumb :category="category" /> -->

    <!-- 工具标题 -->
    <div class="mt-4 mb-8">
      <h1 class="text-3xl font-bold mb-3">Lorem Ipsum 生成器</h1>
      <p class="text-muted-foreground max-w-3xl">一个简单实用的Lorem Ipsum文本生成器，可以自定义段落数量、每段单词数，并支持Markdown格式输出。</p>
    </div>

    <!-- 主要功能区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 输入区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">生成设置</label>
          <div class="flex items-center gap-2">
            <button
              @click="clearSettings"
              class="px-3 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              重置
            </button>
          </div>
        </div>
        <div class="space-y-4 p-4 bg-card border rounded-lg">
          <div>
            <label class="text-sm font-medium mb-2 block">段落数</label>
            <input
              v-model.number="numParagraphs"
              type="number"
              min="1"
              max="10"
              placeholder="请输入段落数 (1-10)"
              class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">每段单词数</label>
            <input
              v-model.number="wordsPerParagraph"
              type="number"
              min="10"
              max="200"
              placeholder="请输入每段单词数 (10-200)"
              class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label class="text-sm font-medium mb-2 block">输出格式</label>
            <select
              v-model="outputFormat"
              class="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="plainText">纯文本</option>
              <option value="html">HTML</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="text-lg font-semibold">生成结果</label>
          <div class="flex items-center gap-2">
            <button
              @click="copyToClipboard(generatedText)"
              :disabled="!generatedText"
              class="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {{ copyButtonText }}
            </button>
            <button
              @click="downloadText"
              :disabled="!generatedText"
              class="px-3 py-1 text-sm bg-secondary/10 text-secondary-foreground rounded-md hover:bg-secondary/20 transition-colors disabled:opacity-50"
            >
              下载
            </button>
          </div>
        </div>
        <div class="w-full h-64 p-4 border border-border rounded-lg bg-muted/50 overflow-y-auto">
          <div v-if="generatedText" v-html="renderedOutput"></div>
          <div v-else class="text-muted-foreground">Lorem Ipsum文本将显示在这里...</div>
        </div>
        <div class="text-sm text-muted-foreground">
          字符数：{{ generatedText.length }}
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-center mb-8">
      <button
        @click="generateLoremIpsum"
        class="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg"
      >
        生成 Lorem Ipsum
      </button>
    </div>

    <!-- 关于 Lorem Ipsum -->
    <div class="border border-border rounded-lg p-6 mb-8">
      <h3 class="text-lg font-semibold mb-4">关于 Lorem Ipsum</h3>
      <p class="text-muted-foreground">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      <p class="text-muted-foreground mt-4">
        Lorem ipsum（拉丁文意为“痛苦”）是印刷和排版行业标准占位符文本。当需要显示文本的视觉外观，而不关心内容的实际意义时，它被广泛使用。
      </p>
    </div>

    <!-- 相关工具 -->
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">相关工具</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ToolCard
          v-for="tool in relatedTools"
          :key="tool.id"
          :tool="tool"
          :title="tool.name"
          :description="tool.description"
          :category="tool.category"
          :usage-count="formatViewCount(tool.viewCount)"
          :icon="tool.icon"
          @select="handleToolSelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { categories } from '~/data/categories'
import { tools } from '~/data/tools'
import { addRecentTool } from '~/composables/useTools'
import Breadcrumb from '~/components/Breadcrumb.vue'
import ToolCard from '~/components/ToolCard.vue'

// import { marked } from 'marked' // 原始导入

// 动态导入 marked
const parseMarkdown = async (text) => {
  const { marked } = await import('marked')
  return marked.parse(text)
}

definePageMeta({
  layout: 'default'
})

const category = categories.find(c => c.id === 'text')

// 响应式数据
const numParagraphs = ref(3)
const wordsPerParagraph = ref(100)
const outputFormat = ref('plainText') // plainText, html, markdown
const generatedText = ref('')
const renderedOutput = ref('')
const fileInput = ref(null)
const copyButtonText = ref('复制')

// 相关工具
const relatedTools = computed(() => {
  return tools.filter(tool =>
    tool.category === 'text' &&
    tool.id !== 'lorem-ipsum'
  ).slice(0, 4)
})

// 格式化浏览量
const formatViewCount = (count) => {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}w+`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`
  }
  return `${count}`
}

// 生成 Lorem Ipsum 文本
const generateLoremIpsum = async () => {
  try {
    let result = ''
    for (let i = 0; i < numParagraphs.value; i++) {
      let paragraph = ''
      for (let j = 0; j < wordsPerParagraph.value; j++) {
        // 简单的单词生成逻辑，用于演示
        const wordLength = Math.floor(Math.random() * 10) + 3 // 3-12个字母
        const randomWord = Math.random().toString(36).substring(2, 2 + wordLength)
        paragraph += (paragraph ? ' ' : '') + randomWord
      }
      result += (i > 0 ? '\n\n' : '') + paragraph
    }

    // 应用输出格式
    if (outputFormat.value === 'html') {
      // 使用 marked 转换为 HTML
      renderedOutput.value = await parseMarkdown(result)
      generatedText.value = renderedOutput.value // 实际输出仍是 HTML 字符串
    } else if (outputFormat.value === 'markdown') {
      // 添加 Markdown 格式（例如段落换行）
      generatedText.value = result.replace(/\n\n/g, '\n\n')
      renderedOutput.value = generatedText.value // Markdown 格式直接显示
    } else {
      generatedText.value = result
      renderedOutput.value = result // 纯文本直接显示
    }
  } catch (error) {
    console.error('Lorem Ipsum 生成失败:', error)
    generatedText.value = '生成失败，请检查输入或联系管理员'
    renderedOutput.value = generatedText.value
  }
}

// 清空设置
const clearSettings = () => {
  numParagraphs.value = 3
  wordsPerParagraph.value = 100
  outputFormat.value = 'plainText'
  generatedText.value = ''
  renderedOutput.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    copyButtonText.value = '已复制'
    setTimeout(() => {
      copyButtonText.value = '复制'
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 下载文本
const downloadText = () => {
  if (!generatedText.value) return

  const content = generatedText.value
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lorem-ipsum-${Date.now()}.${outputFormat.value === 'plainText' ? 'txt' : outputFormat.value}`
  a.click()
  URL.revokeObjectURL(url)
}

// 工具选择处理
const handleToolSelect = (tool) => {
  const toolUrl = `/tools/${tool.id}/`
  navigateTo(toolUrl)
  addRecentTool(tool.id)
}

// 添加到最近使用
addRecentTool('lorem-ipsum')

// SEO配置
useSeoMeta({
  title: 'Lorem Ipsum 生成器 - 快速生成占位文本',
  description: '一个简单的Lorem Ipsum文本生成器，可自定义段落数和单词数，并支持HTML和Markdown格式输出。',
  keywords: ['lorem ipsum', '占位符文本', '文本生成', '段落生成', 'markdown', 'html']
})
</script>
